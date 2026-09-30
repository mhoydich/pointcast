# Me library: activation and recovery

This runbook covers the account Keeps store, named collections, account-backed public profiles, and their public HTML/JSON projections. The implementation uses the existing `AUTH_DB` (`pointcast-auth`) and PointCast session. It does not create an identity provider or require a wallet.

The code and migration files are being prepared for review. Applying SQL, changing production bindings or flags, and deploying are separate release actions. Nothing in this document records those actions as completed.

## Code and schema

| Path | Responsibility |
| --- | --- |
| `functions/api/keeps.ts` | Existing authenticated Keeps API; GET, POST, DELETE and versioned PATCH. |
| `functions/api/me/_keeps-store.ts` | D1 import, edits, migration marker and legacy compatibility. |
| `src/lib/keeps-client.ts` | Shared guest/account shelf, explicit imports, account-change isolation. |
| `src/components/MeLibrary.astro`, `src/scripts/me-library.ts` | Saved, collection and profile experience within `/me`. |
| `functions/api/me/_library.ts` | Ownership, validation, draft views and public projection. |
| `functions/api/me/collections.ts`, `profile.ts` | Create/edit, preview, publish and unpublish. |
| `functions/collections/[id].ts`, `functions/people/[id].ts`, `functions/api/me/_public.ts` | Request-time public HTML and `.json` routes. |
| `functions/api/me/export.ts` | Owner-only Me JSON export. |
| `functions/api/me/report.ts`, `moderate.ts` | Signed-in reports and director-authorized hide/release. |

Apply both SQL files to the existing auth database, in order:

1. `migrations/auth/0029_me_keeps.sql`: `me_keeps`, the per-account cap trigger and `me_keeps_migrations`.
2. `migrations/auth/0030_me_collections.sql`: `me_collections`, its cap trigger, `me_profiles` and `me_reports`.

`me_keeps.id` preserves the old `post:…` / `link:…` alias within its account. `item_id` is an opaque UUID. Deleting and re-adding the same alias creates a different UUID. Published collections store both item and membership identities internally, then filter against current records before serving a public projection. A later re-add therefore does not resurrect an old published card.

## Flag states

The default is **off**: leave `ME_KEEPS_D1` unset or set it to `"0"` until the operational prerequisites below are complete. SQL existing in the database is not itself activation.

| Runtime value | Unmigrated account | Already migrated account |
| --- | --- | --- |
| Unset / `"0"` | Hardened legacy KV Keeps; collections/profile/export unavailable. | Continues using D1; never writes back to KV. |
| `"pause"` | Legacy shelf can be read; Keeps and ordinary library mutations return 503. No first migration. | D1 reads remain available; ordinary owner writes return 503. |
| `"1"` | First authenticated use copies the frozen KV shelf and records a migration marker atomically, then uses D1. | Uses D1 only. |

The flag pauses ordinary shelf/collection/profile writes. It does not disable read-only public pages, reports, or the director's moderation endpoint. Public pages continue to apply their publication and withdrawal checks.

Missing D1/schema or a database failure while D1 is authoritative is an unavailable state, not permission to write KV. Existing sessions and wallet-owned `/p/{handle}` profiles retain their separate authority.

## Preflight and backup

1. Freeze the reviewed release SHA. Record the production deployment, preview deployment and binding inventory separately. Check every writer to `VISITS` keys beginning `keeps:v1:`: canonical routes, custom domains, old Pages deployment URLs, preview aliases, scripts and operators. A preview that points at production storage is also a production writer.
2. Rehearse against isolated preview D1 and KV bindings with synthetic accounts. Never bind an unreviewed preview to production `AUTH_DB` or `VISITS`.
3. Check the remote migration ledger before applying anything. This repository has older migrations; the normal migration command applies all pending files, not just the two Me files. Review and resolve any unrelated pending migration before proceeding.

```sh
npx wrangler d1 migrations list pointcast-auth --remote
```

4. Choose an access-restricted, durable backup destination outside the checkout and temporary directories. Set `ME_BACKUP_DIR` to that approved location. Export the D1 database before schema changes, and inventory/export every existing `keeps:v1:` KV record through the approved operator tooling. Preserve the exact key, raw value, observation time, item count and checksum. Include the completed key-list pagination manifest. Backups contain private account data; do not commit them or paste their contents into logs, issues or this runbook.

```sh
umask 077
mkdir -p "${ME_BACKUP_DIR:?Set an approved private backup directory}"
npx wrangler d1 export pointcast-auth --remote --output "$ME_BACKUP_DIR/auth-before-me.sql"
```

