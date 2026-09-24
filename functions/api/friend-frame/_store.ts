/**
 * Friend Frame v2 storage + handlers (AUTH_DB, migrations/auth/0022_friend_frame.sql).
 *
 * Capability links, no accounts:
 *   owner link  /friend-frame/?f=ID#o=OWNERKEY  → rename, name seats, re-key a seat, hide a post
 *   seat link   /friend-frame/?f=ID#k=SEATKEY   → hang that seat's next frame
 * Keys ride in the URL fragment so they never reach server logs or referrers.
 * The owner key is never stored (only its SHA-256). Seat keys are
 * HMAC(ownerKey, "ff-seat:ID:DAY:VERSION"), stored only as SHA-256, and the
 * owner console re-derives them on demand. Everything read back is public.
 */
import {
  DAYS, INKS, LIMITS, TOWN_FRAME_ID, FrameInputError,
  cleanTitle, cleanFriend, cleanColor, cleanPost, isDate, laToday, nextDateForDay, weekOf, dayOf,
} from '../../../src/lib/friend-frame.ts';

export interface FrameEnv { AUTH_DB?: D1Database }
type Opts = { now?: () => Date };

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' };
export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, 'Cache-Control': 'no-store', ...extra } });
const fail = (error: string, status = 400) => json({ ok: false, error }, status);

const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
const rand = (n: number, alphabet = ALPHA) => {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
};
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function sha256(text: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}
export async function seatKeyFor(ownerKey: string, frameId: string, day: number, version: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(ownerKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`ff-seat:${frameId}:${day}:${version}`)));
  return `s_${b64url(mac).slice(0, 26)}`;
}
const newOwnerKey = () => `o_${b64url(crypto.getRandomValues(new Uint8Array(24)))}`;
const KEY_RE = /^[os]_[A-Za-z0-9_-]{20,40}$/;
const ID_RE = /^([a-z2-9]{10}|town)$/;

async function readJson(request: Request, max = 16_000): Promise<Record<string, unknown>> {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > max) throw new FrameInputError('That is too much to send at once.');
  const text = await request.text();
  if (text.length > max) throw new FrameInputError('That is too much to send at once.');
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new FrameInputError('Send JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new FrameInputError('Send a JSON object.');
  return body as Record<string, unknown>;
}

interface PostRow { frame_id: string; date: string; day: number; friend: string; color: string; poem: string; note: string; picture: string | null; updated_at: number; hidden: number }
interface SeatRow { frame_id: string; day: number; friend: string; color: string; key_hash: string; key_version: number }

const pictureUrl = (picture: string | null) => (picture?.startsWith('img:') ? `/api/friend-frame/image?id=${picture.slice(4)}` : picture);
export const publicPost = (p: PostRow, withHidden = false) => ({
  date: p.date, day: p.day, dayName: DAYS[p.day], friend: p.friend, color: p.color, poem: p.poem, note: p.note,
  picture: pictureUrl(p.picture), updatedAt: p.updated_at, ...(withHidden ? { hidden: Boolean(p.hidden) } : {}),
});
const publicSeat = (s: SeatRow) => ({ day: s.day, dayName: DAYS[s.day], friend: s.friend, color: s.color });

async function getFrame(db: D1Database, id: unknown) {
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new FrameInputError('No frame by that name.');
  const frame = await db.prepare('SELECT id, title, owner_hash, created_at FROM friend_frames WHERE id = ?').bind(id).first<{ id: string; title: string; owner_hash: string; created_at: number }>();
  if (!frame) throw new FrameInputError('No frame by that name.');
  return frame;
}
const seatsOf = async (db: D1Database, id: string) =>
  ((await db.prepare('SELECT * FROM friend_frame_seats WHERE frame_id = ? ORDER BY day').bind(id).all<SeatRow>()).results ?? []);

async function seatByKey(db: D1Database, id: unknown, key: unknown) {
  const frame = await getFrame(db, id);
  if (typeof key !== 'string' || !KEY_RE.test(key) || !key.startsWith('s_')) throw new FrameInputError('That seat link is not right. Ask the frame owner for a fresh one.');
  const seat = await db.prepare('SELECT * FROM friend_frame_seats WHERE frame_id = ? AND key_hash = ?').bind(frame.id, await sha256(key)).first<SeatRow>();
  if (!seat) throw new FrameInputError('That seat link has been retired. Ask the frame owner for a fresh one.');
  return { frame, seat };
}
async function ownerFrame(db: D1Database, id: unknown, ownerKey: unknown) {
  const frame = await getFrame(db, id);
  if (typeof ownerKey !== 'string' || !KEY_RE.test(ownerKey) || !ownerKey.startsWith('o_') || (await sha256(ownerKey)) !== frame.owner_hash) {
    throw new FrameInputError('That owner link does not open this frame.');
  }
  return frame;
}

