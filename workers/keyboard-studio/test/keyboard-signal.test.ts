import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

interface Summary {
  globalTotal: number;
  pitched: number;
  unpitched: number;
  kinds: Array<{ kind: string; total: number }>;
  sources: Array<{ kind: string; app: string; total: number; hits: number }>;
  places: Array<{ place: string; total: number }>;
  pitchClasses: number[];
  octaves: Array<{ oct: number; total: number }>;
  today: { day: string; total: number; pitchClasses: number[] };
  live: Array<{ kind: string; app: string; notes: number }>;
  latestId: number;
  recent: Array<{ id: number; app: string; notes: number[]; keys: number }>;
}

function signal(name: string) {
  const ns = (env as unknown as { KEYBOARD_SIGNAL: DurableObjectNamespace }).KEYBOARD_SIGNAL;
  return ns.get(ns.idFromName(name));
}

async function post(name: string, body: unknown) {
  const res = await signal(name).fetch("https://keyboard-signal.internal/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function get<T>(name: string, query = ""): Promise<T> {
  return (await signal(name).fetch(`https://keyboard-signal.internal/${query}`)).json() as Promise<T>;
}

describe("KeyboardSignal", () => {
  it("counts pitched notes and unpitched keys by source, pitch class and octave", async () => {
    const room = `kb-${crypto.randomUUID()}`;
    const first = await post(room, { notes: [60, 64, 67, 72], source: { kind: "pointcast", app: "/keyboard/diary", place: "cc:us" } });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ ok: true, globalTotal: 4, notes: 4, keys: 0 });
    await post(room, { count: 10, source: { kind: "pointcast", app: "/keyboard" } });
    await post(room, { notes: [62, "nope", 200, 3.5], count: 1, source: { kind: "agent", app: "mcp" } });

    const s = await get<Summary>(room);
    expect(s.globalTotal).toBe(16);
    expect(s.pitched).toBe(5);
    expect(s.unpitched).toBe(11);
    expect(s.pitchClasses[0]).toBe(2);
    expect(s.pitchClasses[2]).toBe(1);
    expect(s.pitchClasses[4]).toBe(1);
    expect(s.pitchClasses[7]).toBe(1);
    expect(s.today.pitchClasses).toEqual(s.pitchClasses);
    expect(s.today.total).toBe(16);
    expect(s.octaves).toEqual([{ oct: 4, total: 4 }, { oct: 5, total: 1 }]);
    expect(s.kinds.find((k) => k.kind === "pointcast")?.total).toBe(14);
    expect(s.sources.find((x) => x.app === "/keyboard")?.total).toBe(10);
    expect(s.places).toEqual([expect.objectContaining({ place: "cc:us", total: 4 })]);
    expect(s.live.find((x) => x.app === "/keyboard/diary")?.notes).toBe(4);
    expect(s.recent[0]).toMatchObject({ app: "mcp", notes: [62], keys: 1 });
  });

  it("rejects posts with nothing to play and never stores more than 64 notes", async () => {
    const room = `kb-${crypto.randomUUID()}`;
    expect((await post(room, { notes: [], source: {} })).status).toBe(400);
    expect((await post(room, { count: 0 })).status).toBe(400);
    const big = await post(room, { notes: Array.from({ length: 100 }, () => 60), count: 999 });
    expect(big.body).toMatchObject({ notes: 64, keys: 200, globalTotal: 264 });
    const s = await get<Summary>(room);
    expect(s.sources[0]).toMatchObject({ kind: "other", app: "unknown" });
  });

  it("serves new phrases since an id, oldest first, for live listening", async () => {
    const room = `kb-${crypto.randomUUID()}`;
    const a = await post(room, { notes: [60], source: { kind: "embed", app: "a" } });
    await post(room, { notes: [62], source: { kind: "embed", app: "b" } });
    await post(room, { notes: [64], source: { kind: "embed", app: "c" } });
    const feed = await get<{ latestId: number; phrases: Array<{ app: string; notes: number[] }> }>(room, `?since=${a.body.id}`);
    expect(feed.phrases.map((p) => p.app)).toEqual(["b", "c"]);
    expect(feed.latestId).toBe((a.body.id as number) + 2);
    const none = await get<{ phrases: unknown[] }>(room, `?since=${feed.latestId}`);
    expect(none.phrases).toEqual([]);
  });

  it("ranks apps for the week with a daily cap", async () => {
    const room = `kb-${crypto.randomUUID()}`;
    await post(room, { notes: [60, 62], source: { kind: "pointcast", app: "diary" } });
    await post(room, { count: 7, source: { kind: "embed", app: "friend" } });
    const league = await get<{ standings: Array<{ app: string; points: number }> }>(room, "?league=1");
    expect(league.standings.map((r) => [r.app, r.points])).toEqual([["friend", 7], ["diary", 2]]);
  });
});
