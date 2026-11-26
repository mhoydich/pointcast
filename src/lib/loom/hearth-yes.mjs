import { normHandle } from './for-you.mjs';
import { ago, roomHref } from './hearth.mjs';

const HANDLE = /^[a-z0-9][a-z0-9_.-]{0,31}$/;
const REPLY = /^loom:[a-f0-9]{24}#(m_[a-z0-9]+)$/;
const time = value => Date.parse(value) || 0;

export function ownerFromSearch(search = '') {
  const owner = normHandle(new URLSearchParams(search).get('for') || 'mike');
  if (!HANDLE.test(owner)) throw new Error('Invalid Loom name');
  return owner;
}

/** Consume the existing classified pile; never turn a preview or receipt into an ask here. */
export function yesQueue(feed) {
  if (feed?.ok !== true || feed.kvBound === false || !Array.isArray(feed.piles?.needsYes)) throw new Error('Could not read asks');
  const asks = feed.piles.needsYes;
  if (asks.some(ask => !ask || REPLY.exec(ask.link)?.[1] !== ask.id || !ask.address)) throw new Error('Invalid ask');
  return [...asks].sort((a, b) => time(b.at) - time(a.at) || (b.seq || 0) - (a.seq || 0));
}

export function yesPosition(asks, index = 0) {
  const position = Math.max(0, Math.min(Math.trunc(index) || 0, asks.length - 1));
  return {
    ask: asks[position] || null, index: position,
    waiting: asks.length ? `${position + 1} of ${asks.length} waiting` : '',
    hasBack: position > 0, hasNext: position < asks.length - 1,
  };
}