function guard(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((error) => {
    if (error instanceof FrameInputError) return fail(error.message, error.message.startsWith('No frame') ? 404 : 400);
    console.error('friend-frame', error);
    return fail('The frame shop is closed for a moment. Nothing was changed.', 503);
  });
}

/** GET /api/friend-frame/frame?id=&date=&before= */
export function handleFrameGet(request: Request, env: FrameEnv, opts: Opts = {}) {
  return guard(async () => {
    const db = env.AUTH_DB;
    if (!db) return fail('The frame shop is closed for a moment.', 503);
    const url = new URL(request.url);
    const frame = await getFrame(db, url.searchParams.get('id'));
    const today = laToday(opts.now?.());
    const week = weekOf(today.date);
    const seats = await seatsOf(db, frame.id);
    const weekRows = (await db.prepare(`SELECT * FROM friend_frame_posts WHERE frame_id = ? AND date >= ? AND date <= ? AND hidden = 0`).bind(frame.id, week[0], week[6]).all<PostRow>()).results ?? [];
    const byDate = new Map(weekRows.map((r) => [r.date, r]));
    const fallback = byDate.get(today.date) ? null : await db.prepare(`SELECT * FROM friend_frame_posts WHERE frame_id = ? AND day = ? AND date < ? AND hidden = 0 ORDER BY date DESC LIMIT 1`).bind(frame.id, today.day, today.date).first<PostRow>();
    const before = url.searchParams.get('before');
    const until = isDate(before) ? addDaysSafe(before) : today.date;
    const record = (await db.prepare(`SELECT * FROM friend_frame_posts WHERE frame_id = ? AND date <= ? AND hidden = 0 ORDER BY date DESC LIMIT ?`).bind(frame.id, until, LIMITS.recordPage + 1).all<PostRow>()).results ?? [];
    const date = url.searchParams.get('date');
    const focus = isDate(date) ? await db.prepare('SELECT * FROM friend_frame_posts WHERE frame_id = ? AND date = ? AND hidden = 0').bind(frame.id, date).first<PostRow>() : null;
    const total = await db.prepare('SELECT COUNT(*) AS n FROM friend_frame_posts WHERE frame_id = ? AND hidden = 0 AND date <= ?').bind(frame.id, today.date).first<{ n: number }>();
    return json({
      ok: true,
      frame: { id: frame.id, title: frame.title, createdAt: frame.created_at, town: frame.id === TOWN_FRAME_ID },
      today,
      seats: seats.map(publicSeat),
      week: week.map((d, i) => ({ date: d, day: i, dayName: DAYS[i], post: byDate.get(d) ? publicPost(byDate.get(d)!) : null })),
      todayPost: byDate.get(today.date) ? publicPost(byDate.get(today.date)!) : null,
      fallback: fallback ? publicPost(fallback) : null,
      focus: focus ? publicPost(focus) : null,
      record: record.slice(0, LIMITS.recordPage).map((r) => publicPost(r)),
      more: record.length > LIMITS.recordPage ? record[LIMITS.recordPage - 1].date : null,
      kept: Number(total?.n ?? 0),
    }, 200, { 'Cache-Control': 'public, max-age=0, s-maxage=10', 'Access-Control-Allow-Origin': '*' });
  });
}
const addDaysSafe = (date: string) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10); };

