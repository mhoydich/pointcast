// Rumor Central: page renderer shared by Industry Next, PointCast and UES.
// Each page includes only the slots it wants (elements with data-rc="...").
// <script type="module" src="/rumor-central/rumor-central.js"
//   data-feed="/rumor-central/rumors.json" data-view="operator|broadcast|lab"
//   data-suggest-endpoint="" data-suggest-email="mh@pointcast.xyz"></script>
import { index, WEIGHTS, brier } from './rumor-index.js';

const me = document.currentScript || document.querySelector('script[src*="rumor-central.js"]');
const cfg = {
  feed: me?.dataset.feed || '/rumor-central/rumors.json',
  view: me?.dataset.view || 'operator',
  endpoint: me?.dataset.suggestEndpoint || '',
  email: me?.dataset.suggestEmail || 'mh@pointcast.xyz',
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slot = (name) => document.querySelector(`[data-rc="${name}"]`);
const pct = (n) => (n == null ? '—' : `${Math.round(n)}%`);
const sign = (n) => (n == null ? '' : n > 0 ? `+${n}` : `${n}`);
const VENUE = { kalshi: 'Kalshi', polymarket: 'Polymarket', baseline: 'Baseline 0', grok: 'Grok Bot' };
const HORIZONS = [['week', 'This week'], ['month', 'This month'], ['year', 'This year'], ['open', 'Open / later']];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }) + ' PT';
};

function spark(points, w = 220, h = 48) {
  if (!points.length) return '';
  const xs = points.map((_, i) => (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w));
  const ys = points.map((p) => h - (p.value / 100) * h);
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const last = points.length - 1;
  return `<svg class="rc-spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Index over ${points.length} reads">
    <path d="${d}" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="${xs[last]}" cy="${ys[last]}" r="4" fill="currentColor"/></svg>`;
}

function dial(ix, feed) {
  const el = slot('dial'); if (!el) return;
  const hist = [...(feed.history || [])];
  if (!hist.length || hist[hist.length - 1].value !== ix.value) hist.push({ at: feed.updatedAt, value: ix.value });
  const prev = hist.length > 1 ? hist[hist.length - 2].value : null;
  el.innerHTML = `
    <div class="rc-dial" style="--rc-v:${ix.value}">
      <div class="rc-dial-num"><span>${ix.value}</span><small>/100</small></div>
      <div class="rc-dial-copy">
        <p class="rc-k">Rumor Central Index</p>
        <p>${ix.live} live rumors · ${ix.resolved} resolved${prev != null ? ` · ${sign(ix.value - prev)} since last read` : ' · read 1'}</p>
        ${spark(hist)}
        <p class="rc-micro">${esc(feed.readNote)}</p>
      </div>
    </div>`;
}

function card(r) {
  const venues = (r.reads || []).map((x) => `<li><span>${esc(VENUE[x.venue] || x.venue)}</span><b>${pct(x.p * 100)}</b><small>${esc(x.contract)}</small></li>`).join('');
  const local = r.local ? `<p class="rc-local-sig">${esc(r.local.signal)}</p><p class="rc-micro">${esc(r.local.source)}</p>` : '';
  const driftBar = r.drift != null
    ? `<div class="rc-drift" aria-label="Moved ${sign(r.drift)} points since baseline">
        <span class="rc-drift-base" style="left:${r.baseline.p * 100}%"></span>
        <span class="rc-drift-now" style="left:${r.consensus}%"></span>
        <span class="rc-drift-line" style="left:${Math.min(r.baseline.p * 100, r.consensus)}%;width:${Math.abs(r.drift)}%"></span>
      </div><p class="rc-micro">${sign(r.drift)} pts since ${esc(r.baseline.source)}</p>`
    : '';
  const extra = {
    operator: r.ifTrue ? `<p class="rc-if"><b>If it lands:</b> ${esc(r.ifTrue)}</p>` : '',
    lab: r.lesson ? `<p class="rc-if"><b>Read it like this:</b> ${esc(r.lesson)}</p>` : '',
    broadcast: '',
  }[cfg.view];
  const related = (r.related || []).length
    ? `<details><summary>Nearby contracts</summary><ul class="rc-rel">${r.related.map((x) => `<li>${esc(VENUE[x.venue] || x.venue)}: ${esc(x.contract)} <b>${pct(x.p * 100)}</b>${x.note ? `<br><small>${esc(x.note)}</small>` : ''}</li>`).join('')}</ul></details>`
    : '';
  return `<article class="rc-card" id="rumor-${esc(r.id)}" data-status="${esc(r.status)}" style="--rc-heat:${r.heat}">
    <header><p class="rc-k">${esc(r.topic)} · ${r.status === 'watching' ? 'watching' : `heat ${r.heat}`}</p>
    <h3>${esc(r.claim)}</h3></header>
    <div class="rc-nums">
      <div><b>${r.consensus != null ? pct(r.consensus) : r.local ? 'count' : '—'}</b><small>${r.consensus != null ? 'market consensus' : r.local ? 'no market' : 'not yet read'}</small></div>
      <div><b>${r.fog ?? '—'}</b><small>fog</small></div>
      <div><b>${r.split != null ? `${r.split}` : '—'}</b><small>venue split</small></div>
      <div><b>${r.daysLeft != null ? `${Math.max(0, Math.round(r.daysLeft))}d` : '∞'}</b><small>to deadline</small></div>
    </div>
    ${venues ? `<ul class="rc-venues">${venues}</ul>` : ''}${local}${driftBar}${extra}${related}
  </article>`;
}

