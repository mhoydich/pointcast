# The Traveling Trapper — Episode 01 content

**Five Parts Make a Place** is a speculative clubhouse exercise for an unspecified, imagined El Segundo setting. `episode-content.json` contains three concepts, two primary-source reference cards, and four unpublished broadcast drafts.

## Interaction notes

- Begin with three equally available concept choices: Sunroom, Long Table, and Play Yard.
- Keep the part IDs stable: `shade`, `seating`, `water`, `table`, and `activity`. Each concept changes their labels, arrangement, and purpose.
- Show the pitch and three tradeoffs beside the editable scene. Let a visitor rearrange a part or swap one slot with the corresponding part from either other concept, keeping the other four.
- Provide keyboard movement or explicit move controls alongside dragging, plus a reset to the selected concept.
- Label any saved preference as the visitor's local choice unless a real shared voting system exists.
- An exported SVG postcard should retain the episode title and speculative label. Copying a Loom reply prepares text; it does not publish the reply.
- Present source facts separately from our interpretation. Use the source links; the reference cards do not grant photography rights or imply architect endorsement.
- Keep the existing authentic Noun as an editorial host. Keep real-site, construction, and performance claims out of the interaction.
- Treat all broadcast segments as drafts. Their lengths exclude any appended URLs; no posting, schedule, or audience response is claimed.

The source records were checked on 15 November 2026. The Serpentine Fragments account provides a direct connection between architecture, parts that can be separated, and community broadcasting at Valence Library. Our five-part clubhouse concepts are original interpretations, not versions of either referenced project.

WOHA's current project page lists completion in August 2018, so the reference year is explicitly labelled `2018 (WOHA listing)` rather than silently normalizing it to a year from another account.


## Additive rounds: Daylight and Night Market

The new `rounds` array supplies two editorial overlays for the existing kit. It adds no concept IDs and does not change the fifteen existing part variants, references, metadata, or broadcast drafts.

### Data contract

Each round has `id`, `name`, `kicker`, `prompt`, `brief`, `part_prompts`, and `checklist` (four short questions). The prompts object has exactly the five stable part IDs: `shade`, `seating`, `water`, `table`, and `activity`; all copy values are strings.

- `day` / **Daylight** asks, “What makes you want to stay?” Its questions explore a pause out of the sun, conversation or solitude, a refill stop, a common table, and an activity someone could join for five minutes.
- `night-market` / **Night Market** asks, “What makes someone stop, watch, and join in?” Its questions turn the same kit toward a warmly lit welcome, a shared repair or demonstration, a quieter edge, and a visible refill stop.

Night Market also has `starter`, an arrangement using only the existing concepts and variants. Daylight has no prescribed starter; its existing concept choices remain available. Both rounds provide a four-question `checklist` for a consistent interface.

### Night Market starter

The starter uses Long Table as its base concept. Cells are zero-based, arranged left to right and top to bottom in the existing 3 × 3 grid.

| Part | Borrowed variant | Source concept | Cell index |
|---|---|---|---:|
| Shade | Open canopy | Sunroom | 1 |
| Seating | Reading chairs | Sunroom | 6 |
| Water | Refill point | Sunroom | 2 |
| Shared table | Common table | Long Table | 4 |
| Activity | Repair cart | Long Table | 5 |

This places the table in the middle with the repair cart beside it, the canopy and refill point along an arrival edge, and reading chairs in a separate corner. These positions offer a starting invitation; visitors can rearrange every part and borrow any of the existing variants.

The starter's `constraint` is `night-market`. Round purpose and next-round constraint are separate pieces of state: choosing an evening round need not lock the next invitation to the same constraint.

### Interaction and export notes

Show the selected round's prompt and brief near the editor, with its matching question beside the selected part. Each round's four checklist questions are invitations for the visitor's own judgment, not an automatic score or a claim of measured performance. Evening light drawings are illustrations of the proposed welcome.

Keep all five parts available when the round changes. If applying the suggested starter resets an arrangement, make that an explicit interaction. Preserve the chosen round ID alongside the arrangement when saving, importing, copying or exporting, so a returning visitor retains the purpose of the composition as well as its geometry.
