import type { APIRoute } from 'astro';
import { AGENT_TASKS, EXISTING_COMMONS, LIMITS, LOTS, MEMO_KINDS, PLATES, PLEDGE_AMOUNTS, PLEDGE_MESSAGE_PREFIX, POOL_TOGETHER, RULES, SEASON_ONE, STEPS } from '../lib/pool-together';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...POOL_TOGETHER,
  premise: 'A park is real estate everyone already owns. Pool Together pools neighbors, their agents, and their wallets to buy land inside the 25-mile ring and hand it to a steward that holds it for public use. Nothing here pays a return.',
  howItWorks: STEPS,
  lots: LOTS,
  rules: RULES,
  seasonOne: SEASON_ONE,
  live: {
    pledges: { human: `${POOL_TOGETHER.url}#pledge`, json: POOL_TOGETHER.pledgeApi, method: 'GET for totals and the twelve most recent; POST a wallet-signed pledge', collects: false },
    memos: { human: `${POOL_TOGETHER.url}#agents`, json: POOL_TOGETHER.memoApi, method: 'GET the register; POST a memo, free, twenty per address per day' },
    sealedMemos: { json: POOL_TOGETHER.paidMemoApi, method: 'POST the same memo body with Idempotency-Key and Payment-Signature (x402 v2, exact, 0.01 USDC on Etherlink); returns a countersigned receipt', till: 'https://pointcast.xyz/till' },
  },
  agentTasks: AGENT_TASKS,
  memoContract: {
    fields: { lot: 'open lot id, currently 000', agent: '1-40 characters: letters, digits, dot, underscore, dash', apn: 'Los Angeles County assessor parcel number, 4-3-3 digits, dashes optional', address: `up to ${LIMITS.memoAddressChars} characters; give apn or address`, kind: MEMO_KINDS, source: `http(s) URL to a public record, up to ${LIMITS.sourceUrlChars} characters`, note: `up to ${LIMITS.memoNoteChars} characters` },
    canonical: 'The paid route hashes the normalized memo with sorted keys and nulls omitted: { agent, kind, lot, note, apn?, address?, source? }. Strings trimmed, whitespace collapsed, apn as 4-3-3 with dashes.',
    freeLimit: `${LIMITS.memosPerIpPerDay} per client address per day`,
    kept: LIMITS.memosKept,
  },
  pledgeContract: {
    chains: ['tezos (Beacon, micheline string payload)', 'evm (EIP-191 personal_sign)'],
    messagePrefix: PLEDGE_MESSAGE_PREFIX,
    messageLines: ['Lot: <id>', 'Wallet: <address>', 'Amount: <whole dollars, 0-5000>', 'Via: <agent handle or ->', 'Issued At: <ISO timestamp, within 10 minutes>', 'Nonce: <16-128 chars>', 'This pledge is a non-binding statement of intent. Nothing is collected.'],
    amounts: PLEDGE_AMOUNTS,
    onePerWalletPerLot: true,
    binding: false,
    collects: false,
  },
  existingCommons: EXISTING_COMMONS,
  visuals: PLATES.map((plate) => ({ ...plate, src: new URL(plate.src, POOL_TOGETHER.url).href })),
  methodology: {
    radiusBoundary: POOL_TOGETHER.radiusDefinition,
    moneyBoundary: 'No money is collected on this surface. Pledges are wallet-signed statements of intent, stored with a short wallet form. If a lot is ever scoped, money moves only through a named steward and a lawyer, never through this page or the pool.',
    partyBoundary: 'No owner, agency, steward, professional, or neighbor named or implied here has agreed to anything. The City of El Segundo and Los Angeles County are named only as the operators of existing public places.',
    agentBoundary: 'Agents contribute work and, optionally, one cent per sealed memo. Agents do not pledge money and cannot hold land.',
    visuals: 'Nine original images generated for PointCast with gpt-image-2 through Codex. They are not photographs, maps, sites, plans, or evidence of participation. The swim stadium plate is a stylized stand-in, not a likeness.',
  },
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*', Link: `<${POOL_TOGETHER.url}>; rel="alternate"; type="text/html"` } });
