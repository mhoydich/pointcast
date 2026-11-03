# Editorial preview contract

A portable authoring contract for a published, source-linked card. This is a proposal for future site adapters, not a new public rendering service or a change to PointCast's existing routes.

## Record

Each public card records a stable content ID, canonical page, title, description, descriptive image alt, edition or source-check timestamp, public source references, artwork ID and provenance, template and font revision, and stale policy. Distinguish publication, event and checked dates. Publish no private reports, drafts, access tokens or unverified activity. Imagined artwork is decorative, not evidence of a real event.

The renderer takes only that record and local, approved assets. It must not depend on current time, randomness, user agent, counters or network calls. The rendered bytes determine a revisioned 1200×630 PNG or JPEG URL. Retain previous referenced assets; never replace bytes under an immutable URL. Validate type, dimensions, size, layout and contrast, and inspect the image at small share-preview size.

## Delivery

Serve real public HTML with a single absolute canonical URL and OG/Twitter title, description, image, dimensions, MIME and descriptive alt. A fixed edition page may be self-canonical; an evergreen page remains its own canonical. Public GET/HEAD retrieve completed assets, with HEAD avoiding a render. Keep a static fallback and retain the last known good edition if an update fails. Use short caching for mutable page metadata and immutable caching only for preserved, content-addressed bytes.

A version parameter on a live renderer is only a cache-busting hint unless the route can retrieve those exact historical bytes. Label snapshots with their real time and hide or replace stale current claims according to the source's policy. HTTP freshness and versioned images do not force social platforms to recrawl; existing posts may keep an earlier preview.

## Authoring and scope

Inspect route ownership and source/asset provenance, select a finite art direction, render locally, review visually, validate raw metadata and image responses, and record the revision. Only inspect public routes after an authorized release; do not submit private preview links to external validators. Avoid arbitrary URL fetching, paid image generation, per-view writes and unbounded renders. A shared package could later expose pure validation and rendering primitives with site-specific adapters; a hosted service needs a separate operational and security design.

PointCast already has two distinct systems: `/api/unfurl` reads external link metadata, while `/og/page.png` and `/og/live/*` create PointCast's own cards. The fixed home-share editions and build-time preview wall offer the closer model for reproducible editorial cards. The current dynamic routes use time and live data and are not immutable snapshots; this proposal does not change them.
