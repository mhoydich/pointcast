/**
 * /.well-known/agent-payments.json — discovery surface for agent crawlers.
 *
 * Per spec pointcast.agent-payments/v1. Standardized location any agent or
 * external auditor can hit to find the receipt feed, identity registry,
 * verifier endpoint, and protocol spec without hardcoding paths.
 *
 * RFC 5785 (.well-known URIs) is the convention; agent-payments is a
 * proposed registration in that namespace. Until formally registered,
 * adopters use this filename per the v1 spec.
 *
 * Response shape:
 *
 *   {
 *     spec: 'pointcast.agent-payments/v1',
 *     issuer: { name, url, email? },
 *     endpoints: {
 *       receipts:        '/money.json',
 *       treasury:        '/treasury.json',
 *       identities:      '/data/agent-identities.json',
 *       verifier:        '/api/verify/spend/{block_id}.json',
 *       spec_doc:        '...'
 *     },
 *     signing: { algorithm, manifest_fields, key_format, key_size_bytes },
 *     supported_modes: ['test', 'live'],
 *     supported_currencies: ['usd'],
 *     ...
 *   }
 *
 * Agents discovering PointCast learn:
 *   - Where the receipt feed lives
 *   - Which signing algorithm is in use
 *   - How to look up an agent's public key
 *   - How to verify a specific receipt
 *   - The full protocol spec to copy
 */
import type { APIRoute } from 'astro';
import {
  SPEC_VERSION,
  SIGNING_ALG,
  MANIFEST_FIELDS,
} from '../../lib/agent-signing.mjs';
import { buildCabinetCatalog } from '../../data/agent-cabinet';
import {
  X402_CURRENT_SPEC_PROXY,
  X402_PAYMENT_PROFILE,
  X402_PROFILE_REVIEWED_AT,
  X402_PROXY,
  X402_WITNESS_TYPE,
} from '../../lib/x402';

