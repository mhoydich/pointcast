const POINTCAST = 'https://pointcast.xyz';
const OWNER = '@mike';
const REPLY_ADDRESS = /^loom:([a-f0-9]{24})#(m_[0-9a-z]{6,24})$/;
const REFRESH_MS = 60_000;
const POSTING_NAME_KEY = 'loom.phone.name';
const UNCERTAIN_REPLY = 'Posting could not be confirmed. Check the original thread before reloading to try again.';

export function callEnvironment(origin) {
  const { hostname, protocol } = new URL(origin);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  const live = protocol === 'https:' && ['pointcast.xyz', 'www.pointcast.xyz'].includes(hostname);
  return local || live
    ? { endpoint: '/api/loom', canPost: true }
    : { endpoint: `${POINTCAST}/api/loom`, canPost: false };
}

function threadUrl(address) {
  return `${POINTCAST}/loom?to=${encodeURIComponent(address)}`;
}

export async function readCallAsks(endpoint, fetcher = fetch) {
  const response = await fetcher(`${endpoint}?for=mike&format=json`, {
    credentials: 'omit',
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error('Loom read failed');
  const feed = await response.json();
  if (feed?.ok !== true || feed.owner !== OWNER || !Array.isArray(feed.piles?.needsYes)) {
    throw new Error('Invalid Loom feed');
  }
  const asks = new Map();
  for (const item of feed.piles.needsYes) {
    if (!REPLY_ADDRESS.test(item?.link ?? '') || typeof item.snippet !== 'string' || !item.snippet.trim()) {
      throw new Error('Invalid Loom ask');
    }
    if (!asks.has(item.link)) {
      asks.set(item.link, {
        target: item.link,
        text: item.snippet,
        source: [item.from?.name, item.label].filter((part) => typeof part === 'string' && part).join(' · '),
        url: threadUrl(item.link),
      });
    }
  }
  return Array.from(asks.values());
}

export async function postCallAnswer(environment, { target, name, body }, fetcher = fetch) {
  if (!environment.canPost) throw new Error('Preview is read-only');
  const destination = REPLY_ADDRESS.exec(target);
  name = name.trim();
  body = body.trim();
  if (!destination || !name || name.length > 40 || /^collator$/i.test(name) || !body || body.length > 500) {
    throw new Error('Invalid Loom answer');
  }

  const response = await fetcher(environment.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    signal: AbortSignal.timeout(12_000),
    body: JSON.stringify({ to: target, from: { name, kind: 'human' }, kind: 'answer', body }),
  });
  if (!response.ok) throw Object.assign(new Error('Loom refused the reply'), { status: response.status });
  const result = await response.json();
  const receipt = REPLY_ADDRESS.exec(result?.address ?? '');
  if (result?.ok !== true || receipt?.[1] !== destination[1] || result.message?.parent !== destination[2]
      || result.message?.id !== receipt[2] || receipt[2] === destination[2]) {
    throw new Error('Unconfirmed Loom answer');
  }
  return threadUrl(result.address);
}

function runCompanion(document) {
  const environment = callEnvironment(document.location.origin);
  const asksList = document.querySelector('#asks');
  const template = document.querySelector('#ask-card');
  const queueStatus = document.querySelector('#queue-status');
  const refreshButton = document.querySelector('#refresh');
  const name = document.querySelector('#posting-name');
  const cards = new Map();
  const receipts = new Map();
  const uncertain = new Set();
  let lastQueue;
  let refreshing = false;
  let current = false;
  let posting = false;

  document.querySelector('#posting').hidden = !environment.canPost;
  document.querySelector('#read-only').hidden = environment.canPost;
  if (environment.canPost) {
    try {
      const previous = localStorage.getItem(POSTING_NAME_KEY);
      const loomName = localStorage.getItem('loom.akind') !== 'agent' ? localStorage.getItem('loom.name') : '';
      name.value = (previous || loomName || '').slice(0, 40);
    } catch { /* storage may be unavailable in private mode */ }
  }
  name.addEventListener('input', () => name.setCustomValidity(''));

  function syncControls() {
    for (const [target, card] of cards) {
      for (const button of card.querySelectorAll('button')) {
        button.disabled = !current || refreshing || posting || uncertain.has(target);
      }
    }
  }

  async function send(ask, card, body) {
    if (!current || refreshing || posting || receipts.has(ask.target) || uncertain.has(ask.target)) return;
    const from = name.value.trim();
    name.setCustomValidity(!from || /^collator$/i.test(from) ? 'Enter your Loom posting name.' : '');
    if (!name.reportValidity() || !body.trim()) return;
    try { localStorage.setItem(POSTING_NAME_KEY, from); } catch { /* Storage is optional. */ }

    const status = card.querySelector('.reply-status');
    posting = true;
    syncControls();
    status.textContent = 'Posting…';
    try {
      const receipt = await postCallAnswer(environment, { target: ask.target, name: from, body });
      receipts.set(ask.target, receipt);
      showReceipt(card, receipt);
      status.focus();
    } catch (error) {
      if (!error.status || error.status === 408 || error.status >= 500) {
        uncertain.add(ask.target);
        status.textContent = UNCERTAIN_REPLY;
      } else {
        status.textContent = error.status === 429
          ? 'Loom is rate limiting replies. Try again in a moment.'
          : 'Loom refused the reply. Check the original thread.';
      }
      status.focus();
    } finally {
      posting = false;
      syncControls();
    }
  }

  function showReceipt(card, receipt) {
    card.querySelector('.answer-controls').hidden = true;
    const link = document.createElement('a');
    link.href = receipt;
    link.textContent = 'View posted reply ↗';
    card.querySelector('.reply-status').replaceChildren('Loom accepted your reply. ', link);
  }

  function renderAsks(asks) {
    const active = new Set(asks.map((ask) => ask.target));
    for (const [target, card] of cards) {
      if (!active.has(target)) {
        card.remove();
        cards.delete(target);
      }
    }
    let previous = null;
    for (const ask of asks) {
      let card = cards.get(ask.target);
      if (!card) {
        card = template.content.firstElementChild.cloneNode(true);
        const form = card.querySelector('form');
        card.querySelector('.answer-controls').hidden = !environment.canPost;
        for (const button of card.querySelectorAll('[data-answer]')) {
          button.addEventListener('click', () => send(ask, card, button.dataset.answer));
        }
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          send(ask, card, form.querySelector('textarea').value);
        });
        cards.set(ask.target, card);
        if (receipts.has(ask.target)) showReceipt(card, receipts.get(ask.target));
        if (uncertain.has(ask.target)) card.querySelector('.reply-status').textContent = UNCERTAIN_REPLY;
      }
      card.querySelector('.ask-source').textContent = ask.source;
      card.querySelector('.ask-text').textContent = ask.text;
      card.querySelector('.thread').href = ask.url;
      if (card !== (previous ? previous.nextElementSibling : asksList.firstElementChild)) {
        asksList.insertBefore(card, previous ? previous.nextElementSibling : asksList.firstElementChild);
      }
      previous = card;
    }
  }

  async function refresh(manual = false) {
    if (refreshing || posting) return;
    refreshing = true;
    refreshButton.disabled = true;
    if (manual) queueStatus.textContent = 'Reading decision asks… This can take up to 12 seconds.';
    syncControls();
    try {
      const asks = await readCallAsks(environment.endpoint);
      const nextQueue = JSON.stringify(asks);
      const changed = lastQueue !== nextQueue;
      if (changed) renderAsks(asks);
      if (changed || manual || !current) {
        const summary = asks.length === 0
          ? 'No decision asks for Mike right now. Other messages may still be waiting in the full inbox.'
          : `${asks.length} decision ${asks.length === 1 ? 'ask' : 'asks'} for Mike.`;
        const update = lastQueue !== undefined && changed ? 'Decision list updated. ' : '';
        queueStatus.textContent = update + summary;
      }
      lastQueue = nextQueue;
      current = true;
    } catch {
      current = false;
      const error = cards.size
        ? 'Could not refresh the Loom. These asks may be out of date.'
        : 'Could not read the Loom. Try refreshing.';
      if (queueStatus.textContent !== error) queueStatus.textContent = error;
    } finally {
      refreshButton.disabled = false;
      refreshing = false;
      syncControls();
    }
  }

  refreshButton.addEventListener('click', () => refresh(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
  refresh();
}

if (typeof document !== 'undefined') runCompanion(document);
