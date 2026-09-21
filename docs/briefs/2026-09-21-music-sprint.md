# Sprint: music as the town's connective tissue

Date: 2026-09-21 · Two weeks · Thread-holder: cc (Fable 5.1) · Director: Mike
Companion to `2026-09-21-station-task-board.md` (the running task list) and, when it lands,
`2026-09-21-music-services-map.md` (Opus's research on every service, including generation).

## Why this sprint
In two days the town grew a music layer: a front-door shelf, a listening wall, a station with a
log, sourced liner notes, a request line people and agents share, Rewind, a ten-listener
prototype. Then Spotify's own docs drew the line: an unreviewed app seats **five** accounts and
review is closed to individuals. So the sprint's thesis:

> **The town should know what people are playing without depending on any one company, and
> should turn that into things to do together.** Spotify becomes one adapter among several.

## How it serves the priorities already on the table
| Standing priority | What music does for it |
|---|---|
| **Drum first** (the one room strangers use: 26k hits) | Tempo is the bridge. The wall hears a tempo, the room shares one, the pads lock to it. Music on is the reason to hit a drum. |
| **Communication first / Shortwave / attendance** | "What I have on" is the easiest thing to say in a room. Presence carries it; overlap between two people is the best conversation starter the town has. |
| **Agents as first-class visitors** | The request line is the first job with consequences: read the station, recommend, get played. Standing follows from a public record. |
| **Profile / accounts rethink** | A music identity (a ListenBrainz name, a station) is a concrete reason for the account↔profile link that has been missing. |
| **Magazine direction** | The station writes a column by itself: what was played, sourced notes, the week's numbers. SPN gets a weekly piece that is counted, not generated. |
| **From utility to memorialising (mint direction)** | The room's tape, a played request, a year of listening: all are records worth signing. Receipts before tokens. |
| **25-mile radius / collectives** | A station can belong to a household, a team, a shop, a block. Shared stations are the collective form of this. |
| **Register, not arcade** | Every number counted, every note sourced, every simulation labelled. |

## Tracks

### Track A — Source independence (week 1) · mostly Fable + Sonnet
1. **ListenBrainz backbone** (this PR): broadcaster sets a username; the log reads every play, real
   counts, no key, no cap. Visitors show their playing via their own username, browser → ListenBrainz
   direct. `/me` says plainly that Spotify seats five.
2. **Any music link** (Sonnet, in flight): request line and shelf accept Apple Music, YouTube,
   SoundCloud, Bandcamp, Tidal, Deezer.
3. **Last.fm adapter** (Sonnet): same interface as `_listenbrainz.ts`; needs one API key from Mike.
4. **Open identity** (Opus decides, Sonnet builds): MBID/ISRC as the town's track identity so a request
   from any service can flip to "played" by a play from any other.
5. **History import** (done, untested on real data): run it when Mike's export arrives; then year pages.
6. Retire the scheduled-ping idea: ListenBrainz makes it unnecessary.

### Track B — The room (week 1–2) · Opus designs, Sonnet builds, Fable integrates
1. Opus: protocol for the real listening party (what rides presence, overlap detection without
   over-collecting, moment rate limits, do-not-disturb) → Sonnet-sized tasks.
2. Build the first real moment only: **"two people on one artist" → one wave with the artist's name
   on it.** Ship it on the front door faces and the attendance tray before anything else.
3. **Room tempo → drum circle**: three people within a few BPM lights the hero pads and offers a
   shared click. The drum is the payoff.
4. `/station/party` becomes live when ≥2 real listeners are present; the simulation stays as the
   empty state, labelled.

### Track C — The front door and the chrome (week 2) · Opus designs, Fable builds
Mike, 2026-09-21: "consider the home page, after, what's the update, consider the header bar,
footer bar, def rethink those areas, and how we add new modules."
The problem in one line: every new room adds a shelf to a 16-section page and a stamp to an
8-stamp dock, and nothing ever leaves.
1. **A module contract.** One small manifest per room (`id, title, kicker, href, json, channel,
   live-signal?, dock-stamp?, shelf-component?, weight, born, status`) in `src/data/modules/`.
   The front door, the dock, `/rooms`, `agents.json` and the sitemap all read the same list.
   Adding a room = adding one file. Removing one = setting `status: shelved`.
2. **A front door that ranks instead of stacks.** Three bands: *now* (what is live this minute:
   who is here, what is on air, what was just said), *this week* (what is new, max five), *the
   town* (everything else, compact, by channel). Rank *now* by real signals the town already has
   (presence, the scoreboard's pageviews, freshness). Nothing is pinned by seniority.
3. **Header bar:** identity and state, nothing else: where you are, who you are (the YOU chip),
   what is on air, the clock. Navigation moves to the dock.
4. **Footer bar (the dock):** one input, three verbs: *say* (Shortwave), *go* (rooms), *play*
   (pads + what is on). Stamps become module-provided and capped; the rest live behind one tray.
5. Opus delivers: an audit of what the current header/dock actually do (there are known overlaps:
   two presence counters, two now-playing surfaces, FED/BROADCAST stubs), the contract, and a
   migration order that never breaks the ~45 tests that grep `index.astro`.

### Track D — Making music (research now, one small build) · Opus researches
Suno, Udio, Google Lyria, OpenAI, ElevenLabs, Stability, open weights: APIs, ownership, the label
litigation, provenance marks, what may be streamed publicly. The town already synthesises all of
its own audio; generated music has to clear the same bar as everything else here: labelled,
rights-clean, not passed off as a person's work. Candidate first build, if the research supports
it: **a bed for the drum circle at the room's tempo**, clearly marked as generated, so a listening
party has something it is allowed to hear together. Decided only after the map lands.

### Track E — Standing, receipts, the column (week 2, stops at Mike's keys)
- Agent standing from public facts (requests filed / played / first seen).
- A signed receipt when a request is played; Opus picks the form, Mike holds the key.
- The weekly SPN piece assembled from the log: counts + sourced notes, author `cc`, no invented prose about the music.

## Who does what
| | Fable 5.1 (thread) | Opus (judgment) | Sonnet (builds) |
|---|---|---|---|
| Week 1 | ListenBrainz backbone; `/me` honesty; integrate + review + deploy | Services & generation map; party protocol; open identity decision | Any-link request line; Last.fm adapter; phone pass on /station |
| Week 2 | First real moment; tempo → drum circle; module contract migration | Front door + chrome audit and design; receipts; agent standing | Share cards; requests → Shortwave; year pages from the import |
Every Opus/Sonnet task: fresh worktree, one PR, no merge, no deploy, no production writes. Fable
reviews each PR, and asks Opus for an adversarial pass at the end of each week (the first one
found eleven real issues).

## What Mike has to do (nobody else can)
1. Create a ListenBrainz account, link Spotify to it (Settings → Music services), enter the
   username at the bottom of `/station`. Two minutes; the log is complete from then on.
2. Reauthorize Spotify once (`/api/spotify/auth?returnTo=/station`) for Rewind and the saved library.
3. Request the Extended streaming history export from Spotify (days to arrive).
4. Optional: a Last.fm API key; decisions on generation once the map is in.
5. Any signing key, mainnet transaction or paid plan.

## What done looks like
- A stranger with Apple Music and no account can show what they are playing, request a track,
  and find one other person in town who has the same artist on, in under a minute.
- The station's log has every play for a week with no gaps, and none of it depends on Spotify's API.
- Adding a room to the town is one file, and the front door, dock, rooms index and agents manifest
  all pick it up.
- Nothing on any of it is generated and presented as fact.
