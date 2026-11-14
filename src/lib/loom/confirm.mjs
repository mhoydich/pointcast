/** OFF-52: immutable low-risk cards. D1, not KV, arbitrates the first answer. */
import { AddressError, extractAddresses } from './address.mjs';
import { normHandle } from './for-you.mjs';

export class ConfirmStoreError extends Error {}

export const UNVERIFIED = 'Unverified: names are self-declared. This answer is a relay, not execution approval. Minting, sending, signing, spending, publishing and deployment stay in the desk’s own chat.';
const ACTION_TYPES = Object.freeze({
  start_draft: 'Start a draft only',
  choose_option: 'Choose an option only',
  claim_task: 'Claim a task only',
});
function actionFields(raw) {
  if (!raw || typeof raw.actionType !== 'string' || !Object.hasOwn(ACTION_TYPES, raw.actionType)) throw new AddressError('confirm_action_type_not_supported');
  if (raw.amount !== undefined) throw new AddressError('confirm_amount_not_allowed');
  if (typeof raw.subject !== 'string' || !raw.subject.trim() || raw.subject.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw.subject)) throw new AddressError('confirm_subject_required_or_invalid');
  // The server defines the scope. Quoted subject text is context, never a
  // second executable instruction. A sender cannot relabel "mint" as low risk.
  const action = `${ACTION_TYPES[raw.actionType]}: ${JSON.stringify(raw.subject)}`;
  if (action.length > 2000) throw new AddressError('confirm_subject_required_or_invalid');
  if (raw.action !== undefined && raw.action !== action) throw new AddressError('confirm_action_must_match_type_and_subject');
  return { actionType: raw.actionType, subject: raw.subject, action };
}
export function isSupportedConfirm(raw) {
  try { return raw?.risk === 'low' && raw.action === actionFields(raw).action; } catch { return false; }
}
export function validateConfirm(raw, now) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new AddressError('confirm_required');
  if (raw.risk !== 'low') throw new AddressError("Only low risk is accepted; high-risk approvals stay in the desk's own chat.");
  const fields = actionFields(raw);
  const expiry = typeof raw.expiresAt === 'string' ? Date.parse(raw.expiresAt) : NaN;
  if (!Number.isFinite(expiry) || expiry <= Date.parse(now) || expiry > Date.parse(now) + 7 * 86400000) throw new AddressError('confirm_expiresAt_must_be_future_and_within_7_days');
  return { ...fields, risk: 'low', expiresAt: new Date(expiry).toISOString(), revision: 1 };
}
export function answerValue(text) {
  if (typeof text !== 'string') return null;
  if (text === 'yes' || text === 'no') return text;
  // Exact command token, not "changed", "changes" or "change my mind".
  // Preserve every character of a change request, including subsequent lines.
  return /^(?:change(?=\r?\n|$)|change:)/.test(text) ? text : null;
}
const decode = (row) => {
  if (!row) return null;
  const message = JSON.parse(row.message);
  return { ...message, confirmBlocked: !isSupportedConfirm(message.confirm), answer: row.answer ? JSON.parse(row.answer) : null };
};
export const cardItem = (row) => {
  const m = decode(row);
  return { ...m, address: row.address, key: row.log_key, label: row.address, link: `loom:${row.log_key}#${m.id}`, url: `https://pointcast.xyz/loom?to=${encodeURIComponent(row.address)}#${m.id}`, snippet: m.confirm.action };
};
export function confirmStore(db) {
  if (!db) return null;
  // Scan by a stable key before applying the supported-card limit. Old,
  // unsupported rows must not crowd valid cards out of either open list.
  const openCards = async (query, bindings, take) => {
    const cards = [];
    let expires = '', id = '';
    while (cards.length < take) {
      const { results } = await db.prepare(query + ' AND (c.expires_at > ? OR (c.expires_at = ? AND c.id > ?)) ORDER BY c.expires_at, c.id LIMIT 101').bind(...bindings, expires, expires, id).all();
      for (const row of results) {
        const card = cardItem(row);
        if (!card.confirmBlocked) cards.push(card);
        if (cards.length === take) return cards;
      }
      if (results.length < 101) break;
      const last = results.at(-1); expires = last.expires_at; id = last.id;
    }
    return cards;
  };
  const store = {
    async create(log, op) {
      const { tokenHash, ...message } = op;
      const recipients = [...new Set([...(log.kind === 'handle' ? [normHandle(log.address)] : []), ...extractAddresses(`${op.body}\n${op.confirm.action}`).mentions.map(normHandle)])];
      await db.batch([
        db.prepare('INSERT INTO loom_confirms (id, log_key, address, desk, expires_at, message, token_hash) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(op.id, log.key, log.address, normHandle(op.from.address || op.from.name), op.confirm.expiresAt, JSON.stringify(message), tokenHash),
        ...recipients.map((name) => db.prepare('INSERT INTO loom_confirm_recipients (card_id, name) VALUES (?, ?)').bind(op.id, name)),
      ]);
    },
    async get(id) { return db.prepare('SELECT * FROM loom_confirms WHERE id = ?').bind(id).first(); },
    async logAddress(key) { return (await db.prepare('SELECT address FROM loom_confirms WHERE log_key = ? LIMIT 1').bind(key).first())?.address ?? null; },
    async hydrate(log) {
      const { results } = await db.prepare('SELECT * FROM loom_confirms WHERE log_key = ?').bind(log.key).all();
      log.confirmAnswers = {};
      log.confirmCursor = 0;
      for (const row of results) {
        const { answer, ...card } = decode(row);
        log.createdAt ??= card.at;
        log.updatedAt ??= card.at;
        log.confirmAnswers[card.id] = answer;
        log.confirmCursor = Math.max(log.confirmCursor, row.answer_seq || 0);
        const op = log.ops.find((o) => o.op === 'append' && o.id === card.id);
        if (op) { op.confirm = card.confirm; op.confirmBlocked = card.confirmBlocked; delete op.answer; op.confirmHidden = !!row.hidden; }
        else log.ops.push({ ...card, tokenHash: row.token_hash, confirmHidden: !!row.hidden });
      }
      log.ops.sort((a, b) => a.seq - b.seq);
      log.seq = Math.max(log.seq, ...log.ops.map((o) => o.seq));
      return log;
    },
    async respond(id, value, by, now) {
      const existing = await this.get(id);
      if (!existing || existing.hidden) return { error: 'confirm_not_found', status: 404 };
      if (decode(existing).confirmBlocked) return { error: 'confirm_action_type_not_supported', status: 400 };
      const answer = { value, by, at: now, verified: false, revision: 1 };
      // One conditional SQL write is the authority across isolates, callers and retries.
      await db.prepare('UPDATE loom_confirms SET answer = ?, answered_at = ?, answer_seq = (SELECT COALESCE(MAX(answer_seq), 0) + 1 FROM loom_confirms) WHERE id = ? AND answer IS NULL AND hidden = 0 AND expires_at > ?').bind(JSON.stringify(answer), now, id, now).run();
      const row = await this.get(id);
      if (!row || row.hidden) return { error: 'confirm_not_found', status: 404 };
      const saved = decode(row);
      if (saved.answer) {
        if (saved.answer.value === value && saved.answer.by === by) return { message: saved, answer: saved.answer, notice: UNVERIFIED };
        return { error: 'confirm_already_answered', status: 409, answer: saved.answer, notice: UNVERIFIED };
      }
      return { error: 'confirm_expired', status: 410 };
    },
    async hide(id) { await db.prepare('UPDATE loom_confirms SET hidden = 1 WHERE id = ?').bind(id).run(); },
    async forOwner(owner, now) {
      return openCards('SELECT c.* FROM loom_confirms c JOIN loom_confirm_recipients r ON r.card_id = c.id WHERE r.name = ? AND c.hidden = 0 AND c.answer IS NULL AND c.expires_at > ?', [owner, now], 100);
    },
    async desk(desk, now, after = 0) {
      const open = await openCards('SELECT c.* FROM loom_confirms c WHERE c.desk = ? AND c.hidden = 0 AND c.answer IS NULL AND c.expires_at > ?', [desk, now], 101);
      const answered = await db.prepare('SELECT * FROM loom_confirms WHERE desk = ? AND hidden = 0 AND answered_at IS NOT NULL AND answer_seq > ? ORDER BY answer_seq LIMIT 101').bind(desk, after).all();
      const page = answered.results.slice(0, 100), last = page.at(-1);
      return { open: open.slice(0, 100), answered: page.map(cardItem), openTruncated: open.length > 100, hasMore: answered.results.length > 100, cursor: last?.answer_seq ?? after, notice: UNVERIFIED };
    },
  };
  return new Proxy(store, { get(target, key) {
    const fn = target[key];
    return typeof fn === 'function' ? async (...args) => {
      try { return await fn.apply(target, args); } catch { throw new ConfirmStoreError('confirm_store_unavailable'); }
    } : fn;
  } });
}
