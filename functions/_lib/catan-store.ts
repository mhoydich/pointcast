/**
 * Hex & Harbor storage (VISITS KV). See src/lib/catan.ts for the shapes.
 *
 *   catan:tables              → { tables: StoredTable[] } upcoming meetups,
 *                               pruned 6h after start, capped at TABLE_CAP
 *   catan:rate:{kind}:{ip}    → attempts in the current window (TTL'd)
 *   catan:seal:{id}           → one sealed table (secret held until reveal)
 *   catan:seal:recent         → newest sealed table ids, capped at 50
 *
 * The IP is only ever stored as a salted sha256 prefix inside a TTL'd key.
 * KV is last-writer-wins; two seats taken in the same second can race. That
 * is acceptable for a meetup board and is why seat counts are re-checked on
 * every write rather than trusted from the client.
 */
import {
  forgeBoard, sealCommitment, sealRoll, sha256Hex, SEAL_ROLLS, CATAN_ORIGIN,
  type TableInput,
} from '../../src/lib/catan.ts';

export interface CatanEnv {
  VISITS?: KVNamespace;
}

export const CATAN_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export const catanJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: CATAN_HEADERS });

export const catanOptions = async () => new Response(null, { status: 204, headers: CATAN_HEADERS });

const TABLES_KEY = 'catan:tables';
const TABLE_CAP = 300;
const STALE_AFTER_MS = 6 * 3600_000;

export interface StoredTable extends TableInput {
  id: string;
  created: string;
  seated: string[];
  hostKeyHash: string;
}

export type PublicTable = Omit<StoredTable, 'hostKeyHash'> & { open: number; url: string };

export function publicTable(t: StoredTable): PublicTable {
  const { hostKeyHash: _omit, ...rest } = t;
  return { ...rest, open: Math.max(0, t.seats - t.seated.length), url: `${CATAN_ORIGIN}/?table=${t.id}#tables` };
}

export async function loadTables(kv: KVNamespace, now = Date.now()): Promise<StoredTable[]> {
  const raw = await kv.get(TABLES_KEY, 'json').catch(() => null) as { tables?: StoredTable[] } | null;
  const tables = Array.isArray(raw?.tables) ? raw!.tables : [];
  return tables
    .filter((t) => Date.parse(t.when) > now - STALE_AFTER_MS)
    .sort((a, b) => a.when.localeCompare(b.when));
}

export async function saveTables(kv: KVNamespace, tables: StoredTable[]): Promise<void> {
  await kv.put(TABLES_KEY, JSON.stringify({ tables: tables.slice(0, TABLE_CAP) }));
}

export function randomId(bytes = 6): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return [...b].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, bytes * 2);
}

export function randomSecret(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Small per-IP budget per window. Returns true when the caller is over. */
export async function overBudget(kv: KVNamespace, request: Request, kind: string, budget: number, windowSeconds = 600): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local';
  const key = `catan:rate:${kind}:${(await sha256Hex(`catan-rate:${ip}`)).slice(0, 20)}`;
  const count = Number(await kv.get(key).catch(() => '0')) || 0;
  if (count >= budget) return true;
  await kv.put(key, String(count + 1), { expirationTtl: Math.max(60, windowSeconds) });
  return false;
}

