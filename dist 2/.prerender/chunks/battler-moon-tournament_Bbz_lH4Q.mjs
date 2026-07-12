import { F as FOUNDING_GANGS } from './battler-bowl-state_CHLF-ptq.mjs';

const NEW_MOON_EPOCH_MS = Date.UTC(2e3, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_MS = 29.530588853 * 864e5;
const FULL_MOON_OFFSET_MS = 14.76529 * 864e5;
function nextFullMoon(now = /* @__PURE__ */ new Date()) {
  const elapsed = now.getTime() - NEW_MOON_EPOCH_MS;
  const cyclesSinceRef = Math.floor(elapsed / SYNODIC_MONTH_MS);
  let candidate = NEW_MOON_EPOCH_MS + cyclesSinceRef * SYNODIC_MONTH_MS + FULL_MOON_OFFSET_MS;
  while (candidate + 6 * 36e5 < now.getTime()) {
    candidate += SYNODIC_MONTH_MS;
  }
  return new Date(candidate);
}
function hoursToNextFullMoon(now = /* @__PURE__ */ new Date()) {
  return (nextFullMoon(now).getTime() - now.getTime()) / 36e5;
}
const MOON_NAMES_BY_MONTH = [
  "Wolf Moon",
  // 0  Jan
  "Snow Moon",
  // 1  Feb
  "Worm Moon",
  // 2  Mar
  "Pink Moon",
  // 3  Apr
  "Flower Moon",
  // 4  May
  "Strawberry Moon",
  // 5  Jun
  "Buck Moon",
  // 6  Jul
  "Sturgeon Moon",
  // 7  Aug
  "Harvest Moon",
  // 8  Sep — name shifts to closest-to-equinox in some years; the page treats this as a heuristic
  "Hunter's Moon",
  // 9  Oct
  "Beaver Moon",
  // 10 Nov
  "Cold Moon"
  // 11 Dec
];
function namedMoonForDate(d) {
  const pt = new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "America/Los_Angeles" }).format(d);
  const monthIdx = Number(pt) - 1;
  return MOON_NAMES_BY_MONTH[monthIdx] ?? "Full Moon";
}
function moonSeeds() {
  const sorted = [...FOUNDING_GANGS].sort((a, b) => {
    const aCount = a.championships.length;
    const bCount = b.championships.length;
    if (aCount !== bCount) return bCount - aCount;
    if (aCount > 0 && bCount > 0) {
      const aLast = lastTitleNumber(a);
      const bLast = lastTitleNumber(b);
      if (aLast !== bLast) return bLast - aLast;
    }
    if (a.defending !== b.defending) return a.defending ? -1 : 1;
    return a.short.localeCompare(b.short);
  });
  return sorted.map((g, i) => ({
    seed: i + 1,
    short: g.short,
    name: g.name,
    color: g.color,
    noun: g.noun,
    championships: g.championships,
    defending: g.defending ?? false,
    rationale: rationaleFor(g)
  }));
}
function lastTitleNumber(g) {
  if (g.championships.length === 0) return 0;
  const last = g.championships[g.championships.length - 1];
  return Number(last.replace(/\D/g, "")) || 0;
}
function rationaleFor(g) {
  const titles = g.championships.length;
  if (titles === 0) return "No title yet — seeded by deterministic short-code order.";
  const list = g.championships.join(", ");
  if (g.defending) return `${list} · defending. Seeded for title count, then most-recent year, then defending tiebreaker.`;
  return `${list}. Seeded by title count, then most-recent year.`;
}
function bracketMatches() {
  return [
    { code: "QF1", round: "QF", feedsInto: "SF1", top: { kind: "seed", seed: 1 }, bottom: { kind: "seed", seed: 8 }, result: "pending" },
    { code: "QF4", round: "QF", feedsInto: "SF1", top: { kind: "seed", seed: 4 }, bottom: { kind: "seed", seed: 5 }, result: "pending" },
    { code: "QF3", round: "QF", feedsInto: "SF2", top: { kind: "seed", seed: 3 }, bottom: { kind: "seed", seed: 6 }, result: "pending" },
    { code: "QF2", round: "QF", feedsInto: "SF2", top: { kind: "seed", seed: 2 }, bottom: { kind: "seed", seed: 7 }, result: "pending" },
    { code: "SF1", round: "SF", feedsInto: "F", top: { kind: "winner", from: "QF1" }, bottom: { kind: "winner", from: "QF4" }, result: "pending" },
    { code: "SF2", round: "SF", feedsInto: "F", top: { kind: "winner", from: "QF3" }, bottom: { kind: "winner", from: "QF2" }, result: "pending" },
    { code: "F", round: "F", top: { kind: "winner", from: "SF1" }, bottom: { kind: "winner", from: "SF2" }, result: "pending" }
  ];
}
const LUNAR_TIDE_FIELD = {
  code: "LT",
  title: "Lunar Tide",
  effect: "Every match runs under a slow tide pulse — momentum oscillates with the moon. Ranged volleys land harder near peak; close-quarter brawls land harder during the pull. Healers who time their mints to the down-pull double their effective output. The field gives the night its texture; no other boss field appears."
};
function moonTournamentSnapshot(now = /* @__PURE__ */ new Date()) {
  const fm = nextFullMoon(now);
  const hoursAway = (fm.getTime() - now.getTime()) / 36e5;
  const namedMoon = namedMoonForDate(fm);
  return {
    season: "S06",
    upcoming: {
      name: `${namedMoon} Cup`,
      namedMoon,
      fullMoonIso: fm.toISOString(),
      hoursAway: Math.round(hoursAway * 10) / 10,
      daysAway: Math.round(hoursAway / 24 * 10) / 10
    },
    format: {
      nights: 1,
      teams: 8,
      style: "single-elimination",
      field: LUNAR_TIDE_FIELD
    },
    seeds: moonSeeds(),
    bracket: bracketMatches()
  };
}

export { LUNAR_TIDE_FIELD as L, namedMoonForDate as a, bracketMatches as b, moonTournamentSnapshot as c, hoursToNextFullMoon as h, moonSeeds as m, nextFullMoon as n };
