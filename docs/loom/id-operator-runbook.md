# Loom handles + ID: Mac operator runbook

**Draft handoff for Mike/Tess. These commands have NOT run against production.**
No merge or migration is authorized by a board post. This is a planned release,
not a normal merge: Pages automatically deploys main, and does not migrate D1.
Keep credentials, backups, one-time tokens and inventories on the operator's Mac,
never in chat, URLs, the board, screenshots, source control or shared logs.

## 1. Review, pin, pause

- Review PR 1724's final SHA with Tess. It includes 1762; do not deploy 1762 alone.
  Use a clean worktree at that reviewed SHA, Node 24, Python 3.11+ and the existing Wrangler
  sign-in. Do not rebase or force-push. Check pending CI and merge conflicts.
- In Cloudflare, confirm the production Pages project's `AUTH_DB` binding is
  `pointcast-auth` (`15de417a-2167-45e6-a7aa-340a7a99331c`, verify it).
  Confirm whether Loom actually uses `PC_LOOM_KV` or falls back to `VISITS`;
  do not assume a local wrangler binding is the production binding.
- Keep `LOOM_HANDLES_ENABLED=0` and `LOOM_ID_ENABLED=0`. These flags do NOT stop
  old guest writers. Operator must block all Loom mutations at the edge, including
  alternate hosts/MCP/proxy writers, and drain in-flight requests. Keep reads up.
  Verify POST is blocked externally. If a reliable write pause is unavailable,
  STOP: a safe legacy inventory cannot be established.

## 2. Back up and apply only 0035 + 0036 (while writes stay paused)

Run from the reviewed worktree on the Mac. The temporary config below deliberately
exposes only these two migrations; it cannot apply unrelated queued files.
Use the already-authenticated Wrangler account; never paste a credential here.

```sh
umask 077
loom_ops_dir=$(mktemp -d "${TMPDIR:-/tmp}/loom-id.XXXXXX")
mkdir "$loom_ops_dir/migrations"
cp migrations/auth/0035_loom_handles.sql migrations/auth/0036_loom_id_layer.sql "$loom_ops_dir/migrations/"
python3 - "$loom_ops_dir" <<'PY'
import pathlib,sys,tomllib
p=pathlib.Path(sys.argv[1]); cfg=tomllib.loads(pathlib.Path('wrangler.toml').read_text())
db=next(x for x in cfg['d1_databases'] if x['binding']=='AUTH_DB')
assert db['database_name']=='pointcast-auth'
(p/'wrangler.toml').write_text('name="loom-id-operator"\ncompatibility_date="2026-11-17"\n[[d1_databases]]\nbinding="AUTH_DB"\ndatabase_name="'+db['database_name']+'"\ndatabase_id="'+db['database_id']+'"\nmigrations_dir="migrations"\n')
PY
npx --yes wrangler@4.158.0 d1 export pointcast-auth --remote --config "$loom_ops_dir/wrangler.toml" --output "$loom_ops_dir/before.sql"
npx --yes wrangler@4.158.0 d1 migrations list pointcast-auth --remote --config "$loom_ops_dir/wrangler.toml"
# Confirm ONLY 0035 and 0036 are pending; stop on any unexpected schema/history.
npx --yes wrangler@4.158.0 d1 migrations apply pointcast-auth --remote --config "$loom_ops_dir/wrangler.toml"
npx --yes wrangler@4.158.0 d1 execute pointcast-auth --remote --config "$loom_ops_dir/wrangler.toml" --command "SELECT name FROM d1_migrations WHERE name IN ('0035_loom_handles.sql','0036_loom_id_layer.sql'); SELECT * FROM loom_handle_policy;"
```

If a table already exists but its migration is not recorded, or 0036 was applied
from a different revision, STOP and reconcile schema/ledger with the operator.
`CREATE TABLE IF NOT EXISTS` does not upgrade incompatible columns. Confirm
`loom_id_cards` has goal, lessons, spend_limit_usd, spend_period_days and wallet_address.
Do not drop tables or restore a live auth database blindly. Backup contains secrets.

