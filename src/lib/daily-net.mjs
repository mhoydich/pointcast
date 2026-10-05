/**
 * daily-net.mjs — the browser side of DailyNetPanel.astro and /chain/net:
 * the PointCast devnet's Daily Net (bot duties and witness keys) read live
 * from GET {devnet}/net.
 *
 * Plain JS with no imports, so node --test can run it against hostile data in
 * jsdom (tests/chain-daily-net.test.mjs).
 *
 * Rules:
 * - Everything /net returns is written by bots and keys anyone can make. Names,
 *   notes and addresses go into the page with textContent only, after control
 *   and bidi characters are stripped; names must be in the Daily Net's own
 *   alphabet ([a-z0-9-]{2,24}) and addresses must look like addresses, else
 *   they are not shown. Nothing read from the devnet becomes markup, an href,
 *   a src or a style value.
 * - A witness is a claim, not proof of replay; counts are keys, not people.
 *   Nothing here says a replay happened.
 * - Reads happen in the visitor's browser after the load event and an idle
 *   callback, only while the root is near the viewport and the tab is
 *   visible, and at most once every REFRESH_MS.
 * - Importing this module touches no network and no DOM.
 *
 * Shapes: pointcast-chain Daily Net spec §7 (GET /net, schema
 * pointcast-devnet/net-api/v1). Until the devnet serves /net, it answers 404
 * and the page says the Daily Net is not on the devnet yet.
 */

export const REFRESH_MS = 60_000;
export const TIMEOUT_MS = 8_000;
export const MAX_BODY_CHARS = 512 * 1024;
export const NET_API_SCHEMA = 'pointcast-devnet/net-api/v1';
export const COUNT_KEYS = Object.freeze([
  ['participants', 'in', 'in'],
  ['checkins', 'check-in', 'check-ins'],
  ['witnesses', 'witness key', 'witness keys'],
  ['attestations', 'attestation', 'attestations'],
  ['reviews', 'review', 'reviews'],
  ['flags', 'flag', 'flags'],
  ['observes', 'observe', 'observes'],
  ['crosschecks', 'cross-check', 'cross-checks'],
  ['inconsistent', 'inconsistent', 'inconsistent'],
  ['digests', 'digest', 'digests'],
  ['signals', 'signal', 'signals'],
  ['strikes', 'strike', 'strikes'],
]);
export const STRIKE_COPY = 'signed a checkpoint this chain does not have: a wrong replay, or it was shown a different chain.';

// Tezos implicit + originated accounts and pointcast-chain agent / passkey
// accounts, written as character classes so this source carries no address
// prefix of its own.
const ADDRESS_RE = /^(?:tz[1-4]|KT1|pc[ap]1)[1-9A-HJ-NP-Za-km-z]{20,60}$/;
const ADDRESS_ANY_RE = /(?:tz[1-4]|KT1|pc[ap]1)[1-9A-HJ-NP-Za-km-z]{20,}/g;
const INVISIBLE_RE = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200c\u200e\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g;
const NAME_RE = /^[a-z0-9-]{2,24}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;
const DAY_RE = /^\d{4}-\d\d-\d\d$/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const nat = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);
const natOrNull = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : null);

/** Hostile string → one safe line of at most `max` code points; addresses inside are masked. Non-strings → ''. */
export function cleanText(value, max = 140) {
  if (typeof value !== 'string') return '';
  const flat = value.slice(0, 2000).replace(INVISIBLE_RE, ' ').replace(ADDRESS_ANY_RE, '[address]').replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  return chars.length <= max ? flat : `${chars.slice(0, Math.max(1, max - 1)).join('').trimEnd()}…`;
}
/** An address shortened for display (tz1RGA…KZoz), or '' when it does not look like one. */
export function shortAddr(v) {
  if (typeof v !== 'string' || !ADDRESS_RE.test(v)) return '';
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}
export const netName = (v) => (typeof v === 'string' && NAME_RE.test(v) ? v : '');
const hex = (v) => (typeof v === 'string' && HEX64_RE.test(v) ? v : '');
const hex12 = (v) => (hex(v) ? v.slice(0, 12) : '');
const fmt = (n) => nat(n).toLocaleString('en-US');

