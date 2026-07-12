const MS_PER_DAY = 864e5;
const J2000 = 2451545;
function rad(deg2) {
  return deg2 * Math.PI / 180;
}
function deg(rad2) {
  return rad2 * 180 / Math.PI;
}
function julianDay(date) {
  return date.getTime() / MS_PER_DAY + 24405875e-1;
}
function utcMidnight(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
const MOON_SYNODIC = 29.530588853;
const MOON_REF_NEW = 245154926e-2;
function moonPhase(now = /* @__PURE__ */ new Date()) {
  const jd = julianDay(now);
  const rawAge = (jd - MOON_REF_NEW) % MOON_SYNODIC;
  const age = (rawAge + MOON_SYNODIC) % MOON_SYNODIC;
  const illumination = (1 - Math.cos(2 * Math.PI * age / MOON_SYNODIC)) / 2;
  const seg = MOON_SYNODIC / 8;
  let phase;
  let glyph;
  let label;
  if (age < seg * 0.5 || age >= MOON_SYNODIC - seg * 0.5) {
    phase = "new";
    glyph = "🌑";
    label = "new moon";
  } else if (age < seg * 1.5) {
    phase = "waxing-crescent";
    glyph = "🌒";
    label = "waxing crescent";
  } else if (age < seg * 2.5) {
    phase = "first-quarter";
    glyph = "🌓";
    label = "first quarter";
  } else if (age < seg * 3.5) {
    phase = "waxing-gibbous";
    glyph = "🌔";
    label = "waxing gibbous";
  } else if (age < seg * 4.5) {
    phase = "full";
    glyph = "🌕";
    label = "full moon";
  } else if (age < seg * 5.5) {
    phase = "waning-gibbous";
    glyph = "🌖";
    label = "waning gibbous";
  } else if (age < seg * 6.5) {
    phase = "last-quarter";
    glyph = "🌗";
    label = "last quarter";
  } else {
    phase = "waning-crescent";
    glyph = "🌘";
    label = "waning crescent";
  }
  const daysToFull = (MOON_SYNODIC / 2 - age + MOON_SYNODIC) % MOON_SYNODIC;
  const daysToNew = (MOON_SYNODIC - age) % MOON_SYNODIC;
  const nextFullAt = new Date(now.getTime() + daysToFull * MS_PER_DAY);
  const nextNewAt = new Date(now.getTime() + daysToNew * MS_PER_DAY);
  return { age, illumination, phase, glyph, label, nextFullAt, nextNewAt };
}
function sunTimes(date, lat, lon, now = date) {
  const utc0Ms = utcMidnight(date);
  const jdLocalNoon = utc0Ms / MS_PER_DAY + 24405875e-1 + 0.5 - lon / 360;
  const T = (jdLocalNoon - J2000) / 36525;
  const L0 = ((280.46646 + T * (36000.76983 + T * 3032e-7)) % 360 + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 1537e-7 * T);
  const e = 0.016708634 - T * (42037e-9 + 1267e-10 * T);
  const C = Math.sin(rad(M)) * (1.914602 - T * (4817e-6 + 14e-6 * T)) + Math.sin(rad(2 * M)) * (0.019993 - 101e-6 * T) + Math.sin(rad(3 * M)) * 289e-6;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const appLong = trueLong - 569e-5 - 478e-5 * Math.sin(rad(omega));
  const seconds = 21.448 - T * (46.815 + T * (59e-5 - T * 1813e-6));
  const mEpsilon = 23 + (26 + seconds / 60) / 60;
  const epsilon = mEpsilon + 256e-5 * Math.cos(rad(omega));
  const decl = deg(Math.asin(Math.sin(rad(epsilon)) * Math.sin(rad(appLong))));
  const y = Math.tan(rad(epsilon / 2)) ** 2;
  const eqTime = 4 * deg(
    y * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - 0.5 * y * y * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M))
  );
  const cosHA = (Math.cos(rad(90.833)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) / (Math.cos(rad(lat)) * Math.cos(rad(decl)));
  const solarNoonMin = 720 - 4 * lon - eqTime;
  const solarNoon = new Date(utc0Ms + solarNoonMin * 6e4);
  let sunrise = null;
  let sunset = null;
  let dayLengthMs;
  if (cosHA > 1) {
    dayLengthMs = 0;
  } else if (cosHA < -1) {
    dayLengthMs = MS_PER_DAY;
  } else {
    const haMin = 4 * deg(Math.acos(cosHA));
    sunrise = new Date(utc0Ms + (solarNoonMin - haMin) * 6e4);
    sunset = new Date(utc0Ms + (solarNoonMin + haMin) * 6e4);
    dayLengthMs = sunset.getTime() - sunrise.getTime();
  }
  const nowMin = (now.getTime() - utc0Ms) / 6e4;
  const haNow = (nowMin - solarNoonMin) / 4;
  const altitudeRad = Math.asin(
    Math.sin(rad(lat)) * Math.sin(rad(decl)) + Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(haNow))
  );
  const altitudeDeg = deg(altitudeRad);
  const cosAz = (Math.sin(rad(decl)) - Math.sin(altitudeRad) * Math.sin(rad(lat))) / (Math.cos(altitudeRad) * Math.cos(rad(lat)));
  const cosAzClamped = Math.max(-1, Math.min(1, cosAz));
  let azimuthDeg = deg(Math.acos(cosAzClamped));
  if (haNow > 0) azimuthDeg = 360 - azimuthDeg;
  const isDay = altitudeDeg > -0.833;
  return { sunrise, sunset, solarNoon, dayLengthMs, altitudeDeg, azimuthDeg, isDay };
}
const CHALDEAN = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const DAY_RULER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const PLANET_GLYPH = {
  Saturn: "♄",
  Jupiter: "♃",
  Mars: "♂",
  Sun: "☉",
  Venus: "♀",
  Mercury: "☿",
  Moon: "☽"
};
function localDayOfWeek(date, tz) {
  const name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[name] ?? 0;
}
function planetaryHour(now, lat, lon, tz) {
  const today = sunTimes(now, lat, lon, now);
  const t = now.getTime();
  let phase;
  let blockStart;
  let blockEnd;
  let rulerDay;
  if (today.sunrise && today.sunset && t >= today.sunrise.getTime() && t < today.sunset.getTime()) {
    phase = "day";
    blockStart = today.sunrise;
    blockEnd = today.sunset;
    rulerDay = today.sunrise;
  } else if (today.sunset && t >= today.sunset.getTime()) {
    phase = "night";
    blockStart = today.sunset;
    const tomorrow = sunTimes(new Date(now.getTime() + MS_PER_DAY), lat, lon);
    if (!tomorrow.sunrise) return null;
    blockEnd = tomorrow.sunrise;
    rulerDay = today.sunset;
  } else {
    phase = "night";
    const yesterday = sunTimes(new Date(now.getTime() - MS_PER_DAY), lat, lon);
    if (!yesterday.sunset || !today.sunrise) return null;
    blockStart = yesterday.sunset;
    blockEnd = today.sunrise;
    rulerDay = yesterday.sunset;
  }
  const totalMs = blockEnd.getTime() - blockStart.getTime();
  if (totalMs <= 0) return null;
  const hourLengthMs = totalMs / 12;
  const index = Math.min(12, Math.floor((t - blockStart.getTime()) / hourLengthMs) + 1);
  const dow = localDayOfWeek(rulerDay, tz);
  const rulerPlanet = DAY_RULER[dow];
  const rulerIdx = CHALDEAN.indexOf(rulerPlanet);
  const advance = phase === "day" ? index - 1 : index - 1 + 12;
  const planet = CHALDEAN[(rulerIdx + advance) % 7];
  const startsAt = new Date(blockStart.getTime() + (index - 1) * hourLengthMs);
  const endsAt = new Date(blockStart.getTime() + index * hourLengthMs);
  return {
    planet,
    glyph: PLANET_GLYPH[planet],
    index,
    phase,
    hourLengthMs,
    startsAt,
    endsAt
  };
}
const SEASON_GLYPH = {
  spring: "🌱",
  summer: "🌻",
  autumn: "🍂",
  winter: "❄️"
};
function seasonBoundaries(year) {
  return [
    { at: new Date(Date.UTC(year - 1, 11, 21)), nameN: "winter" },
    { at: new Date(Date.UTC(year, 2, 20)), nameN: "spring" },
    { at: new Date(Date.UTC(year, 5, 21)), nameN: "summer" },
    { at: new Date(Date.UTC(year, 8, 22)), nameN: "autumn" },
    { at: new Date(Date.UTC(year, 11, 21)), nameN: "winter" },
    { at: new Date(Date.UTC(year + 1, 2, 20)), nameN: "spring" }
  ];
}
const SOUTH_FLIP = {
  spring: "autumn",
  summer: "winter",
  autumn: "spring",
  winter: "summer"
};
function season(now, lat) {
  const hemisphere = lat >= 0 ? "N" : "S";
  const y = now.getUTCFullYear();
  const t = now.getTime();
  const bounds = seasonBoundaries(y);
  let current = bounds[0];
  let next = bounds[1];
  for (let i = 0; i < bounds.length - 1; i++) {
    if (t >= bounds[i].at.getTime() && t < bounds[i + 1].at.getTime()) {
      current = bounds[i];
      next = bounds[i + 1];
      break;
    }
  }
  const nameN = current.nameN;
  const name = hemisphere === "N" ? nameN : SOUTH_FLIP[nameN];
  const lengthDays = Math.round((next.at.getTime() - current.at.getTime()) / MS_PER_DAY);
  const dayOfSeason = Math.floor((t - current.at.getTime()) / MS_PER_DAY) + 1;
  return { name, glyph: SEASON_GLYPH[name], dayOfSeason, lengthDays, hemisphere };
}
const MARKER_LABEL = {
  "vernal-equinox": "vernal equinox",
  "summer-solstice": "summer solstice",
  "autumnal-equinox": "autumnal equinox",
  "winter-solstice": "winter solstice"
};
function nextEquinoxOrSolstice(now = /* @__PURE__ */ new Date()) {
  const y = now.getUTCFullYear();
  const t = now.getTime();
  const markers = [
    { name: "vernal-equinox", at: new Date(Date.UTC(y, 2, 20)) },
    { name: "summer-solstice", at: new Date(Date.UTC(y, 5, 21)) },
    { name: "autumnal-equinox", at: new Date(Date.UTC(y, 8, 22)) },
    { name: "winter-solstice", at: new Date(Date.UTC(y, 11, 21)) },
    { name: "vernal-equinox", at: new Date(Date.UTC(y + 1, 2, 20)) }
  ];
  const next = markers.find((m) => m.at.getTime() > t) ?? markers[markers.length - 1];
  const daysUntil = Math.ceil((next.at.getTime() - t) / MS_PER_DAY);
  return { name: next.name, at: next.at, daysUntil, label: MARKER_LABEL[next.name] };
}
const ZODIAC = [
  { name: "Capricorn", glyph: "♑", startMonth: 12, startDay: 22 },
  { name: "Aquarius", glyph: "♒", startMonth: 1, startDay: 20 },
  { name: "Pisces", glyph: "♓", startMonth: 2, startDay: 19 },
  { name: "Aries", glyph: "♈", startMonth: 3, startDay: 21 },
  { name: "Taurus", glyph: "♉", startMonth: 4, startDay: 20 },
  { name: "Gemini", glyph: "♊", startMonth: 5, startDay: 21 },
  { name: "Cancer", glyph: "♋", startMonth: 6, startDay: 21 },
  { name: "Leo", glyph: "♌", startMonth: 7, startDay: 23 },
  { name: "Virgo", glyph: "♍", startMonth: 8, startDay: 23 },
  { name: "Libra", glyph: "♎", startMonth: 9, startDay: 23 },
  { name: "Scorpio", glyph: "♏", startMonth: 10, startDay: 23 },
  { name: "Sagittarius", glyph: "♐", startMonth: 11, startDay: 22 }
];
function zodiacOfDate(now = /* @__PURE__ */ new Date()) {
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  for (let i = ZODIAC.length - 1; i >= 0; i--) {
    const s = ZODIAC[i];
    if (s.startMonth < m || s.startMonth === m && s.startDay <= d) {
      const start2 = new Date(Date.UTC(now.getUTCFullYear(), s.startMonth - 1, s.startDay));
      const dayInSign2 = Math.floor((now.getTime() - start2.getTime()) / MS_PER_DAY) + 1;
      return { name: s.name, glyph: s.glyph, dayInSign: dayInSign2 };
    }
  }
  const cap = ZODIAC[0];
  const start = new Date(Date.UTC(now.getUTCFullYear() - 1, cap.startMonth - 1, cap.startDay));
  const dayInSign = Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  return { name: cap.name, glyph: cap.glyph, dayInSign };
}

export { season as a, moonPhase as m, nextEquinoxOrSolstice as n, planetaryHour as p, sunTimes as s, zodiacOfDate as z };
