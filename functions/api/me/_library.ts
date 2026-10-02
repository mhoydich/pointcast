/** Owner drafts and explicitly published projections. Never serialize private rows publicly. */
import { readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { ensureKeepsMigrated } from './_keeps-store.ts';
import { canPublishSavedSource } from './_public-eligibility.ts';

export type MeEnv = AuthEnv & { VISITS?: KVNamespace; ME_KEEPS_D1?: string };
export type MeSessionReader = typeof readSessionFromRequest;
export type Member = { keepId: string; itemId: string; membershipId: string; caption: string };
export type KeepRow = { id: string; item_id: string; data_json: string };
export type CollectionRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  items_json: string;
  version: number;
  published_json: string | null;
  published_at: string | null;
  hidden: number;
  created_at: string;
  updated_at: string;
};
export type ProfileDraft = {
  name: string;
  bio: string;
  noun: number;
  links: { label: string; url: string }[];
  featured: string[];
};
export type ProfileRow = {
  user_id: string;
  public_id: string;
  draft_json: string;
  version: number;
  published_json: string | null;
  published_at: string | null;
  hidden: number;
  updated_at: string;
};
export type PublicCard = {
  title: string;
  url: string;
  site: string;
  kind: 'post' | 'link';
  caption: string;
};
type PublishedCard = PublicCard & { itemId: string; membershipId: string };
export type CollectionSnapshot = { title: string; description: string; items: PublishedCard[] };

export class MeError extends Error {
  status: number;
  reason: string;
  constructor(status: number, reason: string, message = reason) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}
export const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' },
  });
export const failure = (error: unknown) =>
  error instanceof MeError
    ? json({ ok: false, reason: error.reason, error: error.message }, error.status)
    : json(
        {
          ok: false,
          reason: 'storage-unavailable',
          error: 'Your library is unavailable. Please try again.',
        },
        503,
      );
