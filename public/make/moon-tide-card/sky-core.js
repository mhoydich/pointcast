/* Moon and tide mood card: pure sky arithmetic. No DOM, no network.
   Moon phase: low-precision method from Jean Meeus, Astronomical Algorithms, ch. 47-48
   (mean elongation and anomalies, phase angle with the six largest terms).
   Sun: a cosine fit of solar declination. Tide band: an illustrative semidiurnal wave.
   All of it is approximate. None of it is a tide table. */
(function (root) {
  'use strict';
  var RAD = Math.PI / 180;
  var SYNODIC = 29.530588853;

  function norm360(a) { a %= 360; return a < 0 ? a + 360 : a; }
  function julianDay(ms) { return ms / 86400000 + 2440587.5; }
  // date: 'YYYY-MM-DD', hour 0..23, treated as Universal Time
  function instant(date, hour) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return NaN;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], hour || 0, 0, 0);
  }

  function moon(ms) {
    var jd = julianDay(ms);
    var T = (jd - 2451545.0) / 36525;
    var D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868);
    var M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
    var Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699);
    var i = 180 - D
      - 6.289 * Math.sin(Mp * RAD)
      + 2.100 * Math.sin(M * RAD)
      - 1.274 * Math.sin((2 * D - Mp) * RAD)
      - 0.658 * Math.sin(2 * D * RAD)
      - 0.214 * Math.sin(2 * Mp * RAD)
      - 0.110 * Math.sin(D * RAD);
    i = norm360(i);
    var k = (1 + Math.cos(i * RAD)) / 2;
    // elongation along the cycle, 0 new, 180 full; from the phase angle and the waxing side
    var waxing = D < 180;
    var elong = waxing ? 180 - (i > 180 ? 360 - i : i) : 180 + (i > 180 ? 360 - i : i);
    elong = norm360(elong);
    return {
      jd: jd, phaseAngle: i, illumination: k, waxing: waxing, elongation: elong,
      age: elong / 360 * SYNODIC, name: phaseName(elong)
    };
  }
  var NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  function phaseName(elong) { return NAMES[Math.floor(norm360(elong + 22.5) / 45) % 8]; }

  function dayOfYear(ms) {
    var d = new Date(ms);
    return Math.floor((ms - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1;
  }
  function sunDeclination(ms) {
    return -23.44 * Math.cos(2 * Math.PI / 365.24 * (dayOfYear(ms) + 10));
  }
  // altitude in degrees at a local solar hour
  function sunAltitude(lat, decl, hour) {
    var h = (hour - 12) * 15 * RAD;
    var s = Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(h);
    return Math.asin(Math.max(-1, Math.min(1, s))) / RAD;
  }
  // hours of daylight (geometric, no refraction)
  function dayLength(lat, decl) {
    var c = -Math.tan(lat * RAD) * Math.tan(decl * RAD);
    if (c <= -1) return 24;
    if (c >= 1) return 0;
    return 2 * Math.acos(c) / RAD / 15;
  }

  var M2 = 12.4206; // principal lunar semidiurnal period, hours
  // An illustrative wave: high water near the moon's transit, bigger near new and full.
  function tideModel(m) {
    var amp = 0.55 + 0.45 * Math.cos(2 * m.elongation * RAD);
    var transit = (12 + m.elongation / 15) % 24; // the moon crosses the meridian later each day
    return {
      amp: amp, transit: transit, period: M2,
      at: function (hour) { return amp * Math.cos(2 * Math.PI * (hour - transit) / M2); },
      spring: amp > 0.8, neap: amp < 0.3
    };
  }

  function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

  root.SkyCore = {
    SYNODIC: SYNODIC, NAMES: NAMES, julianDay: julianDay, instant: instant, moon: moon, phaseName: phaseName,
    dayOfYear: dayOfYear, sunDeclination: sunDeclination, sunAltitude: sunAltitude, dayLength: dayLength,
    tideModel: tideModel, smooth: smooth
  };
})(typeof window !== 'undefined' ? window : globalThis);
