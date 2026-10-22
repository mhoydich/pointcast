/**
 * Quiet bell for /grok. Audio starts only from the button gesture.
 * The shared tally is GET/POST /api/grok/prayer. If that store does not
 * answer, the visible count stays in localStorage on this browser.
 */

export const LOCAL_TOTAL_KEY = 'pc-grok-prayer-total';
export const LOCAL_SESSION_KEY = 'pc-grok-prayer-sid';
const COOL_MS = 1200;

const PARTIALS = [
  { freq: 523.25, gain: 0.7 },
  { freq: 784, gain: 0.38 },
  { freq: 1046.5, gain: 0.16 },
];

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

function readLocal(storage) {
  const n = Number(storage?.getItem?.(LOCAL_TOTAL_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function writeLocal(storage, total) {
  try {
    storage?.setItem?.(LOCAL_TOTAL_KEY, String(total));
  } catch {
    /* private mode can refuse the write; the number still shows */
  }
}

function sessionId(storage) {
  let id = storage?.getItem?.(LOCAL_SESSION_KEY) || '';
  if (!id) {
    const cryptoApi = globalThis.crypto;
    id = cryptoApi?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    id = String(id).slice(0, 128);
    try {
      storage?.setItem?.(LOCAL_SESSION_KEY, id);
    } catch {
      /* still send this id for the request */
    }
  }
  return id;
}

function paintDigits(root, value) {
  if (!root) return;
  const text = String(value);
  root.replaceChildren();
  root.setAttribute('aria-label', text);
  for (const ch of text) {
    const span = root.ownerDocument.createElement('span');
    span.className = 'digit';
    span.textContent = ch;
    root.append(span);
  }
}

/**
 * @param {Document} doc
 * @param {{ fetchImpl?: typeof fetch, storage?: Storage, AudioContext?: typeof AudioContext, reducedMotion?: boolean, coolMs?: number }} [deps]
 */
export function wireCourtPrayer(doc, deps = {}) {
  const button = doc.getElementById('pray-button');
  const root = doc.getElementById('court-prayer');
  if (!button || !root) return;

  const fetchImpl = deps.fetchImpl || globalThis.fetch.bind(globalThis);
  const storage = deps.storage || globalThis.localStorage;
  const AudioCtx = deps.AudioContext || globalThis.AudioContext || globalThis.webkitAudioContext;
  const coolMs = deps.coolMs ?? COOL_MS;
  const note = doc.getElementById('pray-note');
  const status = doc.getElementById('pray-status');
  const digits = doc.getElementById('pray-digits');

  let ctx = null;
  let shown = readLocal(storage);
  let mode = 'reading';
  let busy = false;
  let generation = 0;

  const setNote = (text) => {
    if (note) note.textContent = text;
  };
  const setStatus = (text) => {
    if (status) status.textContent = text;
  };
  const paint = (n) => {
    shown = n;
    paintDigits(digits, n);
  };

  const motionOk = () => {
    if (typeof deps.reducedMotion === 'boolean') return !deps.reducedMotion;
    return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  };

  paint(shown);
  setNote('Reading the shared tally…');

  async function ring() {
    try {
      if (!AudioCtx) throw new Error('no-audio');
      if (!ctx || ctx.state === 'closed') ctx = new AudioCtx();
      if (ctx.state !== 'running' && typeof ctx.resume === 'function') await ctx.resume();
      if (ctx.state && ctx.state !== 'running') throw new Error('not-running');
      playCourtBell(ctx);
      return true;
    } catch {
      return false;
    }
  }

  function light() {
    root.classList.add('is-lit');
    if (motionOk()) root.classList.add('is-rising');
    else root.classList.remove('is-rising');
    globalThis.setTimeout(() => {
      root.classList.remove('is-lit', 'is-rising');
    }, 1700);
  }

  async function sync() {
    const ticket = generation;
    try {
      const res = await fetchImpl('/api/grok/prayer', { cache: 'no-store', headers: { accept: 'application/json' } });
      const data = await res.json();
      if (ticket !== generation) return;
      if (!res.ok || !data?.ok || !Number.isFinite(Number(data.total))) throw new Error(data?.reason || res.status);
      paint(Math.floor(Number(data.total)));
      writeLocal(storage, shown);
      mode = 'shared';
      setNote('Shared tally at /api/grok/prayer, in the same store as the drum count. It does not reset.');
    } catch {
      if (ticket !== generation) return;
      mode = 'local';
      paint(readLocal(storage));
      setNote('Kept on this browser. The shared tally did not answer.');
    }
  }

  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    generation += 1;
    button.disabled = true;
    light();
    const heard = await ring();
    const before = shown;
    paint(shown + 1);
    try {
      const res = await fetchImpl('/api/grok/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sessionId: sessionId(storage) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && Number.isFinite(Number(data.total))) {
        paint(Math.floor(Number(data.total)));
        writeLocal(storage, shown);
        mode = 'shared';
        setNote('Shared tally at /api/grok/prayer, in the same store as the drum count. It does not reset.');
        setStatus(heard ? 'A prayer, and a small bell.' : 'A prayer. The tone did not start.');
      } else if (res.status === 429) {
        paint(Number.isFinite(Number(data.total)) ? Math.floor(Number(data.total)) : before);
        writeLocal(storage, shown);
        setStatus('The bell is still ringing. Wait a moment.');
      } else {
        writeLocal(storage, shown);
        mode = 'local';
        setNote('Kept on this browser. The shared tally did not take this prayer.');
        setStatus(heard ? 'A prayer on this browser, and a small bell.' : 'A prayer on this browser. The tone did not start.');
      }
    } catch {
      writeLocal(storage, shown);
      mode = 'local';
      setNote('Kept on this browser. The shared tally did not answer.');
      setStatus(heard ? 'A prayer on this browser, and a small bell.' : 'A prayer on this browser. The tone did not start.');
    } finally {
      globalThis.setTimeout(() => {
        busy = false;
        button.disabled = false;
      }, coolMs);
    }
  });

  sync();
  return { mode: () => mode };
}
