# PointCast Compute Ledger — v0

**Title:** Compute Ledger — a federated protocol for human + AI work attribution
**Version:** 0.1.0 (working draft)
**Status:** Draft — comments invited
**Filed:** 2026-04-21 PT
**Editors:** cc (Claude Code) + Mike Hoydich · PointCast
**Canonical URL:** https://pointcast.xyz/rfc/compute-ledger-v0
**Canonical mirror:** https://github.com/mhoydich/pointcast/blob/main/docs/rfc/compute-ledger-v0.md
**License:** CC0-1.0 (spec) · MIT (reference implementation)
**Contact:** hello@pointcast.xyz · open an issue at github.com/mhoydich/pointcast

---

## Abstract

This document specifies **Compute Ledger v0**, an open protocol for publishing the work expended on software projects by mixed human + AI teams. Each participating site hosts a `/compute.json` document listing its recent ships, the collaborator who landed each ship, a categorical "kind" of work, and a qualitative "signature band" representing the approximate compute cost. Sites can register with a federated aggregator (or no aggregator at all) to appear in cross-site views. The protocol is intentionally small: a single JSON shape, a few HTTP headers, and a bridging convention for Git commit trailers.

The goal is **receipts, not dashboards** — a legible, hand-curated record of what got built and who (or what) built it, published at the site that did the work.

## 1. Motivation

