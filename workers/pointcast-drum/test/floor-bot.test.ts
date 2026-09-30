import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { diffMarkets, runFloorBot, FLOOR_STATE_KEY, type FloorState } from "../src/floor-bot";

const market = (id: string, yes: number, question = `Market ${id}?`) => ({
  id, question, outcomes: '["Yes", "No"]', outcomePrices: JSON.stringify([String(yes), String(1 - yes)]),
});

describe("floor bot diff", () => {
  it("records a baseline without moves on the first look", () => {
    const { prices, moves } = diffMarkets([market("1", 0.4)], null, 1000);
    expect(prices).toEqual({ "1": 0.4 });
    expect(moves).toEqual([]);
  });

  it("drums on moves of five points or more, one beat per five points", () => {
    const prev: FloorState = { checkedAt: 0, prices: { "1": 0.4, "2": 0.5, "3": 0.9 }, moves: [] };
    const { moves } = diffMarkets([market("1", 0.46), market("2", 0.52), market("3", 0.3)], prev, 2000);
    expect(moves.map((m) => [m.id, m.direction, m.beats])).toEqual([["1", "up", 1], ["3", "down", 12]]);
  });

  it("skips malformed markets", () => {
    const { prices } = diffMarkets([{ id: "x" }, { id: "9", outcomePrices: "nope" }], null, 0);
    expect(prices).toEqual({});
  });
});

describe("floor bot run", () => {
  it("hits the drum for a move and keeps state in KV", async () => {
    await env.VISITS.put(FLOOR_STATE_KEY, JSON.stringify({ checkedAt: 0, prices: { "77": 0.2 }, moves: [] }));
    const fakeFetch = (async () => new Response(JSON.stringify([market("77", 0.35, "Will it rain?")]))) as typeof fetch;
    const state = await runFloorBot(env, fakeFetch, 5000);
    expect(state.moves[0]).toMatchObject({ id: "77", direction: "up", beats: 3, question: "Will it rain?" });
    const saved = await env.VISITS.get<FloorState>(FLOOR_STATE_KEY, "json");
    expect(saved?.prices["77"]).toBe(0.35);
    const counter = env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName("global"));
    const floor = (await (await counter.fetch("https://drum-counter.internal/?floor=1")).json()) as { places: Array<{ place: string; total: number }> };
    expect(floor.places).toContainEqual(expect.objectContaining({ place: "pm:77:up", total: 3 }));
    const signal = (await (await counter.fetch("https://drum-counter.internal/?signal=1")).json()) as { places: Array<{ place: string }> };
    expect(signal.places.some((p) => p.place.startsWith("pm:"))).toBe(false);
    await env.VISITS.delete(FLOOR_STATE_KEY);
  });
});
