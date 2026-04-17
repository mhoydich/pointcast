import contracts from '../data/contracts.json';

const TZKT_API_BASE = 'https://api.tzkt.io/v1';

export const PRIZE_CAST_PENDING_MESSAGE = 'Not yet originated — ghostnet test pending';
export const PRIZE_CAST_FIRST_DRAW_PLACEHOLDER = 'first draw: next Sunday 18:00 UTC';

export interface PrizeCastWinner {
  round: number;
  winner: string;
  prizeMutez: number;
  prizeTez: number;
  block: number | null;
  drawnAt: string | null;
  opHash: string | null;
  caller: string | null;
}

export interface PrizeCastSnapshot {
  kt1: string;
  live: boolean;
  fetchError: string | null;
  tvlMutez: number | null;
  tvlTez: number | null;
  principalMutez: number | null;
  principalTez: number | null;
  prizePoolMutez: number | null;
  prizePoolTez: number | null;
  minDepositMutez: number | null;
  participantCount: number | null;
  drawCadenceBlocks: number | null;
  lastDrawLevel: number | null;
  accumulatedSince: string | null;
  nextDrawAt: string;
  winners: PrizeCastWinner[];
}

function withTimeout(ms = 4500): AbortSignal | undefined {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return undefined;
  }
}

async function fetchTzkt(path: string): Promise<Response> {
  return fetch(`${TZKT_API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    signal: withTimeout(),
  });
}

async function fetchTzktJson<T>(path: string): Promise<T> {
  const response = await fetchTzkt(path);
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchTzktNumber(path: string): Promise<number> {
  const response = await fetchTzkt(path);
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return toNumber(payload);
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'bigint') return Number(value);
  return 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickAddress(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value?.address === 'string') return value.address;
  if (typeof value?.alias === 'string') return value.alias;
  return null;
}

export function getPrizeCastContractAddress(): string {
  return ((contracts as any).prize_cast?.mainnet ?? '').trim();
}

export function getPrizeCastTzktUrl(kt1 = getPrizeCastContractAddress()): string | null {
  return kt1.startsWith('KT1') ? `https://tzkt.io/${kt1}` : null;
}

export function mutezToTez(mutez: number | null | undefined): number | null {
  if (mutez === null || mutez === undefined || !Number.isFinite(mutez)) return null;
  return mutez / 1_000_000;
}

export function formatTezAmount(amount: number | null | undefined, digits = 2): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)} ꜩ`;
}

export function shortTezosAddress(address: string | null | undefined): string {
  if (!address) return '—';
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function getNextPrizeCastDrawAt(from = new Date()): Date {
  const next = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    18,
    0,
    0,
    0,
  ));
  const daysUntilSunday = (7 - from.getUTCDay()) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilSunday);
  if (daysUntilSunday === 0 && from.getTime() >= next.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }
  return next;
}

function buildFallbackSnapshot(): PrizeCastSnapshot {
  return {
    kt1: '',
    live: false,
    fetchError: null,
    tvlMutez: null,
    tvlTez: null,
    principalMutez: null,
    principalTez: null,
    prizePoolMutez: null,
    prizePoolTez: null,
    minDepositMutez: null,
    participantCount: null,
    drawCadenceBlocks: null,
    lastDrawLevel: null,
    accumulatedSince: null,
    nextDrawAt: getNextPrizeCastDrawAt().toISOString(),
    winners: [],
  };
}

export async function getPrizeCastSnapshot(): Promise<PrizeCastSnapshot> {
  const kt1 = getPrizeCastContractAddress();
  if (!kt1.startsWith('KT1')) {
    return buildFallbackSnapshot();
  }

  const errors: string[] = [];
  let tvlMutez: number | null = null;
  let storage: any = null;
  let drawOps: any[] = [];
  let winnerKeys: any[] = [];

  const [balanceResult, storageResult, drawsResult, winnersResult] = await Promise.allSettled([
    fetchTzktNumber(`/accounts/${kt1}/balance`),
    fetchTzktJson<any>(`/contracts/${kt1}/storage`),
    fetchTzktJson<any[]>(`/operations/transactions?target=${kt1}&entrypoint=draw&status=applied&limit=10`),
    fetchTzktJson<any[]>(`/contracts/${kt1}/bigmaps/past_winners/keys?active=true&limit=10`),
  ]);

  if (balanceResult.status === 'fulfilled') tvlMutez = balanceResult.value;
  else errors.push(`balance ${String(balanceResult.reason)}`);

  if (storageResult.status === 'fulfilled') storage = storageResult.value;
  else errors.push(`storage ${String(storageResult.reason)}`);

  if (drawsResult.status === 'fulfilled') drawOps = Array.isArray(drawsResult.value) ? drawsResult.value : [];
  else errors.push(`draws ${String(drawsResult.reason)}`);

  if (winnersResult.status === 'fulfilled') winnerKeys = Array.isArray(winnersResult.value) ? winnersResult.value : [];
  else errors.push(`winners ${String(winnersResult.reason)}`);

  let accumulatedSince: string | null = null;
  const sortedDraws = [...drawOps].sort((a, b) => {
    const at = new Date(a?.timestamp || 0).getTime();
    const bt = new Date(b?.timestamp || 0).getTime();
    return bt - at;
  });

  if (sortedDraws[0]?.timestamp) {
    accumulatedSince = sortedDraws[0].timestamp;
  } else {
    const lastDrawLevel = toNullableNumber(storage?.last_draw_level);
    if (lastDrawLevel !== null) {
      try {
        const block = await fetchTzktJson<any>(`/blocks/${lastDrawLevel}`);
        accumulatedSince = block?.timestamp ?? null;
      } catch (error) {
        errors.push(`block ${String(error)}`);
      }
    }
  }

  const principalMutez = toNullableNumber(storage?.vault_total);
  const prizePoolMutez = tvlMutez !== null && principalMutez !== null
    ? Math.max(0, tvlMutez - principalMutez)
    : null;

  const sortedWinnerKeys = [...winnerKeys]
    .sort((a, b) => toNumber(b?.key) - toNumber(a?.key))
    .slice(0, 10);

  const winners = sortedWinnerKeys.map((entry, index) => {
    const value = entry?.value ?? {};
    const draw = sortedDraws[index] ?? null;
    const prizeMutez = toNumber(value?.prize);
    return {
      round: toNumber(entry?.key) + 1,
      winner: pickAddress(value?.winner) ?? '—',
      prizeMutez,
      prizeTez: mutezToTez(prizeMutez) ?? 0,
      block: toNullableNumber(value?.block),
      drawnAt: draw?.timestamp ?? null,
      opHash: typeof draw?.hash === 'string' ? draw.hash : null,
      caller: pickAddress(draw?.sender),
    };
  });

  return {
    kt1,
    live: true,
    fetchError: errors.length > 0 ? errors.join(' · ') : null,
    tvlMutez,
    tvlTez: mutezToTez(tvlMutez),
    principalMutez,
    principalTez: mutezToTez(principalMutez),
    prizePoolMutez,
    prizePoolTez: mutezToTez(prizePoolMutez),
    minDepositMutez: toNullableNumber(storage?.min_deposit_mutez),
    participantCount: toNullableNumber(storage?.participant_count),
    drawCadenceBlocks: toNullableNumber(storage?.draw_cadence_blocks),
    lastDrawLevel: toNullableNumber(storage?.last_draw_level),
    accumulatedSince,
    nextDrawAt: getNextPrizeCastDrawAt().toISOString(),
    winners,
  };
}
