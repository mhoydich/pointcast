/**
 * Network Points store (D1, AUTH_DB). The rules live in
 * src/lib/network-points.mjs; this file only reads and appends lines.
 *
 * Everything that writes is behind POINTS_LEDGER_ENABLED ("1" turns it on).
 * With the flag off, awards are no-ops and the read endpoint says so.
 *
 * Callers:
 *   - The Here check-in (geostamp thread) calls awardCheckin() after it
 *     saves a signed-in member's check-in.
 *   - /api/drum calls awardDrumDay() for signed-in members (once a day).
 * Only members who joined the open ledger (/me → "Join the open ledger")
 * earn lines. Nobody is added without choosing to be.
 */

import {
  chainLines,
  planCheckin,
  planDrumDay,
  POINTS_GENESIS,
  POINTS_SCHEMA,
} from '../../src/lib/network-points.mjs';
import { drumMemberKey } from './drum-signal.ts';

export interface PointsEnv {
  AUTH_DB?: D1Database;
  POINTS_LEDGER_ENABLED?: string;
}

export interface LedgerLine {
  schema: string;
  id: string;
  prev: string;
  profile: string;
  kind: string;
  points: number;
  note: string | null;
  edition: string;
  site: string;
  ref: string;
  day: string;
  place: string;
  at: string;
}

interface LineRow extends Omit<LedgerLine, 'schema'> { seq: number }

export const pointsEnabled = (env: PointsEnv) => env.POINTS_LEDGER_ENABLED === '1' && !!env.AUTH_DB;

/** The public, opaque profile id for a member: the same hash the drum counter uses. */
export const ledgerProfileId = (userId: string) => drumMemberKey(userId);

export const isProfileId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{24}$/.test(value);

const toLine = (row: LineRow): LedgerLine => ({
  schema: POINTS_SCHEMA, id: row.id, prev: row.prev, profile: row.profile, kind: row.kind,
  points: row.points, note: row.note ?? null, edition: row.edition, site: row.site, ref: row.ref,
  day: row.day, place: row.place ?? '', at: row.at,
});

export async function readProfileLines(db: D1Database, profile: string): Promise<LedgerLine[]> {
  const { results } = await db.prepare(
    'SELECT seq,id,prev,profile,kind,points,note,edition,site,ref,day,place,at FROM points_ledger WHERE profile = ? ORDER BY seq ASC',
  ).bind(profile).all<LineRow>();
  return (results ?? []).map(toLine);
}

export async function readRecentLines(db: D1Database, limit = 50): Promise<LedgerLine[]> {
  const { results } = await db.prepare(
    'SELECT seq,id,prev,profile,kind,points,note,edition,site,ref,day,place,at FROM points_ledger ORDER BY seq DESC LIMIT ?',
  ).bind(Math.max(1, Math.min(200, limit))).all<LineRow>();
  return (results ?? []).map(toLine);
}

export async function readProfileRow(db: D1Database, profile: string) {
  return db.prepare('SELECT profile, display_name, handle, joined_at FROM points_profiles WHERE profile = ?')
    .bind(profile).first<{ profile: string; display_name: string | null; handle: string | null; joined_at: string }>();
}

/** Same handle rule as the shared profile record on elsegundo.xyz. */
export const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export async function profileForHandle(db: D1Database, handle: string): Promise<string | null> {
  const row = await db.prepare("SELECT profile FROM points_profiles WHERE handle = ? AND joined_at <> 'left'").bind(handle).first<{ profile: string }>();
  return row?.profile ?? null;
}

export async function profileForUser(db: D1Database, userId: string): Promise<string | null> {
  const row = await db.prepare('SELECT profile FROM points_profiles WHERE user_id = ?').bind(userId).first<{ profile: string }>();
  return row?.profile ?? null;
}

export async function joinLedger(db: D1Database, userId: string, displayName: string | null, handle: string | null = null, now = new Date()) {
  const profile = await ledgerProfileId(userId);
  const name = displayName ? displayName.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40) || null : null;
  await db.prepare(
    "INSERT INTO points_profiles (profile,user_id,display_name,handle,joined_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name = excluded.display_name, handle = COALESCE(excluded.handle, points_profiles.handle), joined_at = CASE WHEN points_profiles.joined_at = 'left' THEN excluded.joined_at ELSE points_profiles.joined_at END",
  ).bind(profile, userId, name, handle, now.toISOString()).run();
  return profile;
}

/** Leaving keeps the lines (the ledger is append-only) but stops new ones and hides the name. */
export async function leaveLedger(db: D1Database, userId: string) {
  await db.prepare("UPDATE points_profiles SET display_name = NULL, handle = NULL, joined_at = 'left' WHERE user_id = ?").bind(userId).run();
}

async function appendPlanned(
  db: D1Database,
  profile: string,
  plan: (prior: LedgerLine[]) => unknown[],
): Promise<LedgerLine[]> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const prior = await readProfileLines(db, profile);
    const drafts = plan(prior).filter((d: any) => !prior.some((p) => p.kind === d.kind && p.ref === d.ref));
    if (!drafts.length) return [];
    const head = prior.length ? prior[prior.length - 1].id : POINTS_GENESIS;
    const lines = (await chainLines(drafts, head)) as LedgerLine[];
    try {
      await db.batch(lines.map((l) => db.prepare(
        'INSERT INTO points_ledger (id,prev,profile,kind,points,note,edition,site,ref,day,place,at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      ).bind(l.id, l.prev, l.profile, l.kind, l.points, l.note, l.edition, l.site, l.ref, l.day, l.place, l.at)));
      return lines;
    } catch (error) {
      // UNIQUE(profile, prev) or UNIQUE(profile, kind, ref): another write won the
      // race. Re-read and re-plan; an idempotent repeat plans nothing.
      if (attempt === 2) throw error;
    }
  }
  return [];
}

async function activeProfile(env: PointsEnv, userId: string): Promise<string | null> {
  if (!pointsEnabled(env)) return null;
  const row = await env.AUTH_DB!.prepare("SELECT profile FROM points_profiles WHERE user_id = ? AND joined_at <> 'left'")
    .bind(userId).first<{ profile: string }>();
  return row?.profile ?? null;
}

export interface CheckinAward {
  userId: string;
  at: string | Date;
  place?: string;
  site?: string;
  /** The check-in's own id. Makes the award idempotent. */
  ref: string;
}

/** Called by the Here check-in after it saves a signed-in member's check-in. */
export async function awardCheckin(env: PointsEnv, award: CheckinAward): Promise<LedgerLine[]> {
  const profile = await activeProfile(env, award.userId);
  if (!profile) return [];
  return appendPlanned(env.AUTH_DB!, profile, (prior) => planCheckin({
    profile, at: award.at, place: award.place ?? '', site: award.site ?? 'pointcast.xyz', ref: String(award.ref).slice(0, 120),
  }, prior));
}

/** Called by /api/drum for signed-in members. At most one line a day. */
export async function awardDrumDay(env: PointsEnv, userId: string, at: Date = new Date(), site = 'pointcast.xyz'): Promise<LedgerLine[]> {
  const profile = await activeProfile(env, userId);
  if (!profile) return [];
  return appendPlanned(env.AUTH_DB!, profile, (prior) => planDrumDay({ profile, at, site }, prior));
}
