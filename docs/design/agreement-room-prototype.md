# PointCast Mist V2: Agreement Room specimen and capability gaps

PointCast Mist V2 is a working product name, distinct from the current read-only Mist explorer and the existing devnet identity. This is a synthetic no-money application experiment. It has no signing, real identities, shared database, live invitations, publication, blockchain operations or legal force. All state is in the current tab; reload resets it. The two participants, their feedback, the studio bot and review desk are fixtures. A review is advice only: it cannot override either participant's approval.

## Lifecycle

Ari opens an invitation; Bo accepts the invitation to start work. This is distinct from approving terms. Either collaborator can request a change; either can request advisory review while a change is outstanding. The example review desk may suggest, never approve. Amending changes the revision and clears all prior approvals and review flags. Both collaborators must approve that exact version, with no unresolved change request, before either marks the example complete. Either can cancel before closure; expiry closes it in the deterministic model. No action makes a public publication.

The sample `model.mjs` applies strict expected step and revision checks, rejects unknown actors, detects duplicate and conflicting IDs, and rejects transitions after closure. These are rules within one local in-memory model, not authentication, durability, a distributed protocol, or actual chain enforcement. Time is a supplied fixture, not a trusted clock. Concurrent real users would need authenticated actor/role verification, trusted expiry, durable atomic transitions, and explicit reconciliation. A timeout after an external action cannot be assumed to mean failure or retried blindly.

Public JSON is an allowlisted summary of fictional terms and simulated approvals; it omits private example feedback and raw event fingerprints. Private JSON additionally contains that feedback and a reduced history. Both are downloads on the visitor's device, not an access-control system. A downloaded private export can be shared by its recipient. No sensitive real information should be entered into this example.

## Existing primitives and next evidence

- PointCast's published SDK exposes fixed transaction types, including mandates, controllers, stations, commitments and editions. SDK support alone does not verify live enforcement. The existing Mist page is a read-only network browser.
- The public roadmap describes signed requests and a completion condition in the separate core. Its current code, precise acceptance/cancellation and revocation rules, and deployment were unavailable for this specimen. No inference that a request is a multiparty agreement.
- Older mandate design says clearing a mandate can restore legacy unscoped behavior. Do not treat it as revocation. A future dispatcher must independently default-deny and revoke at its own authorization and queue boundary.
- Node-reported inclusion, signatures, actual application execution and independently replayed state are distinct evidence. A receipt or public hash does not make this application's simulated approvals chain-enforced or establish real consent.
- The PointCast devnet is reported as resettable, single-operator and no-value. Its durability, backups and recovery need proof before stronger claims. The prototype deliberately does not connect to it.

Future work should compare a real low-stakes collaboration's requirements against existing primitives before choosing any protocol work. A safe real pilot would need consent, version-bound approvals, privacy review, per-action authorization, recovery, bounded writes and abuse controls, and real-device accessibility testing. Trusted observers, reviewer mandates and dispute/appeal policy require separate design. Payments, real legal adjudication, mainnet and general-purpose execution are not part of this experiment.