function author(o) {
  const custody = o.custody === 'custodial' ? 'custodial' : o.custody === 'own_key' ? 'own_key' : '';
  const tier = o.tier === 'witness' ? 'witness' : o.tier === 'checkin' ? 'checkin' : '';
  return { addr: shortAddr(o.addr), name: netName(o.name) || netName(o.bot), nameBound: o.name_bound === true, custody, tier };
}

/**
 * GET /net → what the panel and the page draw. Throws on anything that is not
 * the devnet's Daily Net reply, so the caller shows its fallback.
 */
export function readNet(json, opts = {}) {
  if (!isObj(json)) throw new Error('daily net: unexpected shape');
  if (json.schema !== NET_API_SCHEMA) throw new Error('daily net: unexpected schema');
  if (json.network !== 'devnet') throw new Error('daily net: not a devnet');
  if (typeof json.day !== 'string' || !DAY_RE.test(json.day)) throw new Error('daily net: no day');
  const { rollMax = 200 } = opts;
  const c = isObj(json.counts) ? json.counts : {};
  const counts = Object.fromEntries(COUNT_KEYS.map(([k]) => [k, nat(c[k])]));
  const roll = arr(json.roll).filter(isObj).slice(0, Math.min(200, rollMax)).map((o) => ({
    ...author(o),
    checkedIn: o.checked_in === true,
    note: cleanText(o.note, 140),
    duties: Math.min(3, nat(o.duties)),
    attestations: nat(o.attestations),
    streak: nat(o.streak),
    established: o.established === true,
  }));
  const witnesses = arr(json.witnesses).filter(isObj).slice(0, 200).map((o) => ({
    addr: shortAddr(o.addr), name: netName(o.name), nameBound: o.name_bound === true,
    attestations: nat(o.attestations), correct: nat(o.correct), strikes: nat(o.strikes),
  }));
  const strikes = arr(json.strikes).filter(isObj).slice(0, 50).map((o) => ({
    witness: shortAddr(o.witness),
    kind: o.kind === 'mismatch' || o.kind === 'conflict' ? o.kind : '',
    height: natOrNull(o.height),
    claimedRoot: hex12(isObj(o.claimed) ? o.claimed.state_root : ''),
    chainRoot: hex12(isObj(o.chain) ? o.chain.state_root : ''),
    tx: hex12(o.tx),
  })).filter((s) => s.kind && s.height !== null);
  const reports = arr(json.reports).filter(isObj).slice(0, 7).map((o) => ({
    n: natOrNull(o.n), day: typeof o.day === 'string' && DAY_RE.test(o.day) ? o.day : '', height: natOrNull(o.height), tx: hex12(o.tx),
  })).filter((r) => r.n !== null && r.n > 0);
  const m = isObj(json.more) ? json.more : {};
  const cp = isObj(json.checkpoint) ? json.checkpoint : {};
  const latest = isObj(cp.latest) ? cp.latest : {};
  return {
    day: json.day,
    resetsAt: typeof json.resets_at === 'string' && Number.isFinite(Date.parse(json.resets_at)) ? json.resets_at : '',
    tip: natOrNull(json.tip),
    indexed: natOrNull(json.indexed_height),
    epoch: hex12(json.epoch),
    counts,
    roll,
    witnesses,
    strikes,
    reports,
    more: { roll: nat(m.roll), strikes: nat(m.strikes) },
    checkpoint: {
      latest: natOrNull(latest.height),
      day: natOrNull(cp.day_checkpoint),
      latestRoot: hex12(latest.state_root),
    },
  };
}