/** POST /api/friend-frame/frame {title, friends?[7]} → owner link + seven seat links */
export function handleFrameCreate(request: Request, env: FrameEnv, opts: Opts = {}) {
  return guard(async () => {
    const db = env.AUTH_DB;
    if (!db) return fail('The frame shop is closed for a moment. Nothing was made.', 503);
    const body = await readJson(request);
    const title = cleanTitle(body.title);
    const names = Array.isArray(body.friends) ? body.friends.slice(0, 7).map(cleanFriend) : [];
    const now = (opts.now?.() ?? new Date()).getTime();
    const creator = await sha256(`ff-creator:${request.headers.get('CF-Connecting-IP') || 'local'}`);
    const made = await db.prepare('SELECT COUNT(*) AS n FROM friend_frames WHERE creator_hash = ? AND created_at > ?').bind(creator, now - 86_400_000).first<{ n: number }>();
    if (Number(made?.n ?? 0) >= LIMITS.framesPerCreatorPerDay) return fail('That is plenty of frames for one day. Come back tomorrow.', 429);
    const id = rand(10);
    const ownerKey = newOwnerKey();
    const seats = await Promise.all(DAYS.map(async (_, day) => ({ day, friend: names[day] || '', color: INKS[day], key: await seatKeyFor(ownerKey, id, day, 1) })));
    await db.batch([
      db.prepare('INSERT INTO friend_frames (id, title, owner_hash, creator_hash, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, title, await sha256(ownerKey), creator, now),
      ...(await Promise.all(seats.map(async (s) => db.prepare('INSERT INTO friend_frame_seats (frame_id, day, friend, color, key_hash, key_version) VALUES (?, ?, ?, ?, ?, 1)').bind(id, s.day, s.friend, s.color, await sha256(s.key))))),
    ]);
    return json({ ok: true, frame: { id, title }, ownerKey, seats: seats.map((s) => ({ ...s, dayName: DAYS[s.day] })) }, 201);
  });
}

/** POST /api/friend-frame/seat {id, key, action:'open'|'save', post?} */
export function handleSeat(request: Request, env: FrameEnv, opts: Opts = {}) {
  return guard(async () => {
    const db = env.AUTH_DB;
    if (!db) return fail('The frame shop is closed for a moment. Nothing was hung.', 503);
    const body = await readJson(request);
    const { frame, seat } = await seatByKey(db, body.id, body.key);
    const today = laToday(opts.now?.());
    const date = nextDateForDay(today.date, seat.day);
    const current = await db.prepare('SELECT * FROM friend_frame_posts WHERE frame_id = ? AND date = ?').bind(frame.id, date).first<PostRow>();
    const view = (post: PostRow | null) => ({ ok: true, frame: { id: frame.id, title: frame.title }, seat: publicSeat(seat), date, isToday: date === today.date, post: post ? publicPost(post, true) : null });
    if (body.action === 'open') return json(view(current));
    if (body.action !== 'save') return fail('Open or save.');
    const input = cleanPost(body.post, seat);
    if (input.picture?.startsWith('img:')) {
      const img = await db.prepare('SELECT frame_id, day FROM friend_frame_images WHERE id = ?').bind(input.picture.slice(4)).first<{ frame_id: string; day: number }>();
      if (!img || img.frame_id !== frame.id || img.day !== seat.day) throw new FrameInputError('That upload belongs to another seat.');
    }
    const now = (opts.now?.() ?? new Date()).getTime();
    const res = await db.prepare(`INSERT INTO friend_frame_posts (frame_id, date, day, friend, color, poem, note, picture, created_at, updated_at, edits, hidden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
      ON CONFLICT(frame_id, date) DO UPDATE SET friend = excluded.friend, color = excluded.color, poem = excluded.poem, note = excluded.note,
        picture = excluded.picture, updated_at = excluded.updated_at, edits = friend_frame_posts.edits + 1
      WHERE friend_frame_posts.edits < ?`)
      .bind(frame.id, date, seat.day, input.friend, input.color, input.poem, input.note, input.picture, now, now, LIMITS.editsPerDate).run();
    if (!res.meta?.changes) return fail('That day has been rehung plenty. It stays as it is.', 429);
    await db.prepare('UPDATE friend_frame_seats SET friend = ?, color = ? WHERE frame_id = ? AND day = ?').bind(input.friend, input.color, frame.id, seat.day).run();
    const saved = await db.prepare('SELECT * FROM friend_frame_posts WHERE frame_id = ? AND date = ?').bind(frame.id, date).first<PostRow>();
    return json({ ...view(saved), seat: { ...publicSeat(seat), friend: input.friend, color: input.color } }, current ? 200 : 201);
  });
}

const MIME = (bytes: Uint8Array): string | null => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
};

