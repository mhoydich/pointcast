# University of El Segundo learning homepage — local draft

The existing `/ues/` class catalog becomes a front door to ten self-paced course rooms and a shared study directory. The original `#current-term` catalog, course URLs, course runtime, local browser progress, class JSON, historical UES-05 and funding/program route remain in place. The directory's four schools are browsing groups for independent inquiry. The identity explicitly describes an independent learning project, without accreditation or city affiliation.

## One public registry, two views

- `src/data/ues-front-door.json` holds public descriptions, status, checked dates, source/data URLs, exact public source provenance and course-link snapshots.
- `src/lib/ues-front-door.mjs` validates publication links, filters studies and renders one semantic article.
- `src/components/UesFrontDoor.astro` integrates that article within BlockLayout's existing main.
- `/ues/portal.json` exposes the directory; `/ues/classes.json` retains the existing class contract.
- `node scripts/export-ues-homepage.mjs /tmp/ues-homepage-preview` creates a portable static review draft. Serve that directory over HTTP to test module-based filters. It retains `noindex,nofollow` until a reviewed public release.

The portable homepage sends learners to PointCast's existing courses rather than creating a second learning runtime. Browser course progress stays on its existing origin. It is not copied, imported or sent to a server.

Live is a checked publication claim, not an endorsement or a promise that every proposed feature inside a public guide is activated. Proposed studies and the separately held IndustryNext companion have null public links. The plugin guide is labelled as a published educational draft. Existing nature, weather and Beach Commons resources are identified as separate related resources, not silently substituted for the requested new studies. The verification date is not a publication date.

## Domain and destination proposal

Preferred independent address: `universityofelsegundo.xyz`. Compact alternative: `elsegundo.study`. Both were returned available/non-premium by the registrar's exact-name public search on 2026-10-03. Quoted first-year USD promotions/current annual renewals were $2.04/$14.21 and $1.54/$31.41. These are observed search quotes, not finalized checkout totals or price guarantees. No purchase, cart, reservation or DNS action occurred.

`university.pointcast.xyz` is a no-additional-registration option on the existing owned apex. The checked Pages project is `pointcast`, with the apex already attached. The proposed hostname returned NXDOMAIN; it has not been configured. Routing/hosting costs and a separate standalone release remain review decisions.

Bounded discovery checked the existing public PointCast UES surfaces, 48 owned Sites, 51 owned GitHub repositories and the existing Pages project inventory. No separate UES learning homepage was verified there. The related Daily Wall and Network El Segundo Sites retain their existing art/network purposes.

## Release boundary

This preparation is local only. The current instruction is to ask before any public action. Do not push, open/change a PR, merge, deploy, register a domain, attach a hostname or modify DNS without parent-confirmed approval for this new homepage scope. No shared Home/LatestProjects or Hoydich dashboard source is edited. The parent should forward the verified publication/status mapping to the dashboard owner; the live dashboard snapshot and source-ready dashboard are distinct.

When approval arrives, rebase/integrate against current main, use independent X review and MH approval, run the required exact-head aggregate checks, and use the prescribed serialized `scripts/deploy.sh` PointCast lane. A standalone deployment needs its chosen destination and explicit public release approval. IndustryNext's held companion has its own separate authority and release lane.

## Validation

`node --test tests/ues-front-door.test.mjs` covers publication guards, combined search/category/status filters, safe rendering, ten original course links/progress contract and semantic wrappers. Isolated real Chrome review covers 390/1440 layouts, keyboard/school jump, no-JavaScript availability, native JSON identity and scoped axe checks. The full-site build is deliberately deferred while another owner holds the shared build lane; local focused verification must not be represented as a complete aggregate build.

Artwork is original inline SVG: an abstract learning-path diagram using the already existing Brand Tokens v0.1 concept's bone, clay, forest and charcoal direction. It depicts no campus or accredited seal and has text alternatives/provenance.
