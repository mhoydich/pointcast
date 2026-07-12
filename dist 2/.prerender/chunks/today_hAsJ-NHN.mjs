const PALETTE_RANGES = [
  [0, 5, "abyss"],
  [5, 8, "daybreak"],
  [8, 11, "crystal"],
  [11, 14, "lagoon"],
  [14, 17, "kelp"],
  [17, 20, "coral"],
  [20, 22, "storm"],
  [22, 24, "nighttide"]
];
const SCENE_RANGES = [
  [0, 6, "mystify"],
  [6, 10, "waves"],
  [10, 14, "starfield"],
  [14, 18, "bounce"],
  [18, 21, "waves"],
  [21, 24, "pipes"]
];
const SOUNDSCAPES = ["drift", "chimes", "bubbles", "granular"];
function pickRange(ranges, hour) {
  for (const [from, to, id] of ranges) {
    if (hour >= from && hour < to) return id;
  }
  return ranges[0][2];
}
function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 864e5);
}
const GET = async () => {
  const now = /* @__PURE__ */ new Date();
  const hour = now.getHours();
  const dy = dayOfYear(now);
  const paletteId = pickRange(PALETTE_RANGES, hour);
  const sceneId = pickRange(SCENE_RANGES, hour);
  const soundscapeId = SOUNDSCAPES[dy % SOUNDSCAPES.length];
  const body = {
    surface: "/tide/today",
    description: "Defaults that /tide will fall back to right now for a visitor with no saved preferences and no URL hash. Palette rotates by hour. Scene rotates by hour. Soundscape rotates by day-of-year so the same day always sounds the same.",
    serverTimeIso: now.toISOString(),
    serverHourLocal: hour,
    dayOfYear: dy,
    timezone: "America/Los_Angeles",
    today: {
      palette: paletteId,
      scene: sceneId,
      soundscape: soundscapeId
    },
    derivation: {
      palette: {
        rule: "hour-of-day → /tide.json clockDefault.ranges",
        ranges: PALETTE_RANGES.map(([from, to, id]) => ({ from, to, id })),
        chosen: paletteId
      },
      scene: {
        rule: "hour-of-day → 6 buckets (mystify/waves/starfield/bounce/waves/pipes)",
        ranges: SCENE_RANGES.map(([from, to, id]) => ({ from, to, id })),
        chosen: sceneId
      },
      soundscape: {
        rule: "dayOfYear % 4 → drift/chimes/bubbles/granular",
        index: dy % SOUNDSCAPES.length,
        sequence: [...SOUNDSCAPES],
        chosen: soundscapeId
      }
    },
    open: `https://pointcast.xyz/tide#${paletteId}/${sceneId}`,
    note: "These are defaults. Returning visitors keep their last palette + scene + soundscape via localStorage. URL hash overrides everything.",
    related: {
      "/tide": "the room",
      "/tide.json": "full catalog (palettes, scenes, soundscapes)",
      "/tide/moments": "saved moments viewer"
    }
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      // 5 min — short enough that hour-of-day rotation surfaces same-hour.
      "Cache-Control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
