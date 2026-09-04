import { PAID_TOWN_PRICE } from '../../functions/_lib/paid-town-actions.ts';

export type CapabilityAuthScope = 'none' | 'session' | 'x402' | 'director';
export type CapabilityReadiness = 'live' | 'degraded' | 'unavailable';

const FREE = { type: 'free' } as const;
const X402 = { type: 'x402', ...PAID_TOWN_PRICE } as const;
const RECEIPT_PATTERN = 'https://pointcast.xyz/api/x402/receipt/{txHash}';
const VERIFY = 'https://pointcast.xyz/api/x402/verify';

export interface CapabilityDefinition {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  schema: string;
  auth: CapabilityAuthScope;
  cost: typeof FREE | typeof X402;
  sideEffects: string[];
  receipts: string | null;
  verify: string | null;
  probe: {
    method: 'GET' | 'POST';
    path: string;
    expected: number[];
    body?: Record<string, unknown>;
    quoteOnly?: boolean;
  };
}

const schema = (name: string) => `https://pointcast.xyz/schemas/${name}.schema.json`;

export const AGENT_CAPABILITIES: CapabilityDefinition[] = [
  {
    id: 'capabilities.list', method: 'GET', path: '/api/capabilities',
    schema: schema('capabilities'), auth: 'none', cost: FREE, sideEffects: [], receipts: null, verify: null,
    probe: { method: 'GET', path: '/api/capabilities', expected: [200] },
  },
  {
    id: 'agents.challenge', method: 'POST', path: '/api/agents/challenge',
    schema: schema('agent-challenge'), auth: 'none', cost: FREE,
    sideEffects: ['stores a five-minute, single-use challenge without granting authority'], receipts: null, verify: null,
    probe: { method: 'GET', path: '/api/agents/challenge', expected: [200] },
  },
  {
    id: 'agents.register', method: 'POST', path: '/api/agents/register',
    schema: schema('agent-register'), auth: 'none', cost: FREE,
    sideEffects: ['creates an independent registered agent instance after Ed25519 proof'], receipts: null, verify: null,
    probe: { method: 'GET', path: '/api/agents/challenge', expected: [200] },
  },
  {
    id: 'agents.get', method: 'GET', path: '/api/agents/{agentId}',
    schema: schema('agent-instance'), auth: 'none', cost: FREE, sideEffects: [], receipts: null, verify: null,
    probe: { method: 'GET', path: `/api/agents/pci_${'0'.repeat(32)}`, expected: [404] },
  },
  {
    id: 'agents.rotate', method: 'POST', path: '/api/agents/{agentId}/rotate',
    schema: schema('agent-rotate'), auth: 'session', cost: FREE,
    sideEffects: ['retires the active key and installs a separately proven replacement key'], receipts: null, verify: null,
    probe: { method: 'GET', path: '/api/agents/challenge', expected: [200] },
  },
  {
    id: 'agents.revoke', method: 'POST', path: '/api/agents/{agentId}/revoke',
    schema: schema('agent-revoke'), auth: 'session', cost: FREE,
    sideEffects: ['revokes the active instance key immediately'], receipts: null, verify: null,
    probe: { method: 'GET', path: '/api/agents/challenge', expected: [200] },
  },
  {
    id: 'paid.bench', method: 'POST', path: '/api/agent/bench',
    schema: schema('paid-bench'), auth: 'x402', cost: X402,
    sideEffects: ['stores one public bench question', 'writes a durable action intent and 50/50 allocation row'],
    receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'POST', path: '/api/agent/bench', expected: [402], body: { question: 'capability probe' }, quoteOnly: true },
  },
  {
    id: 'paid.cast', method: 'POST', path: '/api/agent/cast',
    schema: schema('paid-cast'), auth: 'x402', cost: X402,
    sideEffects: ['casts one public room burst', 'writes a durable action intent and 50/50 allocation row'],
    receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'POST', path: '/api/agent/cast', expected: [402], body: { word: 'confetti' }, quoteOnly: true },
  },
  {
    id: 'paid.claim', method: 'POST', path: '/api/agent/claim',
    schema: schema('paid-claim'), auth: 'x402', cost: X402,
    sideEffects: ['reserves one daily claim', 'submits a Tezos transfer after settlement', 'writes a durable action intent and 50/50 allocation row'],
    receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'POST', path: '/api/agent/claim', expected: [402, 409], body: { to: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb' }, quoteOnly: true },
  },
  {
    id: 'actions.status', method: 'GET', path: '/api/actions/{id}',
    schema: schema('action-status'), auth: 'none', cost: FREE, sideEffects: [], receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'GET', path: `/api/actions/pai_${'0'.repeat(32)}`, expected: [404] },
  },
  {
    id: 'actions.by-tx', method: 'GET', path: '/api/actions/by-tx/{txHash}',
    schema: schema('action-by-tx'), auth: 'none', cost: FREE, sideEffects: [], receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'GET', path: `/api/actions/by-tx/0x${'0'.repeat(64)}`, expected: [404] },
  },
  {
    id: 'x402.receipt', method: 'GET', path: '/api/x402/receipt',
    schema: schema('x402-receipt'), auth: 'x402', cost: X402,
    sideEffects: ['settles the submitted Permit2 payment and stores a signed receipt'], receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'GET', path: '/api/x402/receipt', expected: [402], quoteOnly: true },
  },
  {
    id: 'x402.receipt-by-tx', method: 'GET', path: '/api/x402/receipt/{txHash}',
    schema: schema('x402-receipt-by-tx'), auth: 'none', cost: FREE, sideEffects: [], receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'GET', path: `/api/x402/receipt/0x${'0'.repeat(64)}`, expected: [404] },
  },
  {
    id: 'x402.verify', method: 'POST', path: '/api/x402/verify',
    schema: schema('x402-verify'), auth: 'none', cost: FREE, sideEffects: [], receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'GET', path: '/api/x402/verify', expected: [400] },
  },
  {
    id: 'x402.keys', method: 'GET', path: '/api/x402/keys',
    schema: schema('x402-keys'), auth: 'none', cost: FREE, sideEffects: [], receipts: null, verify: VERIFY,
    probe: { method: 'GET', path: '/api/x402/keys', expected: [200] },
  },
  {
    id: 'post-office.alias', method: 'POST', path: '/api/post-office/alias',
    schema: schema('post-office-alias'), auth: 'x402', cost: X402,
    sideEffects: ['creates, renews, or reclaims a forwarding alias', 'stores forwarding configuration but never mail'],
    receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'POST', path: '/api/post-office/alias', expected: [402], body: { name: 'capability-probe', forward: { kind: 'email', target: 'probe@example.com' } }, quoteOnly: true },
  },
  {
    id: 'post-office.status', method: 'GET', path: '/api/post-office/alias/{name}',
    schema: schema('post-office-status'), auth: 'none', cost: FREE, sideEffects: [], receipts: RECEIPT_PATTERN, verify: VERIFY,
    probe: { method: 'GET', path: '/api/post-office/alias/capability-probe-missing', expected: [404] },
  },
];

export const AGENT_CAPABILITY_INDEX = 'https://pointcast.xyz/api/capabilities';
export const AGENT_CAPABILITIES_PAGE = 'https://pointcast.xyz/capabilities';
export const AGENT_CAPABILITY_MAX_BYTES = 20 * 1024;
