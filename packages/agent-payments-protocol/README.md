# `@pointcast/agent-payments-protocol`

Reference implementation of the **`pointcast.agent-payments/v1`** spec — Ed25519-signed receipts for agent-issued spends. Sign, verify, and discover.

```bash
npm install @pointcast/agent-payments-protocol
```

Or just copy the four files in `src/` — the whole protocol is ~250 lines, zero deps beyond Node's built-in `crypto`.

## What this is

When an AI agent makes a purchase on a user's behalf, you get a receipt. This package is the protocol that makes that receipt **verifiable**:

- "Did this spend really come from `codex-instance-A`?" — Ed25519 signature over a canonical manifest
- "Has anything been altered after the fact?" — tamper detection at the field level
- "How do I find another site's receipts?" — `/.well-known/agent-payments.json` discovery

Spec: [`pointcast.agent-payments/v1`](https://github.com/mhoydich/pointcast/blob/main/docs/proposals/2026-05-02-pointcast-agent-payments-spec.md).
Reference site: [pointcast.xyz](https://pointcast.xyz).

## Quick start — verify a receipt

```bash
npx @pointcast/agent-payments-protocol verify https://pointcast.xyz 0413
```

Output:

```
✓ https://pointcast.xyz /b/0413 — valid: signature valid
   agent:    codex (pcr_cdx7fha8j2)
   amount:   $0.50 usd
   merchant: replicate.com
   mode:     live
```

Exit code: 0 = valid, 1 = invalid, 2 = unsigned, 4 = fetch error.

## API

### Sign a receipt (programmatic)

```js
import { signSpend } from '@pointcast/agent-payments-protocol';

const spend = {
  agent: 'codex',
  agent_id: 'pcr_cdx7fha8j2',
  amount_usd: 0.50,
  currency: 'usd',
  merchant: 'replicate.com',
  loop: 'scout',
  mode: 'live',
  status: 'approved',
  link_session_id: 'lsrq_xxx',
};

const sig = signSpend(spend, blockId, blockTimestamp, '/path/to/keys/dir');
//   → { signature: 'base64...', signing_alg: 'ed25519', spec: 'pointcast.agent-payments/v1' }
```

### Verify a receipt (programmatic)

```js
import { verifySpend } from '@pointcast/agent-payments-protocol';

const block  = await fetch('https://pointcast.xyz/b/0413.json').then(r => r.json());
const idreg  = await fetch('https://pointcast.xyz/data/agent-identities.json').then(r => r.json());

const r = verifySpend(block, idreg);
//   → { ok: true, reason: 'signature valid' }
```

### End-to-end verify by URL

```js
import { verifyReceiptByUrl } from '@pointcast/agent-payments-protocol';

const r = await verifyReceiptByUrl('https://pointcast.xyz', '0413');
//   → { ok: true, reason: 'signature valid', status: 'valid', block: {...} }
```

Auto-discovers the site's `/.well-known/agent-payments.json` to find the right paths; falls back to convention if the well-known endpoint is missing.

### Discovery

```js
import { discover, fetchReceipts } from '@pointcast/agent-payments-protocol';

const env = await discover('https://pointcast.xyz');
//   → { spec, endpoints, signing, identity, ... }

const feed = await fetchReceipts('https://pointcast.xyz');
//   → { total_count, total_usd, receipts: [...] }
```

## What's signed (canonical manifest)

The manifest is a JSON object with these fields, sorted alphabetically, newline-terminated:

```
agent, agent_id, amount_usd, currency, link_session_id, loop,
merchant, merchant_url, mode, payee_agent, payee_agent_id, status,
block_id, block_timestamp, spec
```

**Operational fields are NOT signed:** `card_last4`, `card_brand`, `card_valid_until`, `approval_url`, `receipt_url`, `context`. They can be added or changed after signing without invalidating — credential metadata flows late, and the receipt's economic claim shouldn't tear over a `valid_until` update.

## Identity format

```
pcr_<8-or-more-char-base32-lowercase>
```

`pcr` = "PointCast Resident" but the prefix is portable; adopters can use their own. Stored in the site's identities JSON (default `/data/agent-identities.json`):

```json
{
  "instances": {
    "codex": {
      "agent_id":   "pcr_cdx7fha8j2",
      "kind":       "agent",
      "label":      "Codex",
      "vendor":     "OpenAI",
      "public_key": "base64-encoded-32-byte-ed25519-key",
      "public_key_alg": "ed25519"
    }
  }
}
```

Identities are **stable forever** once minted. Replacing the underlying agent (model upgrade, etc.) gets a NEW id; old receipts still carry the old one — that's the audit trail.

## Spec

See [`SPEC.md`](./SPEC.md) for the full protocol description, including v2 candidates (multi-currency, key rotation, MCP-server-as-issuer, agent-as-payee receipts, signed payouts).

## License

Apache-2.0. Copy freely. The receipt is the artifact; the receipt is verifiable.

— Built at [pointcast.xyz](https://pointcast.xyz). Reference implementation in [github.com/mhoydich/pointcast](https://github.com/mhoydich/pointcast).
