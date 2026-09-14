import { createTezosChain, type ChainFactory, type ClaimChain } from './_chain';
import {
  artwork, body, CHAIN_ID, ClaimError, CLOSES_AT, CLOSES_MS, COLLECTION, configuration, EDITIONS,
  fail, getClaim, json, payload, receipt, sameOrigin, verifyProof, wallet, walletClaim,
  type ArtworkProvenance, type ChallengeRow, type ClaimRow, type Config, type OtherWorldsEnv,
} from './_shared';

export interface Options { now?: () => number; chainFactory?: ChainFactory; items?: ArtworkProvenance[] }
const now = (options: Options) => (options.now || Date.now)();
async function configured(env: OtherWorldsEnv, options: Options): Promise<Config> {
  const config = await configuration(env, options.items);
  if (!config) throw new ClaimError('claims-not-enabled', 503);
  return config;
}
async function chain(env: OtherWorldsEnv, config: Config, options: Options) {
  return (options.chainFactory || createTezosChain)(env, config);
}
async function readiness(env: OtherWorldsEnv, config: Config, options: Options) {
  const db = env.AUTH_DB!;
  const cached = await db.prepare('SELECT verified_at FROM other_worlds_readiness WHERE config_hash = ?').bind(config.hash).first<{verified_at:number}>();
  if (cached && cached.verified_at > now(options) - 30_000) return;
  const result = await db.prepare('SELECT artwork_id, COUNT(*) AS claimed FROM other_worlds_claims GROUP BY artwork_id').all<{artwork_id:number;claimed:number}>();
  const counts = Object.fromEntries(result.results.map(row => [row.artwork_id, row.claimed]));
  await (await chain(env, config, options)).ready(counts);
  await db.prepare('INSERT INTO other_worlds_readiness(config_hash,verified_at) VALUES (?,?) ON CONFLICT(config_hash) DO UPDATE SET verified_at=excluded.verified_at').bind(config.hash, now(options)).run();
}

export async function handleStatus(request: Request, env: OtherWorldsEnv, options: Options = {}): Promise<Response> {
  const base = { ok: true, serverTime: new Date(now(options)).toISOString(), closesAt: CLOSES_AT, collectorCostMutez: 0, totalEditions: 243, editionSize: EDITIONS };
  try {
    const config = await configuration(env, options.items);
    const counts = env.AUTH_DB ? await env.AUTH_DB.prepare('SELECT artwork_id, COUNT(*) AS claimed FROM other_worlds_claims GROUP BY artwork_id').all<{artwork_id:number;claimed:number}>() : { results: [] };
    const address = new URL(request.url).searchParams.get('address');
    const existing = address && env.AUTH_DB ? await walletClaim(env.AUTH_DB, wallet(address)) : null;
    let enabled = Boolean(config); let unavailable = false;
    if (config && (CLOSES_MS === null || now(options) < CLOSES_MS)) {
      try { await readiness(env, config, options); } catch { enabled = false; unavailable = true; }
    }
    return json({ ...base, enabled,
      phase: CLOSES_MS !== null && now(options) >= CLOSES_MS ? 'closed' : unavailable ? 'unavailable' : enabled ? 'open' : 'preview',
      artworks: Array.from({ length: 9 }, (_, index) => ({ artworkId: index + 1, editionSize: EDITIONS,
        remaining: Math.max(0, EDITIONS - (counts.results.find(row => row.artwork_id === index + 1)?.claimed || 0)) })),
      claim: existing ? receipt(existing) : null,
    });
  } catch {
    // Missing migration or unavailable D1 is explicitly unavailable, never open.
    return json({ ...base, enabled: false, phase: CLOSES_MS !== null && now(options) >= CLOSES_MS ? 'closed' : 'unavailable', artworks: [], claim: null }, 503);
  }
}

