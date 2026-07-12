import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { r as resolveZones } from './timezones_D2ip1t-j.mjs';
import { m as moonPhase, n as nextEquinoxOrSolstice, z as zodiacOfDate, s as sunTimes, p as planetaryHour, a as season } from './sky_MtFZoqPn.mjs';

async function getStaticPaths() {
  const blocks = await getCollection(
    "blocks",
    ({ data }) => data.clock !== void 0 && !data.draft
  );
  return blocks.map((block) => ({
    params: { id: block.data.id },
    props: { block }
  }));
}
function localMinutes(tz, at) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const parts = fmt.formatToParts(at);
    const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return hh * 60 + mm;
  } catch {
    return 0;
  }
}
function findRitual(nowMin, rituals) {
  if (!rituals || rituals.length === 0) return null;
  const parse = (s) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  for (const r of rituals) {
    const from = parse(r.from);
    const to = parse(r.to);
    if (from <= to) {
      if (nowMin >= from && nowMin < to) return r;
    } else {
      if (nowMin >= from || nowMin < to) return r;
    }
  }
  return null;
}
const GET = async ({ props }) => {
  const { block } = props;
  const clock = block.data.clock;
  if (!clock) {
    return new Response(JSON.stringify({ error: "no-clock" }), { status: 404 });
  }
  const now = /* @__PURE__ */ new Date();
  const zones = resolveZones(clock, []);
  const moon = moonPhase(now);
  const nextMarker = nextEquinoxOrSolstice(now);
  const zodiac = zodiacOfDate(now);
  const zonePayloads = zones.map((z) => {
    const s = sunTimes(now, z.lat, z.lon, now);
    const ph = planetaryHour(now, z.lat, z.lon, z.tz);
    const se = season(now, z.lat);
    const nowMin = localMinutes(z.tz, now);
    const ritual = findRitual(nowMin, z.rituals);
    return {
      label: z.label,
      tz: z.tz,
      coordinates: { lat: z.lat, lon: z.lon },
      region: z.region ?? null,
      tags: z.tags ?? [],
      facts: z.facts ?? {},
      timeFormat: z.timeFormat ?? null,
      nowLocalMinutes: nowMin,
      sun: {
        altitudeDeg: s.altitudeDeg,
        azimuthDeg: s.azimuthDeg,
        isDay: s.isDay,
        sunrise: s.sunrise.toISOString(),
        sunset: s.sunset.toISOString(),
        dayLengthMs: s.dayLengthMs
      },
      planetaryHour: ph ? { planet: ph.planet, glyph: ph.glyph, index: ph.index, phase: ph.phase } : null,
      season: {
        name: se.name,
        glyph: se.glyph,
        dayOfSeason: se.dayOfSeason,
        lengthDays: se.lengthDays
      },
      seasonal: z.seasonal ?? null,
      currentRitual: ritual ? {
        from: ritual.from,
        to: ritual.to,
        label: ritual.label,
        glyph: ritual.glyph ?? null,
        data: ritual.data ?? null
      } : null,
      rituals: z.rituals ?? [],
      landmarks: z.landmarks ?? [],
      // Pointer for agents: how to get LIVE weather for this zone.
      weatherFeed: `https://api.open-meteo.com/v1/forecast?latitude=${z.lat}&longitude=${z.lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto`
    };
  });
  const payload = {
    $schema: "https://pointcast.xyz/BLOCKS.md#clock",
    id: block.data.id,
    title: block.data.title,
    url: `https://pointcast.xyz/clock/${block.data.id}`,
    blockUrl: `https://pointcast.xyz/b/${block.data.id}`,
    renderedAt: now.toISOString(),
    globalSky: {
      moon: {
        name: moon.name,
        illumination: moon.illumination,
        glyph: moon.glyph
      },
      zodiac: {
        name: zodiac.name,
        glyph: zodiac.glyph,
        dayInSign: zodiac.dayInSign
      },
      next: {
        label: nextMarker.label,
        daysUntil: nextMarker.daysUntil
      }
    },
    zones: zonePayloads,
    audioProfiles: zones.map((z) => z.label.toLowerCase().split(",")[0].trim().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")).filter((slug) => ["el-segundo", "medway", "nyc", "london", "mallorca", "istanbul", "tokyo", "mexico-city"].includes(slug)),
    notes: {
      astronomy: "Sun / moon / planetary hour / season are computed from (lat, lon, now) — no APIs.",
      weather: "Live weather is NOT baked in. Use zone.weatherFeed (Open-Meteo, no key required) for real-time.",
      cache: "Static build — re-rendered at publish time. renderedAt reflects deploy, not request."
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  getStaticPaths
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
