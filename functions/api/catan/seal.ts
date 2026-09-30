/**
 * /api/catan/seal — sealed tables (opened by the x402 action /api/agent/catan-seal).
 *
 * GET  ?id=       → the public seal: commitment, rolls so far, secret once revealed
 * GET  (no id)    → the dozen newest sealed tables
 * POST { id, rollKey, action: 'roll' }   → reveal the next roll (240 per table)
 * POST { id, rollKey, action: 'reveal' } → end the table and publish the secret
 *
 * Only the rollKey holder (the payer) can advance the dice. Anyone can verify:
 * sha256("pointcast.catan.seal:" + secret) must equal the commitment published
 * before the first roll, and every roll recomputes from the secret.
 */
import {
  catanJson, catanOptions, loadSeal, publicSeal, readBody, recentSeals, revealSeal, rollKeyMatches, rollSeal,
  type CatanEnv,
} from '../../_lib/catan-store.ts';

export const onRequestOptions = catanOptions;

export const onRequestGet: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the seal store is offline' }, 503);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    const seals = await recentSeals(env.VISITS);
    return catanJson({ ok: true, seals: seals.map((s) => { const p = publicSeal(s); return { ...p, rolls: undefined, lastRoll: s.rolls.at(-1) ?? null }; }) });
  }
  const seal = await loadSeal(env.VISITS, id);
  return seal ? catanJson({ ok: true, seal: publicSeal(seal) }) : catanJson({ ok: false, error: 'no such sealed table' }, 404);
};

export const onRequestPost: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the seal store is offline' }, 503);
  const body = await readBody(request, 1024);
  if (!body) return catanJson({ ok: false, error: 'send {id, rollKey, action}' }, 400);
  const seal = await loadSeal(env.VISITS, String(body.id ?? ''));
  if (!seal) return catanJson({ ok: false, error: 'no such sealed table' }, 404);
  if (!await rollKeyMatches(seal, body.rollKey)) return catanJson({ ok: false, error: 'rollKey does not match' }, 403);
  if (body.action === 'reveal') return catanJson({ ok: true, seal: publicSeal(await revealSeal(env.VISITS, seal)) });
  if (body.action !== 'roll') return catanJson({ ok: false, error: 'action must be "roll" or "reveal"' }, 400);
  if (seal.revealed) return catanJson({ ok: false, error: 'this table is revealed; the dice are done', seal: publicSeal(seal) }, 409);
  const after = await rollSeal(env.VISITS, seal);
  const roll = after.rolls.at(-1)!;
  return catanJson({ ok: true, index: after.rolls.length - 1, roll, total: roll[0] + roll[1], remaining: 240 - after.rolls.length, revealed: after.revealed });
};