export async function handleChallenge(request: Request, env: OtherWorldsEnv, options: Options = {}): Promise<Response> {
  try {
    const origin = sameOrigin(request); const input = await body(request);
    const address = wallet(input.address); const artworkId = artwork(input.artworkId);
    const config = await configured(env, options); const db = env.AUTH_DB!;
    const existing = await walletClaim(db, address);
    if (existing && existing.artwork_id !== artworkId) return json({ ok: false, reason: 'already-claimed', claim: receipt(existing) }, 409);
    if (!existing && CLOSES_MS !== null && now(options) >= CLOSES_MS) throw new ClaimError('claims-closed', 410);
    if (existing && existing.config_hash !== config.hash) throw new ClaimError('claim-configuration-changed', 503);
    if (!existing) await readiness(env, config, options);
    const issuedAt = now(options);
    // A bounded, atomic wallet rate limit prevents challenge table growth. IP
    // identity is deliberately not used as the one-per-wallet collection rule.
    const recent = await db.prepare('SELECT COUNT(*) AS count FROM other_worlds_challenges WHERE address = ? AND created_at > ?').bind(address, issuedAt - 60_000).first<{count:number}>();
    if (Number(recent?.count) >= 10) throw new ClaimError('too-many-challenges', 429);
    const nonce = crypto.randomUUID();
    const expiresAt = existing || CLOSES_MS === null ? issuedAt + 5 * 60_000 : Math.min(issuedAt + 5 * 60_000, CLOSES_MS);
    const item = config.items.find(item => item.id === artworkId)!;
    const message = [
      'LOS ANGELES / OTHER WORLDS — Free Claim', 'BY MICHAEL HOYDICH',
      `Origin: ${origin}`, `Collection: ${COLLECTION}`, `Network: ${CHAIN_ID}`,
      `Wallet: ${address}`, `Artwork: ${artworkId} / ${item.slug}`, `FA2: ${config.contract}`,
      `Token: ${config.tokens[artworkId]}`, `Metadata SHA-256: ${item.metadataSha256}`,
      `Sponsor: ${config.sponsor}`, 'Collector pays: 0 mutez. Pointcast pays transaction fees.',
      'One artwork per wallet. This signature authorizes only the selected free claim.',
      `Nonce: ${nonce}`, `Issued At: ${new Date(issuedAt).toISOString()}`,
      `Expires At: ${new Date(expiresAt).toISOString()}`, `Claims Close: ${CLOSES_AT ?? 'No closing date'}`,
    ].join('\n');
    await db.prepare(`INSERT INTO other_worlds_challenges(nonce,address,artwork_id,origin,message,config_hash,expires_at,created_at)
      SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM other_worlds_challenges WHERE address=? AND created_at>?) < 10`)
      .bind(nonce,address,artworkId,origin,message,config.hash,expiresAt,issuedAt,address,issuedAt-60_000).run();
    if (!await db.prepare('SELECT nonce FROM other_worlds_challenges WHERE nonce=?').bind(nonce).first()) throw new ClaimError('too-many-challenges', 429);
    return json({ ok: true, nonce, message, payload: payload(message), expiresAt: new Date(expiresAt).toISOString(), resuming: Boolean(existing) });
  } catch (error) { return fail(error); }
}

/** Persist-before-broadcast and never-expiring locks follow Pointcast's faucet
 * sign-first delivery approach. Uncertainty retains inventory, wallet and budget. */