/** "resets 00:00 UTC · 5:00 PM PDT where you are" (the next UTC midnight in the reader's own time zone). */
export function resetLine(resetsAt, now = new Date(), timeZone) {
  let at = Date.parse(resetsAt || '');
  if (!Number.isFinite(at)) {
    const d = new Date(now);
    at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  }
  let local = '';
  try {
    local = new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', ...(timeZone ? { timeZone } : {}) });
  } catch {
    local = '';
  }
  return local ? `resets 00:00 UTC · ${local} where you are` : 'resets 00:00 UTC';
}

const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
const tierLabel = (t) => (t === 'witness' ? 'witness' : t === 'checkin' ? 'check-in' : '');

/** One roll entry's display parts (name, short address, badges, line), for the panel and the page. */
export function rollParts(e) {
  const name = e.name || 'unnamed key';
  const badges = [];
  if (tierLabel(e.tier)) badges.push([tierLabel(e.tier), e.tier === 'witness' ? 'dn-b dn-b--wit' : 'dn-b']);
  if (e.custody === 'custodial') badges.push(['house bot', 'dn-b dn-b--soft']);
  if (e.name && !e.nameBound && e.custody !== 'custodial') badges.push(['name not bound', 'dn-b dn-b--soft']);
  if (e.established) badges.push(['established', 'dn-b dn-b--est']);
  const bits = [e.checkedIn ? '✓ checked in' : 'not checked in', `${e.duties}/3 duties`];
  if (e.attestations) bits.push(plural(e.attestations, 'attestation', 'attestations'));
  if (e.streak) bits.push(e.custody === 'custodial' ? `${fmt(e.streak)}-day streak of posts under this name` : `${fmt(e.streak)}-day streak`);
  return { name, addr: e.addr, badges, line: bits.join(' · ') };
}

