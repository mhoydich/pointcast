/* PMM — PointCast Mobile Messaging. Phone to phone over WebRTC. No account, no server in the middle.
   Made in El Segundo by Mike, October 2026. */
(() => {
  'use strict';
  const KEY = 'pmm/v1';
  const SIGNAL = '/api/pmm/signal';
  const PING = '/api/ping';
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const GLYPHS = ['▌', '▐', '▀', '▄', '█', '▖', '▗', '▘', '▝', '▚', '▞', '░', '▒', '▓', '●', '◆'];
  const MOODS = [
    ['calm', '#2F86D8'], ['hyped', '#E8453C'], ['soft', '#7E57B5'], ['sunny', '#F5D142'],
    ['salty', '#58B947'], ['tired', '#8A86A8'], ['curious', '#F28C28'], ['low', '#4B5BA6'],
  ];
  const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }] };
  const CHUNK = 16 * 1024;
  const $ = (id) => document.getElementById(id);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const now = () => Date.now();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 820px)');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let gestured = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, () => { gestured = true; }, { once: true, passive: true }));
  const buzz = (ms = 8) => { if (!gestured) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

  /* ---------- bytes ---------- */
  const b64u = (buf) => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; };
  const enc = new TextEncoder(), dec = new TextDecoder();
  async function pack(str) {
    const bytes = enc.encode(str);
    if ('CompressionStream' in window) {
      try { const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(bytes); w.close(); return 'z' + b64u(await new Response(cs.readable).arrayBuffer()); } catch (_) {}
    }
    return 'p' + b64u(bytes);
  }
  async function unpack(str) {
    const kind = str[0], bytes = unb64u(str.slice(1));
    if (kind === 'p') return dec.decode(bytes);
    const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(bytes); w.close();
    return dec.decode(await new Response(ds.readable).arrayBuffer());
  }
  const sha256 = async (str) => b64u(await crypto.subtle.digest('SHA-256', enc.encode(str)));
  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

  /* ---------- identity: a keypair minted on the phone ---------- */
  let signKey = null; const verifyKeys = new Map();
  async function fingerprint(pub) { const d = await crypto.subtle.digest('SHA-256', enc.encode(`${pub.x}.${pub.y}`)); return hex(d); }
  const sigilOf = (fp) => { const b = unhex(fp.slice(0, 8)); return GLYPHS[b[0] & 15] + GLYPHS[b[1] & 15] + GLYPHS[b[2] & 15] + GLYPHS[b[3] & 15]; };
  const unhex = (h) => { const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return b; };
  async function ensureIdentity() {
    if (!state.me.pub || !state.me.priv) {
      const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      state.me.pub = await crypto.subtle.exportKey('jwk', kp.publicKey);
      state.me.priv = await crypto.subtle.exportKey('jwk', kp.privateKey);
      state.me.id = await fingerprint(state.me.pub); save();
    }
    if (!state.me.id) { state.me.id = await fingerprint(state.me.pub); save(); }
    signKey = await crypto.subtle.importKey('jwk', state.me.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  }
  async function verifierFor(f) {
    if (!verifyKeys.has(f.id)) verifyKeys.set(f.id, await crypto.subtle.importKey('jwk', f.pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']));
    return verifyKeys.get(f.id);
  }
  const canon = (m) => `${m.id}|${m.ts}|${m.text || ''}|${m.amount || ''}`;
  async function sign(m) { return b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signKey, enc.encode(canon(m)))); }
  async function verify(f, m) { try { return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await verifierFor(f), unb64u(m.sig || ''), enc.encode(canon(m))); } catch (_) { return false; } }

  /* ---------- state ---------- */
  let state = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.me && Array.isArray(s.friends)) return s; } catch (_) {}
    return { me: { name: '', place: '', tz: '', mood: 'calm', live: true, sound: true }, friends: [], si: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
  const tzName = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { return ''; } };
  const localTime = (tz) => { try { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: tz || undefined }); } catch (_) { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } };
  const moodColor = (m) => (MOODS.find(([k]) => k === m) || MOODS[0])[1];
  const validMood = (m) => (MOODS.some(([k]) => k === m) ? m : 'calm');
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const friendById = (id) => state.friends.find((f) => f.id === id);
  const lastMsg = (f) => f.messages[f.messages.length - 1];
  const myName = () => state.me.name || 'NOUN';
  const balanceOf = (f) => (f.ledger || []).reduce((n, t) => n + (t.settled ? 0 : t.amount * (t.by === 'me' ? (t.dir === 'owe' ? 1 : -1) : (t.dir === 'owe' ? -1 : 1))), 0);

  /* ---------- sound: square waves, two notes ---------- */
  let ac = null;
  function blip(up) {
    if (!state.me.sound || !gestured) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime; const notes = up ? [440, 660] : [660, 440];
      notes.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0.05, t + i * 0.07); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.06); o.connect(g).connect(ac.destination); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.07); });
    } catch (_) {}
  }

  /* ---------- DOM ---------- */
  const app = $('app'); const toastEl = $('toast'); let toastTimer;
  function toast(text) { toastEl.textContent = text; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (toastEl.hidden = true), 2400); }
  function show(view) {
    app.dataset.view = view;
    for (const p of ['lobby', 'load', 'chat', 'si']) $('pane-' + p).hidden = wide.matches ? false : p !== view;
  }
  function openSheet(id) { $('sheet-wrap').hidden = false; for (const s of document.querySelectorAll('.sheet')) s.hidden = s.id !== id; }
  function closeSheets() { $('sheet-wrap').hidden = true; }
  $('scrim').addEventListener('click', closeSheets);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheets(); });

  /* ---------- lobby ---------- */
  function renderMe() {
    $('me-name').textContent = myName().toUpperCase();
    $('me-id').textContent = state.me.id ? `SIGIL ${state.me.id.slice(0, 8).toUpperCase()} · ${(state.me.place || tzName()).toUpperCase()}` : 'minting your key…';
    $('me-sigil').textContent = state.me.id ? sigilOf(state.me.id) : '····';
    $('btn-mood').textContent = state.me.mood.toUpperCase();
    document.documentElement.style.setProperty('--mood-me', moodColor(state.me.mood));
  }
  function renderFriends() {
    const ul = $('friends'); ul.replaceChildren();
    if (!state.friends.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'NO FRIENDS LOADED. TAP LOAD "FRIEND" AND SEND THEM THE LINK.'; ul.append(li); return; }
    const sorted = [...state.friends].sort((a, b) => (lastMsg(b)?.ts || b.created) - (lastMsg(a)?.ts || a.created));
    for (const f of sorted) {
      const li = document.createElement('li'); const b = document.createElement('button'); b.className = 'friend'; b.type = 'button';
      b.setAttribute('aria-current', current && current.id === f.id ? 'true' : 'false');
      const online = peer && peer.friend === f && peer.dc && peer.dc.readyState === 'open';
      const l = lastMsg(f);
      b.innerHTML = `<span class="sigil" aria-hidden="true">${sigilOf(f.id)}</span><span class="friend-main"><strong></strong><span></span></span><span class="friend-meta"><span class="dot ${online ? '' : 'off'}" title="${online ? 'online' : 'offline'}"></span>${f.unread ? `<span class="badge">${f.unread}</span>` : ''}</span>`;
      b.querySelector('strong').textContent = f.name.toUpperCase() + (f.trusted ? ' ✓' : '');
      b.querySelector('.friend-main span').textContent = l ? (l.from === 'me' ? 'YOU: ' : '') + (l.text || l.label || '').replace(/\s+/g, ' ') : `${(f.mood || 'calm').toUpperCase()} · ${f.tz || ''}`;
      b.addEventListener('click', () => openChat(f.id));
      li.append(b); ul.append(li);
    }
  }
  async function ticker() {
    try {
      const r = await fetch('/now.json', { cache: 'no-store' }); if (!r.ok) return;
      const j = await r.json(); const latest = (j.latest || []).map((b) => b.title).filter(Boolean);
      if (latest.length) $('ticker').querySelector('span').textContent = 'NEW IN TOWN · ' + latest.join(' · ') + ' · POINTCAST.XYZ';
    } catch (_) {}
  }

  /* ---------- mood ---------- */
  $('btn-mood').addEventListener('click', () => {
    const el = $('moods'); el.replaceChildren();
    for (const [k, c] of MOODS) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mood'; b.role = 'radio'; b.style.setProperty('--m', c); b.textContent = k.toUpperCase();
      b.setAttribute('aria-checked', state.me.mood === k ? 'true' : 'false');
      b.addEventListener('click', () => { state.me.mood = k; save(); renderMe(); renderAtmo(); send({ t: 'mood', mood: k }); closeSheets(); blip(true); });
      el.append(b);
    }
    openSheet('sheet-mood');
  });

  /* ---------- settings ---------- */
  $('btn-settings').addEventListener('click', () => {
    $('set-name').value = state.me.name; $('set-place').value = state.me.place || ''; $('set-tz').value = state.me.tzAddr || '';
    $('set-live').checked = state.me.live !== false; $('set-sound').checked = state.me.sound !== false;
    $('set-key').textContent = state.me.id ? `${sigilOf(state.me.id)}  ${state.me.id.slice(0, 16).toUpperCase()} · minted on this phone. Export it to keep your sigil if you clear the browser.` : 'minting…';
    openSheet('sheet-settings');
  });
  $('btn-settings-done').addEventListener('click', () => {
    state.me.name = $('set-name').value.trim().slice(0, 24); state.me.place = $('set-place').value.trim().slice(0, 32);
    state.me.tzAddr = $('set-tz').value.trim().slice(0, 40); state.me.live = $('set-live').checked; state.me.sound = $('set-sound').checked;
    save(); renderMe(); closeSheets(); send({ t: 'hello', ...helloBody() });
  });
  $('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ type: 'pmm-key-v1', me: state.me }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pmm-key-${state.me.id.slice(0, 8)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('btn-import').addEventListener('click', () => $('import-input').click());
  $('import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const j = JSON.parse(await file.text()); if (j.type !== 'pmm-key-v1' || !j.me?.priv?.d) throw 0; state.me = { ...state.me, ...j.me }; save(); await ensureIdentity(); renderMe(); toast('KEY LOADED'); closeSheets(); } catch (_) { toast('NOT A PMM KEY FILE'); }
    e.target.value = '';
  });
  $('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every friend, message and your key on this phone? No undo.')) return;
    hangup(); localStorage.removeItem(KEY); location.hash = ''; location.reload();
  });

  /* ---------- connection ---------- */
  let peer = null;           // { pc, dc, friend, connectedAt, rtt, bytesIn, bytesOut, path }
  let pending = null;        // { pc, dc, role, code, poll }
  let currentFriendTarget = null;
  function freshPc() { const pc = new RTCPeerConnection(ICE); return pc; }
  const gathered = (pc) => new Promise((r) => { if (pc.iceGatheringState === 'complete') return r(); const t = setTimeout(r, 5000); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); r(); } }); });
  const code6 = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHABET[b % ALPHABET.length]).join('');
  async function signalBound() { try { const r = await fetch(SIGNAL, { cache: 'no-store' }); if (!r.ok) return false; return Boolean((await r.json()).bound); } catch (_) { return false; } }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function cancelPending() { if (pending) { clearTimeout(pending.poll); pending.cancelled = true; try { pending.pc.close(); } catch (_) {} pending = null; } }
  function hangup() { if (peer) { try { peer.dc.close(); peer.pc.close(); } catch (_) {} peer = null; } clearInterval(pingTimer); renderFriends(); renderChatHead(); }
  function screen(l1, l2, l3) { $('load-line1').textContent = l1 ?? $('load-line1').textContent; $('load-line2').textContent = l2 ?? ''; $('load-line3').textContent = l3 ?? ''; }
  const linkFor = (hash) => location.origin + location.pathname + '#' + hash;

  // HOST: make an offer. Code flow when the signal store is bound, paste mode otherwise.
  async function host() {
    cancelPending(); hangup();
    show('load'); $('load-prompt').textContent = 'SEARCHING FOR FRIEND'; $('load-code').hidden = true; $('form-join').hidden = true; $('form-answer').hidden = true;
    $('btn-share-code').hidden = true; $('btn-copy-code').hidden = true; $('load-hint').textContent = '';
    screen('LOAD "FRIEND",8,1', 'PRESS PLAY ON TAPE', '');
    const pc = freshPc(); const dc = pc.createDataChannel('pmm', { ordered: true });
    pending = { pc, dc, role: 'host', startedAt: now() };
    wire(pc, dc);
    await pc.setLocalDescription(await pc.createOffer()); await gathered(pc);
    if (pending?.pc !== pc) return;
    const sdp = pc.localDescription.sdp;
    if (await signalBound()) {
      const code = code6(); pending.code = code;
      const r = await fetch(SIGNAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: code, role: 'offer', sdp }) });
      if (!r.ok) { screen(null, '?DEVICE NOT PRESENT ERROR', 'falling back to paste mode'); return hostPaste(sdp); }
      $('load-code').textContent = code; $('load-code').hidden = false;
      screen('LOAD "FRIEND",8,1', 'SEARCHING FOR FRIEND', 'tell them the code, or send the link. ten minutes.');
      pending.link = linkFor('join=' + code);
      $('btn-share-code').hidden = !navigator.share; $('btn-copy-code').hidden = false;
      const poll = async () => {
        if (pending?.pc !== pc || pending.cancelled) return;
        try { const a = await fetch(`${SIGNAL}?room=${code}&role=answer`, { cache: 'no-store' }); if (a.ok) { const { sdp: answer } = await a.json(); if (answer) { screen(null, 'FOUND', 'LOADING'); await pc.setRemoteDescription({ type: 'answer', sdp: answer }); return; } } } catch (_) {}
        pending.poll = setTimeout(poll, 1500);
      };
      poll();
    } else hostPaste(sdp);
  }
  async function hostPaste(sdp) {
    pending.link = linkFor('offer=' + await pack(sdp));
    screen('LOAD "FRIEND",8,1', 'PASTE MODE (NO SERVER)', '1. send them this link. 2. paste back the answer link they get.');
    $('btn-share-code').hidden = !navigator.share; $('btn-copy-code').hidden = false; $('form-answer').hidden = false;
    $('load-hint').textContent = 'The link carries the handshake itself. Nothing is stored anywhere.';
  }
  $('form-answer').addEventListener('submit', async (e) => {
    e.preventDefault(); const v = $('answer-input').value.trim(); const m = /answer=([A-Za-z0-9_-]+)/.exec(v) || [null, v];
    if (!pending || !m[1]) return toast('NO ANSWER LINK');
    try { const sdp = await unpack(m[1]); screen(null, 'FOUND', 'LOADING'); await pending.pc.setRemoteDescription({ type: 'answer', sdp }); } catch (_) { toast('?SYNTAX ERROR IN ANSWER'); }
  });
  $('btn-share-code').addEventListener('click', async () => { try { await navigator.share({ title: 'PMM', text: pending?.code ? `PMM code ${pending.code}` : 'PMM link', url: pending?.link }); } catch (_) {} });
  $('btn-copy-code').addEventListener('click', async () => { try { await navigator.clipboard.writeText(pending?.link || ''); toast('LINK COPIED'); } catch (_) { prompt('Copy this link', pending?.link || ''); } });

  // GUEST: answer an offer from a code (store) or an offer link (paste mode).
  function joinView() {
    cancelPending(); show('load'); $('load-prompt').textContent = 'JOIN'; $('load-code').hidden = true; $('form-answer').hidden = true; $('btn-share-code').hidden = true; $('btn-copy-code').hidden = true;
    screen('LOAD "FRIEND",8,1', 'TYPE THE CODE YOUR FRIEND READ OUT', 'or paste the link they sent'); $('form-join').hidden = false; $('load-hint').textContent = ''; setTimeout(() => $('join-input').focus(), 50);
  }
  $('form-join').addEventListener('submit', (e) => { e.preventDefault(); const v = $('join-input').value.trim(); const o = /offer=([A-Za-z0-9_-]+)/.exec(v); const j = /join=([A-Z2-9]{6})/i.exec(v); if (o) joinOffer(o[1]); else joinCode((j ? j[1] : v).toUpperCase()); });
  async function joinCode(code) {
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return toast('?SYNTAX ERROR: SIX LETTERS');
    cancelPending(); show('load'); $('form-join').hidden = true; $('load-code').textContent = code; $('load-code').hidden = false;
    screen('LOAD "FRIEND",8,1', 'SEARCHING FOR FRIEND', 'asking the desk for the handshake…');
    const pc = freshPc(); pending = { pc, role: 'guest', code, startedAt: now() };
    pc.addEventListener('datachannel', (e) => { pending && (pending.dc = e.channel); wire(pc, e.channel); });
    if (!(await signalBound())) { screen(null, '?DEVICE NOT PRESENT ERROR', 'the signal store is not bound on this site. ask your friend for a paste-mode link.'); return; }
    for (let i = 0; i < 80 && pending?.pc === pc; i++) {
      try {
        const r = await fetch(`${SIGNAL}?room=${code}&role=offer`, { cache: 'no-store' });
        if (r.ok) { const { sdp } = await r.json(); if (sdp) return answerOffer(pc, sdp, async (answer) => { const p = await fetch(SIGNAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: code, role: 'answer', sdp: answer }) }); if (!p.ok) throw 0; screen(null, 'FOUND', 'LOADING'); }); }
        if (r.status === 503) { screen(null, '?DEVICE NOT PRESENT ERROR', 'signal store unbound'); return; }
      } catch (_) {}
      await sleep(1500);
    }
    if (pending?.pc === pc) screen(null, '?FILE NOT FOUND ERROR', 'no handshake under that code. ask them to LOAD again.');
  }
  async function joinOffer(packed) {
    cancelPending(); show('load'); $('form-join').hidden = true; $('load-code').hidden = true; $('load-prompt').textContent = 'JOIN';
    screen('LOAD "FRIEND",8,1', 'PASTE MODE', 'reading their handshake…');
    const pc = freshPc(); pending = { pc, role: 'guest', startedAt: now() };
    pc.addEventListener('datachannel', (e) => { pending && (pending.dc = e.channel); wire(pc, e.channel); });
    let sdp; try { sdp = await unpack(packed); } catch (_) { return screen(null, '?SYNTAX ERROR', 'that link is not a PMM handshake'); }
    await answerOffer(pc, sdp, async (answer) => {
      pending.link = linkFor('answer=' + await pack(answer));
      screen(null, 'SEND THIS ANSWER LINK BACK', 'when they paste it, you are connected.');
      $('btn-share-code').hidden = !navigator.share; $('btn-copy-code').hidden = false;
    });
  }
  async function answerOffer(pc, sdp, deliver) {
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp }); await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc);
      if (pending?.pc !== pc) return; await deliver(pc.localDescription.sdp);
    } catch (_) { screen(null, '?LOAD ERROR', 'could not answer that handshake.'); }
  }

  // Both sides: channel plumbing.
  let pingTimer = null;
  function wire(pc, dc) {
    dc.binaryType = 'arraybuffer';
    dc.addEventListener('open', async () => {
      const startedAt = pending && pending.pc === pc ? pending.startedAt : now();
      if (pending && pending.pc === pc) { clearTimeout(pending.poll); pending = null; }
      hangup();
      peer = { pc, dc, friend: null, connectedAt: now(), startedAt, rtt: null, bytesIn: 0, bytesOut: 0, path: '…' };
      dc.send(JSON.stringify({ t: 'hello', ...helloBody() }));
      pingTimer = setInterval(() => { if (peer?.dc.readyState === 'open') { send({ t: 'ping', ts: now() }); statPath(); } }, 5000);
      blip(true); buzz(20);
    });
    dc.addEventListener('message', (e) => onData(e.data));
    const closed = () => { if (peer && peer.pc === pc) { const f = peer.friend; hangup(); if (f) { pushSys(f, 'LINE DROPPED. notes you send now wait here until you connect again.'); } if (current) renderChat(); toast('LINE DROPPED'); blip(false); } };
    dc.addEventListener('close', closed);
    pc.addEventListener('connectionstatechange', () => { if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) closed(); });
  }
  function helloBody() { return { name: myName(), pub: state.me.pub, id: state.me.id, mood: state.me.mood, tz: tzName(), place: state.me.place || '', ts: now() }; }
  function send(obj) { if (!peer || peer.dc.readyState !== 'open') return false; const s = JSON.stringify(obj); peer.dc.send(s); peer.bytesOut += s.length; return true; }
  async function statPath() {
    try {
      const stats = await peer.pc.getStats(); let pair = null; const cands = new Map();
      stats.forEach((s) => { if (s.type === 'candidate-pair' && (s.selected || s.nominated) && s.state === 'succeeded') pair = s; if (s.type === 'local-candidate' || s.type === 'remote-candidate') cands.set(s.id, s); });
      if (pair) { const l = cands.get(pair.localCandidateId), r = cands.get(pair.remoteCandidateId); const relay = [l, r].some((c) => c && c.candidateType === 'relay'); peer.path = relay ? 'RELAY' : `DIRECT · ${(l?.candidateType || '?').toUpperCase()}→${(r?.candidateType || '?').toUpperCase()}`; if (typeof pair.currentRoundTripTime === 'number') peer.rtt = Math.round(pair.currentRoundTripTime * 1000); }
    } catch (_) {}
    renderChatHead();
  }

  /* ---------- friends & messages ---------- */
  let current = null;
  async function onData(data) {
    if (!peer) return;
    if (data instanceof ArrayBuffer) return onChunk(data);
    peer.bytesIn += data.length;
    let m; try { m = JSON.parse(data); } catch (_) { return; }
    const f = peer.friend;
    switch (m.t) {
      case 'hello': {
        if (!m.pub || !m.id || typeof m.pub.x !== 'string') return;
        const id = await fingerprint(m.pub); if (id !== m.id) { toast('SIGIL MISMATCH. LINE CLOSED.'); return hangup(); }
        let fr = friendById(id);
        if (!fr) { fr = { id, name: String(m.name || 'FRIEND').slice(0, 24), pub: m.pub, created: now(), messages: [], ledger: [], trusted: false, unread: 0 }; state.friends.push(fr); }
        fr.name = str(m.name, 24) || fr.name; fr.mood = validMood(m.mood); fr.tz = str(m.tz, 64); fr.place = str(m.place, 32); fr.lastSeen = now();
        peer.friend = fr; save();
        if (!current || current.id !== fr.id) openChat(fr.id); else renderChat();
        pushSys(fr, `RUN · connected ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
        flushQueue(fr); renderFriends(); renderChatHead(); renderAtmo(); send({ t: 'ping', ts: now() }); setTimeout(statPath, 300);
        if (currentFriendTarget && currentFriendTarget !== fr.id) toast('A DIFFERENT FRIEND ANSWERED');
        currentFriendTarget = null;
        break;
      }
      case 'msg': {
        if (!f) return; const ok = await verify(f, m);
        if (f.messages.some((x) => x.id === m.id)) return;
        f.messages.push({ id: String(m.id).slice(0, 40), from: 'them', text: str(m.text, 4000), ts: Number(m.ts) || now(), mood: validMood(m.mood), lt: str(m.lt, 16), verified: ok, status: 'read' });
        if (current !== f) f.unread = (f.unread || 0) + 1; save();
        send({ t: 'ack', id: m.id }); $('draft').hidden = true;
        if (current === f) renderChat(); renderFriends(); blip(false); buzz(12);
        break;
      }
      case 'ack': { if (!f) return; const x = f.messages.find((y) => y.id === m.id); if (x) { x.status = 'read'; save(); if (current === f) renderChat(); } break; }
      case 'react': { if (!f) return; const x = f.messages.find((y) => y.id === m.id); if (x) { x.reaction = String(m.r || '').slice(0, 2); save(); if (current === f) renderChat(); } break; }
      case 'draft': { if (!f || current !== f) return; const d = $('draft'); if (m.text) { d.querySelector('p').textContent = String(m.text).slice(0, 400); d.hidden = false; scrollBottom(); } else d.hidden = true; break; }
      case 'mood': { if (!f) return; f.mood = validMood(m.mood); save(); renderAtmo(); renderFriends(); break; }
      case 'ping': send({ t: 'pong', ts: m.ts }); break;
      case 'pong': peer.rtt = now() - Number(m.ts); renderChatHead(); break;
      case 'tab': {
        if (!f) return; const ok = await verify(f, m); if (!ok) { pushSys(f, 'A TAB ARRIVED UNSIGNED. IGNORED.'); return; }
        if ((f.ledger || []).some((x) => x.id === m.id)) return;
        f.ledger = f.ledger || []; f.ledger.push({ id: m.id, by: 'them', amount: Number(m.amount) || 0, dir: m.dir === 'owe' ? 'owe' : 'owed', note: String(m.note || '').slice(0, 60), ts: Number(m.ts) || now() });
        f.messages.push({ id: 'tab-' + m.id, from: 'them', kind: 'tab', text: tabLine(f.ledger[f.ledger.length - 1]), ts: Number(m.ts) || now(), verified: true, status: 'read' });
        if (current !== f) f.unread = (f.unread || 0) + 1; save(); if (current === f) renderChat(); renderFriends(); blip(false);
        break;
      }
      case 'settle': { if (!f) return; (f.ledger || []).forEach((x) => (x.settled = true)); f.messages.push({ id: uid(), from: 'them', kind: 'sys', text: 'TAB SETTLED', ts: now() }); save(); if (current === f) renderChat(); break; }
      case 'file': { if (!f) return; incoming = { id: m.id, name: String(m.name || 'file').slice(0, 80), size: Number(m.size) || 0, mime: String(m.mime || ''), parts: [], got: 0, ts: now() }; break; }
      case 'file-end': {
        if (!f || !incoming || incoming.id !== m.id) return;
        const blob = new Blob(incoming.parts, { type: incoming.mime }); const url = URL.createObjectURL(blob);
        files.set(m.id, { url, name: incoming.name, mime: incoming.mime, size: blob.size });
        f.messages.push({ id: 'file-' + m.id, from: 'them', kind: 'file', fileId: m.id, label: `FILE ${incoming.name} (${kb(blob.size)})`, ts: now(), verified: true, status: 'read' });
        incoming = null; if (current !== f) f.unread = (f.unread || 0) + 1; save(); if (current === f) renderChat(); renderFriends(); blip(false);
        break;
      }
    }
  }
  function pushSys(f, text) { f.messages.push({ id: uid(), from: 'them', kind: 'sys', text, ts: now() }); save(); if (current === f) renderChat(); }
  const kb = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const tabLine = (t) => `TAB ${t.amount.toFixed(2)} · ${(t.by === 'me') === (t.dir === 'owe') ? 'THEY OWE' : 'I OWE'} · ${t.note || ''}`.trim();

  // files: header JSON, raw chunks, end JSON. One at a time each way.
  const files = new Map(); let incoming = null; let sendQueue = Promise.resolve();
  function onChunk(buf) { if (!incoming) return; incoming.parts.push(buf); incoming.got += buf.byteLength; peer.bytesIn += buf.byteLength; }
  function sendFile(file) {
    sendQueue = sendQueue.then(async () => {
      if (!peer || peer.dc.readyState !== 'open' || !current) return toast('NOT CONNECTED');
      const id = uid(); const dc = peer.dc; dc.bufferedAmountLowThreshold = CHUNK * 4;
      send({ t: 'file', id, name: file.name, size: file.size, mime: file.type });
      const buf = await file.arrayBuffer();
      for (let o = 0; o < buf.byteLength; o += CHUNK) {
        if (dc.bufferedAmount > CHUNK * 16) await new Promise((r) => { const h = () => { dc.removeEventListener('bufferedamountlow', h); r(); }; dc.addEventListener('bufferedamountlow', h); });
        if (dc.readyState !== 'open') return; dc.send(buf.slice(o, o + CHUNK)); peer.bytesOut += Math.min(CHUNK, buf.byteLength - o);
      }
      send({ t: 'file-end', id });
      files.set(id, { url: URL.createObjectURL(file), name: file.name, mime: file.type, size: file.size });
      current.messages.push({ id: 'file-' + id, from: 'me', kind: 'file', fileId: id, label: `FILE ${file.name} (${kb(file.size)})`, ts: now(), status: 'sent', mood: state.me.mood });
      save(); renderChat(); blip(true);
    });
  }
  $('btn-file').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', (e) => { for (const f of e.target.files) { if (f.size > 50 * 1048576) { toast('50 MB MAX'); continue; } sendFile(f); } e.target.value = ''; });

  // voice notes: hold VOICE
  let rec = null, recChunks = [];
  async function recStart() {
    if (rec) return; try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      rec = new MediaRecorder(stream); recChunks = [];
      rec.addEventListener('dataavailable', (e) => e.data.size && recChunks.push(e.data));
      rec.addEventListener('stop', () => { stream.getTracks().forEach((t) => t.stop()); const blob = new Blob(recChunks, { type: rec.mimeType || 'audio/webm' }); rec = null; $('btn-voice').classList.remove('rec'); $('btn-voice').textContent = 'VOICE'; if (blob.size > 2000) sendFile(new File([blob], `voice-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`, { type: blob.type })); });
      rec.start(250); $('btn-voice').classList.add('rec'); $('btn-voice').textContent = 'REC ●'; buzz(15);
    } catch (_) { toast('NO MICROPHONE'); }
  }
  function recStop() { if (rec && rec.state !== 'inactive') rec.stop(); }
  const vb = $('btn-voice');
  vb.addEventListener('pointerdown', (e) => { e.preventDefault(); try { vb.setPointerCapture(e.pointerId); } catch (_) {} recStart(); });
  ['pointerup', 'pointercancel'].forEach((ev) => vb.addEventListener(ev, recStop));
  vb.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------- chat view ---------- */
  function openChat(id) {
    const f = friendById(id); if (!f) return; current = f; f.unread = 0; save();
    show('chat'); renderChat(); renderChatHead(); renderAtmo(); renderFriends();
    history.replaceState(null, '', '#f=' + id.slice(0, 16));
    if (wide.matches) $('composer-input').focus({ preventScroll: true });
  }
  function back() { current = null; show('lobby'); history.replaceState(null, '', location.pathname); renderFriends(); }
  $('btn-back').addEventListener('click', back);
  $('btn-si-back').addEventListener('click', back);
  $('btn-load-back').addEventListener('click', () => { cancelPending(); back(); });
  function renderChatHead() {
    if (!current) return;
    const online = peer && peer.friend === current && peer.dc.readyState === 'open';
    $('peer-name').textContent = current.name.toUpperCase() + (current.trusted ? ' ✓' : '');
    $('peer-sigil').textContent = sigilOf(current.id);
    $('peer-status').textContent = online ? `RUN · ${peer.rtt == null ? '…' : peer.rtt + ' MS'} · ${peer.path}` : 'OFFLINE · NOTES WAIT HERE';
    $('btn-connect').hidden = online; $('btn-file').disabled = !online; $('btn-voice').disabled = !online;
  }
  function renderAtmo() {
    const f = current; const el = $('atmo'); if (!f) { el.textContent = ''; return; }
    document.documentElement.style.setProperty('--mood-them', moodColor(f.mood || 'calm'));
    el.textContent = `YOU: ${state.me.mood} · ${localTime()} ${state.me.place || ''}   ·   ${f.name}: ${f.mood || 'calm'} · ${f.tz ? localTime(f.tz) + ' ' + (f.place || f.tz.split('/').pop().replace(/_/g, ' ')) : 'somewhere'}`;
  }
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fmtDay = (ts) => { const d = new Date(ts), t = new Date(); if (d.toDateString() === t.toDateString()) return 'TODAY'; return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase(); };
  function renderChat() {
    const f = current; if (!f) return; const ol = $('messages'); ol.replaceChildren(); let day = '';
    for (const m of f.messages) {
      const d = fmtDay(m.ts); if (d !== day) { day = d; const li = document.createElement('li'); li.className = 'day'; li.textContent = d; ol.append(li); }
      const li = document.createElement('li'); li.dataset.id = m.id;
      if (m.kind === 'sys') { li.className = 'msg sys'; li.innerHTML = `<div class="bubble"></div>`; li.querySelector('.bubble').textContent = m.text; ol.append(li); continue; }
      li.className = `msg ${m.from}${m.kind === 'tab' ? ' tab' : ''}${m.reaction ? ' has-react' : ''}`;
      const bubble = document.createElement('div'); bubble.className = 'bubble';
      if (m.kind === 'file') {
        const file = files.get(m.fileId);
        if (!file) bubble.textContent = m.label + ' · gone with the last session';
        else if (file.mime.startsWith('image/')) { const img = new Image(); img.src = file.url; img.alt = file.name; bubble.append(img); }
        else if (file.mime.startsWith('audio/')) { const a = document.createElement('audio'); a.controls = true; a.src = file.url; bubble.append(a); }
        else { const a = document.createElement('a'); a.className = 'dl'; a.href = file.url; a.download = file.name; a.textContent = m.label; bubble.append(a); }
      } else bubble.textContent = m.text;
      if (reduced) bubble.style.animation = 'none';
      li.append(bubble);
      if (m.reaction) { const r = document.createElement('span'); r.className = 'react'; r.textContent = m.reaction; li.append(r); }
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.innerHTML = `<span>${fmtTime(m.ts)}</span>${m.mood ? `<span class="mood" style="color:${moodColor(m.mood)}">${esc(m.mood)}</span>` : ''}${m.from === 'me' ? `<span class="${m.status === 'read' ? 'read' : ''}">${m.status === 'read' ? '✓✓' : m.status === 'queued' ? 'WAITING' : '✓'}</span>` : m.verified === false ? '<span class="bad">UNVERIFIED</span>' : m.kind !== 'file' ? '<span class="ok">SIGNED</span>' : ''}`;
      li.append(meta); attachPress(li, m); ol.append(li);
    }
    scrollBottom(true);
  }
  const scrollEl = $('scroll');
  function scrollBottom(instant) { requestAnimationFrame(() => scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: instant || reduced ? 'auto' : 'smooth' })); }

  // composer
  const input = $('composer-input'), sendBtn = $('btn-send'); let draftTimer = null;
  function autosize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }
  input.addEventListener('input', () => { autosize(input); sendBtn.disabled = !input.value.trim(); if (state.me.live !== false) { clearTimeout(draftTimer); draftTimer = setTimeout(() => send({ t: 'draft', text: input.value.slice(0, 400) }), 60); } });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('composer').requestSubmit(); } });
  $('composer').addEventListener('submit', async (e) => {
    e.preventDefault(); const text = input.value.trim(); if (!text || !current) return;
    input.value = ''; autosize(input); sendBtn.disabled = true; input.focus({ preventScroll: true });
    const m = { id: uid(), from: 'me', text, ts: now(), mood: state.me.mood, lt: localTime(), status: 'queued' };
    m.sig = await sign(m); current.messages.push(m); save(); renderChat(); flushQueue(current); blip(true); buzz();
  });
  function flushQueue(f) {
    if (!peer || peer.friend !== f || peer.dc.readyState !== 'open') return;
    for (const m of f.messages) if (m.from === 'me' && m.status === 'queued' && !m.kind) { if (send({ t: 'msg', id: m.id, text: m.text, ts: m.ts, mood: m.mood, lt: m.lt, sig: m.sig })) m.status = 'sent'; }
    send({ t: 'draft', text: '' }); save(); if (current === f) renderChat();
  }
  $('btn-connect').addEventListener('click', () => { currentFriendTarget = current?.id || null; host(); });
  $('btn-host').addEventListener('click', host);
  $('btn-join').addEventListener('click', joinView);

  // reactions: long press
  let pressTimer = null, pressTarget = null;
  function attachPress(li, m) {
    if (m.kind === 'sys') return;
    const start = () => { clearTimeout(pressTimer); pressTimer = setTimeout(() => { pressTarget = m; buzz(15); openSheet('sheet-react'); }, 420); };
    const cancel = () => clearTimeout(pressTimer);
    li.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel', 'pointermove'].forEach((ev) => li.addEventListener(ev, cancel));
    li.addEventListener('contextmenu', (e) => { e.preventDefault(); pressTarget = m; openSheet('sheet-react'); });
  }
  $('reacts').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !pressTarget || !current) return;
    pressTarget.reaction = pressTarget.reaction === b.dataset.r ? '' : b.dataset.r; save(); send({ t: 'react', id: pressTarget.id, r: pressTarget.reaction }); closeSheets(); renderChat(); blip(true);
  });

  // TAB ledger
  $('btn-tab').addEventListener('click', () => { if (!current) return; $('tab-balance').textContent = balanceLine(current); openSheet('sheet-tab'); setTimeout(() => $('tab-amount').focus(), 50); });
  const balanceLine = (f) => { const b = balanceOf(f); return b === 0 ? 'EVEN.' : b > 0 ? `${f.name.toUpperCase()} OWES YOU ${b.toFixed(2)}` : `YOU OWE ${f.name.toUpperCase()} ${(-b).toFixed(2)}`; };
  $('form-tab').addEventListener('submit', async (e) => {
    e.preventDefault(); if (!current) return; const amount = Math.round(Number($('tab-amount').value) * 100) / 100; if (!(amount > 0)) return;
    const t = { id: uid(), by: 'me', amount, dir: $('tab-dir').value, note: $('tab-note').value.trim().slice(0, 60), ts: now() };
    const wire = { t: 'tab', id: t.id, amount: t.amount, dir: t.dir, note: t.note, ts: t.ts }; wire.sig = await sign(wire);
    current.ledger = current.ledger || []; current.ledger.push(t);
    current.messages.push({ id: 'tab-' + t.id, from: 'me', kind: 'tab', text: tabLine(t) + '\n' + balanceLine(current) + (state.me.tzAddr ? `\nSETTLE IN TEZ: ${state.me.tzAddr}` : ''), ts: t.ts, status: send(wire) ? 'sent' : 'queued', mood: state.me.mood });
    save(); closeSheets(); renderChat(); $('tab-amount').value = ''; $('tab-note').value = ''; blip(true);
  });

  // LINK panel
  $('btn-link').addEventListener('click', () => {
    const online = peer && peer.friend === current && peer.dc.readyState === 'open'; const dl = $('stats'); dl.replaceChildren();
    const rows = online ? [['STATE', 'RUN'], ['CONNECT', `${peer.connectedAt - peer.startedAt} MS SETUP`], ['ROUND TRIP', peer.rtt == null ? '…' : `${peer.rtt} MS`], ['PATH', peer.path], ['SENT', kb(peer.bytesOut)], ['RECEIVED', kb(peer.bytesIn)], ['SERVER BYTES', '0']] : [['STATE', 'OFFLINE'], ['NOTES WAITING', String(current ? current.messages.filter((m) => m.status === 'queued').length : 0)]];
    rows.push(['THEIR SIGIL', current ? `${sigilOf(current.id)} ${current.id.slice(0, 8).toUpperCase()}` : '—'], ['TRUST', current?.trusted ? 'VERIFIED BY YOU' : 'NOT YET VERIFIED'], ['TAB', current ? balanceLine(current) : '—']);
    for (const [k, v] of rows) { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); }
    $('btn-verify').textContent = current?.trusted ? 'UNVERIFY' : 'VERIFY SIGIL'; openSheet('sheet-link');
  });
  $('btn-link-done').addEventListener('click', closeSheets);
  $('btn-verify').addEventListener('click', () => {
    if (!current) return;
    if (!current.trusted && !confirm(`Read their sigil aloud to each other:\n\n${sigilOf(current.id)}  ${current.id.slice(0, 8).toUpperCase()}\n\nSame on both phones? Mark VERIFIED.`)) return;
    current.trusted = !current.trusted; save(); closeSheets(); renderChatHead(); renderFriends(); toast(current.trusted ? 'VERIFIED' : 'UNVERIFIED');
  });
  $('peer-head').addEventListener('click', () => $('btn-link').click());

  /* ---------- SI line ---------- */
  const siInput = $('si-input');
  function renderSi() {
    const ol = $('si-messages'); ol.replaceChildren();
    if (!state.si.length) { const li = document.createElement('li'); li.className = 'msg sys'; li.innerHTML = '<div class="bubble"></div>'; li.querySelector('.bubble').textContent = 'SAY THE TRUE SMALL THING. THE PACKET CARRIES THE REST.'; ol.append(li); }
    for (const m of state.si) {
      const li = document.createElement('li'); li.className = 'msg me'; li.innerHTML = '<div class="bubble"></div><div class="meta"></div>';
      li.querySelector('.bubble').textContent = m.text;
      li.querySelector('.meta').innerHTML = `<span>${fmtTime(m.ts)}</span><span class="mood" style="color:${moodColor(m.mood)}">${esc(m.mood)}</span><span class="${m.status === 'sent' ? 'ok' : m.status === 'kept' ? '' : 'bad'}">${m.status === 'sent' ? 'SENT TO THE DESK' : m.status === 'kept' ? 'KEPT ON THE PHONE (DESK UNBOUND)' : 'FAILED · KEPT HERE'}</span>`;
      ol.append(li);
    }
    $('si-atmo').textContent = `YOU: ${state.me.mood} · ${localTime()} · ${tzName()} · ${state.me.place || 'somewhere'} · ${state.me.id ? sigilOf(state.me.id) : ''}`;
    requestAnimationFrame(() => $('si-scroll').scrollTo({ top: $('si-scroll').scrollHeight }));
  }
  $('btn-si').addEventListener('click', () => { show('si'); renderSi(); history.replaceState(null, '', '#si'); });
  $('btn-si-about').addEventListener('click', () => openSheet('sheet-si-about'));
  $('btn-si-about-done').addEventListener('click', closeSheets);
  siInput.addEventListener('input', () => { autosize(siInput); $('btn-si-send').disabled = !siInput.value.trim(); });
  $('si-composer').addEventListener('submit', async (e) => {
    e.preventDefault(); const text = siInput.value.trim(); if (!text) return;
    siInput.value = ''; autosize(siInput); $('btn-si-send').disabled = true;
    const m = { id: uid(), text, ts: now(), mood: state.me.mood, tz: tzName(), lt: localTime(), place: state.me.place || '', sigil: state.me.id ? sigilOf(state.me.id) : '', fp: state.me.id || '', status: 'sending' };
    m.sig = await sign(m); state.si.push(m); save(); renderSi();
    const packet = { type: 'pc-ping-v1', subject: 'PMM · SI line', from: `pmm:${myName()} ${m.sigil} ${m.fp.slice(0, 8)}`, timestamp: new Date(m.ts).toISOString(),
      body: `${text}\n\n— atmosphere —\nmood: ${m.mood}\nlocal time: ${m.lt} (${m.tz})\nplace: ${m.place || 'unsaid'}\nsigil: ${m.sigil} ${m.fp.slice(0, 16)}\nsig: ${m.sig}\nvia: pointcast.xyz/pmm/ SI line` };
    try { const r = await fetch(PING, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(packet) }); m.status = r.ok ? 'sent' : r.status === 503 ? 'kept' : 'failed'; } catch (_) { m.status = 'failed'; }
    save(); renderSi(); blip(m.status === 'sent');
  });

  /* ---------- boot ---------- */
  async function boot() {
    if (!state.me.tz) state.me.tz = tzName();
    renderMe(); renderFriends(); ticker();
    await ensureIdentity(); renderMe();
    if (wide.matches) show('lobby');
    route();
    setInterval(() => { if (current) renderAtmo(); if (app.dataset.view === 'si') renderSi(); }, 30000);
  }
  function route() {
    const h = location.hash.slice(1);
    const o = /offer=([A-Za-z0-9_-]+)/.exec(h), a = /answer=([A-Za-z0-9_-]+)/.exec(h), j = /join=([A-Z2-9]{6})/i.exec(h), f = /f=([0-9a-f]{16})/.exec(h);
    if (o) { history.replaceState(null, '', location.pathname); joinOffer(o[1]); }
    else if (a) { history.replaceState(null, '', location.pathname); if (pending?.role === 'host') { $('answer-input').value = a[1]; $('form-answer').requestSubmit(); } else { joinView(); $('load-line2').textContent = 'THAT IS AN ANSWER LINK'; $('load-line3').textContent = 'open it on the phone that pressed LOAD, or paste it there.'; } }
    else if (j) { history.replaceState(null, '', location.pathname); joinCode(j[1].toUpperCase()); }
    else if (f) { const fr = state.friends.find((x) => x.id.startsWith(f[1])); if (fr) openChat(fr.id); }
    else if (h === 'si') { show('si'); renderSi(); }
  }
  wide.addEventListener('change', () => show(app.dataset.view));
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => { if (peer) try { peer.dc.close(); } catch (_) {} });
  boot();
})();
