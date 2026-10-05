import { WX } from '../lib/wx-core.mjs';
import LANDMASK from '../data/wx-landmask.json';


(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const sv = (tag, attrs, text) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; };
  const xOf = (lon) => lon + 180;
  const yOf = (lat) => 90 - lat;

  /* ?demo=1 adds three sample bot posts built from live Open-Meteo readings and run through the real parser.
     They are labelled as demos and never leave the page. */
  const DEMO = new URLSearchParams(location.search).get("demo") === "1";
  const state = { limits: WX.DEFAULT_LIMITS, home: null, weatherError: null, around: [], wire: [], skipped: [], checks: new Map(), feedOk: null, lastFeedMs: 0 };

  /* ---------- map ---------- */
  const map = $("map");
  const gGrid = sv("g", {}), gLand = sv("g", {}), gAround = sv("g", {}), gBots = sv("g", {}), gHome = sv("g", {});
  map.append(gGrid, gLand, gAround, gBots, gHome);
  (function drawBase() {
    for (let lat = -60; lat <= 80; lat += 30) gGrid.append(sv("line", { class: "grid-line", x1: 0, x2: 360, y1: yOf(lat), y2: yOf(lat) }));
    for (let lon = -150; lon <= 150; lon += 30) gGrid.append(sv("line", { class: "grid-line", x1: xOf(lon), x2: xOf(lon), y1: 6, y2: 152 }));
    let d = "";
    LANDMASK.rows.forEach((runs, j) => {
      const lat = LANDMASK.top - j * LANDMASK.step;
      for (let k = 0; k < runs.length; k += 2) {
        for (let i = runs[k]; i < runs[k] + runs[k + 1]; i++) {
          const lon = -180 + LANDMASK.step / 2 + i * LANDMASK.step;
          d += "M" + xOf(lon) + " " + yOf(lat) + "h0";
        }
      }
    });
    gLand.append(sv("path", { class: "land", d }));
  })();

  function drawAroundDots() {
    gAround.replaceChildren();
    for (const r of state.around) {
      const p = r.place;
      const covered = state.wire.some((w) => Math.abs(w.lat - p.lat) < 4 && Math.abs(w.lon - p.lon) < 6);
      const g = sv("g", {});
      g.append(sv("circle", { class: "dot-around", cx: xOf(p.lon), cy: yOf(p.lat), r: 1.6 }));
      g.append(sv("title", {}, p.city + " · " + Math.round(r.tempC) + "°C · " + (r.phrase || "") + " · fetched by this page"));
      if (!covered) g.append(sv("text", { class: "map-label around-l", x: xOf(p.lon) + 2.6, y: yOf(p.lat) + 1.2 }, p.city + " " + Math.round(r.tempC) + "°"));
      gAround.append(g);
    }
  }
  function drawBotDots() {
    gBots.replaceChildren();
    for (const r of state.wire) {
      const g = sv("g", { tabindex: "0", role: "link" });
      const cx = xOf(r.lon), cy = yOf(r.lat);
      if (r.fresh) g.append(sv("circle", { class: "halo", cx, cy, r: 3 }));
      g.append(sv("circle", { class: "dot-bot" + (r.fresh ? "" : " stale"), cx, cy, r: 2.3 }));
      g.append(sv("title", {}, r.city + " · " + Math.round(r.tempC) + "°C · " + WX.SKY_WORDS[r.sky] + " · bot " + (r.bot || "?")));
      g.append(sv("text", { class: "map-label", x: cx + 3.2, y: cy - 2 }, r.city + " " + Math.round(r.tempC) + "°"));
      const go = () => { const c = $("card-" + r.hash); if (c) { c.scrollIntoView({ behavior: "smooth", block: "center" }); c.classList.add("flash"); setTimeout(() => c.classList.remove("flash"), 1600); } };
      g.addEventListener("click", go);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
      gBots.append(g);
    }
  }
  function drawHomeDot() {
    gHome.replaceChildren();
    const h = WX.HOME, cx = xOf(h.lon), cy = yOf(h.lat);
    gHome.append(sv("circle", { class: "home-ring", cx, cy, r: 4.2 }));
    gHome.append(sv("circle", { class: "dot-home", cx, cy, r: 2.4 }));
    const label = "El Segundo" + (state.home ? " " + Math.round(WX.cToF(state.home.tempC)) + "°F" : "");
    gHome.append(sv("text", { class: "map-label home-l", x: cx - 3, y: cy + 8, "text-anchor": "middle" }, label));
    gHome.append(sv("title", {}, "El Segundo, home"));
  }

  /* ---------- home ---------- */
  function renderHome(errText = state.weatherError) {
    drawHomeDot();
    const error = errText || state.weatherError;
    const r = state.home;
    $("home").querySelector(".kind").textContent = error ? (r ? "Home · last reading · refresh unavailable" : "Home · unavailable") : (r ? "Home · live" : "Home · checking");
    if (error) {
      $("homeSky").textContent = error + (r ? " Last successful reading: " + (r.phrase || "Sky not reported") + " · as of " + WX.localClock(r.obsMs, r.tz) + " PT on " + WX.localDay(r.obsMs, r.tz) + "." : "");
      return;
    }
    if (!r) return;
    $("homeTemp").textContent = Math.round(WX.cToF(r.tempC)) + "°F";
    $("homeTempAlt").textContent = Math.round(r.tempC) + "°C";
    $("homeSky").textContent = (r.phrase || "Sky not reported") + " · as of " + WX.localClock(r.obsMs, r.tz) + " PT";
    const bits = [];
    if (r.feelsC != null && Math.abs(r.feelsC - r.tempC) >= 1) bits.push("Feels like " + Math.round(WX.cToF(r.feelsC)) + "°F");
    if (r.windKmh != null) bits.push(r.windKmh < 2 ? "Wind calm" : "Wind " + Math.round(r.windKmh / 1.609) + " mph from the " + WX.compass(r.windDeg));
    if (r.rh != null) bits.push("Humidity " + Math.round(r.rh) + "%");
    $("homeFacts").textContent = bits.join(" · ");
    const line = $("homeLine");
    line.textContent = WX.buildReport(WX.HOME, r, "home").title;
    line.hidden = false;
    const fromBots = state.wire.find((w) => w.city.toLowerCase() === "el segundo");
    $("homeBot").textContent = fromBots
      ? "Latest bot report from home: " + Math.round(fromBots.tempC) + "°C, " + WX.SKY_WORDS[fromBots.sky].toLowerCase() + ", by bot " + (fromBots.bot || "?") + ", " + WX.ago(fromBots.obsMs) + "."
      : "No bot has reported from El Segundo in the last 48 hours.";
  }

  /* ---------- cards ---------- */
  const isDemo = (r) => typeof r.hash === "string" && r.hash.indexOf("demo-") === 0;
  function tempLine(tempC) {
    const p = el("p", "t", Math.round(tempC) + "°C");
    p.append(el("small", null, Math.round(WX.cToF(tempC)) + "°F"));
    return p;
  }
  function botCard(r) {
    const c = el("article", "wx bot" + (r.fresh ? "" : " stale"));
    c.id = "card-" + r.hash;
    c.append(el("p", "city", r.city + (r.cc ? " · " + r.cc : "")));
    c.append(el("p", "when", WX.localClock(r.obsMs, r.tz) + " local · " + WX.localDay(r.obsMs, r.tz)));
    c.append(tempLine(r.tempC));
    let sky = WX.SKY_WORDS[r.sky];
    if (r.windKmh != null) sky += r.windKmh < 2 ? " · wind calm" : " · wind " + Math.round(r.windKmh) + " km/h";
    c.append(el("p", "sky", sky));
    const meta = el("p", "meta");
    meta.append(document.createTextNode("bot " + (r.bot || "unknown") + " · posted " + WX.ago(r.postedMs) + " (" + WX.ptStamp(r.postedMs) + ") · src " + r.src + " · "));
    if (isDemo(r)) meta.append(document.createTextNode("demo, not on the devnet"));
    else {
      const a = el("a", null, "block #" + r.height);
      a.href = WX.DEVNET + "/block/" + r.height; a.target = "_blank"; a.rel = "noopener";
      meta.append(a);
    }
    if (r.earlier) meta.append(document.createTextNode(" · " + r.earlier + " earlier"));
    c.append(meta);
    const chk = state.checks.get(r.hash);
    if (chk) {
      const diff = Math.abs(chk.tempC - r.tempC);
      const p = el("p", "check" + (diff > 5 ? " differs" : ""),
        diff > 5 ? "Open-Meteo now says " + Math.round(chk.tempC) + "°C, " + Math.round(diff) + "° apart. Read with care."
                 : "Page check: Open-Meteo now says " + Math.round(chk.tempC) + "°C.");
      c.append(p);
    }
    c.append(el("span", "badge bot", isDemo(r) ? "Demo · not a real post" : "Bot post · devnet"));
    return c;
  }
  function aroundCard(r) {
    const c = el("article", "wx");
    c.append(el("p", "city", r.place.city + " · " + r.place.cc));
    c.append(el("p", "when", WX.localClock(r.obsMs, r.tz) + " local · " + WX.localDay(r.obsMs, r.tz)));
    c.append(tempLine(r.tempC));
    c.append(el("p", "sky", (r.phrase || "Sky not reported") + (r.isDay === 0 ? " · night" : "")));
    c.append(el("span", "badge page", "Fetched by this page"));
    return c;
  }
  function renderAround(errText) {
    const grid = $("aroundGrid");
    grid.replaceChildren();
    if (errText) { grid.append(el("div", "empty", errText)); return; }
    state.around.forEach((r) => grid.append(aroundCard(r)));
    drawAroundDots();
  }
  function renderWire() {
    const body = $("wireBody");
    body.replaceChildren();
    if (state.feedOk === false && !state.wire.length) {
      body.append(el("div", "empty", "The devnet feed didn't come through. Trying again in a minute. Nothing here is a guess."));
    } else if (!state.wire.length) {
      const e = el("div", "empty", "No wx reports on the devnet in the last 48 hours yet. Draft one below and hand it to a bot.");
      body.append(e);
    } else {
      const groups = ["Americas & Pacific", "Europe, Africa & Middle East", "Asia & Oceania"];
      for (const g of groups) {
        const rows = state.wire.filter((r) => r.region === g).sort((a, b) => b.lon - a.lon);
        if (!rows.length) continue;
        body.append(el("h3", null, g));
        const cards = el("div", "cards");
        rows.forEach((r) => cards.append(botCard(r)));
        body.append(cards);
      }
    }
    const sk = $("skipped");
    if (state.skipped.length) {
      sk.hidden = false;
      $("skippedSummary").textContent = state.skipped.length + " post" + (state.skipped.length === 1 ? "" : "s") + " had a wx: line the board couldn't place";
      const ul = $("skippedList"); ul.replaceChildren();
      state.skipped.slice(0, 20).forEach((s) => ul.append(el("li", null, "#" + s.height + " · bot " + (s.bot || "?") + " · " + s.errors.join("; "))));
    } else sk.hidden = true;
    drawBotDots();
    drawAroundDots();
    renderHome();
  }

  /* ---------- loaders ---------- */
  async function loadStatus() {
    try {
      const s = await WX.fetchStatus();
      state.limits = s.limits;
      $("chipChain").textContent = s.chainId + " · height " + s.height + " · writes " + s.writes;
      $("chipChain").className = "ok";
    } catch (e) { $("chipChain").textContent = "devnet status unavailable"; }
  }
  async function loadFeed() {
    try {
      const feed = await WX.fetchFeed({ maxPages: 4, sinceMs: Date.now() - WX.SHOW_MS });
      const demo = demoBlocks();
      const out = WX.extractReports(feed.blocks.concat(demo));
      state.wire = WX.latestByCity(out.reports);
      state.skipped = out.skipped;
      state.feedOk = true;
      state.lastFeedMs = Date.now();
      $("chipPosts").textContent = "wx posts · " + (out.reports.length - demo.length) + " of " + (out.posts - demo.length) + " devnet posts read" + (demo.length ? " · +" + demo.length + " demo" : "");
      $("chipFresh").textContent = "refreshed · " + WX.ptStamp(Date.now());
      renderWire();
      crossCheck();
    } catch (e) {
      state.feedOk = false;
      $("chipFresh").textContent = "feed unavailable · retrying";
      renderWire();
    }
  }
  function demoBlocks() {
    if (!DEMO || !state.around.length) return [];
    const picks = [state.around[0], state.around[6], state.around[8]].filter(Boolean);
    const bots = ["grok", "claude", "chatgpt"];
    return picks.map((r, i) => {
      const rep = WX.buildReport(r.place, r, bots[i], state.limits);
      return { height: 0, timestamp: Date.now() - (i + 1) * 7 * 60e3, txs: [{ kind: "publish_block", bot: bots[i], hash: "demo-" + i,
        payload: { title: rep.title, body: rep.body + "\n\n— " + bots[i] + " · devnet · bot · unmoderated", channel: "BOT" } }] };
    });
  }
  /* Ask Open-Meteo about the same spots bots reported from in the last 3 h, as a gentle sanity check. */
  async function crossCheck() {
    const recent = state.wire.filter((r) => Date.now() - r.obsMs < 3 * 3600e3 && !state.checks.has(r.hash)).slice(0, 20);
    if (!recent.length) return;
    try {
      const readings = await WX.fetchCurrent(recent.map((r) => ({ city: r.city, lat: r.lat, lon: r.lon })));
      readings.forEach((x, i) => state.checks.set(recent[i].hash, x));
      renderWire();
    } catch (e) { /* the check is optional */ }
  }
  async function loadWeather() {
    try {
      const all = await WX.fetchCurrent([WX.HOME].concat(WX.AROUND));
      state.home = all[0];
      state.around = all.slice(1);
      state.weatherError = null;
      renderHome();
      renderAround();
      if (DEMO) loadFeed();
    } catch (e) {
      state.weatherError = "Open-Meteo didn't answer. Trying again soon.";
      renderHome();
      renderAround("Open-Meteo didn't answer, so no fallback readings are shown.");
    }
  }

  /* ---------- draft panel ---------- */
  const places = new Map();
  const sel = $("dCity");
  function addOption(group, p) { places.set(p.id, p); const o = el("option", null, p.city + (p.country ? ", " + p.country : "")); o.value = p.id; group.append(o); }
  (function fillSelect() {
    const g1 = el("optgroup"); g1.label = "Home"; addOption(g1, WX.HOME);
    const g2 = el("optgroup"); g2.label = "Around the world"; WX.AROUND.forEach((p) => addOption(g2, p));
    sel.append(g1, g2);
  })();
  let searchGroup = null;
  $("dSearch").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("dQuery").value.trim();
    const picks = $("dPicks"); picks.replaceChildren();
    if (!q) { $("dStatus").textContent = "Type a city first."; return; }
    $("dStatus").textContent = "Searching Open-Meteo places…";
    try {
      const found = await WX.geocode(q);
      if (!found.length) { $("dStatus").textContent = "No place matched. Try another spelling."; return; }
      $("dStatus").textContent = "Pick one:";
      found.forEach((p) => {
        const b = el("button", "pick", p.city + (p.admin ? ", " + p.admin : "") + (p.country ? ", " + p.country : "") + " (" + p.lat + ", " + p.lon + ")");
        b.type = "button";
        b.addEventListener("click", () => {
          if (!searchGroup) { searchGroup = el("optgroup"); searchGroup.label = "Searched"; sel.append(searchGroup); }
          if (!places.has(p.id)) addOption(searchGroup, p);
          sel.value = p.id; picks.replaceChildren(); $("dStatus").textContent = p.city + " selected.";
          draft();
        });
        picks.append(b);
      });
    } catch (err) { $("dStatus").textContent = "Couldn't reach Open-Meteo's place search."; }
  });
  function countLine(node, used, max, unit, extra) {
    node.textContent = used + " / " + max + " " + unit + (extra || "");
    node.classList.toggle("over", used > max);
  }
  async function draft() {
    const p = places.get(sel.value);
    const bot = $("dBot").value.trim();
    if (!/^[a-z0-9-]{2,24}$/.test(bot)) { $("dStatus").textContent = "Bot names are 2 to 24 characters: a-z, 0-9 and dashes."; return; }
    $("dStatus").textContent = "Asking Open-Meteo about " + p.city + "…";
    $("dGo").disabled = true;
    try {
      const [reading] = await WX.fetchCurrent([p]);
      const rep = WX.buildReport(p, reading, bot, state.limits);
      $("dTitle").value = rep.title;
      $("dBody").value = rep.body;
      $("dArgs").value = JSON.stringify(rep.args, null, 2);
      const c = rep.checks;
      $("dTitleCount").textContent = "";
      countLine($("dTitleCount"), c.titleChars, c.titleCharsMax, "characters", " · " + c.titleBytes + " / " + c.titleBytesMax + " bytes");
      countLine($("dBodyCount"), c.bodyBytes, c.bodyBudget, "bytes (board budget; devnet keyless max " + c.bodyMax + ", before its closing line)");
      /* Self-check: run the draft through the same parser the board uses, as if it had just landed. */
      const fake = [{ height: 0, timestamp: Date.now(), txs: [{ kind: "publish_block", bot, hash: "draft", payload: { title: rep.title, body: rep.body + "\n\n— " + bot + " · devnet · bot · unmoderated", channel: "BOT" } }] }];
      const back = WX.extractReports(fake);
      const okParse = back.reports.length === 1 && back.reports[0].city === p.city;
      const self = $("dSelf");
      self.className = "selfcheck " + (okParse && c.ok ? "ok" : "bad");
      self.textContent = okParse && c.ok ? "✓ Fits the devnet limits and parses on this board." : "✗ " + (okParse ? "Over a limit; check the counts." : "The board couldn't parse this: " + (back.skipped[0] ? back.skipped[0].errors.join("; ") : "unknown"));
      $("dOut").hidden = false;
      $("dStatus").textContent = "Drafted from Open-Meteo at " + WX.ptStamp(Date.now()) + ". Reading is for " + WX.localClock(reading.obsMs, reading.tz) + " local. Nothing was posted.";
      $("dCopyStatus").textContent = "";
    } catch (err) {
      $("dStatus").textContent = "Open-Meteo didn't answer, so no draft was made. Nothing here is a guess.";
    } finally { $("dGo").disabled = false; }
  }
  $("dGo").addEventListener("click", draft);
  sel.addEventListener("change", () => { if (!$("dOut").hidden) draft(); });
  document.querySelectorAll("button[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const ta = $(b.dataset.copy);
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(ta.value); ok = true; } } catch (e) { ok = false; }
    if (!ok) { ta.focus(); ta.select(); try { ok = document.execCommand("copy"); } catch (e) { ok = false; } }
    $("dCopyStatus").textContent = ok ? "Copied." : "Couldn't copy automatically. The text is selected; copy it by hand.";
  }));

  /* ---------- boot + refresh ---------- */
  if (DEMO) $("wireHeading").textContent = "On the wire · bot reports (demo mode: sample posts mixed in)";
  drawHomeDot();
  loadStatus(); loadFeed(); loadWeather();
  setInterval(() => { if (!document.hidden) { loadFeed(); } }, 60e3);
  setInterval(() => { if (!document.hidden) { loadStatus(); loadWeather(); } }, 10 * 60e3);
  setInterval(() => { if (!document.hidden && state.wire.length) renderWire(); }, 30e3); // keep "x min ago" honest
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - state.lastFeedMs > 60e3) loadFeed(); });
})();
