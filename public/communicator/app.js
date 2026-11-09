// The Communicator prototype: a thin UI over engine.mjs and ledger.mjs. All state is in memory.
import * as E from './engine.mjs';
import * as L from './ledger.mjs';
import { DEMO_NOW, DEMO_VENUES, DEMO_PROFILES, DEMO_LADDER, DEMO_RATINGS } from './demo.mjs';

const HOST = 'mike', HOST_NAME = 'Mike H.', H = 3600000;
const DEFAULT_TEXT = 'Get me a 4.0 doubles game Thursday evening at Rec Park';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LEVELS = ['3.0', '3.5', '4.0', '4.5', '5.0'];
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

let state, ui;
function reset() {
  state = { now: DEMO_NOW, game: null, ledger: [...DEMO_LADDER], outbox: [], ratingsBefore: null, plan: null };
  ui = { tab: 'host', text: DEFAULT_TEXT, error: '', note: '', player: null, newtimeFor: null, answered: {}, sides: null, sKey: '', sa: '', sb: '', typed: '' };
}

// ---- small helpers ---------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pad = (n) => String(n).padStart(2, '0');
const localIso = (ms) => new Date(ms - 8 * H).toISOString().slice(0, 19) + '-08:00'; // keep the demo's Pacific offset
function clockLabel(iso) {
  const d = new Date(Date.parse(iso) - 8 * H), h = d.getUTCHours();
  return `${DAYS[d.getUTCDay()].slice(0, 3)} ${h % 12 || 12}:${pad(d.getUTCMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
}
const signed = (d) => { const r = Math.round(d * 100) / 100; return (r >= 0 ? '+' : '') + r.toFixed(2); };
const venueOf = (id) => DEMO_VENUES.find((v) => v.id === id);
const nameOf = (h) => DEMO_PROFILES.find((p) => p.handle === h)?.display || state.game?.names?.[h] || h;
const declaredOf = (h) => DEMO_PROFILES.find((p) => p.handle === h)?.ladders[L.DEFAULT_LADDER.id]?.declared ?? null;
const ratingOf = (h, entries) => L.rate(h, { entries, declared: declaredOf(h), now: state.now, ladder: L.DEFAULT_LADDER, ratings: DEMO_RATINGS });
const pushOut = (msgs) => { for (const m of msgs) state.outbox.push({ ...m, sent: true }); };
const pendingEntry = () => state.ledger.find((e) => e.id === state.game?.ledgerEntryId);
function apply(out) {
  state.game = out.game;
  for (const e of out.ledger || []) { const i = state.ledger.findIndex((x) => x.id === e.id); if (i < 0) state.ledger.push(e); else state.ledger[i] = e; }
  pushOut(out.outbox);
}
const slotsFor = (g) => E.proposeSlots(g.request, venueOf(g.venue), { now: state.now });
const errLine = () => (ui.error ? `<p class="err" role="alert">${esc(ui.error)}</p>` : '');

// ---- host actions ----------------------------------------------------------------------
function go() {
  const parsed = E.parseRequest(ui.text, { now: state.now, venues: DEMO_VENUES });
  state.plan = { parsed, slotIdx: 0, slots: [], candidates: [] };
  if (!parsed.ok) return;
  const r = parsed.request;
  state.plan.slots = E.proposeSlots(r, venueOf(r.venue), { now: state.now });
  state.plan.candidates = E.findCandidates(r, { profiles: DEMO_PROFILES, ratings: DEMO_RATINGS, now: state.now, exclude: [HOST], seed: 1, venues: DEMO_VENUES });
}
function startGame(slot) {
  const r = state.plan.parsed.request;
  const { game } = E.createGame(r, { venue: venueOf(r.venue), slot, host: HOST, hostDisplay: HOST_NAME, needed: r.players, ladder: r.ladder, now: state.now, seed: 1 });
  apply(E.invite(game, state.plan.candidates.slice(0, 6), { now: state.now, profiles: DEMO_PROFILES }));
}
function advance(target) {
  const g = state.game, s = Date.parse(g.slot.start), e = Date.parse(g.slot.end);
  state.now = localIso({ t24: s - 24 * H, t2: s - 2 * H, past: e + 60000 }[target]);
  const due = E.dueReminders(state.game, { now: state.now });
  pushOut(due);
  for (const kind of new Set(due.map((m) => m.kind))) state.game = E.markReminderSent(state.game, kind, { now: state.now }).game;
}
function submitScore() {
  const g = state.game, num = (v) => (v === '' ? NaN : Number(v));
  const sides = ui.sides.map((p, i) => ({ players: [...p], score: num(i ? ui.sb : ui.sa) }));
  const before = Object.fromEntries(g.roster.in.map((h) => [h, ratingOf(h, state.ledger).value]));
  const out = E.submitScore(g, { by: HOST, sides, now: state.now });
  state.ratingsBefore = before;
  apply(out);
}
function widenBand() {
  const g = state.game, taken = [...g.roster.in, ...g.roster.invited, ...g.roster.waitlist, ...g.roster.maybe, ...g.roster.out];
  const need = Math.max(1, g.needed - g.roster.in.length - g.roster.invited.length);
  const cands = E.findCandidates({ ...g.request, level: null }, { profiles: DEMO_PROFILES, ratings: DEMO_RATINGS, now: state.now, exclude: taken, seed: 2, venues: DEMO_VENUES });
  if (!cands.length) throw new Error('No one else fits, even with the band widened.');
  apply(E.invite(g, cands, { now: state.now, profiles: DEMO_PROFILES, max: need }));
}
function newTime() {
  const g = state.game;
  if (g.proposals.length) return apply(E.acceptNewTime(g, g.proposals.length - 1, { now: state.now }));
  const slots = state.plan?.slots || [];
  if (slots.length < 2) throw new Error('No second slot to offer.');
  state.plan.slotIdx = (state.plan.slotIdx + 1) % slots.length; // no proposal yet: recreate the game on the next slot
  startGame(slots[state.plan.slotIdx]);
}
const cancelGame = () => apply(E.cancel(state.game, { by: HOST, now: state.now }));

// ---- player actions --------------------------------------------------------------------
function confirmByPlayer(h) {
  const g = state.game, entry = pendingEntry();
  const merged = state.ledger.map((e) => (e.id === entry.id ? E.confirmScore(g, entry, { by: h, now: state.now }).ledger[0] : e));
  const deltas = {};
  for (const p of g.roster.in) {
    const a = ratingOf(p, merged).value, b = state.ratingsBefore?.[p];
    if (a != null && b != null) deltas[p] = signed(a - b);
  }
  apply(E.confirmScore(g, entry, { by: h, now: state.now, deltas }));
}
function onChip(msgId, ans) {
  const m = state.outbox.find((x) => x.id === msgId), g = state.game, h = m.to, now = state.now;
  if (m.kind === 'score-confirm') {
    if (ans === 'confirm') confirmByPlayer(h); else apply(E.disputeScore(g, pendingEntry(), { by: h, now, note: 'score looks off' }));
  } else if (ans === 'newtime') { ui.newtimeFor = msgId; return; }
  else if (ans === 'in' || ans === 'out' || ans === 'maybe') apply(E.reply(g, { handle: h, answer: ans, now }));
  else if (ans === 'drop out') apply(E.reply(g, { handle: h, answer: 'out', now }));
  else if (ans === 'accept') {
    if (!g.proposals.length) throw new Error('There is no proposed time to accept.');
    apply(E.acceptNewTime(g, g.proposals.length - 1, { now }));
  } else if (ans === 'widen band') widenBand();
  else if (ans === 'new time') newTime();
  else if (ans === 'cancel') cancelGame();
  else if (ans === 'directions' || ans === 'add to calendar') { ui.note = `Prototype: "${ans}" would open the ${ans === 'directions' ? 'map' : 'calendar'} app.`; return; }
  ui.answered[msgId] = ans;
}
function newTimeSlot(msgId, i) {
  const m = state.outbox.find((x) => x.id === msgId);
  apply(E.reply(state.game, { handle: m.to, answer: 'newtime', slot: slotsFor(state.game)[i], now: state.now }));
  ui.answered[msgId] = 'newtime'; ui.newtimeFor = null;
}
function typedReply(h) {
  const g = state.game, { answer, slotHint } = E.parseReplyDetail(ui.typed);
  if (!answer) throw new Error("Couldn't read that as in, out, maybe or a new time.");
  let slot = null;
  if (answer === 'newtime') {
    const want = slotHint ? +slotHint.slice(0, 2) * 60 + +slotHint.slice(3) : 0, at = (s) => +s.start.slice(11, 13) * 60 + +s.start.slice(14, 16);
    slot = slotsFor(g).sort((a, b) => Math.abs(at(a) - want) - Math.abs(at(b) - want))[0] || null;
  }
  apply(E.reply(g, { handle: h, answer, slot, now: state.now }));
  for (const m of state.outbox) if (m.to === h && (m.kind === 'invite' || m.kind === 're-invite') && !ui.answered[m.id]) ui.answered[m.id] = answer;
  ui.typed = '';
}

// ---- Host view -------------------------------------------------------------------------
function requestCard() {
  const mic = SR ? '<button class="icon" type="button" data-act="mic" aria-label="Speak your request"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z"/></svg></button>' : '';
  return `<section class="card"><label class="lbl" for="req">What do you need?</label>
    <div class="row"><input id="req" type="text" value="${esc(ui.text)}" autocomplete="off" enterkeyhint="go">${mic}</div>
    <button class="btn primary" type="button" data-act="go">Go</button></section>`;
}
function question(parsed) {
  const k = parsed.missing[0];
  const [q, opts] = k === 'level' ? ['What level?', LEVELS.map((x) => [x, x])]
    : k === 'day' ? ['Which day?', DAYS.map((d) => [d.slice(0, 3), d])]
    : ['Where?', DEMO_VENUES.map((v) => [v.short, 'at ' + v.short])];
  return `<section class="card"><b>${q}</b><div class="chips">${opts.map(([label, add]) => `<button class="chip" type="button" data-act="fill" data-add="${esc(add)}">${esc(label)}</button>`).join('')}</div></section>`;
}
function proposal(plan) {
  const r = plan.parsed.request, v = venueOf(r.venue), cands = plan.candidates, slot = plan.slots[plan.slotIdx];
  if (!slot) return `<section class="card"><b>${esc(v.short)}</b><p class="muted">No open slot at ${esc(v.short)} in that window. Try another time of day.</p></section>`;
  const others = plan.slots.map((s, i) => [s, i]).filter(([, i]) => i !== plan.slotIdx);
  const rows = cands.slice(0, 6).map((c, i) => `<div class="cand"><div class="l1"><b>${esc(c.display)}</b><span class="badge ${i < 3 ? 'invite' : ''}">${i < 3 ? 'invite' : 'waitlist'}</span></div>
      <div class="fit"><span>${esc(c.rating.level)} &middot; ${esc(c.rating.tag)}</span><span class="bar" title="fit ${c.fit}"><i style="width:${Math.round(c.fit * 100)}%"></i></span></div>
      <div class="muted small">${esc(c.reasons.join(' · '))}</div></div>`).join('');
  const n = Math.min(r.players - 1, cands.length);
  return `<section class="card"><div><b>${esc(v.short)}</b> <span class="muted">${esc(v.address)}</span></div>
      <div class="when">${esc(E.whenLabel(slot))}</div><div class="muted small">${esc(slot.court)}${slot.note ? ' · ' + esc(slot.note) : ''}</div>
      ${others.length ? `<div class="chips">${others.map(([s, i]) => `<button class="chip small" type="button" data-act="slot" data-i="${i}">${esc(E.whenLabel(s))}</button>`).join('')}</div>` : ''}</section>
    <section class="card"><span class="lbl">Who fits (${cands.length})</span>${rows || '<p class="muted">Nobody matches. Try a different level or day.</p>'}</section>
    ${errLine()}<button class="btn primary" type="button" data-act="send" ${n ? '' : 'disabled'}>Send invites</button>
    <p class="note">Reaches ${n} people &middot; effect: consent &middot; each has opted in</p>`;
}
function rosterView(g) {
  const R = g.roster, cols = [['In', R.in], ['Invited', R.invited], ['Maybe', R.maybe], ['Waitlist', R.waitlist], ['Out', R.out]];
  return `<div class="roster">${cols.map(([t, l]) => `<div class="rcol"><div class="rh">${t} (${l.length})</div>${l.map((h) => `<span class="chip static">${esc(nameOf(h))}</span>`).join('') || '<span class="muted small">none</span>'}</div>`).join('')}</div>`;
}
function reminderView(g) {
  const sent = g.history.filter((x) => x.op === 'reminder-sent').map((x) => x.detail);
  const up = E.reminders(g, { now: state.now });
  const label = (k) => (k === 'reminder-24h' ? '24 hours before' : '2 hours before');
  return `<h2>Reminders</h2><div class="card"><p class="small mono">Clock: ${esc(clockLabel(state.now))}</p>
    ${up.map((x) => `<p>${label(x.kind)}: ${esc(clockLabel(x.at))}</p>`).join('')}${sent.map((k) => `<p class="muted">${label(k)}: sent</p>`).join('')}
    <div class="chips"><button class="chip small" type="button" data-act="adv" data-to="t24">+ to T-24h</button><button class="chip small" type="button" data-act="adv" data-to="t2">+ to T-2h</button><button class="chip small" type="button" data-act="adv" data-to="past">+ past game</button></div></div>`;
}
function scoreForm(g) {
  const key = g.roster.in.join(), half = g.needed / 2;
  if (ui.sKey !== key) { ui.sKey = key; ui.sides = [g.roster.in.slice(0, half), g.roster.in.slice(half)]; }
  const side = (i) => `<div class="side"><div class="sh">Side ${'AB'[i]}</div>${ui.sides[i].map((h) => `<button class="chip" type="button" data-act="swap" data-h="${h}">${esc(nameOf(h))}</button>`).join('')}
      <input class="num" id="s${'ab'[i]}" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="score" aria-label="Side ${'AB'[i]} score" value="${esc(i ? ui.sb : ui.sa)}"></div>`;
  return `<h2>Score</h2><div class="card"><p class="note">Tap a name to swap it to the other side. First to 11, win by one.</p><div class="sides">${side(0)}${side(1)}</div>${errLine()}
    <button class="btn primary" type="button" data-act="score">Submit score</button></div>`;
}
function recordedView(g) {
  const e = state.ledger.find((x) => x.id === g.ledgerEntryId), [a, b] = e.sides;
  const lines = g.roster.in.map((h) => {
    const after = ratingOf(h, state.ledger).value, before = state.ratingsBefore?.[h];
    return `<li><b>${esc(nameOf(h))}</b> ${before == null ? '' : before.toFixed(2) + ' → '}${after.toFixed(2)}${before == null ? '' : ` (${signed(after - before)})`}</li>`;
  }).join('');
  return `<h2>Recorded</h2><div class="card"><p><b>${a.players.map(nameOf).join(' &amp; ')}</b> ${a.score}–${b.score} ${b.players.map(nameOf).join(' &amp; ')}</p><ul>${lines}</ul></div>`;
}
function actionsFor(g) {
  const s = g.status, none = '<p class="muted">Nothing more to do here.</p>';
  if (s === 'inviting') return `<p class="muted">Waiting for replies. Switch to the Players tab to answer as each invitee.</p>`;
  if (s === 'short') return `<div class="card"><b>Still short of players.</b><div class="chips"><button class="chip" type="button" data-act="short" data-w="widen band">Widen band</button><button class="chip" type="button" data-act="short" data-w="new time">New time</button><button class="chip" type="button" data-act="short" data-w="cancel">Cancel</button></div></div>`;
  if (s === 'filled') return `<button class="btn primary" type="button" data-act="confirm">Confirm game</button><p class="note">Reaches ${g.roster.in.length} people &middot; effect: consent &middot; sends the address and booking link</p>`;
  if (s === 'confirmed') {
    const ended = Date.parse(state.now) >= Date.parse(g.slot.end);
    return `<p><b>Confirmed.</b> ${esc(g.venueInfo.address)}</p>${reminderView(g)}${ended ? '<button class="btn primary" type="button" data-act="played">Mark played</button>' : ''}`;
  }
  if (s === 'played') return scoreForm(g);
  if (s === 'scoring') return `<div class="card"><b>Score logged: ${g.score.sides[0].score}–${g.score.sides[1].score}.</b><p class="muted">Waiting for the other side to confirm (Players tab).</p></div>`;
  if (s === 'recorded') return recordedView(g);
  if (s === 'disputed') return `<div class="card"><b>Score disputed.</b><p class="muted">The ledger entry is flagged and does not count toward anyone's rating until it is sorted out.</p></div>`;
  return none;
}
function hostView() {
  const g = state.game;
  if (!g) {
    const p = state.plan;
    return requestCard() + (p ? (p.parsed.ok ? proposal(p) : question(p.parsed)) : '');
  }
  const canCancel = ['inviting', 'short', 'filled', 'confirmed'].includes(g.status);
  return `<section class="card"><div class="row" style="justify-content:space-between"><span class="small muted">${esc(ui.text)}</span><span class="pill status ${g.status}" data-testid="status">${g.status}</span></div>
    <div class="when">${esc(E.whenLabel(g.slot))}</div><div class="muted small">${esc(g.venueInfo.short)} · ${esc(g.venueInfo.address)}</div></section>
    ${rosterView(g)}<div style="margin-top:14px">${errLine()}${actionsFor(g)}</div>
    ${canCancel ? '<p><button class="link" type="button" data-act="cancel">Cancel game</button></p>' : ''}
    ${g.status === 'cancelled' ? '<p>The game is cancelled. Use Reset to start over.</p>' : ''}`;
}

