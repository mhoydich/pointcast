/**
 * /api/greeting — a warm, varied one-liner for each arriving visitor.
 *
 * Reads Cloudflare's free `request.cf` geo (city, region, country, lat/lon,
 * timezone) + Open-Meteo for their coords. Composes a two-line greeting
 * that tries hard NOT to feel the same each visit — template selection
 * is randomized per request, sublines pool from available signals.
 *
 * Override: if the client passes `?city=<name>` (e.g. saved to localStorage
 * by a user who wanted to correct Cloudflare's ISP-node city — Mike's
 * IP lands as Hawthorne instead of El Segundo), we honor that as the
 * displayed location. Still use CF lat/lon for weather so the climate
 * readout stays geographically real.
 *
 * Principles:
 *   • Specific, not generic — "Hello, Tucson · 94° · 22° hotter than home"
 *     beats "Welcome to PointCast!"
 *   • Varied — refresh shows a different phrasing, not groundhog-day text
 *   • Surprising, not creepy — city-level only, never IP/device
 *   • Kind — midnight visit = "up late · or is it early?", rain = "take
 *     the umbrella", never "you're up too late"
 *
 * GET /api/greeting → { greeting, subline, city, region, country, tempF,
 *                       conditions, localTime, km, diff, picked }
 *
 * `Cache-Control: private, max-age=60` — short because we WANT refresh
 *                                        to show variety, not stale copy.
 */

