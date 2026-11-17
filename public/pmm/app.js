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
  const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }];
  const TURN = '/api/pmm/turn';
  let ice = { servers: STUN, until: 0, relay: false, checked: 0 };
  let iceInflight = null;
  let attempt = 0;
  // A relay server must name only stun/turn/turns URLs, and a turn URL must carry its username and credential.
  const okServer = (x) => {
    if (!x || typeof x !== 'object') return false;
    const urls = typeof x.urls === 'string' ? [x.urls] : Array.isArray(x.urls) ? x.urls : [];
    if (!urls.length || !urls.every((u) => typeof u === 'string' && /^(stun|turns?):/.test(u))) return false;
    return !urls.some((u) => /^turns?:/.test(u)) || (typeof x.username === 'string' && typeof x.credential === 'string');
  };
  // Ask the site for a relay credential. Without one, STUN only: two phones behind strict carrier NAT will not connect.
  // A cached credential is used only while it still outlives a full ten-minute handshake window (660 s margin).
  function refreshIce(force) {
    if (iceInflight) return iceInflight;
    if (!force && now() < ice.until) return Promise.resolve(ice);
    if (!force && ice.checked && now() - ice.checked < 60000 && !ice.relay) return Promise.resolve(ice);
    ice.checked = now();
    iceInflight = (async () => {
      try {
        const r = await fetch(TURN, { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          const servers = (Array.isArray(j.iceServers) ? j.iceServers : []).filter(okServer);
          if (servers.length) { ice = { servers: [...STUN, ...servers], until: now() + Math.max(60, (Number(j.ttlSeconds) || 600) - 660) * 1000, relay: true, checked: now() }; return ice; }
        }
      } catch (_) {}
      ice = { servers: STUN, until: now() + 60000, relay: false, checked: now() };
      return ice;
    })().finally(() => { iceInflight = null; });
    return iceInflight;
  }
  const iceWithTimeout = (ms) => Promise.race([refreshIce(false), new Promise((r) => setTimeout(() => r(ice), ms))]);
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
  const canon = (m) => `${m.t || ''}|${m.id}|${m.to || ''}|${m.ts}|${m.text || ''}|${m.amount || ''}|${m.dir || ''}|${m.note || ''}`;
  async function sign(m) { return b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signKey, enc.encode(canon(m)))); }
  async function verify(f, m) { try { return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await verifierFor(f), unb64u(m.sig || ''), enc.encode(canon(m))); } catch (_) { return false; } }

  /* ---------- state ---------- */
  let state = load();
  if (!Array.isArray(state.rooms)) state.rooms = [];
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.me && Array.isArray(s.friends)) return s; } catch (_) {}
    return { me: { name: '', place: '', tz: '', mood: 'calm', live: true, sound: true }, friends: [], si: [] };
  }
  let storageWarned = false;
  function save() { if (state.si && state.si.length > 200) state.si = state.si.slice(-200); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { if (!storageWarned) { storageWarned = true; setTimeout(() => toast('STORAGE OFF: NOTHING WILL BE KEPT'), 300); } } }
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
    for (const p of ['lobby', 'load', 'chat', 'si', 'room']) $('pane-' + p).hidden = wide.matches ? false : p !== view;
  }
  function openSheet(id) { $('sheet-wrap').hidden = false; for (const s of document.querySelectorAll('.sheet')) s.hidden = s.id !== id; }
  function closeSheets() { $('sheet-wrap').hidden = true; }
  $('scrim').addEventListener('click', closeSheets);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheets(); if (scanStream) stopScan(); } });

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
      b.addEventListener('click', () => { state.me.mood = k; save(); renderMe(); renderAtmo(); send({ t: 'mood', mood: k }); roomMood(k); closeSheets(); blip(true); });
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
    state.me.name = $('set-name').value.replace(/[✓✔☑✅]/g, '').trim().slice(0, 24); state.me.place = $('set-place').value.trim().slice(0, 32);
    state.me.tzAddr = $('set-tz').value.trim().slice(0, 40); state.me.live = $('set-live').checked; state.me.sound = $('set-sound').checked;
    save(); renderMe(); closeSheets(); sendHello();
  });
  $('btn-export').addEventListener('click', () => {
    const friends = state.friends.map((f) => ({ id: f.id, name: f.name, pub: f.pub, trusted: Boolean(f.trusted), mood: f.mood, tz: f.tz, place: f.place, created: f.created }));
    const blob = new Blob([JSON.stringify({ type: 'pmm-key-v1', me: state.me, friends }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pmm-key-${state.me.id.slice(0, 8)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('btn-import').addEventListener('click', () => $('import-input').click());
  $('import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const j = JSON.parse(await file.text());
      if (j.type !== 'pmm-key-v1' || !j.me || typeof j.me.pub?.x !== 'string' || typeof j.me.pub?.y !== 'string' || !j.me.priv?.d) throw 0;
      if (j.me.priv.x !== j.me.pub.x || j.me.priv.y !== j.me.pub.y) throw 0; // the public half must belong to the private key
      const priv = await crypto.subtle.importKey('jwk', j.me.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
      const pub = { kty: 'EC', crv: 'P-256', x: j.me.priv.x, y: j.me.priv.y, ext: true };
      const id = await fingerprint(pub);
      const swapped = id !== state.me.id;
      if (swapped) { hangup(); cancelPending(); dropRoomLines(); }
      state.me = { ...state.me, name: str(j.me.name, 24), place: str(j.me.place, 32), tzAddr: str(j.me.tzAddr, 40), pub, priv: j.me.priv, id }; signKey = priv;
      if (swapped) {
        for (const fr of state.friends) for (const m of fr.messages) {
          if (m.from !== 'me' || m.status !== 'queued') continue;
          if (!m.kind) m.sig = await sign({ t: 'msg', id: m.id, to: m.to || fr.id, ts: m.ts, text: m.text });
          else if (m.kind === 'tab' && m.wire) { const { sig, ...rest } = m.wire; m.wire = { ...rest, sig: await sign(rest) }; }
        }
      }
      let restored = 0;
      for (const f of Array.isArray(j.friends) ? j.friends : []) {
        if (!f || typeof f.pub?.x !== 'string' || typeof f.pub?.y !== 'string') continue;
        const fid = await fingerprint(f.pub); if (fid === id) continue;
        let fr = friendById(fid);
        if (!fr) { fr = { id: fid, name: 'FRIEND', pub: f.pub, created: Number(f.created) || now(), messages: [], ledger: [], trusted: false, unread: 0 }; state.friends.push(fr); restored++; }
        fr.name = str(f.name, 24).replace(/[✓✔☑✅]/g, '').trim() || fr.name; fr.trusted = fr.trusted || f.trusted === true;
        if (!fr.mood) fr.mood = validMood(f.mood); if (!fr.tz) fr.tz = str(f.tz, 64); if (!fr.place) fr.place = str(f.place, 32);
      }
      save(); renderMe(); renderFriends(); toast(restored ? `KEY LOADED · ${restored} FRIEND${restored === 1 ? '' : 'S'} RESTORED` : 'KEY LOADED'); closeSheets();
    } catch (_) { toast('NOT A PMM KEY FILE'); }
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
  function freshPc() {
    let pc;
    try { pc = new RTCPeerConnection({ iceServers: ice.servers }); pc.pmmRelay = ice.relay; }
    catch (_) { ice = { servers: STUN, until: 0, relay: false, checked: 0 }; pc = new RTCPeerConnection({ iceServers: STUN }); pc.pmmRelay = false; }
    pc.addEventListener('connectionstatechange', () => { if (pending?.pc === pc && ['failed', 'closed'].includes(pc.connectionState)) { report(pending, 'fail', 'none', 'ice'); screen(null, '?LINE FAILED ERROR', 'no direct path between the phones. both LOAD again.'); cancelPending(); } });
    return pc;
  }
  function armWatchdog(pc, ms) { if (pending?.pc !== pc) return; clearTimeout(pending.watchdog); pending.watchdog = setTimeout(() => { if (pending?.pc === pc) { report(pending, 'fail', 'none', 'timeout'); screen(null, '?LINE FAILED ERROR', 'no connection in 30 seconds. both phones LOAD again.'); cancelPending(); } }, ms); }
  // Did the line open? One anonymous outcome per handshake that reached FOUND, sent only by the phone that pressed LOAD,
  // so each connection counts once. No sigil, name, code or message goes with it. DNT and GPC browsers send nothing.
  const pathKind = (p) => (/^RELAY/.test(p) ? 'relay' : /^DIRECT/.test(p) ? 'direct' : 'unknown');
  // Leaving the page settles the outcome: an open handshake or an unverified line was abandoned; a verified line still owed its RUN.
  addEventListener('pagehide', () => { report(pending, 'fail', 'none', 'abandoned'); const a = peer?.attempt; if (a) report(a, a.verified ? 'run' : 'fail', a.verified ? pathKind(peer.path) : 'none', a.verified ? '-' : 'abandoned'); });
  function report(p, outcome, path, reason = '-', at = now()) {
    if (!p || p.role !== 'host' || !p.foundAt || p.reported) return; p.reported = true;
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl || !crypto.randomUUID) return;
    const body = { v: 1, outcome, flow: p.code ? 'code' : 'paste', via: p.code ? 'store' : p.via || 'paste', path, reason, ms: at - p.foundAt, id: crypto.randomUUID() };
    try { fetch('/api/pmm/stat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => {}); } catch (_) {}
  }
  const gathered = (pc) => new Promise((r) => { if (pc.iceGatheringState === 'complete') return r(); const t = setTimeout(r, 5000); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); r(); } }); });
  const code6 = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHABET[b % ALPHABET.length]).join('');
  async function signalBound() { try { const r = await fetch(SIGNAL, { cache: 'no-store' }); if (!r.ok) return false; return Boolean((await r.json()).bound); } catch (_) { return false; } }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function cancelPending() { attempt++; currentFriendTarget = null; if (scanStream) stopScan(); if (pending) { report(pending, 'fail', 'none', 'abandoned'); clearTimeout(pending.poll); clearTimeout(pending.watchdog); pending.cancelled = true; const p = pending; pending = null; try { p.pc.close(); } catch (_) {} } }
  function hangup() { if (peer) { if (peer.attempt && !peer.attempt.verified) report(peer.attempt, 'fail', 'none', 'hello'); try { peer.dc.close(); peer.pc.close(); } catch (_) {} peer = null; } clearInterval(pingTimer); renderFriends(); renderChatHead(); }
  function screen(l1, l2, l3) { $('load-line1').textContent = l1 ?? $('load-line1').textContent; $('load-line2').textContent = l2 ?? ''; $('load-line3').textContent = l3 ?? ''; }
  const linkFor = (hash) => location.origin + location.pathname + '#' + hash;

  /* ---------- QR: show a link as a code; scan one where the phone can ---------- */
  let qrLoading = null;
  const loadQr = () => {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (!qrLoading) qrLoading = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'vendor/qrcode.js'; sc.onload = () => res(window.qrcode); sc.onerror = () => { qrLoading = null; rej(new Error('qr')); }; document.head.append(sc); });
    return qrLoading;
  };
  function hideQr() { $('load-qr').hidden = true; $('qr-art').replaceChildren(); }
  async function showQr(p) {
    const link = p && p.link; if (!link) return hideQr();
    try {
      const qrcode = await loadQr(); if (pending !== p || p.link !== link) return;
      const qr = qrcode(0, 'L'); qr.addData(link); qr.make();
      const n = qr.getModuleCount(); let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (!qr.isDark(r, c)) continue; let w = 1; while (c + w < n && qr.isDark(r, c + w)) w++; d += `M${c + 4} ${r + 4}h${w}v1h-${w}z`; c += w - 1; }
      $('qr-art').innerHTML = `<svg viewBox="0 0 ${n + 8} ${n + 8}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${n + 8}" height="${n + 8}" fill="#fff"/><path d="${d}" fill="#20164d"/></svg>`;
      $('load-qr').hidden = false;
    } catch (_) { hideQr(); }
  }
  const canScan = 'BarcodeDetector' in window && Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  let scanStream = null, scanTimer = null;
  function scanKey(label) { const b = $('btn-scan'); b.textContent = label || ''; b.hidden = !(canScan && label); }
  async function startScan() {
    let det; try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (_) { toast('NO SCANNER ON THIS PHONE'); return; }
    try { scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); } catch (_) { toast('NO CAMERA'); return; }
    const v = $('scan-video'); v.srcObject = scanStream; $('scan').hidden = false; $('scan-hint').textContent = 'POINT AT THEIR PMM CODE';
    try { await v.play(); } catch (_) {}
    const tick = async () => {
      if (!scanStream) return;
      try { for (const c of await det.detect(v)) { if (useScanned(c.rawValue)) { stopScan(); return; } } } catch (_) {}
      scanTimer = setTimeout(tick, 250);
    };
    tick();
  }
  function stopScan() { clearTimeout(scanTimer); if (scanStream) scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; $('scan-video').srcObject = null; $('scan').hidden = true; }
  // A scanned code is only ever a PMM link on this site: a join code, an offer, or the answer to our own offer.
  function useScanned(text) {
    let u; try { u = new URL(text); } catch (_) { return false; }
    if (u.origin !== location.origin || !u.pathname.startsWith('/pmm')) { $('scan-hint').textContent = 'THAT IS NOT A PMM CODE'; return false; }
    const h = u.hash.slice(1), a = /answer=([A-Za-z0-9_-]+)/.exec(h), o = /offer=([A-Za-z0-9_-]+)/.exec(h), j = /join=([A-Z2-9]{6})/i.exec(h);
    if (a && pending?.role === 'host') { pending.via = 'scan'; $('answer-input').value = a[1]; $('form-answer').requestSubmit(); return true; }
    if (o) { joinOffer(o[1]); return true; }
    if (j) { joinCode(j[1].toUpperCase()); return true; }
    $('scan-hint').textContent = a ? 'THAT ANSWER IS FOR THE PHONE THAT PRESSED LOAD' : 'THAT IS NOT A PMM CODE';
    return false;
  }
  $('btn-scan').addEventListener('click', startScan);
  $('btn-scan-stop').addEventListener('click', stopScan);
  // An answer link opened in a new tab (a camera app, a messages app) is handed to the tab that is waiting for it.
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('pmm') : null;
  if (bc) bc.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.t === 'answer' && typeof m.a === 'string' && /^[A-Za-z0-9_-]+$/.test(m.a) && pending?.role === 'host' && !pending.answered) {
      bc.postMessage({ t: 'answer-ok', id: m.id }); pending.via = 'tab'; $('answer-input').value = m.a; $('form-answer').requestSubmit(); try { window.focus(); } catch (_) {}
    }
  });
  function handOff(a) {
    return new Promise((resolve) => {
      if (!bc) return resolve(false);
      const id = uid();
      const on = (e) => { if (e.data && e.data.t === 'answer-ok' && e.data.id === id) { clearTimeout(t); bc.removeEventListener('message', on); resolve(true); } };
      const t = setTimeout(() => { bc.removeEventListener('message', on); resolve(false); }, 900);
      bc.addEventListener('message', on); bc.postMessage({ t: 'answer', a, id });
    });
  }

  // HOST: make an offer. Code flow when the signal store is bound, paste mode otherwise.
  // With a room, the same handshake opens a 'pmm-room' channel: the guest's app sees the label and joins the room.
  async function host(room) {
    cancelPending(); if (!room) hangup(); const mine = ++attempt;
    show('load'); $('load-prompt').textContent = room ? 'INVITE TO ROOM' : 'SEARCHING FOR FRIEND'; $('load-code').hidden = true; $('form-join').hidden = true; $('form-answer').hidden = true;
    $('btn-share-code').hidden = true; $('btn-copy-code').hidden = true; $('load-hint').textContent = ''; hideQr(); scanKey('');
    screen('LOAD "FRIEND",8,1', 'PRESS PLAY ON TAPE', '');
    await iceWithTimeout(1500); if (mine !== attempt) return;
    const pc = freshPc(); const dc = pc.createDataChannel(room ? 'pmm-room' : 'pmm', { ordered: true });
    const p = { pc, dc, role: 'host', startedAt: now(), room: room ? room.id : null }; pending = p;
    if (room) wireRoom(newLine(pc, room.id, null), dc); else wire(pc, dc);
    await pc.setLocalDescription(await pc.createOffer()); await gathered(pc);
    if (pending !== p) return;
    const sdp = pc.localDescription.sdp;
    const bound = await signalBound(); if (pending !== p) return;
    if (!bound) return hostPaste(p, sdp);
    const code = code6(); p.code = code;
    let r; try { r = await fetch(SIGNAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: code, role: 'offer', sdp }) }); } catch (_) { r = null; }
    if (pending !== p) return;
    if (!r || !r.ok) { p.code = undefined; screen(null, '?DEVICE NOT PRESENT ERROR', 'falling back to paste mode'); return hostPaste(p, sdp); }
    $('load-code').textContent = code; $('load-code').hidden = false;
    screen('LOAD "FRIEND",8,1', 'SEARCHING FOR FRIEND', 'tell them the code, or send the link. ten minutes.');
    p.link = linkFor('join=' + code); p.until = now() + 600000;
    $('btn-share-code').hidden = !navigator.share; $('btn-copy-code').hidden = false; showQr(p);
    const poll = async () => {
      if (pending !== p) return;
      if (now() > p.until) { screen(null, '?FILE NOT FOUND ERROR', 'the code expired. LOAD again.'); cancelPending(); return; }
      try {
        const a = await fetch(`${SIGNAL}?room=${code}&role=answer`, { cache: 'no-store' });
        if (pending !== p) return;
        if (a.ok) { const { sdp: answer } = await a.json(); if (answer && pending === p) { p.foundAt = now(); screen(null, 'FOUND', 'LOADING'); await pc.setRemoteDescription({ type: 'answer', sdp: answer }); armWatchdog(pc, 30000); return; } }
      } catch (_) {}
      if (pending === p) p.poll = setTimeout(poll, 1500);
    };
    poll();
  }
  async function hostPaste(p, sdp) {
    p.link = linkFor('offer=' + await pack(sdp));
    if (pending !== p) return;
    screen('LOAD "FRIEND",8,1', 'PASTE MODE (NO SERVER)', '1. send them this link, or let them scan the code. 2. take back the answer they get.');
    $('btn-share-code').hidden = !navigator.share; $('btn-copy-code').hidden = false; $('form-answer').hidden = false; showQr(p); scanKey('SCAN THEIR ANSWER');
    $('load-hint').textContent = 'The link carries the handshake itself. Nothing is stored anywhere. If their answer link opens in another tab of this browser, it comes back here by itself.';
  }
  $('form-answer').addEventListener('submit', async (e) => {
    e.preventDefault(); const v = $('answer-input').value.trim(); const m = /answer=([A-Za-z0-9_-]+)/.exec(v) || [null, v];
    if (!pending || !m[1]) return toast('NO ANSWER LINK');
    if (pending.answered) return;
    try { const sdp = await unpack(m[1]); if (!pending || pending.answered) return; pending.answered = true; pending.foundAt = now(); stopScan(); scanKey(''); screen(null, 'FOUND', 'LOADING'); const pc = pending.pc; await pc.setRemoteDescription({ type: 'answer', sdp }); armWatchdog(pc, 30000); } catch (_) { toast('?SYNTAX ERROR IN ANSWER'); }
  });
  $('btn-share-code').addEventListener('click', async () => { try { await navigator.share({ title: 'PMM', text: pending?.code ? `PMM code ${pending.code}` : 'PMM link', url: pending?.link }); } catch (_) {} });
  $('btn-copy-code').addEventListener('click', async () => { try { await navigator.clipboard.writeText(pending?.link || ''); toast('LINK COPIED'); } catch (_) { prompt('Copy this link', pending?.link || ''); } });

  // GUEST: answer an offer from a code (store) or an offer link (paste mode).
  function joinView() {
    cancelPending(); show('load'); $('load-prompt').textContent = 'JOIN'; $('load-code').hidden = true; $('form-answer').hidden = true; $('btn-share-code').hidden = true; $('btn-copy-code').hidden = true;
    screen('LOAD "FRIEND",8,1', 'TYPE THE CODE YOUR FRIEND READ OUT', canScan ? 'or paste the link they sent, or scan their code' : 'or paste the link they sent, or point your camera at their code'); $('form-join').hidden = false; $('load-hint').textContent = ''; hideQr(); scanKey('SCAN THEIR CODE'); setTimeout(() => $('join-input').focus(), 50);
  }
  $('form-join').addEventListener('submit', (e) => { e.preventDefault(); const v = $('join-input').value.trim(); const o = /offer=([A-Za-z0-9_-]+)/.exec(v); const j = /join=([A-Z2-9]{6})/i.exec(v); if (o) joinOffer(o[1]); else joinCode((j ? j[1] : v).toUpperCase()); });
  async function joinCode(code) {
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return toast('?SYNTAX ERROR: SIX LETTERS');
    cancelPending(); show('load'); $('form-join').hidden = true; $('load-code').textContent = code; $('load-code').hidden = false; hideQr(); scanKey('');
    screen('LOAD "FRIEND",8,1', 'SEARCHING FOR FRIEND', 'asking the desk for the handshake…');
    const mine = ++attempt; await iceWithTimeout(1500); if (mine !== attempt) return;
    const pc = freshPc(); pending = { pc, role: 'guest', code, startedAt: now() };
    pc.addEventListener('datachannel', (e) => { pending && (pending.dc = e.channel); channel(pc, e.channel); });
    if (!(await signalBound())) { screen(null, '?DEVICE NOT PRESENT ERROR', 'the signal store is not bound on this site. ask your friend for a paste-mode link.'); return; }
    for (let i = 0; i < 80 && pending?.pc === pc; i++) {
      try {
        const r = await fetch(`${SIGNAL}?room=${code}&role=offer`, { cache: 'no-store' });
        if (r.ok) { const { sdp } = await r.json(); if (sdp) return answerOffer(pc, sdp, async (answer) => { const p = await fetch(SIGNAL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: code, role: 'answer', sdp: answer }) }); if (p.status === 409) { screen(null, '?DEVICE NOT PRESENT ERROR', 'someone else already answered that code. ask them to LOAD again.'); cancelPending(); return; } if (!p.ok) throw 0; screen(null, 'FOUND', 'LOADING'); armWatchdog(pc, 30000); }); }
        if (r.status === 503) { screen(null, '?DEVICE NOT PRESENT ERROR', 'signal store unbound'); return; }
      } catch (_) {}
      await sleep(1500);
    }
    if (pending?.pc === pc) screen(null, '?FILE NOT FOUND ERROR', 'no handshake under that code. ask them to LOAD again.');
  }
  async function joinOffer(packed) {
    cancelPending(); show('load'); $('form-join').hidden = true; $('load-code').hidden = true; $('load-prompt').textContent = 'JOIN'; hideQr(); scanKey('');
    screen('LOAD "FRIEND",8,1', 'PASTE MODE', 'reading their handshake…');
    const mine = ++attempt; await iceWithTimeout(1500); if (mine !== attempt) return;
    const pc = freshPc(); pending = { pc, role: 'guest', startedAt: now() };
    pc.addEventListener('datachannel', (e) => { pending && (pending.dc = e.channel); channel(pc, e.channel); });
    let sdp; try { sdp = await unpack(packed); } catch (_) { return screen(null, '?SYNTAX ERROR', 'that link is not a PMM handshake'); }
    await answerOffer(pc, sdp, async (answer) => {
      pending.link = linkFor('answer=' + await pack(answer));
      screen(null, 'SEND THIS ANSWER BACK', 'as a link, or let them scan the code. when it lands, you are connected.');
      $('btn-share-code').hidden = !navigator.share; $('btn-copy-code').hidden = false; showQr(pending);
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
  const dtlsFp = (desc) => { const m = /a=fingerprint:\S+\s+([0-9A-Fa-f:]+)/.exec(desc?.sdp || ''); return m ? m[1].toUpperCase() : ''; };
  function wire(pc, dc) {
    dc.binaryType = 'arraybuffer';
    dc.addEventListener('open', async () => {
      const startedAt = pending && pending.pc === pc ? pending.startedAt : now();
      const attemptRec = pending && pending.pc === pc ? pending : null;
      if (pending && pending.pc === pc) { clearTimeout(pending.poll); clearTimeout(pending.watchdog); pending = null; }
      hangup();
      peer = { pc, dc, friend: null, connectedAt: now(), startedAt, rtt: null, bytesIn: 0, bytesOut: 0, relayBytes: 0, relay: Boolean(pc.pmmRelay), path: '…', attempt: attemptRec, localFp: dtlsFp(pc.localDescription), remoteFp: dtlsFp(pc.remoteDescription) };
      await sendHello();
      if (peer?.pc !== pc) return;
      pingTimer = setInterval(() => { if (peer?.dc.readyState === 'open') { send({ t: 'ping', ts: now() }); statPath(); } }, 5000);
      blip(true); buzz(20);
    });
    let inbox = Promise.resolve();
    dc.addEventListener('message', (e) => { if (peer?.dc !== dc) return; inbox = inbox.then(() => onData(e.data)).catch(() => {}); });
    const closed = () => { if (peer && peer.pc === pc) { const f = peer.friend; hangup(); if (f) { pushSys(f, 'LINE DROPPED. notes you send now wait here until you connect again.'); } if (current) renderChat(); toast('LINE DROPPED'); blip(false); } };
    dc.addEventListener('close', closed);
    pc.addEventListener('connectionstatechange', () => { if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) closed(); });
  }
  function helloBody() { return { name: myName(), pub: state.me.pub, id: state.me.id, mood: state.me.mood, tz: tzName(), place: state.me.place || '', ts: now() }; }
  // The hello is signed over the other side's DTLS fingerprint, so it only proves identity for this one connection.
  async function sendHello() {
    if (!peer || peer.dc.readyState !== 'open') return false;
    const h = { t: 'hello', ...helloBody(), fp: peer.remoteFp };
    h.sig = await sign({ t: 'hello', id: state.me.id, ts: h.ts, text: peer.remoteFp });
    return send(h);
  }
  function send(obj) { if (!peer || peer.dc.readyState !== 'open') return false; const s = JSON.stringify(obj); peer.dc.send(s); peer.bytesOut += s.length; return true; }
  const sendTo = (f, obj) => (f && peer && peer.friend === f ? send(obj) : false);
  async function statPath() {
    if (!peer) return;
    try {
      const stats = await peer.pc.getStats(); const cands = new Map(); const pairs = [];
      stats.forEach((s) => { if (s.type === 'local-candidate' || s.type === 'remote-candidate') cands.set(s.id, s); if (s.type === 'candidate-pair' && s.state === 'succeeded') pairs.push(s); });
      let relay = 0; let sel = null;
      for (const s of pairs) { const l = cands.get(s.localCandidateId), r = cands.get(s.remoteCandidateId); const viaRelay = [l, r].some((c) => c && c.candidateType === 'relay'); if (viaRelay) relay += (s.bytesSent || 0) + (s.bytesReceived || 0); if (s.selected || s.nominated) sel = { s, l, r, viaRelay }; }
      if (!peer) return; peer.relayBytes = relay;
      if (sel) { peer.path = sel.viaRelay ? 'RELAY' : `DIRECT · ${(sel.l?.candidateType || '?').toUpperCase()}→${(sel.r?.candidateType || '?').toUpperCase()}`; if (typeof sel.s.currentRoundTripTime === 'number') peer.rtt = Math.round(sel.s.currentRoundTripTime * 1000); }
    } catch (_) {}
    renderChatHead();
  }

  /* ---------- friends & messages ---------- */
  let current = null;
  const SAFE_MIME = /^(image\/(png|jpeg|gif|webp|avif)|audio\/(webm|mp4|mpeg|ogg|aac|wav|x-m4a))(;.*)?$/i;
  const MAX_FILE = 50 * 1048576;
  async function onData(data) {
    if (!peer) return;
    if (data instanceof ArrayBuffer) return onChunk(data);
    peer.bytesIn += data.length;
    let m; try { m = JSON.parse(data); } catch (_) { return; }
    if (!m || typeof m !== 'object') return;
    const f = peer.friend;
    if (m.t !== 'hello' && !f) return;
    switch (m.t) {
      case 'hello': {
        if (!m.pub || typeof m.pub.x !== 'string' || typeof m.pub.y !== 'string' || typeof m.id !== 'string') return;
        const id = await fingerprint(m.pub);
        if (!peer) return;
        if (id !== m.id) { toast('SIGIL MISMATCH. LINE CLOSED.'); return hangup(); }
        if (f && f.id !== id) { toast('THE LINE CHANGED HANDS. CLOSED.'); return hangup(); }
        const proven = Boolean(peer.localFp) && m.fp === peer.localFp && await verify({ id, pub: m.pub }, { t: 'hello', id: m.id, ts: m.ts, text: peer.localFp, sig: m.sig });
        if (!peer || !proven) { toast('HELLO NOT SIGNED. LINE CLOSED.'); return hangup(); }
        let fr = friendById(id);
        if (!fr) { fr = { id, name: 'FRIEND', pub: m.pub, created: now(), messages: [], ledger: [], trusted: false, unread: 0 }; state.friends.push(fr); }
        fr.name = str(m.name, 24).replace(/[✓✔☑✅]/g, '').trim() || fr.name; fr.mood = validMood(m.mood); fr.tz = str(m.tz, 64); fr.place = str(m.place, 32); fr.lastSeen = now();
        const first = !peer.friend; peer.friend = fr; if (peer.attempt) peer.attempt.verified = true; save();
        if (first) { openChat(fr.id); pushSys(fr, `RUN · connected ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`); flushQueue(fr); send({ t: 'ping', ts: now() }); const pr = peer, ranAt = now(); setTimeout(() => statPath().then(() => report(pr.attempt, 'run', pathKind(pr.path), '-', ranAt)), 300); }
        else if (current === fr) renderChat();
        renderFriends(); renderChatHead(); renderAtmo();
        if (first && currentFriendTarget && currentFriendTarget !== fr.id) toast('A DIFFERENT FRIEND ANSWERED');
        currentFriendTarget = null;
        break;
      }
      case 'msg': {
        const id = str(m.id, 40); if (!id || f.messages.some((x) => x.id === id)) return;
        const ok = m.to === state.me.id && await verify(f, { t: 'msg', id, to: m.to, ts: m.ts, text: m.text, sig: m.sig });
        if (!peer || peer.friend !== f) return;
        const text = str(m.text, 4000);
        f.messages.push({ id, from: 'them', text, ts: Number(m.ts) || now(), mood: validMood(m.mood), lt: str(m.lt, 16), verified: ok, status: 'read' });
        if (current !== f) f.unread = (f.unread || 0) + 1; save();
        send({ t: 'ack', id }); $('draft').hidden = true; $('announce').textContent = `${f.name}: ${text}`;
        if (current === f) renderChat(); renderFriends(); blip(false); buzz(12);
        break;
      }
      case 'ack': { const x = f.messages.find((y) => y.id === m.id); if (x) { x.status = 'read'; save(); if (current === f) renderChat(); } break; }
      case 'react': { const x = f.messages.find((y) => y.id === m.id); if (x) { x.reaction = str(m.r, 2); save(); if (current === f) renderChat(); } break; }
      case 'draft': { if (current !== f) return; const d = $('draft'); const text = str(m.text, 400); if (text) { d.querySelector('p').textContent = text; d.hidden = false; scrollBottom(); } else d.hidden = true; break; }
      case 'mood': { f.mood = validMood(m.mood); save(); renderAtmo(); renderFriends(); break; }
      case 'ping': send({ t: 'pong', ts: m.ts }); break;
      case 'pong': peer.rtt = now() - Number(m.ts); renderChatHead(); break;
      case 'tab': {
        const id = str(m.id, 40); if (!id || (f.ledger || []).some((x) => x.id === id)) return;
        const ok = m.to === state.me.id && await verify(f, m);
        if (!peer || peer.friend !== f) return;
        if (!ok) { pushSys(f, 'A TAB ARRIVED UNSIGNED. IGNORED.'); return; }
        f.ledger = f.ledger || []; f.ledger.push({ id, by: 'them', amount: Math.round((Number(m.amount) || 0) * 100) / 100, dir: m.dir === 'owe' ? 'owe' : 'owed', note: str(m.note, 60), ts: Number(m.ts) || now() });
        f.messages.push({ id: 'tab-' + id, from: 'them', kind: 'tab', text: tabLine(f.ledger[f.ledger.length - 1]), ts: Number(m.ts) || now(), verified: true, status: 'read' });
        if (current !== f) f.unread = (f.unread || 0) + 1; save(); if (current === f) renderChat(); renderFriends(); blip(false);
        break;
      }
      case 'settle': { (f.ledger || []).forEach((x) => (x.settled = true)); f.messages.push({ id: uid(), from: 'them', kind: 'sys', text: 'TAB SETTLED', ts: now() }); save(); if (current === f) renderChat(); break; }
      case 'file': {
        const size = Number(m.size) || 0; if (size > MAX_FILE) { incoming = null; toast('FILE TOO BIG. DROPPED.'); return; }
        incoming = { id: str(m.id, 40), name: str(m.name, 80).replace(/[\\/]/g, '_') || 'file', size, mime: SAFE_MIME.test(m.mime) ? String(m.mime) : 'application/octet-stream', parts: [], got: 0, ts: now() };
        break;
      }
      case 'file-abort': { if (incoming && incoming.id === m.id) incoming = null; break; }
      case 'file-end': {
        if (!incoming || incoming.id !== m.id) return;
        const blob = new Blob(incoming.parts, { type: incoming.mime }); const url = URL.createObjectURL(blob);
        files.set(m.id, { url, name: incoming.name, mime: incoming.mime, size: blob.size });
        f.messages.push({ id: 'file-' + m.id, from: 'them', kind: 'file', fileId: m.id, label: `FILE ${incoming.name} (${kb(blob.size)})`, ts: now(), status: 'read' });
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
  function onChunk(buf) {
    if (!incoming) return;
    if (incoming.got + buf.byteLength > Math.min(incoming.size || MAX_FILE, MAX_FILE)) { incoming = null; toast('FILE TOO BIG. DROPPED.'); return; }
    incoming.parts.push(buf); incoming.got += buf.byteLength; peer.bytesIn += buf.byteLength;
  }
  const drained = (dc) => new Promise((r) => { const done = () => { dc.removeEventListener('bufferedamountlow', done); dc.removeEventListener('close', done); r(); }; dc.addEventListener('bufferedamountlow', done); dc.addEventListener('close', done); if (dc.readyState !== 'open') done(); });
  function sendFile(file) {
    const f = current;
    const task = async () => {
      let id = null, dc = null;
      try {
        if (!f || !peer || peer.friend !== f || peer.dc.readyState !== 'open') { toast('NOT CONNECTED'); return; }
        id = uid(); dc = peer.dc; dc.bufferedAmountLowThreshold = CHUNK * 4;
        send({ t: 'file', id, name: file.name, size: file.size, mime: file.type });
        const buf = await file.arrayBuffer();
        for (let o = 0; o < buf.byteLength; o += CHUNK) {
          if (dc.bufferedAmount > CHUNK * 16) await drained(dc);
          if (dc.readyState !== 'open') { toast('FILE DID NOT FINISH'); return; }
          dc.send(buf.slice(o, o + CHUNK)); if (peer) peer.bytesOut += Math.min(CHUNK, buf.byteLength - o);
        }
        if (dc.readyState !== 'open') { toast('FILE DID NOT FINISH'); return; }
        send({ t: 'file-end', id });
        files.set(id, { url: URL.createObjectURL(file), name: file.name, mime: file.type, size: file.size });
        f.messages.push({ id: 'file-' + id, from: 'me', kind: 'file', fileId: id, label: `FILE ${file.name} (${kb(file.size)})`, ts: now(), status: 'sent', mood: state.me.mood });
        save(); if (current === f) renderChat(); blip(true);
      } catch (_) { toast('FILE FAILED'); try { if (id && dc && dc.readyState === 'open') send({ t: 'file-abort', id }); } catch (__) {} }
    };
    sendQueue = sendQueue.then(task, task);
  }
  $('btn-file').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', (e) => { for (const f of e.target.files) { if (f.size > 50 * 1048576) { toast('50 MB MAX'); continue; } sendFile(f); } e.target.value = ''; });

  // voice notes: hold VOICE
  let rec = null, recChunks = [], held = false;
  async function recStart() {
    if (rec) return; try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!held || rec) { stream.getTracks().forEach((t) => t.stop()); return; }
      rec = new MediaRecorder(stream); recChunks = [];
      rec.addEventListener('dataavailable', (e) => e.data.size && recChunks.push(e.data));
      rec.addEventListener('stop', () => { stream.getTracks().forEach((t) => t.stop()); const blob = new Blob(recChunks, { type: rec.mimeType || 'audio/webm' }); rec = null; $('btn-voice').classList.remove('rec'); $('btn-voice').textContent = 'VOICE'; if (blob.size > 2000) sendFile(new File([blob], `voice-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`, { type: blob.type })); });
      rec.start(250); $('btn-voice').classList.add('rec'); $('btn-voice').textContent = 'REC ●'; buzz(15);
    } catch (_) { toast('NO MICROPHONE'); }
  }
  function recStop() { held = false; if (rec && rec.state !== 'inactive') rec.stop(); }
  const vb = $('btn-voice');
  vb.addEventListener('pointerdown', (e) => { e.preventDefault(); held = true; try { vb.setPointerCapture(e.pointerId); } catch (_) {} recStart(); });
  ['pointerup', 'pointercancel'].forEach((ev) => vb.addEventListener(ev, recStop));
  vb.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------- chat view ---------- */
  function openChat(id) {
    const f = friendById(id); if (!f) return; current = f; currentRoom = null; f.unread = 0; save();
    show('chat'); renderChat(); renderChatHead(); renderAtmo(); renderFriends();
    history.replaceState(null, '', '#f=' + id.slice(0, 16));
    if (wide.matches) $('composer-input').focus({ preventScroll: true });
  }
  function back() { current = null; currentRoom = null; show('lobby'); history.replaceState(null, '', location.pathname); renderFriends(); }
  $('btn-back').addEventListener('click', back);
  $('btn-si-back').addEventListener('click', back);
  $('btn-load-back').addEventListener('click', () => { const r = pending?.room && roomById(pending.room); cancelPending(); if (r) openRoom(r.id); else back(); });
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
      meta.innerHTML = `<span>${fmtTime(m.ts)}</span>${m.mood ? `<span class="mood" style="--m:${moodColor(m.mood)}">${esc(m.mood)}</span>` : ''}${m.from === 'me' ? `<span class="${m.status === 'read' ? 'read' : ''}">${m.status === 'read' ? '✓✓' : m.status === 'queued' ? 'WAITING' : '✓'}</span>` : m.verified === false ? '<span class="bad">UNVERIFIED</span>' : m.kind !== 'file' ? '<span class="ok">SIGNED</span>' : ''}`;
      li.append(meta); attachPress(li, m); ol.append(li);
    }
    scrollBottom(true);
  }
  const scrollEl = $('scroll');
  function scrollBottom(instant) { requestAnimationFrame(() => scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: instant || reduced ? 'auto' : 'smooth' })); }

  // composer
  const input = $('composer-input'), sendBtn = $('btn-send'); let draftTimer = null;
  function autosize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }
  input.addEventListener('input', () => { autosize(input); sendBtn.disabled = !input.value.trim(); if (state.me.live !== false) { clearTimeout(draftTimer); draftTimer = setTimeout(() => sendTo(current, { t: 'draft', text: input.value.slice(0, 400) }), 60); } });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('composer').requestSubmit(); } });
  $('composer').addEventListener('submit', async (e) => {
    e.preventDefault(); const text = input.value.trim(); if (!text || !current) return;
    const f = current;
    input.value = ''; autosize(input); sendBtn.disabled = true; input.focus({ preventScroll: true });
    const m = { id: uid(), from: 'me', to: f.id, text, ts: now(), mood: state.me.mood, lt: localTime(), status: 'queued' };
    m.sig = await sign({ t: 'msg', id: m.id, to: m.to, ts: m.ts, text }); f.messages.push(m); save(); if (current === f) renderChat(); flushQueue(f); blip(true); buzz();
  });
  function flushQueue(f) {
    if (!peer || peer.friend !== f || peer.dc.readyState !== 'open') return;
    for (const m of f.messages) {
      if (m.from !== 'me' || m.status !== 'queued') continue;
      if (!m.kind) { if (send({ t: 'msg', id: m.id, to: m.to || f.id, ts: m.ts, text: m.text, mood: m.mood, lt: m.lt, sig: m.sig })) m.status = 'sent'; }
      else if (m.kind === 'tab' && m.wire) { if (send(m.wire)) m.status = 'sent'; }
    }
    send({ t: 'draft', text: '' }); save(); if (current === f) renderChat();
  }
  $('btn-connect').addEventListener('click', () => { currentFriendTarget = current?.id || null; host(); });
  $('btn-host').addEventListener('click', () => { currentFriendTarget = null; host(); });
  $('btn-join').addEventListener('click', joinView);

  // reactions: long press
  let pressTimer = null, pressTarget = null;
  function attachPress(li, m) {
    if (m.kind === 'sys') return;
    let x0 = 0, y0 = 0;
    const start = (e) => { x0 = e.clientX; y0 = e.clientY; clearTimeout(pressTimer); pressTimer = setTimeout(() => { pressTarget = m; buzz(15); openSheet('sheet-react'); }, 420); };
    const cancel = () => clearTimeout(pressTimer);
    li.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => li.addEventListener(ev, cancel));
    li.addEventListener('pointermove', (e) => { if (Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancel(); });
    li.addEventListener('contextmenu', (e) => { e.preventDefault(); pressTarget = m; openSheet('sheet-react'); });
  }
  $('reacts').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !pressTarget || !current) return;
    pressTarget.reaction = pressTarget.reaction === b.dataset.r ? '' : b.dataset.r; save(); sendTo(current, { t: 'react', id: pressTarget.id, r: pressTarget.reaction }); closeSheets(); renderChat(); blip(true);
  });

  // TAB ledger
  $('btn-tab').addEventListener('click', () => { if (!current) return; $('tab-balance').textContent = balanceLine(current); openSheet('sheet-tab'); setTimeout(() => $('tab-amount').focus(), 50); });
  const balanceLine = (f) => { const b = balanceOf(f); return b === 0 ? 'EVEN.' : b > 0 ? `${f.name.toUpperCase()} OWES YOU ${b.toFixed(2)}` : `YOU OWE ${f.name.toUpperCase()} ${(-b).toFixed(2)}`; };
  $('form-tab').addEventListener('submit', async (e) => {
    e.preventDefault(); if (!current) return; const f = current; const amount = Math.round(Number($('tab-amount').value) * 100) / 100; if (!(amount > 0)) return;
    const t = { id: uid(), by: 'me', amount, dir: $('tab-dir').value, note: $('tab-note').value.trim().slice(0, 60), ts: now() };
    const wire = { t: 'tab', id: t.id, to: f.id, amount: t.amount, dir: t.dir, note: t.note, ts: t.ts }; wire.sig = await sign(wire);
    f.ledger = f.ledger || []; f.ledger.push(t);
    f.messages.push({ id: 'tab-' + t.id, from: 'me', kind: 'tab', wire, text: tabLine(t) + '\n' + balanceLine(f) + (state.me.tzAddr ? `\nSETTLE IN TEZ: ${state.me.tzAddr}` : ''), ts: t.ts, status: sendTo(f, wire) ? 'sent' : 'queued', mood: state.me.mood });
    save(); closeSheets(); if (current === f) renderChat(); $('tab-amount').value = ''; $('tab-note').value = ''; blip(true);
  });

  // LINK panel
  $('btn-link').addEventListener('click', () => {
    const online = peer && peer.friend === current && peer.dc.readyState === 'open'; const dl = $('stats'); dl.replaceChildren();
    const rows = online ? [['STATE', 'RUN'], ['CONNECT', `${peer.connectedAt - peer.startedAt} MS SETUP`], ['ROUND TRIP', peer.rtt == null ? '…' : `${peer.rtt} MS`], ['PATH', peer.path], ['SENT', kb(peer.bytesOut)], ['RECEIVED', kb(peer.bytesIn)], ['VIA RELAY', peer.relayBytes ? kb(peer.relayBytes) : peer.relay ? '0 · relay on standby' : '0 · no relay configured']] : [['STATE', 'OFFLINE'], ['NOTES WAITING', String(current ? current.messages.filter((m) => m.status === 'queued').length : 0)]];
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

  /* ---------- ROOM: three to five friends, full mesh ----------
     The host makes a room and invites each friend with the same handshake as a two-person line (code or
     paste link), on a channel labelled 'pmm-room'. Every line, invite or mesh, opens with the same hello
     signed over that line's DTLS fingerprint. The host then sends a roster it signs; for each pair of
     members without a line, the one with the lower sigil id writes a fresh offer signed to the other and
     the host carries it across its open lines, and the answer back. Texts are signed by their author over
     the room id, the host, the text, mood and hour, verified by every member, and each member passes a new
     one on once to its other lines, so a message still arrives when a mesh line cannot form. A relay that
     changes a byte breaks the signature and the copy is dropped. Every room signature covers a JSON tuple
     whose first element names its kind and version, never the '|' canon of two-person lines, so no field
     can be re-split into its neighbour. Each member signs a join for this room and host, and the host
     carries it in the roster; a member without one shows UNCONFIRMED until a direct line proves them.
     Seats: the host gives a member a fresh seat id each time it seats them. The join and the goodbye are
     signed over that seat, so a goodbye ends one seat and never a later one, and an old join cannot vouch
     for a new seat. Members remember the seats they saw leave and never take them back from a stale
     roster. A text names its recipients inside the signature: it goes to them only, and waits for each. */
  const ROOM_MAX = 5;
  const rlines = new Set();  // { pc, dc, roomId, expect, member, localFp, remoteFp, nonce, ready }
  let currentRoom = null;
  const roomById = (id) => state.rooms.find((r) => r.id === id);
  const cleanName = (n) => str(n, 24).replace(/[✓✔☑✅]/g, '').trim() || 'FRIEND';
  const memberOf = (room, id) => room.members.find((x) => x.id === id);
  const live = (l) => Boolean(l.member) && !l.refused && !l.leaving && l.dc && l.dc.readyState === 'open' && !l.closed;
  const roomLines = (room) => [...rlines].filter((l) => l.roomId === room.id && live(l));
  const lineTo = (room, id) => roomLines(room).find((l) => l.member.id === id);
  const pubOf = (p) => ({ kty: 'EC', crv: 'P-256', x: p.x, y: p.y });
  const okId = (v) => typeof v === 'string' && /^[A-Za-z0-9]{1,40}$/.test(v);
  const okTs = (v) => Number.isSafeInteger(v) && v > 0;
  const okMood = (v) => typeof v === 'string' && MOODS.some(([k]) => k === v);
  async function signTuple(arr) { return b64u(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signKey, enc.encode(JSON.stringify(arr)))); }
  async function verifyTuple(f, arr, sig) { try { return typeof sig === 'string' && await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await verifierFor(f), unb64u(sig), enc.encode(JSON.stringify(arr))); } catch (_) { return false; } }
  const joinTuple = (room, id, seat) => ['pmm-join-2', room.id, room.host, id, seat];
  const byeTuple = (room, m) => ['pmm-bye-2', room.id, room.host, m.from, m.seat];
  const isGone = (room, id, seat) => (room.gone || []).some((g) => g.from === id && g.seat === seat);
  const HEX64 = /^[0-9a-f]{64}$/;
  const seen = new Set();        // bye and offer nonces already handled, per room and sender
  const answering = new Set();   // one offer in flight per room and sender
  const relayed = new Map();     // host: recent offer/answer relays per pair
  const dialing = (room) => [...rlines].filter((o) => o.roomId === room.id && !o.member && !o.closed && o.expect).length;
  function lsend(l, obj) { if (!live(l) && !(obj.t === 'hello' && l.dc?.readyState === 'open')) return false; try { l.dc.send(typeof obj === 'string' ? obj : JSON.stringify(obj)); return true; } catch (_) { return false; } }
  function newLine(pc, roomId, expect) {
    const l = { pc, dc: null, roomId, expect, member: null, localFp: '', remoteFp: '', closed: false };
    l.ready = new Promise((r) => { l.readyNow = r; }); rlines.add(l); return l;
  }
  function closeLine(l) { if (l.closed) return; if (l.attempt && !l.attempt.verified) report(l.attempt, 'fail', 'none', 'hello'); l.closed = true; rlines.delete(l); clearTimeout(l.watchdog); try { l.dc && l.dc.close(); l.pc.close(); } catch (_) {} }
  // A reload is not a goodbye: the host keeps the seat. An invite still owed its outcome settles it first, as a two-person line does.
  function dropRoomLines() { for (const l of [...rlines]) { if (l.attempt) report(l.attempt, l.attempt.verified ? 'run' : 'fail', l.attempt.verified ? 'unknown' : 'none', l.attempt.verified ? '-' : 'abandoned'); closeLine(l); } }
  addEventListener('pagehide', dropRoomLines);
  async function linePath(pc) {
    try {
      const stats = await pc.getStats(); const cands = new Map(); let sel = null;
      stats.forEach((x) => { if (x.type === 'local-candidate' || x.type === 'remote-candidate') cands.set(x.id, x); if (x.type === 'candidate-pair' && x.state === 'succeeded' && (x.selected || x.nominated)) sel = x; });
      if (!sel) return 'unknown';
      return [cands.get(sel.localCandidateId), cands.get(sel.remoteCandidateId)].some((c) => c && c.candidateType === 'relay') ? 'relay' : 'direct';
    } catch (_) { return 'unknown'; }
  }
  // The guest side of any handshake: the channel label says whether it is a two-person line or a room.
  // Only the first channel on a guest's handshake is routed: a host cannot open a second one to take over another line.
  function channel(pc, dc) {
    if (pc.pmmChannel) { try { dc.close(); } catch (_) {} return; } pc.pmmChannel = true;
    if (dc.label === 'pmm-room') wireRoom(newLine(pc, null, null), dc); else wire(pc, dc);
  }
  function wireRoom(l, dc) {
    l.dc = dc; dc.binaryType = 'arraybuffer'; const { pc } = l;
    dc.addEventListener('open', async () => {
      if (pending && pending.pc === pc) { l.attempt = pending; clearTimeout(pending.poll); clearTimeout(pending.watchdog); pending = null; }
      clearTimeout(l.watchdog); l.watchdog = setTimeout(() => { if (!l.member) closeLine(l); }, 20000);
      l.localFp = dtlsFp(pc.localDescription); l.remoteFp = dtlsFp(pc.remoteDescription);
      // room: 1 and rsig mark a room hello. It carries no two-person signature, so an app from before rooms
      // refuses the line (HELLO NOT SIGNED) instead of taking it for a two-person line and flushing notes into it.
      const h = { t: 'hello', ...helloBody(), fp: l.remoteFp, room: 1 };
      h.rsig = await signTuple(['pmm-room-hello-1', state.me.id, h.ts, l.remoteFp]);
      lsend(l, h); l.readyNow();
    });
    let inbox = Promise.resolve(); l.depth = 0;
    l.enqueue = (fn) => { l.depth++; inbox = inbox.then(fn).catch(() => {}).finally(() => { l.depth--; }); };
    dc.addEventListener('message', (e) => { if (typeof e.data !== 'string' || e.data.length > 60000 || l.leaving || l.depth > 64) return; const raw = e.data; l.enqueue(() => onRoomData(l, raw)); });
    const closed = () => {
      if (l.closed) return; const had = l.member; const hostInvite = l.attempt && !had; closeLine(l);
      if (hostInvite && app.dataset.view === 'load') screen(null, '?LINE FAILED ERROR', 'no room hello came back. if their PMM is old, they reload and you INVITE again.');
      const room = l.roomId && roomById(l.roomId); if (!room || !had) return;
      if (memberOf(room, had.id)) pushRoomSys(room, `${had.name.toUpperCase()} · LINE DROPPED`);
      renderRoomAll(room);
      if (had.id !== room.host) setTimeout(() => { if (roomById(room.id) && hostLine(room)) meshUp(room); }, 3000); // texts go round through the host meanwhile
    };
    dc.addEventListener('close', closed);
    pc.addEventListener('connectionstatechange', () => { if (['failed', 'closed'].includes(pc.connectionState)) closed(); });
  }
  // A hello proves the key only when it is signed over this side's DTLS fingerprint for this one line.
  // A two-person hello on a room line means the other phone runs an app from before rooms: { id, old: true }.
  async function provenHello(m, localFp) {
    if (!m.pub || typeof m.pub.x !== 'string' || typeof m.pub.y !== 'string' || typeof m.id !== 'string' || !localFp || m.fp !== localFp) return null;
    const id = await fingerprint(m.pub); if (id !== m.id || id === state.me.id) return null;
    const f = { id, pub: pubOf(m.pub) };
    if (m.room !== 1) return (await verify(f, { t: 'hello', id, ts: m.ts, text: localFp, sig: m.sig })) ? { id, old: true } : null;
    return okTs(m.ts) && (await verifyTuple(f, ['pmm-room-hello-1', id, m.ts, localFp], m.rsig)) ? { id } : null;
  }
  // HOST: a guest on the app from before rooms is told nothing over the line (its app has already refused ours); the host is told why.
  function outdated(l) {
    const room = l.roomId && roomById(l.roomId);
    if (room && room.host === state.me.id && !l.expect) { toast('THEIR PMM IS OUT OF DATE'); screen(null, '?VERSION MISMATCH ERROR', 'their PMM is from before rooms. they reload, then INVITE again.'); }
    closeLine(l);
  }
  async function onRoomData(l, raw) {
    await l.ready; if (l.closed) return;
    let m; try { m = JSON.parse(raw); } catch (_) { return; }
    if (!m || typeof m !== 'object') return;
    if (m.t === 'hello') {
      if (l.refused) return;
      const hp = await provenHello(m, l.localFp); if (l.closed) return;
      if (!hp) { toast('HELLO NOT SIGNED. LINE CLOSED.'); return closeLine(l); }
      const id = hp.id;
      if (hp.old) return outdated(l);
      if ((l.expect && id !== l.expect) || (l.member && l.member.id !== id)) { toast('THE LINE CHANGED HANDS. CLOSED.'); return closeLine(l); }
      const info = { id, pub: pubOf(m.pub), name: cleanName(m.name), mood: validMood(m.mood), tz: str(m.tz, 64), place: str(m.place, 32) };
      if (l.attempt && !l.attempt.verified) { const a = l.attempt, ranAt = now(); a.verified = true; setTimeout(() => linePath(l.pc).then((path) => report(a, 'run', path, '-', ranAt)), 300); }
      const room = l.roomId && roomById(l.roomId);
      if (l.roomId && !room) return closeLine(l);
      // The cap is checked before the line counts as live, so a refused phone never hears the room.
      if (room && !l.member && room.host === state.me.id && !l.expect && !memberOf(room, id) && room.members.length >= ROOM_MAX) {
        l.refused = true; try { l.dc.send(JSON.stringify({ t: 'room-full' })); } catch (_) {}
        toast('ROOM FULL. FIVE IS THE CAP.'); setTimeout(() => closeLine(l), 400); return;
      }
      const again = Boolean(l.member); l.member = info; clearTimeout(l.watchdog);
      if (!room) return; // a guest's invite line learns its room from the roster
      if (again) { const x = memberOf(room, id); if (x) Object.assign(x, { name: info.name, mood: info.mood, tz: info.tz, place: info.place }); save(); renderRoomAll(room); return; }
      if (!(room.host === state.me.id && !l.expect) && !memberOf(room, id)) return closeLine(l);
      adopt(room, l, info);
      // The roster goes first, so a rejoining member knows the room before the host's waiting texts arrive.
      if (room.host === state.me.id) { await sendRoster(room); flushRoom(room); save(); renderRoomAll(room); if (!l.expect && (currentRoom !== room || app.dataset.view !== 'room')) openRoom(room.id); }
      return;
    }
    if (!l.member) return;
    // A roster held back by the limit below still comes before anything that arrived after it.
    if (l.rosterNext && m.t !== 'roster') { const n = l.rosterNext; l.rosterNext = null; clearTimeout(l.rosterTimer); l.rosterTimer = null; l.rosterAt = now(); await onRoster(l, n); if (l.closed) return; }
    switch (m.t) {
      case 'roster': { // at most one roster a second per line; the newest waiting one wins
        const wait = (l.rosterAt || 0) + 1000 - now();
        if (wait > 0) { l.rosterNext = m; if (!l.rosterTimer) l.rosterTimer = setTimeout(() => { l.rosterTimer = null; const n = l.rosterNext; l.rosterNext = null; if (n && !l.closed) l.enqueue(() => { l.rosterAt = now(); return onRoster(l, n); }); }, wait); return; }
        l.rosterAt = now(); return onRoster(l, m);
      }
      case 'join': return onJoin(l, m);
      case 'rsig': return onRsig(l, m);
      case 'rmsg': return onRmsg(l, m, raw);
      case 'mood': {
        const room = roomById(l.roomId); const x = room && memberOf(room, l.member.id); if (!x) return;
        x.mood = validMood(m.mood); save(); renderRoomAll(room); if (room.host === state.me.id) rosterSoon(room); return;
      }
      case 'bye': return onBye(l, m, raw);
      case 'room-full': toast('ROOM FULL. FIVE IS THE CAP.'); screen(null, '?ROOM FULL ERROR', 'five is the cap. ask the host.'); return closeLine(l);
    }
  }
  function adopt(room, l, info) {
    l.roomId = room.id;
    for (const o of [...rlines]) if (o !== l && o.roomId === room.id && (o.member?.id === info.id || o.expect === info.id) && !o.closed) closeLine(o);
    let x = memberOf(room, info.id);
    if (!x) { x = { ...info, confirmed: true }; room.members.push(x); pushRoomSys(room, `${info.name.toUpperCase()} IN · ${sigilOf(info.id)}`); blip(true); buzz(20); }
    else Object.assign(x, info, { confirmed: true }); // a direct line proved them
    if (room.host === state.me.id && !l.expect) { x.seat = uid(); x.join = ''; } // every seating is a new seat
    if (room.host !== state.me.id) flushRoom(room);
    save(); renderRoomAll(room);
  }
  // HOST: the roster is signed, carries every member's key, and only ever moves forward in time.
  const rosterBody = (room) => JSON.stringify({ name: room.name, members: room.members.map((x) => ({ id: x.id, pub: pubOf(x.pub), name: x.name, mood: x.mood, tz: x.tz, place: x.place, join: x.join || '', seat: x.seat || '' })) });
  async function sendRoster(room) {
    if (room.host !== state.me.id) return;
    const ts = Math.max(now(), (room.rosterTs || 0) + 1); room.rosterTs = ts; const body = rosterBody(room);
    const msg = { t: 'roster', room: room.id, ts, body }; msg.sig = await signTuple(['pmm-roster-1', room.id, room.host, ts, body]);
    const raw = JSON.stringify(msg); for (const l of roomLines(room)) lsend(l, raw);
  }
  function rosterSoon(room) { clearTimeout(room._rt); Object.defineProperty(room, '_rt', { value: setTimeout(() => sendRoster(room), 400), configurable: true, enumerable: false, writable: true }); }
  // MEMBER: take the roster from the host who invited this line, then dial the members it has no line to.
  async function onRoster(l, m) {
    const roomId = str(m.room, 12); if (!/^[A-Za-z0-9_-]{12}$/.test(roomId) || typeof m.body !== 'string' || m.body.length > 20000 || !okTs(m.ts)) return;
    if (l.roomId && (l.roomId !== roomId || !roomById(roomId))) return; // a line of a room this phone has left never makes it again
    const invite = !l.roomId;
    let room = roomById(roomId); if (room && room.host !== l.member.id) return;
    if (!(await verifyTuple(l.member, ['pmm-roster-1', roomId, l.member.id, m.ts, m.body], m.sig))) return;
    if (l.closed || l.leaving) return;
    room = roomById(roomId); if (room && (room.host !== l.member.id || m.ts <= (room.rosterTs || 0))) return;
    if (room && invite) for (const g of room.gone || []) lsend(l, g.raw); // goodbyes the host missed, before its roster counts here
    let b; try { b = JSON.parse(m.body); } catch (_) { return; }
    const members = [];
    for (const x of Array.isArray(b.members) ? b.members.slice(0, ROOM_MAX) : []) {
      if (!x || typeof x.pub?.x !== 'string' || typeof x.pub?.y !== 'string' || members.some((y) => y.id === x.id)) continue;
      if ((await fingerprint(x.pub)) !== x.id) continue;
      members.push({ id: x.id, pub: pubOf(x.pub), name: cleanName(x.name), mood: validMood(x.mood), tz: str(x.tz, 64), place: str(x.place, 32), join: typeof x.join === 'string' ? x.join.slice(0, 200) : '', seat: okId(x.seat) ? x.seat : '' });
    }
    if (!members.some((x) => x.id === state.me.id) || !members.some((x) => x.id === l.member.id)) return;
    // A seat this phone saw leave stays gone, whatever a stale roster says.
    if (room) for (let i = members.length - 1; i >= 0; i--) { const x = members[i]; if (x.id !== state.me.id && x.id !== l.member.id && isGone(room, x.id, x.seat)) members.splice(i, 1); }
    // The host's word is enough for the host and for this phone; everyone else must have signed a join for this seat.
    const shape = { id: roomId, host: l.member.id };
    for (const x of members) { const old = room && memberOf(room, x.id); x.confirmed = x.id === state.me.id || x.id === l.member.id || Boolean(old && old.seat === x.seat && old.confirmed) || (Boolean(x.seat) && await verifyTuple(x, joinTuple(shape, x.id, x.seat), x.join)); }
    if (l.closed || l.leaving || (l.roomId && !roomById(roomId))) return;
    room = roomById(roomId); if (room && m.ts <= (room.rosterTs || 0)) return;
    const first = !room;
    if (first) { room = { id: roomId, name: str(b.name, 32) || 'ROOM', host: l.member.id, members: [], messages: [], created: now(), unread: 0 }; state.rooms.push(room); }
    room.rosterTs = Number(m.ts); room.name = str(b.name, 32) || room.name;
    const before = new Set(room.members.map((x) => x.id));
    room.members = members.map((x) => { const had = lineTo(room, x.id); const old = memberOf(room, x.id); return had && old ? Object.assign(old, { seat: x.seat, join: x.join, confirmed: x.confirmed || old.confirmed }) : x; });
    for (const x of room.members) if (!before.has(x.id) && !first && x.id !== state.me.id) pushRoomSys(room, `${x.name.toUpperCase()} IN · ${sigilOf(x.id)}`);
    for (const o of [...rlines]) if (o.roomId === room.id && ((o.member && !memberOf(room, o.member.id)) || (!o.member && o.expect && !memberOf(room, o.expect)))) closeLine(o);
    if (invite) adopt(room, l, l.member); else { save(); renderRoomAll(room); }
    const mine = memberOf(room, state.me.id);
    if (mine.seat && (room.joinedSeat !== mine.seat || !mine.join)) { room.joinedSeat = mine.seat; mine.join = await signTuple(joinTuple(room, state.me.id, mine.seat)); lsend(l, { t: 'join', room: room.id, seat: mine.seat, sig: mine.join }); }
    if (first) pushRoomSys(room, `RUN · in ${room.name.toUpperCase()} · ${room.members.length} OF ${ROOM_MAX}`);
    else if (invite) pushRoomSys(room, `RUN · back in ${room.name.toUpperCase()}`);
    if (first || invite) openRoom(room.id);
    meshUp(room);
  }
  // HOST: a member's signed join for this room and this host, carried in every roster after it.
  async function onJoin(l, m) {
    const room = roomById(l.roomId); if (!room || room.host !== state.me.id || m.room !== room.id) return;
    const x = memberOf(room, l.member.id); if (!x || !x.seat || m.seat !== x.seat || x.join === m.sig) return;
    if (!(await verifyTuple(x, joinTuple(room, x.id, x.seat), m.sig))) return;
    x.join = m.sig; save(); rosterSoon(room);
  }
  // Leaving: signed by whoever leaves, passed on once, applied by every member. The host frees the seat.
  async function onBye(l, m, raw) {
    const room = roomById(l.roomId); if (!room || m.room !== room.id || !okId(m.seat)) return;
    // A goodbye ends the seat it names. A member seated again since holds a new seat, so an old goodbye passes them by.
    const who = memberOf(room, m.from); if (!who || who.id === state.me.id || who.seat !== m.seat) return;
    const key = `bye:${room.id}:${m.from}:${m.seat}`; if (seen.has(key)) return;
    if (!(await verifyTuple(who, byeTuple(room, m), m.sig))) return;
    if (seen.has(key) || memberOf(room, m.from)?.seat !== m.seat) return; seen.add(key);
    room.gone = [...(room.gone || []), { from: m.from, seat: m.seat, raw }].slice(-20);
    for (const o of roomLines(room)) if (o !== l && o.member.id !== who.id) lsend(o, raw);
    for (const o of [...rlines]) if (o.roomId === room.id && (o.member?.id === who.id || o.expect === who.id)) closeLine(o);
    if (who.id === room.host) { room.hostLeft = true; pushRoomSys(room, 'HOST LEFT · NOBODY NEW CAN JOIN'); }
    else {
      room.members = room.members.filter((x) => x.id !== who.id); pushRoomSys(room, `${who.name.toUpperCase()} LEFT THE ROOM`);
      if (room.host === state.me.id) await sendRoster(room); // members keep it in room.gone for a host that was away
    }
    save(); renderRoomAll(room);
  }
  function meshUp(room) {
    if (room.host === state.me.id || room.hostLeft) return;
    // An offer nobody answered in eight seconds went nowhere (the other phone was away): drop it so the dial can be tried again.
    for (const o of [...rlines]) if (o.roomId === room.id && o.nonce && !o.member && !o.answered && now() - o.dialAt > 8000) closeLine(o);
    for (const x of room.members) {
      if (dialing(room) >= ROOM_MAX - 2) return;
      if (x.id === state.me.id || x.id === room.host || state.me.id > x.id) continue;
      if ([...rlines].some((o) => o.roomId === room.id && !o.closed && (o.member?.id === x.id || o.expect === x.id))) continue;
      dial(room, x).catch(() => {});
    }
  }
  const hostLine = (room) => lineTo(room, room.host);
  // A dial that never opened (ICE gave up, the host was busy) is tried again: every fifteen seconds each member checks for missing pairs.
  setInterval(() => { for (const r of state.rooms) if (r.host !== state.me.id && hostLine(r)) meshUp(r); }, 15000);
  const rsigTuple = (room, m) => ['pmm-rsig-1', room.id, room.host, m.from, m.to, m.id, m.ts, m.kind, m.sdp];
  async function signedSig(room, to, nonce, kind, sdp) { const m = { t: 'rsig', room: room.id, from: state.me.id, to, id: nonce, ts: now(), kind, sdp }; m.sig = await signTuple(rsigTuple(room, m)); return m; }
  async function dial(room, x) {
    const via = hostLine(room); if (!via) return;
    await iceWithTimeout(1500);
    const pc = freshPc(); const l = newLine(pc, room.id, x.id); l.nonce = uid(); l.dialAt = now();
    wireRoom(l, pc.createDataChannel('pmm-room', { ordered: true }));
    l.watchdog = setTimeout(() => { if (!l.member) closeLine(l); }, 30000);
    await pc.setLocalDescription(await pc.createOffer()); await gathered(pc); if (l.closed) return;
    const m = await signedSig(room, x.id, l.nonce, 'offer', pc.localDescription.sdp);
    if (!lsend(hostLine(room) || via, m)) closeLine(l);
  }
  async function onRsig(l, m) {
    const room = roomById(l.roomId);
    if (!room || m.room !== room.id || !okId(m.id) || !okTs(m.ts) || !['offer', 'answer'].includes(m.kind) || typeof m.sdp !== 'string' || m.sdp.length > 32000) return;
    if (m.to !== state.me.id) { // the host carries a member's own offer or answer to the member it names, unchanged, a few a minute per pair
      if (room.host !== state.me.id || m.from !== l.member.id || !memberOf(room, m.to)) return;
      const pair = `${room.id}:${m.from}>${m.to}`, t = now(); const recent = (relayed.get(pair) || []).filter((x) => t - x < 60000);
      if (recent.length >= 12) return; recent.push(t); relayed.set(pair, recent);
      const out = lineTo(room, m.to); if (out) lsend(out, m); return;
    }
    const from = memberOf(room, m.from); if (!from || from.id === state.me.id || l.member.id !== room.host) return;
    const key = `rsig:${room.id}:${from.id}:${m.kind}:${m.id}`; if (seen.has(key)) return;
    if (!(Math.abs(now() - m.ts) < 600000) || !(await verifyTuple(from, rsigTuple(room, m), m.sig))) return;
    if (seen.has(key)) return; seen.add(key);
    const sdp = m.sdp;
    if (m.kind === 'offer') { meshAnswer(room, from, m).catch(() => {}); return; } // never inside the inbox: gathering takes seconds
    {
      const o = [...rlines].find((x) => x.roomId === room.id && x.expect === from.id && x.nonce === m.id && !x.answered && !x.closed); if (!o) return;
      o.answered = true; try { await o.pc.setRemoteDescription({ type: 'answer', sdp }); } catch (_) { closeLine(o); }
    }
  }
  // Answer a member's offer: one in flight per sender, and no more half-open lines than the room could ever need.
  async function meshAnswer(room, from, m) {
    const busy = `${room.id}:${from.id}`;
    if (answering.has(busy) || lineTo(room, from.id) || dialing(room) >= ROOM_MAX - 2) return;
    answering.add(busy);
    try {
      for (const o of [...rlines]) if (o.roomId === room.id && o.expect === from.id && !o.member) closeLine(o);
      const pc = freshPc(); const nl = newLine(pc, room.id, from.id);
      nl.watchdog = setTimeout(() => { if (!nl.member) closeLine(nl); }, 30000);
      pc.addEventListener('datachannel', (e) => { if (nl.dc) { try { e.channel.close(); } catch (_) {} return; } wireRoom(nl, e.channel); });
      try {
        await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp }); await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc);
        if (nl.closed) return;
        const a = await signedSig(room, from.id, m.id, 'answer', pc.localDescription.sdp);
        const via = hostLine(room); if (!via || !lsend(via, a)) closeLine(nl);
      } catch (_) { closeLine(nl); }
    } finally { answering.delete(busy); }
  }
  // Texts: signed by the author over the room id, the host, the text, the mood and the hour. Verified, kept, passed on once.
  const rtuple = (room, m) => ['pmm-rmsg-2', m.id, room.id, room.host, m.ts, m.text, m.mood, m.lt, m.to];
  const okTo = (to, from) => Array.isArray(to) && to.length >= 1 && to.length < ROOM_MAX && to.every((x) => typeof x === 'string' && HEX64.test(x) && x !== from) && new Set(to).size === to.length;
  async function onRmsg(l, m, raw) {
    const room = roomById(l.roomId); if (!room) return;
    const id = m.id; if (!okId(id) || m.room !== room.id || room.messages.some((x) => x.id === id)) return;
    const author = memberOf(room, m.from); if (!author || author.id === state.me.id) return;
    if (!okTs(m.ts) || typeof m.text !== 'string' || !m.text || m.text.length > 4000 || !okMood(m.mood) || typeof m.lt !== 'string' || m.lt.length > 16 || m.lt.includes('|')) return;
    if (!okTo(m.to, m.from) || !m.to.includes(state.me.id)) return; // written for others: not ours to read
    if (!(await verifyTuple(author, rtuple(room, m), m.sig))) return; // altered on the way: dropped, never shown, never passed on
    if (room.messages.some((x) => x.id === id)) return;
    room.messages.push({ id, from: author.id, text: m.text, ts: m.ts, mood: m.mood, lt: m.lt, verified: true, via: l.member.id === author.id ? '' : l.member.id });
    if (room.messages.length > 500) room.messages = room.messages.slice(-500);
    for (const o of roomLines(room)) if (o !== l && o.member.id !== author.id && m.to.includes(o.member.id)) lsend(o, raw);
    if (currentRoom !== room) room.unread = (room.unread || 0) + 1;
    save(); renderRoomAll(room); blip(false); buzz(12);
    if (currentRoom === room) $('announce').textContent = `${author.name}: ${m.text}`;
  }
  // Each of my texts goes straight to every recipient it names, as their lines open; never to anyone seated after it was written.
  function flushRoom(room) {
    const lines = roomLines(room); if (!lines.length) return;
    for (const m of room.messages) {
      if (m.from !== state.me.id || !Array.isArray(m.to) || !m.sig) continue;
      m.sentTo = m.sentTo || []; if (m.sentTo.length >= m.to.length) continue;
      const raw = JSON.stringify({ t: 'rmsg', room: room.id, id: m.id, from: m.from, ts: m.ts, text: m.text, mood: m.mood, lt: m.lt, to: m.to, sig: m.sig });
      for (const o of lines) if (m.to.includes(o.member.id) && !m.sentTo.includes(o.member.id) && lsend(o, raw)) m.sentTo.push(o.member.id);
      if (m.sentTo.length) m.status = 'sent';
    }
  }
  function roomMood(k) { for (const l of [...rlines]) if (live(l)) lsend(l, { t: 'mood', mood: k }); if (currentRoom) renderRoomAtmo(); }
  function pushRoomSys(room, text) { room.messages.push({ id: uid(), kind: 'sys', text, ts: now() }); save(); }

  /* room views */
  function renderRooms() {
    const ul = $('rooms'); ul.replaceChildren(); $('rooms-label').hidden = !state.rooms.length;
    for (const r of state.rooms) {
      const li = document.createElement('li'); const b = document.createElement('button'); b.className = 'friend'; b.type = 'button';
      b.setAttribute('aria-current', currentRoom === r ? 'true' : 'false');
      const on = roomLines(r).length; const l = [...r.messages].reverse().find((m) => m.kind !== 'sys');
      b.innerHTML = `<span class="sigil" aria-hidden="true"></span><span class="friend-main"><strong></strong><span></span></span><span class="friend-meta"><span class="dot ${on ? '' : 'off'}" title="${on ? 'online' : 'offline'}"></span>${r.unread ? `<span class="badge">${r.unread}</span>` : ''}</span>`;
      b.querySelector('.sigil').textContent = r.members.map((x) => sigilOf(x.id)[0]).join('') || '····';
      b.querySelector('strong').textContent = `${r.name.toUpperCase()} · ${r.members.length}/${ROOM_MAX}`;
      b.querySelector('.friend-main span').textContent = l ? `${l.from === state.me.id ? 'YOU' : (memberOf(r, l.from)?.name || '?').toUpperCase()}: ${l.text.replace(/\s+/g, ' ')}` : r.members.map((x) => x.name.toUpperCase()).join(' · ');
      b.addEventListener('click', () => openRoom(r.id));
      li.append(b); ul.append(li);
    }
  }
  function openRoom(id) {
    const r = roomById(id); if (!r) return; currentRoom = r; current = null; r.unread = 0; save();
    show('room'); renderRoom(); renderRoomHead(); renderRoomAtmo(); renderRooms(); renderFriends();
    history.replaceState(null, '', '#r=' + r.id);
    if (wide.matches) $('room-input').focus({ preventScroll: true });
  }
  function renderRoomAll(room) { renderRooms(); if (currentRoom === room) { renderRoom(); renderRoomHead(); renderRoomAtmo(); } }
  function renderRoomHead() {
    const r = currentRoom; if (!r) return; const on = new Set(roomLines(r).map((l) => l.member.id));
    $('room-name').textContent = `${r.name.toUpperCase()} · ${r.members.length}/${ROOM_MAX}`;
    const el = $('room-sigils'); el.replaceChildren();
    for (const x of r.members) {
      const s = document.createElement('span'); const me = x.id === state.me.id;
      const sure = me || x.id === r.host || x.confirmed !== false;
      s.className = `sigil sm${me || on.has(x.id) ? ' on' : ''}${x.id === r.host ? ' host' : ''}${sure ? '' : ' unsure'}`; s.textContent = sigilOf(x.id);
      s.title = `${x.name}${x.id === r.host ? ' · host' : ''}${me ? ' · you' : on.has(x.id) ? ' · direct line' : ' · via the room'}${sure ? '' : ' · unconfirmed'}`; el.append(s);
    }
    $('room-status').textContent = on.size ? `RUN · ${on.size} LINE${on.size === 1 ? '' : 'S'} OPEN` : 'OFFLINE · NOTES WAIT HERE';
  }
  function renderRoomAtmo() {
    const r = currentRoom; if (!r) return; const el = $('room-atmo');
    const others = r.members.filter((x) => x.id !== state.me.id);
    el.textContent = [`YOU: ${state.me.mood} · ${localTime()} ${state.me.place || ''}`.trim(), ...others.map((x) => `${x.name}: ${x.mood || 'calm'} · ${x.tz ? localTime(x.tz) + ' ' + (x.place || x.tz.split('/').pop().replace(/_/g, ' ')) : 'somewhere'}`)].join('   ·   ');
    const cols = [state.me.mood, ...others.map((x) => x.mood || 'calm')].map((k) => `color-mix(in srgb, ${moodColor(k)} 40%, transparent)`);
    el.style.background = `linear-gradient(90deg, ${cols.length > 1 ? cols.join(', ') : cols[0] + ', ' + cols[0]})`;
  }
  function renderRoom() {
    const r = currentRoom; if (!r) return; const ol = $('room-messages'); ol.replaceChildren(); let day = '';
    for (const m of r.messages) {
      const d = fmtDay(m.ts); if (d !== day) { day = d; const li = document.createElement('li'); li.className = 'day'; li.textContent = d; ol.append(li); }
      const li = document.createElement('li'); li.dataset.id = m.id;
      if (m.kind === 'sys') { li.className = 'msg sys'; li.innerHTML = '<div class="bubble"></div>'; li.querySelector('.bubble').textContent = m.text; ol.append(li); continue; }
      const mine = m.from === state.me.id; li.className = `msg ${mine ? 'me' : 'them'}`;
      if (!mine) { const a = memberOf(r, m.from); const who = document.createElement('div'); who.className = 'who'; who.textContent = `${sigilOf(m.from)} ${(a?.name || 'GONE').toUpperCase()}${a && a.confirmed === false && a.id !== r.host ? ' · UNCONFIRMED' : ''}`; li.append(who); }
      const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = m.text; if (reduced) bubble.style.animation = 'none'; li.append(bubble);
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.innerHTML = `<span>${fmtTime(m.ts)}</span><span class="mood" style="--m:${moodColor(m.mood)}">${esc(m.mood)}</span>${mine ? `<span>${m.status === 'queued' ? 'WAITING' : '✓'}</span>` : `<span class="ok">SIGNED${m.via ? ' · PASSED ON' : ''}</span>`}`;
      li.append(meta); ol.append(li);
    }
    requestAnimationFrame(() => $('room-scroll').scrollTo({ top: $('room-scroll').scrollHeight }));
  }
  const roomInput = $('room-input');
  roomInput.addEventListener('input', () => { autosize(roomInput); $('btn-room-send').disabled = !roomInput.value.trim(); });
  roomInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('room-composer').requestSubmit(); } });
  $('room-composer').addEventListener('submit', async (e) => {
    e.preventDefault(); const text = roomInput.value.trim().slice(0, 4000); const r = currentRoom; if (!text || !r) return;
    roomInput.value = ''; autosize(roomInput); $('btn-room-send').disabled = true; roomInput.focus({ preventScroll: true });
    const to = r.members.map((x) => x.id).filter((id) => id !== state.me.id).sort();
    if (!to.length) { roomInput.value = text; autosize(roomInput); $('btn-room-send').disabled = false; toast('NOBODY IN THE ROOM YET. INVITE FIRST.'); return; }
    const m = { id: uid(), from: state.me.id, text, ts: now(), mood: state.me.mood, lt: localTime().slice(0, 16).replace(/\|/g, ''), to, sentTo: [], status: 'queued' };
    m.sig = await signTuple(rtuple(r, m));
    r.messages.push(m); flushRoom(r); save(); renderRoomAll(r); blip(true); buzz();
  });
  $('btn-room').addEventListener('click', () => {
    const r = { id: b64u(crypto.getRandomValues(new Uint8Array(9))), name: `${myName()}'S ROOM`.slice(0, 32), host: state.me.id, members: [{ id: state.me.id, pub: pubOf(state.me.pub), name: myName(), mood: state.me.mood, tz: tzName(), place: state.me.place || '', seat: uid() }], messages: [], created: now(), unread: 0 };
    state.rooms.push(r); pushRoomSys(r, `ROOM MADE · YOU HOST · UP TO ${ROOM_MAX}`); renderRooms(); currentFriendTarget = null; host(r);
  });
  $('btn-room-back').addEventListener('click', back);
  function roomSheet() {
    const r = currentRoom; if (!r) return; const dl = $('room-stats'); dl.replaceChildren(); const on = new Set(roomLines(r).map((l) => l.member.id));
    for (const x of r.members) {
      const dt = document.createElement('dt'); dt.textContent = `${sigilOf(x.id)} ${x.id.slice(0, 8).toUpperCase()}`;
      const dd = document.createElement('dd'); dd.textContent = `${x.name.toUpperCase()}${x.id === r.host ? (r.hostLeft ? ' · HOST, LEFT' : ' · HOST') : ''} · ${x.id === state.me.id ? 'YOU' : on.has(x.id) ? 'DIRECT LINE' : 'VIA THE ROOM'}${x.confirmed === false && x.id !== r.host ? ' · UNCONFIRMED' : ''} · ${(x.mood || 'calm').toUpperCase()}`;
      dl.append(dt, dd);
    }
    const isHost = r.host === state.me.id;
    const full = r.members.length >= ROOM_MAX;
    $('btn-room-invite').hidden = !isHost; $('btn-room-invite').textContent = full ? 'RE-INVITE' : 'INVITE';
    $('btn-room-invite').disabled = full && r.members.every((x) => x.id === state.me.id || on.has(x.id));
    $('room-hint').textContent = isHost ? `You host. INVITE makes a code for one more friend; the room holds ${ROOM_MAX}. At ${ROOM_MAX} it reads RE-INVITE, for a member whose line dropped. New members meet the others through you, then talk to each of them directly.` : 'The host invites. Every text is signed by whoever wrote it; a copy passed on by another member shows PASSED ON and still checks against the author.';
    openSheet('sheet-room');
  }
  $('btn-room-menu').addEventListener('click', roomSheet);
  $('room-head').addEventListener('click', roomSheet);
  $('btn-room-done').addEventListener('click', closeSheets);
  $('btn-room-invite').addEventListener('click', () => { const r = currentRoom; closeSheets(); if (r) host(r); });
  $('btn-room-leave').addEventListener('click', () => {
    const r = currentRoom; if (!r || !confirm(`Leave ${r.name}? Its notes on this phone go too.`)) return;
    const bye = { t: 'bye', room: r.id, from: state.me.id, seat: memberOf(r, state.me.id)?.seat || '' };
    if (bye.seat) signTuple(byeTuple(r, bye)).then((sig) => {
      const raw = JSON.stringify({ ...bye, sig });
      for (const l of [...rlines]) if (l.roomId === r.id) { lsend(l, raw); l.leaving = true; setTimeout(() => closeLine(l), 200); }
    });
    state.rooms = state.rooms.filter((x) => x !== r); save(); closeSheets(); back(); renderRooms();
  });

  /* ---------- SI line ---------- */
  const siInput = $('si-input');
  function renderSi() {
    const ol = $('si-messages'); ol.replaceChildren();
    if (!state.si.length) { const li = document.createElement('li'); li.className = 'msg sys'; li.innerHTML = '<div class="bubble"></div>'; li.querySelector('.bubble').textContent = 'SAY THE TRUE SMALL THING. THE PACKET CARRIES THE REST.'; ol.append(li); }
    for (const m of state.si) {
      const li = document.createElement('li'); li.className = 'msg me'; li.innerHTML = '<div class="bubble"></div><div class="meta"></div>';
      li.querySelector('.bubble').textContent = m.text;
      li.querySelector('.meta').innerHTML = `<span>${fmtTime(m.ts)}</span><span class="mood" style="--m:${moodColor(m.mood)}">${esc(m.mood)}</span><span class="${m.status === 'sent' ? 'ok' : m.status === 'kept' ? '' : 'bad'}">${m.status === 'sent' ? 'SENT TO THE DESK' : m.status === 'kept' ? 'KEPT ON THE PHONE (DESK UNBOUND)' : 'FAILED · KEPT HERE'}</span>`;
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
    m.sig = await sign({ t: 'si', id: m.id, to: 'desk', ts: m.ts, text }); state.si.push(m); save(); renderSi();
    const packet = { type: 'pc-ping-v1', subject: 'PMM · SI line', from: `pmm:${myName()} ${m.sigil} ${m.fp.slice(0, 8)}`, timestamp: new Date(m.ts).toISOString(),
      body: `${text}\n\n— atmosphere —\nmood: ${m.mood}\nlocal time: ${m.lt} (${m.tz})\nplace: ${m.place || 'unsaid'}\nsigil: ${m.sigil} ${m.fp}\npub: P-256 ${state.me.pub.x}.${state.me.pub.y}\nid: ${m.id}\nts: ${m.ts}\nsig: ECDSA-SHA256 over "si|<id>|desk|<ts>|<text>|||" = ${m.sig}\nvia: pointcast.xyz/pmm/ SI line` };
    try { const r = await fetch(PING, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(packet) }); m.status = r.ok ? 'sent' : r.status === 503 ? 'kept' : 'failed'; } catch (_) { m.status = 'failed'; }
    save(); renderSi(); blip(m.status === 'sent');
  });

  /* ---------- boot ---------- */
  async function boot() {
    if (!state.me.tz) state.me.tz = tzName();
    renderMe(); renderFriends(); renderRooms(); ticker(); refreshIce(true);
    await ensureIdentity(); renderMe();
    setInterval(() => { if (ice.relay) refreshIce(false); }, 240000);
    if (wide.matches) show('lobby');
    route();
    setInterval(() => { if (current) renderAtmo(); if (currentRoom) renderRoomAtmo(); if (app.dataset.view === 'si') renderSi(); }, 30000);
  }
  function route() {
    const h = location.hash.slice(1);
    const o = /offer=([A-Za-z0-9_-]+)/.exec(h), a = /answer=([A-Za-z0-9_-]+)/.exec(h), j = /join=([A-Z2-9]{6})/i.exec(h), f = /f=([0-9a-f]{16})/.exec(h), r = /r=([A-Za-z0-9_-]{12})/.exec(h);
    if (o) { history.replaceState(null, '', location.pathname); joinOffer(o[1]); }
    else if (a) {
      history.replaceState(null, '', location.pathname);
      if (pending?.role === 'host') { pending.via = 'link'; $('answer-input').value = a[1]; $('form-answer').requestSubmit(); }
      else handOff(a[1]).then((ok) => {
        if (ok) { cancelPending(); show('load'); $('load-prompt').textContent = 'HANDED OVER'; $('load-code').hidden = true; $('form-join').hidden = true; $('form-answer').hidden = true; $('btn-share-code').hidden = true; $('btn-copy-code').hidden = true; hideQr(); scanKey(''); $('load-hint').textContent = ''; screen('LOAD "FRIEND",8,1', 'HANDED TO YOUR OTHER PMM TAB', 'the line opens there. you can close this one.'); }
        else { joinView(); $('load-line2').textContent = 'THAT IS AN ANSWER LINK'; $('load-line3').textContent = 'open it in the browser on the phone that pressed LOAD, or paste it there.'; }
      });
    }
    else if (j) { history.replaceState(null, '', location.pathname); joinCode(j[1].toUpperCase()); }
    else if (f) { const fr = state.friends.find((x) => x.id.startsWith(f[1])); if (fr) openChat(fr.id); }
    else if (r) { const room = state.rooms.find((x) => x.id === r[1]); if (room) openRoom(room.id); }
    else if (h === 'si') { show('si'); renderSi(); }
  }
  if (window.visualViewport) { const vv = window.visualViewport; let lastH = vv.height; vv.addEventListener('resize', () => { if (vv.height < lastH - 80 && current) scrollBottom(true); lastH = vv.height; }); }
  wide.addEventListener('change', () => show(app.dataset.view));
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => { if (peer) try { peer.dc.close(); } catch (_) {} dropRoomLines(); });
  boot();
})();
