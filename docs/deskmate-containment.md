# OFF-61 containment draft

This patch deliberately disconnects BOTH providers at the endpoint wrapper.
GET returns open:false/backend:null. Allowed POST returns 503 before reading the
body. No env binding is read, provider client constructed, or rate-limit storage
accessed. Existing CORS/preflight and offline metadata remain available.

This is a code-level off lock, not a working budget controller and not a claim of
production containment. There is no environment toggle that restores the unsafe
path. Applying this change interrupts all AI replies (offline Intern can remain).
It must be reviewed and released by the authorized release desk. No deployment,
secret/config change or provider call was performed while preparing the draft.

## Before any re-enable

1. A single strongly consistent global budget authority (for example a dedicated
Durable Object) owns UTC-day budget, reservation ledger, request IDs and concurrency
count. Do not use KV read-then-write counters for monetary admission.
2. In one atomic admission transaction: reject disabled config/missing cap/unpriced
model/invalid input, reconcile day boundary without clearing outstanding reservations,
check spent+reserved+new maximum <= daily cap and active < concurrency limit,
then commit a unique reservation. Unavailable authority fails closed.
3. Reserve a conservative monetary upper bound for all permitted provider attempts,
including input, capped output, retries and any fallback models. Disable provider
automatic retries/fallbacks unless their complete worst case is reserved. Prices and
caps use exact integer subunits, never floating-point money.
4. Only the server may select models/limits. No browser budget/model-price override.
Use own-key plan lookup, streaming body limit and explicit aggregate message bounds.
5. Once a provider request may have been dispatched, ambiguous timeout/error keeps
its reservation charged at maximum until trusted reconciliation. Do not release a
reservation merely because a client disconnects or retries. Settlements are idempotent.
A settled request ID must not cause another dispatch; there is no assumed exactly-once
external inference transaction.
6. A separate explicit disabled switch is checked at admission and immediately before
dispatch. It cannot cancel already-dispatched work; account for that exposure.
7. Test concurrent reservations at boundary, missing storage/config, 23:59/00:00 rollover,
duplicate IDs, crashes before/after dispatch, delayed settlement, over-cap actual usage,
provider retry/fallback and kill-switch behavior. No real paid test without approved cap.
8. Fix Mini model ID, privacy copy, inherited-plan keys and merged-message limits.
Report backend truthfully. UI label/GET alone never proves a provider reply.

The existing endpoint owner retains implementation ownership. Do not enable with
just DESKMATE_ENABLED=true or a dashboard soft alert. This document is a design gate,
not an implemented or tested atomic spending limit.

## Checks
Node 24.22.1: node --test tests/deskmate-containment.test.mjs
6/6 tests pass, importing the actual TypeScript wrapper with Node type stripping.
CI Node-version compatibility, full build, preview browser and production tests
remain outstanding. The test imports no provider SDK and uses a throwing env proxy.