import { type Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// El Segundo reference for temp/km deltas.
const HOME = { lat: 33.9192, lon: -118.4165, city: 'El Segundo' };

// SoCal cities that Cloudflare occasionally routes El-Segundo-area traffic
// through. When CF geo-pins a visitor to one of these, we label them as
// "the South Bay" rather than a generic single city. Mike's own IP lands
// here via Hawthorne — having South Bay as a label keeps it warm + local
// without overclaiming "El Segundo".
const SOUTH_BAY = new Set([
  'El Segundo', 'Hawthorne', 'Manhattan Beach', 'Redondo Beach',
  'Hermosa Beach', 'Torrance', 'Lawndale', 'Gardena', 'Inglewood',
  'Playa Del Rey', 'Playa del Rey',
]);

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

function kmBetween(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function codeToBrief(code: number): string {
  if (code === 0) return 'clear';
  if (code <= 2) return 'mostly clear';
  if (code <= 3) return 'overcast';
  if (code >= 45 && code <= 48) return 'foggy';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'murky';
}

async function fetchCurrent(lat: number, lon: number): Promise<any | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,uv_index,is_day&temperature_unit=fahrenheit` +
      `&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
    const r = await fetch(url, { cf: { cacheTtl: 300 } as any });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// Pick a random element (weighted or uniform) — used everywhere below.
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Greeting templates by context -----------------------------------

const GREETINGS_HOME = [
  'Welcome back home.',
  'Home again.',
  'Back in the South Bay.',
  'Evening, El Segundo.',
  'Home signal received.',
];

const GREETINGS_SOUTH_BAY = [
  'Hello, South Bay neighbor.',
  'Near home.',
  'Down the street, basically.',
  'South Bay check-in.',
];

const GREETINGS_CA = [
  (city: string) => `Hello, ${city}.`,
  (city: string) => `${city} on the wire.`,
  (city: string) => `California hello from ${city}.`,
  (city: string) => `${city}, welcome in.`,
];

const GREETINGS_US = [
  (loc: string) => `Welcome from ${loc}.`,
  (loc: string) => `${loc} just tuned in.`,
  (loc: string) => `Hello from ${loc}.`,
  (loc: string) => `${loc} — glad you landed.`,
];

const GREETINGS_INTL = [
  (loc: string) => `Welcome from ${loc}.`,
  (loc: string) => `Across the ocean — ${loc}.`,
  (loc: string) => `${loc} — glad you made it.`,
  (loc: string) => `Hi from ${loc}.`,
];

const GREETINGS_UNKNOWN = [
  'Welcome.',
  'Glad you\'re here.',
  'Step in.',
  'You found us.',
];

// Time-of-day prefixes — occasionally prepend instead of using a pure
// template. Keeps greetings fresh when a visitor refreshes at 6am vs 10pm.
function timeFlavor(localHour: number | null): string | null {
  if (localHour === null) return null;
  if (Math.random() < 0.5) return null; // only apply half the time
  if (localHour >= 5 && localHour < 11) return 'Good morning';
  if (localHour >= 11 && localHour < 14) return 'Midday hello';
  if (localHour >= 14 && localHour < 18) return 'Afternoon';
  if (localHour >= 18 && localHour < 22) return 'Evening';
  return null; // late night we let subline do the talking
}

// Day-of-week flavor — occasional Friday/Monday/etc. line used as subline
// instead of weather data if it fires.
function dowFlavor(): string | null {
  const dow = new Date().getDay(); // 0=Sunday
  const roll = Math.random();
  if (roll > 0.35) return null; // only ~35% of requests
  const lines: Record<number, string[]> = {
    0: ['sunday morning', 'slow sunday', 'weekend mode'],
    1: ['fresh monday', 'monday drummer', 'start of the week'],
    2: ['tuesday rolling', 'tuesday check-in'],
    3: ['midweek hello', 'wednesday drift'],
    4: ['thursday already', 'almost friday'],
    5: ['friday energy', 'happy friday', 'weekend looming'],
    6: ['saturday vibes', 'weekend wide open'],
  };
  return pick(lines[dow]);
}

// Moon phase — a surprising/poetic detail. Approx via astronomical formula;
// accurate within a day, plenty for "the moon is {X}" flavor.
function moonPhase(): { name: string; emoji: string; rareLine: string } | null {
  const synodic = 29.53058867;
  const known = Date.UTC(2000, 0, 6, 18, 14, 0); // known new moon UTC
  const phase = ((Date.now() - known) / 86400000) % synodic / synodic;
  if (phase < 0.03 || phase > 0.97) return { name: 'new moon', emoji: '🌑', rareLine: 'new moon tonight' };
  if (phase < 0.22) return { name: 'waxing crescent', emoji: '🌒', rareLine: 'crescent moon coming' };
  if (phase < 0.28) return { name: 'first quarter', emoji: '🌓', rareLine: 'half moon up' };
  if (phase < 0.47) return { name: 'waxing gibbous', emoji: '🌔', rareLine: 'bright moon' };
  if (phase < 0.53) return { name: 'full moon',       emoji: '🌕', rareLine: 'full moon tonight' };
  if (phase < 0.72) return { name: 'waning gibbous',  emoji: '🌖', rareLine: 'moon is receding' };
  if (phase < 0.78) return { name: 'last quarter',    emoji: '🌗', rareLine: 'waning half moon' };
  return { name: 'waning crescent', emoji: '🌘', rareLine: 'old moon' };
}

// Build a pool of subline candidates from all available signals. Then we
// pick 2 at random from the pool so different requests see different combos.
function buildSublinePool(ctx: {
  tempF: number | null;
  conditions: string | null;
  uvIndex: number | null;
  diff: number | null;
  localTime: string | null;
  localHour: number | null;
  km: number | null;
  isHome: boolean;
  isDay: boolean | null;
  sunset?: string | null;
  sunrise?: string | null;
}): string[] {
  const pool: string[] = [];
  const { tempF, conditions, uvIndex, diff, localTime, localHour, km, isHome, sunset, sunrise, isDay } = ctx;

  if (tempF !== null) {
    pool.push(conditions ? `${tempF}°, ${conditions}` : `${tempF}°`);
    // Alternative phrasings for temp so subline variety compounds.
    if (Math.random() < 0.3) pool.push(`${tempF}° on the readout`);
  }
  if (diff !== null && Math.abs(diff) >= 5 && !isHome) {
    pool.push(diff > 0
      ? `${diff}° warmer than el segundo`
      : `${Math.abs(diff)}° cooler than el segundo`);
  }
  if (uvIndex !== null && uvIndex >= 7) {
    pool.push(`uv ${uvIndex} · sunscreen weather`);
  }
  if (conditions === 'rain' || conditions === 'showers' || conditions === 'drizzle') {
    pool.push(pick(['take the umbrella if you go out', 'rain hitting', 'grey day']));
  }
  if (conditions === 'snow') {
    pool.push(pick(['snow is good company', 'snow day energy']));
  }
  if (conditions === 'thunderstorm') {
    pool.push('stay inside · sky is arguing');
  }
  if (conditions === 'foggy') {
    pool.push(pick(['marine layer hanging', 'fog is thick']));
  }
  if (localHour !== null) {
    if (localHour >= 0 && localHour < 5) pool.push(pick(['up late · or is it early?', 'deep night where you are', 'the good quiet hours']));
    else if (localHour >= 22) pool.push('late in the evening where you are');
    else if (localTime) pool.push(`${localTime} local`);
  } else if (localTime) {
    pool.push(`${localTime} local`);
  }
  if (km !== null && km >= 500 && !isHome) {
    pool.push(`${km.toLocaleString()} km from el segundo`);
    if (km >= 10000 && Math.random() < 0.5) pool.push('serious distance');
  }
  // Sunset/sunrise — moment-aware flavor. Only fires near the edges.
  try {
    if (sunset && isDay) {
      const s = new Date(sunset).getTime();
      const diffMin = (s - Date.now()) / 60000;
      if (diffMin > 0 && diffMin < 60) pool.push(`sunset in ${Math.round(diffMin)} min`);
    }
    if (sunrise && !isDay) {
      const s = new Date(sunrise).getTime();
      const diffMin = (s - Date.now()) / 60000;
      if (diffMin > 0 && diffMin < 60) pool.push(`sunrise in ${Math.round(diffMin)} min`);
    }
  } catch { /* ignore parse */ }

  // Day-of-week flavor
  const dow = dowFlavor();
  if (dow) pool.push(dow);

  // Moon — rare, poetic
  if (Math.random() < 0.15) {
    const m = moonPhase();
    if (m) pool.push(m.rareLine);
  }

  // Fallback if empty
  if (pool.length === 0) pool.push('glad you\'re here');

  // Deduplicate while preserving order.
  const seen = new Set<string>();
  return pool.filter((b) => { if (seen.has(b)) return false; seen.add(b); return true; });
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const cf = (request as any).cf ?? {};
  const cfCity = typeof cf.city === 'string' ? cf.city : '';
  const region = typeof cf.region === 'string' ? cf.region : '';
  const country = typeof cf.country === 'string' ? cf.country : '';
  const timezone = typeof cf.timezone === 'string' ? cf.timezone : '';
  const lat = typeof cf.latitude === 'string' ? parseFloat(cf.latitude)
            : typeof cf.latitude === 'number' ? cf.latitude : NaN;
  const lon = typeof cf.longitude === 'string' ? parseFloat(cf.longitude)
            : typeof cf.longitude === 'number' ? cf.longitude : NaN;

  // Client-side location override — ?city=El+Segundo. Respected for
  // display, but weather still uses CF-geolocated lat/lon so the
  // climate readout is real.
  const url = new URL(request.url);
  const cityOverride = (url.searchParams.get('city') ?? '').slice(0, 48).trim();
  const city = cityOverride || cfCity;

  const [theirs, home] = await Promise.all([
    Number.isFinite(lat) && Number.isFinite(lon) ? fetchCurrent(lat, lon) : Promise.resolve(null),
    fetchCurrent(HOME.lat, HOME.lon),
  ]);

  const theirTempRaw = theirs?.current?.temperature_2m;
  const tempF = typeof theirTempRaw === 'number' ? Math.round(theirTempRaw) : null;
  const conditions = typeof theirs?.current?.weather_code === 'number'
    ? codeToBrief(theirs.current.weather_code)
    : null;
  const uvIndex = typeof theirs?.current?.uv_index === 'number'
    ? Math.round(theirs.current.uv_index)
    : null;
  const isDay = typeof theirs?.current?.is_day === 'number'
    ? theirs.current.is_day === 1 : null;
  const sunset = theirs?.daily?.sunset?.[0] ?? null;
  const sunrise = theirs?.daily?.sunrise?.[0] ?? null;

  const esTempRaw = home?.current?.temperature_2m;
  const esTempF = typeof esTempRaw === 'number' ? Math.round(esTempRaw) : null;

  let diff: number | null = null;
  if (tempF !== null && esTempF !== null) diff = tempF - esTempF;

  let km: number | null = null;
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    km = Math.round(kmBetween({ lat, lon }, HOME));
    if (km < 5) km = null;
  }

  let localTime = '';
  let localHour: number | null = null;
  try {
    if (timezone) {
      const d = new Date();
      localTime = d.toLocaleTimeString('en-US', {
        timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true,
      }).toLowerCase();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone, hour: 'numeric', hour12: false,
      }).formatToParts(d);
      const hourPart = parts.find((p) => p.type === 'hour');
      if (hourPart) localHour = parseInt(hourPart.value, 10);
    }
  } catch { /* ignore */ }

  // --- Greeting selection -------------------------------------------

  const isHome = city === HOME.city;
  const isSouthBay = country === 'US' && region === 'California' && SOUTH_BAY.has(city);
  const isCA = country === 'US' && region === 'California';

  let locShort = '';
  if (city && region && country === 'US') locShort = `${city}, ${region}`;
  else if (city && country) locShort = `${city}, ${country}`;
  else if (country) locShort = country;

  let greeting: string;
  if (isHome) {
    greeting = pick(GREETINGS_HOME);
  } else if (isSouthBay) {
    greeting = pick(GREETINGS_SOUTH_BAY);
  } else if (isCA && city) {
    greeting = pick(GREETINGS_CA)(city);
  } else if (country === 'US' && locShort) {
    greeting = pick(GREETINGS_US)(locShort);
  } else if (locShort) {
    greeting = pick(GREETINGS_INTL)(locShort);
  } else {
    greeting = pick(GREETINGS_UNKNOWN);
  }

  // Optional time-of-day prefix adds variety — "Good morning, Fullerton."
  const timePrefix = timeFlavor(localHour);
  if (timePrefix && city && !greeting.toLowerCase().includes(timePrefix.toLowerCase())) {
    greeting = `${timePrefix}, ${city}.`;
  }

  // Build subline pool + pick 2.
  const pool = buildSublinePool({
    tempF, conditions, uvIndex, diff, localTime, localHour, km, isHome, isDay, sunset, sunrise,
  });
  const bits: string[] = [];
  const poolCopy = [...pool];
  while (bits.length < 2 && poolCopy.length > 0) {
    const idx = Math.floor(Math.random() * poolCopy.length);
    bits.push(poolCopy.splice(idx, 1)[0]);
  }
  let subline = bits.join(' · ');
  if (!subline) {
    subline = esTempF !== null
      ? `it's ${esTempF}° in el segundo right now`
      : 'glad you\'re here';
  }

  return json(
    {
      greeting, subline,
      city, region, country, timezone,
      cityDetected: cfCity,
      cityOverridden: cityOverride.length > 0,
      tempF, conditions, uvIndex, localTime, km, diff,
    },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
};

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
