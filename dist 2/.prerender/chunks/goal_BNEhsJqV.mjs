import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { M as MACHINE_META, G as GOAL_TYPE_LABELS, a as MACHINE_LOOPS, H as HORIZON_BANDS, b as MACHINE_PRINCIPLES, S as SEED_GOALS } from './goalMachine_Day03hBb.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Goal = createComponent(($$result, $$props, $$slots) => {
  const title = `${MACHINE_META.title} — ${MACHINE_META.subtitle}`;
  const description = MACHINE_META.thesis;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/goal",
    name: MACHINE_META.title,
    applicationCategory: "ProductivityApplication",
    description,
    url: "https://pointcast.xyz/goal",
    isPartOf: { "@type": "EducationalOrganization", name: "University of El Segundo", url: "https://pointcast.xyz/university-of-el-segundo" }
  };
  const goalTypeKeys = Object.keys(GOAL_TYPE_LABELS);
  return renderTemplate(_a || (_a = __template(["", `  <script>
  const KEY = 'pointcast.goal.machine.v0';
  function load() { try { const r = localStorage.getItem(KEY); const p = r ? JSON.parse(r) : null; return p && typeof p === 'object' ? p : null; } catch { return null; } }
  function save(g) { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch {} }
  function clear() { try { localStorage.removeItem(KEY); } catch {} }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function dayDiff(aISO, bISO) { return Math.floor((Date.parse(bISO) - Date.parse(aISO)) / 86400000); }
  function streakOf(marks) {
    if (!marks || !marks.length) return 0;
    const sorted = [...marks].sort();
    let s = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (dayDiff(sorted[i - 1], sorted[i]) === 1) s++; else break;
    }
    const today = todayISO();
    const last = sorted[sorted.length - 1];
    if (last !== today && dayDiff(last, today) > 1) return 0;
    return s;
  }
  function nextBand(daysIn) {
    const bands = [1, 7, 30, 60, 90, 180, 270, 365];
    for (const b of bands) if (daysIn < b) return b;
    return null;
  }
  function render() {
    const dashEl = document.getElementById('dashboard');
    const actionsEl = document.getElementById('actions');
    const setupEl = document.getElementById('setup');
    if (!dashEl) return;
    const g = load();
    if (!g) {
      dashEl.innerHTML = '<p class="dashboard__placeholder">No goal set on this device yet. Use the form below.</p>';
      if (actionsEl) actionsEl.hidden = true;
      if (setupEl) setupEl.style.display = '';
      return;
    }
    const today = todayISO();
    const startedAt = g.startedAt || today;
    const daysIn = Math.max(1, dayDiff(startedAt, today) + 1);
    const horizon = Number(g.horizon) || 90;
    const marked = g.marks || [];
    const streak = streakOf(marked);
    const pct = Math.min(100, Math.round((daysIn / horizon) * 100));
    const next = nextBand(daysIn);
    const markedToday = marked.includes(today);
    dashEl.innerHTML = \`
      <div class="dashboard__live">
        <p class="dashboard__title">\${escapeHtml(g.title || '(untitled)')}</p>
        <p class="dashboard__meta">
          <span>\${escapeHtml((g.type || '').toUpperCase())}</span>
          <span>\${escapeHtml(String(horizon))}-DAY HORIZON</span>
          <span>STARTED \${escapeHtml(startedAt)}</span>
          <span>DAY \${daysIn} / \${horizon}</span>
          \${next ? \`<span>NEXT BAND \${next}</span>\` : ''}
        </p>
        <div class="dashboard__streak">
          <span class="dashboard__streak__num">\${streak}</span>
          <span class="dashboard__streak__lbl">DAY STREAK · \${marked.length} TOTAL TICKS · \${markedToday ? 'TODAY MARKED' : 'TODAY UNMARKED'}</span>
        </div>
        <div class="dashboard__progress" data-label="\${pct}% TO HORIZON">
          <div class="dashboard__progress__fill" style="width: \${pct}%"></div>
        </div>
        <p class="dashboard__action"><strong>Daily action:</strong> \${escapeHtml(g.dailyAction || '')}</p>
        <p class="dashboard__action" style="background:#fff; border-left-color: var(--gm-rust);"><strong>Trigger:</strong> \${escapeHtml(g.triggerCondition || '')}</p>
      </div>
    \`;
    if (actionsEl) actionsEl.hidden = false;
    const markBtn = document.getElementById('btn-mark');
    if (markBtn) markBtn.textContent = markedToday ? 'TODAY MARKED ✓' : 'MARK TODAY ✓';
    if (setupEl) setupEl.style.display = '';
  }
  function init() {
    if (document.body.dataset.goalBound === '1') { render(); return; }
    document.body.dataset.goalBound = '1';
    const form = document.getElementById('goal-form');
    if (form) form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const goal = {
        id: 'local-' + Date.now().toString(36),
        title: String(fd.get('title') || '').slice(0, 180),
        why: String(fd.get('why') || '').slice(0, 240),
        type: String(fd.get('type') || 'ritual'),
        dailyAction: String(fd.get('dailyAction') || '').slice(0, 240),
        horizon: Number(fd.get('horizon') || 90),
        cohortPartner: String(fd.get('cohortPartner') || '').slice(0, 120),
        triggerCondition: String(fd.get('triggerCondition') || '').slice(0, 240),
        startedAt: todayISO(),
        status: 'running',
        marks: [],
      };
      save(goal);
      form.reset();
      render();
      document.getElementById('machine')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('btn-mark')?.addEventListener('click', () => {
      const g = load(); if (!g) return;
      g.marks = g.marks || [];
      const today = todayISO();
      if (!g.marks.includes(today)) g.marks.push(today);
      save(g); render();
    });
    document.getElementById('btn-undo')?.addEventListener('click', () => {
      const g = load(); if (!g) return;
      g.marks = (g.marks || []).slice(0, -1);
      save(g); render();
    });
    document.getElementById('btn-retire')?.addEventListener('click', () => {
      if (!confirm('Retire goal honestly? This is not failure; it is honesty. Local data will be cleared.')) return;
      clear(); render();
    });
    render();
  }
  init();
  document.addEventListener('astro:page-load', init);
<\/script>`], ["", `  <script>
  const KEY = 'pointcast.goal.machine.v0';
  function load() { try { const r = localStorage.getItem(KEY); const p = r ? JSON.parse(r) : null; return p && typeof p === 'object' ? p : null; } catch { return null; } }
  function save(g) { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch {} }
  function clear() { try { localStorage.removeItem(KEY); } catch {} }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function dayDiff(aISO, bISO) { return Math.floor((Date.parse(bISO) - Date.parse(aISO)) / 86400000); }
  function streakOf(marks) {
    if (!marks || !marks.length) return 0;
    const sorted = [...marks].sort();
    let s = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (dayDiff(sorted[i - 1], sorted[i]) === 1) s++; else break;
    }
    const today = todayISO();
    const last = sorted[sorted.length - 1];
    if (last !== today && dayDiff(last, today) > 1) return 0;
    return s;
  }
  function nextBand(daysIn) {
    const bands = [1, 7, 30, 60, 90, 180, 270, 365];
    for (const b of bands) if (daysIn < b) return b;
    return null;
  }
  function render() {
    const dashEl = document.getElementById('dashboard');
    const actionsEl = document.getElementById('actions');
    const setupEl = document.getElementById('setup');
    if (!dashEl) return;
    const g = load();
    if (!g) {
      dashEl.innerHTML = '<p class="dashboard__placeholder">No goal set on this device yet. Use the form below.</p>';
      if (actionsEl) actionsEl.hidden = true;
      if (setupEl) setupEl.style.display = '';
      return;
    }
    const today = todayISO();
    const startedAt = g.startedAt || today;
    const daysIn = Math.max(1, dayDiff(startedAt, today) + 1);
    const horizon = Number(g.horizon) || 90;
    const marked = g.marks || [];
    const streak = streakOf(marked);
    const pct = Math.min(100, Math.round((daysIn / horizon) * 100));
    const next = nextBand(daysIn);
    const markedToday = marked.includes(today);
    dashEl.innerHTML = \\\`
      <div class="dashboard__live">
        <p class="dashboard__title">\\\${escapeHtml(g.title || '(untitled)')}</p>
        <p class="dashboard__meta">
          <span>\\\${escapeHtml((g.type || '').toUpperCase())}</span>
          <span>\\\${escapeHtml(String(horizon))}-DAY HORIZON</span>
          <span>STARTED \\\${escapeHtml(startedAt)}</span>
          <span>DAY \\\${daysIn} / \\\${horizon}</span>
          \\\${next ? \\\`<span>NEXT BAND \\\${next}</span>\\\` : ''}
        </p>
        <div class="dashboard__streak">
          <span class="dashboard__streak__num">\\\${streak}</span>
          <span class="dashboard__streak__lbl">DAY STREAK · \\\${marked.length} TOTAL TICKS · \\\${markedToday ? 'TODAY MARKED' : 'TODAY UNMARKED'}</span>
        </div>
        <div class="dashboard__progress" data-label="\\\${pct}% TO HORIZON">
          <div class="dashboard__progress__fill" style="width: \\\${pct}%"></div>
        </div>
        <p class="dashboard__action"><strong>Daily action:</strong> \\\${escapeHtml(g.dailyAction || '')}</p>
        <p class="dashboard__action" style="background:#fff; border-left-color: var(--gm-rust);"><strong>Trigger:</strong> \\\${escapeHtml(g.triggerCondition || '')}</p>
      </div>
    \\\`;
    if (actionsEl) actionsEl.hidden = false;
    const markBtn = document.getElementById('btn-mark');
    if (markBtn) markBtn.textContent = markedToday ? 'TODAY MARKED ✓' : 'MARK TODAY ✓';
    if (setupEl) setupEl.style.display = '';
  }
  function init() {
    if (document.body.dataset.goalBound === '1') { render(); return; }
    document.body.dataset.goalBound = '1';
    const form = document.getElementById('goal-form');
    if (form) form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const goal = {
        id: 'local-' + Date.now().toString(36),
        title: String(fd.get('title') || '').slice(0, 180),
        why: String(fd.get('why') || '').slice(0, 240),
        type: String(fd.get('type') || 'ritual'),
        dailyAction: String(fd.get('dailyAction') || '').slice(0, 240),
        horizon: Number(fd.get('horizon') || 90),
        cohortPartner: String(fd.get('cohortPartner') || '').slice(0, 120),
        triggerCondition: String(fd.get('triggerCondition') || '').slice(0, 240),
        startedAt: todayISO(),
        status: 'running',
        marks: [],
      };
      save(goal);
      form.reset();
      render();
      document.getElementById('machine')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('btn-mark')?.addEventListener('click', () => {
      const g = load(); if (!g) return;
      g.marks = g.marks || [];
      const today = todayISO();
      if (!g.marks.includes(today)) g.marks.push(today);
      save(g); render();
    });
    document.getElementById('btn-undo')?.addEventListener('click', () => {
      const g = load(); if (!g) return;
      g.marks = (g.marks || []).slice(0, -1);
      save(g); render();
    });
    document.getElementById('btn-retire')?.addEventListener('click', () => {
      if (!confirm('Retire goal honestly? This is not failure; it is honesty. Local data will be cleared.')) return;
      clear(); render();
    });
    render();
  }
  init();
  document.addEventListener('astro:page-load', init);
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/goal.json", title: "Goal machine (JSON)" }], "data-astro-cid-ua73jwnq": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-ua73jwnq> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-ua73jwnq> <a href="/" data-astro-cid-ua73jwnq>Home</a><span aria-hidden="true" data-astro-cid-ua73jwnq>/</span> <a href="/university-of-el-segundo" data-astro-cid-ua73jwnq>university-of-el-segundo</a><span aria-hidden="true" data-astro-cid-ua73jwnq>/</span> <span data-astro-cid-ua73jwnq>goal</span> </nav> <header class="hero" data-astro-cid-ua73jwnq> <div class="hero__bar" data-astro-cid-ua73jwnq></div> <p class="kicker" data-astro-cid-ua73jwnq>UES · ONE GOAL · BROWSER-LOCAL · V0</p> <h1 data-astro-cid-ua73jwnq>ONE / GOAL.</h1> <p class="subtitle" data-astro-cid-ua73jwnq>${MACHINE_META.subtitle}</p> <p class="tagline" data-astro-cid-ua73jwnq>${MACHINE_META.tagline}</p> <p class="thesis" data-astro-cid-ua73jwnq>${MACHINE_META.thesis}</p> </header> <section class="machine" id="machine" data-astro-cid-ua73jwnq> <p class="kicker" data-astro-cid-ua73jwnq>YOUR GOAL · IF SET, IT APPEARS HERE</p> <h2 data-astro-cid-ua73jwnq>The machine.</h2> <div class="dashboard" id="dashboard" data-astro-cid-ua73jwnq> <p class="dashboard__placeholder" data-astro-cid-ua73jwnq>No goal set on this device yet. Use the form below.</p> </div> <div class="actions" id="actions" hidden data-astro-cid-ua73jwnq> <button class="btn btn--mark" type="button" id="btn-mark" data-astro-cid-ua73jwnq>MARK TODAY ✓</button> <button class="btn btn--undo" type="button" id="btn-undo" data-astro-cid-ua73jwnq>undo last mark</button> <button class="btn btn--retire" type="button" id="btn-retire" data-astro-cid-ua73jwnq>retire goal honestly</button> </div> </section> <section class="setup" id="setup" data-astro-cid-ua73jwnq> <p class="kicker" data-astro-cid-ua73jwnq>SET IT</p> <h2 data-astro-cid-ua73jwnq>One goal. Declare it.</h2> <p class="lede" data-astro-cid-ua73jwnq>All fields are stored in this browser only. Nothing leaves your device until you log a corresponding ledger entry at <a href="/commons" data-astro-cid-ua73jwnq>/commons</a>.</p> <form class="form" id="goal-form" data-astro-cid-ua73jwnq> <label data-astro-cid-ua73jwnq>The goal (one sentence)<input name="title" required maxlength="180" placeholder="e.g., First Bench at Hilltop, built and open by 2026-08-01." data-astro-cid-ua73jwnq></label> <label data-astro-cid-ua73jwnq>Why<input name="why" required maxlength="240" placeholder="Why this. Why now." data-astro-cid-ua73jwnq></label> <label data-astro-cid-ua73jwnq>Type<select name="type" required data-astro-cid-ua73jwnq> ${goalTypeKeys.map((k) => renderTemplate`<option${addAttribute(k, "value")} data-astro-cid-ua73jwnq>${GOAL_TYPE_LABELS[k]}</option>`)} </select></label> <label data-astro-cid-ua73jwnq>Daily action (the smallest version that counts as a tick)<input name="dailyAction" required maxlength="240" placeholder="e.g., Send one parks-department email, or move one sub-task forward." data-astro-cid-ua73jwnq></label> <label data-astro-cid-ua73jwnq>Horizon<select name="horizon" required data-astro-cid-ua73jwnq> <option value="30" data-astro-cid-ua73jwnq>30-day</option> <option value="90" selected data-astro-cid-ua73jwnq>90-day</option> <option value="365" data-astro-cid-ua73jwnq>365-day</option> </select></label> <label data-astro-cid-ua73jwnq>Cohort partner (optional)<input name="cohortPartner" maxlength="120" placeholder="Marine Layer cohort, parks-department point person, etc." data-astro-cid-ua73jwnq></label> <label data-astro-cid-ua73jwnq>Trigger condition (when the goal is complete)<input name="triggerCondition" required maxlength="240" placeholder="The unambiguous test for done-ness." data-astro-cid-ua73jwnq></label> <button type="submit" class="btn btn--primary" data-astro-cid-ua73jwnq>SET THE GOAL · RUN THE MACHINE</button> </form> </section> <section class="loops" data-astro-cid-ua73jwnq> <p class="kicker" data-astro-cid-ua73jwnq>FIVE LOOPS · DAILY → ANNUAL</p> <h2 data-astro-cid-ua73jwnq>What runs when.</h2> <ol class="loop-list" data-astro-cid-ua73jwnq>${MACHINE_LOOPS.map((l) => renderTemplate`<li${addAttribute(`loop loop--${l.cadence}`, "class")} data-astro-cid-ua73jwnq> <span class="loop__cad" data-astro-cid-ua73jwnq>${l.cadence.toUpperCase()}</span> <p class="loop__act" data-astro-cid-ua73jwnq>${l.action}</p> <p class="loop__out" data-astro-cid-ua73jwnq><strong data-astro-cid-ua73jwnq>Output:</strong> ${l.output}</p> </li>`)}</ol> </section> <section class="bands" data-astro-cid-ua73jwnq> <p class="kicker" data-astro-cid-ua73jwnq>EIGHT HORIZON BANDS · WHAT EACH DAY-COUNT MEANS</p> <h2 data-astro-cid-ua73jwnq>The bands.</h2> <ol class="band-list" data-astro-cid-ua73jwnq>${HORIZON_BANDS.map((b) => renderTemplate`<li class="band" data-astro-cid-ua73jwnq> <span class="band__day" data-astro-cid-ua73jwnq>${b.label}</span> <p class="band__meaning" data-astro-cid-ua73jwnq>${b.meaning}</p> </li>`)}</ol> </section> <section class="principles" data-astro-cid-ua73jwnq> <p class="kicker" data-astro-cid-ua73jwnq>PRINCIPLES</p> <h2 data-astro-cid-ua73jwnq>Seven rules before any goal is set.</h2> <ol class="rules" data-astro-cid-ua73jwnq>${MACHINE_PRINCIPLES.map((p, i) => renderTemplate`<li data-astro-cid-ua73jwnq><span data-astro-cid-ua73jwnq>${String(i + 1).padStart(2, "0")}</span><p data-astro-cid-ua73jwnq>${p}</p></li>`)}</ol> </section> <section class="seed" data-astro-cid-ua73jwnq> <p class="kicker" data-astro-cid-ua73jwnq>FIVE SEED GOALS · COHORT INSPIRATION</p> <h2 data-astro-cid-ua73jwnq>What the cohort is running.</h2> <p class="lede" data-astro-cid-ua73jwnq>These are five real goals the Marine Layer cohort is running today. Each is paired to a UES program, has a declared trigger condition, and points toward a Commons ledger phase. Use them as inspiration; do not copy. Set your own.</p> <ol class="seed-list" data-astro-cid-ua73jwnq>${SEED_GOALS.map((g) => renderTemplate`<li${addAttribute(`seed-goal seed-goal--${g.status}`, "class")} data-astro-cid-ua73jwnq> <div class="seed-goal__head" data-astro-cid-ua73jwnq> <span class="seed-goal__type" data-astro-cid-ua73jwnq>${g.type.toUpperCase()}</span> <span${addAttribute(`seed-goal__status seed-goal__status--${g.status}`, "class")} data-astro-cid-ua73jwnq>${g.status.toUpperCase()}</span> </div> <h3 data-astro-cid-ua73jwnq>${g.title}</h3> <p class="seed-goal__why" data-astro-cid-ua73jwnq><strong data-astro-cid-ua73jwnq>Why:</strong> ${g.why}</p> <p class="seed-goal__act" data-astro-cid-ua73jwnq><strong data-astro-cid-ua73jwnq>Daily:</strong> ${g.dailyAction}</p> <p class="seed-goal__trig" data-astro-cid-ua73jwnq><strong data-astro-cid-ua73jwnq>Trigger:</strong> ${g.triggerCondition}</p> <p class="seed-goal__meta" data-astro-cid-ua73jwnq>${g.horizon}-day horizon · ${g.uesProgram} · cohort: ${g.cohortPartner} · started ${g.startedAt}</p> </li>`)}</ol> </section> <section class="links" data-astro-cid-ua73jwnq> <a href="/commons" data-astro-cid-ua73jwnq>Log a give-back at /commons</a> <a href="/marine-layer" data-astro-cid-ua73jwnq>Marine Layer</a> <a href="/civic-layer" data-astro-cid-ua73jwnq>Civic Layer</a> <a href="/common-forms" data-astro-cid-ua73jwnq>Common Forms</a> <a href="/university-of-el-segundo" data-astro-cid-ua73jwnq>UES tracks</a> <a href="/goal.json" data-astro-cid-ua73jwnq>JSON</a> </section> </div> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/goal.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/goal.astro";
const $$url = "/goal";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Goal,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