/** POST /api/friend-frame/image {id, key, data: base64} — a resized photo from the friend's phone */
export function handleImagePost(request: Request, env: FrameEnv, opts: Opts = {}) {
  return guard(async () => {
    const db = env.AUTH_DB;
    if (!db) return fail('The frame shop is closed for a moment. Nothing was saved.', 503);
    const body = await readJson(request, Math.ceil(LIMITS.imageBytes * 1.4) + 2_000);
    const { frame, seat } = await seatByKey(db, body.id, body.key);
    if (typeof body.data !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(body.data)) throw new FrameInputError('Send the picture as base64.');
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(body.data), (c) => c.charCodeAt(0)); } catch { throw new FrameInputError('That picture did not come through.'); }
    if (bytes.length > LIMITS.imageBytes) throw new FrameInputError('That picture is too big. It gets shrunk on your phone first; try again.');
    const mime = MIME(bytes);
    if (!mime) throw new FrameInputError('Pictures can be JPEG, PNG or WebP.');
    const date = nextDateForDay(laToday(opts.now?.()).date, seat.day);
    const used = await db.prepare('SELECT COUNT(*) AS n FROM friend_frame_images WHERE frame_id = ? AND day = ? AND date = ?').bind(frame.id, seat.day, date).first<{ n: number }>();
    if (Number(used?.n ?? 0) >= LIMITS.imagesPerDate) return fail('That is enough pictures for one day. Pick one of the ones you sent.', 429);
    const id = rand(16, 'abcdefghijklmnopqrstuvwxyz0123456789');
    await db.prepare('INSERT INTO friend_frame_images (id, frame_id, day, date, mime, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, frame.id, seat.day, date, mime, body.data, (opts.now?.() ?? new Date()).getTime()).run();
    return json({ ok: true, picture: `img:${id}`, url: `/api/friend-frame/image?id=${id}` }, 201);
  });
}

/** GET /api/friend-frame/image?id= */
export async function handleImageGet(request: Request, env: FrameEnv) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!env.AUTH_DB || !/^[a-z0-9]{16}$/.test(id)) return new Response('Not found', { status: 404 });
  try {
    const row = await env.AUTH_DB.prepare('SELECT mime, data FROM friend_frame_images WHERE id = ?').bind(id).first<{ mime: string; data: string }>();
    if (!row) return new Response('Not found', { status: 404 });
    const bytes = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
    return new Response(bytes, { headers: { 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } });
  } catch (error) {
    console.error('friend-frame image', error);
    return new Response('Unavailable', { status: 503 });
  }
}

/** POST /api/friend-frame/owner {id, ownerKey, action: view|title|seat|rekey|hide} */
export function handleOwner(request: Request, env: FrameEnv, opts: Opts = {}) {
  return guard(async () => {
    const db = env.AUTH_DB;
    if (!db) return fail('The frame shop is closed for a moment. Nothing was changed.', 503);
    const body = await readJson(request);
    const frame = await ownerFrame(db, body.id, body.ownerKey);
    const ownerKey = body.ownerKey as string;
    const dayArg = () => {
      const day = Number(body.day);
      if (!Number.isInteger(day) || day < 0 || day > 6) throw new FrameInputError('Pick a day.');
      return day;
    };
    if (body.action === 'title') {
      await db.prepare('UPDATE friend_frames SET title = ? WHERE id = ?').bind(cleanTitle(body.title), frame.id).run();
    } else if (body.action === 'seat') {
      const day = dayArg();
      const seat = (await seatsOf(db, frame.id))[day];
      await db.prepare('UPDATE friend_frame_seats SET friend = ?, color = ? WHERE frame_id = ? AND day = ?').bind(cleanFriend(body.friend), cleanColor(body.color, seat.color), frame.id, day).run();
    } else if (body.action === 'rekey') {
      const day = dayArg();
      const seat = (await seatsOf(db, frame.id))[day];
      const version = seat.key_version + 1;
      await db.prepare('UPDATE friend_frame_seats SET key_version = ?, key_hash = ? WHERE frame_id = ? AND day = ?').bind(version, await sha256(await seatKeyFor(ownerKey, frame.id, day, version)), frame.id, day).run();
    } else if (body.action === 'hide') {
      if (!isDate(body.date)) throw new FrameInputError('Pick a day to hide.');
      await db.prepare('UPDATE friend_frame_posts SET hidden = ? WHERE frame_id = ? AND date = ?').bind(body.hidden === false ? 0 : 1, frame.id, body.date).run();
    } else if (body.action !== 'view') {
      return fail('Unknown action.');
    }
    const title = (await db.prepare('SELECT title FROM friend_frames WHERE id = ?').bind(frame.id).first<{ title: string }>())?.title ?? frame.title;
    const seats = await seatsOf(db, frame.id);
    const hidden = (await db.prepare('SELECT * FROM friend_frame_posts WHERE frame_id = ? AND hidden = 1 ORDER BY date DESC LIMIT 50').bind(frame.id).all<PostRow>()).results ?? [];
    return json({
      ok: true,
      frame: { id: frame.id, title },
      today: laToday(opts.now?.()),
      seats: await Promise.all(seats.map(async (s) => ({ ...publicSeat(s), key: await seatKeyFor(ownerKey, frame.id, s.day, s.key_version), version: s.key_version }))),
      hidden: hidden.map((p) => publicPost(p, true)),
    });
  });
}

export { dayOf };
