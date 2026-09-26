# Ten keyboard apps: architecture brief (2026-09-26)

Architect: Claude (Opus). Builders: ten Sonnet agents, one app each.
Mike's ask: "build 10 new applications with sonnet, architect".

Each app is a small, finished, delightful instrument. It sits on the keyboard
platform shipped in #1232/#1233 and is not a demo of it.

## The platform (read these files before writing a line)

| Piece | File | Use it for |
|---|---|---|
| Signal embed | `public/keyboard.js` | `PointCastKeyboard.note(midi\|midi[], tag?, {sound:false})`, `.keys(n)`, `.play(text)`, `.tone(midi)`, `.textToNotes(text)`, `.flush()`, event `pointcast:keyboard` |
| Voice + moods | `public/js/keyboard-voice.js` | `KeyVoice.moods`, `KeyVoice.noteFor(char, moodId, prev)`, `KeyVoice.play(midi, moodId, when?, gain?)`, `KeyVoice.ctx()` |
| Online seats | `public/js/keyboard-table.js` | Only if your app is multiplayer. See how `src/pages/keyboard-rush.astro` wires it. |
| Signal API | `functions/api/keyboard/signal.ts` | `GET /api/keyboard/signal` (summary, `key.today`), `GET ?since=<id>` (live phrases, oldest first), `POST` |
| Weather | `functions/api/weather.ts` | `GET /api/weather?lat=33.92&lng=-118.42&label=El%20Segundo` |
| House style | `src/pages/keyboard/diary.astro`, `src/pages/keyboard-signal.astro` | Copy the page skeleton, tokens and nav from these two |

## Page contract (every app)

1. **One file:** `src/pages/keyboard/<slug>.astro`. If the script is big, add at most one
   helper, `public/js/keyboard-<slug>.js`. **Touch no other file.** No git commands, no
   `npm install`, no builds. The architect integrates.
2. **Standalone HTML page**, like the keyboard family: `<!doctype html>`, not BlockLayout.
   Frontmatter sets `title` and `description`. The head carries canonical
   `https://pointcast.xyz/keyboard/<slug>`, og:title and og:description. PointCast's
   middleware adds the unfurl image.
3. **Tokens:** `--bg:#101813 --panel:#142019 --line:#2b3c2e --ink:#ede9d7 --dim:#97ab91 --gold:#dfc48d`.
   Georgia for display and body text, ui-monospace for UI chrome, 30px pill buttons, and the
   `✳` brand mark. Dark by default (`color-scheme:dark`).
4. **Header** has the brand (`<h1 class="brand">Name<small>one-line tagline</small></h1>`)
   and this nav, exactly, with your own link marked `aria-current="page"`:
   ```html
   <nav aria-label="Keyboard family">
     <a href="/keyboard">Notes</a>
     <a href="/keyboard/shelf">Shelf</a>
     <a href="/keyboard/diary">Key Diary</a>
     <a href="/keyboard/play">Instrument</a>
     <a href="/keyboard-signal">Signal</a>
   </nav>
   ```
5. **Scripts:** `<script is:inline>` only, plus `is:inline src=` for platform files. Every
   script must pass `node --check` once extracted. **Astro gotcha:** `{` and `}` in template
   text are expressions. Put code samples and braces in frontmatter strings. Scripts marked
   `is:inline` are raw and safe.
6. **Audio** starts only after a user gesture (click, tap or key), and there is a visible
   sound on/off toggle. Use `KeyVoice.play` or your own small WebAudio voice. Keep the master
   gain modest and add a compressor.
7. **Signal etiquette:** load `<script is:inline src="/keyboard.js" data-app="keyboard-<slug>" async>`.
   - Pure music (no words): send ordered notes, `PointCastKeyboard.note(n, null, {sound:false})`.
   - Anything derived from words the user typed: send only a **sorted** bag of pitches, or a
     `keys(n)` count. The letter→note mapping is deterministic, so ordered notes leak text.
     Never send text.
8. **Privacy and storage:** anything saved lives in `localStorage` under the `pc-<slug>-v1` key.
   Wrap every access in try/catch. Shared content goes in the URL fragment (`#…`, base64url
   JSON), as `/keyboard/letter` does. Never in a query string, never on a server.
9. **Works everywhere:** phone at 375px (no horizontal scroll, touch targets ≥44px), and both
   keyboard and touch input. Respect `prefers-reduced-motion`. `aria-label` on icon buttons.
   Ignore key events with meta/ctrl/alt and when focus is in an input (unless the input is
   the instrument).
10. **Copy voice:** plain, warm, short. No marketing words, no emoji walls. Say what the thing
    does in one sentence near the top.
11. **Quality bar:** it should feel finished. Include a first-run hint, an empty state, and a
    satisfying moment (a bloom, a chord, a flourish). No TODOs, no placeholder lorem.

## The ten

| # | Slug | Name | One line |
|---|---|---|---|
| 1 | `clock` | Key Clock | An ambient clock that chimes the time as a melody (hours low, minutes high), tuned to the town's key of the day. |
| 2 | `radio` | Town Radio | Lean-back station: live phrases from `/api/keyboard/signal?since=` played over a soft generated bed in today's key. Replays recent phrases when the town is quiet. |
| 3 | `typist` | Melody Typist | Typing practice where each correct word completes a musical phrase. WPM, accuracy, a daily public-domain passage. |
| 4 | `name` | Name Song | Type a name, hear its song, get a keepsake melody card (SVG), and share it by `#` link. |
| 5 | `loops` | Loop Porch | A 4-track keyboard looper on the home row: record, quantize, layer, mute, share by `#` link. |
| 6 | `ear` | Ear Trail | Ear training: hear a phrase, play it back. Levels grow from 2 notes to intervals to phrases, with a daily streak. |
| 7 | `weather` | Weather Keys | Sonifies El Segundo's live weather. Wind sets tempo, temperature sets register, clouds set mode, rain sets texture. |
| 8 | `morse` | Morse Melody | Type a message and it goes out as tuneful Morse. There's a learn mode and a decode game. |
| 9 | `kids` | Baby Keys | Toddler-safe smash pad: any key or tap makes a tuneful note and a big friendly shape. Grown-up lock to exit. |
| 10 | `poems` | Poem Organ | Public-domain poems played line by line as melodies, karaoke-highlighted, plus a haiku writer that rings on 5-7-5. |

## Integration (architect)
The architect runs one full build and `node --check`s every inline script. Each page is checked in a
browser at desktop and 375px. Then comes a `/keyboard/shelf` hub linking all apps, the nav link from
`/keyboard-signal`, one PR, and a deploy.
