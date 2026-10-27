# PointCast V2 exploration: first safe visitor slice

Source baseline: origin/main at `8ff76aecb0d8c69c5b091af382e8d81c93421432`.
V2 here means an onboarding and verification exploration within the existing
Present Company / Town Network direction, not a new chain or protocol. The
existing /chain roadmap reports batches 2–6 built and markets and trust-floor
batches 7–13 paused as of 21 October; current backend status needs verification. It leaves existing state, contracts and keys untouched. Protocol changes
remain a future design question after recovery and operational controls are
verified. This branch excludes held PRs #1556 and #1558. It adds a guided first visit at
`/chain-pilot/`: a local, explicitly simulated action, then a read-only example
from the public devnet with manual paths to the existing Receipt Desk and block
verifier. It creates no keys, accounts, writes, payments or persistent visitor
records from the practice action. The existing site layout can send a pageview
event; its analytics handler can store a coarse IP hint. HTTP request metadata
may include a referrer under the existing global policy, so this is not a
claim of anonymous access. The practice scenario is not sent in that event.
A block check does not alone prove a particular hash was included.

## Observed and unknown

On 27 October, read-only `/status` reported chain ID pointcast-devnet-2, pinned
genesis a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280,
one sequencer, resettable state, no anchor, writes on, and no promised value.
It reports daily limits including 200 keyless posts, 10 per bot, 50 new bots,
and 5,000 signed transactions; request body caps and a keyless retry window are
also reported. These are operator claims, not proof that every abuse, replay,
identity or cost control works under load. Existing docs describe public keyless
`POST /bot/post`, signed `POST /tx`, and a play faucet. We submitted no writes.

The Worker is described as one Durable Object with a sequencer and house keys;
the chain source repo and live operational configuration are not present here.
Durable Object persistence does not establish an independent backup, a tested
restore, or recovery point/time objectives. The status `writes: on` is an
observation, not evidence that an operator can promptly stop all write paths.
Whether production backups, kill switch, alerts, rate-limit enforcement and
replay/idempotency survive restarts must be confirmed with the operator and tested
in isolation. No additional credentials, paid services or configuration were
created. Do not use the local practice receipt as evidence of a chain write.

The launch plan is dated 21 October, not a current audit: it says Claude generated
all devnet keys and says the only complete copy was one Durable Object; it
proposes an R2 snapshot worker, new owner-controlled genesis and host, fixed
passkey RP/origin, delayed controller changes, rehearsal and econproof gates.
Those historical claims and any later changes need owner verification. There is
no permission in this task to generate keys, add backups or infrastructure,
fund or anchor anything, or call this devnet a secure decentralized mainnet.

## Release path

1. Verify the current deployed worker source, independent backups, and a restore
   drill; establish owner-controlled access and incident contacts.
2. Exercise bounded writes, replay/nonce handling, spam/abuse controls, privacy,
   resource budgets, monitoring and a tested emergency stop on an isolated
   deployment. Verify all public write routes, not just this page.
3. Decide the owner-controlled genesis/keys, host and passkey RP/origin, recovery
   and controller-delay policy; review the existing rehearsal and econproof
   gates. Any later anchor or paid service requires separate authorization.
4. Complete real browser/mobile and accessibility review, resolve relevant test
   failures and held PRs independently, and agree exact release scope. Deploy
   only with the coordinated existing deploy script and verify production.

Current slice is draft review work only and does not authorize publication or
production writes. Receipts use existing public hash data; shared Receipt Desk
lookup links may include a hash in their URL, and its referrer fix is separately
held in #1558. This page uses no query-bearing link to Receipt Desk.

## Proposed V1 event envelope for a later integration

The separate webhook task owns implementation. The fields below are illustrative
and subject to Astra’s architecture review; they do not lock a schema. This is a proposed interface,
not an endpoint or a claim that any event has been delivered or verified. A
minimal envelope might contain `version: 1`, an opaque producer-scoped
`event_id`, a constrained `event_type`, a UTC `observed_at`, and an optional
`receipt_ref` with `network`, `genesis`, `tx_hash` and optional reported
`block_height`. A digest should be optional and only cover explicitly public,
canonical bytes after the canonicalization is specified; even a hash of
low-entropy or private data can leak information. Do not include raw payloads,
headers, URL queries, IP addresses, keys or personal data.

A producer-supplied identifier and timestamp are untrusted claims. Scope and
dedupe IDs per producer, handle retries and reordering, bound sizes/rates and
retention, and do not treat receipt references as verified until an independent
check succeeds. Delivery, a digest or a node's inclusion report is not proof
of truth, independent inclusion, finality, ownership or source authenticity.
If no real transaction exists, omit `receipt_ref`; never promote a local
practice record into an on-chain receipt.

## V2 direction for review

Start with creative agent publishing and provenance, playful zero-value
interactions, self-reported UES completion, and local projects. A simulated
lesson completion is not a credential or proof of learning; agent attribution
is a claim until independently verified. Do not put private learner information
on chain. The current devnet can demonstrate receipt inspection without a new
protocol; durable recovery, operator independence and a true owner-controlled
genesis may require infrastructure or protocol decisions later. Wait for the
independent Astra review before choosing any V2 protocol or event schema.

## Agent and learner boundaries

The published chain design says `clear_mandate` returns an agent to legacy
unscoped behavior; the shipped `public/chain/bots/pcv.py` replay deletes the
mandate and checks some scope only when a mandate exists. This does not mean
every action is unrestricted: its `spend_allowance` rejects a missing mandate.
The private live Worker source and current backend enforcement cannot be
verified in this workspace. Do not treat clear_mandate as universal revocation.
A future webhook dispatcher must default-deny and revoke at its own authorization
and queue boundaries; arbitrary incoming events must never directly reach
native signing or MCP. Verify live behavior in isolation before any write pilot.

`src/lib/ues-completion-receipt-schema.mjs` describes a private, learner-
downloaded, self-attested completion record: not academic credit, accreditation,
verified identity or an on-chain record. The UES practice example is entirely
simulated and does not read or publish that receipt. Any future public
completion flow must be separate, explicitly opt-in, and must not imply
accreditation or reveal learner data by default.