export const GET: APIRoute = async () => {
  const cabinet = buildCabinetCatalog();
  const body = {
    spec: SPEC_VERSION,
    spec_url: 'https://github.com/mhoydich/pointcast/blob/main/docs/proposals/2026-05-02-pointcast-agent-payments-spec.md',
    generated_at: new Date().toISOString(),
    issuer: {
      name: 'PointCast',
      url: 'https://pointcast.xyz',
      operator: 'Mike Hoydich',
      operator_handle: 'mike',
      operator_kind: 'human',
    },
    endpoints: {
      receipts:           '/money.json',
      receipts_human:     '/money',
      treasury:           '/treasury.json',
      treasury_human:     '/treasury',
      identities:         '/data/agent-identities.json',
      // Verifier is templated per block id; agents substitute {block_id}.
      verifier_template:  '/api/verify/spend/{block_id}.json',
      block_template:     '/b/{block_id}/',
      block_json_template:'/b/{block_id}.json',
      spec_doc:           '/docs/proposals/2026-05-02-pointcast-agent-payments-spec.md',
    },
    signing: {
      algorithm: SIGNING_ALG,
      key_format: 'raw-base64-32-bytes-for-public; pkcs8-pem-for-private',
      key_size_bytes: 32,
      manifest_fields: MANIFEST_FIELDS,
      manifest_binding_fields: ['block_id', 'block_timestamp', 'spec'],
      manifest_excluded_operational: ['card_last4', 'card_brand', 'card_valid_until', 'approval_url', 'receipt_url', 'context'],
      canonical_form: 'JSON with alphabetically sorted keys, newline-terminated, UTF-8',
    },
    identity: {
      format: 'pcr_<8-or-more-char-base32-lowercase>',
      kinds: ['agent', 'human', 'treasury', 'external'],
      lookup: 'GET /data/agent-identities.json then find instances[*].agent_id matching',
    },
    supported_modes: ['test', 'live'],
    supported_currencies: ['usd', 'usdc'],
    supported_credential_types: ['card', 'shared_payment_token', 'onchain-permit2'],
    payment_rails: ['stripe-link', 'x402'],
    x402: {
      version: 2,
      scheme: 'exact',
      network: 'eip155:42793',
      network_name: 'Etherlink (Tezos EVM L2)',
      asset: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9',
      asset_symbol: 'USDC',
      asset_decimals: 6,
      transfer_method: 'permit2',
      facilitator: 'https://exp-faci.bubbletez.com',
      endpoints: { receipt: '/api/x402/receipt', ledger: '/api/x402/receipt?list=1', human: '/x402' },
      receipt_shape: 'pointcast.agent-payments/v1 spend block + settlement{rail,network,tx,asset,payer,pay_to}',
      note: 'First live on-chain rail. One cent USDC; the countersigned receipt is the product.',
    },
    agent_cabinet: {
      status: cabinet.status.offers,
      preview_only: cabinet.previewOnly,
      live_offers: cabinet.counts.liveOffers,
      catalog: '/x402/collect.json',
      human: '/x402/collect',
      challenge: '/api/agent-cabinet/challenge',
      collect: '/api/agent-cabinet/collect',
      status_endpoint: '/api/agent-cabinet/status',
      payment: 'x402 exact Permit2 on Etherlink USDC',
      payment_profile: {
        id: X402_PAYMENT_PROFILE,
        compatibility: 'facilitator-specific-not-canonical-current-permit2',
        spender: X402_PROXY,
        witness_type: X402_WITNESS_TYPE,
        current_canonical_proxy: X402_CURRENT_SPEC_PROXY,
        reviewed_at: X402_PROFILE_REVIEWED_AT,
      },
      delivery: 'sponsored Tezos mainnet FA2 transfer to a separately proven tz1/tz2/tz3/tz4 recipient',
      post_payment_delivery: 'After durable settlement, repeat the exact collect POST while intent.next.action is resume-delivery, honoring retryAfterSeconds or Retry-After; it never resubmits payment. Poll GET status only after next.action becomes poll-status. Stop on operator review actions.',
      completion_proofs: 'The x402 receipt and Tezos operation are independently verifiable. PointCast does not issue a combined countersigned completion receipt.',
      identity_boundary: 'The EVM payer, optional pci_ caller, pcr_ resident profile, and Tezos recipient are independent identities.',
      attribution_recovery: 'A pci_ key is checked through settlement only. An exact already-paid delivery replay may omit attribution so key expiry or revocation cannot strand the proven Tezos recipient.',
      launch_boundary: cabinet.previewOnly
        ? 'The endpoints fail closed until fixed metadata, minted sponsor inventory, fee budgets, and mainnet launch approval all verify.'
        : 'The committed publication overlay verifies fixed metadata and sponsor inventory. Current quote and delivery availability still requires a successful runtime status check and enabled operational gates.',
    },
    offers: [
      {
        sku: 'PC-25-2026',
        name: 'PointCast 25 / 2026 Founding Season Ticket',
        kind: 'digital-editorial-patronage',
        amount: 2500,
        currency: 'usd',
        recurring: false,
        available: true,
        human: 'https://pointcast.xyz/25',
        machine: 'https://pointcast.xyz/25.json',
        terms: 'https://pointcast.xyz/25/terms',
        checkout: 'https://pointcast.xyz/api/25/checkout',
        checkout_mode: 'stripe-hosted-redirect',
        pointcast_card_capture: false,
      },
    ],
    agentic_commerce: {
      readiness: 'machine-readable-offer-and-hosted-checkout',
      stripe_agentic_commerce_suite: 'private-preview-eligibility-pending',
      acp_checkout_api: 'not-enabled',
      shared_payment_token_processing: 'not-enabled',
      authorization_boundary:
        'An agent may discover and present the offer. Purchase completion requires the buyer-authorized Stripe-hosted checkout until a separately reviewed ACP integration is enabled.',
      reference: 'https://docs.stripe.com/agentic-commerce',
    },
    // Discovery hint: agents implementing the spec should look up receipts
    // via /money.json (paginated when archive is large; currently full list)
    // and verify each via the verifier_template.
    crawl_hint: {
      list_endpoint: '/money.json',
      list_count_field: 'total_count',
      list_items_field: 'receipts',
      verify_each: true,
    },
    license: 'Apache-2.0',
    references: {
      issue: 'https://github.com/mhoydich/pointcast/issues/262',
      framing_post: 'https://pointcast.xyz/b/0410',
      forward_look: 'https://pointcast.xyz/b/0420',
    },
    notes: 'This is a draft surface. Until /.well-known/agent-payments is formally registered with IANA, adopters use this path per the v1 spec. Stable enough to crawl; the SHAPE is versioned via the `spec` field.',
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=900',
    },
  });
};
