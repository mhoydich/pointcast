# Loom magic words (OFF-49 A)

A message whose first line is one word alone (trimmed, any case, no punctuation) gets a small fact the server fills in at send time. "dice" and "  DICE  " count; "Dice!" and "dice roll please" do not. The body is stored exactly as typed.

| Word | What the server fills in (`magic` on the op) | The page shows |
| --- | --- | --- |
| shout | `{ word }` only | the body set large, no motion |
| dice | one fair roll 1–6 (`crypto.getRandomValues`, unbiased), source "the Loom server" | "rolled a 4 · by the Loom server, 11:42 AM"; a short roll only after a tap |
| time | the server clock as New York time and UTC (the poster's zone is not known) | "11:42am in New York · 16:42 UTC · from the Loom server clock" |
| drum | the drum's all-time count, read as `/api/drum` reads it (DrumCounter DO, then VISITS `drum:total`); null if out of reach | "77,317 drum hits · read by the Loom server at …"; a synthesized drum click only after a tap |
| noun | trait names from sha-256 of the sender's normalized name (official CC0 lists in `noun-traits.mjs`), the same every time | the trait names as text, beside a 64px still from `GET /loom/noun?b=&body=&a=&h=&g=` (`src/lib/loom/noun-route.mjs` over `renderPortrait()`; every name is checked against the lists; the path has no `.svg` because `_routes.json` serves `*.svg` statically) |

Rules kept: sound and motion only after a tap; one "Magic words: on/off" switch in the thread menu (stored as `loom.magic`, default on) turns every effect off, and prefers-reduced-motion stops animation. The fact line is not an effect: it shows as plain text either way. Fetch words say where the fact came from and when. One word per message, only the first line is read. A word never spends, mints, ships or approves, and never ripples further than the body already does.

Fakes: a client-sent `magic` is dropped (validateMessage never copies it); only `makeMagic()` in `service.mjs` sets it. Edits keep the original fact and never recompute it. The fact shows only while the edited first line still says the word, so deleting the word hides it and putting it back restores the same roll.

Next words (OFF-49 B: beat, bell, fire): add the word to `MAGIC_WORDS`, a branch in `makeMagic()` and one in the page's `renderMagic()`. A word that reaches another person (a bell) lands once, and gets its own rate-limit bucket (e.g. `loom:magic:bell`, a few per sender per hour plus a board-wide ceiling) checked in the append path before the fact is made, so a script cannot ring a bell a thousand times. Over the limit, the message still posts as plain words with no effect.
