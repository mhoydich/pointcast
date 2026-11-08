/**
 * The Communicator (/api/communicator) — the request handlers behind the route files, so plain node
 * can test them (the routes import courts-schedule.json, which node cannot load without an attribute;
 * they pass it in as `venues`, like air-board-store.ts). Matched to docs/prd/communicator-v1.md 4.2.
 *
 * Session and tier (the one place it is decided):
 *   - no valid pc_session cookie                          -> 401 unauthenticated
 *   - a session whose user has an identity with provider
 *     'google' or 'kukai'                                 -> tier 2 (may host: /request, /games)
 *   - any other signed-in user                            -> tier 1 (may use /me and read their games)
 *   - a signed-in user's handle is their profile's handle, found by user_id; no profile, no handle.
 * Order of checks: AUTH_DB bound (503) -> same-origin on writes (403) -> session (401) -> tier (403) -> body (400).
 */
// @ts-ignore — plain modules shared with the tests and the browser
import * as E from '../../public/communicator/engine.mjs';
// @ts-ignore — plain modules shared with the tests and the browser
import * as L from '../../public/communicator/ledger.mjs';
import { readSessionFromRequest } from '../api/auth/session.ts';
import type { PointCastUser } from '../../src/lib/auth/types.ts';
import {
  confirmedLedger, declaredLevels, expireMessagesFor, fail, getGame, getProfileByUser, handleTaken, isPlayerIn, json, laNowIso,
  listCandidateProfiles, listGamesFor, listPendingMessages, putGame, ratingsFor, unavailable, upsertProfile,
  type CommunicatorEnv, type Game, type Profile, type Venue,
} from './communicator-store.ts';

export type Ctx = { request: Request; env: CommunicatorEnv; venues: Venue[]; now?: number };

const LADDER = L.DEFAULT_LADDER.id as string;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
// TODO(v1-b): rate-limit these writes through PC_RATES_KV like the rest of the API.

type Actor = { user: PointCastUser; tier: 1 | 2; profile: Profile | null };

export const tierOf = (user: PointCastUser): 1 | 2 => (user.identities || []).some((i) => i.provider === 'google' || i.provider === 'kukai') ? 2 : 1;

async function readActor(ctx: Ctx): Promise<Actor | Response> {
  const db = ctx.env.AUTH_DB as D1Database;
  let s;
  try { s = await readSessionFromRequest(ctx.request, ctx.env); } catch { return unavailable(); }
  if (!s) return fail('unauthenticated');
  return { user: s.user, tier: tierOf(s.user), profile: await getProfileByUser(db, s.user.userId) };
}

function sameOrigin(request: Request): boolean {
  const o = request.headers.get('Origin');
  return !o || o === new URL(request.url).origin;
}

async function readBody(request: Request): Promise<Record<string, any> | Response> {
  const text = await request.text();
  if (text.length > 16_384) return fail('bad-request');
  try {
    const b = JSON.parse(text);
    return b && typeof b === 'object' && !Array.isArray(b) ? b : fail('bad-json');
  } catch { return fail('bad-json'); }
}

/** Common front matter for the session routes. */
async function gate(ctx: Ctx, { write, tier }: { write: boolean; tier: 1 | 2 }): Promise<Actor | Response> {
  if (!ctx.env.AUTH_DB) return unavailable();
  if (write && !sameOrigin(ctx.request)) return fail('bad-origin');
  const a = await readActor(ctx);
  if (a instanceof Response) return a;
  if (a.tier < tier) return fail('tier-2-required');
  return a;
}

const nowOf = (ctx: Ctx) => ctx.now ?? Date.now();