export const ownOrigin = (r: Request) => {
  const origin = r.headers.get('Origin');
  const site = r.headers.get('Sec-Fetch-Site');
  return (
    (!origin || origin === new URL(r.url).origin) &&
    (site === 'same-origin' || (!site && origin === new URL(r.url).origin))
  );
};
export async function body(r: Request): Promise<Record<string, unknown>> {
  const reader = r.body?.getReader();
  if (!reader) throw new MeError(400, 'invalid-json');
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 1_000_000) {
        await reader.cancel();
        throw new MeError(413, 'body-too-large');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let at = 0;
    for (const part of chunks) {
      bytes.set(part, at);
      at += part.length;
    }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('shape');
    return data;
  } catch (e) {
    if (e instanceof MeError) throw e;
    throw new MeError(400, 'invalid-json');
  }
}
export function text(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string') throw new MeError(400, 'invalid-text');
  const clean = value.replace(/[\x00-\x1f\x7f]/g, ' ').trim();
  if (Array.from(clean).length > max || (required && !clean))
    throw new MeError(400, 'invalid-length', `Use ${required ? '1–' : 'up to '}${max} characters.`);
  return clean;
}
export function publicUrl(input: unknown): string {
  if (typeof input !== 'string' || input.length > 600) throw new MeError(400, 'invalid-url');
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new MeError(400, 'invalid-url');
  }
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    !host.includes('.') ||
    /^[\d.]+$/.test(host) ||
    host.includes(':') ||
    host.endsWith('.') ||
    /(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|onion)$/.test(host)
  )
    throw new MeError(400, 'invalid-public-url', 'Choose a public HTTPS link.');
  const sensitive =
    /^(access[_-]?token|refresh[_-]?token|token|api[_-]?key|key|auth|authorization|password|secret|signature|sig|code|x-amz-.+)$/i;
  if (
    Array.from(url.searchParams.keys()).some((key) => sensitive.test(key)) ||
    /(?:token|secret|password|auth|api[_-]?key)=/i.test(url.hash)
  )
    throw new MeError(
      400,
      'private-url',
      'This link may contain private access information. Publish a clean link instead.',
    );
  if (
    ['pointcast.xyz', 'www.pointcast.xyz'].includes(host) &&
    /^\/(?:api|auth|me|login|profile|dashboard|desk|admin)(?:\/|$)/.test(url.pathname)
  )
    throw new MeError(400, 'private-url', 'Private account pages cannot be published as cards.');
  return url.toString();
}
export function version(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1) throw new MeError(400, 'version-required');
  return Number(value);
}
export function id(value: unknown): string {
  if (typeof value !== 'string' || !/^(col|page)_[a-f0-9]{32}$/.test(value))
    throw new MeError(404, 'not-found');
  return value;
}
export const newId = (prefix: 'col' | 'page') =>
  `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
export async function owner(
  request: Request,
  env: MeEnv,
  readSession: MeSessionReader = readSessionFromRequest,
) {
  if (request.method !== 'GET' && !ownOrigin(request)) throw new MeError(403, 'cross-site');
  const session = await readSession(request, env);
  if (!session) throw new MeError(401, 'unauthorized');
  const expected = request.headers.get('X-PointCast-Account');
  if (request.method !== 'GET' && !expected)
    throw new MeError(400, 'account-required', 'Reload your account before making changes.');
  if (expected && expected !== session.user.userId)
    throw new MeError(409, 'account-changed', 'Your account changed. Reload before trying again.');
  if (!env.AUTH_DB) throw new MeError(503, 'unavailable');
  if (env.ME_KEEPS_D1 === 'pause' && request.method !== 'GET')
    throw new MeError(
      503,
      'migration-paused',
      'Your library is being upgraded. Your changes are still here; try again shortly.',
    );
  await ensureKeepsMigrated(env, session.user.userId);
  return { db: env.AUTH_DB, userId: session.user.userId, session };
}
export function collectionView(row: CollectionRow, liveItemIds: ReadonlySet<string>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    items: (JSON.parse(row.items_json) as Member[]).filter((member) =>
      liveItemIds.has(member.itemId),
    ),
    version: row.version,
    published: Boolean(row.published_json) && !row.hidden,
    publishedAt: row.published_at,
    hidden: Boolean(row.hidden),
    url: `/collections/${row.id}`,
  };
}
export function profileView(row: ProfileRow) {
  return {
    ...(JSON.parse(row.draft_json) as ProfileDraft),
    publicId: row.public_id,
    version: row.version,
    published: Boolean(row.published_json) && !row.hidden,
    publishedAt: row.published_at,
    hidden: Boolean(row.hidden),
    url: `/people/${row.public_id}`,
  };
}
export async function collection(db: D1Database, userId: string, collectionId: string) {
  const row = await db
    .prepare('SELECT * FROM me_collections WHERE user_id=? AND id=?')
    .bind(userId, collectionId)
    .first<CollectionRow>();
  if (!row) throw new MeError(404, 'not-found');
  return row;
}
export async function keeps(db: D1Database, userId: string) {
  return (
    await db
      .prepare('SELECT id,item_id,data_json FROM me_keeps WHERE user_id=?')
      .bind(userId)
      .all<KeepRow>()
  ).results;
}
export async function liveKeepIds(db: D1Database, userId: string): Promise<Set<string>> {
  const rows = await db
    .prepare('SELECT item_id FROM me_keeps WHERE user_id=?')
    .bind(userId)
    .all<{ item_id: string }>();
  return new Set(rows.results.map((row) => row.item_id));
}
export async function members(
  db: D1Database,
  userId: string,
  input: unknown,
  previous: Member[],
): Promise<Member[]> {
  if (!Array.isArray(input) || input.length > 300) throw new MeError(400, 'invalid-items');
  const rows = new Map((await keeps(db, userId)).map((k) => [k.id, k]));
  const seen = new Set<string>();
  return input.map((entry) => {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.keepId !== 'string' ||
      seen.has(entry.keepId)
    )
      throw new MeError(400, 'invalid-items');
    seen.add(entry.keepId);
    const keep = rows.get(entry.keepId);
    if (!keep)
      throw new MeError(
        400,
        'missing-keep',
        'One of these saved items is no longer available. Reload your shelf.',
      );
    const old = previous.find((m) => m.keepId === keep.id && m.itemId === keep.item_id);
    return {
      keepId: keep.id,
      itemId: keep.item_id,
      membershipId: old?.membershipId || crypto.randomUUID(),
      caption: text(entry.caption ?? '', 280),
    };
  });
}
export async function snapshot(db: D1Database, row: CollectionRow): Promise<CollectionSnapshot> {
  const all = new Map((await keeps(db, row.user_id)).map((k) => [k.item_id, k]));
  const selected = JSON.parse(row.items_json) as Member[];
  const cards = selected.map((m) => {
    const record = all.get(m.itemId);
    if (!record)
      throw new MeError(
        409,
        'missing-keep',
        'A saved item was removed. Update the collection before publishing.',
      );
    const keep = JSON.parse(record.data_json);
    if (!canPublishSavedSource(keep))
      throw new MeError(
        409,
        'source-publication-unavailable',
        'Saved Shortwave posts cannot be published yet. Keep them in your private collection and leave them out of the public selection.',
      );
    // A saved post is an excerpt, never an assertion that the saver authored it.
    const url =
      keep.kind === 'post'
        ? `https://pointcast.xyz/shortwave#${encodeURIComponent(keep.postId)}`
        : publicUrl(keep.url);
    return {
      itemId: m.itemId,
      membershipId: m.membershipId,
      title: text(
        keep.kind === 'post' ? keep.text : keep.title || new URL(url).hostname,
        280,
        true,
      ),
      url,
      site: keep.kind === 'post' ? 'Saved Shortwave excerpt' : new URL(url).hostname,
      kind: keep.kind as 'post' | 'link',
      caption: m.caption,
    };
  });
  return { title: row.title, description: row.description, items: cards };
}
export async function publicCollection(db: D1Database, collectionId: string) {
  const row = await db
    .prepare('SELECT * FROM me_collections WHERE id=? AND hidden=0 AND published_json IS NOT NULL')
    .bind(collectionId)
    .first<CollectionRow>();
  if (!row) throw new MeError(404, 'not-found');
  const published = JSON.parse(row.published_json!) as CollectionSnapshot;
  const membership = new Set((JSON.parse(row.items_json) as Member[]).map((m) => m.membershipId));
  const live = new Set(
    (await keeps(db, row.user_id))
      .filter((k) => canPublishSavedSource(JSON.parse(k.data_json)))
      .map((k) => k.item_id),
  );
  const items: PublicCard[] = published.items
    .filter((m) => canPublishSavedSource(m) && live.has(m.itemId) && membership.has(m.membershipId))
    .map((m) => ({ title: m.title, url: m.url, site: m.site, kind: m.kind, caption: m.caption }));
  return {
    title: published.title,
    description: published.description,
    items,
    url: `/collections/${row.id}`,
    publishedAt: row.published_at,
  };
}
export async function publicProfile(db: D1Database, publicId: string) {
  const row = await db
    .prepare(
      'SELECT * FROM me_profiles WHERE public_id=? AND hidden=0 AND published_json IS NOT NULL',
    )
    .bind(publicId)
    .first<ProfileRow>();
  if (!row) throw new MeError(404, 'not-found');
  const published = JSON.parse(row.published_json!) as ProfileDraft;
  const featured = [];
  for (const collectionId of published.featured) {
    // Ownership remains required even if a malformed old snapshot exists.
    const owned = await db
      .prepare('SELECT id FROM me_collections WHERE id=? AND user_id=?')
      .bind(collectionId, row.user_id)
      .first();
    if (!owned) continue;
    try {
      const value = await publicCollection(db, collectionId);
      featured.push({
        title: value.title,
        description: value.description,
        url: value.url,
        count: value.items.length,
      });
    } catch (e) {
      if (!(e instanceof MeError && e.status === 404)) throw e;
    }
  }
  return {
    name: published.name,
    bio: published.bio,
    noun: published.noun,
    links: published.links,
    featured,
    url: `/people/${row.public_id}`,
    publishedAt: row.published_at,
  };
}
export async function previewToken(value: unknown) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return Array.from(new Uint8Array(bytes), (v) => v.toString(16).padStart(2, '0')).join('');
}
export function safePreview(value: CollectionSnapshot) {
  return {
    title: value.title,
    description: value.description,
    items: value.items.map(({ title, url, site, kind, caption }) => ({
      title,
      url,
      site,
      kind,
      caption,
    })),
  };
}
export function selectSnapshot(value: CollectionSnapshot, row: CollectionRow, ids: unknown) {
  if (
    !Array.isArray(ids) ||
    ids.length > 300 ||
    ids.some((v) => typeof v !== 'string') ||
    new Set(ids).size !== ids.length
  )
    throw new MeError(400, 'selection-required');
  const members = JSON.parse(row.items_json) as Member[];
  const selected = new Set(ids as string[]);
  if (ids.some((v) => !members.some((m) => m.keepId === v)))
    throw new MeError(400, 'invalid-selection');
  const included = new Set(
    members.filter((m) => selected.has(m.keepId)).map((m) => m.membershipId),
  );
  return { ...value, items: value.items.filter((m) => included.has(m.membershipId)) };
}
