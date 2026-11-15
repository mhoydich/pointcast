# The Traveling Trapper — Episode 001

## Five Parts Make a Place

A working, self-contained browser experience for the existing PointCast / Loom project. Start with **Sunroom**, **Long Table**, or **Play Yard**; arrange five clubhouse parts on a nine-position board; replace a part with the same kind from another concept; and take the proposal to the existing #teamterra conversation. Continue from **Daylight** into the **Night Market** round, then pass along a postcard, an editable JSON file, or a link someone else can reopen.

This is an original speculative design exercise for an unspecified imagined setting in El Segundo. Its arrangement diagrams are not to scale. The two architectural references retain their original authorship and are not endorsements of the exercise.

## Run

Open `index.html` in a modern browser. It embeds its stylesheet, script, episode data and official Noun host. Its editor, local save, postcard exports and JSON import/export need no network access. Shareable arrangement links should be copied from an HTTP(S) hosted copy of the page. Source links and the Loom conversation open external websites.

To rebuild after editing content or code:

```bash
python3 build.py
```

No dependencies, build framework, secret, account or service token is required.

Inside the PointCast checkout at `sketches/traveling-trapper/2026-11-15/`, the same command also writes an identical copy to `public/traveling-trapper/index.html`. It checks the exact repository layout and the repository's `astro.config.mjs` and `AGENTS.md` before doing so. A standalone downloaded kit still writes only its own `index.html`.

## The complete interaction

1. Choose a starting concept. Changing concepts resets the layout and part variants to that concept.
2. Choose one of the five parts in the tray. Select a square to move it; selecting an occupied square swaps the two parts.
3. Borrow a version of the selected part from another concept. Its role in the five-part vocabulary stays fixed.
4. Read the concept's invitation and tradeoffs, then the two source cards. The source accounts and our interpretations are separate.
5. Switch from Daylight to Night Market without losing the arrangement. Each round gives the selected part a new design question. The separate night-market starter intentionally replaces the arrangement with a mixed kit around Long Table.
6. Save a postcard as SVG or PNG, or export the editable state and episode context as JSON. Open that JSON later, review its contents, and apply it to continue editing.
7. Copy an arrangement link to share an editable design. The recipient reviews its parts before choosing to replace their local draft.
8. Choose the next constraint and save a local pick. Copy the prepared reply and open #teamterra's composer. The visitor pastes and sends it on Loom.

## Night Market

The evening round asks: **What makes someone stop, watch, and join in?** Its starter borrows Sunroom's canopy, reading chairs and refill point, placing them around Long Table's common table and repair cart. A navy evening palette, string-light drawing and round-specific questions carry through the interface and exported postcard. The original Noun pixels remain unchanged.

The four invitation questions are prompts for a person to consider, not an automated accessibility or safety assessment. All positions remain conceptual, without scale or a selected physical site.

## Reopening and sharing

The importer accepts this episode's version 1 and version 2 JSON exports. It validates the episode, state version, round, concept, all five part variants, five unique positions, and next constraint. It rebuilds the editor from recognized fields; imported prose and links do not replace the episode's trusted content. File size and arrangement-link length are bounded.

A valid file or link opens a review panel. The existing arrangement remains in place until the visitor chooses **Use this arrangement**. Cancel leaves the existing draft intact. Imported arrangements become drafts, so another person's local pick is not treated as the recipient's choice.

Arrangement links encode only the small recognized editor state in the URL fragment. The page makes no request to store the design. Anyone with a shared link can read and reopen its arrangement; public Loom posting remains a separate action.

## Persistence and publication

The browser stores only this episode's round, arrangement, selected variants, next constraint and local choice in localStorage. Existing version 1 local drafts migrate to the Daylight round. The clear control removes the saved arrangement for this episode. Malformed local state falls back to a valid starting state.

The page does not claim a shared tally, one-person-one-vote verification, a server-side vote, or an automatically posted message. It makes no API requests. The official Loom composer route opens the message box but does not support a message-body query parameter, so copy and send are explicit separate actions.

The four broadcast segments are drafts. Their suggested quarter-hour sequence does not create or modify a scheduler, X account or publishing job.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Self-contained built episode |
| `page-template.html` | Accessible page structure and responsive styling |
| `app.js` | Parts editor, two rounds, guarded local storage/imports, arrangement links, tabs, downloads and copy workflow |
| `episode-content.json` | Three concepts, fifteen part variants, two rounds, two reference cards, four broadcast drafts |
| `build.py` | Reproducible standard-library builder |
| `assets/host.svg` | Exact official-trait Noun host, with transparent background |
| `assets/host.png` | The same host at 1024×1024 pixels |
| `assets/nouns-provenance.json` | Official source commit, blob hash, trait recipe and output hashes |
| `README-content.md` | Editorial and interaction notes |

## Source and art provenance

- [WOHA — Kampung Admiralty](https://woha.net/project/kampung-admiralty/): the published account of its layered community uses. The source page lists completion in August 2018; the episode preserves that qualification in its data.
- [Serpentine — Pavilion 2021 Fragments](https://www.serpentinegalleries.org/whats-on/serpentine-pavilion-2021-fragments/): community partners and reconfigurable fragments, including the Valence Library recording arrangement.
- Noun art uses the official `nounsDAO/nouns-monorepo` data at commit `2213eea1c15f331f786784c2621d53bdecf907e2`, input blob `b177ce2723cac1b722154e6a046b359a80ba83f5`. Host recipe: body-gold 9, accessory-pocket-pencil 73, head-camcorder 31, glasses-square-guava 10. Art is CC0; [Nouns brand materials](https://nouns.wtf/brand). The original palette and pixels are preserved; the head is not an AI approximation.

The five part icons and arrangement/postcard graphics are original code-native SVG. They depict editorial concepts, not photographs or reconstructions of the reference buildings. This independent field-guide project has no Mead affiliation.

## Integration

The editable source remains under `sketches/traveling-trapper/2026-11-15/`. The checked public copy is staged at `public/traveling-trapper/index.html`, for the direct `/traveling-trapper/` route on PointCast after a reviewed main merge and successful production deployment. This source change does not establish that the route is already live.

The existing standalone-room allowlist includes only this route prefix, suppressing PointCast's account/session bridge for the episode. It adds no authentication, API, scheduler, dependency or new project room. The source and public HTML copies remain byte-identical; the site's normal metadata processing still applies during build and delivery.

The external GitHack review link can show an “Open the page” confirmation before serving HTML. Its [official FAQ](https://raw.githack.com/) says acceptance suppresses that notice for the same repository for 24 hours. The direct PointCast route removes that hosting intermediary; switching GitHack hostnames is not the delivery fix.

Use the original #teamterra thread for feedback and source review. The earlier practice atlas remains a separate linked record collection; this episode adds an editorial and creative experience over that work.