// ---- POST /request ----------------------------------------------------------------------
export async function postRequest(ctx: Ctx): Promise<Response> {
  const a = await gate(ctx, { write: true, tier: 2 });
  if (a instanceof Response) return a;
  const body = await readBody(ctx.request);
  if (body instanceof Response) return body;
  if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 500) return fail('bad-request');
  if (body.ladder !== undefined && body.ladder !== LADDER) return fail('unknown-ladder');
  const db = ctx.env.AUTH_DB as D1Database;
  const now = laNowIso(nowOf(ctx));
  const parsed = E.parseRequest(body.text, { now, venues: ctx.venues, defaultLadder: LADDER });
  if (!parsed.ok) return json({ ok: true, complete: false, request: parsed.request, missing: parsed.missing, slots: [], candidates: [] });
  const venue = ctx.venues.find((v) => v.id === parsed.request.venue);
  const slots = venue ? E.proposeSlots(parsed.request, venue, { now }) : [];
  const [profiles, entries, declared] = await Promise.all([listCandidateProfiles(db, LADDER), confirmedLedger(db, LADDER), declaredLevels(db, LADDER)]);
  const ratings = ratingsFor(profiles.map((p) => p.handle), entries, declared, now);
  const seed = Number.isInteger(body.seed) ? body.seed : 1;
  const candidates = E.findCandidates(parsed.request, { profiles, ratings, now, exclude: a.profile ? [a.profile.handle] : [], seed, venues: ctx.venues }).slice(0, 20);
  return json({ ok: true, complete: true, request: parsed.request, missing: [], slots, candidates });
}

// ---- POST /games ------------------------------------------------------------------------
export async function postGame(ctx: Ctx): Promise<Response> {
  const a = await gate(ctx, { write: true, tier: 2 });
  if (a instanceof Response) return a;
  if (!a.profile) return fail('profile-required');
  const body = await readBody(ctx.request);
  if (body instanceof Response) return body;
  const request = body.request;
  if (!request || request.schema !== 'coordination/request/1' || typeof request.venue !== 'string' || request.ladder !== LADDER) return fail('bad-request');
  const venue = ctx.venues.find((v) => v.id === request.venue);
  if (!venue) return fail('bad-request');
  const now = laNowIso(nowOf(ctx));
  // The slot must be one the engine would offer for this request now: a client cannot invent a time.
  const offered = E.proposeSlots(request, venue, { now }) as { start: string; end: string }[];
  const slot = offered.find((s) => s.start === body.slot?.start && s.end === body.slot?.end);
  if (!slot) return fail('bad-slot');
  const handles = body.candidates;
  if (!Array.isArray(handles) || handles.length > 12 || handles.some((h) => typeof h !== 'string')) return fail('bad-candidates');
  const db = ctx.env.AUTH_DB as D1Database;
  const eligible = new Set((await listCandidateProfiles(db, LADDER)).map((p) => p.handle));
  const picked = [...new Set(handles as string[])];
  if (picked.includes(a.profile.handle) || picked.some((h) => !eligible.has(h))) return fail('bad-candidates');
  const made = E.createGame(request, { venue, slot, host: a.profile.handle, hostDisplay: a.profile.display, ladder: LADDER, now, seed: Number.isInteger(body.seed) ? body.seed : 0 });
  const game = { ...made.game, candidates: picked } as Game; // handles for v1-b's invite(); not a roster
  if (await getGame(db, game.id)) return json({ ok: true, game: await getGame(db, game.id), existing: true });
  await putGame(db, game, { at: nowOf(ctx) });
  return json({ ok: true, game });
}

// ---- GET /games/:id ---------------------------------------------------------------------
export async function getGameRoute(ctx: Ctx, id: string): Promise<Response> {
  const a = await gate(ctx, { write: false, tier: 1 });
  if (a instanceof Response) return a;
  const game = await getGame(ctx.env.AUTH_DB as D1Database, id);
  if (!game) return fail('not-found');
  if (!a.profile || !isPlayerIn(game, a.profile.handle)) return fail('not-your-game');
  return json({ ok: true, game });
}

// ---- /me ----------------------------------------------------------------------------------
export async function getMe(ctx: Ctx): Promise<Response> {
  const a = await gate(ctx, { write: false, tier: 1 });
  if (a instanceof Response) return a;
  if (!a.profile) return json({ ok: true, profile: null, tier: a.tier, games: [], messages: [] });
  const db = ctx.env.AUTH_DB as D1Database;
  const [games, messages] = await Promise.all([listGamesFor(db, a.profile.handle), listPendingMessages(db, a.profile.handle)]);
  return json({ ok: true, profile: a.profile, tier: a.tier, games, messages });
}

