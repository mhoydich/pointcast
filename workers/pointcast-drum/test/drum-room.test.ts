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
  features?: string[];
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

  has(predicate: (message: ServerMessage) => boolean): boolean {
    return this.messages.some(predicate);
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

  it("accepts the bounded 36-voice Drum Club extension", () => {
    const pads = [
      "kick", "snare", "clap", "hat-closed", "hat-open", "tom-low", "tom-high", "rim", "shaker", "tambourine",
      "bass-c", "bass-d", "bass-e", "bass-f", "bass-g", "bass-a", "bass-b", "bass-c2", "bass-d2", "bass-e2",
      "mallet-c", "mallet-d", "mallet-e", "mallet-f", "mallet-g", "mallet-a", "mallet-b", "mallet-c2", "mallet-d2",
      "chord-c", "chord-dm", "chord-em", "chord-f", "chord-g", "chord-am", "sparkle",
    ];
    expect(pads).toHaveLength(36);
    for (const pad of pads) {
      expect(decodeClientMessage(JSON.stringify({ v: 1, type: "hit", pad, velocity: 0.5, seq: 1 }))).toMatchObject({ pad });
    }
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

  it("fans a 36-voice Drum Club hit only inside its namespaced room", async () => {
    const first = await connect("ndc-sunshine", "club-first");
    const second = await connect("ndc-sunshine", "club-second");
    const welcome = await first.waitFor((message) => message.type === "welcome");
    expect(welcome.features).toContain("ndc-36");
    await second.waitFor((message) => message.type === "welcome");

    first.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "chord-am", velocity: 0.8, seq: 36 }));
    await expect(second.waitFor((message) => message.type === "hit" && message.pad === "chord-am"))
      .resolves.toMatchObject({ pad: "chord-am", velocity: 0.8, seq: 36 });

    first.socket.close(1000, "done");
    second.socket.close(1000, "done");
  });

  it("rejects a Drum Club-only pad from a legacy room", async () => {
    const first = await connect("legacy-pad-test", "legacy-first");
    const second = await connect("legacy-pad-test", "legacy-second");
    await first.waitFor((message) => message.type === "welcome");
    await second.waitFor((message) => message.type === "welcome");

    first.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "hat-open", velocity: 0.8, seq: 1 }));
    await expect(first.waitFor((message) => message.type === "error")).resolves.toMatchObject({ code: "invalid-pad" });
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(second.has((message) => message.type === "hit" && message.pad === "hat-open")).toBe(false);

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

  it("keeps fresh DO totals authoritative and never lowers a newer KV mirror", async () => {
    await env.VISITS.put("drum:total", "0");
    const stub = env.DRUM_COUNTER.getByName("fresh-counter-test");
    const post = (delta: number) => stub.fetch("https://pointcast.test/?session=fedcba9876543210", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, leaderboardHash: "fedcba98", nounId: 44 }),
    });

    expect(await (await post(1)).json()).toMatchObject({ ok: true, globalTotal: 1, yourTotal: 1 });
    expect(await env.VISITS.get("drum:total")).toBe("0");

    // Simulate another flushing isolate having already mirrored a later count.
    await env.VISITS.put("drum:total", "999");
    await env.VISITS.put("drum:top", JSON.stringify([{ hash: "legacy00", nounId: 7, count: 400 }]));
    expect(await (await post(49)).json()).toMatchObject({ ok: true, globalTotal: 50, yourTotal: 50 });
    expect(await env.VISITS.get("drum:total")).toBe("999");

    const top = await (await stub.fetch("https://pointcast.test/?top=1")).json<{ entries: Array<{ hash: string; nounId: number; count: number; rank: number }> }>();
    expect(top.entries).toEqual([
      { rank: 1, hash: "legacy00", nounId: 7, count: 400 },
      { rank: 2, hash: "fedcba98", nounId: 44, count: 50 },
    ]);
  });
});
