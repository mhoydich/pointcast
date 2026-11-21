# Agent wallet signing

The public directory is `GET /api/agent-wallets`. `GET /api/agent-wallets/{id}`
returns that wallet's balance in mutez and up to 10 recent operations indexed
by TzKT. TzKT can lag a new submission.

## Configure a wallet

1. Apply the `pointcast-auth` migration `0035_agent_wallet_signing.sql` using
   the [D1 migrations workflow](../../.github/workflows/d1-migrations.yml).
   It works before or after v1 creates the wallet table. Fetch the wallet
   directory to provision the roster.
2. For each agent, generate an independent 32-byte random value and encode it
   as unpadded base64url. Give it to that agent through a secret store. Put the
   lowercase SHA-256 hex digest of the **encoded token** in
   `agent_wallets.bearer_token_hash` for that `agent_id`. A null digest disables
   signing. Replace the digest to rotate the token.
3. Keep the existing `POINTCAST_INTEGRATION_ENCRYPTION_KEY` that encrypted the
   v1 wallets. Rotating it requires re-encrypting those rows with their original
   agent-bound AAD. The default cap is 5,000,000 mutez per UTC day. Override
   `daily_cap_mutez` in that wallet row. Zero disables new submissions.
4. Optionally set `AGENT_WALLETS_RPC_URL` to a trusted Tezos mainnet RPC. The
   default is `https://mainnet.smartpy.io`. Set `AGENT_WALLETS_MINT_CONTRACT` to
   the approved FA2 contract address to enable minting. The contract must grant
   the wallet mint rights and expose the ABI below.

## Submit an operation

Send JSON with `Authorization: Bearer <token>` on both POST routes. Use an
`Idempotency-Key` for each intent and reuse it with the same body on retries.

| Route | JSON fields |
| --- | --- |
| `POST /api/agent-wallets/{id}/send` | `to`, positive integer `amountMutez` |
| `POST /api/agent-wallets/{id}/mint` | `contract`, `recipient`, nonnegative integer `tokenId`, positive integer `quantity` (default 1), `metadataUri` |

The mint route calls `%mint` with the annotated fields `to_`, `token_id`,
`amount`, and `token_info` (`map string bytes`). It attaches zero tez and
sets the empty `token_info` key to the UTF-8 bytes of an `ipfs://` or
`https://` URI pointing to TZIP-21 metadata. FA2 leaves the mint ABI to the
contract.

A `202` carries `operationHash` and one of `submitted`, `submission-unknown`,
or `recorded` (an idempotent retry). Check TzKT for chain status. The D1
audit row is written before injection and reserves the maximum transfer,
fees, and storage burn against the submission day's cap, including ambiguous
submissions. A new operation can proceed after the previous counter appears
at `head~2` or the previous branch's inclusion window expires.
