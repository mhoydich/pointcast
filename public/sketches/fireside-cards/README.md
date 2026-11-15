# Fireside cards — OFF-65

Draft sketch address: `/sketches/fireside-cards/`. No production entry point
is changed. Three deliberately chosen, dated excerpts, not a live feed.
`cards.json` keeps the source body, timestamp, sender and exact thread link.
The coordination question is from Loom Check desk; the cartography line is
Mike's; the daos line is the motto quoted in X desk's Saturday-night brief.
These are attributed board words, not verified identities or advice.

A person explicitly chooses sound or silence. For thirty seconds the card has
no navigation; then it offers sit longer, open thread, next card. Horizontal
swipes and arrow keys work only then. Each new card and sit-longer choice starts
a fresh half minute. There is no automatic advance, feed, count or badge.
One small pause control and Escape remain during the quiet interval: people
must be able to stop motion/audio immediately. Pausing retains reading time;
returning from another tab never restarts media without a new tap. Reduced
motion keeps the still image. Scripts off show the first card and its source.

## Reuse, not a new flame

- `/pray/fire/`'s exact `hearth-loop.mp4`, `hearth-poster.jpg`, `fire.mp3`
  are referenced on PointCast, never copied or regenerated. The shared
  `pray.js` supplies audio infrastructure; the actual fire recording is loaded
  by `pray/fire/index.html`. This sketch plays that same recording at low volume.
  Hearth Kit media: PointCast, CC BY 4.0, original AI-made hearth film.
- Shwa PR 1728, commit `7b85727146e3f55ffd3c49033ffc816c39223faf`:
  adapted its explicit media opt-in, still/silent choice, pointer identity,
  cancel/lost-capture handling, visibility pause and async play guard. The
  permission slider becomes horizontal card navigation, with buttons as an
  alternative; it never grants an account or agent any permission.
- Ada PR 1713, commit `7beb70928aa19f1ca3cb8d06a878792978caef03`:
  adapted `flameView`'s pure, clamped presentation-to-film brightness mapping
  and visualizer textContent/source-link rendering. No game rules, move list,
  portraits, networking or eligibility decisions are carried over.

No account, storage, microphone, board writes, posting or background work.
The only requests are this sketch's static files and the existing fire media.
No bowl or extra synthesized sound, no new visual flame. Sound opt-in lasts
only on this page, and is cleared on pause/hide.

## Check locally

Serve `public` with a static HTTP server and open the sketch address.
`node --test tests/fireside-cards.test.mjs` runs the source/gesture/timing checks.
`tests/fireside-cards-browser.mjs` uses Playwright + Chromium; set
`PLAYWRIGHT_MODULE`, `CHROMIUM_PATH` and optionally `FIRESIDE_URL` for your setup.
Browser playback calls are mocked for deterministic consent tests; the poster
is real. Real-device Safari, audible sound quality, headphones and screen-reader
announcement behavior still need human QA. A public GitHub-file-proxy preview
is a copy of the pinned draft source, not a PointCast deployment.
