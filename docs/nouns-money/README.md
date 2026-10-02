# Nouns Money developer workshop

This folder documents the first collectible-art and local payment-sandbox release. The in-site book is `/nouns-money/docs/`, the developer dashboard is `/nouns-money/developers/`, and the machine contract is `/nouns-money/openapi.json` (`public/nouns-money/openapi.json` in source).

The public catalog contains 100 verified source designs using Nouns #0–99, identified as `nm100-000` through `nm100-099`. Collection records are artwork preferences, with no gas, monetary value, token ownership or physical-possession claim. The current art rules are voluntary art trades, never sold for cash. The payment sandbox has test intents and local demo receipts; real payment, redemption, issuance, backing assets and merchant settlement remain disabled.

## Run the example

Use Node 24 from the PointCast checkout:

```sh
node docs/nouns-money/quickstart.mjs
```

The script imports `packages/nouns-money-sdk/src/index.ts` directly. It asserts repeated creation, stable confirmation receipts, retrieval, cancellation and terminal-state protection, using an explicit `MemorySandboxStore`. It makes no HTTP requests or blockchain operations. Nothing is published to a package registry.

The browser ES module is `/nouns-money/sdk.js`; the original TypeScript source is `/nouns-money/sdk.ts`. In a browser module on PointCast:

```js
import { NounsMoneySandbox } from '/nouns-money/sdk.js';

const sandbox = new NounsMoneySandbox();
const intent = await sandbox.createIntent(
  { label: 'One-note art demo', noteCount: 1, mode: 'test' },
  { idempotencyKey: 'browser:create:0001' },
);
const confirmed = await sandbox.confirmIntent(
  intent.id,
  { noteIds: ['nm100-000'], mode: 'test' },
  { idempotencyKey: 'browser:confirm:0001' },
);
console.log(confirmed.receipt);
```

Use one stable idempotency key for each deliberate mutation and reuse it on retries. Keys are 16–128 ASCII letters, digits, periods, underscores, colons or hyphens. The key namespace is global within the store. Reusing a key with another operation or normalized payload raises `idempotency_conflict`. Intents progress from `requires_notes` to `succeeded` or `canceled`; both terminal states are protected. A same-selection confirmation retains the same receipt. Replaying a creation key returns the original creation result; retrieve the intent for its current status.

The default browser store is IndexedDB database `pointcast-nouns-money-sandbox-v1`, shared across tabs and sign-ins at that browser origin. It is independent of the account collection and visible to other people using that browser. It is not a server-verified payment ledger. An explicit memory store lasts for the store instance. Capacity is 250 intents and 1,000 saved mutation keys, with no silent eviction. Storage errors must never be shown as success.

## Implemented HTTP API

- `GET /nouns-money/catalog.json` is a public, read-only art catalog.
- `GET /api/me/nouns-money` reads the signed-in account collection.
- `POST /api/me/nouns-money` collects exactly one design.
- `DELETE /api/me/nouns-money` removes exactly one design.

Collection mutations accept exactly `{ "noteId": "nm100-000" }`, with `Content-Type: application/json`, a request body no larger than 256 bytes, Origin exactly matching the request origin, and `X-PointCast-User` matching `userId` from the displayed GET response. This expected-account consistency header is not an authentication credential; missing/mismatched values return `account-changed` (409). Existing signed HttpOnly `pc_session` authentication applies; there are no developer API keys or cross-origin writes. The total shared account-state document is capped at 16 KiB. Successful mutations return the current collection and `changed`; duplicate collect/removal returns `changed: false`. Remove then recollect creates a new timestamp. The generic profile-state PUT rejects this collection slot with `collection-endpoint-required`.

The OpenAPI specification models only these actual HTTP paths. `createIntent`, `confirmIntent`, `cancelIntent`, `retrieveIntent` and `listIntents` are local SDK methods, not HTTP endpoints. Webhooks and hosted/live checkout are not implemented. `NounsMoneyClient` wraps only the real catalog and collection paths; errors expose `code`, with HTTP `status` and `reason` when available.

Anonymous collection remains a device-local preference list, with temporary memory if browser storage is unavailable. Sign-in starts a separate account collection and never imports anonymous notes automatically. Failed account reads display an unavailable state rather than treating local data as account-saved. Account switching fetches the selected account’s set. Sandbox records do not move with the account.

## Source and rights

The source-set provenance is `/images/nouns-money/source-100/provenance.json`. It records the exact original archive hash and source verification. Catalog IDs do not convey source-NFT ownership. The older ten-design collection and generated visual studies remain separate sets with their own provenance.

Nouns art is CC0; this does not imply Nouns DAO endorsement. The upstream provenance separately identifies source software licensing. No blanket license is added over PointCast code, fonts or third-party assets. Follow each existing component’s license and keep source credits and provenance with copies.

## Proposed sponsored Tezos companion

Nothing in this release signs, mints, transfers or deploys a Nouns Money token. A future implementation could bind a verified recipient to an expiring server-verified wallet challenge, authorize an issuer-funded FA2 mint, and reconcile the observed chain result. The sponsor would pay authorized fees and storage costs. No collector gas means sponsored costs, not a zero-fee chain. A mint entrypoint is contract-specific; later transfers do not become sponsored automatically.

This is a design inference from official references, checked on 2 October 2026:

- [Tezos FA2 architecture](https://docs.tezos.com/architecture/tokens/FA2): token types, required entrypoints and optional contract-specific minting.
- [SmartPy minting and burning tutorial](https://docs.tezos.com/tutorials/smartpy-fa2-fungible/minting-and-burning): administrator-controlled minting to recipients.
- [Octez Connect signing](https://octez-connect.tezos.com/guides/sign-payload/): wallet data-signing facilities, requiring a separately designed challenge/verifier.
- [Octez blocks and operations](https://octez.tezos.com/docs/active/blocks_ops.html): operation processing and costs.

Separate owner authorization, reviewed contract and signer, explicit sponsorship budget, abuse controls, recovery and real-chain testing are required before activation. No credential, contract, fee payment or wallet signature action is part of this release. Issuer, backing asset, merchant network and legal setup are undecided. There is no commitment to future issuance, allocation, return, airdrop or redemption.