// ---- Players view ----------------------------------------------------------------------
function chipsFor(m) {
  const g = state.game;
  if (ui.answered[m.id]) return `<div class="foot">Replied: ${esc(ui.answered[m.id])}</div>`;
  if (!m.replies.length || !g || m.game !== g.id) return '';
  if (ui.newtimeFor === m.id) {
    const slots = slotsFor(g);
    return `<div class="foot">Pick a time</div><div class="chips">${slots.map((s, i) => `<button class="chip small" type="button" data-act="ntslot" data-m="${m.id}" data-i="${i}">${esc(E.whenLabel(s))}</button>`).join('') || '<span class="muted small">No other slot is open.</span>'}</div>`;
  }
  return `<div class="chips">${m.replies.map((r) => `<button class="chip" type="button" data-act="chip" data-m="${m.id}" data-ans="${esc(r)}">${esc(cap(r))}</button>`).join('')}</div>`;
}
function playersView() {
  const handles = [...new Set(state.outbox.map((m) => m.to))];
  if (!handles.length) return '<p class="muted">No messages yet. Send invites from the Host tab and they appear here, as each person would see them.</p>';
  if (!handles.includes(ui.player)) ui.player = handles[0];
  const msgs = state.outbox.filter((m) => m.to === ui.player), g = state.game;
  const canType = g && ui.player !== HOST && [...Object.values(g.roster)].some((l) => l.includes(ui.player));
  return `<div class="seg" role="group" aria-label="Player">${handles.map((h) => `<button type="button" data-act="player" data-h="${h}" aria-pressed="${h === ui.player}">${esc(nameOf(h))}</button>`).join('')}</div>
    ${errLine()}${ui.note ? `<p class="note">${esc(ui.note)}</p>` : ''}
    ${msgs.map((m) => `<div class="msg"><div class="bub"><span class="k">${esc(m.kind)}</span>${esc(m.text)}</div><div class="foot">from the Communicator · no phone numbers or emails are shared</div>${chipsFor(m)}</div>`).join('')}
    ${canType ? `<div class="row" style="margin-top:16px"><input id="typed" type="text" placeholder="or type a reply" aria-label="or type a reply" value="${esc(ui.typed)}" autocomplete="off"><button class="btn sm" type="button" data-act="typed" data-h="${ui.player}">Send</button></div>` : ''}`;
}

