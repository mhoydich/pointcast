/**
 * GET /api/faucet/{slug} — the faucet desk, decided at request time.
 *
 * Public: the token, today's Los Angeles date, how many drips have been
 * claimed today and how many remain, the spigot wallet and its balances
 * (cached one minute in KV), and the last dozen claimants by first name.
 * With a session cookie it also carries `you`: today's claim state, what
 * you are owed, what has been delivered, and every ledger line.
 */
import { FAUCET_SPEC, getFaucet, losAngelesDate } from '../../../../src/lib/faucet';
import { authJson, readSessionFromRequest } from '../../auth/session';
import {
  emptyPublicFaucetClaims,
  faucetCap,
  getPublicFaucetClaims,
  getUserFaucetLedger,
  readSpigot,
  settleFaucetSubmissions,
  spigotConfigured,
  type FaucetClaimEnv,
  type SpigotSnapshot,
} from '../_claims';

const SPIGOT_CACHE_SECONDS = 60;
/** Cache the misses too, or an RPC outage turns every page load into a retry. */
const SPIGOT_MISS_CACHE_SECONDS = 20;

async function cachedSpigot(env: FaucetClaimEnv, slug: string, read: () => Promise<SpigotSnapshot | null>): Promise<SpigotSnapshot | null> {
  const kv = env.PC_RATES_KV;
  const key = `faucet:${slug}:spigot`;
  if (kv) {
    try {
      const hit = await kv.get(key);
      if (hit) return JSON.parse(hit) as SpigotSnapshot | null;
    } catch { /* fall through to a live read */ }
  }
  const snapshot = await read();
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(snapshot), {
        expirationTtl: snapshot ? SPIGOT_CACHE_SECONDS : SPIGOT_MISS_CACHE_SECONDS,
      });
    } catch { /* best effort */ }
  }
  return snapshot;
}

export const onRequestGet: PagesFunction<FaucetClaimEnv> = async ({ request, env, params }) => {
  const faucet = getFaucet(typeof params.slug === 'string' ? params.slug : '');
  if (!faucet) return authJson({ ok: false, reason: 'unknown-faucet' }, { status: 404 });

  const day = losAngelesDate();
  const cap = faucetCap(env, faucet);
  const configured = spigotConfigured(env, faucet);
  const [claims, spigot, session] = await Promise.all([
    getPublicFaucetClaims(env.AUTH_DB, faucet, { day, cap, configured })
      .catch(() => emptyPublicFaucetClaims(day, cap, configured)),
    cachedSpigot(env, faucet.slug, () => readSpigot(env, faucet)),
    readSessionFromRequest(request, env).catch(() => null),
  ]);
  // Settle anything this account has in flight before drawing the ledger, so
  // the desk shows what the chain says rather than what the last click hoped.
  // Costs one indexed count when there is nothing in flight, which is always.
  if (session) {
    await settleFaucetSubmissions(env, faucet, session.user.userId).catch(() => { /* the ledger is still worth drawing */ });
  }
  const you = session
    ? await getUserFaucetLedger(env.AUTH_DB, faucet, session.user, day).catch(() => null)
    : null;

  return authJson({
    ok: true,
    spec: FAUCET_SPEC,
    faucet: {
      slug: faucet.slug,
      name: faucet.name,
      ticker: faucet.ticker,
      chain: faucet.chain,
      chainId: faucet.chainId,
      contract: faucet.contract,
      deployedYear: faucet.deployedYear,
      dailyAmount: faucet.dailyAmount,
      greeting: faucet.greeting,
    },
    day,
    ledger: Boolean(env.AUTH_DB),
    claims,
    spigot: spigot
      ? {
        address: spigot.address,
        tokenBalance: spigot.tokenBalance,
        ethBalance: spigot.ethBalance,
        lowGas: spigot.lowGas,
        lowGasWarning: spigot.lowGasWarning,
      }
      : null,
    you,
    updatedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
};
