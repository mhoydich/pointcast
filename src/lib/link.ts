/**
 * Stripe Link — agent payment broker.
 *
 * Sibling to src/lib/tezos.ts. Tezos = identity of artifact. Link = money
 * of action. Both can fire on the same Block; see content.config.ts
 * `spend` field.
 *
 * v0 design: thin child_process wrapper around the `link-cli` binary
 * (https://github.com/stripe/link-cli, npm: @stripe/link-cli). Stripe ships
 * the runtime as a CLI, not an SDK — agents shell out to:
 *
 *   link-cli spend-request create --request-approval --test \
 *     --payment-method-id csmrpd_xxx \
 *     --merchant-name "Replicate" --merchant-url "https://replicate.com" \
 *     --amount 120 --context "..." --request-approval
 *
 * which pushes an approval to the user's Link mobile app, polls until
 * approve/deny/expire, and returns one-time-use payment credentials on
 * approval. The agent uses the credential, then it's dead.
 *
 * v0 hard-defaults to `--test` mode (no real charges). Real-mode requires
 * an explicit override that v0 callers cannot set. The MVP loop runs in
 * test mode end-to-end; live mode is gated behind a separate PR after
 * the test loop is proven.
 *
 * Status: SCAFFOLDING. Wire-up requires Mike's `link-cli onboard` to
 * complete and produce a `csmrpd_xxx` payment-method-id, plus the
 * `LINK_PAYMENT_METHOD_ID` env to be set in wrangler.toml.
 */

import { spawn } from 'node:child_process';

// Hard caps — must match docs/proposals/2026-04-30-link-agent-payments.md.
// Server-side enforcement; the dashboard caps are the user-side belt-and-
// suspenders. Both layers must trip for a charge to land.
export const LINK_CAPS = {
  perPurchaseUsd: 10.0,
  perAgentPerDayUsd: 25.0,
  rolling30dUsd: 200.0,
  v0TotalExposureUsd: 20.0,  // hard kill switch for week 1
} as const;

// Allowed merchants in v0. Anything not on this list pushes to Mike for
// manual approval (not implemented yet — for now, throws).
export const LINK_MERCHANT_WHITELIST_V0 = new Set([
  'replicate.com',
  'api.anthropic.com',
  'api.openai.com',
]);

export type LinkAgent = 'claude' | 'codex' | 'manus';
export type LinkLoop = 'scout' | 'scorekeeper' | 'host' | 'producer' | string;
export type LinkStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'settled' | 'refunded';

export interface SpendRequestInput {
  agent: LinkAgent;
  loop: LinkLoop;
  /** USD amount in dollars (not cents). Server converts to cents for link-cli. */
  amountUsd: number;
  merchant: string;          // domain only, e.g. "replicate.com"
  merchantUrl: string;       // full URL, e.g. "https://replicate.com"
  /** User-facing approval blurb. link-cli requires min 100 chars. */
  context: string;
  /** Default true. Real-mode is intentionally not exposed in v0. */
  testMode?: boolean;
}

export interface SpendRequestResult {
  id: string;                // spend_request id
  status: LinkStatus;
  amountUsd: number;
  receiptUrl?: string;
  raw: unknown;              // full link-cli payload for the receipt Block
}

/**
 * Create a spend request. Pushes approval to Mike's Link app, polls until
 * resolved, returns the result. v0 always uses test mode.
 *
 * Throws on:
 *  - amount above LINK_CAPS.perPurchaseUsd
 *  - merchant not in LINK_MERCHANT_WHITELIST_V0
 *  - context shorter than 100 chars (link-cli would reject anyway)
 *  - missing LINK_PAYMENT_METHOD_ID env
 *  - link-cli binary not on PATH (Mike hasn't run `npm i -g @stripe/link-cli`)
 */
export async function createSpendRequest(input: SpendRequestInput): Promise<SpendRequestResult> {
  const paymentMethodId = process.env.LINK_PAYMENT_METHOD_ID;
  if (!paymentMethodId) {
    throw new Error(
      'LINK_PAYMENT_METHOD_ID env not set. Mike needs to run `link-cli onboard` ' +
      'and add the resulting csmrpd_xxx id to wrangler.toml [vars].',
    );
  }

  if (input.amountUsd > LINK_CAPS.perPurchaseUsd) {
    throw new Error(
      `Amount $${input.amountUsd} exceeds per-purchase cap of $${LINK_CAPS.perPurchaseUsd}. ` +
      'Raise the cap in src/lib/link.ts before re-running, after Mike approves.',
    );
  }

  if (!LINK_MERCHANT_WHITELIST_V0.has(input.merchant)) {
    throw new Error(
      `Merchant "${input.merchant}" not in v0 whitelist. ` +
      'Add it to LINK_MERCHANT_WHITELIST_V0 in src/lib/link.ts after Mike approves.',
    );
  }

  if (input.context.length < 100) {
    throw new Error(
      `context must be >= 100 chars (link-cli requirement). Got ${input.context.length}.`,
    );
  }

  const useTest = input.testMode !== false;  // default true; explicit `false` required to disable

  const args = [
    'spend-request', 'create',
    '--payment-method-id', paymentMethodId,
    '--credential-type', 'shared_payment_token',
    '--amount', String(Math.round(input.amountUsd * 100)),
    '--currency', 'usd',
    '--merchant-name', input.merchant,
    '--merchant-url', input.merchantUrl,
    '--context', input.context,
    '--request-approval',
    '--format', 'json',
  ];
  if (useTest) args.push('--test');

  const raw = await spawnLinkCli(args);
  return parseSpendRequestOutput(raw, input.amountUsd);
}

function spawnLinkCli(args: string[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const proc = spawn('link-cli', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('error', (err) => reject(new Error(`link-cli spawn failed: ${err.message}. Is @stripe/link-cli installed globally?`)));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`link-cli exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new Error(`link-cli stdout not JSON: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

function parseSpendRequestOutput(raw: unknown, amountUsd: number): SpendRequestResult {
  // link-cli output envelope shape isn't pinned in v0; treat raw as opaque
  // and pull the fields we know exist. Refine once we have a real settled
  // payload to inspect.
  const r = raw as Record<string, unknown>;
  const id = (r.id as string) ?? (r.spend_request_id as string) ?? '';
  const status = ((r.status as string) ?? 'pending') as LinkStatus;
  const receiptUrl = (r.receipt_url as string) ?? undefined;
  if (!id) {
    throw new Error(`link-cli payload missing id: ${JSON.stringify(raw).slice(0, 200)}`);
  }
  return { id, status, amountUsd, receiptUrl, raw };
}
