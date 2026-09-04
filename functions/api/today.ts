/**
 * GET /api/today — the daily rounds, decided at request time.
 *
 * The front door's "today" strip reads this. It answers, for the Los
 * Angeles date of this request: which daily rooms exist, and for a
 * signed-in account, which of the account-keyed ones are already done.
 *
 * Rounds whose state lives only in a browser (bench, today's block, the
 * race) come back with `done: null`: they are listed, not tracked.
 * See docs/plans/2026-09-04-daily-refresh-notes.md.
 */
import { losAngelesDate, sittingOfTheDay } from '../../src/lib/kennel-club';
import { getFaucet } from '../../src/lib/faucet';
import { authJson, readSessionFromRequest, type AuthEnv } from './auth/session';
import { getUserKennelClaims } from './kennel-club/_claims';
import { getUserFaucetLedger } from './faucet/_claims';

export interface TodayRound {
  id: 'dog' | 'hello' | 'bench' | 'block' | 'race';
  label: string;
  href: string;
  /** true/false for account-keyed rooms; null when the room keeps its state in the browser. */
  done: boolean | null;
}

export interface TodayPayload {
  ok: true;
  spec: 'pointcast.today/v1';
  date: string;
  timeZone: 'America/Los_Angeles';
  signedIn: boolean;
  rounds: TodayRound[];
  /** Account-keyed rounds finished today, out of those tracked. */
  done: number;
  tracked: number;
  updatedAt: string;
}

export function buildRounds(date: string, state: { dog: boolean | null; hello: boolean | null }): TodayRound[] {
  const sitting = sittingOfTheDay(date);
  return [
    { id: 'dog', label: `Claim ${sitting.name}`, href: '/kennel-club', done: state.dog },
    { id: 'hello', label: 'Claim today’s HELLO', href: '/faucet/hello', done: state.hello },
    { id: 'bench', label: 'Sit on the bench', href: '/bench', done: null },
    { id: 'block', label: 'Collect today’s block', href: '/today', done: null },
    { id: 'race', label: 'Run the daily race', href: '/race', done: null },
  ];
}

export async function readToday(request: Request, env: AuthEnv): Promise<TodayPayload> {
  const date = losAngelesDate();
  const session = await readSessionFromRequest(request, env).catch(() => null);
  let dog: boolean | null = null;
  let hello: boolean | null = null;
  if (session) {
    const sitting = sittingOfTheDay(date);
    const faucet = getFaucet('hello');
    const [dogClaims, ledger] = await Promise.all([
      getUserKennelClaims(env.AUTH_DB, session.user.userId).catch(() => []),
      faucet ? getUserFaucetLedger(env.AUTH_DB, faucet, session.user, date).catch(() => null) : Promise.resolve(null),
    ]);
    dog = dogClaims.some((claim) => claim.tokenId === sitting.tokenId && claim.status !== 'failed');
    hello = ledger ? ledger.today.claimed : false;
  }
  const rounds = buildRounds(date, { dog, hello });
  const tracked = rounds.filter((round) => round.done !== null);
  return {
    ok: true,
    spec: 'pointcast.today/v1',
    date,
    timeZone: 'America/Los_Angeles',
    signedIn: Boolean(session),
    rounds,
    done: tracked.filter((round) => round.done).length,
    tracked: tracked.length,
    updatedAt: new Date().toISOString(),
  };
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => (
  authJson(await readToday(request, env), { headers: { 'Cache-Control': 'no-store' } })
);
