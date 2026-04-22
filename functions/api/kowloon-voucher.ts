/**
 * POST /api/kowloon-voucher
 *
 * Issues server-signed vouchers for three kinds of mint:
 *   - { kind: 'bun', wallet, earned }                       — FA1.2 fungible
 *   - { kind: 'pastry', wallet, tokenId }                   — FA2 NFT, airdrop-gated
 *   - { kind: 'achievement', wallet, tokenId, slug }        — FA2 receipt NFT
 *
 * All three use the same voucher-signed-mint pattern: server packs
 * Michelson (recipient, payload, nonce, expiry), ed25519-signs with
 * BUN_SIGNER_KEY, the on-chain contract verifies.
 *
 * Daily $BUN cap: 2.00/wallet/UTC-day in KV.
 * Pastry gate: KV `pastry:airdrop:{tokenId}` array, populated at finale.
 * Achievement dedup: KV `achv:claimed:{tokenId}:{wallet}` + on-chain dedup.
 */

import { InMemorySigner } from '@taquito/signer';

interface Env {
  BUN_SIGNER_KEY: string;
  KOWLOON_KV: KVNamespace;
}

interface BunPayload      { kind: 'bun'; wallet: string; earned: number; }
interface PastryPayload   { kind: 'pastry'; wallet: string; tokenId: number; }
interface AchievementPayload {
  kind: 'achievement';
  wallet: string;
  tokenId: number;
  achievementSlug?: string;
}

type Payload = BunPayload | PastryPayload | AchievementPayload;

const DAILY_CAP_BUN = 200;
const VOUCHER_TTL_SECONDS = 300;

const ACHIEVEMENT_SLUGS: Record<number, string> = {
  0:'first_bake',1:'first_bullseye',2:'vip_done',3:'boss_done',4:'combo_10',
  5:'combo_20',6:'cash_stash',7:'bribe_lord',8:'shop_goer',9:'four_ovens',
  10:'daily_shifter',11:'wallet_connect',12:'bun_collector',13:'theme_chameleon',
  14:'developed_gluten',15:'auntie_hands',16:'regular',17:'five_stars',
  18:'all_hands',19:'outran_chan',20:'vendetta_done',21:'right_hand',
  22:'no_mans_land',23:'sidejob_done',24:'everyone_knows',25:'local_hero',
  26:'typhoon_hero',27:'storm_drop',28:'ch7_started',29:'truth_kept',
  30:'truth_uncovered',31:'sepia_runner',32:'typhoon_survivor',33:'triad_paid',
  34:'night_5',35:'night_10',
};

export async function onRequestPost({
  request, env,
}: { request: Request; env: Env }): Promise<Response> {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return json({ error: 'invalid-json' }, 400);
  }
  if (!body.wallet || !/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(body.wallet)) {
    return json({ error: 'bad-wallet' }, 400);
  }
  if (body.kind === 'bun') return signBunVoucher(body, env);
  if (body.kind === 'pastry') return signPastryVoucher(body, env);
  if (body.kind === 'achievement') return signAchievementVoucher(body, env);
  return json({ error: 'bad-kind' }, 400);
}

async function signBunVoucher(body: BunPayload, env: Env): Promise<Response> {
  const declared = Math.round(Number(body.earned) * 100);
  if (!Number.isFinite(declared) || declared <= 0) {
    return json({ error: 'nothing-to-claim' }, 400);
  }
  const dayKey = dailyKey(body.wallet);
  const already = Number((await env.KOWLOON_KV.get(dayKey)) || 0);
  const room = Math.max(0, DAILY_CAP_BUN - already);
  if (room <= 0) return json({ error: 'daily-cap-met' }, 429);
  const amount = Math.min(declared, room);
  const nonce = makeNonce();
  const expiry = Math.floor(Date.now() / 1000) + VOUCHER_TTL_SECONDS;
  const signed = await packAndSign(env, body.wallet, String(amount), String(nonce), String(expiry));
  await env.KOWLOON_KV.put(dayKey, String(already + amount), { expirationTtl: 60 * 60 * 36 });
  return json({
    nonce: String(nonce),
    expiry: new Date(expiry * 1000).toISOString(),
    signature: signed.signature,
    amount: String(amount),
  });
}

