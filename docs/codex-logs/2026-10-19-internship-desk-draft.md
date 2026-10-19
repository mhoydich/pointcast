# Private interest desk — draft, October 19, 2026

This branch adds the next operational slice after the published Internship Lab: private, persistent expressions of interest and optional learning tasks for people and human-sponsored bots. It is a draft and is not approved for activation. The educational lab remains unchanged.

## Scope

- Existing PointCast human sessions and `AUTH_DB`; no new account, binding, provider credential or configuration.
- One human record and one human-managed bot record per account. The authenticated account owns both; a bot name is not independently verified identity.
- Explicit save, send-interest, request-feedback and delete actions. Sending interest makes the record and later saved progress visible to the existing server-verified director access group. No contact details, resumes, uploads or artifact URL fetching are requested.
- Optional, self-chosen, fictional/offline practice. This is not a production assignment, job application, employment offer or agreement.
- A director feedback queue with version-bound decisions. A reviewer cannot review their own record. Editing submitted content invalidates the snapshot and latest feedback. Feedback never authorizes hiring, publication, credentials or deployment.
- No bot credentials, direct bot writes, execution, messaging, payments, hiring decisions or deployments.

## Data and API

`GET/POST /api/internship-desk` is account scoped. `GET/POST /api/director/internship-desk` independently checks the existing server director gate. Private JSON is never embedded in HTML. Responses are private/no-store; writes require an exact same origin, JSON, and a displayed-account header matching the server session. The header does not authenticate anyone.

An immutable UUID and integer version prevent stale actions from modifying a deleted-and-recreated record. D1 mutations use owner-scoped compare-and-swap statements. The server validates strict fields and bounds streamed bodies to 8 KB. The database atomically limits each account to 60 validated write attempts per UTC hour, including conflicts. Storage failure returns an unavailable response without a false success claim. Review queue reads and cleanup are bounded.

Proposed retention is 90 days after an owner write. Director feedback does not extend it. Expired records are excluded from reads and removed in bounded batches on subsequent authenticated desk requests; the owner's own expired records are also removed then. Explicit deletion removes the active record, frozen submission and latest feedback. Platform backups have separate retention. The rate counter stores only an account reference, UTC hour and count. There is no historical review archive or scheduled purge.

The draft public contract is `/internship-desk/program.json`. It truthfully says signup is not live. No homepage, published lab, agent catalog or hiring status has been changed to advertise an active service.

## Activation gates

Do not merge, apply migration 0032, or deploy this draft until the separately tracked account-authentication prerequisite is resolved and independently reviewed, the intended existing director account is verified, and the owner confirms the retention/review operating plan. No new roles or access grants are included here.

Apply only `migrations/auth/0032_internship_desk.sql` after those gates. Do not apply the repository's entire pending migration set. Verify two ordinary account fixtures cannot cross-read/write, a non-director cannot open the queue, and the intended director can give feedback on a distinct account's exact submission. Run the normal build, browser checks, independent review, merge and `scripts/deploy.sh` release process. Review and update draft status language as part of activation.

Real internships remain closed until supervision, eligibility, pay, hours, agreements and other program terms are established separately. No commitments are created by this interest desk.

## Isolation and verification

Created `codex/internship-desk-2026-10-19` from fresh `origin/main` at `00f2c4c537fcc34f7907de4da1d60cfd662c1c54` in `/Users/michaelhoydich/pc-internship-desk`, following the current operations guide. Existing checkouts, PR 1432 and IndustryNext PR 7 are excluded.

Validation results will be recorded in the pull request after the draft's API, browser-controller and build checks complete. Browser automation availability is a separate gate; automated DOM tests are not a claim of visual or assistive-technology verification. No production migration, account modification, merge or deployment is part of this draft.
