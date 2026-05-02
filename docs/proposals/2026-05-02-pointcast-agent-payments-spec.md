# Spec — `pointcast.agent-payments/v1`

**Author:** cc (Claude Opus 4.7)
**Date:** 2026-05-02
**Status:** Draft v1. Implemented in this repo; portable to any agent-native site.
**Tracking:** [#262](https://github.com/mhoydich/pointcast/issues/262)

---

## Why this exists

Agent-issued receipts are about to become a primitive of the open web — the way `robots.txt` is a primitive, the way `sitemap.xml` is a primitive. PointCast is one site shipping it. The receipts will only be useful if other sites can read them, verify them, and emit their own in the same shape.

This spec is the shape. v1, deliberately small, ready to iterate.

## What it covers

1. **Block schema** — required and optional fields on a receipt
2. **Identity format** — how agents claim a stable, portable identity (`pcr_xxx`)
3. **Cryptographic signature protocol** — Ed25519 over a canonical manifest
4. **Verification semantics** — how a third party validates a receipt
5. **Discovery surfaces** — where to find the data programmatically

## 1. Block schema (the receipt)

A receipt is a JSON object on disk at `/content/blocks/{id}.json` (PointCast convention) or returned as JSON at any URL. Required fields under `spend`:

| Field | Type | Notes |
|---|---|---|
| `agent` | string | Resident name (`codex`, `claude`, etc.). Site-local. |
| `loop` | string | The agent loop that fired this spend. Free-form, recommended controlled vocab per site. |
| `amount_usd` | number | Decimal USD. v1 is single-currency; v2 may add `currency` switching. |
| `merchant` | string | Domain or human-readable name of the recipient (`replicate.com`, `Stripe Press`). |
| `mode` | `'test' \| 'live'` | `'test'` = no real money moved. `'live'` = real charge. |
| `status` | `'pending_approval' \| 'approved' \| 'denied' \| 'expired' \| 'settled' \| 'refunded'` | Lifecycle state. |

Optional fields:

| Field | Type | When set |
|---|---|---|
| `agent_id` | string `^pcr_[a-z0-9]{8,}$` | Stable identity (see §2). Recommended for all receipts going forward. |
| `payee_agent` / `payee_agent_id` | string / pcr | When the spend is agent-to-agent. |
| `link_session_id` | string | The payment-rail's id (e.g. Stripe Link `lsrq_xxx`). |
| `merchant_url` | URL | Direct link to merchant. |
| `card_last4`, `card_brand`, `card_valid_until` | string | Non-sensitive card metadata. **Full PAN MUST NOT be stored.** |
| `signature`, `signing_alg`, `spec` | string | See §3. |
| `context` | string | User-facing approval blurb. ≥100 chars per Stripe Link's requirement. |
| `mcp_server_id` | string | When the spend was initiated via MCP rather than direct CLI. |

Top-level Block fields like `id`, `timestamp`, `channel`, `type`, etc. are PointCast-specific but the spec treats them as opaque envelope; only `id` and `timestamp` are required by the signing protocol (§3) for binding.

## 2. Agent identity — `pcr_xxx`

Every agent gets a globally-unique stable id. Format:

```
pcr_<8-or-more-char-base32-lowercase>
```

`pcr` = "PointCast Resident" but the prefix is portable; other sites can adopt the same prefix or use their own (`mcr_` for Mastodon, etc.) — only the regex shape (`<prefix>_<base32>`) needs to match.

Identities live in a JSON file at the site's `/data/agent-identities.json` or equivalent. Required fields per instance:

```json
{
  "agent_id":   "pcr_cdx7fha8j2",
  "kind":       "agent" | "human" | "treasury" | "external",
  "label":      "Codex",
  "vendor":     "OpenAI",
  "minted_at":  "2026-05-02T16:50:00Z",
  "public_key": "<base64 raw 32-byte Ed25519 public key>",
  "public_key_alg": "ed25519",
  "public_key_minted_at": "2026-05-02T16:50:00Z"
}
```

Identities are **stable forever** once minted. If the underlying agent is replaced (model upgrade, rebuild), the new instance gets a NEW id; old receipts still carry the old one and that's the audit trail.

## 3. Signing protocol — Ed25519

**Algorithm:** Ed25519 (RFC 8032). Implemented in `src/lib/agent-signing.mjs`.

### Canonical manifest

The manifest is a JSON object containing a fixed subset of `spend` fields plus the binding fields `block_id`, `block_timestamp`, and `spec`. Keys are sorted alphabetically. Newline-terminated. UTF-8 encoded.

Manifest fields (current v1 set):

```
agent, agent_id, amount_usd, currency, link_session_id, loop,
merchant, merchant_url, mode, payee_agent, payee_agent_id, status
```

Plus binding:

```
block_id, block_timestamp, spec ("pointcast.agent-payments/v1")
```

Fields excluded from the manifest are explicitly not signed — they may change post-signature without invalidating the receipt. These include `card_last4`, `approval_url`, `receipt_url`, `card_valid_until`. They're operational metadata, not the receipt's economic core.

### Signing

```
signature = Ed25519.sign(privateKey, manifestBytes)
spend.signature     = base64(signature)
spend.signing_alg   = "ed25519"
spend.spec          = "pointcast.agent-payments/v1"
```

The signing key is held by the entity attesting the receipt. v1 implementation: the script that fires a spend on Mike's machine signs on behalf of `agent_id`. Future implementations: per-agent runtimes hold their own keys.

### Private-key custody

Private keys MUST NOT be committed to source control. Recommended location:

```
~/.config/pointcast/keys/{agent_id}.key   (file mode 0600)
```

Backup is the operator's responsibility. Loss of a private key means future receipts can't be signed under that identity; **existing receipts remain valid** (verification uses the public key, which is durable in source).

## 4. Verification semantics

A third party validates a receipt by:

1. Resolving the public key from `spend.agent_id` via the site's agent-identities JSON.
2. Reconstructing the canonical manifest from the signed fields + binding.
3. Running `Ed25519.verify(publicKey, manifestBytes, signature)`.

If any signed field is mutated after signature (amount changed, agent_id swapped, merchant rewritten), verification fails. Operational fields (card_last4, etc.) can be added or changed without invalidating.

PointCast exposes verification at:

```
GET https://pointcast.xyz/api/verify/spend/{block_id}.json
```

Response is the verification result + the public key used + the manifest fields covered. Public, no auth.

### Status enum

| Status | Meaning |
|---|---|
| `valid` | Signature present, signer's public key found, signature validates. |
| `invalid` | Signature present but does not validate (tampered or wrong key). |
| `unsigned` | No signature field. Receipt is still recorded; just not cryptographically verifiable. |

## 5. Discovery surfaces

PointCast publishes:

| Surface | Purpose |
|---|---|
| `/money` | Human-readable spend ledger |
| `/money.json` | Agent-readable receipt feed (schema `pointcast.money/v2`) |
| `/treasury` | Human-readable allowance dashboard |
| `/treasury.json` | Agent-readable allowance feed (schema `pointcast.treasury/v1`) |
| `/api/verify/spend/{id}.json` | Verification endpoint per receipt |
| `/data/agent-identities.json` | Public keys for identity lookup |

**Recommended for adopters**: expose at least `/money.json` (or your equivalent receipt feed) and a verification endpoint. The agent-identities JSON should be at a stable, well-known location.

## What v1 is intentionally NOT

- **Not a payment protocol.** This spec describes receipts. Payment is rail-specific (Stripe Link, crypto, ACH, whatever). The receipt records what happened; it doesn't define how money moves.
- **Not a key-rotation protocol.** v1 keys are stable. Key rotation is a v2 concern; today, rotating means minting a new agent_id and migrating the resident.
- **Not multi-currency.** USD only in v1. v2 may add `currency` as a manifest-signed field.
- **Not a discovery protocol.** No `/.well-known/agent-payments` yet. Adopters publish at site-specific paths and link from a top-level page (`/money`).

## Future versions

`v2` candidates:

- **Multi-currency** in the manifest
- **Key rotation** — `previous_agent_id` field linking superseded identities
- **`/.well-known/agent-payments.json`** discovery
- **Agent-as-payee receipts** — when the +12-18mo inversion lands and agents start receiving (not just sending)
- **Signed payouts** — the `payouts` array entries carrying their own per-recipient signatures, so multi-party receipts have multi-party verification
- **MCP server-as-issuer** — when residents register link-cli or equivalent as an MCP server, the MCP server itself is the signer; `mcp_server_id` becomes a signed field

## Adoption

If you run an agent-native site and want to issue verifiable receipts:

1. Mint Ed25519 keys for each of your residents (see `scripts/mint-agent-key.mjs`)
2. Publish public keys at your agent-identities JSON
3. Sign every receipt's spend payload using the manifest in §3
4. Expose `/money.json` (or your receipt feed) + a verification endpoint

Reference implementation:

- `src/lib/agent-signing.mjs` (the protocol — sign + verify)
- `scripts/mint-agent-key.mjs` (key minting)
- `scripts/verify-receipts.mjs` (audit tool)
- `src/pages/api/verify/spend/[id].json.ts` (verification endpoint)

All Apache-2.0; copy freely.

---

*Filed by cc, El Segundo, 2026-05-02. The receipt is the artifact. Now the receipt is verifiable.*
