/* World Weather Wire core: pure functions, no DOM. Tested under node (tools/test-node.mjs). */
export const WX = (() => {
  "use strict";
  const DEVNET = "https://pointcast-devnet.mhoydich.workers.dev";
  const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";
  const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
  const FORMAT_VERSION = "1";
  /* Devnet limits as read from GET /status on 2026-10-05; refreshed live by the page. */
  const DEFAULT_LIMITS = {
    posts_per_bot_per_day: 10, posts_per_day: 200, new_bots_per_day: 50,
    title_max_chars: 120, title_max_bytes: 200, keyless_body_max_bytes: 2048, body_max_bytes: 8192
  };
  /* Our own ceiling for a wx body: well under 2 KiB, leaving room for the closing line the devnet appends. */
  const BODY_BUDGET_BYTES = 1200;
  const FRESH_MS = 6 * 3600e3;      // dot is "fresh" for 6 h after obs
  const SHOW_MS = 48 * 3600e3;      // older readings are not shown
  const FUTURE_SLACK_MS = 15 * 60e3;  // obs may be at most 15 min after the block time
  const MAX_POST_LAG_MS = 3 * 3600e3; // obs must be at most 3 h before the block time

  const HOME = { id: "el-segundo", city: "El Segundo", country: "United States", admin: "California", cc: "US", lat: 33.92, lon: -118.42 };
  const AROUND = [
    { id: "tokyo", city: "Tokyo", country: "Japan", cc: "JP", lat: 35.68, lon: 139.69 },
    { id: "sydney", city: "Sydney", country: "Australia", cc: "AU", lat: -33.87, lon: 151.21 },
    { id: "singapore", city: "Singapore", country: "Singapore", cc: "SG", lat: 1.35, lon: 103.82 },
    { id: "mumbai", city: "Mumbai", country: "India", cc: "IN", lat: 19.08, lon: 72.88 },
    { id: "nairobi", city: "Nairobi", country: "Kenya", cc: "KE", lat: -1.29, lon: 36.82 },
    { id: "cairo", city: "Cairo", country: "Egypt", cc: "EG", lat: 30.04, lon: 31.24 },
    { id: "london", city: "London", country: "United Kingdom", cc: "GB", lat: 51.51, lon: -0.13 },
    { id: "reykjavik", city: "Reykjavík", country: "Iceland", cc: "IS", lat: 64.15, lon: -21.94 },
    { id: "sao-paulo", city: "São Paulo", country: "Brazil", cc: "BR", lat: -23.55, lon: -46.63 },
    { id: "mexico-city", city: "Mexico City", country: "Mexico", cc: "MX", lat: 19.43, lon: -99.13 },
    { id: "new-york", city: "New York", country: "United States", admin: "New York", cc: "US", lat: 40.71, lon: -74.01 },
    { id: "honolulu", city: "Honolulu", country: "United States", admin: "Hawaii", cc: "US", lat: 21.31, lon: -157.86 }
  ];

  /* WMO weather code -> [sky word, plain phrase]. */
  const WMO = {
    0: ["clear", "Clear sky"], 1: ["mostly-clear", "Mostly clear"], 2: ["partly-cloudy", "Partly cloudy"], 3: ["overcast", "Overcast"],
    45: ["fog", "Fog"], 48: ["fog", "Freezing fog"],
    51: ["drizzle", "Light drizzle"], 53: ["drizzle", "Drizzle"], 55: ["drizzle", "Heavy drizzle"],
    56: ["freezing-drizzle", "Freezing drizzle"], 57: ["freezing-drizzle", "Freezing drizzle"],
    61: ["rain", "Light rain"], 63: ["rain", "Rain"], 65: ["rain", "Heavy rain"],
    66: ["freezing-rain", "Freezing rain"], 67: ["freezing-rain", "Freezing rain"],
    71: ["snow", "Light snow"], 73: ["snow", "Snow"], 75: ["snow", "Heavy snow"], 77: ["snow", "Snow grains"],
    80: ["showers", "Light showers"], 81: ["showers", "Showers"], 82: ["showers", "Heavy showers"],
    85: ["snow-showers", "Snow showers"], 86: ["snow-showers", "Heavy snow showers"],
    95: ["thunderstorm", "Thunderstorms"], 96: ["thunderstorm", "Thunderstorms with hail"], 99: ["thunderstorm", "Thunderstorms with hail"]
  };
  /* The allowed sky words and how the board says them. */
  const SKY_WORDS = {
    "clear": "Clear sky", "mostly-clear": "Mostly clear", "partly-cloudy": "Partly cloudy", "overcast": "Overcast",
    "fog": "Fog", "haze": "Haze", "smoke": "Smoke", "dust": "Dust",
    "drizzle": "Drizzle", "freezing-drizzle": "Freezing drizzle", "rain": "Rain", "freezing-rain": "Freezing rain",
    "showers": "Showers", "snow": "Snow", "snow-showers": "Snow showers", "thunderstorm": "Thunderstorms"
  };
  const COMPASS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];

  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const str = (v) => (typeof v === "string" ? v : "");
  const round1 = (n) => Math.round(n * 10) / 10;
  const cToF = (c) => c * 9 / 5 + 32;
  const utf8Bytes = (s) => new TextEncoder().encode(String(s)).length;
  const charCount = (s) => Array.from(String(s)).length;
  const tidy = (s) => String(s).replace(/[\u202f\u00a0]/g, " ");

  function compass(deg) {
    if (num(deg) == null) return "";
    return COMPASS[((Math.round(deg / 45) % 8) + 8) % 8];
  }
  function skyFromCode(code) {
    const hit = WMO[code];
    return hit ? { sky: hit[0], phrase: hit[1] } : null;
  }
  function validTz(tz) {
    if (typeof tz !== "string" || !/^[A-Za-z_]+(\/[A-Za-z0-9_+\-]+){0,2}$|^UTC$/.test(tz)) return false;
    try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch (e) { return false; }
  }
  function localClock(ms, tz) {
    try { return tidy(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(ms))); }
    catch (e) { return ""; }
  }
  function localDay(ms, tz) {
    try { return tidy(new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(new Date(ms))); }
    catch (e) { return ""; }
  }
  function ptStamp(ms, nowMs) {
    const now = nowMs == null ? Date.now() : nowMs;
    const sameDay = localDay(ms, "America/Los_Angeles") === localDay(now, "America/Los_Angeles");
    const clock = localClock(ms, "America/Los_Angeles");
    return (sameDay ? clock : localDay(ms, "America/Los_Angeles") + ", " + clock) + " PT";
  }
  function ago(ms, nowMs) {
    const s = Math.round(((nowMs == null ? Date.now() : nowMs) - ms) / 1000);
    if (s < 0) return "just now";
    if (s < 90) return s + " s ago";
    const m = Math.round(s / 60);
    if (m < 90) return m + " min ago";
    const h = Math.round(m / 60);
    if (h < 36) return h + " h ago";
    return Math.round(h / 24) + " d ago";
  }
  function isoMinuteZ(ms) { return new Date(ms).toISOString().slice(0, 16) + "Z"; }
  function region(lat, lon) {
    if (lon < -25) return "Americas & Pacific";
    if (lon <= 60) return "Europe, Africa & Middle East";
    return "Asia & Oceania";
  }

  /* ---- the wx: tag ---- */
  function encodeTagValue(s) {
    return String(s).trim().replace(/%/g, "%25").replace(/_/g, "%5F").replace(/=/g, "%3D").replace(/\s+/g, "_");
  }
  function decodeTagValue(s) {
    return String(s).split("_").map((part) => {
      try { return decodeURIComponent(part); } catch (e) { return part; }
    }).join(" ");
  }
  const TEXT_KEYS = new Set(["city", "place"]);
  function findTagLine(text) {
    if (typeof text !== "string") return null;
    const m = text.match(/^[ \t]*wx:[ \t]*(.*)$/m);
    return m ? m[1].trim() : null;
  }
  function parseTag(line) {
    const fields = Object.create(null);
    const errors = [];
    for (const tok of String(line).split(/\s+/).filter(Boolean).slice(0, 40)) {
      const eq = tok.indexOf("=");
      if (eq <= 0) { errors.push("not key=value: " + tok.slice(0, 24)); continue; }
      const k = tok.slice(0, eq).toLowerCase();
      if (!/^[a-z][a-z0-9_]{0,15}$/.test(k)) { errors.push("bad key: " + k.slice(0, 16)); continue; }
      if (k in fields) continue; // first value wins
      const raw = tok.slice(eq + 1);
      /* Only free-text fields use the _ = space and %XX escapes; codes like tz=America/Los_Angeles stay literal. */
      fields[k] = TEXT_KEYS.has(k) ? decodeTagValue(raw) : raw;
    }
    return { fields, errors };
  }
  function strictNum(v, lo, hi) {
    if (typeof v !== "string" || !/^-?\d{1,4}(\.\d{1,4})?$/.test(v)) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
  }
  function parseObs(v) {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/.test(v)) return null;
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? ms : null;
  }
  /* Validate parsed fields. postedMs is the block timestamp (ms). Returns {ok, report, errors}. */
  function validate(fields, postedMs) {
    const errors = [];
    const r = {};
    if (fields.v !== FORMAT_VERSION) errors.push("v must be " + FORMAT_VERSION);
    const city = str(fields.city).trim();
    if (!city || charCount(city) > 48 || /[\u0000-\u001f<>]/.test(city)) errors.push("city missing or invalid"); else r.city = city;
    r.lat = strictNum(fields.lat, -90, 90); if (r.lat == null) errors.push("lat missing or out of range");
    r.lon = strictNum(fields.lon, -180, 180); if (r.lon == null) errors.push("lon missing or out of range");
    r.tempC = strictNum(fields.temp_c, -90, 60); if (r.tempC == null) errors.push("temp_c missing or out of range");
    r.sky = str(fields.sky).toLowerCase(); if (!Object.hasOwn(SKY_WORDS, r.sky)) errors.push("sky not in the word list");
    r.obsMs = parseObs(fields.obs); if (r.obsMs == null) errors.push("obs must be UTC like 2026-10-05T19:00Z");
    r.tz = str(fields.tz); if (!validTz(r.tz)) errors.push("tz must be an IANA zone like Asia/Tokyo");
    r.src = str(fields.src).toLowerCase(); if (!/^[a-z0-9][a-z0-9.\-]{1,31}$/.test(r.src)) errors.push("src missing");
    if (r.obsMs != null && num(postedMs) != null) {
      if (r.obsMs > postedMs + FUTURE_SLACK_MS) errors.push("obs is after the post time");
      if (postedMs - r.obsMs > MAX_POST_LAG_MS) errors.push("obs is more than 3 h before the post");
    }
    /* optional */
    r.cc = /^[A-Za-z]{2}$/.test(str(fields.cc)) ? fields.cc.toUpperCase() : null;
    r.code = fields.code != null && /^\d{1,2}$/.test(fields.code) ? Number(fields.code) : null;
    r.feelsC = strictNum(fields.feels_c, -100, 70);
    r.windKmh = strictNum(fields.wind_kmh, 0, 400);
    r.windDeg = strictNum(fields.wind_deg, 0, 360);
    r.rh = strictNum(fields.rh, 0, 100);
    r.isDay = fields.day === "1" ? 1 : fields.day === "0" ? 0 : null;
    return { ok: errors.length === 0, report: r, errors };
  }

  /* Walk feed blocks; return valid wx reports and the wx-tagged posts that failed. */
  function extractReports(blocks) {
    const reports = [];
    const skipped = [];
    const seen = new Set();
    let posts = 0;
    for (const b of Array.isArray(blocks) ? blocks : []) {
      if (!b || !Array.isArray(b.txs)) continue;
      for (const t of b.txs) {
        if (!t || t.kind !== "publish_block") continue;
        if (t.hash && seen.has(t.hash)) continue;
        if (t.hash) seen.add(t.hash);
        posts++;
        const p = t.payload || {};
        const line = findTagLine(p.body);
        if (line == null) continue;
        const parsed = parseTag(line);
        const postedMs = num(b.timestamp);
        const v = validate(parsed.fields, postedMs);
        const base = {
          bot: str(t.bot) || null, sender: str(t.sender), title: str(p.title), channel: str(p.channel),
          height: num(b.height), hash: str(t.hash), postedMs
        };
        if (v.ok) reports.push(Object.assign({}, v.report, base, { region: region(v.report.lat, v.report.lon) }));
        else skipped.push(Object.assign(base, { errors: v.errors.concat(parsed.errors) }));
      }
    }
    reports.sort((a, b) => b.obsMs - a.obsMs || b.postedMs - a.postedMs);
    return { reports, skipped, posts };
  }
  function cityKey(r) { return r.city.toLowerCase() + "|" + Math.round(r.lat) + "|" + Math.round(r.lon); }
  /* Newest reading per city; older ones are counted. Drops readings older than SHOW_MS. */
  function latestByCity(reports, nowMs) {
    const now = nowMs == null ? Date.now() : nowMs;
    const by = new Map();
    for (const r of reports) {
      if (now - r.obsMs > SHOW_MS) continue;
      const k = cityKey(r);
      const cur = by.get(k);
      if (!cur) { by.set(k, Object.assign({}, r, { earlier: 0, fresh: now - r.obsMs <= FRESH_MS })); continue; }
      cur.earlier++;
    }
    return Array.from(by.values());
  }

  /* ---- network ---- */
  async function getJson(url, fetchImpl, timeoutMs) {
    const f = fetchImpl || fetch;
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs || 12000) : null;
    try {
      const res = await f(String(url), { cache: "no-store", signal: ctrl ? ctrl.signal : undefined });
      if (!res.ok) throw new Error("HTTP " + res.status + " from " + String(url).split("?")[0]);
      return await res.json();
    } finally { if (timer) clearTimeout(timer); }
  }
  async function fetchStatus(fetchImpl) {
    const s = await getJson(DEVNET + "/status", fetchImpl);
    return { height: num(s.height), chainId: str(s.chain_id), writes: str(s.writes), limits: Object.assign({}, DEFAULT_LIMITS, s.limits || {}), raw: s };
  }
  /* Page back through /feed (blocks with txs only) until sinceMs or maxPages. */
  async function fetchFeed(opts) {
    const o = opts || {};
    const maxPages = o.maxPages || 4;
    const blocks = [];
    let tip = null, before = null;
    for (let page = 0; page < maxPages; page++) {
      const u = new URL(DEVNET + "/feed");
      u.searchParams.set("limit", "50");
      if (before) u.searchParams.set("before", String(before));
      const d = await getJson(u, o.fetchImpl);
      if (tip == null) tip = num(d.tip);
      const bs = Array.isArray(d.blocks) ? d.blocks : [];
      blocks.push(...bs);
      if (!bs.length) break;
      const oldest = bs[bs.length - 1];
      if (o.sinceMs && num(oldest.timestamp) != null && oldest.timestamp < o.sinceMs) break;
      const nb = num(d.next_before);
      if (!nb || nb <= 1 || (before && nb >= before)) break;
      before = nb;
    }
    return { tip, blocks };
  }
  function currentUrl(places) {
    const u = new URL(OPEN_METEO);
    u.searchParams.set("latitude", places.map((p) => p.lat).join(","));
    u.searchParams.set("longitude", places.map((p) => p.lon).join(","));
    u.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day");
    u.searchParams.set("timezone", "auto");
    u.searchParams.set("timeformat", "unixtime");
    return u.toString();
  }
  function parseCurrent(d, place) {
    if (!d || !d.current || !d.current_units) throw new Error("Open-Meteo returned no current block" + (d && d.reason ? ": " + String(d.reason).slice(0, 120) : ""));
    if (d.current_units.temperature_2m !== "°C") throw new Error("Open-Meteo did not confirm °C");
    const c = d.current;
    const tempC = num(c.temperature_2m);
    const t = num(c.time);
    if (tempC == null || t == null) throw new Error("Open-Meteo returned no temperature or time");
    const code = num(c.weather_code);
    const sk = skyFromCode(code);
    const windOk = d.current_units.wind_speed_10m === "km/h";
    return {
      place, tempC, code, sky: sk ? sk.sky : null, phrase: sk ? sk.phrase : null,
      feelsC: d.current_units.apparent_temperature === "°C" ? num(c.apparent_temperature) : null,
      rh: num(c.relative_humidity_2m),
      windKmh: windOk ? num(c.wind_speed_10m) : null,
      windDeg: windOk ? num(c.wind_direction_10m) : null,
      isDay: c.is_day === 0 || c.is_day === 1 ? c.is_day : null,
      obsMs: t * 1000,
      tz: validTz(d.timezone) ? d.timezone : "UTC",
      offsetSec: num(d.utc_offset_seconds)
    };
  }
  /* One request for many places. Returns readings in the same order. */
  async function fetchCurrent(places, fetchImpl) {
    if (!places.length) return [];
    const d = await getJson(currentUrl(places), fetchImpl);
    const arr = Array.isArray(d) ? d : [d];
    if (arr.length !== places.length) throw new Error("Open-Meteo returned " + arr.length + " places for " + places.length);
    return arr.map((x, i) => parseCurrent(x, places[i]));
  }
  async function geocode(name, fetchImpl) {
    const u = new URL(GEOCODE);
    u.searchParams.set("name", String(name).slice(0, 80));
    u.searchParams.set("count", "5");
    u.searchParams.set("language", "en");
    u.searchParams.set("format", "json");
    const d = await getJson(u, fetchImpl);
    return (Array.isArray(d.results) ? d.results : []).filter((x) => num(x.latitude) != null && num(x.longitude) != null && x.name).map((x) => ({
      id: "geo-" + x.id, city: String(x.name), country: str(x.country), admin: str(x.admin1), cc: str(x.country_code).toUpperCase(),
      lat: round2(x.latitude), lon: round2(x.longitude)
    }));
  }
  function round2(n) { return Math.round(n * 100) / 100; }

  /* ---- the report a bot would post ---- */
  function buildReport(place, reading, bot, limitsIn) {
    const limits = Object.assign({}, DEFAULT_LIMITS, limitsIn || {});
    const tz = reading.tz;
    const clock = localClock(reading.obsMs, tz);
    const day = localDay(reading.obsMs, tz);
    const t = Math.round(reading.tempC);
    const f = Math.round(cToF(reading.tempC));
    const phrase = reading.phrase || "Sky not reported";
    const title = phrase + " over " + place.city + " at " + clock + " local; " + t + "°C (" + f + "°F).";
    const area = place.cc === "US" && place.admin && place.admin !== place.city ? place.admin : place.country;
    const where = place.city + (area && area !== place.city ? ", " + area : "");
    let line1 = phrase + " over " + where + " at " + clock + " local time on " + day + ". " + t + "°C (" + f + "°F)";
    if (reading.feelsC != null && Math.abs(reading.feelsC - reading.tempC) >= 2) line1 += ", feels like " + Math.round(reading.feelsC) + "°C";
    line1 += ".";
    if (reading.windKmh != null) {
      const w = Math.round(reading.windKmh);
      line1 += w < 2 ? " Wind calm." : " Wind " + w + " km/h from the " + compass(reading.windDeg) + ".";
    }
    if (reading.rh != null) line1 += " Humidity " + Math.round(reading.rh) + "%.";
    const line2 = "I'm a bot posting one reading for World Weather Wire. Source: Open-Meteo (open-meteo.com) current conditions for " +
      isoMinuteZ(reading.obsMs).slice(11, 16) + " UTC. Nothing here is forecast or guessed.";
    const kv = [
      ["v", FORMAT_VERSION], ["city", encodeTagValue(place.city)]
    ];
    if (place.cc) kv.push(["cc", place.cc]);
    kv.push(["lat", place.lat.toFixed(2)], ["lon", place.lon.toFixed(2)], ["temp_c", round1(reading.tempC).toFixed(1)]);
    if (reading.sky) kv.push(["sky", reading.sky]);
    if (reading.code != null) kv.push(["code", String(reading.code)]);
    if (reading.feelsC != null) kv.push(["feels_c", round1(reading.feelsC).toFixed(1)]);
    if (reading.windKmh != null) kv.push(["wind_kmh", String(Math.round(reading.windKmh))]);
    if (reading.windDeg != null) kv.push(["wind_deg", String(Math.round(reading.windDeg))]);
    if (reading.rh != null) kv.push(["rh", String(Math.round(reading.rh))]);
    if (reading.isDay != null) kv.push(["day", String(reading.isDay)]);
    kv.push(["obs", isoMinuteZ(reading.obsMs)], ["tz", tz], ["src", "open-meteo"]);
    const tag = "wx: " + kv.map((p) => p[0] + "=" + p[1]).join(" ");
    const body = line1 + "\n\n" + line2 + "\n\n" + tag;
    const botName = String(bot || "").trim();
    const checks = {
      titleChars: charCount(title), titleBytes: utf8Bytes(title), bodyBytes: utf8Bytes(body),
      titleCharsMax: limits.title_max_chars, titleBytesMax: limits.title_max_bytes || 200,
      bodyBudget: BODY_BUDGET_BYTES, bodyMax: limits.keyless_body_max_bytes,
      botOk: /^[a-z0-9-]{2,24}$/.test(botName)
    };
    checks.ok = checks.titleChars <= checks.titleCharsMax && checks.titleBytes <= checks.titleBytesMax &&
      checks.bodyBytes <= Math.min(checks.bodyBudget, checks.bodyMax) && checks.botOk && !!reading.sky;
    return { title, body, tag, args: { bot: botName, channel: "BOT", title, body }, checks };
  }

  return {
    DEVNET, OPEN_METEO, FORMAT_VERSION, DEFAULT_LIMITS, BODY_BUDGET_BYTES, FRESH_MS, SHOW_MS,
    HOME, AROUND, WMO, SKY_WORDS,
    num, cToF, utf8Bytes, charCount, compass, skyFromCode, validTz, localClock, localDay, ptStamp, ago, isoMinuteZ, region,
    encodeTagValue, decodeTagValue, findTagLine, parseTag, validate, extractReports, latestByCity,
    getJson, fetchStatus, fetchFeed, currentUrl, parseCurrent, fetchCurrent, geocode, buildReport
  };
})();
