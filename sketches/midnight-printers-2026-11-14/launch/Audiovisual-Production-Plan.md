# Midnight Printers: audiovisual production plan

*Planning date: November 14, 2026, Eastern Time. Updated after the first motion-poster export and Story 02 publication. Completed work and proposed work are labeled separately.*

## The direction

Build a small world people recognize and want to revisit: the same horse, the same garden, the same imperfect makers, and one good thing happening each time. Character, sound, motion, and the reader’s choices should serve that feeling. “Walt Disney 2027” describes the ambition to make an enduring audiovisual world; the project has its own name, characters, artwork, and voice, with no Disney branding or affiliation.

The first audience goal is **ten people who choose to return for another story**. That is a proposed goal, not a current audience count. Make the work recognizable enough that someone can say “the horse who waits,” even before they remember its title.

## What already exists

| Asset | Verified state | How to use it next |
|---|---|---|
| *The Horse Who Waited for the Last Light* | Finished original story, published in three linked Loom parts; separate text file | Canon for the first episode and source of short excerpts |
| *After Closing* | Finished poem, published beneath the story | A quiet second entry point into the same world |
| *Thirty-Seven Flowers, Forty Guests* — Story 02 | Published on Loom and read back by the root desk; [opening post](https://pointcast.xyz/loom?to=loom%3Af1b98d7c8699b0c5a3d631bb%23m_4t2z470552) | Continue the story and invite names for the apprentice |
| Garden painting | Finished full-resolution PNG; public archive readback matched the local bytes | First poster, motion reference, and reading-room illustration |
| *The Last Light — Garden Music No. 1* | Finished 45.024-second stereo MP3, 48 kHz; public archive readback matched | Soundtrack for the reading room and a short cue for the first film |
| Offline reading room | Complete single HTML file with art, audio, full story, poem, and story seeds | The first immersive prototype; music starts with a tap |
| *A Name for the Apprentice* | Finished ten-second motion poster, 1280 × 720, 30 fps, H.264/AAC; technical decode and two extracted keyframes checked; audio not auditioned and in-app playback not checked | Root keyframe review complete; listening/playback check remains; not published by this production task |
| Cast | Fourteen garden personas with cards and first contributions; Hem is the established poet alongside them; Barley is the fictional horse | A pool of creative roles, not fourteen confirmed independent workers |

The HTML passed static checks for JavaScript syntax, complete embedded assets, unique element IDs, and absence of external asset dependencies. **Live browser layout and playback interaction remain unverified:** local Chromium could not start in this environment. Test those before treating the reading room as a release candidate for public hosting.

The first garden continuation had eleven posts verified by fresh readback. Story 02 is now also published and read back. The current coordination thread is [UFOGP launch coordination](https://pointcast.xyz/loom?to=loom%3Ac73ad0514de26f51c924cbc8%23m_5w1i291403); another desk’s acceptance must still be evidenced by its own reply. The first motion poster is exported and locally checked, but it is not character animation. No narration, interactive branching scene, background studio process, or measured fan response is claimed here. Consult the main launch plan for current account-access and social-publication status.

## Three repeatable formats

### 1. One Small Moment — an 8–12 second story film

Each film contains **one observable action and one emotional turn**. A lantern is left on. Barley notices. Someone realizes they are not alone. Keep the same silhouettes, proportions, clothing, palette, and physical geography across episodes.

**First pilot: “A Name for the Apprentice.” Exactly 10 seconds — exported.**

The pilot is now an exported **motion poster made from the existing still painting and existing finished music**. It uses a restrained camera move and captions; no character animation is claimed. No new image, voice, video-model generation, paid media, or spending was required. Its purpose is to invite a real contribution to the continuing garden stories: **name the apprentice**. Story 02 is already published; a real naming response can enter a later installment.

**Actual master:** 1280 × 720, 16:9, 30 frames per second, exactly 300 frames and 10.000 seconds. The complete painting scales gently inside a cream frame; a separate caption band below keeps the horse, printshop, and makers unobscured. The source PNG is unchanged. Text was rendered from separate caption files. There is no dialogue, synthetic footstep, new sound effect, or lip movement.

| Time / frames | Picture and edit | Exact visible words | Sound |
|---|---|---|---|
| 0.00–2.00 / 000–059 | Hold the whole painting. Let the viewer find Barley, the warm window, and Crumb’s loaf. The title and a small “A Pleasant Garden Story” line appear in the separate lower paper band. | **Midnight Printers** | Start the existing MP3 at 00:00.000. The export applies a 0.25-second fade-in and keeps the excerpt continuous throughout. |
| 2.00–5.00 / 060–149 | Ease the camera scale from 100% to 102.5%, centered on the scene. Keep both the horse and the printshop window visible. Use the separate cream caption band with dark type; this is a camera move on a still, not animated character performance. | **Thirty-seven flower cards.**<br>**One tired apprentice.** | Continue source 00:02.000–00:05.000 without a cut. The actual mix is 6 dB below the original. A phone-volume listening check remains open. |
| 5.00–8.50 / 150–254 | Hold the 102.5% framing. Replace the two caption lines with the invitation. Do not add more visual motion. | **The apprentice needs a name.**<br>**What would you call them?** | Continue source 00:05.000–00:08.500, same level. |
| 8.50–10.00 / 255–299 | Keep the invitation visible. Add a small footer below it; end on the garden rather than a blank screen. | Keep the invitation above.<br>Footer: **Read the story · Join the garden** | Continue source 00:08.500–00:10.000. Fade out from 00:09.150 to 00:10.000 to avoid an abrupt cutoff. |

Use the post’s actual link field or text for the [new story](https://pointcast.xyz/loom?to=loom%3Af1b98d7c8699b0c5a3d631bb%23m_4t2z470552); a word printed inside the video is not a clickable control. A proposed caption is: **“Barley waited. Crumb brought bread. The little printer upstairs made thirty-seven flower cards—and still needs a name. What would you call the apprentice? The new story is in Pleasant Garden.”** Attach the verified story link.

**Audio check:** the actual export uses source 00:00.000–00:10.000, gain −6 dB, a 0.25-second fade-in, and a fade-out from 9.15 to 10.00 seconds. The AAC track is stereo, 48 kHz, and 10.000 seconds. Technical decoding completed without errors; volume analysis reported mean −28.5 dBFS and peak −7.8 dBFS. **It has not been auditioned.** Hear the beginning and ending at phone volume before social release. If this passage is musically weak, select a different contiguous ten-second passage from the same file and record the new timecodes rather than generating replacement music. The invitation is understandable without sound. The owned reading room continues to enter with audio off; social-client autoplay and mute behavior are controlled by those clients, not by this export.

**Completed local deliverables:** `Midnight-Printers-A-Name-for-the-Apprentice.mp4` (2,487,176 bytes), `Midnight-Printers-Pilot-Metadata.json`, `Midnight-Printers-Pilot-Caption.txt`, and two extracted stills at 3.6 and 8.8 seconds. Both stills were visually inspected: captions are complete, the full illustration remains visible, and no main character is obscured. The video and audio streams decode without errors. No separate silent MP4 was made; the captioned stills accompany the silent-readable video. **Remaining:** actual phone/in-app playback, listening, and a publication receipt. This production task has not uploaded or published the video.

For a taller treatment, place the entire illustration in a designed paper frame with the captions below rather than cropping away the horse or printshop. Exact platform upload requirements still need verification by the publishing desk.

**Later character-animation experiment:** ear movement, a settling paper card, or a changing lantern can become a genuine performed moment after a tool and budget are verified. Controlled image-to-video, consistency, and export quality remain unproven here. Do not label the first camera-move pilot as character animation.

### 2. The Garden Listens — a scene the reader can gently change

Extend the current reading room with **two clear, authored choices**, not an open-ended chat box:

- **“Stay at the gate”** reveals a short passage from Barley’s point of view.
- **“Follow the warm bread”** reveals a short passage with Crumb and the walk home.

Both paths return to the same story. Each should be satisfying in under a minute, with a visible “Back to the garden” control. A visitor can read everything silently. Music starts only after a deliberate tap; repeat remains optional.

After those choices work, add a restrained musical response: the lantern’s brightness follows the score’s slowly smoothed energy while music is playing. There is no microphone input. Provide a still mode; reduced-motion preferences remove animation. Avoid flashing, dramatic zooms, moving text, or controls that disappear.

**Minimum version:** two buttons, two short passages, one music control, one return control. The current HTML supplies the base but does not yet implement these branches or music-reactive light.

**Acceptance evidence:** real phone/browser checks; keyboard and screen-reader labels; sound-off entry; actual play, pause, seek, repeat, and ended-state behavior; reduced-motion check; both story paths returning correctly. Record aggregate path counts only after the measurement implementation is disclosed and verified. Until then, report no choice totals.

### 3. A Letter from the Garden — the serialized story

Publish one complete new story regularly enough to build recognition. Keep the finished 800-word first story intact. Aim for roughly **400–700 words** for later installments, with one illustration or reused scene detail, one short excerpt, and one answerable question.

The current story arc and remaining seeds are:

1. **The Loaf with the Map Inside:** Crumb and Barley discover an orchard.
2. **Thirty-Seven Flowers, Forty Guests:** the table has to make room. This is now Story 02, [published and read back](https://pointcast.xyz/loom?to=loom%3Af1b98d7c8699b0c5a3d631bb%23m_4t2z470552). The orchard and paper-moon stories remain proposed.
3. **Barley and the Paper Moon:** an unfamiliar object requires time and patience.

A question should invite something a reader already carries: “What object would your village never throw away?” is more useful than “Thoughts?” A later episode may answer a real contribution, with the source acknowledged. Do not fabricate audience suggestions or portray AI replies as independent fans.

An optional 60–90 second narrated excerpt is a later production step. Voice selection, pronunciation, generation capability, and delivery remain to be verified. Establish an original narrator rather than mimicking a celebrity or using an unconsented real-person voice.

## The smallest pilot worth releasing

**One scene, one story, one score, one destination, one question.** The existing painting plus a 40–80-word excerpt can ship through a verified social account before new animation is ready. The first motion film then becomes a second doorway into the same episode. This keeps the initial audience test about the characters and story rather than production volume.

Use the same central question on the first two platforms so replies are comparable: **“What should we call the apprentice?”** Story one already explains why Barley waits; the new invitation gives readers a real opening into a later story now that Story 02 is published. Keep a shortlist of actual suggestions, select a name editorially, and acknowledge its source when it is used. Do not claim a public vote or a winning suggestion unless one actually happened. Keep platform-specific packaging short and readable. Exact X/Twitter and Tumblr posting capabilities, account identities, media handling, and public URLs belong to the root launch check; this plan assumes none of them are already connected.

## Production pipeline and Loom ownership

All owners below are **proposed** until they claim the work. A persona’s creative role is not evidence that a separately running agent has taken the task.

| Stage | Proposed responsibility | Required handoff |
|---|---|---|
| 1. Freeze the episode | Arden coordinates with UFOGP; Hem and Bridle prepare words | One brief in #pleasant-garden, canonical text, target feeling, exact output, owner, next check |
| 2. Preserve the world | Bridle: horse behavior and continuity. Crumb: bread and everyday warmth. Aster, Cirrus, Wick: flowers, palette, light | Small reference sheet; specify what may move and what must remain fixed |
| 3. Make the sound and motion | Peal proposes a motif; production operator exports the cue and film | Actual files, tool/model used, duration, source assets, credits, and any limitations |
| 4. Check the experience | A separate available UFOGP reader; Mend handles repair requests | Phone/silent/readability check and concrete findings; no “done” without the artifact |
| 5. Publish and verify | Root or a verified social desk using Mike’s existing authorization | Public post URLs and readback; respond to genuine replies in the same voice |
| 6. Learn and archive | Pollen indexes; Morrow reports observed responses; Arden chooses the next iteration | One receipt with what shipped, what people actually said, and one change to test |

Use Selvedge for recurring material patterns, Wren for small background observations, Tidelace for coastal detail, Kettle for hospitality, and Vesper for an optional evening blessing. These can enrich an episode without giving every persona a compulsory post. **A few connected contributions are the desired output.**

Every Loom task should carry its state: **proposed → claimed → artifact ready → checked → published → observed**. A public invitation remains proposed until a real reply claims it. Keep one episode thread and one UFOGP coordination pointer; link assets rather than scattering copies and status posts across rooms. Read back published messages and preserve the receipts, because accepted writes have previously disappeared from the board.

Official Nouns, if included in a future episode, must be assembled deterministically from named official trait assets with their source recorded. Generated scenery may surround them. The current brass garden characters are original generated illustrations, not claimed official Nouns trait assemblies.

## The next seven days

*Proposed dates: November 15–21, 2026, Eastern Time. These are work targets, not scheduled automations.*

| Day | Deliverable | Evidence to keep |
|---|---|---|
| Sun 15 | Confirm account access and the central destination; publish the finished still/story opening where access is verified | Public URLs, exact text, media readback; record any blocked platform |
| Mon 16 | Review the already-exported ten-second motion poster; finish its phone playback and listening checks | Existing export, keyframe and metadata checks, plus the still-needed listener/viewer check |
| Tue 17 | Release the pilot; answer actual replies and invite one specific story contribution | Reply links and what each person responded to |
| Wed 18 | Prototype the two reading-room paths if time allows; first finish the existing room’s browser and audio checks | Working file and checked paths; no invented visitor counts |
| Thu 19 | Draft the next unpublished chapter after Story 02; use a real apprentice-name suggestion if a suitable one has arrived | Source reply plus the resulting editorial choice; otherwise use the existing orchard seed |
| Fri 20 | Publish one quiet companion piece: the poem or a short chapter excerpt | A second entry point with the same recognizable world |
| Sat 21 | Publish a compact Loom report and choose the next production experiment | Releases, substantive replies, confirmed returns, open defects, one next decision |

This is a proposed sequence of three core public releases over the week, supported by conversation. It is not an assertion that publishing access is connected or that scheduled/background workers are running. If an account or export is blocked, keep the finished work on Loom, record the blocker, and move only the dependent release date. Do not fill every day or every platform with repetitive announcements.

## Expansion through day 30

**Week 2:** finish the next chapter and improve the format that produced the clearest response. Fix any barrier to opening, reading, or hearing the work before adding new effects.

**Week 3:** invite one small collaboration with a reader or another maker: a remembered object, a short musical answer, a flower, or a line for the table. Keep its source and credit distinct from the production team’s own work.

**Week 4:** assemble a small second issue with the strongest stories, art, and sound. Give readers a recognizable place to return. Add another recurring character only when a story needs one; the existing cast is already large enough.

By day 30, aim to know which character people recall, which format they finish or reply to, whether anyone returns, and whether production can maintain its quality at a modest cadence. A larger volume of outputs is not the result being sought.

## A grounded path into 2027

These are conditional editorial and production milestones, not forecasts or standing instructions to run unattended. Dates provide review windows; evidence decides whether to expand. The example numerical thresholds below are proposed decision rules, not current measurements or promised growth.

| Review window | What to develop | Evidence gate before expansion |
|---|---|---|
| Now–December 2026 | Publish the existing first story and the ten-second pilot through verified channels; establish a consistent character sheet and one canonical archive | Three releases have checked artifacts and public receipts. Identify at least two accounts that returned meaningfully to another release, or revise the opening/distribution before increasing output. |
| January–March 2027 | Make a small run of connected episodes with the same characters, musical identity, and recognizable ending invitation | The team can complete three consecutive episodes with intact character continuity, usable silent captions, correct audio behavior, and source records. Review actual production time and cost before raising cadence. |
| April–June 2027 | Test one genuinely responsive scene—the two reader paths and optional musical light—while continuing the linear stories | At least a few readers have expressed interest in participating; the two-path prototype passes real phone, keyboard, playback, and reduced-motion checks. Add analytics only when its events and limits are verified. If the choice adds friction, keep the linear form. |
| July–September 2027 | Invite a small number of outside contributions into the world: a name, an object, a musical answer, or an illustrated detail | At least two invited contributions have actually arrived, been credited, and improved a finished episode. Establish a manageable editorial handoff before opening a larger submission program. |
| October–December 2027 | Release a coherent first collection: stories, art, music, and an accessible reading/listening home | There are at least six finished, checked chapters worth collecting, a functioning archive, and evidence of returning readers. Expand the cast or production budget only when those readers and the delivery record justify it. |

Across every stage, preserve an original identity: Barley’s patient attention, Hem’s crooked hat, Crumb’s bread, the coastal garden, imperfect useful objects, and a small recurring musical phrase. Readers should recognize this world without reference to another studio. A new model, effect, or platform earns a place only when it improves a specific moment or makes the work easier to enjoy.

No live narrative engine, autonomous studio, persistent background worker, licensed character franchise, or guaranteed 2027 audience is being claimed. The current achievement is a finished first creative unit and a concrete path for testing what should come next.

## What to measure

| Signal | Definition | Limits |
|---|---|---|
| Substantive replies | Replies mentioning a character, event, feeling, personal association, or specific suggestion | Report examples with source links. Separate human readers, known AI personas, and unknown accounts; do not infer identity |
| Confirmed returning accounts | The same observable public account engages meaningfully with two different releases, at least a day apart | Count accounts, not proven unique people. Do not silently deduplicate identities across platforms |
| Reader contribution adopted | A real suggestion or contribution changes a later piece | Record the source and the actual resulting change |
| Shares/reblogs and saves | Values actually exposed by the platform or visibly confirmed | Keep each platform separate; unavailable data is “not measured,” not zero |
| Reading/listening behavior | Completed play or branch events from verified first-party instrumentation, or explicit reader reports | Instrumentation is not implemented yet. A page open alone does not prove a read |
| Production reliability | A release has an artifact, a check, a public receipt, and a source trail | Missing evidence remains open even if the team reports success |

After three releases, inspect the replies rather than declaring a winner from tiny counts. If people mention Barley, develop the horse relationship. If the imperfect flower cards matter, make the next story about shared craft. If nobody responds, improve the opening and the invitation, and try a more relevant conversation; do not manufacture fans, purchase engagement, or accelerate to a bot-content flood.

## Evidence and source trail

- [Pleasant Garden](https://pointcast.xyz/loom?to=%23pleasant-garden): cast, contributions, and the continuation.
- [First story and replies](https://pointcast.xyz/loom?to=loom%3Af1b98d7c8699b0c5a3d631bb%23m_3m384i093i): published narrative, poem, and art/audio pointer.
- [Current UFOGP launch coordination](https://pointcast.xyz/loom?to=loom%3Ac73ad0514de26f51c924cbc8%23m_5w1i291403): canonical active coordination thread.
- [Story 02](https://pointcast.xyz/loom?to=loom%3Af1b98d7c8699b0c5a3d631bb%23m_4t2z470552): published and read back by the root desk.
- [UFOGP Garden Round 01](https://pointcast.xyz/loom?to=loom%3Ac73ad0514de26f51c924cbc8%23m_1f6h3n084x): earlier garden invitation, retained as history.
- [Public asset archive, draft PR 1729](https://github.com/mhoydich/pointcast/pull/1729): source assets; a draft PR is distinct from a deployed website.
- Local verification records: `final_publication_verification.json`, `asset_hosting_verification.json`, and `reading-room-check.json` alongside the existing deliverables.

This production task created the motion poster through local composition of existing assets. It performed no new model generation, automation, social publication, upload, or spending.
