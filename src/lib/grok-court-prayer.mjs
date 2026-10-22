/**
 * Quiet bell for /grok. Audio starts only after a tap, and only if sound is on.
 * Each offer has its own id. The browser keeps ids the server has not accepted
 * yet in a separate book, so a lost response is retried instead of counted twice
 * and a later tally does not wipe a prayer that is still waiting.
 */

export const BOOK_KEY = 'pc-grok-prayer-book';
export const SOUND_KEY = 'pc-grok-prayer-sound';
export const COOL_MS = 5000;
const AUDIO_WAIT_MS = 700;
const FETCH_WAIT_MS = 4000;
const ID_RE = /^[a-zA-Z0-9-]{8,80}$/;

const PARTIALS = [
  { freq: 523.25, gain: 0.7 },
  { freq: 784, gain: 0.38 },
  { freq: 1046.5, gain: 0.16 },
];

const LOCAL_NOTE = 'Kept on this browser until the shared tally answers.';
const D1_NOTE = 'A shared tally. It does not reset.';
const KV_NOTE = 'A shared tally. This number can lag if two prayers land together.';

export function playCourtBell(ctx) {
  const now = ctx.currentTime || 0;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
  master.connect(ctx.destination);
  for (const partial of PARTIALS) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(partial.freq, now);
    gain.gain.setValueAtTime(partial.gain, now);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 1.7);
  }
  return { duration: 1.7 };
}

export function safeStorage(storage) {
  const memory = new Map();
  const broken = new Set();
  return {
    getItem(key) {
      if (!broken.has(key)) {
        try {
          if (storage && typeof storage.getItem === 'function') {
            const value = storage.getItem(key);
            if (value != null) return value;
          }
        } catch {
          broken.add(key);
        }
      }
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      const text = String(value);
      memory.set(key, text);
      if (broken.has(key)) return;
      try {
        storage?.setItem?.(key, text);
      } catch {
        broken.add(key);
      }
    },
  };
}

function newId() {
  const id = globalThis.crypto?.randomUUID?.();
  if (typeof id === 'string' && ID_RE.test(id)) return id;
  const fallback = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return fallback.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80);
}

function readBook(storage) {
  try {
    const data = JSON.parse(storage.getItem(BOOK_KEY) || 'null');
    const serverNum = Number(data?.server);
    const server = Number.isFinite(serverNum) && serverNum >= 0 ? Math.floor(serverNum) : null;
    const pending = Array.isArray(data?.pending) ? data.pending.filter((id) => typeof id === 'string' && ID_RE.test(id)) : [];
    return { server, pending };
  } catch {
    return { server: null, pending: [] };
  }
}

