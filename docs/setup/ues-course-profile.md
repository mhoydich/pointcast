# Private UES course snapshots (held first slice)

This adds a private account copy of the ten Season 1 checklists already hosted on
PointCast. A course remains usable without an account. Checking modules never
uploads them. On a course page, **Check private profile** reads the signed-in
account and its saved copy; **Save this checklist to account** sends one explicit
snapshot. A later edit remains local until another Save. **Use the saved
checklist here** replaces the local checklist after checking the reviewed account
and revision again. **Remove account copy** removes the active database record
without changing the browser checklist. `/me` can load/remove these same copies independently of holdings availability.
The shelf starts with public explanatory copy and performs an authenticated API
read only when Check private profile is pressed.

The profile labels the learner's completion choices **self-attested**. Linking a
Google sign-in identity does not verify that the person did the coursework, lives
in a town, has earned academic credit, or is eligible to vote. No learner names,
notes, artifacts, locations, emails, wallet addresses or credentials are accepted
inside a course snapshot. Course code and dates are private personal data once
linked to an account, even though the public course catalog is open.

## Boundaries and prerequisites

- Hold this draft until session JSON hardening PR #1590 is merged and verified.
  It changes no auth/session files and does not duplicate that patch.
- The existing PointCast Google OAuth implementation is reused only through its
  existing authenticated cookie. Google configuration, provider login and
  recovery have not been verified by this change. No OAuth client is created.
- This is same-origin PointCast account storage. A UES front door can link to its
  PointCast course; it cannot obtain a PointCast cookie on another origin.
  El Segundo SSO, federated identity, interactions, voting and chain writes are
  not implemented. Existing project tickets are not a general SSO mechanism.
- Account-library PR #1287 is separate. This adds one component to the current
  `/me`; that insertion will need reconciliation if the larger Me rewrite lands.
- The `UES_COURSE_PROFILE_ENABLED` binding must equal `1`, and `AUTH_DB` must have
  migration `0033_ues_course_progress.sql`. Otherwise API calls return a private
  503 and the local course continues to work. No KV fallback or automatic table
  creation exists. No live binding or migration was changed for this draft.

## API and storage

`GET /api/me/courses` returns only the current account's saved checklists. Add
`?courseCode=UES-201` for one catalog course. An empty list is a successful read
of an account with no copy. `userId` and a display name identify the account the
UI reviewed, without exposing auth identities or session credentials.

PUT requires exactly `courseCode`, `progress`, `expectedRevision` (null for a
first save) and `consent: true`. DELETE requires exactly `courseCode` and
`expectedRevision`. Both require JSON, an exact same-origin `Origin`, the
HttpOnly session cookie and `X-PointCast-User` matching that cookie's account.
The header is an account-consistency guard, not a credential. Bodies are bounded
to 2,048 bytes while streaming; arbitrary payload fields and unknown course
codes are rejected. Cross-origin reads/writes are rejected when identified by
Origin or fetch metadata; no CORS permission is added.

Rows are keyed by `(user_id, course_code)` with a foreign key to users and
`ON DELETE CASCADE`. Every mutation uses an atomic statement and a fresh opaque
revision. A stale save/delete returns 409 rather than overwriting another copy;
an old revision cannot resurrect a deleted copy or remove a re-created one.
Different course rows and generic `/api/me/state` updates remain independent.
The service never reads UES localStorage through the generic sync client.

An account-copy removal physically deletes that active row, including checklist,
revision and save time. It is not a promise to erase backups, request logs or all
account data. General account deletion/revocation and operator backup retention
are outside this feature. Disabled storage remains private in D1; disabling the
flag does not delete saved copies. Requests return `private, no-store` without
CORS or session JSON. No profile-publication or MCP access path is added.

New downloadable receipts use `/ues/completion-receipt/v2.json`. V2 keeps the
same fields but says the receipt includes no identity and verifies neither the
learner nor the work. The immutable v1 schema/endpoint remain unchanged for old
receipts; v2 avoids incorrectly claiming that a learner never chose account
storage. Receipts never include account IDs or revision tokens.

## Release checklist for the operator

1. Review this draft and #1590; reconcile the Me insertion with #1287 if needed.
2. In a disposable environment, apply auth schema and `0033` and test with two
   synthetic accounts. Check local-only work, save, restore, remove, concurrent
   tabs, account switching, a second browser, unavailable storage and receipts.
3. Before a separate approved production change, back up AUTH_DB and confirm
   migration ordering (other branches may reserve migration numbers). Apply this
   migration via the repository's normal migration process. Do not recreate a
   database or generate credentials for this feature.
4. Follow `docs/OPERATIONS.md` and the normal release workflow; enable the flag
   only as a separately approved activation. Real Google login, cookies, provider
   recovery, production cache behavior and two-device persistence require release
   checks. A local SQLite/DOM test is not that evidence.
5. If disabled, course pages retain local work and show that account saving is
   unavailable. Existing private copies should be made removable again after
   service restoration, or removed through an approved operator process.

## Later federation / voting work

Design a dedicated authorization-code exchange with an exact registered client,
callback, audience, expiry and one-use consumption. Keep issuer-local account
IDs separate from per-client subject identifiers. Reuse established OAuth/OIDC
libraries rather than minting a general bearer ticket or sharing cookies across
sites. Each site's requested scopes and return path need explicit review and
revocation behavior before any implementation or access grant.

Add interactions only for defined, user-visible purposes with limited retention.
Keep preference polls distinct from eligibility-controlled votes; a Google
account or course self-attestation alone is neither one-person-one-vote proof
nor civic eligibility. A future vote needs a ballot definition, audience,
eligibility decision, duplicate/replay controls, correction/revocation rules and
receipt privacy. None of those rights are inferred from this profile table.

The resettable PointCast devnet may later hold a separately chosen public
receipt, but never a private checklist, account identity or unsalted hash of
predictable learner data. Consent, privacy, availability and verification claims
must be reviewed before even an experimental write. This first slice makes no
chain calls and adds no credentials or delegated authority.