async function signPastryVoucher(body: PastryPayload, env: Env): Promise<Response> {
  const tokenId = Number(body.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 0 || tokenId > 5) {
    return json({ error: 'bad-token-id' }, 400);
  }
  const listKey = `pastry:airdrop:${tokenId}`;
  const listJson = (await env.KOWLOON_KV.get(listKey)) || '[]';
  let wallets: string[] = [];
  try { wallets = JSON.parse(listJson); } catch { wallets = []; }
  if (!wallets.includes(body.wallet)) {
    return json({ error: 'not-on-airdrop-list' }, 403);
  }
  const claimedKey = `pastry:claimed:${tokenId}:${body.wallet}`;
  if (await env.KOWLOON_KV.get(claimedKey)) {
    return json({ error: 'already-claimed' }, 409);
  }
  const nonce = makeNonce();
  const expiry = Math.floor(Date.now() / 1000) + VOUCHER_TTL_SECONDS;
  const signed = await packAndSign(env, body.wallet, String(tokenId), String(nonce), String(expiry));
  await env.KOWLOON_KV.put(claimedKey, '1', { expirationTtl: 60 * 60 * 24 * 90 });
  return json({
    nonce: String(nonce),
    expiry: new Date(expiry * 1000).toISOString(),
    signature: signed.signature,
    tokenId,
  });
}

async function signAchievementVoucher(body: AchievementPayload, env: Env): Promise<Response> {
  const tokenId = Number(body.tokenId);
  if (!Number.isInteger(tokenId) || tokenId < 0 || tokenId > 99) {
    return json({ error: 'bad-token-id' }, 400);
  }
  const canonical = ACHIEVEMENT_SLUGS[tokenId];
  if (canonical && body.achievementSlug && body.achievementSlug !== canonical) {
    return json({ error: 'slug-mismatch' }, 400);
  }
  const claimedKey = `achv:claimed:${tokenId}:${body.wallet}`;
  if (await env.KOWLOON_KV.get(claimedKey)) {
    return json({ error: 'already-claimed' }, 409);
  }
  const nonce = makeNonce();
  const expiry = Math.floor(Date.now() / 1000) + VOUCHER_TTL_SECONDS;
  const signed = await packAndSign(env, body.wallet, String(tokenId), String(nonce), String(expiry));
  await env.KOWLOON_KV.put(claimedKey, '1', { expirationTtl: 60 * 60 * 24 * 120 });
  return json({
    nonce: String(nonce),
    expiry: new Date(expiry * 1000).toISOString(),
    signature: signed.signature,
    tokenId,
    slug: canonical || '',
  });
}

/** Pack Michelson `(address, (nat, (nat, timestamp)))` and ed25519-sign. */
async function packAndSign(env: Env, addr: string, a: string, nonce: string, expiry: string) {
  // Build minimal Michelson pair nesting as JSON, then encode ourselves
  // to hex using a small codec — we only need (pair (pair (pair))).
  const michelson = {
    prim: 'Pair',
    args: [
      { string: addr },
      {
        prim: 'Pair',
        args: [
          { int: a },
          {
            prim: 'Pair',
            args: [{ int: nonce }, { int: expiry }],
          },
        ],
      },
    ],
  };
  // We can't depend on @taquito/michel-codec for packing in a Worker
  // (bundle-size), but we can shell out to a tiny pack via the signer's
  // own utility — @taquito/signer doesn't expose that, so we rely on
  // Tezos' packData semantics replicated here: the admin-deploy script
  // SHOULD run an equivalent off-line and pre-populate any signer.
  //
  // For the Worker path, we use InMemorySigner's sign() and let the
  // caller hand us already-packed bytes — NOT what we're doing here.
  // Instead, compute the pack on client at /kowloon/tezos before POST.
  //
  // Simpler route: the server signs the JSON canonical form, the client
  // passes that to the contract's claim entrypoint as the `payload`
  // bytes — BUT the contract hardcodes `sp.pack(...)` so we MUST match
  // Michelson pack exactly.
  //
  // SHIPPABLE PATH: package @taquito/michel-codec at 60KB into the
  // Worker. Cloudflare Pages Functions happily load it. Done.
  const { Parser, packDataBytes } = await import('@taquito/michel-codec');
  const packed = packDataBytes(michelson as any);
  const signer = new InMemorySigner(env.BUN_SIGNER_KEY);
  const bytesHex = packed.bytes.startsWith('05') ? packed.bytes : '05' + packed.bytes;
  const sig = await signer.sign(bytesHex);
  return { signature: sig.prefixSig };
}

function dailyKey(wallet: string): string {
  const d = new Date();
  return `bun:daily:${wallet}:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}
function makeNonce(): number {
  const a = Math.floor(Math.random() * 0xffffffff);
  const b = Math.floor(Math.random() * 0x1fffff);
  return b * 0x100000000 + a;
}
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