async function reconcile(db: D1Database, row: ClaimRow, adapter: ClaimChain, options: Options): Promise<ClaimRow> {
  if (!row.operation_hash || row.status === 'confirmed' || row.status === 'failed') return row;
  let state: 'pending'|'confirmed'|'failed';
  try { state = await adapter.status(row); } catch { return row; }
  if (state === 'pending') return row;
  await db.batch([
    db.prepare(`UPDATE other_worlds_claims SET status=?, confirmed_at=?, updated_at=?, last_error=? WHERE id=? AND operation_hash=? AND status IN ('signed','submitted')`)
      .bind(state,state === 'confirmed' ? now(options) : null,now(options),state === 'failed' ? 'on-chain-operation-failed' : null,row.id,row.operation_hash),
    db.prepare(`DELETE FROM other_worlds_sponsor_locks WHERE claim_id=? AND EXISTS(SELECT 1 FROM other_worlds_claims WHERE id=? AND status IN ('confirmed','failed'))`).bind(row.id,row.id),
  ]);
  return (await getClaim(db,row.id))!;
}
async function deliver(env: OtherWorldsEnv, config: Config, initial: ClaimRow, options: Options): Promise<ClaimRow> {
  const db = env.AUTH_DB!; const adapter = await chain(env,config,options);
  let row = await reconcile(db,initial,adapter,options);
  if (row.status === 'confirmed' || row.status === 'failed') return row;
  if (row.status === 'reserved') {
    const acquire = () => db.prepare(`INSERT OR IGNORE INTO other_worlds_sponsor_locks(sponsor,claim_id,acquired_at) VALUES(?,?,?) RETURNING claim_id`)
      .bind(config.sponsor,row.id,now(options)).first<{claim_id:string}>();
    let acquired = await acquire();
    if (!acquired) {
      // A different collector can advance the queue after the prior collector
      // leaves. This only probes the holder's stored hash; never re-signs it.
      const lock = await db.prepare('SELECT claim_id FROM other_worlds_sponsor_locks WHERE sponsor=?').bind(config.sponsor).first<{claim_id:string}>();
      const holder = lock ? await getClaim(db,lock.claim_id) : null;
      if (holder?.operation_hash && holder.config_hash === config.hash) await reconcile(db,holder,adapter,options);
      acquired = await acquire();
    }
    if (!acquired) return row;
    const preparing = await db.prepare(`UPDATE other_worlds_claims SET status='preparing',updated_at=? WHERE id=? AND status='reserved' RETURNING id`)
      .bind(now(options),row.id).first();
    if (!preparing) return (await getClaim(db,row.id))!;
    let signed;
    try {
      const used = await db.prepare('SELECT COALESCE(SUM(maximum_cost_mutez),0) AS used FROM other_worlds_claims').first<{used:number}>();
      signed = await adapter.prepare(row,config.totalBudgetMutez - Number(used?.used || 0));
      if (!/^[a-f0-9]+$/.test(signed.bytes) || !/^o[1-9A-HJ-NP-Za-km-z]{50}$/.test(signed.hash) || !Number.isSafeInteger(signed.maximumCostMutez) || signed.maximumCostMutez <= 0 || signed.maximumCostMutez > config.maxOperationMutez || Number(used?.used || 0)+signed.maximumCostMutez > config.totalBudgetMutez) throw new ClaimError('sponsor-budget-limit',503);
    } catch (error) {
      // prepare() never injects: failures here can safely free the counter lock.
      await db.batch([
        db.prepare(`UPDATE other_worlds_claims SET status='reserved',updated_at=?,last_error=? WHERE id=? AND status='preparing'`).bind(now(options),error instanceof ClaimError ? error.reason : 'sponsor-preparation-unavailable',row.id),
        db.prepare('DELETE FROM other_worlds_sponsor_locks WHERE claim_id=?').bind(row.id),
      ]);
      return (await getClaim(db,row.id))!;
    }
    // A failed persistence retains the lock. No operation is injected until its
    // exact signed bytes, deterministic hash and maximum spend exist durably.
    await db.prepare(`UPDATE other_worlds_claims SET status='signed',signed_bytes=?,operation_hash=?,maximum_cost_mutez=?,updated_at=?,last_error=NULL
      WHERE id=? AND status='preparing' AND ?+(SELECT COALESCE(SUM(maximum_cost_mutez),0) FROM other_worlds_claims)<=?`)
      .bind(signed.bytes,signed.hash,signed.maximumCostMutez,now(options),row.id,signed.maximumCostMutez,config.totalBudgetMutez).run();
    row = (await getClaim(db,row.id))!;
  }
  if ((row.status === 'signed' || row.status === 'submitted') && row.signed_bytes && row.operation_hash) {
    // Idempotent retries only re-inject these exact bytes and operation hash.
    try {
      const hash = await adapter.broadcast(row.signed_bytes);
      if (hash !== row.operation_hash) throw new Error('broadcast-hash-mismatch');
      await db.prepare(`UPDATE other_worlds_claims SET status='submitted',updated_at=?,last_error=NULL WHERE id=? AND status IN ('signed','submitted')`).bind(now(options),row.id).run();
    } catch {
      await db.prepare(`UPDATE other_worlds_claims SET last_error='broadcast-uncertain',updated_at=? WHERE id=? AND status IN ('signed','submitted')`).bind(now(options),row.id).run();
    }
    row = await reconcile(db,(await getClaim(db,row.id))!,adapter,options);
  }
  return row;
}

