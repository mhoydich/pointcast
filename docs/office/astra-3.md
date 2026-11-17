# Handle-to-desk registry

`buildDeskRegistry({declarations, portraits, now})` is a pure data adapter with no
network requests, timers, storage, UI, art generation or default worker roster.
Its envelope uses `pointcast.office-data/v1`; `data` contains `desks` and
`unresolved`. `observedAt` is assembly time, not an agent heartbeat. Aggregate
`sourceUrl` is null because each desk carries its own declaration receipt.

Pass declaration records as `{validation, receipt:{messageId,sourceUrl}}`.
`validation` must come directly from the declaration validator and a trusted
runtime/operator attestation. Never construct it from public Loom `verified`
flags, declaration-body assertions or serialized untrusted validation results.
This registry is not a second identity verifier. Neither verification nor art
implies Mike's approval, cryptographic identity, or current execution.

Eligibility requires exact `valid:true` and `verified:true`, a nonexpired UTC
declaration, an exact Loom message receipt, complete desk fields, and an accepted
whole portrait. The declaration validator owns attestation freshness (verification
lasts to expiry, bounded to 24 hours from trusted verification); the registry
rechecks expiry so cached results cannot remain eligible beyond it. No 120-second
identity TTL is imposed. Invalid/future verification timestamps must be rejected
by the declaration validator. Expired validator results may have null declarations;
these remain unresolved and stale without inventing a handle.

Every eligible desk is `idle`, never `active` or `running`. Other desk states are
`unverified`, `stale` and `error`. Duplicate handles fail closed regardless of input
order. Missing cards stay unresolved; portrait-only entries cannot create workers.
Unresolved records are `{handle:string|null,state,errors:string[]}`. Errors are
bounded codes; upstream error text is not reflected. Envelope precedence is
error, stale, ok (some eligible desk), then idle. Unverified-only results are idle
with explicit unresolved records and errors. Callers must inspect individual
eligibility, not treat envelope `ok` as blanket eligibility.

## Existing art provenance

The exact accepted references are `/images/ufogp/ada.svg`, `sid.svg`, `tess.svg`,
`lou.svg`, `mike.svg`, and `loom-desk.svg` in that same directory. Each mapping must
supply `whole:true`, `provenance:"official-nouns-traits"`, and
`sourceUrl:"https://pointcast.xyz/images/ufogp/provenance.json"`.
The existing manifest at base `a0c6c187` records each whole portrait, its SHA-256,
official Nouns CC0 image-data source, and trait recipe. See also
`docs/loom/progress-map.md`, which documents reuse of these whole portraits.
Cards, flags, arbitrary local paths, dynamic recipes, crop parameters, generated
images and remote URLs are rejected. No art has been built or modified here.
This is a reviewed source allowlist, not a runtime download/hash verifier.

Portrait assignment is caller supplied; no child receives art automatically.
Existing portrait names do not overwrite declaration names or assign identities.
Consumers must display the whole canvas and preserve the declared name; they
must not crop heads or present reused Ada artwork as independent identity proof.
Tests use a clearly labelled synthetic handle and explicitly borrowed Ada art.
They prove the adapter behavior, not that any actual child has an assigned portrait
or trusted attestation. Integration must supply those separately.

Run `node --test tests/office/astra-3.test.mjs`. Tests import no sibling module and
run against main independently. No production integration or visual QA is claimed.

Contract: https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_505c2g1l6b

Declaration: https://pointcast.xyz/loom?to=loom%3A0f43a07be3b3a127c288a524%23m_2s4i6a2n3j

MINE: https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_2v3v6d2p6k

Cycle 1 of at most 3. One draft PR, then stopped. READY FOR TERRA REVIEW only;
review, main merge and deployment remain outside this cycle.
