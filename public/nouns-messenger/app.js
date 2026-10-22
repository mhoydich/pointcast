/* Nouns Messenger — local-first instant messenger. Nothing leaves the phone.
   Made in El Segundo by Mike, October 2026. */
(() => {
  'use strict';
  const KEY = 'nouns-messenger/v1';
  const NOG = '⌐◨-◨';
  const COLORS = { yellow: '#ffc110', red: '#e4393c', green: '#4bea69', blue: '#2b83f6', pink: '#ff8fb1', cool: '#d5d7e1', warm: '#e1d7d5', ink: '#9a9dad' };
  const $ = (id) => document.getElementById(id);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const now = () => Date.now();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gestured = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, () => { gestured = true; }, { once: true, passive: true }));
  const buzz = (ms = 8) => { if (!gestured) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

  /* ---------- Companions: scripted, run on the phone, never a person ---------- */
  const COMPANIONS = [
    { id: 'desk', name: 'Noggles Desk', color: 'yellow', tag: 'the front desk of the town',
      hello: 'gm. This is the Desk. Ask me where things are in town, or just say hi.',
      replies: [
        [/\b(gm|good morning|morning)\b/i, ['gm gm ⌐◨-◨', 'gm. Coffee is on at the Desk. What are we doing today?']],
        [/\b(hi|hello|hey|yo)\b/i, ['hey. Desk here. What do you need?', 'hi! Say "map" and I will point you around.']],
        [/\b(map|where|town|around)\b/i, ['Town map: pointcast.xyz/town/ \nThe Desk, the courts, the beach, the Yard. Pick one and I will walk you over.']],
        [/\b(weather|sky|sun|rain|fog)\b/i, ['For the real sky over El Segundo, the Air page has it live: pointcast.xyz/air/ \nI only know what I was told this morning: marine layer till ten, then blue.']],
        [/\b(noun|nouns|noggles)\b/i, ['Nouns are one per day, forever. Noggles are the glasses. You are wearing them right now, in a way.', 'Nouns Money is down the hall: pointcast.xyz/nouns-money/']],
        [/\b(thanks|thank you|ty)\b/i, ['any time ⌐◨-◨', 'that is what a Desk is for.']],
        [/\?$/, ['Good question. I would try the Desk page: pointcast.xyz/desk/ \nThe house agents there answer with real numbers.', 'I am a scripted Noun, so I will answer like one: probably yes, check the town.']],
      ],
      fallback: ['noted.', 'ok ⌐◨-◨', 'I wrote that on the Desk pad. Anything else?', 'say "map" if you get lost.'] },
    { id: 'tides', name: 'Tide Noun', color: 'blue', tag: 'lives at the bottom of Grand Ave',
      hello: 'Tide Noun. I sit where Grand Ave meets the sand. Ask about the water.',
      replies: [
        [/\b(surf|wave|swell|tide|water|beach|ocean)\b/i, ['Live water is on the Air page: pointcast.xyz/air/ \nMy own report: it looks like the ocean. It usually does.', 'Low tide is the best walking tide. Go south toward the jetty and back.']],
        [/\b(cold|wetsuit|temp)\b/i, ['Bring the 3/2 in October. The water does not care that it is still sunny.']],
        [/\b(gm|hi|hello|hey)\b/i, ['gm from the sand 🌊', 'hey. The sand is cold until about eleven.']],
        [/\b(sunset|golden)\b/i, ['Sunset from the top of the dune, not the bottom. Trust me on this one.']],
      ],
      fallback: ['🌊', 'the water heard that.', 'I will tell the pelicans.', 'come down later, the light gets good.'] },
    { id: 'courts', name: 'Court Noun', color: 'green', tag: 'rec park pickleball, paddle in hand',
      hello: 'Court Noun checking in from Rec Park. Games to eleven, win by two.',
      replies: [
        [/\b(pickle|pickleball|court|paddle|dink|game)\b/i, ['Courts: pointcast.xyz/pickleball/home/ \nOpen play fills by 8. Bring your own balls and a good attitude.', 'Third shot drop. Then be patient. That is the whole sport.']],
        [/\b(score|win|lost|lose)\b/i, ['Nobody remembers the score. Everybody remembers who called the line.']],
        [/\b(gm|hi|hello|hey)\b/i, ['hey hey. Paddle up?', 'gm. Courts are dry.']],
        [/\b(tired|sore|hurt)\b/i, ['Stretch the calves. Walk the lot once. Then one more game.']],
      ],
      fallback: ['got it. see you at the fence.', '🏓', 'next game is yours.', 'dinks only until you say otherwise.'] },
    { id: 'night', name: 'Night Shift', color: 'pink', tag: 'quiet hours, after the town closes',
      hello: 'Night Shift. Everyone else is asleep. Leave the thing you were going to forget.',
      replies: [
        [/\b(remember|remind|forget|todo|note)\b/i, ['Written down. I keep it here on your phone, nowhere else.', 'Saved. I do not sync, so it is only here, which is the point.']],
        [/\b(tired|sleep|late|night)\b/i, ['Go to bed. The town will still be here.', 'The marine layer is already coming in. Good sign to stop.']],
        [/\b(idea|what if|maybe)\b/i, ['That is a morning idea wearing night clothes. Leave it and look again at 7.']],
        [/\b(gm|hi|hello|hey)\b/i, ['hey. quiet in here.', 'hi. I am mostly just a lamp that listens.']],
      ],
      fallback: ['…', 'kept.', 'ok. anything else before lights out?', 'noted, quietly.'] },
  ];

  /* ---------- State ---------- */
  let state = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.threads)) return s; } catch (_) {}
    return { me: { name: '', color: 'red' }, threads: [], seeded: false };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
  function seed() {
    if (state.seeded) return;
    const desk = COMPANIONS[0];
    const t = ensureThread({ id: 'c-desk', name: desk.name, kind: 'bot', color: desk.color, bot: desk.id, tag: desk.tag });
    t.messages.push(msg('them', desk.hello, now() - 60000));
    t.messages.push(msg('them', 'Tap the + up top to meet the others, or ' + NOG + ' at the left for the about card.', now() - 30000));
    t.unread = 2;
    ensureThread({ id: 'self', name: 'Note to self', kind: 'self', color: 'cool', tag: 'only you, only here' }).created = now() - 120000;
    state.seeded = true; save();
  }
  function msg(from, text, ts, extra) { return Object.assign({ id: uid(), from, text, ts: ts || now(), status: from === 'me' ? 'sent' : 'read' }, extra || {}); }
  function ensureThread(spec) {
    let t = state.threads.find((x) => x.id === spec.id);
    if (!t) { t = Object.assign({ messages: [], unread: 0, created: now() }, spec); state.threads.push(t); }
    return t;
  }
  function peerThread(name) {
    const id = 'p-' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const palette = ['blue', 'green', 'yellow', 'pink'];
    return ensureThread({ id, name: name.trim(), kind: 'peer', color: palette[name.length % palette.length], tag: 'notes passed by link' });
  }
  const sorted = () => [...state.threads].sort((a, b) => (last(b)?.ts || b.created) - (last(a)?.ts || a.created));
  const last = (t) => t.messages[t.messages.length - 1];

  /* ---------- DOM ---------- */
  const app = $('app'), paneList = $('pane-list'), paneChat = $('pane-chat');
  const listEl = $('threads'), msgsEl = $('messages'), scrollEl = $('scroll'), typingEl = $('typing');
  const input = $('composer-input'), sendBtn = $('btn-send'), composer = $('composer');
  const tray = $('tray'), sheetWrap = $('sheet-wrap'), toastEl = $('toast');
  let current = null, wide = matchMedia('(min-width: 820px)');

  /* ---------- Rendering ---------- */
  function fmtTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function fmtDay(ts) {
    const d = new Date(ts), t = new Date(); const y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return 'Today';
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function fmtWhen(ts) { const d = new Date(ts); return d.toDateString() === new Date().toDateString() ? fmtTime(ts) : fmtDay(ts); }
  function avatarText(t) { return t.kind === 'self' ? '✎' : NOG; }
  const isBig = (text) => /^[\p{Extended_Pictographic}‍️\s]{1,6}$/u.test(text) || text === NOG;

  function renderList() {
    const q = ($('search').value || '').trim().toLowerCase();
    const items = sorted().filter((t) => !q || t.name.toLowerCase().includes(q) || t.messages.some((m) => m.text.toLowerCase().includes(q)));
    listEl.replaceChildren();
    if (!items.length) {
      const li = document.createElement('li'); li.className = 'empty';
      li.innerHTML = `<span class="noggles">${NOG}</span>${q ? 'Nothing matches.' : 'No chats yet. Tap + to start one.'}`;
      listEl.append(li); return;
    }
    for (const t of items) {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.className = 'thread'; b.type = 'button';
      b.setAttribute('aria-current', current && current.id === t.id ? 'true' : 'false');
      const l = last(t);
      b.innerHTML = `<span class="avatar${t.kind === 'self' ? ' avatar-self' : ''}" style="--av:${COLORS[t.color] || COLORS.yellow}" aria-hidden="true">${avatarText(t)}</span>
        <span class="thread-main"><strong></strong><span></span></span>
        <span class="thread-meta"><time></time>${t.unread ? `<span class="badge">${t.unread}</span>` : ''}</span>`;
      b.querySelector('strong').textContent = t.name;
      b.querySelector('.thread-main span').textContent = l ? (l.from === 'me' ? 'You: ' : '') + l.text.replace(/\s+/g, ' ') : t.tag || '';
      b.querySelector('time').textContent = l ? fmtWhen(l.ts) : '';
      b.addEventListener('click', () => open(t.id));
      li.append(b); listEl.append(li);
    }
  }

  function renderThread() {
    const t = current; if (!t) return;
    $('peer-name').textContent = t.name;
    $('peer-status').textContent = t.kind === 'bot' ? 'companion · replies on your phone' : t.kind === 'self' ? 'only you, only here' : 'notes passed by link';
    const av = $('peer-avatar'); av.textContent = avatarText(t); av.style.setProperty('--av', COLORS[t.color] || COLORS.yellow); av.classList.toggle('avatar-self', t.kind === 'self');
    msgsEl.replaceChildren();
    let day = '';
    t.messages.forEach((m, i) => {
      const d = fmtDay(m.ts);
      if (d !== day) { day = d; const li = document.createElement('li'); li.className = 'day'; li.textContent = d; msgsEl.append(li); }
      const li = document.createElement('li');
      const next = t.messages[i + 1];
      const lastInRun = !next || next.from !== m.from || next.ts - m.ts > 120000;
      li.className = `msg ${m.from}${isBig(m.text) ? ' big' : ''}${m.reaction ? ' has-react' : ''}`;
      li.dataset.id = m.id;
      const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = m.text;
      if (reduced) bubble.style.animation = 'none';
      li.append(bubble);
      if (m.reaction) { const r = document.createElement('span'); r.className = 'react'; r.textContent = m.reaction; li.append(r); }
      if (lastInRun) {
        const meta = document.createElement('div'); meta.className = 'meta';
        meta.innerHTML = `<span>${fmtTime(m.ts)}</span>${m.from === 'me' && t.kind !== 'self' ? `<span class="ticks ${m.status === 'read' ? 'read' : ''}" aria-label="${m.status}">${m.status === 'read' ? '✓✓' : '✓'}</span>` : ''}`;
        li.append(meta);
      }
      attachPress(li, m);
      msgsEl.append(li);
    });
    scrollBottom(true);
  }
  function scrollBottom(instant) { requestAnimationFrame(() => scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: instant || reduced ? 'auto' : 'smooth' })); }

  /* ---------- Navigation ---------- */
  function open(id) {
    current = state.threads.find((t) => t.id === id); if (!current) return;
    current.unread = 0; save();
    app.dataset.view = 'chat'; paneChat.hidden = false; paneChat.classList.remove('idle');
    if (!wide.matches) paneList.hidden = true;
    renderThread(); renderList();
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    if (wide.matches) input.focus({ preventScroll: true });
  }
  function back() {
    current = null; app.dataset.view = 'list'; paneList.hidden = false;
    if (wide.matches) paneChat.classList.add('idle'); else paneChat.hidden = true;
    history.replaceState(null, '', location.pathname);
    renderList();
  }
  $('btn-back').addEventListener('click', back);
  wide.addEventListener('change', () => { if (wide.matches) { paneList.hidden = false; paneChat.hidden = false; if (!current) paneChat.classList.add('idle'); } else if (current) paneList.hidden = true; else paneChat.hidden = true; });

  /* ---------- Composer ---------- */
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; }
  input.addEventListener('input', () => { autosize(); sendBtn.disabled = !input.value.trim(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); composer.requestSubmit(); } });
  composer.addEventListener('submit', (e) => {
    e.preventDefault(); const text = input.value.trim(); if (!text || !current) return;
    send(text); input.value = ''; autosize(); sendBtn.disabled = true; input.focus({ preventScroll: true });
  });
  $('btn-emoji').addEventListener('click', () => { if (!current) return; send(NOG); });
  function send(text) {
    const t = current; const m = msg('me', text); t.messages.push(m); save(); buzz();
    renderThread(); renderList();
    if (t.kind === 'bot') reply(t, m);
  }

  /* ---------- Companion replies ---------- */
  const timers = new Map();
  function reply(t, m) {
    const bot = COMPANIONS.find((b) => b.id === t.bot); if (!bot) return;
    const hit = bot.replies.find(([re]) => re.test(m.text));
    const pool = hit ? hit[1] : bot.fallback;
    const text = pool[Math.floor(Math.random() * pool.length)];
    clearTimeout(timers.get(t.id));
    const readAt = 500 + Math.random() * 600, typeAt = readAt + 400, doneAt = typeAt + Math.min(2600, 500 + text.length * 25);
    timers.set(t.id, setTimeout(() => {
      m.status = 'read'; save(); if (current === t) renderThread();
      setTimeout(() => { if (current === t) { typingEl.hidden = false; scrollBottom(); } }, typeAt - readAt);
      setTimeout(() => {
        typingEl.hidden = true;
        t.messages.push(msg('them', text)); if (current !== t) t.unread = (t.unread || 0) + 1; save();
        if (current === t) { renderThread(); buzz(12); } renderList();
      }, doneAt - readAt);
    }, readAt));
  }

  /* ---------- Reactions: long-press or right-click ---------- */
  let pressTimer = null, trayTarget = null;
  function attachPress(li, m) {
    const start = (e) => { clearTimeout(pressTimer); pressTimer = setTimeout(() => { buzz(15); showTray(li, m); }, 420); };
    const cancel = () => clearTimeout(pressTimer);
    li.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel', 'pointermove'].forEach((ev) => li.addEventListener(ev, cancel));
    li.addEventListener('contextmenu', (e) => { e.preventDefault(); showTray(li, m); });
  }
  function showTray(li, m) {
    trayTarget = m; tray.hidden = false;
    const r = li.querySelector('.bubble').getBoundingClientRect(); const w = tray.offsetWidth, h = tray.offsetHeight;
    let left = r.left + r.width / 2 - w / 2; left = Math.max(8, Math.min(innerWidth - w - 8, left));
    let top = r.top - h - 8; if (top < 8) top = r.bottom + 8;
    tray.style.left = left + 'px'; tray.style.top = top + 'px';
  }
  function hideTray() { tray.hidden = true; trayTarget = null; }
  tray.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !trayTarget || !current) return;
    if (b.dataset.act === 'delete') current.messages = current.messages.filter((x) => x.id !== trayTarget.id);
    else trayTarget.reaction = trayTarget.reaction === b.dataset.r ? '' : b.dataset.r;
    save(); hideTray(); renderThread(); renderList(); buzz();
  });
  document.addEventListener('pointerdown', (e) => { if (!tray.hidden && !tray.contains(e.target)) hideTray(); }, true);
  scrollEl.addEventListener('scroll', hideTray, { passive: true });

  /* ---------- Sheets ---------- */
  function openSheet(id) { sheetWrap.hidden = false; for (const s of sheetWrap.querySelectorAll('.sheet')) s.hidden = s.id !== id; const f = $(id).querySelector('input, button'); f && setTimeout(() => f.focus({ preventScroll: true }), 50); }
  function closeSheets() { sheetWrap.hidden = true; }
  $('scrim').addEventListener('click', closeSheets);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheets(); hideTray(); } });

  // About
  $('btn-about').addEventListener('click', () => { $('me-name').value = state.me.name; renderSwatches(); openSheet('sheet-about'); });
  $('btn-about-done').addEventListener('click', () => { state.me.name = $('me-name').value.trim().slice(0, 24); save(); closeSheets(); });
  $('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every chat on this phone? There is no undo and no backup.')) return;
    state = { me: state.me, threads: [], seeded: false }; save(); seed(); current = null; back(); closeSheets(); toast('Cleared. Fresh noggles.');
  });
  function renderSwatches() {
    const el = $('swatches'); el.replaceChildren();
    for (const [k, v] of Object.entries(COLORS)) {
      if (k === 'ink' || k === 'cool' || k === 'warm') continue;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'swatch'; b.role = 'radio'; b.style.background = v; b.setAttribute('aria-label', k);
      b.setAttribute('aria-checked', state.me.color === k ? 'true' : 'false');
      b.addEventListener('click', () => { state.me.color = k; applyMe(); save(); renderSwatches(); });
      el.append(b);
    }
  }
  function applyMe() { document.documentElement.style.setProperty('--me', COLORS[state.me.color] || COLORS.red); document.documentElement.style.setProperty('--me-ink', ['yellow', 'green', 'cool', 'warm', 'pink'].includes(state.me.color) ? '#16171d' : '#fff'); document.documentElement.style.setProperty('--accent', COLORS[state.me.color] === COLORS.cool || COLORS[state.me.color] === COLORS.warm ? COLORS.red : COLORS[state.me.color] || COLORS.red); }

  // New chat
  $('btn-new').addEventListener('click', () => {
    const ul = $('pick-companions'); ul.replaceChildren();
    for (const c of COMPANIONS) {
      const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button';
      b.innerHTML = `<span class="avatar" style="--av:${COLORS[c.color]}" aria-hidden="true">${NOG}</span><span><strong></strong><span></span></span>`;
      b.querySelector('strong').textContent = c.name; b.querySelector('span span').textContent = c.tag;
      b.addEventListener('click', () => {
        const t = ensureThread({ id: 'c-' + c.id, name: c.name, kind: 'bot', color: c.color, bot: c.id, tag: c.tag });
        if (!t.messages.length) t.messages.push(msg('them', c.hello));
        save(); closeSheets(); open(t.id);
      });
      li.append(b); ul.append(li);
    }
    const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<span class="avatar avatar-self" aria-hidden="true">✎</span><span><strong>Note to self</strong><span>only you, only here</span></span>`;
    b.addEventListener('click', () => { const t = ensureThread({ id: 'self', name: 'Note to self', kind: 'self', color: 'cool', tag: 'only you, only here' }); save(); closeSheets(); open(t.id); });
    li.append(b); ul.append(li);
    $('peer-input').value = ''; openSheet('sheet-new');
  });
  $('form-peer').addEventListener('submit', (e) => { e.preventDefault(); const n = $('peer-input').value.trim(); if (!n) return; const t = peerThread(n); save(); closeSheets(); open(t.id); });

  // Pass a note: the last message you sent becomes a link; opening it imports the message from you.
  function b64url(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64url(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  $('btn-share').addEventListener('click', () => {
    if (!current) return;
    const mine = [...current.messages].reverse().find((m) => m.from === 'me');
    if (!mine) { toast('Send something first, then pass it on.'); return; }
    const from = state.me.name || 'a Noun';
    const payload = { v: 1, from, to: current.kind === 'peer' ? current.name : '', text: mine.text, ts: mine.ts, color: state.me.color };
    const url = location.origin + location.pathname + '#n=' + b64url(JSON.stringify(payload));
    $('share-url').value = url;
    $('share-lede').textContent = `This link carries “${mine.text.slice(0, 60)}${mine.text.length > 60 ? '…' : ''}” from ${from}. Whoever opens it sees it in their Nouns Messenger.`;
    $('btn-native-share').hidden = !navigator.share;
    openSheet('sheet-share');
  });
  $('btn-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('share-url').value); toast('Link copied'); } catch (_) { $('share-url').select(); toast('Select and copy the link'); } });
  $('btn-native-share').addEventListener('click', async () => { try { await navigator.share({ title: 'A note from Nouns Messenger', url: $('share-url').value }); closeSheets(); } catch (_) {} });
  function importNote() {
    const m = /[#&]n=([A-Za-z0-9_-]+)/.exec(location.hash); if (!m) return false;
    try {
      const p = JSON.parse(unb64url(m[1])); if (!p || typeof p.text !== 'string') return false;
      const t = peerThread(String(p.from || 'a Noun').slice(0, 24));
      if (p.color && COLORS[p.color]) t.color = p.color;
      const text = p.text.slice(0, 2000);
      if (!t.messages.some((x) => x.text === text && Math.abs(x.ts - (p.ts || 0)) < 1000)) { t.messages.push(msg('them', text, Number(p.ts) || now())); t.unread = (t.unread || 0) + 1; }
      save(); history.replaceState(null, '', location.pathname); open(t.id); toast(`Note from ${t.name}`); buzz(20);
      return true;
    } catch (_) { return false; }
  }

  /* ---------- Misc ---------- */
  let toastTimer;
  function toast(text) { toastEl.textContent = text; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (toastEl.hidden = true), 2200); }
  $('search').addEventListener('input', renderList);
  $('peer-head').addEventListener('click', () => { if (current && current.kind === 'bot') toast(`${current.name}: a scripted companion. Replies are written on your phone.`); else if (current) toast(current.tag || current.name); });
  if (window.visualViewport) {
    const vv = window.visualViewport; let lastH = vv.height;
    vv.addEventListener('resize', () => { if (vv.height < lastH - 80) scrollBottom(true); lastH = vv.height; });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderList(); });
  if (location.search.includes('theme=dark')) document.documentElement.dataset.theme = 'dark';

  /* ---------- Boot ---------- */
  seed(); applyMe();
  if (wide.matches) { paneChat.hidden = false; paneChat.classList.add('idle'); }
  renderList();
  if (!importNote()) { const id = location.hash.slice(1); if (id && state.threads.some((t) => t.id === id)) open(id); }
  window.addEventListener('hashchange', () => { importNote(); });
})();
