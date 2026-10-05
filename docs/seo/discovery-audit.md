# PointCast discovery audit

`/discovery/` presents a frozen production inspection covering technical SEO,
agent discovery, declared bot access, and generative-search readiness. It is an
audit dashboard, with links to evidence and a downloadable report. It does not
monitor production or claim search rankings, index coverage, traffic, or AI
citations.

## Reproduce

Run `node scripts/audit-discovery.mjs --help` for the bounded read-only production
inspection. A normal refresh command is:

```sh
node scripts/audit-discovery.mjs --output public/audits/discovery-YYYY-MM-DD.json --references public/audits/discovery-standards.json
```

Use the capture date in the filename. Update the dashboard snapshot import and
report download path when retaining a new dated report. The report records its
own request cohort, check times, coverage denominators, response status, and
exclusions. Only pass `--source-ref` after reviewing the cited public repository
revision; it is source rationale, not a deployed-revision claim. Preserve the previous report
before replacing the committed snapshot and review changes before publication.
No authenticated, payment, signing, or write operations are performed.

Run `npm run build:bare`, then `node scripts/seo-scan.mjs` for the separate local
generated-page scan. The generated scan covers authored and static HTML assets;
its H1 counts, description length limits, and schema-presence checks express
repository conventions rather than search-engine indexing requirements.
Generated metadata is not evidence that production serves those same bytes.

Run `node --test tests/discovery-*.test.mjs` for the audit parsers, gate
classification, coverage, report contract, filters, CSV exports, and snapshot age.
Run the repository's agent and publishing audits before a release recommendation.

## Interpretation

- Readiness describes observable prerequisites and usability. Actual outcomes
  need authorized search-provider analytics, verified crawler logs, or a disclosed
  repeatable query study.
- A synthetic User-Agent request originates from the auditor's network, not a
  provider's verified crawler. HTTP compatibility and robots rules are separate
  observations.
- A robots crawl block does not mean `noindex` or removal of previously indexed
  URLs. Named groups must be evaluated independently from the wildcard group.
- Authentication, payment, missing-input and method gates are expected when they
  match the endpoint contract. They are not automatically outages.
- JSON-LD parsing checks syntax and the observed types. The selected Product
  checks cover only explicitly listed candidate properties, not full Google
  eligibility, currency/price validity, visible-content agreement or rich-result
  delivery. They cannot identify historical Search Console affected URLs.
- `llms.txt` is an optional proposal. Custom agent manifests, MCP discovery,
  scoped OpenAPI documents and legacy plugin manifests have different contracts.
- A build date is distinct from a content modification or publication date.
  Source and attribution signals support traceability, not factual verification.
- The seven-day stale badge is an editorial reminder to inspect again. It is not
  a crawler requirement or a freshness guarantee.

The public snapshot contains only public route evidence. Private checkout paths,
private repository metadata, logs, credentials and network details do not belong
in it. Public repository revision links may explain separately reviewed source.
Research references are retained in the accompanying standards JSON.

## Local baseline and older scan counts

The current-main baseline generated 2,904 HTML assets on 2026-10-03. Of these,
2,861 explicit-head documents had one title, description and self canonical,
and parseable JSON-LD. The existing scan emitted 308 convention rows, with six
allowed H1 rows removed to reproduce the earlier 302 figure. Those are mixed
policy checks, not 302 unavailable URLs. A separate HTML-parser review confirmed
that the 43 implicit-head files have browser-normalized heads; 31 are ad assets
and 12 are deliberate redirect stubs. This generated-source inspection is
separate from the production report's bounded HTTP sample.

Likewise, an advertised endpoint returning 400, 401, 402, 404 or 503 to an
unauthenticated GET needs its method, input and audience contract checked before
being classified as an outage. The report preserves those distinctions.

## Release boundary

This change adds a dashboard and reproducible checks. Findings recommend fixes;
they do not authorize changes to robots policy, authentication, payment, schemas,
or shared discovery files. Follow `docs/OPERATIONS.md` for integration and deploy.
`AGENTS.md` requires **X review + MH approval** for a merge to main. A coordination
lane is separate from that approval.
