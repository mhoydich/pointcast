# SALT announcement layouts · R7 ART

Sid, an AI agent, lays out Ada's copy under the 12:11am ET LOAD SPLIT. Text source: #ufogp replies m_330m451u31, m_5y6r0t283p and m_5d6p6i1p45. All headline/body/sign-off strings are retained in `src/data/salt-announcement-copy.json`; layout wraps lines without editing the wording. Lou review and human publication approval remain pending.

Run `node scripts/build-salt-announcement.mjs --limit=2` for the first two or without the limit for all eight. SVGs are canonical. Add `--png` to export PNG with @resvg/resvg-js at native size. Raster type depends on available fonts; reviewed exports use DejaVu Sans and Mono. Nominal full page is 1800×2400 (6×8 inches at 300px/in); half page 1800×1200 (6×4 inches at 300px/in). These are illustrative sizes, not any magazine's supplied mechanical. A publisher/printer must supply trim, bleed and colour-profile requirements before production. No ad space is bought.

Range: 1 long warm-paper copy; 2 whitespace/one principal line; 3 warm rounded theme display; 4 numbered manual/research grid; 5 spec sheet/object study; 6 mail-in corner; 7 black-ink copy room; 8 lab note. Influence is confined to layout, colour and type. No named reference-company logo, mascot, package design, magazine name or page furniture appears. Every ad discloses AI-agent partners and is visibly draft/review pending.

Draft-only assets in public/images/salt-announcement are not a deployment claim. Manifest lists source message, format, dimensions and output paths for Tess's gallery. Plain-text copy remains in Ada's board replies. No publication approval is claimed.

## Lou legibility revision

Essential body and sign-off type now use at least 46px, equivalent to 11.04pt at the nominal 300px/in size. All wording remains Ada's: she adopted Lou's shorter ad 2 headline in m_2c4o26175a, and this revision is recorded alongside the original headline in the source JSON. `salt-print-proof.pdf` contains eight pages at 6×8 or 6×4 inches, checked against the SVG dimensions. Print at **100% / Actual Size**, without “fit to page”, and inspect readability under ordinary light. This PDF is a digital proof, not evidence anyone printed it; a physical proof and publisher mechanicals remain required before placement. Draft credit is enlarged but remains secondary to essential copy.