const ALLOWED = new Set(['availability', 'venues', 'consent', 'channels', 'ladders', 'display']);
const CONTACT_KEYS = new Set(['contact', 'email', 'phone', 'push', 'sms', 'tel', 'address']);
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Validates a PUT /me body into a patch, or returns the refusal. */
function parsePatch(body: Record<string, any>, venues: Venue[]): Record<string, any> | Response {
  for (const k of Object.keys(body)) {
    if (CONTACT_KEYS.has(k)) return fail('contact-not-editable');
    if (!ALLOWED.has(k)) return fail('unknown-field', { field: k });
  }
  const bad = (field: string) => fail('bad-field', { field });
  const patch: Record<string, any> = {};
  if ('display' in body) {
    if (typeof body.display !== 'string' || !body.display.trim() || body.display.length > 60 || /[@<>]/.test(body.display) || (body.display.match(/\d/g) || []).length >= 7) return bad('display');
    patch.display = body.display.trim();
  }
  if ('availability' in body) {
    const av = body.availability;
    if (!Array.isArray(av) || av.length > 14) return bad('availability');
    for (const w of av) {
      if (!isObj(w) || !Array.isArray(w.days) || !w.days.length || w.days.some((d: any) => !Number.isInteger(d) || d < 0 || d > 6)
        || !HHMM.test(w.start) || !HHMM.test(w.end) || w.start >= w.end) return bad('availability');
    }
    patch.availability = av.map((w: any) => ({ days: [...new Set<number>(w.days)].sort(), start: w.start, end: w.end }));
  }
  if ('venues' in body) {
    if (!Array.isArray(body.venues) || body.venues.some((v: any) => !venues.some((x) => x.id === v))) return bad('venues');
    patch.venues = [...new Set<string>(body.venues)];
  }
  if ('consent' in body) {
    const c = body.consent;
    if (!isObj(c) || Object.keys(c).some((k) => !['communicator', 'contactableBy', 'listed'].includes(k))) return bad('consent');
    if (['communicator', 'listed'].some((k) => k in c && typeof c[k] !== 'boolean')) return bad('consent');
    if ('contactableBy' in c && (!Array.isArray(c.contactableBy) || c.contactableBy.some((x: any) => x !== 'ladder-peers'))) return bad('consent');
    patch.consent = c;
  }
  if ('channels' in body) {
    const c = body.channels;
    if (!isObj(c) || Object.keys(c).some((k) => !['sms', 'email', 'push', 'quietHours'].includes(k))) return bad('channels');
    if (['sms', 'email', 'push'].some((k) => k in c && typeof c[k] !== 'boolean')) return bad('channels');
    if ('quietHours' in c && (!isObj(c.quietHours) || !HHMM.test(c.quietHours.start) || !HHMM.test(c.quietHours.end))) return bad('channels');
    patch.channels = c;
  }
  if ('ladders' in body) {
    const l = body.ladders;
    if (!isObj(l)) return bad('ladders');
    patch.ladders = {};
    for (const [id, v] of Object.entries(l)) {
      if (id !== LADDER) return fail('unknown-ladder');
      if (!isObj(v) || Object.keys(v).some((k) => k !== 'declared') || !('declared' in v) || (v.declared !== null && !L.isLevel(v.declared))) return bad('ladders');
      patch.ladders[id] = { declared: v.declared };
    }
  }
  return patch;
}

/** Lowercase first name plus last initial ("Mike Hall" -> mikeh), de-duplicated with a digit suffix. */
export async function deriveHandle(db: D1Database, preferredName: string): Promise<string> {
  const raw = preferredName.includes('@') ? preferredName.split('@')[0] : preferredName;
  const words = raw.trim().split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  const base = (words.length > 1 ? words[0] + words[words.length - 1][0] : words[0] || 'player').slice(0, 24);
  for (let n = 1; n < 1000; n++) {
    const h = n === 1 ? base : `${base}${n}`;
    if (!(await handleTaken(db, h))) return h;
  }
  return `${base}${Date.now() % 100000}`;
}

