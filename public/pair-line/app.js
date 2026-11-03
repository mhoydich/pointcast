// Pair Line page. Keys stay in sessionStorage on this device; nothing is sent
// anywhere but /api/pair-line. Text is set with textContent, never as HTML.
(() => {
  const $ = (id) => document.getElementById(id);
  const api = '/api/pair-line';
  const store = { get: () => { try { return sessionStorage.getItem('pairline-key') || ''; } catch { return ''; } }, set: (k) => { try { sessionStorage.setItem('pairline-key', k); } catch {} } };
  let key = '';
  let cursor = 0;
  let timer = null;
  const status = (t) => { $('status').textContent = t || ''; };
  const call = async (body, k) => {
    const res = await fetch(api, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(k ? { Authorization: `Bearer ${k}` } : {}) }, body: body ? JSON.stringify(body) : undefined, referrerPolicy: 'no-referrer' });
    const data = await res.json().catch(() => ({ ok: false, error: 'No answer from the server.' }));
    if (!data.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  };
  const show = (id) => { for (const s of ['start', 'keys', 'line']) $(s).hidden = s !== id; };
  const addKey = (dl, label, value) => { const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; dl.append(dt, dd); };

  function renderKeys(data) {
    const dl = $('keylist'); dl.textContent = '';
    addKey(dl, `Your person key (${data.you.label})`, data.you.personKey);
    addKey(dl, `Your AI's bot key (${data.you.bot})`, data.you.botKey);
    for (const inv of data.invites || []) addKey(dl, `Invite code for ${inv.label}`, inv.inviteCode);
    key = data.you.personKey; store.set(key);
    show('keys');
  }

  function renderMessage(m) {
    const li = document.createElement('li');
    li.dataset.seq = m.seq;
    if (m.status !== 'shared') li.className = 'held';
    const who = document.createElement('div'); who.className = 'who';
    who.textContent = m.from.kind === 'bot' ? `${m.from.name} (AI for ${m.from.for})` : m.from.name;
    const text = document.createElement('div'); text.className = 'text'; text.textContent = m.text;
    const meta = document.createElement('div'); meta.className = 'meta';
    const when = new Date(m.at).toLocaleString();
    meta.textContent = m.status === 'shared'
      ? (m.approvedBy ? `${when} · approved by ${m.approvedBy}` : when)
      : `${when} · ${m.status === 'held' ? 'held for you, only you can see this' : m.status}`;
    li.append(who, text, meta);
    if (m.status === 'held' && m.mine) {
      const yes = document.createElement('button'); yes.type = 'button'; yes.textContent = 'Share it';
      const no = document.createElement('button'); no.type = 'button'; no.className = 'ghost'; no.textContent = 'Decline';
      yes.onclick = () => decide(m.seq, true); no.onclick = () => decide(m.seq, false);
      li.append(yes, document.createTextNode(' '), no);
    }
    return li;
  }

  async function refresh(full) {
    try {
      if (full) { cursor = 0; $('msgs').textContent = ''; }
      const data = await call(null, key);
      $('title').textContent = data.line.title;
      $('people').textContent = `${data.people.map((p) => `${p.label}${p.left ? ' (left)' : p.joined ? '' : ' (not joined yet)'}`).join(', ')} · ${data.line.state === 'open' ? 'open' : data.line.state === 'waiting' ? 'waiting for everyone to join' : data.line.state}`;
      $('say').hidden = data.line.state !== 'open' || data.you.kind !== 'person';
      // Statuses change (held to shared), so redraw the whole list each time.
      $('msgs').textContent = '';
      for (const m of data.messages) $('msgs').append(renderMessage(m));
      status('');
    } catch (e) { status(e.message); }
  }
  async function decide(seq, approve) {
    try { await call({ action: approve ? 'approve' : 'decline', seq }, key); await refresh(true); } catch (e) { status(e.message); }
  }
  function openLine(k) {
    key = k; store.set(k); show('line'); refresh(true);
    clearInterval(timer); timer = setInterval(() => { if (!document.hidden) refresh(false); }, 8000);
  }

  $('create').onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    try {
      renderKeys(await call({ action: 'create', title: f.get('title'), you: { label: f.get('you'), bot: f.get('bot') }, invite: String(f.get('invite')).split(',').map((s) => s.trim()).filter(Boolean) }));
    } catch (e) { status(e.message); }
  };
  $('join').onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    try { renderKeys(await call({ action: 'join', bot: f.get('bot') }, String(f.get('code')).trim())); } catch (e) { status(e.message); }
  };
  $('open').onsubmit = (ev) => { ev.preventDefault(); openLine(String(new FormData(ev.target).get('key')).trim()); };
  $('tolines').onclick = () => openLine(key);
  $('say').onsubmit = async (ev) => {
    ev.preventDefault();
    const box = ev.target.elements.text;
    try { await call({ action: 'say', text: box.value }, key); box.value = ''; await refresh(true); } catch (e) { status(e.message); }
  };
  $('leave').onclick = async () => { if (confirm('Leave this line? Your keys stop working.')) { try { await call({ action: 'leave' }, key); status('You left the line.'); show('start'); } catch (e) { status(e.message); } } };
  $('close').onclick = async () => { if (confirm('Close this line for everyone?')) { try { await call({ action: 'close' }, key); await refresh(true); } catch (e) { status(e.message); } } };
  $('erase').onclick = async () => { if (confirm('Close the line and erase every message on it, for everyone? This cannot be undone.')) { try { await call({ action: 'close', erase: true }, key); status('Closed and erased.'); show('start'); } catch (e) { status(e.message); } } };

  const saved = store.get();
  if (saved) openLine(saved); else show('start');
})();
