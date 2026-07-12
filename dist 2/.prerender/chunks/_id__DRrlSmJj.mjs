import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { g as getCollection, a as getEntry } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { C as COLLABORATORS } from './collaborators_9CJdrF6c.mjs';
import { r as resolveZones } from './timezones_D2ip1t-j.mjs';
import { s as sunTimes, p as planetaryHour, a as season, m as moonPhase, n as nextEquinoxOrSolstice, z as zodiacOfDate } from './sky_MtFZoqPn.mjs';

const SHOWERS = [
  {
    name: "Quadrantids",
    peak: { month: 1, day: 3 },
    window: { before: 1, after: 2 },
    zhr: 110,
    radiant: "Boötes",
    glyph: "✨",
    blurb: "Sharp peak, fickle — watch the morning of Jan 3."
  },
  {
    name: "Lyrids",
    peak: { month: 4, day: 22 },
    window: { before: 3, after: 3 },
    zhr: 18,
    radiant: "Lyra",
    glyph: "✨",
    blurb: "One of humanity's oldest observed showers — Chinese records, 687 BCE."
  },
  {
    name: "Eta Aquariids",
    peak: { month: 5, day: 6 },
    window: { before: 4, after: 4 },
    zhr: 50,
    radiant: "Aquarius",
    glyph: "✨",
    blurb: "Dust from Halley. Best south of the equator."
  },
  {
    name: "Perseids",
    peak: { month: 8, day: 12 },
    window: { before: 5, after: 5 },
    zhr: 100,
    radiant: "Perseus",
    glyph: "🌠",
    blurb: "The summer classic — warm nights, bright meteors."
  },
  {
    name: "Orionids",
    peak: { month: 10, day: 21 },
    window: { before: 4, after: 4 },
    zhr: 20,
    radiant: "Orion",
    glyph: "✨",
    blurb: "The other half of Halley — October leaves behind."
  },
  {
    name: "Leonids",
    peak: { month: 11, day: 17 },
    window: { before: 3, after: 3 },
    zhr: 15,
    radiant: "Leo",
    glyph: "✨",
    blurb: "Storms every 33 years. Off-year nights are quiet but persistent."
  },
  {
    name: "Geminids",
    peak: { month: 12, day: 14 },
    window: { before: 4, after: 4 },
    zhr: 120,
    radiant: "Gemini",
    glyph: "🌠",
    blurb: "The best of the year. Dense, slow, multicolored."
  },
  {
    name: "Ursids",
    peak: { month: 12, day: 22 },
    window: { before: 2, after: 2 },
    zhr: 10,
    radiant: "Ursa Minor",
    glyph: "✨",
    blurb: "Quiet solstice shower — radiant near the North Star."
  }
];
function nearestShower(now = /* @__PURE__ */ new Date()) {
  const t = now.getTime();
  const thisYear = now.getUTCFullYear();
  const candidates = [];
  for (const year of [thisYear - 1, thisYear, thisYear + 1]) {
    for (const s of SHOWERS) {
      candidates.push({
        shower: s,
        peakAt: new Date(Date.UTC(year, s.peak.month - 1, s.peak.day, 6, 0, 0))
      });
    }
  }
  candidates.sort((a, b) => {
    const da = Math.abs(a.peakAt.getTime() - t);
    const db = Math.abs(b.peakAt.getTime() - t);
    if (da !== db) return da - db;
    return a.peakAt.getTime() - b.peakAt.getTime();
  });
  const nearest = candidates[0];
  if (!nearest) return null;
  const daysUntil = Math.round((nearest.peakAt.getTime() - t) / 864e5);
  const inWindow = daysUntil >= -nearest.shower.window.after && daysUntil <= nearest.shower.window.before;
  return { shower: nearest.shower, peakAt: nearest.peakAt, daysUntil, inWindow };
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
async function getStaticPaths() {
  const blocks = await getCollection(
    "blocks",
    ({ data }) => !data.draft && data.clock !== void 0
  );
  return blocks.map((block) => ({
    params: { id: block.data.id },
    props: { block }
  }));
}
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { block } = Astro2.props;
  const data = block.data;
  const ch = CHANNELS[data.channel];
  const zones = resolveZones(data.clock, COLLABORATORS);
  const renderNow = /* @__PURE__ */ new Date();
  function formatInZone(d, tz, opts) {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: tz }).format(d);
  }
  function hhmm(d, tz) {
    if (!d) return "—";
    return formatInZone(d, tz, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  function dayLengthLabel(ms) {
    if (ms <= 0) return "polar night";
    if (ms >= 864e5 - 1e3) return "polar day";
    const totalMin = Math.round(ms / 6e4);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${String(m).padStart(2, "0")}m of daylight`;
  }
  function localMinutes(d, tz) {
    if (!d) return null;
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(d);
    const h = parts.find((p) => p.type === "hour")?.value;
    const m = parts.find((p) => p.type === "minute")?.value;
    if (h === void 0 || m === void 0) return null;
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  function skyPoint(altitudeDeg, azimuthDeg) {
    const altClamped = Math.max(0, altitudeDeg);
    const r = (90 - altClamped) / 90 * 48;
    const az = azimuthDeg * Math.PI / 180;
    const x = 50 + r * Math.sin(az);
    const y = 50 - r * Math.cos(az);
    return { x, y };
  }
  function bearing(az) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const idx = Math.round(az % 360 / 45) % 8;
    return dirs[idx];
  }
  function equatorRatio(lat) {
    return Math.min(1, Math.abs(lat) / 90);
  }
  function parseHHMM(s) {
    const m = /^(\d{2}):(\d{2})$/.exec(s);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }
  function findRitual(nowMin, rituals) {
    if (!rituals || !rituals.length) return null;
    for (const r of rituals) {
      const from = parseHHMM(r.from);
      const to = parseHHMM(r.to);
      if (from === null || to === null) continue;
      if (from <= to) {
        if (nowMin >= from && nowMin < to) return r;
      } else {
        if (nowMin >= from || nowMin < to) return r;
      }
    }
    return null;
  }
  function defaultTimeFormat(tz) {
    if (tz.startsWith("America/")) return "12";
    if (tz === "Europe/London") return "12";
    return "24";
  }
  const AUDIO_PROFILES = ["el-segundo", "medway", "nyc", "london", "mallorca", "istanbul", "tokyo", "mexico-city"];
  function audioProfileFor(label) {
    const slug = label.toLowerCase().split(",")[0].trim().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    return AUDIO_PROFILES.includes(slug) ? slug : null;
  }
  const zonesSky = zones.map((z) => {
    const s = sunTimes(renderNow, z.lat, z.lon, renderNow);
    const ph = planetaryHour(renderNow, z.lat, z.lon, z.tz);
    const se = season(renderNow, z.lat);
    const sunPt = skyPoint(s.altitudeDeg, s.azimuthDeg);
    const nowMin = localMinutes(renderNow, z.tz) ?? 0;
    const ritual = findRitual(nowMin, z.rituals);
    const timeFormat = z.timeFormat ?? defaultTimeFormat(z.tz);
    return {
      zone: z,
      sun: {
        sunriseLocal: hhmm(s.sunrise, z.tz),
        sunsetLocal: hhmm(s.sunset, z.tz),
        dayLength: dayLengthLabel(s.dayLengthMs),
        altitudeDeg: s.altitudeDeg,
        azimuthDeg: s.azimuthDeg,
        bearing: bearing(s.azimuthDeg),
        isDay: s.isDay,
        domeX: sunPt.x,
        domeY: sunPt.y,
        nowMin
      },
      planetaryHour: ph,
      season: se,
      latHemi: z.lat >= 0 ? "N" : "S",
      latAbs: Math.abs(z.lat).toFixed(1),
      equator: equatorRatio(z.lat),
      ritual,
      timeFormat,
      audioProfile: audioProfileFor(z.label)
    };
  });
  const hasAnyAudio = zonesSky.some((z) => z.audioProfile !== null);
  const moon = moonPhase(renderNow);
  const nextMarker = nextEquinoxOrSolstice(renderNow);
  const shower = nearestShower(renderNow);
  const zodiac = zodiacOfDate(renderNow);
  function fmtCountdown(msUntil) {
    const days = Math.floor(msUntil / 864e5);
    const hours = Math.floor(msUntil % 864e5 / 36e5);
    if (days >= 2) return `${days}d`;
    if (days === 1) return `1d ${hours}h`;
    return `${hours}h`;
  }
  const companionPoll = (data.companions ?? []).find((c) => c.surface === "poll");
  const pollEntry = companionPoll ? await getEntry("polls", companionPoll.id).catch(() => null) : null;
  const moonCountdown = fmtCountdown(moon.nextFullAt.getTime() - renderNow.getTime());
  const newMoonCountdown = fmtCountdown(moon.nextNewAt.getTime() - renderNow.getTime());
  const moonNextLabel = moon.nextFullAt.getTime() - renderNow.getTime() < moon.nextNewAt.getTime() - renderNow.getTime() ? `full in ${moonCountdown}` : `new in ${newMoonCountdown}`;
  const title = data.title;
  const description = `A clock that carries its sky. ${zones.length} zones with live sun arcs, planetary hours, season, and the moon overhead. CH.${ch.code} № ${data.id}.`;
  const ogImage = `/images/og/b/${data.id}.png`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description,
    applicationCategory: "Utility",
    operatingSystem: "Web Browser (any)",
    url: `https://pointcast.xyz/clock/${data.id}`,
    isPartOf: {
      "@type": "CreativeWork",
      "@id": `https://pointcast.xyz/b/${data.id}`
    }
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (() => {
    const cards = document.querySelectorAll('[data-tz]');
    if (!cards.length) return;

    const fmtCache = {};
    const dateFmtCache = {};

    function getFmt(tz, hour12) {
      const key = \`\${tz}:\${hour12 ? '12' : '24'}\`;
      if (!fmtCache[key]) {
        try {
          fmtCache[key] = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: hour12 ? 'numeric' : '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !!hour12,
          });
        } catch (err) {
          console.warn('clock: bad timezone', tz, err);
          return null;
        }
      }
      return fmtCache[key];
    }

    function getDateFmt(tz) {
      if (!dateFmtCache[tz]) {
        try {
          dateFmtCache[tz] = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
          });
        } catch (err) { return null; }
      }
      return dateFmtCache[tz];
    }

    function bucketFor(hour) {
      if (hour >= 22 || hour < 6) return { key: 'night', glyph: '🌙', label: 'Late night' };
      if (hour < 9)               return { key: 'early', glyph: '☕', label: 'Pre-coffee' };
      if (hour < 12)              return { key: 'morning', glyph: '🌅', label: 'Morning' };
      if (hour < 18)              return { key: 'work', glyph: '🟢', label: 'Working hours' };
      return { key: 'evening', glyph: '🍷', label: 'Evening' };
    }

    function parseHHMM(s) {
      const m = /^(\\d{2}):(\\d{2})$/.exec(s);
      return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
    }

    function findRitual(nowMin, rituals) {
      if (!rituals || !rituals.length) return null;
      for (const r of rituals) {
        const from = parseHHMM(r.from), to = parseHHMM(r.to);
        if (from === null || to === null) continue;
        if (from <= to) { if (nowMin >= from && nowMin < to) return r; }
        else            { if (nowMin >= from || nowMin < to) return r; }
      }
      return null;
    }

    function tick() {
      const now = new Date();
      for (const el of cards) {
        const tz = el.getAttribute('data-tz');
        if (!tz) continue;
        const timeFormat = el.getAttribute('data-time-format') || '24';
        const is12 = timeFormat === '12';
        const fmt = getFmt(tz, is12);
        if (!fmt) continue;
        const parts = fmt.formatToParts(now);
        const pick = (t) => parts.find((p) => p.type === t)?.value ?? '';
        const hm = \`\${pick('hour')}:\${pick('minute')}\`;
        const sec = \`:\${pick('second')}\`;
        const ap = is12 ? (pick('dayPeriod') || '') : '';

        const hmEl = el.querySelector('[data-role="hm"]');
        const secEl = el.querySelector('[data-role="sec"]');
        const apEl = el.querySelector('[data-role="ap"]');
        const dateEl = el.querySelector('[data-role="date"]');
        const statusEl = el.querySelector('[data-role="status"]');
        if (hmEl && hmEl.textContent !== hm) hmEl.textContent = hm;
        if (secEl && secEl.textContent !== sec) secEl.textContent = sec;
        if (apEl && apEl.textContent !== ap) apEl.textContent = ap ? ' ' + ap : '';
        if (dateEl) {
          const df = getDateFmt(tz);
          if (df) {
            const d = df.format(now);
            if (dateEl.textContent !== d) dateEl.textContent = d;
          }
        }

        // 24h-hour for bucket + ritual matching (ritual.from/to are 24h).
        const fmt24 = getFmt(tz, false);
        let hour24 = 0, nowMin = 0;
        if (fmt24) {
          const p24 = fmt24.formatToParts(now);
          const h24 = parseInt(p24.find((p) => p.type === 'hour')?.value || '0', 10);
          const m24 = parseInt(p24.find((p) => p.type === 'minute')?.value || '0', 10);
          hour24 = h24;
          nowMin = h24 * 60 + m24;
        }

        if (statusEl) {
          const b = bucketFor(hour24);
          const text = \`\${b.glyph} \${b.label}\`;
          if (statusEl.textContent !== text) statusEl.textContent = text;
          if (statusEl.getAttribute('data-bucket') !== b.key) {
            statusEl.setAttribute('data-bucket', b.key);
          }
        }

        // Ritual — re-match each tick so the chip rolls over cleanly.
        const ritualEl = el.querySelector('[data-role="ritual"]');
        if (ritualEl) {
          let rituals = null;
          const raw = el.getAttribute('data-rituals');
          if (raw) { try { rituals = JSON.parse(raw); } catch {} }
          const r = findRitual(nowMin, rituals);
          if (r) {
            const vignetteLine =
              (r.glyph ? \`<span class="clock-card__vignette-glyph" aria-hidden="true">\${r.glyph}</span>\` : '') +
              \`<span class="clock-card__vignette-label">\${r.label}</span>\`;
            const dataLine = r.data
              ? \`<p class="clock-card__vignette-data mono" data-role="vignette-data">\${r.data}</p>\`
              : '';
            const next = \`<p class="clock-card__vignette-line" data-role="vignette-line">\${vignetteLine}</p>\${dataLine}\`;
            if (ritualEl.innerHTML.trim() !== next.trim()) {
              ritualEl.innerHTML = next;
            }
            ritualEl.classList.add('clock-card__vignette--active');
          } else {
            const quiet = '<p class="clock-card__vignette-line"><span class="clock-card__vignette-quiet">quiet hour</span></p>';
            if (ritualEl.innerHTML.trim() !== quiet.trim()) {
              ritualEl.innerHTML = quiet;
            }
            ritualEl.classList.remove('clock-card__vignette--active');
          }
        }
      }
    }

    tick();
    setInterval(tick, 1000);
  })();
<\/script> `, ` <script>
  /* ========================================================================
   * Live weather — Open-Meteo free tier, no API key, browser-side fetch.
   * Cached per lat/lon for 15 min in localStorage so the API stays polite.
   * Graceful fail: if fetch errors, the slot just stays hidden.
   * ====================================================================== */
  (() => {
    const cards = Array.from(document.querySelectorAll('[data-lat][data-lon][data-role-cb]'));
    // Above selector is empty — intentionally loose: reselect below.
    const allCards = Array.from(document.querySelectorAll('[data-lat][data-lon]'));
    if (!allCards.length) return;

    // WMO weather code → glyph + short label.
    function codeToLabel(code) {
      if (code === 0) return ['☀', 'clear'];
      if (code >= 1 && code <= 2) return ['🌤', 'mostly clear'];
      if (code === 3) return ['☁', 'overcast'];
      if (code >= 45 && code <= 48) return ['🌫', 'fog'];
      if (code >= 51 && code <= 57) return ['🌦', 'drizzle'];
      if (code >= 61 && code <= 67) return ['🌧', 'rain'];
      if (code >= 71 && code <= 77) return ['❄', 'snow'];
      if (code >= 80 && code <= 82) return ['🌦', 'showers'];
      if (code >= 85 && code <= 86) return ['🌨', 'snow showers'];
      if (code >= 95 && code <= 99) return ['⛈', 'thunder'];
      return ['~', 'unknown'];
    }

    function bearingOf(deg) {
      if (deg == null || Number.isNaN(deg)) return '—';
      const dirs = ['N','NE','E','SE','S','SW','W','NW'];
      return dirs[Math.round(deg / 45) % 8];
    }

    async function fetchWeather(lat, lon) {
      const key = 'pc:weather:' + lat.toFixed(2) + ':' + lon.toFixed(2);
      const ttl = 15 * 60 * 1000;
      try {
        const cached = JSON.parse(localStorage.getItem(key) || 'null');
        if (cached && Date.now() - cached.at < ttl) return cached.data;
      } catch (e) {}
      try {
        const url = 'https://api.open-meteo.com/v1/forecast'
          + '?latitude=' + lat
          + '&longitude=' + lon
          + '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m'
          + '&wind_speed_unit=kmh'
          + '&timezone=auto';
        const r = await fetch(url);
        if (!r.ok) return null;
        const j = await r.json();
        if (!j || !j.current) return null;
        const data = {
          tempC: j.current.temperature_2m,
          code: j.current.weather_code,
          windKmh: j.current.wind_speed_10m,
          windDir: j.current.wind_direction_10m,
          fetchedAt: j.current.time || null,
        };
        try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch (e) {}
        return data;
      } catch (e) { return null; }
    }

    allCards.forEach(async (card) => {
      const lat = parseFloat(card.getAttribute('data-lat'));
      const lon = parseFloat(card.getAttribute('data-lon'));
      if (Number.isNaN(lat) || Number.isNaN(lon)) return;
      const slot = card.querySelector('[data-role="live-weather"]');
      if (!slot) return;
      const w = await fetchWeather(lat, lon);
      if (!w) return;
      const [glyph, label] = codeToLabel(w.code);
      const tempC = Math.round(w.tempC);
      const tempF = Math.round(w.tempC * 9 / 5 + 32);
      const windKmh = Math.round(w.windKmh || 0);
      const windMph = Math.round((w.windKmh || 0) * 0.621371);
      const bearing = bearingOf(w.windDir);
      slot.innerHTML =
        '<span class="live-weather__chip">LIVE</span> '
        + '<span class="live-weather__cond">' + glyph + ' ' + label + '</span>'
        + ' · ' + tempC + '°C / ' + tempF + '°F'
        + ' · wind ' + bearing + ' ' + windKmh + ' km/h';
      slot.setAttribute('title', 'Open-Meteo · cached 15 min · updated ' + (w.fetchedAt || 'just now'));
      slot.hidden = false;
    });
  })();
<\/script> <script>
  /* ========================================================================
   * YOU ARE HERE — detect viewer timezone and highlight the matching zone
   * card. Fallback to the same continent/region prefix when no exact match.
   * ====================================================================== */
  (() => {
    try {
      const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!viewerTz) return;
      let exact = null, fallback = null;
      document.querySelectorAll('[data-tz]').forEach((card) => {
        const tz = card.getAttribute('data-tz');
        if (!tz) return;
        if (tz === viewerTz) exact = exact || card;
        else if (tz.split('/')[0] === viewerTz.split('/')[0]) fallback = fallback || card;
      });
      const hit = exact || fallback;
      if (!hit) return;
      hit.setAttribute('data-here', exact ? 'exact' : 'near');
      const chip = document.createElement('span');
      chip.className = 'clock-card__here-chip mono';
      chip.textContent = exact ? 'YOU ARE HERE' : 'CLOSEST TO YOU';
      chip.setAttribute('title', 'Detected tz: ' + viewerTz);
      const top = hit.querySelector('.clock-card__top-text');
      if (top) top.prepend(chip);
    } catch (e) {}
  })();
<\/script> <script>
  /* ========================================================================
   * Sonic Postcards — procedural Web Audio ambient per zone.
   *
   * Zero external assets. Each profile synthesizes a distinct ambient bed
   * (wind, peepers, traffic, rain, waves, drones, neon) + signature
   * periodic events (jets, train horns, sirens, bells, gulls, ferry horns,
   * station chimes). Master + per-zone gain envelopes, click-to-start
   * (browsers require a gesture before AudioContext can play).
   * ====================================================================== */
  (() => {
    const cards = Array.from(document.querySelectorAll('[data-audio-profile]'));
    if (!cards.length) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    let ctx = null;
    let masterGain = null;
    const zones = new Map(); // profile -> { card, zoneGain, handle }

    function ensureCtx() {
      if (ctx) return ctx;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
      return ctx;
    }

    // --- audio graph helpers ---
    function whiteNoise(seconds) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      return s;
    }
    function brownNoise(seconds) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      return s;
    }
    function osc(freq, type) {
      const o = ctx.createOscillator();
      o.type = type || 'sine';
      o.frequency.value = freq;
      return o;
    }
    function biquad(type, freq, q) {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      if (q != null) f.Q.value = q;
      return f;
    }
    function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
    function rand(a, b) { return a + Math.random() * (b - a); }

    // --- profiles ---
    const PROFILES = {
      'el-segundo': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Wind bed
        const wind = brownNoise(4);
        const bp = biquad('bandpass', 400, 0.5);
        const g = gain(0.35);
        wind.connect(bp).connect(g).connect(out);
        wind.start(); oscs.push(wind); nodes.push(bp, g);
        // Wind LFO on bandpass freq
        const lfo = osc(0.08, 'sine'); const lfoG = gain(200);
        lfo.connect(lfoG).connect(bp.frequency); lfo.start();
        oscs.push(lfo); nodes.push(lfoG);
        // Periodic jet sweep
        const jet = () => {
          const t = ctx.currentTime;
          const saw = osc(80, 'sawtooth');
          const lp = biquad('lowpass', 600, 0.8);
          const jg = gain(0);
          saw.connect(lp).connect(jg).connect(out);
          saw.frequency.setValueAtTime(80, t);
          saw.frequency.linearRampToValueAtTime(50, t + 4);
          jg.gain.setValueAtTime(0, t);
          jg.gain.linearRampToValueAtTime(0.16, t + 1);
          jg.gain.linearRampToValueAtTime(0, t + 4);
          saw.start(t); saw.stop(t + 4.2);
          setTimeout(() => { try { lp.disconnect(); jg.disconnect(); } catch(e) {} }, 5000);
          timers.push(setTimeout(jet, rand(15000, 40000)));
        };
        timers.push(setTimeout(jet, rand(5000, 12000)));
        // Gulls
        const gull = () => {
          const t = ctx.currentTime;
          const n = whiteNoise(0.3);
          const gbp = biquad('bandpass', 2200, 10);
          const gg = gain(0);
          n.connect(gbp).connect(gg).connect(out);
          gg.gain.setValueAtTime(0, t);
          gg.gain.linearRampToValueAtTime(0.14, t + 0.04);
          gg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          n.start(t); n.stop(t + 0.45);
          setTimeout(() => { try { gbp.disconnect(); gg.disconnect(); } catch(e) {} }, 700);
          timers.push(setTimeout(gull, rand(20000, 60000)));
        };
        timers.push(setTimeout(gull, rand(8000, 20000)));
        return { oscs, nodes, timers };
      },

      'medway': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Peepers — three pulsed triangles
        [2800, 3020, 3200].forEach((f, i) => {
          const o = osc(f, 'triangle');
          const g = gain(0.04);
          o.connect(g).connect(out);
          const l = osc(4 + i * 1.2, 'sine');
          const lg = gain(0.035);
          l.connect(lg).connect(g.gain);
          o.start(); l.start();
          oscs.push(o, l); nodes.push(g, lg);
        });
        // Pond background
        const bg = brownNoise(4); const bgG = gain(0.11);
        bg.connect(bgG).connect(out); bg.start();
        oscs.push(bg); nodes.push(bgG);
        // Distant train horn — minor second
        const horn = () => {
          const t = ctx.currentTime;
          const o1 = osc(65, 'triangle'), o2 = osc(98, 'triangle');
          const hg = gain(0); const lp = biquad('lowpass', 500, 0.6);
          o1.connect(hg); o2.connect(hg); hg.connect(lp).connect(out);
          hg.gain.setValueAtTime(0, t);
          hg.gain.linearRampToValueAtTime(0.2, t + 0.8);
          hg.gain.linearRampToValueAtTime(0, t + 3);
          o1.start(t); o2.start(t); o1.stop(t + 3.2); o2.stop(t + 3.2);
          setTimeout(() => { try { lp.disconnect(); hg.disconnect(); } catch(e) {} }, 3500);
          timers.push(setTimeout(horn, rand(30000, 90000)));
        };
        timers.push(setTimeout(horn, rand(10000, 25000)));
        return { oscs, nodes, timers };
      },

      'nyc': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Traffic
        const tr = whiteNoise(4);
        const trLP = biquad('lowpass', 800, 0.5);
        const trG = gain(0.28);
        tr.connect(trLP).connect(trG).connect(out);
        tr.start();
        oscs.push(tr); nodes.push(trLP, trG);
        // Subway rumble
        const rum = osc(42, 'sine');
        const rumG = gain(0.16);
        rum.connect(rumG).connect(out);
        const rumLFO = osc(0.15, 'sine');
        const rumLFOG = gain(0.07);
        rumLFO.connect(rumLFOG).connect(rumG.gain);
        rum.start(); rumLFO.start();
        oscs.push(rum, rumLFO); nodes.push(rumG, rumLFOG);
        // Siren
        const siren = () => {
          const t = ctx.currentTime;
          const s1 = osc(600, 'sawtooth'), s2 = osc(603, 'sawtooth');
          const bp = biquad('bandpass', 800, 4);
          const sg = gain(0);
          s1.connect(bp); s2.connect(bp); bp.connect(sg).connect(out);
          [s1, s2].forEach((s, i) => {
            const base = 600 + i * 3;
            s.frequency.setValueAtTime(base, t);
            s.frequency.linearRampToValueAtTime(base + 300, t + 0.6);
            s.frequency.linearRampToValueAtTime(base, t + 1.2);
            s.frequency.linearRampToValueAtTime(base + 300, t + 1.8);
          });
          sg.gain.setValueAtTime(0, t);
          sg.gain.linearRampToValueAtTime(0.09, t + 0.3);
          sg.gain.linearRampToValueAtTime(0, t + 2.5);
          s1.start(t); s2.start(t);
          s1.stop(t + 2.6); s2.stop(t + 2.6);
          setTimeout(() => { try { bp.disconnect(); sg.disconnect(); } catch(e) {} }, 3000);
          timers.push(setTimeout(siren, rand(40000, 90000)));
        };
        timers.push(setTimeout(siren, rand(15000, 35000)));
        return { oscs, nodes, timers };
      },

      'london': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Rain
        const rain = brownNoise(4);
        const rainHP = biquad('highpass', 2000, 0.5);
        const rainG = gain(0.32);
        rain.connect(rainHP).connect(rainG).connect(out);
        rain.start();
        oscs.push(rain); nodes.push(rainHP, rainG);
        // Pub murmur
        const pub = whiteNoise(4);
        const pubBP = biquad('bandpass', 400, 0.8);
        const pubG = gain(0.09);
        pub.connect(pubBP).connect(pubG).connect(out);
        const pLFO = osc(0.3, 'sine'); const pLFOG = gain(0.05);
        pLFO.connect(pLFOG).connect(pubG.gain);
        pub.start(); pLFO.start();
        oscs.push(pub, pLFO); nodes.push(pubBP, pubG, pLFOG);
        // Glass clink
        const clink = () => {
          const t = ctx.currentTime;
          const o = osc(7500 + Math.random() * 1500, 'sine');
          const cg = gain(0);
          o.connect(cg).connect(out);
          cg.gain.setValueAtTime(0, t);
          cg.gain.linearRampToValueAtTime(0.07, t + 0.01);
          cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          o.start(t); o.stop(t + 0.35);
          setTimeout(() => { try { cg.disconnect(); } catch(e) {} }, 500);
          timers.push(setTimeout(clink, rand(10000, 30000)));
        };
        timers.push(setTimeout(clink, rand(5000, 15000)));
        return { oscs, nodes, timers };
      },

      'mallorca': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Waves with slow amp LFO
        const w = brownNoise(4);
        const wLP = biquad('lowpass', 1200, 0.4);
        const wG = gain(0.3);
        w.connect(wLP).connect(wG).connect(out);
        const wLFO = osc(0.12, 'sine'); const wLFOG = gain(0.18);
        wLFO.connect(wLFOG).connect(wG.gain);
        w.start(); wLFO.start();
        oscs.push(w, wLFO); nodes.push(wLP, wG, wLFOG);
        // Crickets
        const cr = whiteNoise(4);
        const crBP = biquad('bandpass', 4500, 14);
        const crG = gain(0.035);
        cr.connect(crBP).connect(crG).connect(out);
        cr.start();
        oscs.push(cr); nodes.push(crBP, crG);
        // Church bell
        const bell = () => {
          const t = ctx.currentTime;
          const f = osc(130, 'sine'), p = osc(520, 'sine');
          const fg = gain(0), pg = gain(0);
          f.connect(fg).connect(out); p.connect(pg).connect(out);
          fg.gain.setValueAtTime(0, t);
          fg.gain.linearRampToValueAtTime(0.14, t + 0.05);
          fg.gain.exponentialRampToValueAtTime(0.001, t + 3);
          pg.gain.setValueAtTime(0, t);
          pg.gain.linearRampToValueAtTime(0.045, t + 0.05);
          pg.gain.exponentialRampToValueAtTime(0.001, t + 2);
          f.start(t); p.start(t);
          f.stop(t + 3.1); p.stop(t + 2.1);
          setTimeout(() => { try { fg.disconnect(); pg.disconnect(); } catch(e) {} }, 3500);
          timers.push(setTimeout(bell, rand(40000, 90000)));
        };
        timers.push(setTimeout(bell, rand(12000, 30000)));
        return { oscs, nodes, timers };
      },

      'istanbul': (out) => {
        const oscs = [], nodes = [], timers = [];
        // D minor drone + 3rd harmonics
        [146.83, 174.61, 220].forEach((f, i) => {
          const o = osc(f, 'sine');
          const g = gain(0.075);
          o.connect(g).connect(out);
          const l = osc(0.08 + i * 0.03, 'sine');
          const lg = gain(f * 0.004);
          l.connect(lg).connect(o.frequency);
          o.start(); l.start();
          oscs.push(o, l); nodes.push(g, lg);
          const h = osc(f * 3, 'sine');
          const hg = gain(0.018);
          h.connect(hg).connect(out);
          h.start();
          oscs.push(h); nodes.push(hg);
        });
        // Seagulls
        const gull = () => {
          const t = ctx.currentTime;
          const n = whiteNoise(0.4);
          const bp = biquad('bandpass', 2500, 10);
          const gg = gain(0);
          n.connect(bp).connect(gg).connect(out);
          gg.gain.setValueAtTime(0, t);
          gg.gain.linearRampToValueAtTime(0.16, t + 0.03);
          gg.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          n.start(t); n.stop(t + 0.4);
          setTimeout(() => { try { bp.disconnect(); gg.disconnect(); } catch(e) {} }, 600);
          timers.push(setTimeout(gull, rand(15000, 45000)));
        };
        timers.push(setTimeout(gull, rand(6000, 15000)));
        // Ferry horn
        const ferry = () => {
          const t = ctx.currentTime;
          const o1 = osc(55, 'triangle'), o2 = osc(82, 'triangle');
          const fg = gain(0);
          o1.connect(fg); o2.connect(fg); fg.connect(out);
          fg.gain.setValueAtTime(0, t);
          fg.gain.linearRampToValueAtTime(0.22, t + 1.2);
          fg.gain.linearRampToValueAtTime(0, t + 4);
          o1.start(t); o2.start(t);
          o1.stop(t + 4.2); o2.stop(t + 4.2);
          setTimeout(() => { try { fg.disconnect(); } catch(e) {} }, 4500);
          timers.push(setTimeout(ferry, rand(60000, 120000)));
        };
        timers.push(setTimeout(ferry, rand(20000, 50000)));
        return { oscs, nodes, timers };
      },

      'mexico-city': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Market murmur — filtered noise at conversation range
        const market = whiteNoise(4);
        const marketBP = biquad('bandpass', 450, 0.7);
        const marketG = gain(0.18);
        market.connect(marketBP).connect(marketG).connect(out);
        const mLFO = osc(0.22, 'sine'); const mLFOG = gain(0.1);
        mLFO.connect(mLFOG).connect(marketG.gain);
        market.start(); mLFO.start();
        oscs.push(market, mLFO); nodes.push(marketBP, marketG, mLFOG);
        // Altitude hiss — thin, high-pass
        const hiss = whiteNoise(3);
        const hissHP = biquad('highpass', 3000, 0.3);
        const hissG = gain(0.025);
        hiss.connect(hissHP).connect(hissG).connect(out);
        hiss.start();
        oscs.push(hiss); nodes.push(hissHP, hissG);
        // Distant mariachi hint — D minor triad via triangles (trumpet-ish)
        [293.66, 349.23, 440].forEach((f, i) => {
          const o = osc(f, 'triangle');
          const g = gain(0.015);
          o.connect(g).connect(out);
          const l = osc(0.1 + i * 0.04, 'sine');
          const lg = gain(f * 0.003);
          l.connect(lg).connect(o.frequency);
          o.start(); l.start();
          oscs.push(o, l); nodes.push(g, lg);
        });
        // Street dog bark
        const bark = () => {
          const t = ctx.currentTime;
          const n = whiteNoise(0.12);
          const bp = biquad('bandpass', 900, 6);
          const bg = gain(0);
          n.connect(bp).connect(bg).connect(out);
          bg.gain.setValueAtTime(0, t);
          bg.gain.linearRampToValueAtTime(0.14, t + 0.015);
          bg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          n.start(t); n.stop(t + 0.14);
          setTimeout(() => { try { bp.disconnect(); bg.disconnect(); } catch(e) {} }, 300);
          timers.push(setTimeout(bark, rand(18000, 50000)));
        };
        timers.push(setTimeout(bark, rand(7000, 20000)));
        // Catedral bell at :00 (random interval stand-in)
        const bell = () => {
          const t = ctx.currentTime;
          const f = osc(98, 'sine');   // G2 — big bell
          const p = osc(294, 'sine');  // 3rd harmonic of D
          const fg = gain(0), pg = gain(0);
          f.connect(fg).connect(out); p.connect(pg).connect(out);
          fg.gain.setValueAtTime(0, t);
          fg.gain.linearRampToValueAtTime(0.12, t + 0.04);
          fg.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
          pg.gain.setValueAtTime(0, t);
          pg.gain.linearRampToValueAtTime(0.035, t + 0.05);
          pg.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
          f.start(t); p.start(t);
          f.stop(t + 3.6); p.stop(t + 2.6);
          setTimeout(() => { try { fg.disconnect(); pg.disconnect(); } catch(e) {} }, 4000);
          timers.push(setTimeout(bell, rand(45000, 90000)));
        };
        timers.push(setTimeout(bell, rand(15000, 35000)));
        return { oscs, nodes, timers };
      },

      'tokyo': (out) => {
        const oscs = [], nodes = [], timers = [];
        // 50Hz AC hum (East Japan)
        const hum = osc(50, 'square');
        const humLP = biquad('lowpass', 200, 0.5);
        const humG = gain(0.04);
        hum.connect(humLP).connect(humG).connect(out);
        hum.start();
        oscs.push(hum); nodes.push(humLP, humG);
        // Neon whine
        const neon = osc(12000, 'sine');
        const neonG = gain(0.012);
        neon.connect(neonG).connect(out);
        neon.start();
        oscs.push(neon); nodes.push(neonG);
        // City bed
        const city = whiteNoise(4);
        const cLP = biquad('lowpass', 600, 0.4);
        const cG = gain(0.14);
        city.connect(cLP).connect(cG).connect(out);
        city.start();
        oscs.push(city); nodes.push(cLP, cG);
        // Station chime (E C A descending)
        const chime = () => {
          [659.25, 523.25, 440].forEach((f, i) => {
            const t = ctx.currentTime + i * 0.3;
            const o = osc(f, 'sine');
            const cg = gain(0);
            o.connect(cg).connect(out);
            cg.gain.setValueAtTime(0, t);
            cg.gain.linearRampToValueAtTime(0.1, t + 0.02);
            cg.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
            o.start(t); o.stop(t + 0.85);
            setTimeout(() => { try { cg.disconnect(); } catch(e) {} }, 1200);
          });
          timers.push(setTimeout(chime, rand(25000, 60000)));
        };
        timers.push(setTimeout(chime, rand(8000, 20000)));
        return { oscs, nodes, timers };
      },
    };

    // --- controller ---
    function startZone(card) {
      const profile = card.getAttribute('data-audio-profile');
      if (!profile || !PROFILES[profile]) return;
      if (zones.has(profile)) return;
      ensureCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const zoneGain = ctx.createGain();
      zoneGain.gain.value = 0;
      zoneGain.connect(masterGain);

      const handle = PROFILES[profile](zoneGain);
      zoneGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
      zones.set(profile, { card, zoneGain, handle });

      card.setAttribute('data-audio-on', 'true');
      const btn = card.querySelector('[data-role="audio-toggle"]');
      if (btn) {
        btn.setAttribute('aria-pressed', 'true');
        const icon = btn.querySelector('[data-role="audio-icon"]');
        if (icon) icon.textContent = '■';
      }
      updateMasterCount();
    }

    function stopZone(card) {
      const profile = card.getAttribute('data-audio-profile');
      const state = zones.get(profile);
      if (!state) return;
      const { zoneGain, handle } = state;
      zoneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setTimeout(() => {
        handle.oscs.forEach((o) => { try { o.stop(); } catch(e) {} });
        handle.timers.forEach((t) => clearTimeout(t));
        handle.nodes.forEach((n) => { try { n.disconnect(); } catch(e) {} });
        try { zoneGain.disconnect(); } catch(e) {}
      }, 500);
      zones.delete(profile);
      card.removeAttribute('data-audio-on');
      const btn = card.querySelector('[data-role="audio-toggle"]');
      if (btn) {
        btn.setAttribute('aria-pressed', 'false');
        const icon = btn.querySelector('[data-role="audio-icon"]');
        if (icon) icon.textContent = '▶';
      }
      updateMasterCount();
    }

    function updateMasterCount() {
      const el = document.querySelector('[data-role="audio-count"]');
      if (el) el.textContent = zones.size + ' playing';
      const muteBtn = document.querySelector('[data-role="audio-mute"]');
      if (muteBtn) muteBtn.hidden = zones.size === 0;
      const allBtn = document.querySelector('[data-role="audio-all"]');
      if (allBtn) {
        const allPossible = cards.length;
        allBtn.setAttribute('aria-pressed', zones.size === allPossible ? 'true' : 'false');
      }
    }

    // Per-card toggles
    cards.forEach((card) => {
      const btn = card.querySelector('[data-role="audio-toggle"]');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (card.getAttribute('data-audio-on') === 'true') stopZone(card);
        else startZone(card);
      });
    });

    // Master controls
    const allBtn = document.querySelector('[data-role="audio-all"]');
    const muteBtn = document.querySelector('[data-role="audio-mute"]');
    if (allBtn) {
      allBtn.addEventListener('click', () => {
        ensureCtx();
        if (ctx.state === 'suspended') ctx.resume();
        cards.forEach((c) => {
          if (c.getAttribute('data-audio-on') !== 'true') startZone(c);
        });
        // Dial master down — 7 zones at once needs headroom.
        if (masterGain) masterGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.4);
      });
    }
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        cards.forEach((c) => stopZone(c));
        if (masterGain && ctx) masterGain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.4);
      });
    }

    // Suspend audio when tab is hidden — polite to battery + attention.
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden && ctx.state === 'running') ctx.suspend();
      else if (!document.hidden && ctx.state === 'suspended' && zones.size > 0) ctx.resume();
    });
  })();
<\/script>`], ["", ` <script>
  (() => {
    const cards = document.querySelectorAll('[data-tz]');
    if (!cards.length) return;

    const fmtCache = {};
    const dateFmtCache = {};

    function getFmt(tz, hour12) {
      const key = \\\`\\\${tz}:\\\${hour12 ? '12' : '24'}\\\`;
      if (!fmtCache[key]) {
        try {
          fmtCache[key] = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: hour12 ? 'numeric' : '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !!hour12,
          });
        } catch (err) {
          console.warn('clock: bad timezone', tz, err);
          return null;
        }
      }
      return fmtCache[key];
    }

    function getDateFmt(tz) {
      if (!dateFmtCache[tz]) {
        try {
          dateFmtCache[tz] = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
          });
        } catch (err) { return null; }
      }
      return dateFmtCache[tz];
    }

    function bucketFor(hour) {
      if (hour >= 22 || hour < 6) return { key: 'night', glyph: '🌙', label: 'Late night' };
      if (hour < 9)               return { key: 'early', glyph: '☕', label: 'Pre-coffee' };
      if (hour < 12)              return { key: 'morning', glyph: '🌅', label: 'Morning' };
      if (hour < 18)              return { key: 'work', glyph: '🟢', label: 'Working hours' };
      return { key: 'evening', glyph: '🍷', label: 'Evening' };
    }

    function parseHHMM(s) {
      const m = /^(\\\\d{2}):(\\\\d{2})$/.exec(s);
      return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
    }

    function findRitual(nowMin, rituals) {
      if (!rituals || !rituals.length) return null;
      for (const r of rituals) {
        const from = parseHHMM(r.from), to = parseHHMM(r.to);
        if (from === null || to === null) continue;
        if (from <= to) { if (nowMin >= from && nowMin < to) return r; }
        else            { if (nowMin >= from || nowMin < to) return r; }
      }
      return null;
    }

    function tick() {
      const now = new Date();
      for (const el of cards) {
        const tz = el.getAttribute('data-tz');
        if (!tz) continue;
        const timeFormat = el.getAttribute('data-time-format') || '24';
        const is12 = timeFormat === '12';
        const fmt = getFmt(tz, is12);
        if (!fmt) continue;
        const parts = fmt.formatToParts(now);
        const pick = (t) => parts.find((p) => p.type === t)?.value ?? '';
        const hm = \\\`\\\${pick('hour')}:\\\${pick('minute')}\\\`;
        const sec = \\\`:\\\${pick('second')}\\\`;
        const ap = is12 ? (pick('dayPeriod') || '') : '';

        const hmEl = el.querySelector('[data-role="hm"]');
        const secEl = el.querySelector('[data-role="sec"]');
        const apEl = el.querySelector('[data-role="ap"]');
        const dateEl = el.querySelector('[data-role="date"]');
        const statusEl = el.querySelector('[data-role="status"]');
        if (hmEl && hmEl.textContent !== hm) hmEl.textContent = hm;
        if (secEl && secEl.textContent !== sec) secEl.textContent = sec;
        if (apEl && apEl.textContent !== ap) apEl.textContent = ap ? ' ' + ap : '';
        if (dateEl) {
          const df = getDateFmt(tz);
          if (df) {
            const d = df.format(now);
            if (dateEl.textContent !== d) dateEl.textContent = d;
          }
        }

        // 24h-hour for bucket + ritual matching (ritual.from/to are 24h).
        const fmt24 = getFmt(tz, false);
        let hour24 = 0, nowMin = 0;
        if (fmt24) {
          const p24 = fmt24.formatToParts(now);
          const h24 = parseInt(p24.find((p) => p.type === 'hour')?.value || '0', 10);
          const m24 = parseInt(p24.find((p) => p.type === 'minute')?.value || '0', 10);
          hour24 = h24;
          nowMin = h24 * 60 + m24;
        }

        if (statusEl) {
          const b = bucketFor(hour24);
          const text = \\\`\\\${b.glyph} \\\${b.label}\\\`;
          if (statusEl.textContent !== text) statusEl.textContent = text;
          if (statusEl.getAttribute('data-bucket') !== b.key) {
            statusEl.setAttribute('data-bucket', b.key);
          }
        }

        // Ritual — re-match each tick so the chip rolls over cleanly.
        const ritualEl = el.querySelector('[data-role="ritual"]');
        if (ritualEl) {
          let rituals = null;
          const raw = el.getAttribute('data-rituals');
          if (raw) { try { rituals = JSON.parse(raw); } catch {} }
          const r = findRitual(nowMin, rituals);
          if (r) {
            const vignetteLine =
              (r.glyph ? \\\`<span class="clock-card__vignette-glyph" aria-hidden="true">\\\${r.glyph}</span>\\\` : '') +
              \\\`<span class="clock-card__vignette-label">\\\${r.label}</span>\\\`;
            const dataLine = r.data
              ? \\\`<p class="clock-card__vignette-data mono" data-role="vignette-data">\\\${r.data}</p>\\\`
              : '';
            const next = \\\`<p class="clock-card__vignette-line" data-role="vignette-line">\\\${vignetteLine}</p>\\\${dataLine}\\\`;
            if (ritualEl.innerHTML.trim() !== next.trim()) {
              ritualEl.innerHTML = next;
            }
            ritualEl.classList.add('clock-card__vignette--active');
          } else {
            const quiet = '<p class="clock-card__vignette-line"><span class="clock-card__vignette-quiet">quiet hour</span></p>';
            if (ritualEl.innerHTML.trim() !== quiet.trim()) {
              ritualEl.innerHTML = quiet;
            }
            ritualEl.classList.remove('clock-card__vignette--active');
          }
        }
      }
    }

    tick();
    setInterval(tick, 1000);
  })();
<\/script> `, ` <script>
  /* ========================================================================
   * Live weather — Open-Meteo free tier, no API key, browser-side fetch.
   * Cached per lat/lon for 15 min in localStorage so the API stays polite.
   * Graceful fail: if fetch errors, the slot just stays hidden.
   * ====================================================================== */
  (() => {
    const cards = Array.from(document.querySelectorAll('[data-lat][data-lon][data-role-cb]'));
    // Above selector is empty — intentionally loose: reselect below.
    const allCards = Array.from(document.querySelectorAll('[data-lat][data-lon]'));
    if (!allCards.length) return;

    // WMO weather code → glyph + short label.
    function codeToLabel(code) {
      if (code === 0) return ['☀', 'clear'];
      if (code >= 1 && code <= 2) return ['🌤', 'mostly clear'];
      if (code === 3) return ['☁', 'overcast'];
      if (code >= 45 && code <= 48) return ['🌫', 'fog'];
      if (code >= 51 && code <= 57) return ['🌦', 'drizzle'];
      if (code >= 61 && code <= 67) return ['🌧', 'rain'];
      if (code >= 71 && code <= 77) return ['❄', 'snow'];
      if (code >= 80 && code <= 82) return ['🌦', 'showers'];
      if (code >= 85 && code <= 86) return ['🌨', 'snow showers'];
      if (code >= 95 && code <= 99) return ['⛈', 'thunder'];
      return ['~', 'unknown'];
    }

    function bearingOf(deg) {
      if (deg == null || Number.isNaN(deg)) return '—';
      const dirs = ['N','NE','E','SE','S','SW','W','NW'];
      return dirs[Math.round(deg / 45) % 8];
    }

    async function fetchWeather(lat, lon) {
      const key = 'pc:weather:' + lat.toFixed(2) + ':' + lon.toFixed(2);
      const ttl = 15 * 60 * 1000;
      try {
        const cached = JSON.parse(localStorage.getItem(key) || 'null');
        if (cached && Date.now() - cached.at < ttl) return cached.data;
      } catch (e) {}
      try {
        const url = 'https://api.open-meteo.com/v1/forecast'
          + '?latitude=' + lat
          + '&longitude=' + lon
          + '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m'
          + '&wind_speed_unit=kmh'
          + '&timezone=auto';
        const r = await fetch(url);
        if (!r.ok) return null;
        const j = await r.json();
        if (!j || !j.current) return null;
        const data = {
          tempC: j.current.temperature_2m,
          code: j.current.weather_code,
          windKmh: j.current.wind_speed_10m,
          windDir: j.current.wind_direction_10m,
          fetchedAt: j.current.time || null,
        };
        try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch (e) {}
        return data;
      } catch (e) { return null; }
    }

    allCards.forEach(async (card) => {
      const lat = parseFloat(card.getAttribute('data-lat'));
      const lon = parseFloat(card.getAttribute('data-lon'));
      if (Number.isNaN(lat) || Number.isNaN(lon)) return;
      const slot = card.querySelector('[data-role="live-weather"]');
      if (!slot) return;
      const w = await fetchWeather(lat, lon);
      if (!w) return;
      const [glyph, label] = codeToLabel(w.code);
      const tempC = Math.round(w.tempC);
      const tempF = Math.round(w.tempC * 9 / 5 + 32);
      const windKmh = Math.round(w.windKmh || 0);
      const windMph = Math.round((w.windKmh || 0) * 0.621371);
      const bearing = bearingOf(w.windDir);
      slot.innerHTML =
        '<span class="live-weather__chip">LIVE</span> '
        + '<span class="live-weather__cond">' + glyph + ' ' + label + '</span>'
        + ' · ' + tempC + '°C / ' + tempF + '°F'
        + ' · wind ' + bearing + ' ' + windKmh + ' km/h';
      slot.setAttribute('title', 'Open-Meteo · cached 15 min · updated ' + (w.fetchedAt || 'just now'));
      slot.hidden = false;
    });
  })();
<\/script> <script>
  /* ========================================================================
   * YOU ARE HERE — detect viewer timezone and highlight the matching zone
   * card. Fallback to the same continent/region prefix when no exact match.
   * ====================================================================== */
  (() => {
    try {
      const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!viewerTz) return;
      let exact = null, fallback = null;
      document.querySelectorAll('[data-tz]').forEach((card) => {
        const tz = card.getAttribute('data-tz');
        if (!tz) return;
        if (tz === viewerTz) exact = exact || card;
        else if (tz.split('/')[0] === viewerTz.split('/')[0]) fallback = fallback || card;
      });
      const hit = exact || fallback;
      if (!hit) return;
      hit.setAttribute('data-here', exact ? 'exact' : 'near');
      const chip = document.createElement('span');
      chip.className = 'clock-card__here-chip mono';
      chip.textContent = exact ? 'YOU ARE HERE' : 'CLOSEST TO YOU';
      chip.setAttribute('title', 'Detected tz: ' + viewerTz);
      const top = hit.querySelector('.clock-card__top-text');
      if (top) top.prepend(chip);
    } catch (e) {}
  })();
<\/script> <script>
  /* ========================================================================
   * Sonic Postcards — procedural Web Audio ambient per zone.
   *
   * Zero external assets. Each profile synthesizes a distinct ambient bed
   * (wind, peepers, traffic, rain, waves, drones, neon) + signature
   * periodic events (jets, train horns, sirens, bells, gulls, ferry horns,
   * station chimes). Master + per-zone gain envelopes, click-to-start
   * (browsers require a gesture before AudioContext can play).
   * ====================================================================== */
  (() => {
    const cards = Array.from(document.querySelectorAll('[data-audio-profile]'));
    if (!cards.length) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    let ctx = null;
    let masterGain = null;
    const zones = new Map(); // profile -> { card, zoneGain, handle }

    function ensureCtx() {
      if (ctx) return ctx;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
      return ctx;
    }

    // --- audio graph helpers ---
    function whiteNoise(seconds) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      return s;
    }
    function brownNoise(seconds) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      return s;
    }
    function osc(freq, type) {
      const o = ctx.createOscillator();
      o.type = type || 'sine';
      o.frequency.value = freq;
      return o;
    }
    function biquad(type, freq, q) {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      if (q != null) f.Q.value = q;
      return f;
    }
    function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
    function rand(a, b) { return a + Math.random() * (b - a); }

    // --- profiles ---
    const PROFILES = {
      'el-segundo': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Wind bed
        const wind = brownNoise(4);
        const bp = biquad('bandpass', 400, 0.5);
        const g = gain(0.35);
        wind.connect(bp).connect(g).connect(out);
        wind.start(); oscs.push(wind); nodes.push(bp, g);
        // Wind LFO on bandpass freq
        const lfo = osc(0.08, 'sine'); const lfoG = gain(200);
        lfo.connect(lfoG).connect(bp.frequency); lfo.start();
        oscs.push(lfo); nodes.push(lfoG);
        // Periodic jet sweep
        const jet = () => {
          const t = ctx.currentTime;
          const saw = osc(80, 'sawtooth');
          const lp = biquad('lowpass', 600, 0.8);
          const jg = gain(0);
          saw.connect(lp).connect(jg).connect(out);
          saw.frequency.setValueAtTime(80, t);
          saw.frequency.linearRampToValueAtTime(50, t + 4);
          jg.gain.setValueAtTime(0, t);
          jg.gain.linearRampToValueAtTime(0.16, t + 1);
          jg.gain.linearRampToValueAtTime(0, t + 4);
          saw.start(t); saw.stop(t + 4.2);
          setTimeout(() => { try { lp.disconnect(); jg.disconnect(); } catch(e) {} }, 5000);
          timers.push(setTimeout(jet, rand(15000, 40000)));
        };
        timers.push(setTimeout(jet, rand(5000, 12000)));
        // Gulls
        const gull = () => {
          const t = ctx.currentTime;
          const n = whiteNoise(0.3);
          const gbp = biquad('bandpass', 2200, 10);
          const gg = gain(0);
          n.connect(gbp).connect(gg).connect(out);
          gg.gain.setValueAtTime(0, t);
          gg.gain.linearRampToValueAtTime(0.14, t + 0.04);
          gg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          n.start(t); n.stop(t + 0.45);
          setTimeout(() => { try { gbp.disconnect(); gg.disconnect(); } catch(e) {} }, 700);
          timers.push(setTimeout(gull, rand(20000, 60000)));
        };
        timers.push(setTimeout(gull, rand(8000, 20000)));
        return { oscs, nodes, timers };
      },

      'medway': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Peepers — three pulsed triangles
        [2800, 3020, 3200].forEach((f, i) => {
          const o = osc(f, 'triangle');
          const g = gain(0.04);
          o.connect(g).connect(out);
          const l = osc(4 + i * 1.2, 'sine');
          const lg = gain(0.035);
          l.connect(lg).connect(g.gain);
          o.start(); l.start();
          oscs.push(o, l); nodes.push(g, lg);
        });
        // Pond background
        const bg = brownNoise(4); const bgG = gain(0.11);
        bg.connect(bgG).connect(out); bg.start();
        oscs.push(bg); nodes.push(bgG);
        // Distant train horn — minor second
        const horn = () => {
          const t = ctx.currentTime;
          const o1 = osc(65, 'triangle'), o2 = osc(98, 'triangle');
          const hg = gain(0); const lp = biquad('lowpass', 500, 0.6);
          o1.connect(hg); o2.connect(hg); hg.connect(lp).connect(out);
          hg.gain.setValueAtTime(0, t);
          hg.gain.linearRampToValueAtTime(0.2, t + 0.8);
          hg.gain.linearRampToValueAtTime(0, t + 3);
          o1.start(t); o2.start(t); o1.stop(t + 3.2); o2.stop(t + 3.2);
          setTimeout(() => { try { lp.disconnect(); hg.disconnect(); } catch(e) {} }, 3500);
          timers.push(setTimeout(horn, rand(30000, 90000)));
        };
        timers.push(setTimeout(horn, rand(10000, 25000)));
        return { oscs, nodes, timers };
      },

      'nyc': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Traffic
        const tr = whiteNoise(4);
        const trLP = biquad('lowpass', 800, 0.5);
        const trG = gain(0.28);
        tr.connect(trLP).connect(trG).connect(out);
        tr.start();
        oscs.push(tr); nodes.push(trLP, trG);
        // Subway rumble
        const rum = osc(42, 'sine');
        const rumG = gain(0.16);
        rum.connect(rumG).connect(out);
        const rumLFO = osc(0.15, 'sine');
        const rumLFOG = gain(0.07);
        rumLFO.connect(rumLFOG).connect(rumG.gain);
        rum.start(); rumLFO.start();
        oscs.push(rum, rumLFO); nodes.push(rumG, rumLFOG);
        // Siren
        const siren = () => {
          const t = ctx.currentTime;
          const s1 = osc(600, 'sawtooth'), s2 = osc(603, 'sawtooth');
          const bp = biquad('bandpass', 800, 4);
          const sg = gain(0);
          s1.connect(bp); s2.connect(bp); bp.connect(sg).connect(out);
          [s1, s2].forEach((s, i) => {
            const base = 600 + i * 3;
            s.frequency.setValueAtTime(base, t);
            s.frequency.linearRampToValueAtTime(base + 300, t + 0.6);
            s.frequency.linearRampToValueAtTime(base, t + 1.2);
            s.frequency.linearRampToValueAtTime(base + 300, t + 1.8);
          });
          sg.gain.setValueAtTime(0, t);
          sg.gain.linearRampToValueAtTime(0.09, t + 0.3);
          sg.gain.linearRampToValueAtTime(0, t + 2.5);
          s1.start(t); s2.start(t);
          s1.stop(t + 2.6); s2.stop(t + 2.6);
          setTimeout(() => { try { bp.disconnect(); sg.disconnect(); } catch(e) {} }, 3000);
          timers.push(setTimeout(siren, rand(40000, 90000)));
        };
        timers.push(setTimeout(siren, rand(15000, 35000)));
        return { oscs, nodes, timers };
      },

      'london': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Rain
        const rain = brownNoise(4);
        const rainHP = biquad('highpass', 2000, 0.5);
        const rainG = gain(0.32);
        rain.connect(rainHP).connect(rainG).connect(out);
        rain.start();
        oscs.push(rain); nodes.push(rainHP, rainG);
        // Pub murmur
        const pub = whiteNoise(4);
        const pubBP = biquad('bandpass', 400, 0.8);
        const pubG = gain(0.09);
        pub.connect(pubBP).connect(pubG).connect(out);
        const pLFO = osc(0.3, 'sine'); const pLFOG = gain(0.05);
        pLFO.connect(pLFOG).connect(pubG.gain);
        pub.start(); pLFO.start();
        oscs.push(pub, pLFO); nodes.push(pubBP, pubG, pLFOG);
        // Glass clink
        const clink = () => {
          const t = ctx.currentTime;
          const o = osc(7500 + Math.random() * 1500, 'sine');
          const cg = gain(0);
          o.connect(cg).connect(out);
          cg.gain.setValueAtTime(0, t);
          cg.gain.linearRampToValueAtTime(0.07, t + 0.01);
          cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          o.start(t); o.stop(t + 0.35);
          setTimeout(() => { try { cg.disconnect(); } catch(e) {} }, 500);
          timers.push(setTimeout(clink, rand(10000, 30000)));
        };
        timers.push(setTimeout(clink, rand(5000, 15000)));
        return { oscs, nodes, timers };
      },

      'mallorca': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Waves with slow amp LFO
        const w = brownNoise(4);
        const wLP = biquad('lowpass', 1200, 0.4);
        const wG = gain(0.3);
        w.connect(wLP).connect(wG).connect(out);
        const wLFO = osc(0.12, 'sine'); const wLFOG = gain(0.18);
        wLFO.connect(wLFOG).connect(wG.gain);
        w.start(); wLFO.start();
        oscs.push(w, wLFO); nodes.push(wLP, wG, wLFOG);
        // Crickets
        const cr = whiteNoise(4);
        const crBP = biquad('bandpass', 4500, 14);
        const crG = gain(0.035);
        cr.connect(crBP).connect(crG).connect(out);
        cr.start();
        oscs.push(cr); nodes.push(crBP, crG);
        // Church bell
        const bell = () => {
          const t = ctx.currentTime;
          const f = osc(130, 'sine'), p = osc(520, 'sine');
          const fg = gain(0), pg = gain(0);
          f.connect(fg).connect(out); p.connect(pg).connect(out);
          fg.gain.setValueAtTime(0, t);
          fg.gain.linearRampToValueAtTime(0.14, t + 0.05);
          fg.gain.exponentialRampToValueAtTime(0.001, t + 3);
          pg.gain.setValueAtTime(0, t);
          pg.gain.linearRampToValueAtTime(0.045, t + 0.05);
          pg.gain.exponentialRampToValueAtTime(0.001, t + 2);
          f.start(t); p.start(t);
          f.stop(t + 3.1); p.stop(t + 2.1);
          setTimeout(() => { try { fg.disconnect(); pg.disconnect(); } catch(e) {} }, 3500);
          timers.push(setTimeout(bell, rand(40000, 90000)));
        };
        timers.push(setTimeout(bell, rand(12000, 30000)));
        return { oscs, nodes, timers };
      },

      'istanbul': (out) => {
        const oscs = [], nodes = [], timers = [];
        // D minor drone + 3rd harmonics
        [146.83, 174.61, 220].forEach((f, i) => {
          const o = osc(f, 'sine');
          const g = gain(0.075);
          o.connect(g).connect(out);
          const l = osc(0.08 + i * 0.03, 'sine');
          const lg = gain(f * 0.004);
          l.connect(lg).connect(o.frequency);
          o.start(); l.start();
          oscs.push(o, l); nodes.push(g, lg);
          const h = osc(f * 3, 'sine');
          const hg = gain(0.018);
          h.connect(hg).connect(out);
          h.start();
          oscs.push(h); nodes.push(hg);
        });
        // Seagulls
        const gull = () => {
          const t = ctx.currentTime;
          const n = whiteNoise(0.4);
          const bp = biquad('bandpass', 2500, 10);
          const gg = gain(0);
          n.connect(bp).connect(gg).connect(out);
          gg.gain.setValueAtTime(0, t);
          gg.gain.linearRampToValueAtTime(0.16, t + 0.03);
          gg.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          n.start(t); n.stop(t + 0.4);
          setTimeout(() => { try { bp.disconnect(); gg.disconnect(); } catch(e) {} }, 600);
          timers.push(setTimeout(gull, rand(15000, 45000)));
        };
        timers.push(setTimeout(gull, rand(6000, 15000)));
        // Ferry horn
        const ferry = () => {
          const t = ctx.currentTime;
          const o1 = osc(55, 'triangle'), o2 = osc(82, 'triangle');
          const fg = gain(0);
          o1.connect(fg); o2.connect(fg); fg.connect(out);
          fg.gain.setValueAtTime(0, t);
          fg.gain.linearRampToValueAtTime(0.22, t + 1.2);
          fg.gain.linearRampToValueAtTime(0, t + 4);
          o1.start(t); o2.start(t);
          o1.stop(t + 4.2); o2.stop(t + 4.2);
          setTimeout(() => { try { fg.disconnect(); } catch(e) {} }, 4500);
          timers.push(setTimeout(ferry, rand(60000, 120000)));
        };
        timers.push(setTimeout(ferry, rand(20000, 50000)));
        return { oscs, nodes, timers };
      },

      'mexico-city': (out) => {
        const oscs = [], nodes = [], timers = [];
        // Market murmur — filtered noise at conversation range
        const market = whiteNoise(4);
        const marketBP = biquad('bandpass', 450, 0.7);
        const marketG = gain(0.18);
        market.connect(marketBP).connect(marketG).connect(out);
        const mLFO = osc(0.22, 'sine'); const mLFOG = gain(0.1);
        mLFO.connect(mLFOG).connect(marketG.gain);
        market.start(); mLFO.start();
        oscs.push(market, mLFO); nodes.push(marketBP, marketG, mLFOG);
        // Altitude hiss — thin, high-pass
        const hiss = whiteNoise(3);
        const hissHP = biquad('highpass', 3000, 0.3);
        const hissG = gain(0.025);
        hiss.connect(hissHP).connect(hissG).connect(out);
        hiss.start();
        oscs.push(hiss); nodes.push(hissHP, hissG);
        // Distant mariachi hint — D minor triad via triangles (trumpet-ish)
        [293.66, 349.23, 440].forEach((f, i) => {
          const o = osc(f, 'triangle');
          const g = gain(0.015);
          o.connect(g).connect(out);
          const l = osc(0.1 + i * 0.04, 'sine');
          const lg = gain(f * 0.003);
          l.connect(lg).connect(o.frequency);
          o.start(); l.start();
          oscs.push(o, l); nodes.push(g, lg);
        });
        // Street dog bark
        const bark = () => {
          const t = ctx.currentTime;
          const n = whiteNoise(0.12);
          const bp = biquad('bandpass', 900, 6);
          const bg = gain(0);
          n.connect(bp).connect(bg).connect(out);
          bg.gain.setValueAtTime(0, t);
          bg.gain.linearRampToValueAtTime(0.14, t + 0.015);
          bg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          n.start(t); n.stop(t + 0.14);
          setTimeout(() => { try { bp.disconnect(); bg.disconnect(); } catch(e) {} }, 300);
          timers.push(setTimeout(bark, rand(18000, 50000)));
        };
        timers.push(setTimeout(bark, rand(7000, 20000)));
        // Catedral bell at :00 (random interval stand-in)
        const bell = () => {
          const t = ctx.currentTime;
          const f = osc(98, 'sine');   // G2 — big bell
          const p = osc(294, 'sine');  // 3rd harmonic of D
          const fg = gain(0), pg = gain(0);
          f.connect(fg).connect(out); p.connect(pg).connect(out);
          fg.gain.setValueAtTime(0, t);
          fg.gain.linearRampToValueAtTime(0.12, t + 0.04);
          fg.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
          pg.gain.setValueAtTime(0, t);
          pg.gain.linearRampToValueAtTime(0.035, t + 0.05);
          pg.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
          f.start(t); p.start(t);
          f.stop(t + 3.6); p.stop(t + 2.6);
          setTimeout(() => { try { fg.disconnect(); pg.disconnect(); } catch(e) {} }, 4000);
          timers.push(setTimeout(bell, rand(45000, 90000)));
        };
        timers.push(setTimeout(bell, rand(15000, 35000)));
        return { oscs, nodes, timers };
      },

      'tokyo': (out) => {
        const oscs = [], nodes = [], timers = [];
        // 50Hz AC hum (East Japan)
        const hum = osc(50, 'square');
        const humLP = biquad('lowpass', 200, 0.5);
        const humG = gain(0.04);
        hum.connect(humLP).connect(humG).connect(out);
        hum.start();
        oscs.push(hum); nodes.push(humLP, humG);
        // Neon whine
        const neon = osc(12000, 'sine');
        const neonG = gain(0.012);
        neon.connect(neonG).connect(out);
        neon.start();
        oscs.push(neon); nodes.push(neonG);
        // City bed
        const city = whiteNoise(4);
        const cLP = biquad('lowpass', 600, 0.4);
        const cG = gain(0.14);
        city.connect(cLP).connect(cG).connect(out);
        city.start();
        oscs.push(city); nodes.push(cLP, cG);
        // Station chime (E C A descending)
        const chime = () => {
          [659.25, 523.25, 440].forEach((f, i) => {
            const t = ctx.currentTime + i * 0.3;
            const o = osc(f, 'sine');
            const cg = gain(0);
            o.connect(cg).connect(out);
            cg.gain.setValueAtTime(0, t);
            cg.gain.linearRampToValueAtTime(0.1, t + 0.02);
            cg.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
            o.start(t); o.stop(t + 0.85);
            setTimeout(() => { try { cg.disconnect(); } catch(e) {} }, 1200);
          });
          timers.push(setTimeout(chime, rand(25000, 60000)));
        };
        timers.push(setTimeout(chime, rand(8000, 20000)));
        return { oscs, nodes, timers };
      },
    };

    // --- controller ---
    function startZone(card) {
      const profile = card.getAttribute('data-audio-profile');
      if (!profile || !PROFILES[profile]) return;
      if (zones.has(profile)) return;
      ensureCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const zoneGain = ctx.createGain();
      zoneGain.gain.value = 0;
      zoneGain.connect(masterGain);

      const handle = PROFILES[profile](zoneGain);
      zoneGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
      zones.set(profile, { card, zoneGain, handle });

      card.setAttribute('data-audio-on', 'true');
      const btn = card.querySelector('[data-role="audio-toggle"]');
      if (btn) {
        btn.setAttribute('aria-pressed', 'true');
        const icon = btn.querySelector('[data-role="audio-icon"]');
        if (icon) icon.textContent = '■';
      }
      updateMasterCount();
    }

    function stopZone(card) {
      const profile = card.getAttribute('data-audio-profile');
      const state = zones.get(profile);
      if (!state) return;
      const { zoneGain, handle } = state;
      zoneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setTimeout(() => {
        handle.oscs.forEach((o) => { try { o.stop(); } catch(e) {} });
        handle.timers.forEach((t) => clearTimeout(t));
        handle.nodes.forEach((n) => { try { n.disconnect(); } catch(e) {} });
        try { zoneGain.disconnect(); } catch(e) {}
      }, 500);
      zones.delete(profile);
      card.removeAttribute('data-audio-on');
      const btn = card.querySelector('[data-role="audio-toggle"]');
      if (btn) {
        btn.setAttribute('aria-pressed', 'false');
        const icon = btn.querySelector('[data-role="audio-icon"]');
        if (icon) icon.textContent = '▶';
      }
      updateMasterCount();
    }

    function updateMasterCount() {
      const el = document.querySelector('[data-role="audio-count"]');
      if (el) el.textContent = zones.size + ' playing';
      const muteBtn = document.querySelector('[data-role="audio-mute"]');
      if (muteBtn) muteBtn.hidden = zones.size === 0;
      const allBtn = document.querySelector('[data-role="audio-all"]');
      if (allBtn) {
        const allPossible = cards.length;
        allBtn.setAttribute('aria-pressed', zones.size === allPossible ? 'true' : 'false');
      }
    }

    // Per-card toggles
    cards.forEach((card) => {
      const btn = card.querySelector('[data-role="audio-toggle"]');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (card.getAttribute('data-audio-on') === 'true') stopZone(card);
        else startZone(card);
      });
    });

    // Master controls
    const allBtn = document.querySelector('[data-role="audio-all"]');
    const muteBtn = document.querySelector('[data-role="audio-mute"]');
    if (allBtn) {
      allBtn.addEventListener('click', () => {
        ensureCtx();
        if (ctx.state === 'suspended') ctx.resume();
        cards.forEach((c) => {
          if (c.getAttribute('data-audio-on') !== 'true') startZone(c);
        });
        // Dial master down — 7 zones at once needs headroom.
        if (masterGain) masterGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.4);
      });
    }
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        cards.forEach((c) => stopZone(c));
        if (masterGain && ctx) masterGain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.4);
      });
    }

    // Suspend audio when tab is hidden — polite to battery + attention.
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden && ctx.state === 'running') ctx.suspend();
      else if (!document.hidden && ctx.state === 'suspended' && zones.size > 0) ctx.resume();
    });
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": ogImage, "jsonLd": jsonLd, "data-astro-cid-mopounb4": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="clock-page"${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-mopounb4> <header class="clock-head" data-astro-cid-mopounb4> <p class="clock-head__kicker mono" data-astro-cid-mopounb4>
CH.${ch.code} · № ${data.id} </p> <h1 class="clock-head__title" data-astro-cid-mopounb4>${data.title}</h1> ${data.body && renderTemplate`<p class="clock-head__body" data-astro-cid-mopounb4>${data.body}</p>`} <p class="clock-head__links mono" data-astro-cid-mopounb4> <a${addAttribute(`/b/${data.id}`, "href")} data-astro-cid-mopounb4>← BLOCK</a> <span aria-hidden="true" data-astro-cid-mopounb4>·</span> <a${addAttribute(`/b/${data.id}.json`, "href")} data-astro-cid-mopounb4>JSON</a> </p> </header> <aside class="sky-ribbon" aria-label="Sky now" data-astro-cid-mopounb4> <div class="sky-ribbon__cell" data-astro-cid-mopounb4> <p class="sky-ribbon__kicker mono" data-astro-cid-mopounb4>MOON</p> <p class="sky-ribbon__value" data-astro-cid-mopounb4> <span class="sky-ribbon__glyph" aria-hidden="true" data-astro-cid-mopounb4>${moon.glyph}</span> ${moon.label} <span class="sky-ribbon__muted" data-astro-cid-mopounb4>· ${Math.round(moon.illumination * 100)}% lit · ${moonNextLabel}</span> </p> </div> ${shower && renderTemplate`<div class="sky-ribbon__cell" data-astro-cid-mopounb4> <p class="sky-ribbon__kicker mono" data-astro-cid-mopounb4> ${shower.inWindow ? "SHOWER" : "NEXT SHOWER"} </p> <p class="sky-ribbon__value" data-astro-cid-mopounb4> <span class="sky-ribbon__glyph" aria-hidden="true" data-astro-cid-mopounb4>${shower.shower.glyph}</span> ${shower.shower.name} <span class="sky-ribbon__muted" data-astro-cid-mopounb4>
· ${shower.daysUntil === 0 ? "peaks tonight" : shower.daysUntil > 0 ? `peak in ${shower.daysUntil}d` : `peak was ${-shower.daysUntil}d ago`}
· from ${shower.shower.radiant} </span> </p> </div>`} <div class="sky-ribbon__cell" data-astro-cid-mopounb4> <p class="sky-ribbon__kicker mono" data-astro-cid-mopounb4>COMING</p> <p class="sky-ribbon__value" data-astro-cid-mopounb4> <span class="sky-ribbon__glyph" aria-hidden="true" data-astro-cid-mopounb4>☼</span> ${nextMarker.label} <span class="sky-ribbon__muted" data-astro-cid-mopounb4>· in ${nextMarker.daysUntil}d</span> </p> </div> <div class="sky-ribbon__cell" data-astro-cid-mopounb4> <p class="sky-ribbon__kicker mono" data-astro-cid-mopounb4>ZODIAC</p> <p class="sky-ribbon__value" data-astro-cid-mopounb4> <span class="sky-ribbon__glyph" aria-hidden="true" data-astro-cid-mopounb4>${zodiac.glyph}</span>
Sun in ${zodiac.name} <span class="sky-ribbon__muted" data-astro-cid-mopounb4>· day ${zodiac.dayInSign}</span> </p> </div> </aside> ${pollEntry && renderTemplate`<aside class="clock-poll" aria-label="Companion poll" data-astro-cid-mopounb4> <p class="clock-poll__kicker mono" data-astro-cid-mopounb4>POLL · ZEITGEIST</p> <h2 class="clock-poll__question" data-astro-cid-mopounb4>${pollEntry.data.question}</h2> ${pollEntry.data.dek && renderTemplate`<p class="clock-poll__dek" data-astro-cid-mopounb4>${pollEntry.data.dek}</p>`} <ul class="clock-poll__options" data-astro-cid-mopounb4> ${pollEntry.data.options.map((o) => renderTemplate`<li data-astro-cid-mopounb4> <a${addAttribute(`/poll/${pollEntry.data.slug}?vote=${o.id}`, "href")} class="clock-poll__option" data-astro-cid-mopounb4> <span class="clock-poll__option-label" data-astro-cid-mopounb4>${o.label}</span> ${o.hint && renderTemplate`<span class="clock-poll__option-hint" data-astro-cid-mopounb4>${o.hint}</span>`} </a> </li>`)} </ul> <p class="clock-poll__cta mono" data-astro-cid-mopounb4> <a${addAttribute(`/poll/${pollEntry.data.slug}`, "href")} data-astro-cid-mopounb4>Vote + see where the group is going →</a> </p> </aside>`} ${hasAnyAudio && renderTemplate`<section class="clock-audio-master" aria-label="Sonic postcards" id="clock-audio-master" data-astro-cid-mopounb4> <div class="clock-audio-master__text" data-astro-cid-mopounb4> <p class="clock-audio-master__kicker mono" data-astro-cid-mopounb4>SONIC POSTCARDS · BETA</p> <p class="clock-audio-master__dek" data-astro-cid-mopounb4>Every zone carries a procedural ambient synthesized in your browser — wind over the Strand, Choate peepers, Istanbul ferry horn. No files, no licensing. Tap a <span class="mono" data-astro-cid-mopounb4>▶</span> on any card, or play the whole sky at once.</p> </div> <div class="clock-audio-master__controls" data-astro-cid-mopounb4> <button type="button" class="clock-audio-master__btn" data-role="audio-all" aria-pressed="false" data-astro-cid-mopounb4> <span class="mono" data-astro-cid-mopounb4>▶ PLAY ALL</span> </button> <button type="button" class="clock-audio-master__btn clock-audio-master__btn--mute" data-role="audio-mute" aria-pressed="false" hidden data-astro-cid-mopounb4> <span class="mono" data-astro-cid-mopounb4>⏹ MUTE ALL</span> </button> <span class="clock-audio-master__count mono" data-role="audio-count" aria-live="polite" data-astro-cid-mopounb4>0 playing</span> </div> </section>`} <section class="clock-grid" aria-label="World clock" data-astro-cid-mopounb4> ${zonesSky.map(({ zone: z, sun, planetaryHour: ph, season: se, latHemi, latAbs, equator, ritual, timeFormat, audioProfile }) => renderTemplate`<article class="clock-card"${addAttribute(z.tz, "data-tz")}${addAttribute(z.origin, "data-origin")}${addAttribute(z.lat, "data-lat")}${addAttribute(z.lon, "data-lon")}${addAttribute(timeFormat, "data-time-format")}${addAttribute(z.rituals ? JSON.stringify(z.rituals) : "", "data-rituals")}${addAttribute(audioProfile ?? void 0, "data-audio-profile")} data-astro-cid-mopounb4> <div class="clock-card__top" data-astro-cid-mopounb4> <div class="clock-card__top-text" data-astro-cid-mopounb4> <p class="clock-card__label" data-astro-cid-mopounb4> ${z.label} ${audioProfile && renderTemplate`<button type="button" class="clock-card__audio" data-role="audio-toggle"${addAttribute(`Play ambient sound of ${z.label}`, "aria-label")} aria-pressed="false"${addAttribute(`Procedural ambient — ${z.label}`, "title")} data-astro-cid-mopounb4> <span data-role="audio-icon" aria-hidden="true" data-astro-cid-mopounb4>▶</span> <span class="clock-card__audio-dot" data-role="audio-dot" aria-hidden="true" data-astro-cid-mopounb4></span> </button>`} </p> ${z.region && renderTemplate`<p class="clock-card__region" data-astro-cid-mopounb4>${z.region}</p>`} ${z.facts && Object.keys(z.facts).length > 0 && renderTemplate`<ul class="clock-card__facts mono" aria-label="Place stats" data-astro-cid-mopounb4> ${Object.entries(z.facts).map(([k, v]) => renderTemplate`<li data-astro-cid-mopounb4> <span class="clock-card__fact-key" data-astro-cid-mopounb4>${k}</span> <span class="clock-card__fact-val" data-astro-cid-mopounb4>${v}</span> </li>`)} </ul>`} <p class="clock-card__latline mono" data-astro-cid-mopounb4> ${latAbs}°${latHemi} <span class="clock-card__sep" aria-hidden="true" data-astro-cid-mopounb4>·</span> ${sun.isDay ? renderTemplate`<span data-astro-cid-mopounb4>sun ${Math.round(sun.altitudeDeg)}° up · ${sun.bearing}</span>` : renderTemplate`<span data-astro-cid-mopounb4>sun ${Math.abs(Math.round(sun.altitudeDeg))}° below</span>`} </p> <p class="clock-card__live-weather mono" data-role="live-weather" hidden data-astro-cid-mopounb4>—</p> </div>  <svg class="skydome" viewBox="0 0 100 100" aria-hidden="true" data-role="skydome" data-astro-cid-mopounb4>  <circle cx="50" cy="50" r="48" fill="#0B0E1F" data-astro-cid-mopounb4></circle>  <defs data-astro-cid-mopounb4> <radialGradient${addAttribute(`sky-grad-${data.id}-${z.label.replace(/[^a-zA-Z0-9]/g, "")}`, "id")} cx="50%" cy="50%" r="50%" data-astro-cid-mopounb4> <stop offset="0%" stop-color="#7FC5E8" data-astro-cid-mopounb4></stop> <stop offset="70%" stop-color="#D3E7F1" data-astro-cid-mopounb4></stop> <stop offset="95%" stop-color="#F7D7A8" data-astro-cid-mopounb4></stop> <stop offset="100%" stop-color="#D88A4A" data-astro-cid-mopounb4></stop> </radialGradient> </defs> ${sun.isDay && renderTemplate`<circle cx="50" cy="50" r="48"${addAttribute(`url(#sky-grad-${data.id}-${z.label.replace(/[^a-zA-Z0-9]/g, "")})`, "fill")} data-astro-cid-mopounb4></circle>`}  <circle cx="50" cy="50" r="48" fill="none" stroke="#12110E" stroke-opacity="0.25" stroke-width="0.8" data-astro-cid-mopounb4></circle>  <circle cx="50" cy="50" r="32" fill="none" stroke="#12110E" stroke-opacity="0.08" stroke-width="0.5" stroke-dasharray="1 2" data-astro-cid-mopounb4></circle> <circle cx="50" cy="50" r="16" fill="none" stroke="#12110E" stroke-opacity="0.08" stroke-width="0.5" stroke-dasharray="1 2" data-astro-cid-mopounb4></circle>  <g fill="var(--pc-ink-muted, #5F5E5A)" font-family="JetBrains Mono, monospace" font-size="7" text-anchor="middle" data-astro-cid-mopounb4> <text x="50" y="5.5" data-astro-cid-mopounb4>N</text> <text x="97" y="52.5" data-astro-cid-mopounb4>E</text> <text x="50" y="99" data-astro-cid-mopounb4>S</text> <text x="3" y="52.5" data-astro-cid-mopounb4>W</text> </g>  <circle data-role="sun-body"${addAttribute(sun.domeX, "cx")}${addAttribute(sun.domeY, "cy")}${addAttribute(sun.isDay ? 5.5 : 4, "r")}${addAttribute(sun.isDay ? "#FFE65C" : "#4A4770", "fill")}${addAttribute(sun.isDay ? "#FBB040" : "#2A2748", "stroke")} stroke-width="1"${addAttribute(sun.isDay ? "1" : "0.55", "opacity")} data-astro-cid-mopounb4></circle>  ${sun.isDay && sun.altitudeDeg > 30 && renderTemplate`<circle${addAttribute(sun.domeX, "cx")}${addAttribute(sun.domeY, "cy")} r="9" fill="none" stroke="#FBB040" stroke-opacity="0.35" stroke-width="0.6" data-astro-cid-mopounb4></circle>`} </svg> </div> <p class="clock-card__time mono" aria-live="off" data-astro-cid-mopounb4> <span class="clock-card__hm" data-role="hm" data-astro-cid-mopounb4>—:—</span><span class="clock-card__sec" data-role="sec" data-astro-cid-mopounb4>:—</span><span class="clock-card__ap" data-role="ap" data-astro-cid-mopounb4></span> </p> <p class="clock-card__date mono" data-role="date" data-astro-cid-mopounb4>—</p> <p class="clock-card__status mono" data-role="status" data-bucket="" data-astro-cid-mopounb4>—</p> <section${addAttribute(ritual ? "clock-card__vignette clock-card__vignette--active" : "clock-card__vignette", "class")} data-role="ritual" data-astro-cid-mopounb4> ${ritual ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-mopounb4": true }, { "default": async ($$result3) => renderTemplate` <p class="clock-card__vignette-line" data-role="vignette-line" data-astro-cid-mopounb4> ${ritual.glyph && renderTemplate`<span class="clock-card__vignette-glyph" aria-hidden="true" data-astro-cid-mopounb4>${ritual.glyph}</span>`} <span class="clock-card__vignette-label" data-astro-cid-mopounb4>${ritual.label}</span> </p> ${ritual.data && renderTemplate`<p class="clock-card__vignette-data mono" data-role="vignette-data" data-astro-cid-mopounb4>${ritual.data}</p>`}` })}` : renderTemplate`<p class="clock-card__vignette-line" data-astro-cid-mopounb4> <span class="clock-card__vignette-quiet" data-astro-cid-mopounb4>quiet hour</span> </p>`} </section> <div class="clock-card__sky" aria-label="Sky here" data-astro-cid-mopounb4> <p class="clock-card__sky-line mono" data-astro-cid-mopounb4> <span aria-hidden="true" data-astro-cid-mopounb4>↑</span> <span data-role="sunrise" data-astro-cid-mopounb4>${sun.sunriseLocal}</span> <span class="clock-card__sky-muted" data-astro-cid-mopounb4>· ${sun.dayLength}</span> <span aria-hidden="true" data-astro-cid-mopounb4>↓</span> <span data-role="sunset" data-astro-cid-mopounb4>${sun.sunsetLocal}</span> </p> ${ph && renderTemplate`<p class="clock-card__sky-line mono" data-role="phour" data-astro-cid-mopounb4> <span aria-hidden="true" data-astro-cid-mopounb4>${ph.glyph}</span> <span data-role="phour-planet" data-astro-cid-mopounb4>${ph.planet}</span> <span class="clock-card__sky-sep" data-astro-cid-mopounb4>hour</span> <span class="clock-card__sky-muted" data-role="phour-meta" data-astro-cid-mopounb4>
· ${ph.index} of 12 · ${ph.phase} </span> </p>`} <p class="clock-card__sky-line mono" data-role="season" data-astro-cid-mopounb4> <span aria-hidden="true" data-astro-cid-mopounb4>${se.glyph}</span> ${se.name} <span class="clock-card__sky-muted" data-astro-cid-mopounb4>· day ${se.dayOfSeason} of ${se.lengthDays}</span> </p> ${z.seasonal && renderTemplate`<p class="clock-card__seasonal" data-astro-cid-mopounb4>${z.seasonal}</p>`} </div> ${z.landmarks && z.landmarks.length > 0 && renderTemplate`<section class="clock-card__landmarks" aria-label="Nearby" data-astro-cid-mopounb4> <p class="clock-card__landmarks-kicker mono" data-astro-cid-mopounb4>NEARBY</p> <ul class="clock-card__landmarks-list" data-astro-cid-mopounb4> ${z.landmarks.map((l) => renderTemplate`<li data-astro-cid-mopounb4>${l}</li>`)} </ul> </section>`} <p class="clock-card__tz mono"${addAttribute(z.tz, "title")} data-astro-cid-mopounb4>${z.tz}</p> </article>`)} </section> <footer class="clock-foot mono" data-astro-cid-mopounb4> <p data-astro-cid-mopounb4>
Tick interval · 1s for the hour · 60s for the sky. Sun, moon,
        planetary hour, season, and the meteor calendar are all pure math
        from <code data-astro-cid-mopounb4>(lat, lon, date, now)</code> — no APIs, no keys.
<code data-astro-cid-mopounb4>Intl.DateTimeFormat</code> handles DST in the browser.
</p> </footer> </div> ` }), renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/clock/[id].astro?astro&type=script&index=0&lang.ts"));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/clock/[id].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/clock/[id].astro";
const $$url = "/clock/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
