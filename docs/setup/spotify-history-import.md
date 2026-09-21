# Backfilling /station's play log from a Spotify privacy export

`/station` ("Mike Hoydich Radio") keeps a public play log in Cloudflare KV,
one JSON document per month (`station:v1:broadcast:log:{YYYY-MM}`, see
`functions/api/spotify/_station.ts`). The Spotify Web API only exposes the
last 50 plays (`me/player/recently-played`), so any deeper history has to
come from Spotify's own privacy export.

`scripts/import-spotify-history.mjs` converts that export into the same
monthly document shape, entirely offline. It never talks to Spotify's API,
never writes to KV, and never runs `wrangler` — it only prints the commands
you'd need, so you can review them before doing anything live.

**The play log is public.** Anyone can load `/station` and see what's in it.
Run a `--dry-run` first, read the summary, and only upload months you're
comfortable putting on a public page.

## 1. Request the export from Spotify

1. Go to Spotify → **Account** → **Privacy settings** (or
   [spotify.com/account/privacy](https://www.spotify.com/account/privacy/)).
2. Under "Download your data", tick **Extended streaming history** (this is
   the one with years of history and exact per-play timestamps — the
   default "Account data" export only has ~1 year and coarser data).
3. Submit the request. Spotify says it can take up to 30 days; in practice
   it's often faster, but plan around the wait.
4. You'll get an email with a download link. It arrives as a `.zip`.
   Unzip it — inside you'll find files named like
   `Streaming_History_Audio_2019-2021_3.json`, one per chunk of history.

If you've previously downloaded the older, short-form "account data" export
(files named like `StreamingHistory_music_0.json`), the script accepts
those too — see "Two export formats" below.

## 2. Run the script

```sh
# See what would happen, without writing anything:
node scripts/import-spotify-history.mjs ~/Downloads/my_spotify_data --dry-run

# Once you're happy with the summary, write the monthly files:
node scripts/import-spotify-history.mjs ~/Downloads/my_spotify_data --out ./out/station-import
```

Point it at the *directory* the export unzipped into — it walks it
recursively, so it's fine to point it at the whole unzipped folder even
though Spotify includes lots of other files (`Marquee.json`,
`SearchQueries.json`, etc.) that aren't streaming history. Those are
silently ignored (counted as `unrecognizedFile` in the summary).

Useful flags:

- `--min-ms <n>` — skip plays shorter than this many milliseconds (default
  `30000`, i.e. 30 seconds — filters out skips and accidental taps).
- `--from YYYY-MM-DD` / `--to YYYY-MM-DD` — only keep plays that started in
  this UTC date range.
- `--merge-with <dir>` — see "Merging with the live log" below.
- `--dry-run` — print the summary, write nothing.

Run `node scripts/import-spotify-history.mjs --help` for the full list.

## 3. What gets skipped, and why

The script prints a skip-reason breakdown in every run (dry or not):

| reason | meaning |
| --- | --- |
| `podcast` | the row is a podcast/episode play, not a track (no track id, or has `episode_name`/`spotify_episode_uri`) |
| `incognito` | the row has `incognito_mode: true` — Spotify itself marks these as private, so they're left out |
| `tooShort` | played less than `--min-ms` (default 30s) — usually a skip, not a real listen |
| `missingFields` | the row doesn't parse: no track id/title/artist, or an unparseable timestamp |
| `duplicate` | the same track id with a start time in the same minute as another kept row, already counted once |
| `outOfRange` | outside `--from`/`--to`, if you passed them |
| `capped` | dropped to keep a single month under the log's 6000-row cap (oldest rows in that month are dropped first; a warning is printed with the exact count) |
| `unrecognizedFile` | a `.json` file in the export that isn't a streaming-history array (or failed to parse) — not an error, just ignored |

## 4. Two export formats

- **Extended streaming history** (`Streaming_History_Audio_*.json`) — the
  one to actually ask for. Has a real Spotify track id
  (`spotify_track_uri`), exact end-of-stream timestamp (`ts`, UTC),
  `ms_played`, and flags like `incognito_mode` and `skipped`. The play's
  start time (`at` in the output) is computed as `ts - ms_played`, which is
  how the live log records plays (start time, not end time).
- **Account data** (`StreamingHistory_music_*.json`) — an older, shorter
  export (roughly the last year, coarser fields). It has no track id, so
  the script derives one deterministically:
  `nouri-` + the first 22 hex characters of `sha256(artist + ' ' + track)`.
  Its URL is a Spotify search link
  (`https://open.spotify.com/search/<artist> <track>`) rather than a direct
  track link, since there's no id to link to. The same artist/track pair
  always produces the same id, so re-running the import (or later getting
  the extended export covering the same period) is stable.

Imported rows get `src: 'spotify'` and a new `imp: true` flag (added to
`StationPlay` in `functions/api/spotify/_station.ts`) so they can be told
apart from rows the live sync wrote itself. They never carry `img`, `yr`,
or `pop` — the export doesn't include cover art, release year, or
popularity, and the script doesn't guess.

## 5. Merging with the live log

**Uploading a month's file to KV replaces that month's document whole.**
If the live log already has rows for a month you're importing (likely, if
the sync has been running), uploading without merging first will delete
those existing rows.

1. Download the current live document(s) for the months you're about to
   import:

   ```sh
   npx wrangler kv key get "station:v1:broadcast:log:2021-02" \
     --namespace-id=<USERS_NAMESPACE_ID> --remote \
     > ./downloaded/station-log-2021-02.json
   ```

   (Find `<USERS_NAMESPACE_ID>` in `wrangler.toml`, or run
   `npx wrangler kv namespace list` and match the `USERS` binding — don't
   guess it.)

2. Re-run the import with `--merge-with ./downloaded`:

   ```sh
   node scripts/import-spotify-history.mjs ~/Downloads/my_spotify_data \
     --out ./out/station-import --merge-with ./downloaded
   ```

   For every month present in `--merge-with`, the script folds the
   imported rows into the downloaded ones using the exact same rule
   `/station`'s live merge uses in KV (`mergePlays` in
   `functions/api/spotify/_station.ts`): a play with the same track id and
   a start time within a 10-minute (or track-length-plus-3-minute) window
   is treated as the same play, and a `spotify`-sourced row replaces a
   `seen`-sourced one for that play rather than duplicating it. That rule
   is re-implemented (not imported — this script runs outside the Workers
   runtime) as `mergePlaysLikeStation` in
   `scripts/import-spotify-history.mjs`, with a comment noting it must be
   kept identical to `_station.ts` if that logic ever changes.

3. Only after reviewing the printed summary — and the wrangler `put`
   commands the script prints at the end of every run — actually run them
   yourself. The script never runs `wrangler` for you.

## 6. Verifying before you trust it

Always look at the `--dry-run` summary first: files read, rows read, rows
kept, the skip-reason table, the date range, total hours, and the top 15
artists/tracks. If something looks off (way fewer rows than expected, a
skip reason with a surprisingly high count), it's much cheaper to fix
before writing files or touching KV.

`summary.json` (written alongside the monthly files, unless `--dry-run`) has
the same data as machine-readable JSON if you want to script a check on it.
