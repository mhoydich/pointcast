import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

interface Summary {
  globalTotal: number;
  attributed: number;
  unattributed: number;
  kinds: Array<{ kind: string; total: number }>;
  sources: Array<{ kind: string; app: string; total: number; hits: number }>;
  places: Array<{ place: string; total: number }>;
  days: Array<{ day: string; kind: string; total: number }>;
  recent: Array<{ kind: string; app: string; beats: number }>;
}

function counter(name: string) {
  return env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName(name));
}

async function post(name: string, body: unknown, session = "") {
  const query = session ? `?session=${session}` : "";
  const res = await counter(name).fetch(`https://drum-counter.internal/${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function summary(name: string): Promise<Summary> {
  const res = await counter(name).fetch("https://drum-counter.internal/?signal=1");
  return res.json();
}

describe("DrumCounter signal", () => {
  it("tallies tagged beats by kind, app, place and keeps the global total", async () => {
    const room = `signal-${crypto.randomUUID()}`;
    await post(room, { delta: 3, source: { kind: "pointcast", app: "/drum", place: "cc:us" } }, "a".repeat(16));
    await post(room, { delta: 2, source: { kind: "pointcast", app: "/drum", place: "cc:us" } }, "a".repeat(16));
    const anon = await post(room, { delta: 4, source: { kind: "embed", app: "friend.site", place: "el-segundo" } });
    expect(anon.status).toBe(200);
    expect(anon.body.yourTotal).toBe(0);

    const s = await summary(room);
    expect(s.globalTotal).toBe(9);
    expect(s.attributed).toBe(9);
    expect(s.unattributed).toBe(0);
    expect(s.sources[0]).toMatchObject({ kind: "pointcast", app: "/drum", total: 5, hits: 2 });
    expect(s.kinds.find((k) => k.kind === "embed")?.total).toBe(4);
    expect(s.places.map((p) => p.place).sort()).toEqual(["cc:us", "el-segundo"]);
    expect(s.days.reduce((sum, d) => sum + d.total, 0)).toBe(9);
    expect(s.recent[0]).toMatchObject({ kind: "embed", app: "friend.site", beats: 4 });
  });

  it("counts untagged session beats globally but reports them as unattributed", async () => {
    const room = `signal-${crypto.randomUUID()}`;
    await post(room, { delta: 6 }, "b".repeat(16));
    await post(room, { delta: 1, source: { kind: "agent", app: "mcp" } }, "b".repeat(16));
    const s = await summary(room);
    expect(s.globalTotal).toBe(7);
    expect(s.attributed).toBe(1);
    expect(s.unattributed).toBe(6);
  });

  it("still rejects a beat with neither a session nor a source", async () => {
    const res = await post(`signal-${crypto.randomUUID()}`, { delta: 1 });
    expect(res.status).toBe(400);
  });

  it("normalizes unknown kinds and hostile app names", async () => {
    const room = `signal-${crypto.randomUUID()}`;
    await post(room, { delta: 1, source: { kind: "wizard", app: "<script>Hi There</script>" } });
    const s = await summary(room);
    expect(s.sources[0].kind).toBe("other");
    expect(s.sources[0].app).not.toMatch(/[<> ]/);
  });
});
