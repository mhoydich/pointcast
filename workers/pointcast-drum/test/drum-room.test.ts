import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { decodeClientMessage, normalizeRoom } from "../src/index";

interface ServerMessage {
  type?: string;
  connected?: number;
  clientId?: string;
  you?: { clientId?: string };
  pad?: string;
  totalHits?: number;
  hibernation?: boolean;
}

class SocketInbox {
  private readonly messages: ServerMessage[] = [];
  private readonly waiters = new Set<() => void>();

  constructor(readonly socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      const parsed: unknown = JSON.parse(event.data);
      if (typeof parsed !== "object" || parsed === null) return;
      this.messages.push(parsed as ServerMessage);
      for (const waiter of this.waiters) waiter();
    });
    socket.accept();
  }

  async waitFor(predicate: (message: ServerMessage) => boolean, timeoutMs = 3_000): Promise<ServerMessage> {
    const existing = this.messages.find(predicate);
    if (existing) return existing;

    return new Promise<ServerMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.waiters.delete(check);
        reject(new Error(`Timed out waiting for WebSocket message; saw ${JSON.stringify(this.messages.slice(-3))}`));
      }, timeoutMs);
      const check = () => {
        const found = this.messages.find(predicate);
        if (!found) return;
        clearTimeout(timeout);
        this.waiters.delete(check);
        resolve(found);
      };
      this.waiters.add(check);
    });
  }
}

async function connect(room: string, sid: string): Promise<SocketInbox> {
  const stub = env.DRUM_ROOM.getByName(room);
  const response = await stub.fetch(`https://pointcast.test/api/drum/room?room=${room}&sid=${sid}`, {
    headers: { Upgrade: "websocket", Origin: "https://pointcast.xyz" },
  });
  expect(response.status).toBe(101);
  if (!response.webSocket) throw new Error("Expected a WebSocket response");
  return new SocketInbox(response.webSocket);
}

describe("drum room protocol", () => {
  it("normalizes room names and rejects malformed messages", () => {
    expect(normalizeRoom("Sunset-Jam")).toBe("sunset-jam");
    expect(normalizeRoom("../../bad")).toBe("lobby");
    expect(decodeClientMessage(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 0.7, seq: 1 })))
      .toEqual({ v: 1, type: "hit", pad: "kick", velocity: 0.7, seq: 1 });
    expect(decodeClientMessage(JSON.stringify({ v: 1, type: "hit", pad: "airhorn", velocity: 1, seq: 2 }))).toBeNull();
    expect(decodeClientMessage("x".repeat(513))).toBeNull();
  });

  it("fans a bounded hit out to peers and persists stats", async () => {
    const room = "fanout-test";
    const first = await connect(room, "first");
    const second = await connect(room, "second");
    const firstWelcome = await first.waitFor((message) => message.type === "welcome");
    await second.waitFor((message) => message.type === "welcome");
    await first.waitFor((message) => message.type === "presence" && message.connected === 2);

    first.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 0.72, seq: 7, clientAt: 123 }));
    const hit = await second.waitFor((message) => message.type === "hit" && message.pad === "kick");
    expect(hit.clientId).toBe(firstWelcome.you?.clientId);

    const statsResponse = await env.DRUM_ROOM.getByName(room).fetch(`https://pointcast.test/stats?room=${room}&stats=1`);
    const stats = await statsResponse.json<ServerMessage>();
    expect(stats.totalHits).toBe(1);
    expect(stats.hibernation).toBe(true);

    first.socket.close(1000, "done");
    second.socket.close(1000, "done");
  });

  it("accepts 100 simultaneous visitors in one coordination room", async () => {
    const room = "hundred-test";
    const clients = await Promise.all(Array.from({ length: 100 }, (_, index) => connect(room, `load-${index}`)));
    const last = clients[clients.length - 1];
    if (!last) throw new Error("Expected load clients");
    const presence = await last.waitFor((message) => message.type === "presence" && message.connected === 100, 10_000);
    expect(presence.connected).toBe(100);

    const statsResponse = await env.DRUM_ROOM.getByName(room).fetch(`https://pointcast.test/stats?room=${room}&stats=1`);
    const stats = await statsResponse.json<ServerMessage>();
    expect(stats.connected).toBe(100);

    for (const client of clients) client.socket.close(1000, "load-complete");
  });
});

describe("drum counter KV mirror", () => {
  it("coalesces the legacy KV mirror until 50 taps", async () => {
    await env.VISITS.put("drum:total", "5");
    const stub = env.DRUM_COUNTER.getByName("global");
    const post = (delta: number) => stub.fetch("https://pointcast.test/?session=0123456789abcdef", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, leaderboardHash: "01234567", nounId: 22 }),
    });
    expect(await (await post(1)).json()).toMatchObject({ ok: true, globalTotal: 6, yourTotal: 1 });
    expect(await env.VISITS.get("drum:total")).toBe("5");
    expect(await (await post(49)).json()).toMatchObject({ ok: true, globalTotal: 55, yourTotal: 50 });
    expect(await env.VISITS.get("drum:total")).toBe("55");
    expect(await env.VISITS.get("drum:session:0123456789abcdef")).toBe("50");
  });
});
