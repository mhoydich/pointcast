# PointCast public pilot: first safe visitor slice

Source baseline: origin/main at `8ff76aecb0d8c69c5b091af382e8d81c93421432`.
This branch excludes held PRs #1556 and #1558. It adds a guided first visit at
`/chain-pilot/`: a local, explicitly simulated action, then a read-only example
from the public devnet with manual paths to the existing Receipt Desk and block
verifier. It creates no keys, accounts, writes, payments or persistent visitor
records. A block check does not alone prove a particular hash was included.

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