## 3. Inventory every old name before allowing claims

With writes still blocked, wait for the provider's KV propagation window (at least
60 seconds). Privately provision a read-only KV API token in the Mac process's
`LOOM_INVENTORY_API_TOKEN` environment, without echoing it or putting it in shell history.
This separate variable does not replace Wrangler’s D1 operator credential.
Set `loom_account_id` and `loom_namespace_id` to the **verified production binding**.

```sh
node scripts/loom-legacy-inventory.mjs "$loom_account_id" "$loom_namespace_id" "$loom_ops_dir/inventory-1.json"
# After another propagation window, make a second complete inventory:
node scripts/loom-legacy-inventory.mjs "$loom_account_id" "$loom_namespace_id" "$loom_ops_dir/inventory-2.json"
python3 - "$loom_ops_dir" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1]); a=json.loads((p/'inventory-1.json').read_text()); b=json.loads((p/'inventory-2.json').read_text())
assert a['list_complete'] and b['list_complete'] and a['namespace']==b['namespace']
assert a['keys']==b['keys'], 'Not stable: keep writes paused and repeat'
assert b['keys'], 'Unexpected empty production inventory: verify binding'
print(len(b['keys']), 'stable log/out keys; operator must check expected coverage')
PY
node scripts/loom-handle-reservations.mjs "$loom_ops_dir/inventory-2.json" > "$loom_ops_dir/reserve.sql"
npx --yes wrangler@4.158.0 d1 execute pointcast-auth --remote --config "$loom_ops_dir/wrangler.toml" --file "$loom_ops_dir/reserve.sql"
npx --yes wrangler@4.158.0 d1 execute pointcast-auth --remote --config "$loom_ops_dir/wrangler.toml" --command "SELECT COUNT(*) AS reserved_hashes FROM loom_handle_legacy_keys;"
```

The inventory utility follows cursors for **both** `loom:log:` and `loom:out:` and
fails closed on incomplete pages; it never writes D1 or marks readiness. Review
counts against unique hashes in reserve.sql (log/out may share a hash), confirm
all historical namespaces used by old writers are covered, and retain private
inventory/backup records. Counts alone do not prove correct namespace coverage.
Only after that review may the operator run:

```sh
npx --yes wrangler@4.158.0 d1 execute pointcast-auth --remote --config "$loom_ops_dir/wrangler.toml" --command "UPDATE loom_handle_policy SET legacy_ready=1 WHERE id=1;"
```

## 4. Release and controlled activation

Keep writes paused until the reviewed code is merged by the release owner and
its Pages build/deploy is green on every writer. No agent in this task does that.
Verify reads work, both ID/claim POST gates return 503, and ownership enforcement
is present; then reopen guest writes. Separately enable claims and ID only after
preview acceptance (see `id-step-three.md`). No automatic environment changes here.

Use a disposable **new** test handle, never an old seat's name. Owner creates a
claim token in a private authenticated POST; the authenticated target redeems it
in a POST body. No token-bearing URL, browser GET redemption, key generation or
clipboard/chat handoff. Confirm old holder's append/save/edit is refused after
continue; new holder works; unsigned claimed-name spoofing fails; guest posts stay
unmarked; public card reads contain no credentials. No live test posts without
operator approval. Phone-only runner/key transport remains a separate human setup.

## Stop / rollback

On trouble, set both feature flags to 0 to stop new claims/transfers/saves. Existing
holder checks continue; these flags are not a posting kill switch. Block mutations
at the edge if necessary. Keep additive tables and reservations; never roll back
to code that ignores claimed handles/holders while writes are enabled. Fix forward
under review. D1 holder updates are atomic, but a KV append already admitted before
a handover may finish afterward; the existing lost-write issue is not repaired here.
