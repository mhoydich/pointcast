# Nouns Drum Club — Encore

Mike asked to continue the Nouns Drum Club sprint with Codex acting as product manager. This release connects the companion artwork to the instrument through a four-player band builder.

- The Bandmates gallery offers one player per role, 81 valid quartets, a daily UTC starting band, shuffle, and an exact score link into the instrument.
- Composition keeps each player's own sound family, uses a shared median tempo and mean swing, and leaves the canonical twelve artworks and scores intact.
- The chosen four Nouns appear on the stage. Room invitations carry the current beat and validated lineup, but joining and playback remain explicit. Live rooms share played keys and reactions; loops remain local.
- Shared beats can be edited without replacing the visitor's saved beat. Save beat here explicitly adopts the score; subsequent edits autosave. Matching saved scores restore their quartet. Replacing the score with a preset or blank canvas clears that lineup.
- Homepage, Nouns directory, campaign navigation, and the machine-readable guide point to the builder. Static fallback remains usable with JavaScript off; controls become active only when initialized.

Validation covers all 81 score combinations, codec compatibility, stale cached dates, shuffle/reset, keyboard focus, silent arrival, saved-beat protection, invitation contents, and existing campaign placement. Local browser checks exercised real playback, save/restoration, invitations, and 390px layouts with no document overflow. An independent Sol review verified the final client behavior after fixes.

No NFT contract, mint, price, supply, wallet action, or backend protocol change is part of this release. Bandmates remain a playable unminted companion set.