In 2026, a growing share of software is written collaboratively by humans and AI agents. Most projects do not disclose this split. Existing attribution conventions (`Co-Authored-By:` commit trailers, the `Assisted-by:` / `Generated-by:` proposals from the Paris Open Source AI Summit 2026, botcommits.dev's index of AI-generated GitHub commits) operate at the Git-commit or aggregator level. None defines a per-site contract that lets a project publish its own record and lets other projects federate with it.

Elad Gil's April 2026 post "compute is the new currency" framed the shift: teams will increasingly be measured in token budgets vs. headcount or dollars. PointCast's observation: if this is true, the analogue of a public balance sheet is a public compute ledger. A few lines of JSON, hand-curated, hosted at the project's own domain, optionally priced via HTTP 402 for agent consumers.

Compute Ledger v0 codifies the shape so that:

- **Projects can publish their own record** without signing up for a platform.
- **Aggregators can mirror federated entries** with attribution preserved.
- **Agents can enumerate work history** at any participating domain via a stable endpoint.
- **Commit trailers interoperate** — a commit using `Assisted-by:` or `Generated-by:` can link to a specific ledger entry for full context.
- **Privacy is preserved** — raw token counts are deliberately kept out of the spec; the published signal is an order-of-magnitude band.

This spec is **descriptive**, not prescriptive. It describes the minimum shape that enables federation. Extensions are explicitly welcome (see §11).

## 2. Terminology

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** in this document are to be interpreted as described in RFC 2119 / RFC 8174.

- **Node** — a site publishing a `/compute.json` document at a public HTTP(S) URL.
- **Entry** — a single ship recorded in the ledger (a sprint, a block, a brief, an ops action, a piece of editorial).
- **Collaborator** — the human or AI agent credited for an entry. Referenced by a short slug (e.g. `cc`, `mike`, `codex`, `manus`).
- **Signature** — a band describing the approximate compute cost of an entry (`shy`, `modest`, `healthy`, `heavy`).
- **Kind** — the categorical type of work (`sprint`, `block`, `brief`, `ops`, `editorial`, `federated`).
- **Aggregator** — an optional downstream node that mirrors entries from other nodes into a combined view.
- **Ledger v0** — this document.

## 3. The JSON contract

A compliant node **MUST** serve a JSON document at the well-known path `/compute.json`. The document **MUST** be valid JSON, UTF-8 encoded, and **SHOULD** be prettyprinted with two-space indentation for readability.

### 3.1 Top-level shape

```json
{
  "schema": "compute-ledger-v0",
  "host": "example.com",
  "generated_at": "2026-04-21T14:00:00-08:00",
  "federation": {
    "upstream": "https://pointcast.xyz/compute.json",
    "contact": "hello@example.com"
  },
  "summary": {
    "total": 94,
    "last_24h": 18,
    "last_7d": 57
  },
  "collabs": {
    "cc": 78,
    "mike": 9,
    "codex": 4,
    "manus": 1
  },
  "entries": [ /* see §3.3 */ ]
}
```

Required top-level fields:

- **`schema`** (string) — **MUST** equal `"compute-ledger-v0"` for documents compliant with this version. Nodes implementing a later version **MUST** use the corresponding identifier.
- **`host`** (string) — the domain publishing this document, without scheme or trailing slash.
- **`entries`** (array) — the list of Entry objects (see §3.3). **MAY** be empty.

Optional top-level fields:

- **`generated_at`** (string, ISO 8601) — when this document was last rendered. Useful for caching consumers. **SHOULD** be present.
- **`federation`** (object) — federation metadata. **SHOULD** be present for nodes that intend to participate in an aggregator.
- **`summary`** (object) — precomputed counts (`total`, `last_24h`, `last_7d`). Conveniences for readers that don't want to re-aggregate. **MAY** be present.
- **`collabs`** (object) — map of collaborator slug to entry count. Convenience. **MAY** be present.

Additional top-level fields are permitted (see §11) and **MUST** be ignored by consumers that don't recognize them.

### 3.2 Federation metadata

```json
"federation": {
  "upstream": "https://pointcast.xyz/compute.json",
  "contact": "hello@example.com",
  "peers": [
    "https://otherprojects.com/compute.json"
  ]
}
```

- **`upstream`** (string, URL) — the aggregator this node wishes to federate with. **MAY** be absent for self-publishing nodes.
- **`contact`** (string) — an email address or URL where the node operator can be reached. **SHOULD** be present.
- **`peers`** (array of URLs) — nodes this node mirrors or acknowledges as peers. **MAY** be absent.

Exactly one aggregator **SHOULD** be listed in `upstream`. Nodes **MAY** federate with multiple aggregators by listing them in `peers`, but the primary relationship is singular.

### 3.3 Entry shape

```json
{
  "at": "2026-04-21T13:55:00-08:00",
  "collab": "cc",
  "kind": "block",
  "title": "Block 0368 · Where the 2026 frontier meets PointCast",
  "signature": "modest",
  "artifact": "/b/0368",
  "notes": "Research-pass editorial. Seven frontier findings stack-ranked.",
  "federation": null,
  "x402": {
    "direction": "out",
    "service": "cc-editorial-rerun",
    "price_usdc": 0.10
  }
}
```

Required entry fields:

- **`at`** (string, ISO 8601 with timezone offset) — when the ship landed.
- **`collab`** (string) — the collaborator slug. For federated entries that were mirrored from another node, the form **MUST** be `{host}:{slug}` (e.g. `"getgoodfeels.com:mike"`).
- **`kind`** (string) — one of: `sprint` · `block` · `brief` · `ops` · `editorial` · `federated`. Additional values **MAY** be used with a vendor prefix (e.g. `"x-vendor-research"`).
- **`title`** (string) — short human-readable label. **MUST** be under 200 characters.
- **`signature`** (string) — one of: `shy` · `modest` · `healthy` · `heavy`. See §4.

Optional entry fields:

- **`artifact`** (string) — URL, path, or stable identifier (block id, PR number, deploy hash) pointing at the ship. **SHOULD** be present.
- **`notes`** (string) — one-line description. **MAY** be longer. **SHOULD** be plain text; if Markdown is used, the `format` field **MUST** name it (e.g. `"format": "commonmark"`).
- **`federation`** (object or null) — when this entry was mirrored from another node, this field **MUST** contain `{host, url}` identifying the source node. Native entries set this to `null` or omit it.
- **`x402`** (object) — optional HTTP 402 payment pointer. See §10.

### 3.4 Collaborator slugs

Collaborator slugs are short, kebab- or snake-cased identifiers chosen by the node operator. No central registry is required. Common slugs in the reference implementation: `cc` (Claude Code), `mike`, `codex`, `manus`, `chatgpt`, `gemini`, `kimi`, `guest`.

When a collaborator is an AI model or agent, the slug **SHOULD** be chosen to distinguish the *product* (e.g. `codex`, `cursor-agent`) rather than the underlying model version — model versions drift; product identity is stabler. Where a specific model version matters (e.g. for reproducibility), include it in `notes`.

## 4. Signature bands

Nodes **MUST** categorize each entry into one of four bands:

| Band       | Description                                    | Approximate token range |
|------------|------------------------------------------------|-------------------------|
| `shy`      | Single-file edit or small fix                  | ~1,000–5,000 tokens     |
| `modest`   | A sprint retro or a component                  | ~5,000–20,000 tokens    |
| `healthy`  | A feature across multiple files                | ~20,000–60,000 tokens   |
| `heavy`    | A primitive, a refactor, a large-scope ship    | ~60,000+ tokens         |

Token ranges are **advisory**. The bands are qualitative — they convey order-of-magnitude intent without forcing nodes to publish raw numbers.

Nodes **MUST NOT** include raw token counts in the public document. Token counts (a) leak provider pricing, (b) encourage gamification, (c) are fuzzy because model-specific tokenizers differ, and (d) are not the signal consumers of the ledger care about. If an operator wishes to record raw counts for internal purposes, they **MAY** maintain a private parallel log; this is outside the scope of this spec.

## 5. HTTP contract

A node **MUST** serve `/compute.json` with the following headers:

- `Content-Type: application/json; charset=utf-8`
- `Access-Control-Allow-Origin: *` — federation depends on cross-origin reads.
- `Cache-Control: public, max-age=300` (or longer) — five minutes is a recommended default. Nodes serving thousands of entries **MAY** choose longer windows.
- `X-Content-Type-Options: nosniff` — **SHOULD** be present.

A node **MAY** additionally serve the same document at any of: `/compute`, `/.well-known/compute`, `/compute.ledger.json`. When multiple endpoints are served, they **MUST** return identical content.

### 5.1 Optional HTTP 402 tiering

A node **MAY** gate access to richer views of the ledger behind HTTP 402 payments using the x402 protocol (see [docs.cdp.coinbase.com/x402](https://docs.cdp.coinbase.com/x402/welcome)). A common pattern:

- Unauthenticated GET → returns a truncated ledger (e.g. last 7d, no `x402` fields, no private federation data).
- Paid GET (per x402 flow) → returns the full ledger with richer metadata.

When using HTTP 402, the 402 response **MUST** include the standard `X-PAYMENT-REQUIRED` header pointing at the node's x402 endpoint, and the node **MUST** document the priced tiers at `/compute.json?about`.

## 6. Federation

### 6.1 Registration

To federate with an aggregator, a node:

1. Publishes a compliant `/compute.json` with `federation.upstream` set to the aggregator's `/compute.json` URL.
2. Notifies the aggregator operator (email or PR). The PointCast reference implementation accepts registration at `hello@pointcast.xyz` or via PR to `src/lib/compute-federation.ts`.
3. Waits for the aggregator to begin mirroring (typically within 24h for hand-curated aggregators).

### 6.2 Mirroring

An aggregator mirroring another node **MUST**:

- Preserve the `collab` field in the form `{host}:{slug}` (e.g. `"getgoodfeels.com:mike"`).
- Include a `federation: {host, url}` field on each mirrored entry.
- Not alter `at`, `kind`, `title`, `signature`, or `artifact` values.
- Honor the upstream's `Cache-Control` headers.

An aggregator **SHOULD**:

- Rate-limit mirroring reads to no more than once per minute per upstream.
- De-duplicate entries by `(host, at, title)` tuple.
- Surface aggregator-side attribution clearly in any rendered view (e.g. `"getgoodfeels.com:mike"` in the UI, not bare `"mike"`).

An aggregator **MUST NOT** rehost raw token counts (none should appear upstream; this is belt-and-suspenders).

### 6.3 Unfederating

A node **MAY** unfederate at any time by removing `federation.upstream` (or setting it to `null`). Aggregators **MUST** stop mirroring within 24h of observing the change, or upon receiving a direct request from the node operator.

## 7. Git commit trailer bridge

Compute Ledger v0 interoperates with the emerging Git commit trailer conventions from the Paris Open Source AI Summit 2026:

```
Assisted-by: Claude Code <cc@pointcast.xyz> (compute-ledger: /b/0368)
Generated-by: Codex <codex@pointcast.xyz> (compute-ledger: /b/0328)
```

The optional `(compute-ledger: {artifact})` suffix names the `artifact` field of the ledger entry that corresponds to this commit. Consumers can follow the link to retrieve signature, notes, and related context.

A node **MAY** publish a companion `/compute/commits.json` that indexes commits by their ledger entry. This is outside the required scope of v0 but recommended for nodes that expect significant Git-level consumption.

## 8. Security considerations

Publishing a compute ledger makes some project information public that might otherwise be inferred. Specific considerations:

- **Inferring priced work.** Aggregators **MAY** use entry `notes` + `artifact` fields to infer contractor rates. Nodes that do contract work **SHOULD** either (a) use only `notes` fields that don't reveal client identity, or (b) maintain a public/private ledger split.
- **Inferring team size.** The `collabs` map reveals the count of distinct collaborators. This is by design — the spec encourages transparency about team composition — but operators should be aware.
- **Bot-farming entries.** A bad-faith node could inflate its ledger to appear more productive. This is a known limitation. Aggregators **SHOULD** treat obvious inflation as grounds for unfederation; no automated detection is specified.
- **CORS wildcard.** `Access-Control-Allow-Origin: *` is required for federation. This means any cross-origin script can read the document. No privileged data should appear in a public `/compute.json`.
- **Spoofed federation headers.** An entry claiming `federation: {host: "pointcast.xyz"}` does not prove origin. Aggregators **MUST** verify upstream by fetching the claimed host's `/compute.json` directly, not by trusting mirrored metadata.

## 9. Privacy considerations

- **No personally identifiable information (PII) beyond collaborator slugs.** Slugs **SHOULD NOT** be email addresses or full legal names. A `contact` email in the federation metadata is acceptable.
- **No user data.** Ledger entries describe work done *by* the node's team. They **MUST NOT** describe work done *to or about* users (e.g. "shipped moderation action against user X").
- **No raw token counts.** See §4.
- **Archival.** Nodes **SHOULD** document their entry retention policy in `/compute.json?about` or similar. A reasonable default is "all entries retained for 365 days, older entries rolled into a summary."

## 10. Extensions

The spec is designed to be extended. Recommended extension points:

- **`x402` field on entries.** A `{direction, service, price_usdc, settled?}` object pointing at an HTTP 402 payable endpoint for replay or commission. See §5.1.
- **Custom `kind` values.** Nodes **MAY** introduce vendor-prefixed kinds (e.g. `"x-vendor-review"`). Aggregators that don't recognize them **MUST** accept the entry and either display the raw string or fall back to `"other"`.
- **Lexicons.** Nodes running ATproto PDSes **MAY** publish mirror records under a `app.compute.entry` lexicon (proposed). Cross-protocol consumers can pull from either surface.
- **Per-entry `media` or `attachments`.** Useful for blocks with posters, screenshots, or companion artifacts. No shape is mandated by v0.
- **Provenance proofs.** Future versions **MAY** incorporate verifiable-credentials-shaped proofs for high-assurance federation. v0 explicitly does not specify this.

Nodes adopting extensions **SHOULD** document them at `/compute.json?about` or a nearby URL.

## 11. Prior art and related work

- **`Co-Authored-By:` Git commit trailer** (GitHub, 2018) — single-commit co-authorship attribution. Compute Ledger v0 is a site-level superset.
- **`Assisted-by:` / `Generated-by:` trailers** (Paris Open Source AI Summit 2026) — the commit-trailer conventions Compute Ledger v0 bridges to in §7.
- **botcommits.dev** — public dashboard indexing AI-generated commits across GitHub. Aggregator at Git-commit granularity; Compute Ledger operates at site-ship granularity.
- **git-ai** (github.com/git-ai-project/git-ai) — git extension tracking AI-written code in individual repositories. Complementary; runs locally.
- **Ledger "Proof of Human" attestation** (target Q4 2026) — hardware-backed attestation of human-vs-agent principals. Orthogonal to Compute Ledger but could layer under it for high-assurance nodes.
- **x402 / Agentic.Market** (Coinbase + Linux Foundation, 2026-04) — the payment protocol Compute Ledger references in §5.1 and §10.
- **ActivityPub (W3C)** — earlier federation protocol for social networks. Instructive example of federation-as-choice rather than federation-as-mandate; Compute Ledger follows the same posture.

## 12. Reference implementation

PointCast serves as the reference implementation.

- **Source:** `src/lib/compute-ledger.ts` (TypeScript types + seeded ledger).
- **Endpoint:** `src/pages/compute.json.ts` renders the JSON document.
- **Human view:** `src/pages/compute.astro` at [pointcast.xyz/compute](https://pointcast.xyz/compute).
- **Federation helpers:** `src/lib/compute-federation.ts`.
- **License:** MIT.

The reference implementation is hand-curated: every sprint retro writes a ledger entry in the same commit. CI-derived entries from `Assisted-by:` trailers are planned but not required by v0.

A minimum-viable peer can be stood up in five minutes using the drop-in JSON at `docs/federation-examples/` in the reference repo.

## 13. Acknowledgments

This spec emerged from conversations between Mike Hoydich and cc (Claude Code) at PointCast through April 2026, triggered by Elad Gil's "compute is the new currency" post. It draws directly on prior-art conventions from the Git ecosystem (Co-Authored-By, proposed Assisted-by), from botcommits.dev's public indexing work, from the Linux Foundation's Agentic AI Foundation (AAIF), and from the x402 / Agentic.Market launch on 2026-04-21.

Thanks to the reviewers (implicit and explicit) whose federation registrations will shape v0.1+.

## 14. License

- **This specification (the text of this document):** CC0-1.0 (public domain).
- **The PointCast reference implementation:** MIT License.
- **Derived nodes:** each operator chooses their own license for their node's content. The spec imposes no licensing requirement.

## Appendix A — Minimum valid `/compute.json`

```json
{
  "schema": "compute-ledger-v0",
  "host": "example.com",
  "entries": []
}
```

Valid. Empty. Aggregators will accept registration; no entries mirror until `entries` has content.

## Appendix B — Richer example with federation

```json
{
  "schema": "compute-ledger-v0",
  "host": "getgoodfeels.com",
  "generated_at": "2026-04-21T14:00:00-08:00",
  "federation": {
    "upstream": "https://pointcast.xyz/compute.json",
    "contact": "mike@getgoodfeels.com"
  },
  "summary": { "total": 4, "last_24h": 0, "last_7d": 3 },
  "collabs": { "mike": 2, "cc": 1, "emilie": 1 },
  "entries": [
    {
      "at": "2026-04-21T09:30:00-08:00",
      "collab": "mike",
      "kind": "editorial",
      "title": "Good Feels federates compute with PointCast",
      "signature": "modest",
      "artifact": "https://getgoodfeels.com/compute.json"
    },
    {
      "at": "2026-04-18T14:00:00-08:00",
      "collab": "cc",
      "kind": "sprint",
      "title": "shop.getgoodfeels.com Schema.org Product markup",
      "signature": "healthy",
      "artifact": "https://shop.getgoodfeels.com"
    }
  ]
}
```

## Appendix C — Changelog

- **v0.1.0 (2026-04-21)** — initial working draft. Comments invited at hello@pointcast.xyz or via GitHub issue at `github.com/mhoydich/pointcast`.

---

**Next milestones (non-normative):**

- **v0.2** target 2026-05 — clarifications from first round of federation registrations; possible addition of `/compute.json?about` metadata endpoint spec.
- **v0.3** target 2026-06 — incorporate feedback from Linux Foundation AAIF working group + Paris OSS AI Summit 2026.
- **v1.0** target 2026-08 — stable, backwards-compatibility commitment, lexicon mapping for ATproto nodes.

— filed by cc + Mike Hoydich, 2026-04-21 PT. See `docs/research/2026-04-21-where-we-are.md` §2.6 for the research that motivated this RFC. CC0.
