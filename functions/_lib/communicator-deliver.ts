/**
 * The Communicator delivery adapter v0 (docs/prd/communicator-v1.md 4.4). The ONLY module that reads
 * a profile's private contact: it resolves a handle to an email at send time, renders the message, and
 * hands {to, subject, text} to an injected sendMail. Nothing it renders carries any contact detail.
 *
 * Per pending message: consent re-check (no-consent) -> channel (no-channel) -> quiet hours (held: the
 * row stays 'pending' and is re-evaluated on the next pass; nothing is stored) -> caps (20 per host per
 * rolling 24h, 6 per recipient) -> mint a token, store only its sha256 -> dry-run (mark sent, send
 * nothing) unless COMMUNICATOR_SEND === 'on'.
 */
import { laNowIso } from './communicator-store.ts';

export const TOKEN_TTL_MS = 72 * 3600_000;
export const CAP_HOST = 20;
export const CAP_RECIPIENT = 6;

export type DeliverEnv = { COMMUNICATOR_SEND?: string };
export type OutMail = { to: string; subject: string; text: string };
export type DeliverOpts = {
  now: number; sendMail: (m: OutMail) => Promise<unknown>; origin?: string;
  /** Test hook: receives every rendered body (never the address), including dry-run ones. */
  capture?: (r: { id: string; to_handle: string; subject: string; text: string }) => void;
};
export type DeliverResult = { sent: number; held: number; refused: number; details: { id: string; to: string; outcome: string; note?: string }[] };

/** Chips that are links: label -> the answer code /reply accepts, per message kind. */
const ACTIONABLE: Record<string, string[]> = {
  invite: ['in', 'out', 'maybe', 'newtime'], 're-invite': ['in', 'out', 'maybe', 'newtime'], 'score-confirm': ['confirm', 'dispute'],
};
export const actionableChips = (kind: string, replies: string[]): string[] => (ACTIONABLE[kind] || []).filter((c) => replies.includes(c));
export const answersFor = (kind: string): string[] => ACTIONABLE[kind] || [];

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
/** 32 random bytes, base64url; re-rolled if it happens to contain a 7-digit run (the leak scan would read it as a phone number). */
export function newToken(): string {
  for (;;) {
    const t = b64url(crypto.getRandomValues(new Uint8Array(32)));
    if (!/\d{7}/.test(t)) return t;
  }
}

export function inQuietHours(hhmm: string, start: string, end: string): boolean {
  if (start === end) return false;
  return start < end ? hhmm >= start && hhmm < end : hhmm >= start || hhmm < end;
}

type Row = { id: string; game_id: string; to_handle: string; kind: string; text: string; replies_json: string; status: string };

export function renderEmail(row: { text: string; kind: string; replies: string[] }, token: string | null, origin: string): { subject: string; text: string } {
  const subject = row.text.slice(0, 60);
  const links = token ? actionableChips(row.kind, row.replies).map((c) => `${c}: ${origin}/c/r/${token}?a=${c}`) : [];
  const text = links.length ? `${row.text}\n\n${links.join('\n')}\n\nEach link works once and expires in 72 hours.\n` : `${row.text}\n`;
  return { subject, text };
}

export async function deliver(db: D1Database, env: DeliverEnv, messages: { id: string }[], opts: DeliverOpts): Promise<DeliverResult> {
  const out: DeliverResult = { sent: 0, held: 0, refused: 0, details: [] };
  const origin = opts.origin || 'https://pointcast.xyz';
  const nowIso = new Date(opts.now).toISOString();
  const local = laNowIso(opts.now).slice(11, 16);
  const since = new Date(opts.now - 24 * 3600_000).toISOString();
  const note = (id: string, to: string, outcome: string, n?: string) => { out.details.push({ id, to, outcome, ...(n ? { note: n } : {}) }); };
  const refuse = async (r: Row, why: string) => {
    await db.prepare(`UPDATE communicator_messages SET status = 'expired', note = ?, updated_at = ? WHERE id = ? AND status = 'pending'`).bind(why, nowIso, r.id).run();
    out.refused++; note(r.id, r.to_handle, 'refused', why);
  };
  for (const m of messages) {
    const r = await db.prepare(`SELECT id, game_id, to_handle, kind, text, replies_json, status FROM communicator_messages WHERE id = ?`).bind(m.id).first<Row>();
    if (!r || r.status !== 'pending') continue;
    // The one read of private fields: named json_extract paths, nothing else leaves this function but the address in `to`.
    const p = await db.prepare(
      `SELECT json_extract(payload_json,'$.consent.communicator') AS consent, json_extract(payload_json,'$.contact.email') AS email,
              json_extract(payload_json,'$.channels.email') AS email_on, json_extract(payload_json,'$.channels.quietHours.start') AS qs,
              json_extract(payload_json,'$.channels.quietHours.end') AS qe FROM communicator_profiles WHERE handle = ?`,
    ).bind(r.to_handle).first<{ consent: number | null; email: string | null; email_on: number | null; qs: string | null; qe: string | null }>();
    if (!p || p.consent !== 1) { await refuse(r, 'no-consent'); continue; }
    if (!p.email || p.email_on === 0) { await refuse(r, 'no-channel'); continue; }
    if (inQuietHours(local, p.qs || '21:00', p.qe || '08:00')) { out.held++; note(r.id, r.to_handle, 'held', 'quiet-hours'); continue; }
    const perRecipient = (await db.prepare(`SELECT COUNT(*) AS n FROM communicator_messages WHERE to_handle = ? AND sent_at >= ?`).bind(r.to_handle, since).first<{ n: number }>())?.n ?? 0;
    if (perRecipient >= CAP_RECIPIENT) { await refuse(r, 'cap-recipient'); continue; }
    const perHost = (await db.prepare(
      `SELECT COUNT(*) AS n FROM communicator_messages m JOIN communicator_games g ON g.id = m.game_id
        WHERE g.host = (SELECT host FROM communicator_games WHERE id = ?) AND m.sent_at >= ?`,
    ).bind(r.game_id, since).first<{ n: number }>())?.n ?? 0;
    if (perHost >= CAP_HOST) { await refuse(r, 'cap-host'); continue; }

    const replies: string[] = JSON.parse(r.replies_json);
    const token = actionableChips(r.kind, replies).length ? newToken() : null;
    const mail = renderEmail({ text: r.text, kind: r.kind, replies }, token, origin);
    opts.capture?.({ id: r.id, to_handle: r.to_handle, ...mail });
    const live = env.COMMUNICATOR_SEND === 'on';
    if (live) {
      try { await opts.sendMail({ to: p.email, subject: mail.subject, text: mail.text }); }
      catch {
        await db.prepare(`UPDATE communicator_messages SET note = 'send-failed', updated_at = ? WHERE id = ?`).bind(nowIso, r.id).run();
        out.held++; note(r.id, r.to_handle, 'held', 'send-failed'); continue;
      }
    }
    await db.prepare(
      `UPDATE communicator_messages SET status = 'sent', sent_at = ?, token_hash = ?, expires_at = ?, note = ?, updated_at = ? WHERE id = ? AND status = 'pending'`,
    ).bind(nowIso, token ? await sha256Hex(token) : null, token ? new Date(opts.now + TOKEN_TTL_MS).toISOString() : null, live ? 'sent' : 'dry-run', nowIso, r.id).run();
    out.sent++; note(r.id, r.to_handle, 'sent', live ? 'sent' : 'dry-run');
  }
  return out;
}