function displayFrom(preferredName: string): string {
  const raw = preferredName.includes('@') ? preferredName.split('@')[0] : preferredName;
  const w = raw.trim().split(/\s+/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (!w.length) return 'Player';
  return w.length > 1 ? `${cap(w[0])} ${w[w.length - 1][0].toUpperCase()}.` : cap(w[0]);
}

export async function putMe(ctx: Ctx): Promise<Response> {
  const a = await gate(ctx, { write: true, tier: 1 });
  if (a instanceof Response) return a;
  const body = await readBody(ctx.request);
  if (body instanceof Response) return body;
  const patch = parsePatch(body, ctx.venues);
  if (patch instanceof Response) return patch;
  const db = ctx.env.AUTH_DB as D1Database;
  const at = nowOf(ctx);
  const existing = a.profile;
  const handle = existing?.handle ?? await deriveHandle(db, a.user.preferredName || '');
  const wasOn = !!existing?.consent.communicator;
  const base: Profile = existing ?? {
    schema: 'coordination/profile/1', id: L.stableId('cp_', handle, 10), handle, display: displayFrom(a.user.preferredName || ''), town: 'el-segundo',
    identity: { tier: a.tier, proofs: [] }, contact: {},
    channels: { sms: false, email: true, push: false, quietHours: { start: '21:00', end: '08:00' } },
    consent: { communicator: false, contactableBy: [], listed: false }, ladders: {}, availability: [], venues: [],
    recent: { gamesLast30: 0, lastInvitedAt: null },
  };
  const next: Profile = { ...base, ...(patch.display ? { display: patch.display } : {}) };
  if (patch.availability) next.availability = patch.availability;
  if (patch.venues) next.venues = patch.venues;
  if (patch.channels) next.channels = { ...base.channels, ...patch.channels, quietHours: { ...base.channels.quietHours, ...(patch.channels.quietHours || {}) } };
  if (patch.ladders) next.ladders = { ...base.ladders, ...patch.ladders };
  if (patch.consent) {
    const c = { ...base.consent, ...patch.consent };
    // Opting in without saying who may reach you means ladder peers; opting out clears the list.
    c.contactableBy = !c.communicator ? [] : patch.consent.contactableBy ?? (c.contactableBy.length ? c.contactableBy : ['ladder-peers']);
    next.consent = c;
  }
  // Identity facts and the email come from the verified session, never the body.
  next.identity = { tier: a.tier, proofs: (a.user.identities || []).map((i) => ({ provider: i.provider, verifiedAt: i.verifiedAt })) };
  const email = (a.user.identities || []).find((i) => i.provider === 'email' && i.id.includes('@'))?.id;
  next.contact = email ? { ...base.contact, email } : { ...base.contact };
  await upsertProfile(db, next, { userId: a.user.userId, at });
  if (wasOn && !next.consent.communicator) await expireMessagesFor(db, handle, { at });
  return json({ ok: true, profile: next, created: !existing });
}

// ---- GET /ledger/:ladder.json -------------------------------------------------------------
export async function getLedger(ctx: Ctx, ladder: string): Promise<Response> {
  if (!ctx.env.AUTH_DB) return unavailable();
  let id = ladder.replace(/\.json$/, '');
  try { id = decodeURIComponent(id); } catch { /* keep as given */ }
  if (id !== LADDER) return fail('unknown-ladder');
  ladder = id;
  const db = ctx.env.AUTH_DB;
  const now = new Date(nowOf(ctx)).toISOString();
  const entries = await confirmedLedger(db, ladder);
  const handles = [...new Set(entries.flatMap((e: any) => (e.sides || []).flatMap((s: any) => s.players || [])))] as string[];
  const ratings = ratingsFor(handles, entries, await declaredLevels(db, ladder), now);
  return json({ ok: true, ladder, generatedAt: now, entries, ratings: handles.map((h) => L.publicRating(ratings[h])) }, 200, { 'Cache-Control': 'public, max-age=60' });
}