function board(ix) {
  const el = slot('board'); if (!el) return;
  const topics = ['All', ...new Set(ix.items.map((r) => r.topic))];
  const sorts = { heat: 'Hottest', deadline: 'Closest deadline', fog: 'Most fog', drift: 'Biggest move' };
  let state = store.get('rc-board', { topic: 'All', sort: 'heat' });
  const draw = () => {
    let items = ix.items.filter((r) => state.topic === 'All' || r.topic === state.topic);
    const key = state.sort;
    items.sort((a, b) =>
      key === 'deadline' ? (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9)
      : key === 'drift' ? Math.abs(b.drift ?? 0) - Math.abs(a.drift ?? 0)
      : (b[key] ?? -1) - (a[key] ?? -1));
    el.querySelector('.rc-grid').innerHTML = items.map(card).join('');
  };
  el.innerHTML = `<div class="rc-controls" role="group" aria-label="Filter rumors">
      <label>Topic <select data-k="topic">${topics.map((t) => `<option${t === state.topic ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label>Sort <select data-k="sort">${Object.entries(sorts).map(([k, v]) => `<option value="${k}"${k === state.sort ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    </div><div class="rc-grid"></div>`;
  el.querySelectorAll('select').forEach((s) => s.addEventListener('change', () => { state = { ...state, [s.dataset.k]: s.value }; store.set('rc-board', state); draw(); }));
  draw();
}

function heatmap(ix) {
  const el = slot('heatmap'); if (!el) return;
  const topics = [...new Set(ix.items.map((r) => r.topic))];
  const bucket = (h) => (h === 'years' ? 'open' : h);
  const cell = (t, h) => {
    const rs = ix.items.filter((r) => r.topic === t && bucket(r.horizon) === h && r.status === 'live');
    if (!rs.length) return `<td class="rc-empty"><span class="sr-only">none</span></td>`;
    const v = Math.round(rs.reduce((a, r) => a + r.heat, 0) / rs.length);
    return `<td style="--rc-heat:${v}" title="${esc(rs.map((r) => r.claim).join(' / '))}"><a href="#rumor-${esc(rs[0].id)}">${v}</a><small>${rs.length}</small></td>`;
  };
  el.innerHTML = `<div class="rc-scroll"><table class="rc-heat"><caption>Heat by topic and deadline. Darker is hotter. Tap a cell to jump to its rumor.</caption>
    <thead><tr><th scope="col">Topic</th>${HORIZONS.map(([, l]) => `<th scope="col">${l}</th>`).join('')}</tr></thead>
    <tbody>${topics.map((t) => `<tr><th scope="row">${esc(t)}</th>${HORIZONS.map(([h]) => cell(t, h)).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function watch(ix) {
  const el = slot('watch'); if (!el) return;
  const items = ix.watch.map((id) => ix.items.find((r) => r.id === id));
  el.innerHTML = `<ol class="rc-watch">${items.map((r) => `<li><a href="#rumor-${esc(r.id)}">${esc(r.claim)}</a><span>heat ${r.heat}${r.daysLeft != null ? ` · ${Math.max(0, Math.round(r.daysLeft))} days` : ''}</span></li>`).join('')}</ol>`;
}

function ledger(feed, ix) {
  const el = slot('ledger'); if (!el) return;
  const rows = feed.ledger || [];
  el.innerHTML = rows.length
    ? `<div class="rc-scroll"><table class="rc-ledger"><thead><tr><th>Rumor</th><th>Outcome</th><th>Last price</th><th>Resolved</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${esc(x.claim)}</td><td data-o="${esc(x.outcome)}">${esc(x.outcome)}</td><td>${pct(x.lastPrice)}</td><td>${esc(when(x.at))}</td></tr>`).join('')}</tbody></table></div>
       <p class="rc-micro">Crowd Brier score so far: ${ix.brier ?? '—'} (0 is perfect, 0.25 is a coin flip).</p>`
    : `<p class="rc-empty-note">Nothing has resolved yet. Each rumor moves here as confirmed, denied or expired, with the price it carried the day before. That is how this page checks the crowd, and itself.</p>`;
}

function localItems(feed, ix) {
  const el = slot('local'); if (!el) return;
  const items = ix.items.filter((r) => r.local);
  const log = feed.reachLog || [];
  el.innerHTML = `<div class="rc-grid">${items.map(card).join('')}</div>
    ${log.length ? `<h3 class="rc-sub">Reach log</h3><ul class="rc-reach">${log.map((x) => `<li><b>${esc(x.what)}</b>: shared to about ${x.sharedTo} in ${esc(x.where)}, about ${x.clicks} clicks (${esc(x.kind)}). <span>${x.sharedTo ? Math.round((x.clicks / x.sharedTo) * 100) : 0}% click rate, the baseline to beat.</span></li>`).join('')}</ul>` : ''}`;
}

function wire(ix) {
  const el = slot('wire'); if (!el) return;
  const live = ix.items.filter((r) => r.status === 'live').sort((a, b) => b.heat - a.heat);
  const line = live.map((r) => `${r.claim.toUpperCase()} ${r.consensus != null ? pct(r.consensus) : 'COUNT'}${r.drift != null ? ` (${sign(r.drift)})` : ''}`).join('  ◆  ');
  el.innerHTML = `<div class="rc-wire" aria-label="Rumor wire"><div class="rc-wire-track"><span>${esc(line)}  ◆  </span><span aria-hidden="true">${esc(line)}  ◆  </span></div></div>`;
}

function callIt(ix) {
  const el = slot('callit'); if (!el) return;
  const calls = store.get('rc-calls', {});
  const items = ix.items.filter((r) => r.status === 'live' && r.consensus != null).slice(0, 8);
  const resolved = new Map((ix.items || []).filter((r) => r.status === 'confirmed' || r.status === 'denied').map((r) => [r.id, r.status === 'confirmed']));
  const score = () => {
    const done = Object.entries(calls).filter(([id]) => resolved.has(id));
    return done.length ? (done.reduce((a, [id, p]) => a + brier(p / 100, resolved.get(id)), 0) / done.length).toFixed(3) : null;
  };
  el.innerHTML = `<form class="rc-callit">${items.map((r) => `
      <label><span>${esc(r.claim)}</span>
      <input type="range" min="0" max="100" step="1" name="${esc(r.id)}" value="${calls[r.id] ?? 50}" aria-describedby="cx-${esc(r.id)}">
      <output id="cx-${esc(r.id)}">You ${calls[r.id] ?? 50}% · crowd ${pct(r.consensus)}</output></label>`).join('')}
      <p class="rc-micro" role="status">${score() ? `Your Brier score: ${score()}.` : 'Your calls stay in this browser. Your score appears as rumors resolve.'}</p>
    </form>`;
  el.querySelectorAll('input[type=range]').forEach((inp) => inp.addEventListener('input', () => {
    calls[inp.name] = Number(inp.value); store.set('rc-calls', calls);
    const r = ix.items.find((x) => x.id === inp.name);
    inp.nextElementSibling.textContent = `You ${inp.value}% · crowd ${pct(r.consensus)} · gap ${Math.abs(inp.value - r.consensus).toFixed(0)}`;
  }));
}

function suggest(feed) {
  const el = slot('suggest'); if (!el) return;
  el.innerHTML = `<form class="rc-suggest">
      <label>The rumor, as a yes-or-no claim<input name="claim" required maxlength="200" placeholder="e.g. A new AI model ships before Thanksgiving"></label>
      <label>By when<input name="deadline" type="date"></label>
      <label>Topic<select name="topic">${(feed.topics || []).map((t) => `<option>${esc(t)}</option>`).join('')}<option>Something else</option></select></label>
      <label>Where it's being said<select name="where"><option>X / social</option><option>A market (Kalshi or Polymarket)</option><option>News</option><option>Around town</option><option>Somewhere else</option></select></label>
      <p class="rc-micro full">Leave out who said it. Rumor Central tracks claims, not people. Suggestions are reviewed before anything shows.</p>
      <button type="submit" class="button blue">Suggest it →</button>
    </form><div class="rc-suggest-done" hidden></div>`;
  const form = el.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const done = el.querySelector('.rc-suggest-done');
    if (cfg.endpoint) {
      try {
        const res = await fetch(cfg.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, site: cfg.view }) });
        if (!res.ok) throw new Error(String(res.status));
        done.hidden = false; done.textContent = 'Got it. It goes into the review queue, without your name.'; form.reset(); return;
      } catch { /* fall through to email */ }
    }
    const body = `Claim: ${data.claim}\nBy: ${data.deadline || 'open'}\nTopic: ${data.topic}\nWhere: ${data.where}\nSite: ${cfg.view}`;
    done.hidden = false;
    done.innerHTML = `<p><strong>Your suggestion is ready.</strong> Nothing has been sent. Your email app opens when you choose the link.</p><pre>${esc(body)}</pre><a class="button blue" href="mailto:${esc(cfg.email)}?subject=${encodeURIComponent('Rumor Central suggestion')}&body=${encodeURIComponent(body)}">Open email draft ↗</a>`;
  });
}

function method() {
  const el = slot('method'); if (!el) return;
  el.innerHTML = `<ul class="rc-method">
    <li><b>Consensus</b> is the mean of the venue prices on the same contract.</li>
    <li><b>Fog</b> runs 0 to 100: 100 at a coin flip, 0 at certainty. Local items use the vote margin instead.</li>
    <li><b>Drift</b> is points moved since the rumor's first read.</li>
    <li><b>Split</b> is points between Kalshi and Polymarket when both price the same contract.</li>
    <li><b>Heat</b> = ${WEIGHTS.fog} × fog + ${WEIGHTS.drift} × drift + ${WEIGHTS.split} × split + ${WEIGHTS.clock} × deadline pressure + ${WEIGHTS.reach} × local reach, each scaled to 100.</li>
    <li><b>The index</b> is the mean heat of every live rumor.</li></ul>`;
}

function onAir(ix) {
  const el = slot('onair'); if (!el) return;
  const r = [...ix.items].filter((x) => x.status === 'live').sort((a, b) => b.heat - a.heat)[0];
  if (!r) return;
  el.innerHTML = `<p class="rc-k">On air now · heat ${r.heat}</p><h2 class="rc-onair">${esc(r.claim)}</h2>
    <p>${r.consensus != null ? `Markets: ${pct(r.consensus)}` : esc(r.local?.signal || '')}${r.drift != null ? `, ${sign(r.drift)} points since the first read` : ''}${r.split != null ? `, ${r.split} points between venues` : ''}.</p>
    <p><a href="#rumor-${esc(r.id)}">Full card ↓</a></p>`;
}

async function main() {
  let feed;
  try { const res = await fetch(cfg.feed, { cache: 'no-cache' }); feed = await res.json(); }
  catch { document.querySelectorAll('[data-rc]').forEach((n) => { n.innerHTML = '<p class="rc-empty-note">The rumor feed did not load. Try again in a minute.</p>'; }); return; }
  const ix = index(feed);
  document.querySelectorAll('[data-rc-updated]').forEach((n) => { n.textContent = when(feed.updatedAt); });
  [onAir.bind(null, ix), dial.bind(null, ix, feed), board.bind(null, ix), heatmap.bind(null, ix), watch.bind(null, ix), ledger.bind(null, feed, ix),
   localItems.bind(null, feed, ix), wire.bind(null, ix), callIt.bind(null, ix), suggest.bind(null, feed), method].forEach((f) => { try { f(); } catch (e) { console.error('rumor-central', e); } });
}
main();