export function mountHearthYes(document, {
  request = fetch, now = Date.now,
  navigate = url => document.defaultView.location.assign(url),
} = {}) {
  const win = document.defaultView;
  const $ = id => document.getElementById(id);
  const store = {
    get(key) { try { return win.localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { win.localStorage.setItem(key, value); } catch { /* private mode */ } },
  };
  const labels = { 'yes-approve': 'Yes, go ahead', 'yes-hold': 'Hold' };
  const answered = new Set();
  let owner, asks = [], index = 0, generation = 0, loaded = false, sending = false;
  let armed = null, timer = null;
  const uncertain = new Set();

  function disarm() {
    armed = null;
    win.clearTimeout(timer);
    for (const [id, label] of Object.entries(labels)) $(id).textContent = label;
  }

  function controls() {
    const view = yesPosition(asks, index);
    $('yes-back').disabled = sending || !view.hasBack;
    $('yes-next').disabled = sending || !view.hasNext;
    for (const id of Object.keys(labels)) $(id).disabled = sending || !loaded || uncertain.has(view.ask?.link);
    $('yes-reply').disabled = sending || !view.ask;
  }

  async function readJson(path) {
    const response = await request(path, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Read failed');
    const data = await response.json();
    if (data?.ok !== true || data.kvBound === false) throw new Error('Read unavailable');
    return data;
  }

  async function show({ focus = false } = {}) {
    const revision = ++generation;
    disarm();
    const view = yesPosition(asks, index);
    index = view.index;
    loaded = false;
    $('yes-card').hidden = !view.ask;
    $('yes-empty').hidden = !!view.ask;
    $('yes-count').hidden = !view.ask;
    $('yes-count').textContent = view.waiting;
    $('yes-nav').hidden = asks.length < 2;
    $('yes-retry').hidden = true;
    $('yes-identity').hidden = true;
    $('yes-state').textContent = '';
    $('yes-options').replaceChildren();
    $('yes-options').hidden = true;
    controls();
    if (!view.ask) return;
    const ask = view.ask;
    $('yes-from').textContent = ask.from?.name || 'Anonymous';
    $('yes-room').textContent = 'in ' + (ask.label || ask.address);
    $('yes-room').href = roomHref(ask.address);
    $('yes-when').dateTime = ask.at || '';
    $('yes-when').textContent = ago(ask.at, now());
    $('yes-body').textContent = 'Reading the full ask…';
    $('yes-card').setAttribute('aria-busy', 'true');
    try {
      const data = await readJson('/api/loom?to=' + encodeURIComponent(ask.link));
      if (revision !== generation) return;
      const message = data.messages?.find(message => message.id === ask.id && !message.hidden && !message.withdrawn);
      if (!message || !(message.body || message.poll?.question)) throw new Error('Ask unavailable');
      // Keep every line, including a poll's question and choices, as text rather than HTML.
      $('yes-body').textContent = [message.body, message.poll?.question !== message.body && message.poll?.question].filter(Boolean).join('\n\n');
      for (const option of message.poll?.options || []) {
        const li = document.createElement('li');
        li.textContent = typeof option === 'string' ? option : option.label || option.text || '';
        $('yes-options').append(li);
      }
      $('yes-options').hidden = !$('yes-options').children.length;
      loaded = true;
      if (uncertain.has(ask.link)) $('yes-state').textContent = 'It may have posted. Open Reply to check the thread before trying again.';
      if (focus) $('yes-body').focus();
    } catch {
      if (revision !== generation) return;
      $('yes-body').textContent = 'The full ask couldn’t be read.';
      $('yes-state').textContent = 'Try again, or open Reply to read the original thread.';
      $('yes-retry').hidden = false;
    } finally {
      if (revision === generation) {
        $('yes-card').setAttribute('aria-busy', 'false');
        controls();
      }
    }
  }

  async function load() {
    $('yes-retry').hidden = true;
    $('yes-state').textContent = 'Reading what needs your yes…';
    try {
      owner = ownerFromSearch(win.location.search);
      $('yes-home').href = '/loom/hearth/?for=' + encodeURIComponent(owner);
      const feed = await readJson('/loom/for/' + encodeURIComponent(owner) + '?format=json');
      asks = yesQueue(feed).filter(ask => !answered.has(ask.link));
      await show();
    } catch {
      $('yes-empty').hidden = true;
      $('yes-state').textContent = 'The Loom couldn’t read what needs your yes.';
      $('yes-retry').hidden = false;
    }
  }

  function identity() {
    const savedName = (store.get('loom.name') || '').trim();
    const savedKind = store.get('loom.akind');
    const name = savedName || $('yes-name').value.trim();
    const kind = ['human', 'agent'].includes(savedKind) ? savedKind : $('yes-kind').value;
    if (!name || !['human', 'agent'].includes(kind)) {
      $('yes-identity').hidden = false;
      $('yes-name').value = name;
      if (['human', 'agent'].includes(kind)) $('yes-kind').value = kind;
      $('yes-state').textContent = 'Choose your Loom name and posting label before answering.';
      $(name ? 'yes-kind' : 'yes-name').focus();
      return null;
    }
    return { name, kind };
  }

  function clientId() {
    try {
      const saved = JSON.parse(store.get('loom:client') || 'null');
      if (typeof saved === 'string' && saved) return saved;
    } catch { /* first visit */ }
    const id = win.crypto.randomUUID();
    store.set('loom:client', JSON.stringify(id));
    return id;
  }

  async function answer(id, body) {
    const ask = asks[index];
    if (!ask || !loaded || sending || uncertain.has(ask.link)) return;
    const from = identity();
    if (!from) { disarm(); return; }
    // Same public-answer interaction and payload as For You's gateCard; ?for= is read-only identity.
    const binding = JSON.stringify({ id, to: ask.link, from });
    if (armed !== binding) {
      disarm();
      armed = binding;
      $(id).textContent = 'Tap again to post';
      $('yes-state').textContent = `Tap again to post “${body}” publicly as ${from.name} in ${ask.label || ask.address}.`;
      timer = win.setTimeout(() => { disarm(); $('yes-state').textContent = ''; }, 6000);
      return;
    }
    disarm();
    sending = true;
    controls();
    $('yes-state').textContent = 'Sending your answer…';
    try {
      const response = await request('/api/loom', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000),
        body: JSON.stringify({ clientId: clientId(), to: ask.link, from, kind: 'answer', body }),
      });
      if (!response.ok) throw Object.assign(new Error('Answer refused'), { refused: response.status < 500 });
      const result = await response.json();
      if (result?.ok === false) throw Object.assign(new Error('Answer refused'), { refused: true });
      if (result?.ok !== true || !result.message?.id || result.message.parent !== ask.id) throw new Error('Unconfirmed answer');
      store.set('loom.name', from.name);
      store.set('loom.akind', from.kind);
      answered.add(ask.link);
      asks = asks.filter(item => item.link !== ask.link);
      sending = false;
      await show({ focus: true });
      if (asks.length) $('yes-state').textContent = `You replied “${body}” publicly.`;
    } catch (error) {
      if (!error.refused) uncertain.add(ask.link);
      $('yes-state').textContent = error.refused ? 'Could not post. Your ask is still here; try again.'
        : 'It may have posted. Open Reply to check the thread before trying again.';
    } finally {
      sending = false;
      controls();
    }
  }

  $('yes-back').addEventListener('click', () => { if (!sending && index > 0) { index--; show({ focus: true }); } });
  $('yes-next').addEventListener('click', () => { if (!sending && index < asks.length - 1) { index++; show({ focus: true }); } });
  $('yes-approve').addEventListener('click', () => answer('yes-approve', 'Yes, go ahead'));
  $('yes-hold').addEventListener('click', () => answer('yes-hold', 'No, hold'));
  $('yes-reply').addEventListener('click', () => {
    if (!sending && asks[index]) navigate('/loom?to=' + encodeURIComponent(asks[index].link) + '&compose=1');
  });
  $('yes-retry').addEventListener('click', () => asks.length ? show() : load());
  return { ready: load() };
}
