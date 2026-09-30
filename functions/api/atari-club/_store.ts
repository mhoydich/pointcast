import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { hasDirectorDeskAccess } from '../../../src/lib/director-access.ts';
import { CLUB_CHANNELS, ClubError, clubBody, clubChannel, clubDay, clubHandle } from '../../../src/lib/atari-club.ts';

export type ClubEnv = AuthEnv;
type Clock = { now: () => Date };
const clock: Clock = { now: () => new Date() };
interface Member {
  user_id: string; handle: string; joined_at: number; status: 'active' | 'suspended';
  first_post_at: number | null; first_workshop_at: number | null; night_shift_at: number | null;
}
interface PostRow { id: string; user_id: string; handle: string; channel: string; body: string; created_at: number; }
interface Count { count: number; }
const iso = (value: number) => new Date(value).toISOString();
const failure = (error: unknown) => {
  if (error instanceof ClubError) return authJson({ ok: false, ...(error.status === 503 ? { ready: false } : {}), error: error.code, message: error.message }, {
    status: error.status, ...(error.retryAfter ? { headers: { 'Retry-After': String(error.retryAfter) } } : {}),
  });
  // Binding/migration outages are not an empty board and must never invent counts.
  return authJson({ ok: false, ready: false, error: 'club-unavailable', message: 'The club board is temporarily unavailable. Please try again shortly.' }, { status: 503 });
};
function database(env: ClubEnv): D1Database {
  if (!env.AUTH_DB) throw new ClubError(503, 'club-setup-required', 'The club board is being connected. Please come back shortly.');
  return env.AUTH_DB;
}
function member(db: D1Database, userId: string) {
  return db.prepare('SELECT * FROM atari_club_members WHERE user_id = ?').bind(userId).first<Member>();
}
function requireMember(value: Member | null): Member {
  if (!value) throw new ClubError(403, 'join-required', 'Join the club before posting or checking in.');
  if (value.status !== 'active') throw new ClubError(403, 'membership-suspended', 'Your club membership is paused.');
  return value;
}
function postId(value: unknown): string {
  if (typeof value !== 'string' || !/^acp_[a-f0-9]{32}$/.test(value)) throw new ClubError(400, 'invalid-post', 'Choose a valid board message.');
  return value;
}
async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ClubError(403, 'origin-rejected', 'Open the club on PointCast before sending.');
  }
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) {
    throw new ClubError(415, 'json-required', 'Send this request as JSON.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ClubError(400, 'invalid-json', 'The request is empty.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) { await reader.cancel(); throw new ClubError(413, 'request-too-large', 'This message is too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not-object');
    return value as Record<string, unknown>;
  } catch { throw new ClubError(400, 'invalid-json', 'The request could not be read.'); }
}
async function selfView(db: D1Database, userId: string | undefined, canModerate: boolean, now: Date) {
  const current = userId ? await member(db, userId) : null;
  const days = current ? await db.prepare('SELECT COUNT(*) AS count FROM atari_club_checkins WHERE user_id = ?').bind(userId).first<Count>() : null;
  const today = current ? await db.prepare('SELECT 1 AS found FROM atari_club_checkins WHERE user_id = ? AND day = ?').bind(userId, clubDay(now)).first() : null;
  const dates: [string, number | null][] = current ? [
    ['first-carrier', current.joined_at], ['first-transmission', current.first_post_at],
    ['night-shift', current.night_shift_at], ['pixel-builder', current.first_workshop_at],
  ] : [];
  return {
    signedIn: Boolean(userId), isMember: current?.status === 'active', suspended: current?.status === 'suspended',
    handle: current?.handle ?? null, joinedAt: current ? iso(current.joined_at) : null,
    badges: dates.filter((entry): entry is [string, number] => entry[1] !== null).map(([id, date]) => ({ id, earnedAt: iso(date) })),
    checkinDays: days?.count ?? 0, checkedInToday: Boolean(today), canModerate,
  };
}
export async function handleClubGet(request: Request, env: ClubEnv, time: Clock = clock): Promise<Response> {
  try {
    const db = database(env);
    const url = new URL(request.url);
    const channel = url.searchParams.get('channel');
    if (channel !== null) clubChannel(channel);
    const session = await readSessionFromRequest(request, env);
    const userId = session?.user.userId;
    const canModerate = hasDirectorDeskAccess(session);
    if (url.searchParams.get('moderation') === '1') {
      if (!canModerate) throw new ClubError(403, 'director-required', 'Only the PointCast director can review reports.');
      const reports = await db.prepare(`SELECT r.post_id AS postId, r.reason, r.created_at AS createdAt,
        p.body, p.channel, m.handle FROM atari_club_reports r JOIN atari_club_posts p ON p.id = r.post_id
        JOIN atari_club_members m ON m.user_id = p.user_id WHERE r.resolved_at IS NULL
        ORDER BY r.created_at DESC LIMIT 100`).all<{postId: string; reason: string; createdAt: number; body: string; channel: string; handle: string}>();
      return authJson({ ok: true, reports: reports.results.map((r) => ({ ...r, createdAt: iso(r.createdAt) })) });
    }
    const [members, total, feed, self] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS count FROM atari_club_members WHERE status = 'active'").first<Count>(),
      db.prepare("SELECT COUNT(*) AS count FROM atari_club_posts p JOIN atari_club_members m ON m.user_id = p.user_id WHERE p.removed = 0 AND m.status = 'active'").first<Count>(),
      db.prepare(`SELECT p.id, p.user_id, m.handle, p.channel, p.body, p.created_at FROM atari_club_posts p
        JOIN atari_club_members m ON m.user_id = p.user_id WHERE p.removed = 0 AND m.status = 'active'
        AND (? IS NULL OR p.channel = ?) ORDER BY p.created_at DESC, p.id DESC LIMIT 50`).bind(channel, channel).all<PostRow>(),
      selfView(db, userId, canModerate, time.now()),
    ]);
    return authJson({
      ok: true, ready: true, channels: CLUB_CHANNELS, memberCount: members?.count ?? 0, postCount: total?.count ?? 0,
      posts: feed.results.map((p) => ({ id: p.id, handle: p.handle, channel: p.channel, body: p.body, createdAt: iso(p.created_at), canDelete: canModerate || p.user_id === userId })), self,
    });
  } catch (error) { return failure(error); }
}
export async function handleClubPost(request: Request, env: ClubEnv, time: Clock = clock): Promise<Response> {
  try {
    const body = await readBody(request);
    const db = database(env);
    const session = await readSessionFromRequest(request, env);
    if (!session) throw new ClubError(401, 'sign-in-required', 'Sign in to PointCast to join the club.');
    const userId = session.user.userId;
    const director = hasDirectorDeskAccess(session);
    const now = time.now();
    const at = now.getTime();
    let current = await member(db, userId);
    let status = 200;
    if (body.action === 'join') {
      if (body.consent !== true) throw new ClubError(400, 'consent-required', 'Confirm that your club handle and messages will be public.');
      const handle = clubHandle(body.handle, director);
      if (current?.status === 'suspended') requireMember(current);
      if (current && current.handle.toLowerCase() !== handle.toLowerCase()) throw new ClubError(409, 'already-joined', 'You already belong to the club under your current handle.');
      const result = await db.batch([
        db.prepare(`INSERT INTO atari_club_members (user_id, handle, handle_key, joined_at)
          VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`).bind(userId, handle, handle.toLowerCase(), at),
        // Only a new membership creates the first visit. GET and join retries
        // never fabricate subsequent check-in days.
        db.prepare(`INSERT OR IGNORE INTO atari_club_checkins (user_id, day, created_at)
          SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM atari_club_members WHERE user_id = ? AND handle_key = ? AND joined_at = ?)`)
          .bind(userId, clubDay(now), at, userId, handle.toLowerCase(), at),
      ]);
      current = await member(db, userId);
      if (!current) throw new ClubError(409, 'handle-taken', 'That handle is already taken. Please choose another.');
      if (current.handle.toLowerCase() !== handle.toLowerCase()) throw new ClubError(409, 'already-joined', 'You already belong to the club under your current handle.');
      status = result[0].meta.changes ? 201 : 200;
    } else if (body.action === 'post') {
      requireMember(current);
      const channel = clubChannel(body.channel);
      const message = clubBody(body.body);
      const id = `acp_${crypto.randomUUID().replaceAll('-', '')}`;
      // Rate checks and insertion are one SQL statement, so parallel requests
      // cannot defeat the cooldown. Removed posts still count toward limits.
      const result = await db.batch([
        db.prepare(`INSERT INTO atari_club_posts (id, user_id, channel, body, created_at)
          SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM atari_club_members WHERE user_id = ? AND status = 'active')
          AND NOT EXISTS (SELECT 1 FROM atari_club_posts WHERE user_id = ? AND created_at > ?)
          AND (SELECT COUNT(*) FROM atari_club_posts WHERE user_id = ? AND created_at > ?) < 10`)
          .bind(id, userId, channel, message, at, userId, userId, at - 30000, userId, at - 3600000),
        db.prepare(`UPDATE atari_club_members SET first_post_at = COALESCE(first_post_at, ?),
          first_workshop_at = CASE WHEN ? = 'workshop' THEN COALESCE(first_workshop_at, ?) ELSE first_workshop_at END
          WHERE user_id = ? AND EXISTS (SELECT 1 FROM atari_club_posts WHERE id = ?)`)
          .bind(at, channel, at, userId, id),
      ]);
      if (!result[0].meta.changes) {
        const hour = await db.prepare('SELECT MIN(created_at) AS first, MAX(created_at) AS last, COUNT(*) AS count FROM atari_club_posts WHERE user_id = ? AND created_at > ?')
          .bind(userId, at - 3600000).first<{first: number | null; last: number | null; count: number}>();
        const until = hour && hour.count >= 10 ? (hour.first ?? at) + 3600000 : (hour?.last ?? at) + 30000;
        throw new ClubError(429, 'posting-too-fast', 'Wait between messages. The club allows 10 messages per hour, at least 30 seconds apart.', Math.max(1, Math.ceil((until - at) / 1000)));
      }
      status = 201;
    } else if (body.action === 'checkin') {
      requireMember(current);
      await db.batch([
        db.prepare(`INSERT OR IGNORE INTO atari_club_checkins (user_id, day, created_at)
          SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM atari_club_members WHERE user_id = ? AND status = 'active')`).bind(userId, clubDay(now), at, userId),
        db.prepare(`UPDATE atari_club_members SET night_shift_at = COALESCE(night_shift_at, ?)
          WHERE user_id = ? AND status = 'active' AND (SELECT COUNT(*) FROM atari_club_checkins WHERE user_id = ?) >= 3`).bind(at, userId, userId),
      ]);
    } else if (body.action === 'report') {
      requireMember(current);
      const id = postId(body.postId);
      const reason = body.reason;
      if (typeof reason !== 'string' || !['spam', 'abuse', 'privacy', 'other'].includes(reason)) throw new ClubError(400, 'invalid-reason', 'Choose spam, abuse, privacy, or other.');
      const exists = await db.prepare('SELECT 1 AS found FROM atari_club_posts WHERE id = ? AND removed = 0').bind(id).first();
      if (!exists) throw new ClubError(404, 'post-not-found', 'That message is no longer on the board.');
      const previous = await db.prepare('SELECT 1 AS found FROM atari_club_reports WHERE post_id = ? AND reporter_id = ?').bind(id, userId).first();
      if (!previous) {
        const result = await db.prepare(`INSERT OR IGNORE INTO atari_club_reports (post_id, reporter_id, reason, created_at)
          SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM atari_club_reports WHERE reporter_id = ? AND created_at > ?) < 10`)
          .bind(id, userId, reason, at, userId, at - 86400000).run();
        if (!result.meta.changes) throw new ClubError(429, 'report-limit', 'You have reached the daily report limit. Please try again tomorrow.', 86400);
      }
    } else if (body.action === 'delete') {
      const id = postId(body.postId);
      const result = await db.batch([
        db.prepare(`UPDATE atari_club_posts SET removed = 1, body = '' WHERE id = ? AND (user_id = ? OR ? = 1)`).bind(id, userId, director ? 1 : 0),
        db.prepare(`UPDATE atari_club_reports SET resolved_at = ? WHERE post_id = ?
          AND EXISTS (SELECT 1 FROM atari_club_posts WHERE id = ? AND removed = 1 AND (user_id = ? OR ? = 1))`).bind(at, id, id, userId, director ? 1 : 0),
      ]);
      if (!result[0].meta.changes) throw new ClubError(404, 'post-not-found', 'This message is unavailable or belongs to another member.');
    } else if (body.action === 'resolve' || body.action === 'suspend' || body.action === 'restore') {
      if (!director) throw new ClubError(403, 'director-required', 'Only the PointCast director can moderate the board.');
      if (body.action === 'resolve') {
        await db.prepare('UPDATE atari_club_reports SET resolved_at = ? WHERE post_id = ?').bind(at, postId(body.postId)).run();
      } else {
        if (typeof body.handle !== 'string') throw new ClubError(400, 'invalid-handle', 'Choose a club member.');
        const result = await db.prepare('UPDATE atari_club_members SET status = ? WHERE handle_key = ?')
          .bind(body.action === 'suspend' ? 'suspended' : 'active', body.handle.toLowerCase()).run();
        if (!result.meta.changes) throw new ClubError(404, 'member-not-found', 'That handle is not in the club.');
      }
    } else throw new ClubError(400, 'invalid-action', 'Choose a supported club action.');
    return authJson({ ok: true, self: await selfView(db, userId, director, now) }, { status });
  } catch (error) { return failure(error); }
}
