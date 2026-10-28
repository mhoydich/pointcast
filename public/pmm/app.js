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
  async function ensureIdentity({ create = false } = {}) {
    if (!state.me.pub || !state.me.priv) {
      if (!create) throw new Error('Choose a handle and continue to create this device identity');
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
  let identityReady = false, quickstartBusy = false, sessionStarted = false;
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.me && Array.isArray(s.friends)) return s; } catch (_) {}
    return { me: { name: '', place: '', tz: '', mood: 'calm', live: true, sound: false, soundChoice: false }, friends: [], si: [] };
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
    if (state.me.sound !== true || state.me.soundChoice !== true || !gestured) return;
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
    $('chat-welcome').hidden = view !== 'lobby' || !wide.matches;
    const target = !profileReady() ? 'quickstart-name' : view === 'chat' ? 'composer-input' : view === 'si' ? 'si-input' : view === 'load' ? 'load-screen' : 'btn-host';
    const skip = document.querySelector('.skip'); skip.href = '#' + target; skip.textContent = !profileReady() ? 'Skip to handle setup' : view === 'chat' || view === 'si' ? 'Skip to composer' : 'Skip to connection controls';
    for (const p of ['lobby', 'load', 'chat', 'si']) $('pane-' + p).hidden = wide.matches ? false : p !== view;
  }
  let activeSheet = null, sheetOpener = null;
  function visibleFocusTarget(el) {
    if (!el || !el.isConnected || el.matches(':disabled') || el.closest('[hidden], [inert]')) return false;
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
    }
    return true;
  }
  function sheetControls() {
    return [...activeSheet.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')].filter((el) => el.tabIndex >= 0 && visibleFocusTarget(el));
  }
  function focusSheet() { (sheetControls()[0] || activeSheet).focus(); }
  function focusFlow() {
    const target = $(document.querySelector('.skip').hash.slice(1));
    if (visibleFocusTarget(target)) target.focus({ preventScroll: true });
  }
  function openSheet(id, opener = document.activeElement) {
    if (!activeSheet) sheetOpener = opener;
    activeSheet = $(id); activeSheet.tabIndex = -1;
    $('sheet-wrap').hidden = false;
    for (const s of document.querySelectorAll('.sheet')) s.hidden = s !== activeSheet;
    app.setAttribute('inert', ''); document.querySelector('.skip').setAttribute('inert', '');
    focusSheet();
  }
  function closeSheets() {
    if (!activeSheet) return;
    $('sheet-wrap').hidden = true; activeSheet = null;
    app.removeAttribute('inert'); document.querySelector('.skip').removeAttribute('inert');
    if (visibleFocusTarget(sheetOpener) && sheetOpener.tabIndex >= 0) sheetOpener.focus({ preventScroll: true });
    else focusFlow();
    sheetOpener = null;
  }
  document.querySelector('.skip').addEventListener('click', (e) => { e.preventDefault(); focusFlow(); });
  $('scrim').addEventListener('click', closeSheets);
  document.addEventListener('focusin', (e) => { if (activeSheet && !activeSheet.contains(e.target)) focusSheet(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (activeSheet) { e.preventDefault(); closeSheets(); } if (scanStream) stopScan(); return; }
    if (e.key !== 'Tab' || !activeSheet) return;
    const controls = sheetControls(), first = controls[0], last = controls[controls.length - 1];
    const focused = document.activeElement, outside = !activeSheet.contains(focused) || focused === activeSheet;
    if (!first) { e.preventDefault(); activeSheet.focus(); }
    else if (e.shiftKey && (focused === first || outside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (focused === last || outside)) { e.preventDefault(); first.focus(); }
  });

  /* ---------- quickstart: a display name, never a username registry ---------- */
  function handleValue(value) {
    const name = value.trim().replace(/\s+/g, ' ').replace(/^@/, '');
    if (!name) return { error: 'Choose a handle so friends know what to call you.' };
    if (name.length > 24 || !/^[\p{L}\p{N}][\p{L}\p{N}\p{M} ._'’-]*$/u.test(name)) return { error: 'Use 1–24 characters: letters, numbers, spaces, dots, dashes or underscores.' };
    return { name };
  }
  function profileReady() { return identityReady && Boolean(state.me.name?.trim()); }
  function renderQuickstart() {
    const ready = profileReady();
    if (!ready) show('lobby');
    $('quickstart-invite').hidden = !/(?:^|&)(?:join|offer|answer)=/.test(location.hash.slice(1));
    $('quickstart').hidden = ready;
    if (ready && app.dataset.view === 'lobby') show('lobby');
    $('me-card').hidden = !state.me.id;
    $('first-use-next').hidden = !ready;
    $('friend-actions').hidden = !ready;
    $('friend-directory').hidden = !ready;
    $('btn-export').disabled = !identityReady;
    $('lobby-prompt').textContent = ready ? 'READY.' : 'SET YOUR HANDLE';
    $('welcome-next').textContent = ready ? 'Invite someone or choose a conversation on the left.' : 'Set a handle on the left, then invite a friend or use their code or link.';
    $('quickstart-identity').textContent = state.me.pub && state.me.priv ? 'Continue keeps your existing device identity.' : 'Continue creates a signing key on this device.';
    if (!ready && !$('quickstart-name').value) $('quickstart-name').value = state.me.name || '';
  }
  $('quickstart-name').addEventListener('input', () => { $('quickstart-name').removeAttribute('aria-invalid'); $('quickstart-error').hidden = true; });
  $('quickstart-form').addEventListener('submit', async (e) => {
    e.preventDefault(); if (quickstartBusy) return;
    const result = handleValue($('quickstart-name').value);
    if (result.error) { $('quickstart-error').textContent = result.error; $('quickstart-error').hidden = false; $('quickstart-name').setAttribute('aria-invalid', 'true'); $('quickstart-name').focus(); return; }
    quickstartBusy = true; $('quickstart-submit').disabled = true; $('quickstart-submit').textContent = 'SETTING UP…'; $('quickstart-error').hidden = true;
    try {
      await ensureIdentity({ create: true }); identityReady = true;
      state.me.name = result.name; save(); renderMe(); renderQuickstart(); renderFriends();
      startSession();
      focusFlow();
    } catch (_) {
      $('quickstart-error').textContent = 'Could not set up this device. Try again, or restore a key in Settings. Your invite link has not changed.';
      $('quickstart-error').hidden = false;
    } finally { quickstartBusy = false; $('quickstart-submit').disabled = false; $('quickstart-submit').textContent = 'CONTINUE'; }
  });

  /* ---------- lobby ---------- */
  function renderMe() {
    $('me-name').textContent = myName().toUpperCase();
    $('me-id').textContent = state.me.id ? `SIGIL ${state.me.id.slice(0, 8).toUpperCase()} · ${(state.me.place || tzName()).toUpperCase()}` : 'Set a handle to begin';
    $('me-sigil').textContent = state.me.id ? sigilOf(state.me.id) : '····';
    $('btn-mood').textContent = state.me.mood.toUpperCase();
    document.documentElement.style.setProperty('--mood-me', moodColor(state.me.mood));
  }
  function renderFriends() {
    const ul = $('friends'); ul.replaceChildren();
    if (!state.friends.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Your conversations will appear here after you connect with a friend.'; ul.append(li); return; }
    const sorted = [...state.friends].sort((a, b) => (lastMsg(b)?.ts || b.created) - (lastMsg(a)?.ts || a.created));
    for (const f of sorted) {
      const li = document.createElement('li'); const b = document.createElement('button'); b.className = 'friend'; b.type = 'button';
      b.setAttribute('aria-current', current && current.id === f.id ? 'true' : 'false');
      const online = peer && peer.friend === f && peer.dc && peer.dc.readyState === 'open';
      const l = lastMsg(f);
      b.innerHTML = `<span class="sigil" aria-hidden="true">${sigilOf(f.id)}</span><span class="friend-main"><strong></strong><span></span></span><span class="friend-meta"><span class="dot ${online ? '' : 'off'}" role="img" aria-label="${online ? 'Connected' : 'Not connected'}"></span>${f.unread ? `<span class="badge">${f.unread}</span>` : ''}</span>`;
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
  let soundChoiceChanged = false;
  $('set-sound').addEventListener('change', () => { soundChoiceChanged = true; });
  $('btn-settings').addEventListener('click', (e) => {
    soundChoiceChanged = false; $('set-name-error').hidden = true; $('set-name').removeAttribute('aria-invalid');
    $('set-name').value = state.me.name; $('set-place').value = state.me.place || ''; $('set-tz').value = state.me.tzAddr || '';
    $('set-live').checked = state.me.live !== false; $('set-sound').checked = state.me.sound === true && state.me.soundChoice === true;
    $('set-key').textContent = state.me.id ? `${sigilOf(state.me.id)}  ${state.me.id.slice(0, 16).toUpperCase()} · minted on this phone. Export it to keep your sigil if you clear the browser.` : 'Created when you continue through quickstart.';
    openSheet('sheet-settings', e.currentTarget);
  });
  $('btn-settings-done').addEventListener('click', () => {
    const handle = $('set-name').value === state.me.name ? { name: state.me.name } : handleValue($('set-name').value);
    if (handle.error) { $('set-name-error').textContent = handle.error; $('set-name-error').hidden = false; $('set-name').setAttribute('aria-invalid', 'true'); $('set-name').focus(); return; }
    state.me.name = handle.name; state.me.place = $('set-place').value.trim().slice(0, 32);
    state.me.tzAddr = $('set-tz').value.trim().slice(0, 40); state.me.live = $('set-live').checked; state.me.sound = $('set-sound').checked;
    if (soundChoiceChanged) state.me.soundChoice = true;
    save(); renderMe(); renderQuickstart(); if (profileReady() && !sessionStarted) startSession(); closeSheets(); sendHello();
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
      if (swapped) { hangup(); cancelPending(); }
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
      identityReady = true; renderQuickstart();
      save(); renderMe(); renderFriends(); toast(restored ? `KEY LOADED · ${restored} FRIEND${restored === 1 ? '' : 'S'} RESTORED` : 'KEY LOADED'); if (profileReady()) startSession(); closeSheets();
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
  async function host() {
    if (!profileReady()) { show('lobby'); renderQuickstart(); return; }
    cancelPending(); hangup(); const mine = ++attempt;
    show('load'); $('load-prompt').textContent = 'SEARCHING FOR FRIEND'; $('load-code').hidden = true; $('form-join').hidden = true; $('form-answer').hidden = true;
    $('btn-share-code').hidden = true; $('btn-copy-code').hidden = true; $('load-hint').textContent = ''; hideQr(); scanKey('');
    screen('LOAD "FRIEND",8,1', 'CREATING YOUR INVITE', 'Keep this screen open while PMM prepares a link.');
    await iceWithTimeout(1500); if (mine !== attempt) return;
    const pc = freshPc(); const dc = pc.createDataChannel('pmm', { ordered: true });
    const p = { pc, dc, role: 'host', startedAt: now() }; pending = p;
    wire(pc, dc);
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
    if (!profileReady()) { show('lobby'); renderQuickstart(); return; }
    cancelPending(); show('load'); $('load-prompt').textContent = 'JOIN'; $('load-code').hidden = true; $('form-answer').hidden = true; $('btn-share-code').hidden = true; $('btn-copy-code').hidden = true;
    screen('LOAD "FRIEND",8,1', 'ENTER THEIR CODE OR LINK', canScan ? 'or paste the link they sent, or scan their code' : 'or paste the link they sent, or point your camera at their code'); $('form-join').hidden = false; $('load-hint').textContent = ''; hideQr(); scanKey('SCAN THEIR CODE'); setTimeout(() => $('join-input').focus(), 50);
  }
  $('form-join').addEventListener('submit', (e) => { e.preventDefault(); const v = $('join-input').value.trim(); const o = /offer=([A-Za-z0-9_-]+)/.exec(v); const j = /join=([A-Z2-9]{6})/i.exec(v); if (o) joinOffer(o[1]); else joinCode((j ? j[1] : v).toUpperCase()); });
  async function joinCode(code) {
    if (!profileReady()) return;
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return toast('?SYNTAX ERROR: SIX LETTERS');
    cancelPending(); show('load'); $('form-join').hidden = true; $('load-code').textContent = code; $('load-code').hidden = false; hideQr(); scanKey('');
    screen('LOAD "FRIEND",8,1', 'SEARCHING FOR FRIEND', 'asking the desk for the handshake…');
    const mine = ++attempt; await iceWithTimeout(1500); if (mine !== attempt) return;
    const pc = freshPc(); pending = { pc, role: 'guest', code, startedAt: now() };
    pc.addEventListener('datachannel', (e) => { pending && (pending.dc = e.channel); wire(pc, e.channel); });
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
    if (!profileReady()) return;
    cancelPending(); show('load'); $('form-join').hidden = true; $('load-code').hidden = true; $('load-prompt').textContent = 'JOIN'; hideQr(); scanKey('');
    screen('LOAD "FRIEND",8,1', 'PASTE MODE', 'reading their handshake…');
    const mine = ++attempt; await iceWithTimeout(1500); if (mine !== attempt) return;
    const pc = freshPc(); pending = { pc, role: 'guest', startedAt: now() };
    pc.addEventListener('datachannel', (e) => { pending && (pending.dc = e.channel); wire(pc, e.channel); });
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
    $('peer-status').textContent = online ? 'CONNECTED' : 'NOT CONNECTED';
    const waiting = current.messages.filter((m) => m.from === 'me' && m.status === 'queued').length;
    const note = online
      ? 'Connected to ' + current.name + '. Keep PMM open on both devices.'
      : (waiting ? `${waiting} ${waiting === 1 ? 'message is' : 'messages are'} waiting on this device. ` : 'Messages stay on this device for now. ') + 'Connect with ' + current.name + ' to send.';
    if ($('connection-note').textContent !== note) $('connection-note').textContent = note;
    $('btn-send').textContent = online ? 'SEND' : 'KEEP HERE';
    $('btn-send').setAttribute('aria-label', online ? 'Send message' : 'Keep message on this device until connected');
    $('composer-input').placeholder = online ? 'Write a message…' : 'Write now, send when connected…';
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
    if (!f.messages.some((m) => m.kind !== 'sys')) { const li = document.createElement('li'); li.className = 'conversation-empty'; li.innerHTML = '<strong>Say your first hello.</strong><p>Write a message below. The connection note shows when it can leave this device.</p>'; ol.append(li); }
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
      meta.innerHTML = `<span>${fmtTime(m.ts)}</span>${m.mood ? `<span class="mood" style="--m:${moodColor(m.mood)}">${esc(m.mood)}</span>` : ''}${m.from === 'me' ? `<span class="delivery ${m.status === 'read' ? 'read' : ''}">${m.status === 'read' ? 'RECEIVED' : m.status === 'queued' ? 'WAITING' : m.status === 'sent' ? 'SENT' : 'NOT CONFIRMED'}</span>` : m.verified === false ? '<span class="bad">UNVERIFIED</span>' : m.kind !== 'file' ? '<span class="ok">SIGNED</span>' : ''}`;
      li.append(meta); attachPress(li, m); ol.append(li);
    }
    renderChatHead();
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
    renderMe(); renderFriends(); show('lobby'); renderQuickstart();
    // Returning profiles import their existing key. Fresh visits never mint one.
    if (state.me.pub && state.me.priv) {
      try { await ensureIdentity(); identityReady = true; renderMe(); renderQuickstart(); }
      catch (_) { $('quickstart-error').textContent = 'Could not load your existing identity. Try Continue again or restore a key in Settings.'; $('quickstart-error').hidden = false; }
    }
    if (profileReady()) startSession();
  }
  function startSession() {
    if (!sessionStarted) {
      sessionStarted = true; ticker(); refreshIce(true);
      setInterval(() => { if (ice.relay) refreshIce(false); }, 240000);
      setInterval(() => { if (current) renderAtmo(); if (app.dataset.view === 'si') renderSi(); }, 30000);
    }
    route();
  }
  function route() {
    if (!profileReady()) { renderQuickstart(); return; }
    const h = location.hash.slice(1);
    const o = /offer=([A-Za-z0-9_-]+)/.exec(h), a = /answer=([A-Za-z0-9_-]+)/.exec(h), j = /join=([A-Z2-9]{6})/i.exec(h), f = /f=([0-9a-f]{16})/.exec(h);
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
    else if (h === 'si') { show('si'); renderSi(); }
  }
  if (window.visualViewport) { const vv = window.visualViewport; let lastH = vv.height; vv.addEventListener('resize', () => { if (vv.height < lastH - 80 && current) scrollBottom(true); lastH = vv.height; }); }
  wide.addEventListener('change', () => show(app.dataset.view));
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => { if (peer) try { peer.dc.close(); } catch (_) {} });
  boot();
})();
