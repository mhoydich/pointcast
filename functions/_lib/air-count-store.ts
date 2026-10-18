/**
 * The honest count's SQL (docs/plans/2026-10-18-field-reports-v2-paper-spec.md
 * §7.1): the rows behind GET /api/air/killtest, and the house list behind
 * /api/air/house. Every statement is one string literal followed by .bind(.
 *
 * killTestRows selects `who` (COALESCE(user_id, pid_hash)) and the three house
 * columns (HOUSE_SELECT in air-house.mjs, written out below because SQL here
 * is never built from pieces). The rules that decide who counts live in
 * air-killtest.mjs and air-house.mjs; nothing here leaves the server: the
 * callers shape bodies from numbers and booleans only.
 *
 * Both readers need migrations/auth/0031_field_reports_paper.sql (air_house);
 * before it is applied they throw, and the routes answer 503.
 */
// @ts-ignore — plain module shared with the tests
import { KILL_TEST } from './air-killtest.mjs';

/** One air_reports row as the kill test counts it. `who`, the house columns and user_payload never leave the server. */
export type KillTestRow = {
  spot: string; kind: string; day: string; slot: number; onsite: number; source: string; status: string;
  who: string | null; house_pid: number; house_user: number; user_payload: string | null;
};

/** Every on-site, page-sourced, ok report in the kill-test window, with the house columns; the count is decided in JS (killTestCount). */
export async function killTestRows(db: D1Database): Promise<KillTestRow[]> {
  const res = await db.prepare(`SELECT r.spot, r.kind, r.day, r.slot, r.onsite, r.source, r.status, COALESCE(r.user_id, r.pid_hash) AS who, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'pid' AND h.value = r.pid_hash) AS house_pid, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'user' AND h.value = r.user_id) AS house_user, (SELECT u.payload FROM users u WHERE u.id = r.user_id) AS user_payload
FROM air_reports r
WHERE r.day >= ? AND r.day <= ? AND r.source = 'page' AND r.status = 'ok' AND r.onsite = 1
ORDER BY r.observed_at LIMIT 5000`).bind(KILL_TEST.from, KILL_TEST.to).all<KillTestRow>();
  return res.results ?? [];
}

/** Whether this phone is on the house list. (The account is house by role, or by the user row markHouse wrote.) */
export async function houseState(db: D1Database, pid: string, _userId: string | null): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok FROM air_house WHERE kind = 'pid' AND value = ?").bind(pid).first<{ ok: number }>();
  return row != null;
}

/** Put this phone and the signed-in account on the house list, in one batch. A second call changes nothing. */
export async function markHouse(db: D1Database, pid: string, userId: string, now: number): Promise<void> {
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO air_house (kind, value, note, added_at) VALUES ('pid', ?, 'marked from /r/me', ?)").bind(pid, now),
    db.prepare("INSERT OR IGNORE INTO air_house (kind, value, note, added_at) VALUES ('user', ?, 'marked from /r/me', ?)").bind(userId, now),
  ]);
}

/** Take this phone off the house list. The account stays house by its role. */
export async function unmarkHouse(db: D1Database, pid: string): Promise<void> {
  await db.prepare("DELETE FROM air_house WHERE kind = 'pid' AND value = ?").bind(pid).run();
}