function paintDigits(root, value) {
  if (!root) return;
  root.replaceChildren();
  for (const ch of String(value)) {
    const span = root.ownerDocument.createElement('span');
    span.className = 'digit';
    span.textContent = ch;
    root.append(span);
  }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * @param {Document} doc
 * @param {{ fetchImpl?: typeof fetch, storage?: Storage, AudioContext?: typeof AudioContext | null, reducedMotion?: boolean, coolMs?: number, audioWaitMs?: number, fetchWaitMs?: number, now?: () => number }} [deps]
 */
export function wireCourtPrayer(doc, deps = {}) {
  try {
    return startCourtPrayer(doc, deps);
  } catch {
    return { mode: () => 'off', sync: async () => {} };
  }
}

function startCourtPrayer(doc, deps) {
  const button = doc.getElementById('pray-button');
  const root = doc.getElementById('court-prayer');
  if (!button || !root) return { mode: () => 'off', sync: async () => {} };

  const fetchImpl = deps.fetchImpl || globalThis.fetch.bind(globalThis);
  const storage = safeStorage(deps.storage || doc.defaultView?.localStorage || globalThis.localStorage);
  const AudioCtx = deps.AudioContext === undefined
    ? (globalThis.AudioContext || globalThis.webkitAudioContext)
    : deps.AudioContext;
  const coolMs = deps.coolMs ?? COOL_MS;
  const audioWaitMs = deps.audioWaitMs ?? AUDIO_WAIT_MS;
  const fetchWaitMs = deps.fetchWaitMs ?? FETCH_WAIT_MS;
  const nowFn = deps.now || (() => Date.now());
  const note = doc.getElementById('pray-note');
  const live = doc.getElementById('pray-live');
  const digits = doc.getElementById('pray-digits');
  const soundBtn = doc.getElementById('pray-sound');

  let ctx = null;
  let book = readBook(storage);
  let mode = 'reading';
  let busy = false;
  let generation = 0;
  let quietUntil = 0;

  const setNote = (text) => {
    if (note && note.textContent !== text) note.textContent = text;
  };
  const setLive = (text) => {
    if (live && live.textContent !== text) live.textContent = text;
  };
  const shown = () => (book.server ?? 0) + book.pending.length;
  const paint = () => paintDigits(digits, shown());
  const writeBook = () => {
    storage.setItem(BOOK_KEY, JSON.stringify({ server: book.server, pending: book.pending }));
  };
  const soundEnabled = () => (soundBtn ? soundBtn.getAttribute('aria-pressed') !== 'false' : storage.getItem(SOUND_KEY) !== 'off');

  const motionOk = () => {
    if (typeof deps.reducedMotion === 'boolean') return !deps.reducedMotion;
    return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  };

  function sharedNote(outcome) {
    if (book.pending.length) return LOCAL_NOTE;
    if (outcome?.approximate || outcome?.storage === 'kv') return KV_NOTE;
    return D1_NOTE;
  }

  function hold(ms) {
    quietUntil = Math.max(quietUntil, nowFn() + ms);
  }

  function light() {
    root.classList.add('is-lit');
    if (motionOk()) root.classList.add('is-rising');
    else root.classList.remove('is-rising');
    globalThis.setTimeout(() => {
      root.classList.remove('is-lit', 'is-rising');
    }, 1700);
  }

  async function ring() {
    if (!soundEnabled()) return false;
    try {
      if (!AudioCtx) return false;
      if (!ctx || ctx.state === 'closed') ctx = new AudioCtx();
      if (ctx.state !== 'running' && typeof ctx.resume === 'function') {
        await Promise.race([
          Promise.resolve(ctx.resume()).catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, audioWaitMs)),
        ]);
      }
      if (ctx.state && ctx.state !== 'running') return false;
      playCourtBell(ctx);
      return true;
    } catch {
      return false;
    }
  }

  function classify(res, data) {
    const total = Number(data?.total);
    const parsed = Number.isFinite(total) ? Math.floor(total) : null;
    if (res?.status === 429) {
      return {
        kind: 'limited',
        total: parsed,
        retryAfterSec: Math.max(1, Number(data?.retryAfterSec) || 1),
        storage: data?.storage,
        approximate: Boolean(data?.approximate),
      };
    }
    if (res?.ok && data?.ok && parsed != null) {
      return {
        kind: data.duplicate ? 'duplicate' : 'new',
        total: parsed,
        storage: data.storage,
        approximate: Boolean(data.approximate),
      };
    }
    return { kind: 'local' };
  }

  async function postOffer(id) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), fetchWaitMs);
    const work = (async () => {
      const res = await fetchImpl('/api/grok/prayer', {
        method: 'POST',
        cache: 'no-store',
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      return classify(res, data);
    })();
    work.catch(() => {});
    try {
      return await withTimeout(work, fetchWaitMs);
    } catch {
      return { kind: 'local' };
    } finally {
      clearTimeout(timer);
    }
  }

  function settle(id, outcome, replay) {
    if (outcome.kind === 'new' || outcome.kind === 'duplicate') {
      book.pending = book.pending.filter((item) => item !== id);
      if (outcome.total != null) book.server = outcome.total;
      if (!replay) hold(coolMs);
      writeBook();
      paint();
      mode = book.pending.length ? 'local' : 'shared';
      setNote(sharedNote(outcome));
      return outcome.kind;
    }
    if (outcome.kind === 'limited') {
      hold((outcome.retryAfterSec || 1) * 1000);
      if (!replay) {
        book.pending = book.pending.filter((item) => item !== id);
        if (outcome.total != null) book.server = outcome.total;
        writeBook();
        paint();
        mode = book.pending.length ? 'local' : 'shared';
        setNote(sharedNote(outcome));
        setLive('Wait a moment.');
      }
      return 'limited';
    }
    if (!replay) hold(coolMs);
    writeBook();
    paint();
    mode = 'local';
    setNote(LOCAL_NOTE);
    return 'local';
  }

  function announce(kind, heard) {
    const n = shown();
    if (kind === 'duplicate' || !soundEnabled()) setLive(`${n} prayers offered.`);
    else if (heard) setLive(`${n} prayers offered. A small bell.`);
    else setLive(`${n} prayers offered. The tone did not start.`);
  }

  async function sync() {
    const ticket = generation;
    try {
      const res = await fetchImpl('/api/grok/prayer', { cache: 'no-store', headers: { accept: 'application/json' } });
      const data = await res.json();
      if (ticket !== generation) return;
      if (!res.ok || !data?.ok || !Number.isFinite(Number(data.total))) throw new Error('tally');
      book.server = Math.floor(Number(data.total));
      let latest = { storage: data.storage, approximate: Boolean(data.approximate) };
      for (const id of [...book.pending]) {
        if (ticket !== generation) return;
        const outcome = await postOffer(id);
        if (ticket !== generation) return;
        const kind = settle(id, outcome, true);
        if (kind === 'new' || kind === 'duplicate') latest = outcome;
        else break;
      }
      if (ticket !== generation) return;
      writeBook();
      paint();
      mode = book.pending.length ? 'local' : 'shared';
      setNote(sharedNote(latest));
      if (!live?.textContent && shown() > 0) setLive(`${shown()} prayers offered.`);
    } catch {
      if (ticket !== generation) return;
      mode = 'local';
      paint();
      setNote(LOCAL_NOTE);
      if (!live?.textContent && shown() > 0) setLive(`${shown()} prayers offered.`);
    }
  }

  async function onClick() {
    if (busy || button.getAttribute('aria-disabled') === 'true') return;
    if (nowFn() < quietUntil) {
      setLive('Wait a moment.');
      return;
    }
    busy = true;
    generation += 1;
    button.setAttribute('aria-disabled', 'true');
    const id = newId();
    book.pending.push(id);
    writeBook();
    paint();
    light();
    try {
      const outcome = await postOffer(id);
      const kind = settle(id, outcome, false);
      if (kind === 'limited') return;
      const heard = kind === 'new' || kind === 'local' ? await ring() : false;
      announce(kind, heard);
    } catch {
      settle(id, { kind: 'local' }, false);
      announce('local', false);
    } finally {
      busy = false;
      button.removeAttribute('aria-disabled');
    }
  }

  if (soundBtn) {
    const on = storage.getItem(SOUND_KEY) !== 'off';
    soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    soundBtn.textContent = on ? 'Sound on' : 'Sound off';
    soundBtn.addEventListener('click', () => {
      const next = soundBtn.getAttribute('aria-pressed') === 'false';
      soundBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
      soundBtn.textContent = next ? 'Sound on' : 'Sound off';
      storage.setItem(SOUND_KEY, next ? 'on' : 'off');
    });
  }

  paint();
  setNote('Reading the shared tally…');
  button.addEventListener('click', () => {
    onClick().catch(() => {
      busy = false;
      button.removeAttribute('aria-disabled');
    });
  });
  sync().catch(() => {});
  return { mode: () => mode, sync };
}
