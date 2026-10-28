# Offered Light: mobile visual revision

Michael called the first version directionally good but C-level on mobile, then asked to use his Midjourney archive and add more visuals.

This revision makes the artwork the card's full-width square surface. It removes the mobile introduction and nested arch treatment, adds six real Midjourney artworks in a horizontal selection strip, and puts personalization, sharing, and sound/stillness into separate native dialogs. The default card has one main action, Make this yours; receiving mode has Edit words and Share this light. Personal words expand naturally. Images retain their complete square composition.

## Sources

Six existing Michael Hoydich Midjourney images were reused byte-for-byte from PointCast. Garden and Remembering have prior authenticated Spotlight provenance, including job URLs and matching hashes in `public/images/small-shrines/provenance.json`. Warmth, Evening, Blue and Tide are owner-published July 18 source works in `src/data/art-v2.json`, not the adjacent OpenAI reinterpretations. New labels are editorial, not asserted artist titles. `public/offered-light-lab/artwork-provenance.json` records all six sources and hashes.

The current live archive returned an anonymous client-rendered shell. No supported connected browser was available, so this work does not claim a new browse of the archive. No images were generated or purchased for this revision.

## Behavior

- Explicit personalization opens a dialog focused on its heading, avoiding an automatic keyboard on arrival. Closing/Escape retains words and returns focus; preview returns to the card. Editing a received preview retains that context.
- Native dialogs contain focus. The nonmodal compatibility fallback stays in flow and scrolls into view. Background/pagehide/destroy clean up audio and dialog scroll locks.
- Artwork commits only after decode; errors retain the last successful image, theme, selection and export. Exact artwork IDs support several choices sharing the same visual theme.
- PNG export respects source aspect ratio: square artworks remain square before the dedication. Long words/explicit newlines retain existing bounds and wrapping.
- Sharing remains an intentional image/text action. No persistent interactive gift URL or message-delivery service was added. No personal text is submitted, stored, counted, or sent on arrival or candle activation.

## Verification and release boundary

The focused and regression command is:

```sh
node --test tests/pointcast-effects.test.mjs tests/pointcast-effects-playground.test.mjs tests/offered-light.test.mjs tests/game-library.test.mjs tests/sunny-side-games.test.mjs tests/small-shrines-audio.test.mjs tests/prayer-playback.test.mjs
```

62 tests passed, including actual HTML integration under JSDOM and modeled native-dialog behavior. Source review checked 320/390px sizing, unique IDs, existing links, source hashes, long sender wrapping, fallback visibility and all six artworks. These checks are not physical-device evidence.

Real Safari/iPhone layout, enlarged text, VoiceOver, keyboard/viewport behavior, native share cancellation, audible quality and background audio still need device verification. The earlier Figma board remains the first design study; the new HTML is the current prototype.

The existing public Still Light Sites preview may be updated for Michael to try this revision. This is separate from canonical publication. PointCast PR #1571 stays draft, with its review hold; PR #1555 is untouched. No games, main merge, deployment script, credentials/security configuration, or PointCast release is changed. The coordinated release owner must validate final combined main and deploy through `scripts/deploy.sh`, then verify actual canonical pages/assets.