export async function readBody(request: Request, max = 4096): Promise<Record<string, unknown> | null> {
  const text = await request.text().catch(() => '');
  if (!text || text.length > max) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

// ── Sealed tables ──────────────────────────────────────────────────────────

const SEAL_TTL_SECONDS = 90 * 86400;
const RECENT_KEY = 'catan:seal:recent';

export interface StoredSeal {
  id: string;
  created: string;
  title: string;
  players: number;
  boardSeed: string;
  commitment: string;
  secret: string;
  rollKeyHash: string;
  rolls: Array<[number, number]>;
  revealed: boolean;
  payer: string | null;
  receiptHash: string | null;
}

export function publicSeal(s: StoredSeal) {
  const totals = s.rolls.map(([a, b]) => a + b);
  return {
    id: s.id,
    created: s.created,
    title: s.title,
    players: s.players,
    board: { seed: s.boardSeed, url: `${CATAN_ORIGIN}/?seed=${encodeURIComponent(s.boardSeed)}#forge`, json: `https://pointcast.xyz/api/catan/board?seed=${encodeURIComponent(s.boardSeed)}` },
    commitment: s.commitment,
    commitmentRule: 'sha256("pointcast.catan.seal:" + secret)',
    rollRule: 'roll i = sha256(secret + ":" + i) read as hex byte pairs; skip bytes >= 252; die = byte % 6 + 1; first two kept bytes are die A and die B',
    rolled: s.rolls.length,
    remaining: SEAL_ROLLS - s.rolls.length,
    rolls: s.rolls,
    sevens: totals.filter((t) => t === 7).length,
    revealed: s.revealed,
    secret: s.revealed ? s.secret : null,
    payer: s.payer,
    receiptHash: s.receiptHash,
    url: `${CATAN_ORIGIN}/seal/?id=${s.id}`,
  };
}

export async function createSeal(
  kv: KVNamespace,
  input: { title?: unknown; players?: unknown; seed?: unknown },
  paid: { payer: string | null; receiptHash: string | null },
): Promise<{ seal: StoredSeal; rollKey: string }> {
  const title = typeof input.title === 'string' && input.title.trim() ? input.title.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 60) : 'A sealed table';
  const playersN = Number(input.players ?? 4);
  const players = Number.isInteger(playersN) && playersN >= 2 && playersN <= 6 ? playersN : 4;
  const secret = randomSecret();
  const rollKey = `rk_${randomSecret().slice(0, 32)}`;
  const id = randomId(5);
  const boardSeed = forgeBoard(typeof input.seed === 'string' && input.seed.trim() ? input.seed : `seal-${id}`).seed;
  const seal: StoredSeal = {
    id,
    created: new Date().toISOString(),
    title,
    players,
    boardSeed,
    commitment: await sealCommitment(secret),
    secret,
    rollKeyHash: await sha256Hex(`catan-rollkey:${rollKey}`),
    rolls: [],
    revealed: false,
    payer: paid.payer,
    receiptHash: paid.receiptHash,
  };
  await kv.put(`catan:seal:${id}`, JSON.stringify(seal), { expirationTtl: SEAL_TTL_SECONDS });
  const recent = (await kv.get(RECENT_KEY, 'json').catch(() => null) as string[] | null) ?? [];
  await kv.put(RECENT_KEY, JSON.stringify([id, ...recent.filter((x) => x !== id)].slice(0, 50)));
  return { seal, rollKey };
}

export async function loadSeal(kv: KVNamespace, id: string): Promise<StoredSeal | null> {
  if (!/^[a-z0-9]{4,16}$/.test(id)) return null;
  return await kv.get(`catan:seal:${id}`, 'json').catch(() => null) as StoredSeal | null;
}

export async function recentSeals(kv: KVNamespace): Promise<StoredSeal[]> {
  const ids = (await kv.get(RECENT_KEY, 'json').catch(() => null) as string[] | null) ?? [];
  const seals = await Promise.all(ids.slice(0, 12).map((id) => loadSeal(kv, id)));
  return seals.filter((s): s is StoredSeal => !!s);
}

export async function rollSeal(kv: KVNamespace, seal: StoredSeal): Promise<StoredSeal> {
  if (seal.revealed || seal.rolls.length >= SEAL_ROLLS) return seal;
  seal.rolls.push(await sealRoll(seal.secret, seal.rolls.length));
  if (seal.rolls.length >= SEAL_ROLLS) seal.revealed = true;
  await kv.put(`catan:seal:${seal.id}`, JSON.stringify(seal), { expirationTtl: SEAL_TTL_SECONDS });
  return seal;
}

export async function revealSeal(kv: KVNamespace, seal: StoredSeal): Promise<StoredSeal> {
  seal.revealed = true;
  await kv.put(`catan:seal:${seal.id}`, JSON.stringify(seal), { expirationTtl: SEAL_TTL_SECONDS });
  return seal;
}

export async function rollKeyMatches(seal: StoredSeal, rollKey: unknown): Promise<boolean> {
  return typeof rollKey === 'string' && rollKey.length < 80 && (await sha256Hex(`catan-rollkey:${rollKey}`)) === seal.rollKeyHash;
}
