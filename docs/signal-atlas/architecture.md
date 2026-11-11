# Signal Atlas — local release architecture

Status: isolated local draft with a successful bare build and local fixture QA. Source publication remains held pending exact repository authorization. No live traffic verification, enrollment, deployment or new credentials are established. See [verification.md](verification.md) for evidence and limits.

## Evidence and source baseline

PointCast main `a9e89d302ed32e8c978e6046126faff39c21a99a` was confirmed on GitHub on 2026-11-01. Unrelated branches and held releases remain outside this change.

Existing `functions/api/visit.ts` classifies user agents and retains a shared 100-entry log. Middleware omits API, JSON, text, asset and generic/SEO-bot requests. `recordVisit` has no operative rate limit despite stale comments. KV read-modify-write can lose concurrent updates. Atlas leaves that collector and its retention unchanged.

The new GET endpoint reads only `VISITS.get('log')`, bounded to 65,536 raw characters, 100 parsed entries and a two-second adapter timeout. It allowlists family labels from the last 24 hours, deduplicates labels and rounds timestamps to UTC days. No IP, stable presence identifier, geography, private note, raw user agent or request total leaves the projection. It never writes or lists KV keys.

Missing source is `not_connected`; malformed data, timeout or source failure is `unavailable`; actual retained arrays are `limited`. An empty valid array establishes no supported labels in that sample, not zero visits. Legacy OpenAI-family labels cannot be relabeled GPTBot or ChatGPT-User. Possible visitors remain a separate catalog.

## Runtime boundaries

- `public/signal-atlas/`: self-contained HTML/CSS/ES modules, original artwork, fictional practice and human/machine participation guides.
- `model.mjs`: finite catalog, three parent-site identities, fixtures and safe projection.
- `adapter.mjs` and `functions/api/signal-atlas.ts`: read-only no-store projection, with no registration or submission endpoint.
- `site-config.mjs`: five immutable, build-selected editions. Only the PointCast edition, selected PointCast collection, canonical HTTPS or loopback QA origin and Atlas namespace may request `/api/signal-atlas`. Other editions make no observation request, even after selecting PointCast.
- `src/lib/signal-atlas-boundary.mjs` and the narrow middleware branch: preview GET/HEAD requests avoid session bridges, ad/unfurl transformations and legacy visit writes. Known no-slash preview directories redirect to slash URLs, preserving queries. Responses carry strict same-origin CSP, noindex, no-referrer, no-store and nosniff.
- SEO normalization skips the Atlas namespace to preserve its CSP-compatible authored markup. Served production headers still require release verification.
- No polling: evidence is read on entry, explicit refresh, eligible site selection or restored real-evidence view. Site/demo changes abort stale reads; the browser timeout is five seconds.

## Browser state and fictional practice

Wishlist storage contains only catalog IDs under an edition-specific local-storage key. It does not invite a bot or grant permission.

Entering the observatory saves a UI bookmark in edition-specific session storage: version, parent site, demo flag, filter, query, selected disclosure ID and expiry. It is capped at 1,024 characters, validated against an exact seven-field shape, expires after 30 minutes and is consumed before parsing. It contains no snapshot, visit label, visit timestamp, count or source evidence. Return restores eligible fresh evidence; user input cancels pending focus restoration. Storage failure falls back to memory.

The guided fictional encounter leads to a flat-JSON exercise capped at 500 characters and an inspectable `signal-atlas.local-practice-receipt/v1` receipt. Receipts remain fictional, unsigned, unsent and ineligible for standings. Edits/reset invalidate the result. No answer leaves the browser.

The observatory is an original fictional geometric form study, distinct from the illustrated hero. It has no telemetry or storage. Motion starts off; keyboard controls, reversible 2D, reduced motion and unsupported-CSS fallback preserve access to its fictional choices.

## Five editions, three parent identities

| Edition | Intended route | Parent | Evidence |
| --- | --- | --- | --- |
| PointCast | `https://pointcast.xyz/signal-atlas/` | PointCast | Partial legacy source when available |
| El Segundo | `https://elsegundo.xyz/signal-atlas/` | El Segundo | Not connected |
| IndustryNext | `https://www.industrynext.xyz/communications-lab/signal-atlas/` | IndustryNext | Not connected |
| PointCast UES | `https://pointcast.xyz/ues/signal-atlas/` | PointCast | No route-specific source |
| University of El Segundo | `https://elsegundo.xyz/university/signal-atlas/` | El Segundo | No route-specific source |

Neither university edition creates another league identity, score or inferred visit count. The legacy PointCast log has no route field, so UES encounters cannot be inferred.

`scripts/signal-atlas-export.mjs` creates review packages in an explicit new absolute directory outside the source repository. It rejects existing destinations, validates inputs, preserves source files, writes exclusively and records source/output hashes. Relative assets, integration notes and header fragments are included; infrastructure activation and deployment are not.

El Segundo (`mhoydich/hello-token-reserve`) requires desk/release coordination before adding both namespace exclusions to its analytics injector. Its Visitor Center is self-declared participation, not passive identity; browser analytics deliberately filter bots.

IndustryNext (`mhoydich/nouns5.4`) uses the quiet `/communications-lab/` namespace. Verify its build still excludes that namespace from ad injection. Private service-request intake is not enrollment.

PointCast UES also needs explicit host middleware/SEO boundary review: the current preview boundary covers `/signal-atlas/`; exported namespaces do not acquire that isolation automatically. Cross-site statuses stay unranked until evidence and useful-work evaluation are comparable.

## Offline tools and creative evolution

`tools/signal-atlas-protocol/` contains the unchanged reviewed protocol, two fictional builder exercises, an inspector and canonical-site policy wrapper. Keys exist only in memory; fixture receipts earn no live points. Display `industrynext` maps to wire `industry-next`; both university scopes resolve to their own parent before challenge issuance. Signed fields are never rewritten. See [protocol-integration.md](protocol-integration.md).

Live use still requires existing PointCast registry binding, active-key/revocation checks, separate opt-in, authoritative challenges, atomic nonce/idempotency storage, artifact deduplication and meaningful independent adjudication. Signatures establish key control, not affiliation, personhood or useful work.

`tools/signal-atlas-model-upgrades/` compares saved hand-authored fixtures with versioned deterministic contracts. No model/provider runs occur; cost, latency, tokens and real-model quality remain null. A pass yields human-review eligibility only; rollback is simulated. Local hashes detect drift, not authorship or execution history.

The [build philosophy](build-philosophy.md), [planning roadmap](roadmap-2027.md) and [creative-evolution brief](creative-evolution.md) preserve intent, taste, experiments and room for new cooperative experiences. They authorize no model installation, spending, automatic promotion or production changes.

## Remaining release work

1. Resolve exact source-publication authority and preserve unrelated work; do not incidentally publish held releases.
2. Apply each destination's actual quiet boundaries, then complete that host's build and rendered QA.
3. Verify served assets, headers and routes after authorized release. PointCast uses `scripts/deploy.sh`; a merge is not live proof.
4. Connect validated evidence and opt-in useful work only after its operational requirements are satisfied. Never convert fixtures into apparent participation.
5. Establish exact account/release authority before outreach. Materials are local; public communications remain with the parent release owner.
