# The Traveling Trapper — Episode 001

## Five Parts Make a Place

A working, self-contained browser experience for the existing PointCast / Loom project. Start with **Sunroom**, **Long Table**, or **Play Yard**; arrange five clubhouse parts on a nine-position board; replace a part with the same kind from another concept; save a postcard; and take the proposal to the existing #teamterra conversation.

This is an original speculative design exercise for an unspecified imagined setting in El Segundo. Its arrangement diagrams are not to scale. The two architectural references retain their original authorship and are not endorsements of the exercise.

## Run

Open `index.html` in a modern browser. It embeds its stylesheet, script, episode data and official Noun host. Its editor, local save, postcard exports and JSON export need no network access. Source links and the Loom conversation open external websites.

To rebuild after editing content or code:

```bash
python3 build.py
```

No dependencies, build framework, secret, account or service token is required.

## The complete interaction

1. Choose a starting concept. Changing concepts resets the layout and part variants to that concept.
2. Choose one of the five parts in the tray. Select a square to move it; selecting an occupied square swaps the two parts.
3. Borrow a version of the selected part from another concept. Its role in the five-part vocabulary stays fixed.
4. Read the concept's invitation and tradeoffs, then the two source cards. The source accounts and our interpretations are separate.
5. Save a postcard as SVG or PNG, or export the editable state and episode context as JSON.
6. Choose the next constraint and save a local pick. Copy the prepared reply and open #teamterra's composer. The visitor pastes and sends it on Loom.

## Persistence and publication

The browser stores only this episode's arrangement, selected variants, next constraint and local choice in localStorage. The clear control removes the saved arrangement for this episode. Malformed or obsolete local state falls back to a valid starting state.

The page does not claim a shared tally, one-person-one-vote verification, a server-side vote, or an automatically posted message. It makes no API requests. The official Loom composer route opens the message box but does not support a message-body query parameter, so copy and send are explicit separate actions.

The four broadcast segments are drafts. Their suggested quarter-hour sequence does not create or modify a scheduler, X account or publishing job.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Self-contained built episode |
| `page-template.html` | Accessible page structure and responsive styling |
| `app.js` | Parts editor, guarded local storage, tabs, downloads and copy workflow |
| `episode-content.json` | Three concepts, fifteen part variants, two reference cards, four broadcast drafts |
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

The episode belongs under `sketches/traveling-trapper/2026-11-15/` for a reviewable PointCast contribution. A future reviewed deployment can place the self-contained page at a public site route. This packet does not modify the main site, add dependencies, install a scheduler or create a new project room.

Use the original #teamterra thread for feedback and source review. The earlier practice atlas remains a separate linked record collection; this episode adds an editorial and creative experience over that work.
