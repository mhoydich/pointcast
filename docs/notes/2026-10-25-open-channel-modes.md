# Open Channel — three modes

User direction: build the Dessa-inspired experience on PointCast, then choose “all three” directions. Edition 2 adds Pitch Room and Story Booth alongside the existing Characters experience.

## Routes and content

- `/open-channel/`: three authored character stories, two choices per beat, twelve endings, optional browser narration and numbered voice commands. Transcript and note download remain available.
- `/open-channel/pitch-room/`: three exercises — introduce an offer, present a creative proposal, and prepare a difficult conversation. Each has five authored prompts, an editable answer per prompt, a speaking card, a 60-second rehearsal timer, and a self-review checklist.
- `/open-channel/story-booth/`: three exercises — a short story, a remembered moment, and a world to explore. Each has six authored prompts, an editable answer per prompt, a story outline, a 120-second rehearsal timer, and a self-review checklist.
- `/open-channel.json`: edition 2 metadata includes the three routes, exercise counts, controls, provider boundary, and mode-specific storage behavior. The app shelf, agent surfaces, `llms.txt`, and Block 0766 link to the expanded experience.

The shared content module is `public/open-channel/workshops.mjs`. `WORKSHOPS` defines the exercises; `getProgress` counts nonblank answers; `buildOutline` assembles those answers beneath prompt headings. Blank sections are marked `[Not answered]`. Output preserves the user's wording rather than adding examples or filling gaps. Display this output as text, not HTML. Download is Markdown.

## Speech and storage

Character dialogue and worksheet prompts can use browser speech synthesis. Character microphone input selects one or two; worksheet dictation inserts editable text into the current answer. Microphone use is optional and begins on an explicit click. Browser speech recognition may send audio to the browser provider's speech service. PointCast does not record audio. Voices, recognition support, permission prompts, and network requirements vary by browser and device.

Character sessions and notes remain in page memory and are lost on reload. Worksheet drafts use `sessionStorage`, scoped to the browser tab, so reloads retain answers. Browser session restoration may retain this data. Clearing an exercise removes its draft; downloading creates a separate file. If browser storage is unavailable, drafts fall back to page memory. No account or PointCast server storage is involved in these worksheets.

Rehearsal timers do not record sound. Checklists are prompts for the person's own review. Progress measures answered prompts, not pitch quality, writing quality, confidence, emotion, or speaking performance.

## Dessa boundary

This is an independent authored prototype inspired by Block's Dessa research preview. It does not connect to Dessa or any model, generate conversational replies or story content, evaluate delivery, recognize emotion, or provide full-duplex conversation. The first-edition note records the source check on 2026-10-25: no public developer API or model download was verified. Any future integration requires actual access, documentation, supported capabilities, and license review; the browser speech features are not a Dessa adapter.

## Verification and release

The five content-module tests pass with `node --test tests/open-channel-workshops.test.mjs`. They cover the scenario shapes, progress counting, unanswered sections, preservation of user text, and complete speaking-card output. They do not verify browser speech quality or physical-device microphone behavior.

Browser/controller checks, `npm run build:bare`, independent review, merge, and deployment verification belong to the release pass. This note does not assert that edition 2 is already deployed. Use `scripts/deploy.sh` after merge and verify the canonical pages plus `/open-channel.json` before reporting the release live.
