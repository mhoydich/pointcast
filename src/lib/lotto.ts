/**
 * lotto — client helpers for /lotto (Compute Lotto v0 on Base).
 *
 * Reads ComputeLotto.sol state via viem `readContract`. Dynamic-imports
 * viem on first call so the /lotto page ships without the wallet bundle
 * on first paint. Write helpers (buyTicket, settleEpoch) are wired in a
 * follow-up once the contract is deployed + a wagmi connector is picked.
 *
 * Distinct from Prize Cast (Tezos PLSA) — this is the Ethereum-side
 * lottery.
 */

export interface EpochView {
  epoch: number;
  startsAt: number;
  endsAt: number;
  status: 'open' | 'awaiting_vrf' | 'settled';
  humanPool: string; // USDC units (bigint as string)
  agentPool: string;
  humanCount: number;
  agentCount: number;
  humanWinner: string | null;
  agentWinner: string | null;
  humanPrize: string;
  agentCredits: string;
  time_left_sec: number;
  phase: 'open' | 'ending-soon' | 'awaiting-settle' | 'settled';
}

export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const CHAIN = {
  mainnet: { id: 8453, name: 'Base', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org' },
  sepolia: { id: 84532, name: 'Base Sepolia', rpc: 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org' },
};

export const COMPUTE_LOTTO_ABI = [
  {
    type: 'function',
    name: 'currentEpoch',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEpoch',
    inputs: [{ name: 'epoch', type: 'uint256' }],
    outputs: [
      { name: 'startsAt', type: 'uint256' },
      { name: 'endsAt', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'humanPool', type: 'uint256' },
      { name: 'agentPool', type: 'uint256' },
      { name: 'humanCount', type: 'uint256' },
      { name: 'agentCount', type: 'uint256' },
      { name: 'humanWinner', type: 'address' },
      { name: 'agentWinner', type: 'address' },
      { name: 'humanPrize', type: 'uint256' },
      { name: 'agentCredits', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ticketPriceUsdc',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'computeCredits',
    inputs: [{ name: 'holder', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'buyTicket',
    inputs: [{ name: 'count', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'settleEpoch',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
] as const;

function statusName(n: number): EpochView['status'] {
  if (n === 0) return 'open';
  if (n === 1) return 'awaiting_vrf';
  return 'settled';
}

export function usdcToDollarDisplay(units: string | bigint): string {
  const n = typeof units === 'bigint' ? units : BigInt(units || '0');
  // USDC has 6 decimals on Base.
  const whole = n / 1_000_000n;
  const frac = Number(n % 1_000_000n) / 1_000_000;
  return (Number(whole) + frac).toFixed(2);
}

export function shortAddr(addr: string, pre = 6, post = 4): string {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return '—';
  if (addr.length < pre + post + 3) return addr;
  return `${addr.slice(0, pre)}…${addr.slice(-post)}`;
}

export function countdown(totalSec: number): string {
  if (totalSec <= 0) return 'epoch ended';
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m.toString().padStart(2, '0')}m`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

/**
 * Fetch current + recent epoch state from the deployed ComputeLotto
 * contract via viem. Returns null if contract not deployed yet.
 */
export async function fetchEpochView(
  contractAddr: string,
  network: 'mainnet' | 'sepolia' = 'mainnet',
): Promise<EpochView | null> {
  if (!contractAddr || contractAddr === '0x0000000000000000000000000000000000000000') {
    return null;
  }
  try {
    const { createPublicClient, http } = await import('viem');
    const { base, baseSepolia } = await import('viem/chains');
    const chain = network === 'mainnet' ? base : baseSepolia;
    const client = createPublicClient({ chain, transport: http() });

    const currentEpoch = (await client.readContract({
      address: contractAddr as `0x${string}`,
      abi: COMPUTE_LOTTO_ABI,
      functionName: 'currentEpoch',
    })) as bigint;

    const raw = (await client.readContract({
      address: contractAddr as `0x${string}`,
      abi: COMPUTE_LOTTO_ABI,
      functionName: 'getEpoch',
      args: [currentEpoch],
    })) as [bigint, bigint, number, bigint, bigint, bigint, bigint, string, string, bigint, bigint];

    const [
      startsAt,
      endsAt,
      status,
      humanPool,
      agentPool,
      humanCount,
      agentCount,
      humanWinner,
      agentWinner,
      humanPrize,
      agentCredits,
    ] = raw;

    const now = Math.floor(Date.now() / 1000);
    const time_left_sec = Math.max(0, Number(endsAt) - now);

    let phase: EpochView['phase'];
    if (status === 2) phase = 'settled';
    else if (status === 1) phase = 'awaiting-settle';
    else if (time_left_sec === 0) phase = 'awaiting-settle';
    else if (time_left_sec < 3600) phase = 'ending-soon';
    else phase = 'open';

    return {
      epoch: Number(currentEpoch),
      startsAt: Number(startsAt),
      endsAt: Number(endsAt),
      status: statusName(status),
      humanPool: humanPool.toString(),
      agentPool: agentPool.toString(),
      humanCount: Number(humanCount),
      agentCount: Number(agentCount),
      humanWinner,
      agentWinner,
      humanPrize: humanPrize.toString(),
      agentCredits: agentCredits.toString(),
      time_left_sec,
      phase,
    };
  } catch (err) {
    // Graceful fallback — contract may not yet be deployed or RPC may be
    // unreachable. The /lotto page shows a "not yet deployed" state.
    return null;
  }
}
