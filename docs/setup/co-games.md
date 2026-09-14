# Co-games: Noun battles

Human route: `/co-games`. Machine rules and move contract: `/co-games.json`.

The free browser game uses a shared deterministic rules engine for both modes:

- **Practice partner:** a local search over the visible remaining cards. No account or inference.
- **Your AI:** the profile's existing paired Codex or Claude subscription runtime. Each click on **Play with AI** authorizes one text job and automatically resolves that one turn after validating the returned support. No second cast confirmation is needed. Each following round requires another explicit click. The paired computer must remain awake and its companion must run.

The browser starts in Lantern grove against Garden gang and keeps the battle state, battle number, and win count in memory. Reloading starts over. A loss retries the same encounter; a win offers the next chapter. **New battle** starts the next different encounter with fresh health/cards and a new game ID. **Worlds** lets the player visit any chapter without first winning. No travel or restart submits an AI task. There are no prizes, purchases, server scores, automatic inference retries, or public room messages. The existing Unity arena project remains a separate private prototype.

## NOUNS: STARJAM

`/co-games/flow` opens with **Noun Drip**, a forgiving musical toy. Nouns float down and wait on the canvas: tap any visible Noun at any height, or press D/F/J (1/2/3) to pop a Noun in that column. Native buttons also support Tab and Enter/Space. Distinct quick taps count independently; each Noun can be collected once. There are no missed-note penalties or health loss. Each shower lasts 35 seconds, holds at most six Nouns, and gathers a little crew for its ending. Pause, menus, hidden pages, and switching modes stop the active shower and audio. Reduced motion settles the Nouns without decorative travel.

**Rhythm** remains one tap away. Three lanes share a visible hit line; tap a pad or press D/F/J (1/2/3 also works). Each finite track lasts at most 35 seconds. Perfect and good hits deal damage, streaks increase score, and the local practice buddy heals 5 every eight successful hits. Missed notes and off-beat taps cost health. Its short shared input debounce prevents simultaneous lane mashing; tracks have no chords.

Drift, Groove and Arcade run at 72, 96 and 120 BPM with progressively tighter timing windows. All notes align with the musical beat clock. The main control changes from Start to Pause to Resume. Dialogs and hidden pages freeze the active clock; returning never resumes automatically. Restarting or changing worlds resets the track and waits for Start.

This mode uses local practice support only, with no inference, remote score, purchase or wallet calls. The spell battle at `/co-games` continues to offer the paired native AI. STARJAM shares the four story backgrounds and authentic Nouns roster, while keeping its own bounded engine, audio lifecycle and controls. Original finite AAC soundtracks play through native HTML media, with three short lane accents on real successful inputs; optional haptics are off until enabled. Reduced motion removes decorative movement while keeping the notes required for timing.

The Sound and feel dialog includes **Test sound**, an original three-second welcome tune with native audio controls and a direct media link. It does not start or advance a battle. Production STARJAM now plays twelve original, finite 35-second AAC tracks (four worlds × three paces) through HTMLMediaElement, without routing them through Web Audio. Bright plucked melodies, harmonic bass and dry percussion carry on phone speakers. Source and decoded-signal measurements are in `scripts/generate-starjam-soundtracks.py` and `/audio/starjam/manifest.json`; delivered audio totals about 3.51 MB, with only the selected backing and small accents loaded per visit. No external samples or AI/music-service requests are used.

Start and Resume call `play()` synchronously inside a trusted gesture. Intent survives capture/target microtask checkpoints. The gameplay clock follows actual media `currentTime`, so loading or buffering cannot run the notes ahead of the music; muting reanchors the visual-only clock. Explicit pause resumes from the last presented position. Hidden pages, menus, reset, finish and cleanup stop owned playback; late play outcomes cannot restart or pause a newer run. Valid lane hits may play one short accent only within the matching trusted input. Native interruptions or playback rejection pause the game and offer recovery. The iPhone's physical volume buttons control its media output.

Noun Drip accents use the same native AAC elements, authorized by a matching trusted Noun tap or lane key. Duplicate pop events and stale input cannot replay an accent. Mode changes stop the previous controller before mounting the next.

