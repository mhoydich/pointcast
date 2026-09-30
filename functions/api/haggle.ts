/**
 * /api/haggle — the Haggle Counter. Gus sells house curios (numbered, signed
 * stubs; nothing ships) and you, or your agent, haggle.
 *
 *   GET  /api/haggle                      the shelf, the board, recent deals
 *   GET  /api/haggle?session=h_...        one haggle
 *   POST /api/haggle  {item, offer, message?, who, kind?}        start a haggle with an opening offer (cents)
 *   POST /api/haggle  {session, offer | accept: true, message?}  next move
 *
 * A struck deal can be paid at exactly the agreed price through the x402 rail:
 * POST /api/agent/haggle-pay {session}. Unpaid deals still count on the board.
 */
import { cents, haggleScore, haggleTurn, HAGGLE_ITEMS, HAGGLE_SCHEMA, itemById, newHaggle, type HaggleState } from '../../src/lib/haggle.ts';
import { rateLimit } from '../_rate-limit.ts';
import { attestShop, clean, ipHash, newId, readBody, shopJson, shopOptions, tablesExist, type ShopEnv } from '../_lib/shop-agents.ts';

type Row = { id: string; created_at: number; updated_at: number; item_id: string; who: string; kind: string; status: string; deal_cents: number | null; score: number | null; rounds: number; state: string; stub_no: number | null; receipt_hash: string | null };

const shelf = () => HAGGLE_ITEMS.map(({ floor: _floor, patience: _patience, ...i }) => ({ ...i, listText: cents(i.list), image: `https://pointcast.xyz${i.image}` }));

function publicSession(r: Row) {
  const state = JSON.parse(r.state) as HaggleState;
  const item = itemById(r.item_id)!;
  return {
    id: r.id, url: `https://pointcast.xyz/shop/haggle?session=${r.id}`, item: { id: item.id, name: item.name, list: item.list },
    who: r.who, kind: r.kind, status: r.status, ask: state.ask, askText: cents(state.ask), lastPrice: state.finalOffer,
    deal: r.deal_cents, dealText: r.deal_cents ? cents(r.deal_cents) : null, score: r.score, rounds: r.rounds,
    stub: r.stub_no ? `${item.id}-${String(r.stub_no).padStart(3, '0')}` : null, paid: r.status === 'paid',
    bonuses: state.bonuses, turns: state.turns, updatedAt: new Date(r.updated_at).toISOString(),
    ...(r.status === 'deal' ? { pay: { endpoint: 'https://pointcast.xyz/api/agent/haggle-pay', method: 'POST', body: { session: r.id }, price: cents(r.deal_cents!), rail: 'x402 v2, USDC on Etherlink' } } : {}),
  };
}

export const onRequestOptions = () => shopOptions();

export const onRequestGet: PagesFunction<ShopEnv> = async ({ request, env }) => {
  const base = { ok: true, schema: HAGGLE_SCHEMA, counter: 'https://pointcast.xyz/shop/haggle', shopkeeper: 'Gus', shelf: shelf(), rules: 'Offer in whole cents. Gus counters, and each item has a hidden floor and a limited patience. Lowballs cost patience. Manners, being local, playing at the courts, and agents who say they are agents each earn a cent, once. When patience runs out he names a last price. Deals are real prices; paying is optional and goes through x402.' };
  if (!env.AUTH_DB || !await tablesExist(env.AUTH_DB)) return shopJson({ ...base, board: [], recent: [], open: false });
  const sessionId = new URL(request.url).searchParams.get('session');
  if (sessionId) {
    const row = await env.AUTH_DB.prepare('SELECT * FROM haggle_sessions WHERE id = ?').bind(sessionId).first<Row>();
    return row ? shopJson({ ok: true, schema: HAGGLE_SCHEMA, session: publicSession(row) }) : shopJson({ ok: false, error: 'No such haggle.' }, 404);
  }
  const board = (await env.AUTH_DB.prepare("SELECT * FROM haggle_sessions WHERE status IN ('deal','paid') ORDER BY score DESC, rounds ASC, updated_at ASC LIMIT 10").all<Row>()).results;
  const recent = (await env.AUTH_DB.prepare("SELECT * FROM haggle_sessions WHERE status != 'open' ORDER BY updated_at DESC LIMIT 12").all<Row>()).results;
  const stats = await env.AUTH_DB.prepare("SELECT COUNT(*) AS haggles, SUM(status IN ('deal','paid')) AS deals, SUM(status = 'paid') AS paid, SUM(status = 'walked') AS walked FROM haggle_sessions").first();
  const slim = (r: Row) => { const s = publicSession(r); return { id: s.id, item: s.item.name, who: s.who, kind: s.kind, deal: s.dealText, score: s.score, rounds: s.rounds, status: s.status, stub: s.stub, paid: s.paid }; };
  return shopJson({ ...base, open: true, stats, board: board.map(slim), recent: recent.map(slim) });
};