function el(doc, tag, cls, text) {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
const q = (root, hook) => root.querySelector(`[data-dn-${hook}]`);

/**
 * Fill every hook the root carries: day, reset, counts, roll (data-roll-max,
 * notes with data-notes), witnesses, strikes, reports, status. A hook the
 * root does not carry is skipped, so the panel and the page share this.
 */
export function render(root, model, env = {}) {
  const doc = root.ownerDocument;
  const now = env.now instanceof Date ? env.now : new Date();
  const set = (hook, text) => { const n = q(root, hook); if (n) n.textContent = text; };
  set('day', `${model.day} UTC`);
  set('reset', resetLine(model.resetsAt, now, env.timeZone));
  set('status', [
    `day ${model.day}`,
    model.indexed !== null ? `indexed to №${fmt(model.indexed)}` : '',
    model.tip !== null ? `tip №${fmt(model.tip)}` : '',
    model.checkpoint.day !== null ? `day checkpoint №${fmt(model.checkpoint.day)}` : model.checkpoint.latest !== null ? `latest checkpoint №${fmt(model.checkpoint.latest)}` : '',
  ].filter(Boolean).join(' · '));
  set('clock', `read ${now.toISOString().slice(11, 16)} UTC`);

  const counts = q(root, 'counts');
  if (counts) {
    const keys = (counts.dataset.keys || '').split(',').filter(Boolean);
    const shown = COUNT_KEYS.filter(([k]) => !keys.length || keys.includes(k));
    counts.replaceChildren(...shown.map(([k, one, many]) => {
      const li = el(doc, 'li', k === 'strikes' && model.counts[k] ? 'dn-count dn-count--strike' : 'dn-count');
      li.append(el(doc, 'b', '', fmt(model.counts[k])), el(doc, 'span', '', model.counts[k] === 1 ? one : many));
      return li;
    }));
  }

  const roll = q(root, 'roll');
  if (roll) {
    const max = Math.max(1, Number.parseInt(roll.dataset.rollMax || '12', 10) || 12);
    const notes = roll.dataset.notes === 'on';
    const items = model.roll.slice(0, max).map((e) => {
      const p = rollParts(e);
      const li = el(doc, 'li', 'dn-row');
      const head = el(doc, 'p', 'dn-who');
      head.append(el(doc, 'span', 'dn-name', p.name));
      if (p.addr) head.append(el(doc, 'span', 'dn-addr', p.addr));
      head.append(...p.badges.map(([t, c]) => el(doc, 'span', c, t)));
      li.append(head, el(doc, 'p', 'dn-line', p.line));
      if (notes && e.note) li.append(el(doc, 'p', 'dn-note', `“${e.note}”`));
      return li;
    });
    const rest = model.roll.length - items.length + model.more.roll;
    if (rest > 0) items.push(el(doc, 'li', 'dn-more', `+${fmt(rest)} more on the roll`));
    roll.replaceChildren(...(items.length ? items : [el(doc, 'li', 'dn-empty', 'No one has checked in today yet.')]));
  }

  const streaks = q(root, 'streaks');
  if (streaks) {
    const top = model.roll.filter((e) => e.streak >= 2).sort((a, b) => b.streak - a.streak).slice(0, 10);
    streaks.replaceChildren(...(top.length
      ? top.map((e) => {
        const li = el(doc, 'li', 'dn-row');
        const head = el(doc, 'p', 'dn-who');
        head.append(el(doc, 'span', 'dn-name', e.name || 'unnamed key'));
        if (e.addr) head.append(el(doc, 'span', 'dn-addr', e.addr));
        li.append(head, el(doc, 'p', 'dn-line', e.custody === 'custodial'
          ? `${plural(e.streak, 'day', 'days')} of check-ins posted under this name`
          : `${plural(e.streak, 'day', 'days')} running${e.established ? ' · established: agreed with this server 3 days running' : ''}`));
        return li;
      })
      : [el(doc, 'li', 'dn-empty', 'No streaks yet: a streak starts on the second day in a row.')]));
  }

  const wit = q(root, 'witnesses');
  if (wit) {
    const items = model.witnesses.map((w) => {
      const li = el(doc, 'li', 'dn-row');
      const head = el(doc, 'p', 'dn-who');
      head.append(el(doc, 'span', 'dn-name', w.name || 'unnamed key'));
      if (w.addr) head.append(el(doc, 'span', 'dn-addr', w.addr));
      if (w.name && !w.nameBound) head.append(el(doc, 'span', 'dn-b dn-b--soft', 'name not bound'));
      const line = el(doc, 'p', 'dn-line', `${plural(w.attestations, 'attestation', 'attestations')} · ${fmt(w.correct)} agreed with this server · `);
      line.append(el(doc, 'span', w.strikes ? 'dn-strike' : '', plural(w.strikes, 'strike', 'strikes')));
      li.append(head, line);
      return li;
    });
    wit.replaceChildren(...(items.length ? items : [el(doc, 'li', 'dn-empty', 'No witness key has signed a checkpoint today yet.')]));
  }

  const strikes = q(root, 'strikes');
  if (strikes) {
    const items = model.strikes.map((s) => {
      const li = el(doc, 'li', 'dn-row dn-row--strike');
      li.append(
        el(doc, 'p', 'dn-who', `№${fmt(s.height)} · ${s.kind} · ${s.witness || 'a key'}`),
        el(doc, 'p', 'dn-line', s.kind === 'mismatch'
          ? `${STRIKE_COPY}${s.claimedRoot ? ` Claimed root ${s.claimedRoot}…` : ''}${s.chainRoot ? `, chain root ${s.chainRoot}…` : ''}`
          : 'two different claims for one height from the same key or account.'),
      );
      return li;
    });
    if (model.more.strikes) items.push(el(doc, 'li', 'dn-more', `+${fmt(model.more.strikes)} more strikes`));
    strikes.replaceChildren(...(items.length ? items : [el(doc, 'li', 'dn-empty', 'No strikes today.')]));
  }

  const reports = q(root, 'reports');
  if (reports) {
    const items = model.reports.map((r) => el(doc, 'li', 'dn-row', [`Net report #${fmt(r.n)}`, r.day, r.height !== null ? `№${fmt(r.height)}` : '', r.tx ? `tx ${r.tx}…` : ''].filter(Boolean).join(' · ')));
    reports.replaceChildren(...(items.length ? items : [el(doc, 'li', 'dn-empty', 'No net report yet. The first comes after the first full UTC day.')]));
  }
  root.dataset.state = 'live';
  delete root.dataset.stale;
}

/**
 * The devnet did not answer, or answered with something else ('down'), or
 * answered 404 for /net ('pending': the Daily Net is not deployed yet). After
 * a good read, the last read stays on screen and says it is the last read.
 */
export function renderDown(root, why = 'down') {
  const hadData = root.dataset.state === 'live' || root.dataset.stale === 'yes';
  root.dataset.state = why === 'pending' ? 'pending' : 'down';
  if (hadData) root.dataset.stale = 'yes';
  const status = q(root, 'status');
  if (status) {
    status.textContent = why === 'pending'
      ? 'The Daily Net is not on the devnet yet: its /net index answers 404. Duties and witness keys start when it is deployed.'
      : hadData
        ? 'devnet unreachable · showing the last read'
        : 'devnet unreachable. It may be restarting or paused; this tries again in a minute.';
  }
  const clock = q(root, 'clock');
  if (clock) clock.textContent = why === 'pending' ? 'not live yet' : 'devnet unreachable';
}

class HttpError extends Error {
  constructor(status) {
    super(`devnet: HTTP ${status}`);
    this.status = status;
  }
}

async function getJson(fetchImpl, url, win) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = win.setTimeout(() => ctrl?.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: ctrl?.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!res || !res.ok) throw new HttpError(res ? res.status : 0);
    const text = await res.text();
    if (text.length > MAX_BODY_CHARS) throw new Error('devnet: response too large');
    return JSON.parse(text);
  } finally {
    win.clearTimeout(timer);
  }
}

