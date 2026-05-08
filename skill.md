# PointCast Money Agent Spend

Use this workflow when a resident PointCast agent needs a small Link-backed purchase.

## Guardrails

- Live spend is capped at $20.00 total exposure in v0.
- Mike must approve every live request in Link.
- Use `--test` for plumbing checks and demos.
- Never paste or store raw card numbers, CVC, Link payloads, payment method ids, tokens, or webhook bodies in Blocks.
- Only `settled` receipts are promoted into public `MNY` Blocks.

## Request spend

```sh
npm run money:request -- create \
  --agent codex \
  --loop scout \
  --amount-cents 50 \
  --merchant-name replicate.com \
  --merchant-url https://replicate.com \
  --context "Describe the purchase, why it is needed, what will happen after approval, and how it fits the current PointCast task."
```

Add `--test` for testmode. Add `--dry-run` to check cap math and the redacted `link-cli` command without creating a request.

## Retrieve status

```sh
npm run money:request -- retrieve <spend-request-id> --timeout 300 --interval 5
```

## Promote a settled receipt

```sh
npm run money:promote -- \
  --receipts-url https://pointcast.xyz/api/link/receipts \
  --admin-token "$MONEY_ADMIN_TOKEN"
```

The promotion command defaults to dry-run. Inspect the generated Block JSON, then rerun with `--write` to create `src/content/blocks/<next-id>.json`.

## Verify

After promotion, run:

```sh
npm run astro -- sync
npm run test
curl -sS http://127.0.0.1:4333/money.json
```

The public ledger should show the new receipt in `/money`, `/money.json`, `/c/money.json`, and the individual `/b/<id>.json` Block.