export const onRequestPost: PagesFunction<ShopEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB || !await tablesExist(env.AUTH_DB)) return shopJson({ ok: false, error: 'Gus hasn’t opened the counter yet.' }, 503);
  const limited = await rateLimit(request, env, { bucket: 'shop:haggle', windowSec: 600, maxRequests: 90 });
  if (!limited.allowed) return shopJson({ ok: false, error: 'Gus needs a breather. Try again in a few minutes.' }, 429, { 'Retry-After': String(limited.retryAfter) });
  let body: Record<string, unknown>;
  try { body = await readBody(request, 2_048); } catch (error) { return shopJson({ ok: false, error: error instanceof Error ? error.message : 'invalid body' }, 400); }
  const message = clean(body.message, 200);
  const move = { offer: body.offer === undefined ? undefined : Number(body.offer), accept: body.accept === true, message };
  const now = Date.now();

  let row: Row | null = null;
  let state: HaggleState;
  const sessionId = clean(body.session, 40);
  if (sessionId) {
    row = await env.AUTH_DB.prepare('SELECT * FROM haggle_sessions WHERE id = ?').bind(sessionId).first<Row>();
    if (!row) return shopJson({ ok: false, error: 'No such haggle.' }, 404);
    state = JSON.parse(row.state) as HaggleState;
  } else {
    const item = itemById(clean(body.item, 40));
    if (!item) return shopJson({ ok: false, error: `Pick an item: ${HAGGLE_ITEMS.map((i) => i.id).join(', ')}.` }, 400);
    const starts = await rateLimit(request, env, { bucket: 'shop:haggle-start', windowSec: 3600, maxRequests: 12 });
    if (!starts.allowed) return shopJson({ ok: false, error: 'Twelve haggles an hour. Gus has other customers.' }, 429, { 'Retry-After': String(starts.retryAfter) });
    state = newHaggle(item);
  }
  const item = itemById(state.item)!;
  if (move.offer === undefined && !move.accept) return shopJson({ ok: false, error: 'Send an offer in cents, or accept: true.' }, 400);
  const result = haggleTurn(item, state, move);
  if (!result.ok) return shopJson({ ok: false, error: result.reply, session: row ? publicSession(row) : null }, 400);
  const s = result.state;
  const status = s.status;
  const score = s.deal !== null ? haggleScore(item, s.deal) : null;

  if (!row) {
    const who = clean(body.who, 40) || 'A customer';
    const kind = body.kind === 'agent' ? 'agent' : 'human';
    row = { id: newId('h'), created_at: now, updated_at: now, item_id: item.id, who, kind, status, deal_cents: s.deal, score, rounds: s.round, state: JSON.stringify(s), stub_no: null, receipt_hash: null };
    await env.AUTH_DB.prepare('INSERT INTO haggle_sessions (id, created_at, updated_at, item_id, who, kind, status, deal_cents, score, rounds, state, stub_no, receipt_hash, ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(row.id, now, now, item.id, who, kind, status, s.deal, score, s.round, row.state, null, null, await ipHash(request)).run();
  } else {
    const write = await env.AUTH_DB.prepare("UPDATE haggle_sessions SET updated_at = ?, status = ?, deal_cents = ?, score = ?, rounds = ?, state = ? WHERE id = ? AND status = 'open' AND updated_at = ?")
      .bind(now, status, s.deal, score, s.round, JSON.stringify(s), row.id, row.updated_at).run();
    if ((write.meta.changes ?? 0) !== 1) return shopJson({ ok: false, error: 'That haggle moved on without you. Reload it.' }, 409);
    row = { ...row, updated_at: now, status, deal_cents: s.deal, score, rounds: s.round, state: JSON.stringify(s) };
  }
  let ticket = null;
  if (status === 'deal') {
    await env.AUTH_DB.prepare('UPDATE haggle_sessions SET stub_no = (SELECT COALESCE(MAX(stub_no), 0) + 1 FROM haggle_sessions WHERE item_id = ?) WHERE id = ? AND stub_no IS NULL').bind(item.id, row.id).run();
    const fresh = await env.AUTH_DB.prepare('SELECT * FROM haggle_sessions WHERE id = ?').bind(row.id).first<Row>();
    if (fresh) row = fresh;
    ticket = await attestShop(env, 'haggle-deal', { session: row.id, item: item.id, name: item.name, list: item.list, deal: s.deal, stub: row.stub_no, who: row.who, rounds: s.round });
  }
  return shopJson({ ok: true, reply: result.reply, session: publicSession(row), ...(ticket ? { ticket } : {}) }, row.created_at === now ? 201 : 200);
};