// ---- Bot map view ----------------------------------------------------------------------
function ledgerRow(e) {
  let what, score;
  if (e.kind === 'game') { what = `${e.sides[0].players.map(nameOf).join(' &amp; ')} vs ${e.sides[1].players.map(nameOf).join(' &amp; ')}`; score = `${e.sides[0].score}–${e.sides[1].score}`; }
  else { what = esc(nameOf(e.sides[0].players[0])); score = `place ${e.place} · ${e.level}`; }
  return `<div class="lrow"><div><b class="mono">${e.kind}</b> ${what}</div><div class="mono">${score}</div>
    <div class="muted small">${esc(clockLabel(e.at))} · ${e.confirmations.length} confirmation${e.confirmations.length === 1 ? '' : 's'}</div><div><span class="pill ${e.status}">${e.status}</span></div></div>`;
}
function privacyCheck() {
  const s = JSON.stringify(state.outbox), m = /@|\d{7,}/.exec(s);
  return m ? `FOUND "${m[0]}" in: …${s.slice(Math.max(0, m.index - 30), m.index + 30)}…` : 'clean';
}
function botmapView() {
  const actions = E.ACTIONS.map((a) => `<div class="arow"><span class="nm">${esc(a.name)}</span><span class="pill ${a.effect}">${a.effect}</span><span class="who">who: ${esc(a.who)}</span><span class="wh">${esc(a.description)}</span></div>`).join('');
  const entries = [...state.ledger].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const table = DEMO_PROFILES.map((p) => L.publicRating(ratingOf(p.handle, state.ledger))).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const ratings = table.map((r) => `<tr><td>${esc(nameOf(r.handle))}</td><td class="mono">${r.value == null ? '—' : r.value.toFixed(2)} ±${r.plusMinus?.toFixed(2) ?? '?'}</td><td>${esc(r.tag ?? '')}</td></tr>`).join('');
  return `<p>Every action a bot can take here carries one of three labels. Consent means it reaches a person: they opted in, and the host tapped to send.</p>
    <div class="card" style="padding:4px 14px">${actions}</div>
    <h2>Ledger (${entries.length})</h2><div class="card" style="padding:4px 14px">${entries.map(ledgerRow).join('')}</div>
    <h2>Public ratings</h2><div class="card"><table><thead><tr><th>Player</th><th>Rating</th><th>Tag</th></tr></thead><tbody>${ratings}</tbody></table></div>
    <h2>Privacy check</h2><div class="card"><p class="small muted">Scans every message ever produced for an @ or a run of 7+ digits.</p><pre id="privacy">${esc(privacyCheck())}</pre></div>`;
}

