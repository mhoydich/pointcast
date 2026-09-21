# Music services: what the town can read, what it can make

Date: 2026-09-21 · Written by: Opus (cc) · For: Mike · Companion to `2026-09-21-station-task-board.md`

The station today is one Spotify account's play log, sourced liner notes, and a request line.
Spotify's app is in development mode — 5 allowlisted users, and extended access needs a registered
company with 250,000 MAU ([TechCrunch, 2026-02-06](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)).
Recommendations, audio-features and related-artists closed to new apps in November 2024. Spotify is a
convenience for the owner's account and nothing else. This map is about everything else.

Every factual claim carries a URL. Where I could not confirm something I wrote **unverified** rather
than guessing. House rule throughout: counted or sourced, never generated.

---

## PART 1 — Listening sources

### The one real finding

A web page cannot hear another tab. The Media Session API is **write-only**: a page declares its own
media so the OS can draw a lock-screen control. There is no read side ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)).
macOS's private `MediaRemote` was locked to entitled Apple processes in macOS 15.4
([report #637](https://github.com/feedback-assistant/reports/issues/637)); MPRIS is local D-Bus only
([spec](https://specifications.freedesktop.org/mpris/latest/Player_Interface.html)). `HomeMusicViz`'s
mic/tab-audio modes are already the honest version of this and should stay the model.

So there are three ways to know what someone is playing: **(a) a scrobble history they opted into**,
**(b) an extension or native app they installed**, **(c) they tell us.** The rest is variations on (a).

### The services

| Service | What a site can read | Auth / cost | Caps & limits | CORS | Terms on storing + public display | Verdict |
|---|---|---|---|---|---|---|
| **ListenBrainz** | now playing (`/1/user/{u}/playing-now`), full listen history (`/listens`, ≤1000/req), counts, stats | reads are public and un-keyed; submitting needs a user token from the person's own settings page | ~30 req/min observed unauthenticated (`x-ratelimit-limit: 30`); relaxed when authenticated | **yes**, `access-control-allow-origin: *` | listen data is **CC0**, explicitly reusable including commercially ([MetaBrainz](https://metabrainz.org/datasets/derived-dumps)) | **BUILD NOW** |
| **Last.fm** | `user.getRecentTracks` (carries a `nowplaying` attr), top artists/tracks | free API key, instant self-serve at [last.fm/api/account/create](https://www.last.fm/api/account/create) | no published number in the live ToS; §4.4 says limits are set "in our sole discretion" | yes, `*` | ToS §4.3 caps total stored Last.fm data at **100 MB**; **§2.8: "You agree to only give public access to pages using Last.fm's web services that have been previously approved by Last.fm in writing"**; §2.7 requires attribution + links back ([last.fm/api/tos](https://www.last.fm/api/tos), read 2026-09-21) | **BUILD LATER** — technically easy, but public display wants written approval |
| **Apple Music** | `/v1/me/recent/played/tracks` (no exact timestamps); heavy-rotation exists but is widely reported empty ([Apple forums](https://developer.apple.com/forums/thread/677297)) | $99/yr Apple Developer Program for the MusicKit `.p8` key, ES256 JWT + a Music User Token; **the visitor needs an active Apple Music subscription** for `/v1/me/*` ([docs](https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens)) | not published — **unverified** | documented CORS breakage on the audio CDN ([forums](https://developer.apple.com/forums/thread/114196)); JSON CORS **unverified** | MusicKit-specific storage/display clauses **unverified** | **SKIP** — $99/yr plus a per-visitor subscription gate |
| **YouTube Data API v3** | **not** watch history — that system playlist is read-only and no longer resolvable in practice. Likes, playlists, subscriptions are | OAuth 2.0, free | 10,000 units/day; `search.list` = 100 units, `playlistItems.list` = 1 ([quota costs](https://developers.google.com/youtube/v3/determine_quota_cost)) | yes, for OAuth JS apps | **stored data must be deleted or refreshed within 30 days** ([policies](https://developers.google.com/youtube/terms/developer-policies)) | **SKIP** |
| **YouTube Music** | — | no official API. `ytmusicapi` is "not supported nor endorsed by Google" ([docs](https://ytmusicapi.readthedocs.io/en/latest/)) | — | — | — | **SKIP** — cover it via Web Scrobbler |
| **SoundCloud** | likes, follows. No general play-history endpoint found | OAuth 2.1 + PKCE; since 2026 registering an app **requires Artist Pro, $99/yr** ([docs](https://developers.soundcloud.com/docs/api/register-app)) | 15,000 stream req/24h per app | yes | terms bar aggregating content into a destination that "replicates substantially the offering of the Website" without written consent ([ToU](https://developers.soundcloud.com/docs/api/terms-of-use)) | **SKIP** as a source; keep the embed |
| **Bandcamp** | nothing — the API is sales reporting for artists only ([developer](https://bandcamp.com/developer)) | — | — | — | the Acceptable Use policy **bans scraping** "through the use of scripts, robots, bots, spiders, scrapers, crawlers… as well as any form of text and/or data mining", and bans AI training ([policy](https://get.bandcamp.help/en/articles/15263124-bandcamp-s-acceptable-use-and-moderation-policy)) | **SKIP** — self-report or embed only |
| **Tidal** | catalog, playlists, collections, search history. A playback-history endpoint is **unverified** | OAuth 2.0 + PKCE, free tier ([developer.tidal.com](https://developer.tidal.com/)) | **unverified** | **unverified** | terms prohibit "storing, aggregating, or creating compilations/databases of TIDAL Content" beyond integration needs ([terms](https://developer.tidal.com/documentation/guidelines-developer-terms-2_0)) | **SKIP** as a log source — the terms fight a play log |
| **Deezer** | a `listening_history` scope exists; the endpoint path is **unverified** | OAuth 2.0, free; 2026 registration status **unverified** | ~50 req/5 s, secondary sources — **unverified** | **no** — needs a server proxy | explicit on audio, silent on displaying metadata — **unverified** | **SKIP** |
| **Qobuz** | — | no public program; credentials by emailing api@qobuz.com, partner-only ([python-qobuz](https://github.com/taschenb/python-qobuz)) | — | — | — | **SKIP** |
| **Plex / Navidrome / Jellyfin** | nothing directly, and nothing should point at a home server | Plex webhooks are **Plex Pass-gated** ([support](https://support.plex.tv/articles/115002267687-webhooks/)); Navidrome has **built-in** Last.fm + ListenBrainz scrobbling ([docs](https://www.navidrome.org/docs/usage/features/scrobbling/)); Jellyfin has an active ListenBrainz plugin ([repo](https://github.com/pepebarrascout/jellyfin-plugin-listenbrainz)) — `jellyfin-plugin-lastfm` was **archived 2026-02-01** | — | — | — | **BUILD NOW, indirectly** — they scrobble to ListenBrainz, the town reads ListenBrainz |
| **Discogs** | collection (`/users/{u}/collection/folders/0/releases`) — what someone **owns**, never what they played | token or OAuth 1.0a, free | 60/min authenticated, 25/min not | yes, `*` | developer terms **unverified** (docs page 403s automated fetch) | **BUILD LATER** — a shelf panel, not a listening source |

### Scrobbling bridges — why one integration covers many services

This is the whole argument for ListenBrainz. The town integrates once; the person chooses how their
plays get there.

| Bridge | Covers | Licence | Status |
|---|---|---|---|
| [Web Scrobbler](https://github.com/web-scrobbler/web-scrobbler) (browser extension) | anything played in a browser tab: YouTube Music, Spotify web, Tidal, Deezer, Apple Music web, Bandcamp, SoundCloud | MIT | v3.22.0, 2026-06-02 |
| [Pano Scrobbler](https://github.com/kawaiiDango/pano-scrobbler) (Android) | any Android app, incl. Spotify, YT Music, Tidal | open source | v4.44, 2026-09-19 |
| [multi-scrobbler](https://github.com/foxxmd/multi-scrobbler) (self-hosted) | Plex, Jellyfin, Navidrome, Subsonic, Spotify, YT Music, Deezer, Mopidy, Chromecast | MIT | actively maintained |
| [Maloja](https://github.com/krateng/maloja) | self-hosted scrobble database, Last.fm/LB-compatible endpoint | GPL-3.0 | actively maintained |
| Last.fm's native Spotify connect | Spotify → Last.fm | first-party | works; one secondary source reports it silently expiring every ~6 months after a 2026 Spotify refresh-token change — **unverified**, single low-quality source |
| ListenBrainz "Connect with Spotify" + extended-history import | Spotify → ListenBrainz | first-party | works; known to duplicate the last ~50 listens if another scrobbler is also running ([community thread](https://community.metabrainz.org/t/can-the-spotify-integration-also-import-full-history/681254)) |

Apple Music and Tidal have the weakest bridges. Apple's practical path is a third-party iOS player
(Marvis Pro, $9.99 + a $5.99 Last.fm add-on), reported broken on iOS 27 beta in July 2026.

**Part 1 verdict: build a ListenBrainz adapter. Nothing else here clears its own bar.**

---

## PART 2 — Links and identity

### Odesli is going away — plan around it

The single most important finding in this section. Linktree, which owns Odesli, published a
[sunsetting notice](https://linktr.ee/help/en/articles/15201827-sunsetting-the-songlink-odesli-public-api):
stricter per-IP limits through 2026-07-31, then `410 Gone`. New API keys are no longer issued.
A live call today (2026-09-21) to `api.song.link/v1-alpha.1/links` returns
**`401 {"code":"PUBLIC_API_ACCESS_DEPRECATED"}`**. Do not build on it. If a cross-service link is
wanted for a human, link to `https://song.link/<url>` — the redirect page still works and costs us nothing.

### The open alternative

| | |
|---|---|
| **MusicBrainz** | `https://musicbrainz.org/ws/2/…?fmt=json`. ~1 req/s per IP, a real `User-Agent` with a contact URL is **required** ([rate limiting](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting)). CORS `*` confirmed live. Core data is **CC0** ([data licence](https://wiki.musicbrainz.org/About/Data_License)). ISRC lookup: `/ws/2/isrc/{ISRC}`. Sibling project to ListenBrainz under MetaBrainz. |
| **MBID kinds** | *recording* = the audio take, *release* = the product, *work* = the composition. The town wants the **recording MBID**. |
| **Streaming links** | MusicBrainz has typed URL relationships to Spotify/YouTube/Apple/Tidal ([recording-url types](https://musicbrainz.org/relationships/recording-url)), but they are crowdsourced and voluntary. Coverage is good for catalog and thin for new or niche releases; no authoritative completeness figure exists — **unverified**. |
| **ISRC** | IFPI's standard says a recording "shall have exactly one ISRC" ([when to assign](https://isrc.ifpi.org/why-use-isrc/when-to-assign)). In practice one recording routinely carries several, from territory re-registrations, re-issues and registrant error ([MetaBrainz discourse](https://community.metabrainz.org/t/same-recordings-with-multiple-isrc/473370)). Spotify returns `external_ids.isrc` on `GET /v1/tracks/{id}` — listed as removed in the Feb 2026 changelog, then reverted ([March 2026 changelog](https://developer.spotify.com/documentation/web-api/references/changes/march-2026)). |

### oEmbed and embeds, per service

| Service | oEmbed | OG to a plain server fetch | Embed player | Listener needs an account? |
|---|---|---|---|---|
| Spotify | `open.spotify.com/oembed` ([docs](https://developer.spotify.com/documentation/embeds/reference/oembed)) | yes (works today; historically flaky — keep a fallback) | iframe + [IFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api) | **anonymous listeners get ~30 s only**; logged in gets full. Whether Free suffices is **unverified** |
| YouTube | `youtube.com/oembed` | yes | iframe API | no |
| SoundCloud | `soundcloud.com/oembed` | **no** — the track page is an app shell; use oEmbed | widget + JS API | no, for public tracks |
| Tidal | `oembed.tidal.com` (not `embed.tidal.com` — that 404s) | yes | [open-source embed player](https://github.com/tidal-music/embed-player) | **unverified** |
| Deezer | `api.deezer.com/oembed` ([docs](https://developers.deezer.com/api/oembed-endpoint)) — no auto-discovery link tag, construct the URL | yes | `widget.deezer.com` | preview for anonymous — **unverified** duration |
| Apple Music | **none** (`/oembed` 404s) | yes | `embed.music.apple.com` widget | ~30 s preview; full needs a subscriber login |
| Bandcamp | unreliable/undocumented; both known endpoints errored today | **yes** — scrape OG, or use the per-release embed generator | per-release embed code | artist decides per release |
| Mixcloud | `app.mixcloud.com/oembed/` ([docs](https://www.mixcloud.com/developers/widget/)) | — | widget + JS API | no |

Spotify's [embed terms](https://developer.spotify.com/documentation/embeds/terms) require the widget be
shown "without alteration" — no overlays, no obscuring — and forbid commercial use of the Play Button.
YouTube's [required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)
forbids overlaying or nesting the player to hide its origin. Both matter if a room ever wants to skin a player.

### Recommendation: the town's canonical track identity

**Primary key: `mbid:<recording MBID>`. Fallback: `isrc:<ISRC>`. Last resort: `x:<sha256(normalised
artist + " — " + normalised title)[0:16]>`.**

Reasoning: the MBID is stable, free, CC0, has no terms problem, and is what ListenBrainz already
resolves listens against. ISRC is the bridge to the commercial world and is what Spotify hands us
today, but it is many-to-one in the wild, so it is a lookup key, never the identity. The hash is the
honest admission that most plays will resolve to neither — `computeStats` already keys on Spotify
track ids and that is fine for the Spotify-only log, but a second source needs something neutral.
The row should carry all three fields it has and say which one it matched on. Never merge two plays
on the fuzzy hash alone across sources; merge on MBID or ISRC or not at all.

---

## PART 3 — Music generation

| | Public API? | Price | Output rights per the terms | Training / litigation | Provenance |
|---|---|---|---|---|---|
| **Suno** | **no public API.** Partner-only exploration announced 2026-07-01 ([MBW](https://www.musicbusinessworldwide.com/suno-explores-developer-api-seeking-apps-that-unlock-experiences-generative-music-makes-possible-for-the-first-time/)). Every "Suno API" reseller is unofficial | Free $0 (no commercial rights, no downloads), Pro $8/mo, Premier $24/mo ([pricing](https://suno.com/pricing)) | ToS eff. 2026-09-03 assigns paid users "all of its right, title and interest in and to any Output owned by Suno," then: **"Suno makes no representation or warranty to you that any copyright will vest in any Output."** Free tier is "personal and non-commercial" only ([ToS](https://suno.com/terms-of-service)). NFTs: **silent** | Warner settled 2025-11-25. **UMG + Sony filed a second suit 2026-09-18** over v6, citing 60,202 recordings ([Variety](https://variety.com/2026/music/news/sony-music-universal-music-sue-suno-label-backed-model-1236866921/)). Munich Regional Court ruled largely for GEMA **2026-07-31** ([Bird & Bird](https://www.twobirds.com/en/insights/2026/germany/munich-district-court-rules-on-ai-generated-music-gema-v-suno)) — July, not January; appeal expected | C2PA + an inaudible watermark, secondary sources only — **unverified** |
| **Udio** | no | secondary sources only — **unverified** | after the UMG settlement (2025-10-29) Udio **disabled downloads of audio, video and stems entirely** ([help centre](https://help.udio.com/en/articles/12683565-changes-associated-with-the-universal-music-group-umg-partnership)). Output has no life outside Udio | settled UMG 2025-10-29, Warner 2025-11-19 | **unverified** |
| **Google Lyria** | **yes** — Gemini API (`lyria-3.5`), Vertex AI (`lyria-002`) | **$0.08/song**, $0.04 per 30 s clip; Lyria 2 on Vertex $0.06/30 s ([pricing](https://ai.google.dev/gemini-api/docs/pricing)) | general Gemini API terms; no Lyria-specific commercial-use clause found — **unverified, read before shipping** | Google says it trained on material it had rights to; no music suit found | **SynthID on all output** ([docs](https://ai.google.dev/gemini-api/docs/music-generation)); the public detector is waitlist-gated, so we cannot self-verify |
| **Lyria RealTime** | `lyria-realtime-exp` — still carries the `-exp` suffix on its own [model page](https://ai.google.dev/gemini-api/docs/models/lyria-realtime-exp). 48 kHz stereo, ≤2 s control latency, instrumental | as above | as above | — | SynthID |
| **OpenAI** | **nothing public.** The audio endpoints are speech; Jukebox (2020) is an abandoned research release. A music tool was *reported* in development Oct 2025 ([Engadget](https://www.engadget.com/openai-is-reportedly-working-on-an-ai-music-generation-tool-204208186.html)) — no product, no API, no date | — | — | — | — |
| **ElevenLabs Music** | **yes**, `eleven_music` ([page](https://elevenlabs.io/eleven-music-api)) | ~$0.15/min reported, credit-tier dependent — **unverified** | "you retain all rights in and to your Output," but "You shall have no rights in or to such third-party output" and output "may not be unique" ([terms](https://elevenlabs.io/music-terms)). Commercial rights on paid plans; tier boundaries **unverified** | **licensed** — Merlin and Kobalt deals, Aug 2025 ([Billboard](https://www.billboard.com/pro/elevenlabs-ai-music-model-merlin-kobalt-licenses-details/)). The cleanest posture of the hosted options | **unverified** |
| **Stable Audio 2.5 / 3** | yes (Stability API, Replicate, fal) | varies by host; no single official per-second price | commercial per plan | Open 1.0 trained on 486,492 CC0/CC-BY recordings from Freesound + Free Music Archive ([paper](https://arxiv.org/pdf/2407.14358v2)); Audio 3 adds 806,284 licensed from AudioSparx. UMG, Warner and Sony took equity in Stability's Aug 2026 raise ([Music Ally](https://musically.com/2026/08/26/stability-ai-raises-76m-from-investors-including-major-labels/)) | — |
| **Stable Audio Open / Open Small** | open weights; Open Small is 341M params and runs on Apple Silicon | free | **Stability AI Community License**: free commercial use **under $1,000,000 annual revenue**; above it the licence terminates and needs an Enterprise licence; commercial users must register ([licence](https://stability.ai/news/license-update)) | as above — the cleanest training story here | — |
| **Meta MusicGen / AudioCraft** | open weights | free | **the code is MIT; the WEIGHTS are CC-BY-NC 4.0 — non-commercial only.** Different files in the same repo; the distinction decides everything ([LICENSE](https://github.com/facebookresearch/audiocraft/blob/main/LICENSE), [model card](https://github.com/facebookresearch/audiocraft/blob/main/model_cards/MUSICGEN_MODEL_CARD.md)) | Meta-owned/licensed catalogue | AudioSeal ships in the repo |
| **ACE-Step** | open weights, **Apache 2.0** | free | full commercial use | 3.5B, vocals + instrumental, consumer GPU ([repo](https://github.com/ace-step/ACE-Step)) | — |
| **DiffRhythm** | open weights, **Apache 2.0** | free | full commercial use | fast latent-diffusion full songs ([repo](https://github.com/ASLP-lab/DiffRhythm)) | — |
| **YuE** | open weights, **Apache 2.0** | free | commercial use encouraged, attribution asked | 7B; 16 GB VRAM minimum, ~80 GB for full songs ([HF](https://huggingface.co/m-a-p/YuE-s1-7B-anneal-en-icl)) | — |
| **Tencent SongGeneration / LeVo 2** | open weights | free | **non-commercial only** — "refrain from using it for any commercial or production purposes under any circumstances" ([README](https://huggingface.co/tencent/SongGeneration/blob/main/README.md)) | — | — |

### "You own it" ≠ "it is copyrightable"

Suno's assignment clause transfers whatever rights Suno has. It cannot create a copyright. The US
Copyright Office's *Copyright and Artificial Intelligence, Part 2: Copyrightability*
(**2025-01-29**) holds that purely AI-generated output without sufficient human creative control is
**not copyrightable**, and that prompting alone does not supply that control; a human's creative
selection, arrangement or modification can be protected, but the raw output underneath is not
([Library of Congress summary](https://blogs.loc.gov/copyright/2025/02/inside-the-copyright-offices-report-copyright-and-artificial-intelligence-part-2-copyrightability/)).
It builds on the rescinded *Zarya of the Dawn* registration.

The consequence for PointCast: a generated bed is something the town may freely use and freely give
away, and very probably something nobody owns. **That makes it a bad thing to sell as a scarce object
and a fine thing to run a radio station on.**

---

## PART 4 — What PointCast should actually do

The town already synthesises all of its own audio live in the browser — Rosebud, the drum rooms, the
bells, the meditative apps. That is the aesthetic and it is also the strongest legal position in this
document. Generation should serve it, not replace it.

**Would do:**

1. **Town radio, rights-first.** One stream everyone on `/station/party` hears together, built only
   from audio the town can prove it may play: its own WebAudio renders, CC0/CC-BY material (Free
   Music Archive, Freesound), local bands with written permission on file, and generated beds. $0 for
   the first three. Every item carries a source and a licence in a manifest the page renders.
   **Label: each track shows where it came from.** This is what makes a listening party real, and it
   is mostly a rights ledger, not a music problem.
2. **Station idents and jingles.** Eight to twelve short beds, generated **once, offline, by hand**,
   reviewed, committed as static files. Google Lyria at $0.08/song — a dozen idents costs about a
   dollar — or Stable Audio Open Small locally for free. Nobody owns them, which is fine for an
   ident. **Label: a `GENERATED` line in the manifest and in the page copy, permanently.**
3. **"Make a bed at the room's tempo."** The drum circle already broadcasts a tempo. Render a bed at
   that BPM **from the town's own synthesis** — no service, no key, no money, buildable today. Lyria
   RealTime is the only streaming model option and is still `-exp`, so it is a later experiment, not
   a dependency.
4. **The liner-note rule, extended to audio.** `notes.ts` refuses to show a note it cannot prove.
   Generated audio gets the inverse: never unlabelled, and never in the play log, the counts, Rewind,
   or anything `computeStats` touches. A generated bed is not a play.
5. **A CC0/CC-BY shelf.** A small curated wall of freely-licensed music with its licences shown —
   sourced, not generated, a natural companion to the Wikipedia liner notes. $0.
6. **Agents composing — as requests, not broadcasts.** An agent can already file a request. Let it
   submit a *bed it made* the same way: queued, self-reported name, marked generated, Mike or the
   room decides. O5's standing model then covers composers as well as recommenders.

**Would not do:**

7. **Minting generated music on Tezos.** The output very likely has no copyright (Part 3), so the
   thing sold has nothing under it — and the project's direction already moved from utility minting
   to *memorialising*: minting things that happened, not things a model produced on demand. Mint the
   receipt for a listening party that occurred; not the bed that played at it.
8. **Suno or Udio in the product.** Suno has no API to call and was sued again on 2026-09-18 over the
   newest model. Udio cannot export audio at all. Neither is a dependency a one-person town takes.
9. **Meta MusicGen weights.** CC-BY-NC. PointCast takes money, so "non-commercial" is not a bet worth
   making on a file that is easy to mistake for MIT.
10. **Generated liner notes, bios, or "facts" of any kind.** Already the house rule; no exception
    because the medium is audio.

---

## PART 5 — The architecture, one page

```
  source adapters                   one normalised row                the existing log
  ───────────────                   ──────────────────                ────────────────
  spotify   (owner only, today) ─┐
  listenbrainz (anyone, opt-in) ─┼──►  PlayRow {                 ──►  KV USERS
  import    (offline zip → KV)  ─┤       source: 'spotify'|'listenbrainz'|'seen'|'import'
  seen      (now-playing signal)─┘       at, title, artist, album?, ms?, art?
                                         ids: { spotify?, mbid?, isrc?, hash }
                                         matchedOn: 'mbid'|'isrc'|'hash'|'spotify'
                                       }
```

**The shape.** `StationPlay` is already close: it needs a widened `src` union, an `ids` object with
whichever identifiers the adapter had, and `matchedOn` so a page can say how it knows. `mergePlays`
already reasons about provenance (`imp` vs live) and that extends cleanly — a ListenBrainz row and a
Spotify row of the same play fold together **only** on a shared MBID or ISRC, never on the fuzzy
hash. `computeStats` is unchanged; it counts rows.

**Identity.** MBID first, ISRC second, normalised hash last, per Part 2. Resolution against
MusicBrainz happens **at write time, not read time**, at ≤1 req/s with a real User-Agent, and a miss
is allowed: an unresolved row is still a row.

**Secrets.** ListenBrainz reads need **no key** and set `Access-Control-Allow-Origin: *`, so the
panel can be a client-side fetch with nothing on the server. MusicBrainz the same. Last.fm would need
an API key — another reason to prefer ListenBrainz. A generation key is Mike's, used offline by a
script, never at request time.

**KV cost.** The real constraint; the town has blown its write quota before (free-tier KV is 1,000
writes/day). **Reads are free, writes are not.** So: write only when a play is genuinely new; cache
MusicBrainz lookups in the **edge cache**, not KV, the way `notes.ts` already does; keep the sync
throttle in the edge cache; compute counts from the month document already being read. A per-visitor
ListenBrainz panel should write **nothing** — the cheapest feature in this document.

**Privacy page changes, step by step.**

| Step | Privacy page must add |
|---|---|
| ListenBrainz panel, read-only, client-side | that a visitor may save a ListenBrainz username to their profile; that the town fetches a public CC0 API with it; that it is off by default and removable |
| Server-side ListenBrainz sync into the log | that listens fetched this way are stored with the play log, on the same erase-on-disconnect terms as Spotify |
| A generated-audio room | that audio in that room is generated, which service made it, and that no visitor audio is sent anywhere (the mic rule from `HomeMusicViz` restated) |
| Town radio | the licence and provenance of what is streamed, and that nothing a visitor plays is rebroadcast |
| Agent-submitted beds | that submissions are public, self-reported and unverified, matching the existing request-line paragraph |

---

## PART 6 — Risks, and the five things only Mike can do

**Ranked risks**

1. **Odesli already returns 401.** Anything assuming cheap cross-service link resolution has to be
   rewritten around MusicBrainz now, not later.
2. **Last.fm ToS §2.8 requires written approval for public display.** Showing Last.fm data publicly
   without it is a knowing breach. ListenBrainz has no such clause — the strongest single reason for
   the recommendation.
3. **The generation legal ground keeps moving.** Suno was sued again three days ago and lost in
   Munich in July. Anything the town generates should be cheap to throw away.
4. **MusicBrainz coverage is thinner than it looks** for new and niche releases. A meaningful share
   of rows will never resolve to an MBID; the design must treat that as normal, not as failure.
5. **KV writes.** Each new source multiplies writes on the same month documents. An adapter writing
   per-listen instead of per-batch could exhaust the quota in an afternoon.
6. **Scope creep into per-visitor listening.** The privacy page promises a personal Spotify
   connection *never* gets a play log. A ListenBrainz panel is a different thing, but that copy has
   to be re-read so the two promises do not contradict.
7. **Volunteer bridges.** Web Scrobbler, Pano and multi-scrobbler are healthy today and are still
   projects the town would be depending on.

**Mike's five**

1. **Decide ListenBrainz, yes or no.** It is the spine of Parts 1 and 5; nothing else is worth
   building first.
2. **Create a ListenBrainz account and connect Spotify to it** (Settings → Connect with Spotify) so
   there is a real second source to build against. Free, no card.
3. **Decide whether the town will ever display Last.fm data publicly** — and if yes, write to Last.fm
   for the §2.8 approval. Only Mike can accept those terms.
4. **Hold the generation key.** A Gemini API key for Lyria, or nothing. It stays with Mike, is used
   offline by a script, never touches a request path, and no agent gets it.
5. **Rule on minting.** Part 4 recommends not minting generated music. That is a direction call, not
   a technical one, and should be said out loud before anyone builds toward it.

Still Mike's, unchanged from the task board: reauthorizing Spotify, requesting the extended streaming
history export, any signing key, any mainnet transaction, any new paid service.