Cloudflare Pages currently [returns full 200 responses for byte-range requests](https://developers.cloudflare.com/pages/configuration/serving-pages/#behavior). A scoped middleware fallback serves correct 206 slices for the sixteen known STARJAM AAC files, preserving audio MIME, exact Content-Range and Content-Length. The fallback bounds actual reads to the declared asset length (at most 512 KiB), supports prefix, open-ended and suffix ranges, and preserves existing partial/error responses. Strong If-Range ETags are checked; unvalidated conditions send the full file. Other PointCast resources retain their existing delivery behavior.

The previous synthesized path remains for consumers mounting the controller without the new media elements, with its existing bounded lifecycle tests. WebKit documents differences between media and Web Audio output in [issue 237322](https://bugs.webkit.org/show_bug.cgi?id=237322), and reports a running-but-silent AudioContext in [issue 276687](https://bugs.webkit.org/show_bug.cgi?id=276687). Neither a resolved play promise nor an advancing media clock proves physical audibility; a real iPhone listening check remains separate.

Successful hits add small lane bursts, each five-hit streak gives the crew a hop, and results offer an Encore. Decorations cancel on pause/reset/cleanup, and reduced motion disables movement and hides bursts. Gameplay scoring and timing windows are unchanged.

Run `node --test tests/nouns-flow*.test.mjs tests/nouns-drip*.test.mjs tests/starjam-audio-routing.test.mjs` for timing, free-tap collection, pause/resume, input, terminal-state, native audio lifecycle and byte-range coverage.

## Four worlds, one little journey

The backgrounds follow a lost golden star on its way home. `co-games-worlds.ts` supplies each chapter's name, story, arrival and victory copy, image path, crop position and visual theme. Both the HUD and `/co-games.json` use that shared source; battle rules remain in the engine.

| Chapter | Place | Encounter | Story |
| --- | --- | --- | --- |
| 1 | Lantern grove | `garden` | Follow the star through the waking lanterns. |
| 2 | Midnight diner | `rush` | The night crew points the way toward the sea. |
| 3 | Tideglass ruins | `shell` | Wait for the old gate's shell to soften. |
| 4 | Moon station | `storm` | Help the star catch the moonlight train home. |

Each place has an original pixel-art background under `/images/co-games/worlds/`. The first Rift Garden image is retained in the Worlds dialog as the place the game began. Free exploration is deliberate: chapters are not locked behind wins, payments or an AI connection. Visiting a place closes the picker and starts a fresh battle there, preserving earned session wins while resetting health, cards, round, move history and native model attribution. The controller rejects travel while a native turn is in flight. Travel never queues a turn or requests inference; native mode may refresh connection discovery.

## Sound and feel

The gear dialog offers three original Web Audio moods: **Drift** for meditative tones, **Gentle** for soft play, and **Playful** for a little arcade bounce. The default is Gentle at 35% volume. Each world supplies its own musical palette. Sound starts only after an explicit trusted user gesture; opening the page does not autoplay. The music-note button mutes immediately. Mute, mood and volume preferences may persist locally; these settings do not store battle progress or contact a model. Browsers without Web Audio show sound as unavailable.

Hidden pages suspend audio; returning requires another user gesture to resume it. Restarting or travelling resets the old turn sounds and switches the ambient palette if audio is already active. Unmounting stops tones, timers and vibration and closes the audio context.

Visual effects are separately selectable as Gentle, Playful or Still, with reduced-motion preferences respected. **Haptic taps** are optional, off on each mount, and require an explicit opt-in plus browser and device vibration support. Unsupported or rejected vibration is reported as unavailable. A UI setting does not prove that physical vibration occurred. Sound, visual effects and haptics do not alter combat rules or authorize AI requests.

## Encounters and combos

The engine exports the encounter definitions used by the board and the AI observation:

| Encounter | Rival health | Incoming attacks | Armor |
| --- | --- | --- | --- |
| Garden gang | 18 | 3, 4, 5, 6 | None |
| Snack attack | 18 | 6, 2, 6, 3 | None |
| Shell club | 20 | 3, 4, 5, 6 | 2 on turns 1 and 2 |
| Moon crew | 22 | 2, 5, 2, 7 | None |

These encounters enable three combos: Ember + Echo adds 2 damage after Focus; Root + Ward adds 2 healing; Focus + Mend adds 2 healing to Mend's usual 3. Healing remains capped at 14. Armor reduces combined outgoing damage once per turn after combo bonuses, with a minimum of zero damage. The legacy `classic` engine encounter keeps its original 18 health, 4/6/5/7 attacks, and no combos.

The session win count records only battles won in this tab; it is neither stored nor submitted as a leaderboard score. Starting a different battle first attempts cancellation of any uncertain AI request owned by the page. Unconfirmed cancellation remains visible in native mode; it is not reported as a stopped provider task.

## Integration

`co-games-engine.mjs` owns damage, block, healing, inventory, terminal conditions, and legal support validation. `co-games-runtime.ts` sends a bounded game observation through the existing `/api/me/ai-runtimes` owner API. It requires a successful exact job, reported `actualModels`, and a valid structured reply. The game computes effects from its own definitions; returned stats or unrecognized fields cannot change the rules.

Every response must echo the per-run `gameId`, zero-based `revision`, and `selectedHuman`, and name a remaining legal `support`. Validate against the current observation before resolving a native turn. Replays get a new game ID. Changing the selected spell invalidates a pending request identity. The last native explanation and actual model stay visible after a resolved turn until the next request, replay, provider change, or sign-in change. Late replies after auth changes or page unmount cannot restore the move.

An uncertain transport retry reuses the same request ID and body. Confirmed terminal failures allow an explicit fresh request. Cancellation is limited to this page's submitted job. Acknowledgement means cancellation was requested, not proof that inference stopped; an unconfirmed request is reported as such. A failed native move never silently becomes a practice move.

## HUD controls and turn events

Choose one of the three spells, then use **Play turn** in practice or **Play with AI** for the paired runtime. The optional **Help me choose** button selects the best legal human spell using the same deterministic engine search as the practice partner; it does not request inference or change the rules. Buttons are disabled during a native request. Native failure or cancellation leaves the round untouched.

The page may expose `[data-current-threat]`, `[data-partner-choice]`, `[data-quick-tip]`, and `[data-outcome]` for compact HUD text. Encounter hooks are `[data-encounter-name]`, `[data-encounter-tip]`, `[data-battle-intent]`, `[data-current-armor]`, `[data-enemy-max]`, and `[data-combo-preview]`; session counters are `[data-wins]` and `[data-match-number]`. Numeric `[data-threat]` spans use zero-based turn indexes and update to the encounter's attacks. `[data-new-battle]` starts the next different encounter and is disabled while a native request runs. Delegated `[data-visit-encounter]` buttons accept only keys from `coGameWorlds` and reject travel while busy. `[data-hint]` is the optional recommendation button. These optional hooks are safe to omit. The existing detailed controls remain available to the page layout.

Every successfully resolved turn dispatches a bubbling `co-games:turn` event from the game root with a frozen, plain-data detail: `{human, support, damage, taken, healing, hp, enemy, round, status, model, reason, combo, armor}`. Human/support values are engine card IDs; `round` is the one-based round just resolved; `model` is the actual model names joined as text, or `null` for practice. `combo` is `{name, description}` or `null`; `armor` is the damage actually absorbed on this turn. This event supports animation only; the deterministic engine remains authoritative. Event detail contains no request IDs, credentials, or profile data. Render `reason` as text, never HTML.

Each restart dispatches a bubbling `co-games:match` event with frozen detail `{encounter, matchNumber, retry}`. This lets presentation/audio refresh the cast and reset turn tracking. No initial event is emitted; the presentation initializes its first cast itself.

## Verification

Run `node --test tests/co-games-*.test.mjs` for rules, transport, world travel, sound lifecycle and UI coverage. Browser verification should inspect each world and its mobile crop, visit a chapter without inference, test sound mood/mute/volume after a real gesture, hide and return to the tab, and check haptics only on supported physical hardware. Then build the site, run the agent-surface audit, and verify `/co-games`, `/co-games.json`, homepage and Spellframe links on the canonical release. Provider participation requires a separate live game response with actual model evidence; mocked transport is not that proof.