5. Confirm that the backup can be read and that its inventory matches the source. Select the retention owner and deletion date before activation; a proposed 30-day migration recovery window is an operational choice, not automatic cleanup implemented by this feature. Original KV shelves remain unchanged by the migration. Do not delete the source namespace: it also serves unrelated PointCast features.

Wrangler syntax and migration behavior are documented in [Cloudflare's D1 command reference](https://developers.cloudflare.com/d1/wrangler-commands/). Execute the commands only against the verified intended environment.

## Staged production activation

### 1. Deploy the compatible paused writer

Deploy the reviewed code with production `ME_KEEPS_D1="pause"`. It must still read old KV shelves while refusing POST, PATCH and DELETE on `/api/keeps`. New collection/profile mutations must also fail without changing data. This pause must reach every production-backed writer before migration is enabled.

Retire, isolate, or protect older deployment URLs that can still execute the previous KV-writing code. Updating the canonical hostname alone does not retire those deployments. Stop out-of-band writers and automated retries. Keep a record of deployment propagation and the last completed old KV write. Drain requests already admitted by old code; a successful 503 probe to a new deployment does not prove those older requests have finished.

Using synthetic authenticated fixtures, probe the canonical host and every remaining supported write origin. Confirm write failures leave both the KV shelf and D1 row counts unchanged. Do not log session-cookie values. Guest browser-local saves may continue while account writes are paused.

### 2. Verify that the KV source is frozen and visible

KV reads are eventually consistent, including negative lookups. Cloudflare documents that changes can take 60 seconds **or more** to appear elsewhere. Do not treat a fixed one-minute delay as proof of convergence. See [KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/#consistency).

Inventory the actual `cacheTtl` settings used by existing Keeps readers, wait beyond the longest applicable cache window after the last completed old write, and repeat the prefix inventory and checksums. Compare the frozen backup manifest with repeated operator reads and independent authenticated reads from representative serving locations, including recently created shelves that previously returned no record. Preserve evidence of unchanged counts, IDs and values; do not retain private contents in the public release receipt.

If values are changing, writers remain reachable, a region still sees an older shelf, or the inventory cannot be reconciled, remain paused. The lazy migration cannot detect a stale KV snapshot on its own. Do not bypass this gate by setting `"1"` or by deleting migration markers.

### 3. Apply and verify schema

After the migration list is reviewed and the backup exists, apply the pending approved migrations:

```sh
npx wrangler d1 migrations apply pointcast-auth --remote
npx wrangler d1 migrations list pointcast-auth --remote
npx wrangler d1 execute pointcast-auth --remote --command "SELECT name,type FROM sqlite_master WHERE name IN ('me_keeps','me_keeps_cap','me_keeps_migrations','me_collections','me_collections_cap','me_profiles','me_reports') ORDER BY name"
```

Verify all expected tables/triggers, `item_id` uniqueness and the version columns. A migration command starting is not evidence that it completed. Record the terminal result and the release SHA that will use the schema.

### 4. Activate D1 and exercise the complete loop

Set production `ME_KEEPS_D1="1"` on the reviewed deployment only after the pause/drain and snapshot checks pass. Preserve this production value in every subsequent deployment configuration. Confirm effective runtime behavior with a synthetic account: GET `/api/keeps` must report `storage: "d1"`, `userId`, `importProtocol: 2`, opaque `itemId` values and integer versions.

The first migration copies rows and creates `me_keeps_migrations` in one D1 batch. Repeated and overlapping migrations check that marker before inserting, so a stale migration cannot restore a subsequently deleted row. The source KV record is not modified. Compare the migrated fixture's IDs, dates, notes and count with its frozen source before accepting the rollout.

Exercise these production checks with dedicated accounts and controlled content:

- Import 127 guest items in acknowledged batches; interrupt after 100, resume, and verify every item once on a second device. Rejected or over-limit items must remain local.
- Exercise one legacy client submission of more than 100 items. It must import the whole valid bounded list or fail without partial success; old clients cannot interpret partial acknowledgments.
- Save concurrently from two devices; edit the same version from both and observe a conflict. Sign out/switch accounts while requests are pending; old data must not reappear or be written into the next account.
- Create a collection, preview an explicit selection, publish, and read its HTML and `.json` without a session. Confirm absence of private notes, user IDs, authentication identities and unselected cards.
- Remove a member and then re-add it; verify the previous publication does not revive it. Delete/re-add a keep and repeat the check. Unpublish a collection and profile; subsequent HTML and JSON must return 404.
- Export Me and verify its private data. Exercise a report and a director hide on synthetic public content; release removes the hold but requires a new explicit publication.
- Confirm `/profile`, `/dashboard`, `/login`, owned `/p/{handle}`, `/me#holdings` and `/me#my-ai` retain their intended navigation and authority.

Public HTML/JSON are served with `Cache-Control: no-store`. Inspect the deployed response headers and middleware/CDN behavior rather than assuming those headers survived deployment. External copies already made by visitors or social services cannot be recalled.

## Recovery and rollback

For a failure during activation, set `"pause"` using the compatible code, preserve D1 and KV backups, and investigate. Do not restore a KV snapshot over D1, clear migration markers, delete rows to force a fresh import, or roll the server back to a pre-D1 writer after any account migrates.

Turning the flag off is **not** a storage rollback. Already-migrated accounts continue with D1, but unmigrated accounts can return to the legacy path. An accidental off deployment therefore requires another pause/drain/source verification before subsequent migrations. Keep the production flag at `"1"` during normal operation; use a presentation rollback that retains the compatible server and schema.

If a migrated shelf proves incomplete, preserve the current D1 state and frozen source, then reconcile only verified missing items under an owner-approved recovery procedure. Never blindly reimport the old shelf: that would restore records the person deliberately removed after migration. Account-specific migration markers are permanent authority records.

## Focused local verification

Use Node 24 or another project-compatible runtime with `node:sqlite` and TypeScript stripping. The backend tests run the actual migration SQL through SQLite; `tests/helpers/me-d1.mjs` adapts only the D1 transport. They require no production credentials.

```sh
node --test tests/keeps.test.mjs tests/keeps-d1.test.mjs tests/keeps-client.test.mjs
node --test tests/me-library.test.mjs tests/me-library-model.test.mjs tests/me-library-ui.test.mjs
node --test tests/me-public-eligibility.test.mjs tests/me-public-middleware.test.mjs
node --test tests/auth-session-post.test.mjs tests/profile-me.test.mjs tests/me-holdings.test.mjs tests/me-state.test.mjs
git diff --check
```

Also run the project's required type/build checks and rendered browser tests for guest, authenticated, unavailable, 390px mobile and keyboard states. A source assertion, SQLite test, successful build and production check prove different things. The release receipt should include each result and name any remaining limitation rather than claiming a complete production release from unit tests alone.

## Current release limits

- Keeps cap at 300 per account/browser; protocol-2 imports accept at most 100 input records per call, legacy imports at most 300. Overflow never evicts older keeps. Request bodies are bounded. A rejected import remains available at its source.
- Named collections cap at 50 per account, with up to 300 member records. Collection/profile edits use versions and explicit preview tokens. There is no collaborator or unlisted-link mode.
- The account-backed page supports a noun, name/bio, up to eight links and six featured collections. It is independent of the transferable, wallet-owned `/p/{handle}` page. There is no automatic ownership transfer between them.
- Public cards are text/link projections; no automatic third-party embeds or arbitrary remote-image fetching. Private/token-looking URLs require a clean public destination before publishing. Save functionality must not depend on a preview service completing.
- Saved Shortwave posts stay private in this release. Neither the KV feed nor the chain feed currently supplies an authoritative source deletion/moderation visibility service. Preview/publish rejects selected post excerpts, and public reads suppress post cards from earlier snapshots. The original private keep and collection membership remain available. Enable excerpt publication only after a source visibility service can fail closed on missing, hidden or unavailable records.
- Reports require sign-in and are bounded per reporter. Moderation uses existing director access; this release does not supply a complete moderation operations dashboard.
- `GET /api/me/export` exports the signed-in person's Me keeps, collection drafts/publication snapshots and account-backed profile. Draft collection memberships omit deleted keep identities, while owner-only publication snapshots retain their historical references. It is **not** an export of every PointCast subsystem, authentication credential, provider connection, passport, pet, purchase or blockchain record.
- Removing a keep or collection and unpublishing a profile are implemented library actions. Comprehensive account deletion, session revocation tied to deletion, erasure across other product stores, backup expiration automation, and blockchain-history removal are **not** supplied by Me export. Do not advertise a complete account deletion workflow or a 30-day deletion guarantee from this release.

## Release record

Record the reviewed SHA, deployment IDs, schema results, effective production flag, writer-retirement evidence, last legacy-write time, frozen-source manifest checksums, backup location/owner/retention, synthetic-account results, public withdrawal/header checks and any unresolved limits. Keep private identifiers and raw backup contents out of the public PR or release summary.
