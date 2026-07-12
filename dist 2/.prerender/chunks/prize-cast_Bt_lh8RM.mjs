import contracts from './contracts_B1zhgPPX.mjs';

const TZKT_API_BASE = "https://api.tzkt.io/v1";
const PRIZE_CAST_PENDING_MESSAGE = "Not yet originated — ghostnet test pending";
const PRIZE_CAST_FIRST_DRAW_PLACEHOLDER = "first draw: next Sunday 18:00 UTC";
function withTimeout(ms = 4500) {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return void 0;
  }
}
async function fetchTzkt(path) {
  return fetch(`${TZKT_API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal: withTimeout()
  });
}
async function fetchTzktJson(path) {
  const response = await fetchTzkt(path);
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status}`);
  }
  return response.json();
}
async function fetchTzktNumber(path) {
  const response = await fetchTzkt(path);
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  return toNumber(payload);
}
function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === "bigint") return Number(value);
  return 0;
}
function toNullableNumber(value) {
  if (value === null || value === void 0 || value === "") return null;
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function pickAddress(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value?.address === "string") return value.address;
  if (typeof value?.alias === "string") return value.alias;
  return null;
}
function getPrizeCastContractAddress() {
  return (contracts.prize_cast?.mainnet).trim();
}
function getPrizeCastTzktUrl(kt1 = getPrizeCastContractAddress()) {
  return kt1.startsWith("KT1") ? `https://tzkt.io/${kt1}` : null;
}
function mutezToTez(mutez) {
  if (mutez === null || mutez === void 0 || !Number.isFinite(mutez)) return null;
  return mutez / 1e6;
}
function formatTezAmount(amount, digits = 2) {
  if (amount === null || amount === void 0 || !Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(amount)} ꜩ`;
}
function shortTezosAddress(address) {
  if (!address) return "—";
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}
function getNextPrizeCastDrawAt(from = /* @__PURE__ */ new Date()) {
  const next = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    18,
    0,
    0,
    0
  ));
  const daysUntilSunday = (7 - from.getUTCDay()) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilSunday);
  if (daysUntilSunday === 0 && from.getTime() >= next.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }
  return next;
}
function buildFallbackSnapshot() {
  return {
    kt1: "",
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
    winners: []
  };
}
async function getPrizeCastSnapshot() {
  const kt1 = getPrizeCastContractAddress();
  if (!kt1.startsWith("KT1")) {
    return buildFallbackSnapshot();
  }
  const errors = [];
  let tvlMutez = null;
  let storage = null;
  let drawOps = [];
  let winnerKeys = [];
  const [balanceResult, storageResult, drawsResult, winnersResult] = await Promise.allSettled([
    fetchTzktNumber(`/accounts/${kt1}/balance`),
    fetchTzktJson(`/contracts/${kt1}/storage`),
    fetchTzktJson(`/operations/transactions?target=${kt1}&entrypoint=draw&status=applied&limit=10`),
    fetchTzktJson(`/contracts/${kt1}/bigmaps/past_winners/keys?active=true&limit=10`)
  ]);
  if (balanceResult.status === "fulfilled") tvlMutez = balanceResult.value;
  else errors.push(`balance ${String(balanceResult.reason)}`);
  if (storageResult.status === "fulfilled") storage = storageResult.value;
  else errors.push(`storage ${String(storageResult.reason)}`);
  if (drawsResult.status === "fulfilled") drawOps = Array.isArray(drawsResult.value) ? drawsResult.value : [];
  else errors.push(`draws ${String(drawsResult.reason)}`);
  if (winnersResult.status === "fulfilled") winnerKeys = Array.isArray(winnersResult.value) ? winnersResult.value : [];
  else errors.push(`winners ${String(winnersResult.reason)}`);
  let accumulatedSince = null;
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
        const block = await fetchTzktJson(`/blocks/${lastDrawLevel}`);
        accumulatedSince = block?.timestamp ?? null;
      } catch (error) {
        errors.push(`block ${String(error)}`);
      }
    }
  }
  const principalMutez = toNullableNumber(storage?.vault_total);
  const prizePoolMutez = tvlMutez !== null && principalMutez !== null ? Math.max(0, tvlMutez - principalMutez) : null;
  const sortedWinnerKeys = [...winnerKeys].sort((a, b) => toNumber(b?.key) - toNumber(a?.key)).slice(0, 10);
  const winners = sortedWinnerKeys.map((entry, index) => {
    const value = entry?.value ?? {};
    const draw = sortedDraws[index] ?? null;
    const prizeMutez = toNumber(value?.prize);
    return {
      round: toNumber(entry?.key) + 1,
      winner: pickAddress(value?.winner) ?? "—",
      prizeMutez,
      prizeTez: mutezToTez(prizeMutez) ?? 0,
      block: toNullableNumber(value?.block),
      drawnAt: draw?.timestamp ?? null,
      opHash: typeof draw?.hash === "string" ? draw.hash : null,
      caller: pickAddress(draw?.sender)
    };
  });
  return {
    kt1,
    live: true,
    fetchError: errors.length > 0 ? errors.join(" · ") : null,
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
    winners
  };
}

export { PRIZE_CAST_PENDING_MESSAGE as P, getPrizeCastTzktUrl as a, PRIZE_CAST_FIRST_DRAW_PLACEHOLDER as b, getPrizeCastContractAddress as c, getNextPrizeCastDrawAt as d, formatTezAmount as f, getPrizeCastSnapshot as g, shortTezosAddress as s };