export async function handleClaim(request: Request, env: OtherWorldsEnv, options: Options = {}): Promise<Response> {
  try {
    const origin = sameOrigin(request); const input = await body(request);
    const address = wallet(input.address); const artworkId = artwork(input.artworkId);
    if (typeof input.nonce !== 'string' || !/^[a-f0-9-]{36}$/.test(input.nonce)) throw new ClaimError('invalid-nonce');
    const config = await configured(env,options); const db = env.AUTH_DB!;
    const challenge = await db.prepare('SELECT * FROM other_worlds_challenges WHERE nonce=?').bind(input.nonce).first<ChallengeRow>();
    if (!challenge || challenge.address !== address || challenge.artwork_id !== artworkId || challenge.origin !== origin || challenge.config_hash !== config.hash) throw new ClaimError('challenge-mismatch',401);
    const proofHash = await verifyProof(input,challenge);
    if (challenge.proof_hash && challenge.proof_hash !== proofHash) throw new ClaimError('proof-already-used',409);
    let row = await walletClaim(db,address);
    if (row && row.artwork_id !== artworkId) return json({ ok:false,reason:'already-claimed',claim:receipt(row) },409);
    if (!row && CLOSES_MS !== null && now(options) >= CLOSES_MS) throw new ClaimError('claims-closed',410);
    if ((!row || !challenge.proof_hash) && now(options) >= challenge.expires_at) throw new ClaimError('challenge-expired',401);
    if (row && row.config_hash !== config.hash) throw new ClaimError('claim-configuration-changed',503);
    if (!row) await readiness(env,config,options);
    // Pin this exact proof before reserving. The claim insert below atomically
    // applies capacity, wallet uniqueness, nonce uniqueness and server cutoff.
    await db.prepare('UPDATE other_worlds_challenges SET proof_hash=? WHERE nonce=? AND (proof_hash IS NULL OR proof_hash=?)').bind(proofHash,challenge.nonce,proofHash).run();
    if (!row) {
      const createdAt = now(options);
      const id = crypto.randomUUID(); const item = config.items.find(item => item.id === artworkId)!;
      await db.prepare(`INSERT OR IGNORE INTO other_worlds_claims(id,address,artwork_id,nonce,config_hash,contract,token_id,sponsor,metadata_sha256,status,created_at,updated_at)
        SELECT ?,?,?,?,?,?,?,?,?,'reserved',?,? FROM other_worlds_challenges
        WHERE nonce=? AND proof_hash=? AND expires_at>? AND (? IS NULL OR ?<?)
        AND (SELECT COUNT(*) FROM other_worlds_claims WHERE artwork_id=?)<27`)
        .bind(id,address,artworkId,challenge.nonce,config.hash,config.contract,config.tokens[artworkId],config.sponsor,item.metadataSha256,createdAt,createdAt,challenge.nonce,proofHash,createdAt,CLOSES_MS,createdAt,CLOSES_MS,artworkId).run();
      row = await walletClaim(db,address);
      if (!row) {
        if (CLOSES_MS !== null && now(options)>=CLOSES_MS) throw new ClaimError('claims-closed',410);
        throw new ClaimError('artwork-sold-out',409);
      }
      if (row.artwork_id !== artworkId) return json({ok:false,reason:'already-claimed',claim:receipt(row)},409);
      // Separate the all-artwork inventory audit from Taquito preparation so a
      // cold claim stays within the existing Workers Free subrequest budget.
      // The client resumes this durable reservation with the same signed proof.
      return json({ok:true,claim:receipt(row)},202);
    }
    row = await deliver(env,config,row,options);
    return json({ok:true,claim:receipt(row)},row.status==='confirmed'?200:202);
  } catch(error) { return fail(error); }
}

export async function handleReceipt(request: Request, env: OtherWorldsEnv, options: Options = {}): Promise<Response> {
  try {
    if (!env.AUTH_DB) throw new ClaimError('claim-storage-unavailable',503);
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new ClaimError('invalid-receipt');
    let row = await getClaim(env.AUTH_DB,id);
    if (!row) throw new ClaimError('receipt-not-found',404);
    const config = await configuration(env,options.items);
    if (config && row.config_hash===config.hash) row = await reconcile(env.AUTH_DB,row,await chain(env,config,options),options);
    return json({ok:true,claim:receipt(row)});
  } catch(error) { return fail(error); }
}