// ---- wiring ----------------------------------------------------------------------------
function render() {
  document.getElementById('view').innerHTML = { host: hostView, players: playersView, botmap: botmapView }[ui.tab]();
  for (const t of document.querySelectorAll('.tab')) t.setAttribute('aria-selected', String(t.dataset.t === ui.tab));
}
const ACTS = {
  tab: (d) => { ui.tab = d.t; ui.error = ''; scrollTo(0, 0); },
  reset: () => { reset(); scrollTo(0, 0); },
  go, fill: (d) => { ui.text += ' ' + d.add; go(); },
  slot: (d) => { state.plan.slotIdx = +d.i; },
  send: () => startGame(state.plan.slots[state.plan.slotIdx]),
  confirm: () => apply(E.confirm(state.game, { now: state.now })),
  adv: (d) => advance(d.to),
  played: () => apply(E.markPlayed(state.game, { now: state.now, force: true })),
  swap: (d) => { const s = ui.sides.findIndex((x) => x.includes(d.h)), o = ui.sides[1 - s], i = ui.sides[s].indexOf(d.h); [ui.sides[s][i], o[0]] = [o[0], ui.sides[s][i]]; },
  score: submitScore,
  short: (d) => onChipHost(d.w), cancel: cancelGame,
  player: (d) => { ui.player = d.h; ui.error = ''; ui.note = ''; ui.newtimeFor = null; },
  chip: (d) => onChip(d.m, d.ans), ntslot: (d) => newTimeSlot(d.m, +d.i),
  typed: (d) => typedReply(d.h),
  mic: () => {
    const rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (ev) => { ui.text = ev.results[0][0].transcript; render(); };
    rec.onerror = () => { ui.error = 'The microphone did not work. Type your request instead.'; render(); };
    rec.start();
  },
};
function onChipHost(w) { if (w === 'widen band') widenBand(); else if (w === 'new time') newTime(); else cancelGame(); }
function dispatch(name, data) {
  try { ui.error = ''; ACTS[name]?.(data); } catch (err) { ui.error = err.message; }
  render();
}
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (el) dispatch(el.dataset.act, el.dataset);
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'req') ui.text = t.value; else if (t.id === 'sa') ui.sa = t.value; else if (t.id === 'sb') ui.sb = t.value; else if (t.id === 'typed') ui.typed = t.value;
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  if (ev.target.id === 'req') dispatch('go', {});
  else if (ev.target.id === 'typed') dispatch('typed', { h: ui.player });
});

reset();
render();
