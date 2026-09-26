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
    expect(s.sources[0]?.kind).toBe("other");
    expect(s.sources[0]?.app).not.toMatch(/[<> ]/);
  });
});

describe("DrumCounter live + reconcile", () => {
  it("lists drummers and anonymous sources heard in the last two minutes", async () => {
    const room = `live-${crypto.randomUUID()}`;
    await post(room, { delta: 2, leaderboardHash: "cccccccc", nounId: 42 }, "c".repeat(16));
    await post(room, { delta: 1, source: { kind: "artifact", app: "drum-hall" } });
    const res = await counter(room).fetch("https://drum-counter.internal/?live=1");
    const live = (await res.json()) as { count: number; drummers: Array<{ nounId: number }>; sources: Array<{ app: string }> };
    expect(live.count).toBe(1);
    expect(live.drummers[0]?.nounId).toBe(42);
    expect(live.sources.map((s) => s.app)).toContain("drum-hall");
  });

  it("raises a global that the per-drummer totals prove was undercounted, once", async () => {
    const room = `reconcile-${crypto.randomUUID()}`;
    // Simulate the legacy KV state: global lost increments, sessions did not.
    await env.VISITS.put("drum:total", "10");
    await env.VISITS.put("drum:top", JSON.stringify([
      { hash: "dddddddd", nounId: 1, count: 8 },
      { hash: "eeeeeeee", nounId: 2, count: 7 },
    ]));
    const res = await counter(room).fetch("https://drum-counter.internal/?signal=1");
    const s = (await res.json()) as { globalTotal: number; recovered: number };
    expect(s.globalTotal).toBe(15);
    expect(s.recovered).toBe(5);
    await env.VISITS.put("drum:top", JSON.stringify([{ hash: "dddddddd", nounId: 1, count: 999 }]));
    const again = (await (await counter(room).fetch("https://drum-counter.internal/?signal=1")).json()) as { globalTotal: number };
    expect(again.globalTotal).toBe(15);
    await env.VISITS.delete("drum:total");
    await env.VISITS.delete("drum:top");
  });
});

describe("DrumCounter league", () => {
  it("ranks apps by capped daily points for the current week", async () => {
    const room = `league-${crypto.randomUUID()}`;
    await post(room, { delta: 30, source: { kind: "embed", app: "tempo-trial" } });
    await post(room, { delta: 12, source: { kind: "embed", app: "knock-knock" } });
    await post(room, { delta: 5, source: { kind: "embed", app: "tempo-trial" } });
    const res = await counter(room).fetch("https://drum-counter.internal/?league=1");
    const league = (await res.json()) as {
      season: { id: string; dailyCap: number };
      week: { start: string; end: string; current: boolean };
      standings: Array<{ rank: number; app: string; points: number; beats: number; hits: number }>;
    };
    expect(league.season.id).toBe("S0");
    expect(league.week.current).toBe(true);
    expect(league.standings[0]).toMatchObject({ rank: 1, app: "tempo-trial", points: 35, beats: 35, hits: 2 });
    expect(league.standings[1]).toMatchObject({ rank: 2, app: "knock-knock", points: 12 });
  });

  it("returns an empty table for a week before the season", async () => {
    const room = `league-${crypto.randomUUID()}`;
    await post(room, { delta: 3, source: { kind: "embed", app: "x" } });
    const league = (await (await counter(room).fetch("https://drum-counter.internal/?league=1&week=2026-01-05")).json()) as {
      week: { number: number; start: string }; standings: unknown[];
    };
    expect(league.week.start).toBe("2026-01-05");
    expect(league.week.number).toBe(0);
    expect(league.standings).toEqual([]);
  });
});

describe("DrumCounter members", () => {
  it("credits a signed-in member across sessions and ranks them", async () => {
    const room = `member-${crypto.randomUUID()}`;
    const a = "a1".repeat(12);
    const b = "b2".repeat(12);
    await post(room, { delta: 4, userKey: a, source: { kind: "pointcast", app: "/drum" } }, "1".repeat(16));
    const second = await post(room, { delta: 3, userKey: a, source: { kind: "pointcast", app: "/auth" } }, "2".repeat(16));
    expect(second.body.memberTotal).toBe(7);
    await post(room, { delta: 10, userKey: b, source: { kind: "embed", app: "x" } });
    const me = (await (await counter(room).fetch(`https://drum-counter.internal/?user=${a}`)).json()) as { total: number; rank: number; members: number };
    expect(me).toMatchObject({ total: 7, rank: 2, members: 2 });
    const nobody = (await (await counter(room).fetch(`https://drum-counter.internal/?user=${"c3".repeat(12)}`)).json()) as { total: number; rank: null };
    expect(nobody).toMatchObject({ total: 0, rank: null });
    const bad = await counter(room).fetch("https://drum-counter.internal/?user=nope");
    expect(bad.status).toBe(400);
  });
});