/**
 * Wire one root up. Nothing is fetched here: reads wait for the load event,
 * an idle callback, the root coming within 400px of the viewport and a
 * visible tab, then repeat at most once every REFRESH_MS while all of that
 * stays true. `env` exists for tests.
 */
export function start(root, env = {}) {
  const doc = root.ownerDocument;
  const win = env.window || doc.defaultView;
  const fetchImpl = env.fetch || ((...args) => win.fetch(...args));
  const now = env.now || (() => Date.now());
  const base = String(root.dataset.api || '');
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(base)) return null;

  let near = false;
  let busy = false;
  let last = -Infinity;
  let timer = 0;

  const visible = () => doc.visibilityState !== 'hidden';
  const idle = (fn) =>
    typeof win.requestIdleCallback === 'function' ? win.requestIdleCallback(fn, { timeout: 4000 }) : win.setTimeout(fn, 1200);
  const later = (ms) => {
    win.clearTimeout(timer);
    timer = win.setTimeout(() => idle(tick), ms);
  };

  async function tick() {
    if (!near || !visible() || busy) return;
    const wait = last + REFRESH_MS - now();
    if (wait > 0) {
      later(wait);
      return;
    }
    busy = true;
    try {
      const json = await getJson(fetchImpl, `${base}/net`, win);
      render(root, readNet(json), { now: new Date(now()), timeZone: env.timeZone });
    } catch (e) {
      renderDown(root, e instanceof HttpError && e.status === 404 ? 'pending' : 'down');
    } finally {
      busy = false;
      last = now();
      later(REFRESH_MS);
    }
  }

  const begin = () => {
    if (typeof win.IntersectionObserver === 'function') {
      const io = new win.IntersectionObserver(
        (entries) => {
          near = entries.some((e) => e.isIntersecting);
          if (near) idle(tick);
        },
        { rootMargin: '400px 0px' },
      );
      io.observe(root);
    } else {
      near = true;
      idle(tick);
    }
    doc.addEventListener('visibilitychange', () => {
      if (visible() && near) idle(tick);
    });
  };
  if (doc.readyState === 'complete') begin();
  else win.addEventListener('load', begin, { once: true });

  return { tick };
}
