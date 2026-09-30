# PointCast Me: first implementation

Me now opens on a useful guest or account library. People can keep a native page or HTTPS link, search and edit it, deliberately import browser saves, arrange private collections, then preview and publish selected link cards or an account-backed profile. Existing login, linked identities, owned `/p` handles and holdings stay on the existing foundation.

## Delivered behavior

- Shared Keeps client: honest browser/account/unavailable states, bounded requests, explicit acknowledged imports, no silent cap eviction, and cancellation/isolation across account changes. Account edits and removals carry the selected record's version and immutable identity.
- D1 account store: atomic per-item writes, all-or-nothing legacy imports, versioned changes and a guarded migration marker. Existing aliases are preserved. Migrations are `0029_me_keeps.sql` and `0030_me_collections.sql`.
- Me: 30-card initial shelf, load more, search/filter, URL or native-path saving, title/private-note editing, reviewed browser/ShoppingPocket/dock/Sparrow imports, JSON export, private collection ordering, explicit publication selection, profiles, and short removal undo. Native block pages use the shared Keep control.
- Public `/collections/{id}` and `/people/{id}` HTML/JSON: allowlisted snapshots, no private notes or account identifiers, explicit republishing after draft changes, immediate withdrawal on subsequent reads, and no shared cache. Generic page middleware bypasses these dynamic responses for every user-agent class.
- Account profile: editable name, noun, bio, eight links, six featured public collections, preview/publish/unpublish. Wallet-owned handles retain their separate ownership rules.
- Reports and director hide/release APIs; release requires another owner publication. Me and report pages omit advertisements and request no indexing.
- Session summaries no longer serialize the bearer token. Holdings failure has its own retry state and does not block the library or account controls.

## Deliberate boundaries

This is a reviewable implementation, not a production activation receipt. The storage flag is off by default. Follow [the activation runbook](../setup/me-library.md) for backups, a write pause across every old production writer, KV convergence checks, schema application, activation, and deployment verification. Do not migrate from an actively written or unverified KV snapshot.

Saved Shortwave excerpts remain private: the current source service has no authoritative moderation/withdrawal lookup. They can be organized privately, but public selection excludes them and public reads suppress older excerpt snapshots. Link cards render without fetching remote metadata or images. Public excerpt eligibility and audited preview enrichment need separate work.

Existing auth providers are reused; the implementation does not provision a provider, merge accounts, or prove production OAuth/email/passkey availability. Browser QA uses synthetic local sessions. Real sign-in, two-device persistence, deployed migration behavior and physical-phone usability remain release checks.

Me export covers the library and publication snapshots. Individual keeps and collections can be removed. Complete account deletion, revocation across all linked services, and backup-retention erasure are not implemented here. No new analytics pipeline, arbitrary avatar upload, collection cover upload, drag gesture, custom username, or social discovery feed is introduced.

The migration compatibility service must remain authoritative after activation. A UI rollback must retain that service and schema; switching storage back to a stale KV copy is unsafe.

## Verification

Tests execute the production SQL against in-memory SQLite, exercise the shared browser client with delayed and failed requests, verify ownership/publication boundaries and middleware behavior, and cover current login redirects and owned-handle helpers. Local browser QA covers guest keep, explicit import, collection/profile publication, withdrawal, account separation, holdings failure, and 390px layout. The release receipt should record the exact commit, final test/build results and the distinct preview/production deployment states.
