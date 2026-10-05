/**
 * /api/catan/games — finished games logged from the Table Clock (/catan/clock).
 *
 * POST { table?, target, players:[{name,color,vp}], winner, road?, army?, turns, minutes, rolls, seed? }
 *      → { ok, game, url } — the game card lives at /catan/game/?id=
 * GET  ?id=     → one game
 * GET  ?table=  → games logged at a hosted table (newest first)
 * GET           → the newest games across the club, plus club tallies
 *
 * KV: catan:game:{id} (1 year) · catan:games:recent (ids, 60) · catan:games:table:{id} (ids, 60)
 * Budget: 6 games per IP per 10 minutes — a real table finishes one every hour or two.
 */
import { CATAN_ORIGIN, validateGame, type GameInput } from '../../../src/lib/catan.ts';
import { catanJson, catanOptions, overBudget, randomId, readBody, type CatanEnv } from '../../_lib/catan-store.ts';

export const onRequestOptions = catanOptions;

const TTL = 365 * 86400;
type Stored = GameInput & { id: string; t: string };
const url = (id: string) => `${CATAN_ORIGIN}/game/?id=${id}`;

async function ids(kv: KVNamespace, key: string): Promise<string[]> {
  return ((await kv.get(key, 'json').catch(() => null)) as string[] | null) ?? [];
}
async function load(kv: KVNamespace, id: string): Promise<Stored | null> {
  if (!/^[a-z0-9]{4,16}$/.test(id)) return null;
  return (await kv.get(`catan:game:${id}`, 'json').catch(() => null)) as Stored | null;
}
async function many(kv: KVNamespace, list: string[]): Promise<Stored[]> {
  return (await Promise.all(list.slice(0, 20).map((id) => load(kv, id)))).filter((g): g is Stored => !!g);
}
const pub = (g: Stored) => ({ ...g, url: url(g.id) });

export const onRequestGet: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: true, games: [] });
  const q = new URL(request.url).searchParams;
  const id = q.get('id');
  if (id) {
    const g = await load(env.VISITS, id);
    return g ? catanJson({ ok: true, game: pub(g) }) : catanJson({ ok: false, error: 'no such game' }, 404);
  }
  const table = q.get('table');
  if (table) {
    const games = await many(env.VISITS, await ids(env.VISITS, `catan:games:table:${table}`));
    return catanJson({ ok: true, table, count: games.length, games: games.map(pub) });
  }
  const games = await many(env.VISITS, await ids(env.VISITS, 'catan:games:recent'));
  const wins: Record<string, number> = {};
  for (const g of games) { const w = g.players[g.winner].name; wins[w] = (wins[w] || 0) + 1; }
  const minutes = games.map((g) => g.minutes).filter((m) => m > 0);
  return catanJson({
    ok: true,
    count: games.length,
    tallies: {
      winners: Object.entries(wins).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, wins: count })),
      medianMinutes: minutes.length ? minutes.sort((a, b) => a - b)[Math.floor(minutes.length / 2)] : null,
    },
    games: games.map(pub),
  });
};

export const onRequestPost: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the game store is offline' }, 503);
  const body = await readBody(request, 4096);
  if (!body) return catanJson({ ok: false, error: 'send a JSON game' }, 400);
  const v = validateGame(body);
  if (!v.ok) return catanJson(v, 400);
  if (await overBudget(env.VISITS, request, 'game', 6)) return catanJson({ ok: false, error: 'too many games logged from here; try again soon' }, 429);
  const game: Stored = { ...v.game, id: randomId(5), t: new Date().toISOString() };
  await env.VISITS.put(`catan:game:${game.id}`, JSON.stringify(game), { expirationTtl: TTL });
  const push = async (key: string) => env.VISITS!.put(key, JSON.stringify([game.id, ...(await ids(env.VISITS!, key))].slice(0, 60)));
  await push('catan:games:recent');
  if (game.table) await push(`catan:games:table:${game.table}`);
  return catanJson({ ok: true, game: pub(game), url: url(game.id) }, 201);
};
