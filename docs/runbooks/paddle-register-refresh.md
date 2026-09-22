# Paddle Register — weekly refresh

The register (`/paddles`, `/paddle-calendar`) is only definitive while it is
current. This is the weekly pass. It is written to be run by an agent
(scheduled task `paddle-register-refresh`) or by hand.

## Data

| File | Holds |
|---|---|
| `src/data/paddle-calendar.json` | 2026 releases, anchors (news), `ahead`, `signals`, forecasts, trends, signings, company files. `meta.asOf` is the as-of date. |
| `src/data/paddle-register.json` | `enrich` (per-paddle variants, core layers, timeline, status, lab links, keyed by release id), `backfill` (pre-2026 paddles, same shape as a release plus its own enrichment), `companies` (brand files for backfill-only brands). |
| Rally copy | In `tez-experiments/tez-rally/public/paddle-calendar/`: `data.json` is the same file as `paddle-calendar.json` (regenerate the page with `node scripts/build-paddle-calendar.mjs`), and `register.json` is the slim list of every paddle (id, brand, model, short, msrp, build, date, status) that The Bag searches. Rewrite both whenever a paddle is added. Then `node scripts/test-bag.mjs`. |

## The pass

1. **New releases and dated drops.** Check, for the last 10 days: The Dink, The
   Kitchen, Pickleball Effect, John Kew's newsletter, Pickleheads, Pickleball
   Studio, Pickleball Blast, PickleTip's approvals tracker, PR Newswire
   (pickleball paddle). Add a release row only with a source, a date precision
   and a confidence. Move anything in `ahead` whose date has passed: a release
   flips `status` from `upcoming` to `released` once reviews or a product page
   confirm it shipped.
2. **Approval lists.** Diff the USA Pickleball approved list and the UPA-A list
   against `enrich[*].status`. A new name with no launch is a `signals` row, not
   a release. A delisting or investigation is an anchor plus a timeline event on
   the paddle. Record the URL you saw it on in `usapSource` / `upaaSource`.
3. **Legal.** JOOLA ITC Inv. 337-TA-1503: new settlements, the holdouts, any
   exclusion order. Update `status.patent` at brand level and add an anchor.
4. **Signings and deals.** January is the busy month. Rows go in `moves`.
5. **Lifecycle.** Phase-outs that reached their date become `discontinued`;
   limited runs that sold out stay `limited`.
6. **Forecasts.** Do not delete a forecast that missed. Mark what happened in
   its body and leave it. New calls must name what they rest on.
7. **The changes feed.** Every edit that changes a fact gets a row in
   `paddle-register.json` `changes`: `{date, kind: added|shipped|approved|
   delisted|price|corrected|signed, paddle: <id or null>, text, source}`.
   This is what /paddles/changes and the RSS feed show, and what
   `paddle_lookup` returns per paddle. No silent edits.
8. Bump `meta.asOf` in both data files. Keep block `0596`'s `meta.releases`
   equal to the release count and block `0598`'s `meta.paddles` equal to
   releases + backfill. Rewrite the Rally `register.json` (slim list) too.
9. **Field reports** (`/api/paddles/wear`) are player-submitted and live in
   KV, not in the data files. Do not edit them. If a paddle's aggregates look
   gamed, note it in the changes feed and leave the panel's "unaudited" line
   to do its work.
10. **Corrections desk** (`/api/paddles/correct`). Readers file corrections
    from the "Report a correction" form on each paddle page; each one names a
    field, a claim and a source URL. Read the open queue:

    ```
    curl "https://pointcast.xyz/api/paddles/correct?queue=1&key=$CORRECTIONS_KEY"
    ```

    The key lives in the Pages project secrets. Never scan the filesystem for
    it; if it is not in your environment, ask. One-time setup, done by Mike:
    `wrangler pages secret put CORRECTIONS_KEY --project-name pointcast`
    (until it is set the endpoint answers 503 `key-not-set`). For each open
    item, open the source and check that it says what the claim says. Apply
    accepted claims to the data files with a `changes` row: `kind: corrected`,
    `paddle: <id>`, `text` in your own words, `source` = the submitter's source
    URL. Rejected claims are simply left in the queue; there is no reply
    channel yet, and the queue drops the oldest past 500. The queue response
    never includes contact fields, and neither does any public GET.

## Rules

- Nothing goes in without a URL. Conflicting sources: keep the better-sourced
  claim and say in the row that sources disagree.
- Certification is shown only where a source states it. Unknown stays unknown.
- Do not copy a lab's measurements wholesale. Swingweight and twistweight may be
  quoted per variant with `specSource`; power, pop and spin numbers stay with
  the lab and get a link.
- Do not copy product photos. The images are the generated drawings.
- Never scan the filesystem for credentials. The only secret this pass touches
  is `CORRECTIONS_KEY` for step 10, and it is handed to you or it is not.

## Ship

```
node --test tests/paddle-calendar-room.test.mjs tests/paddle-register.test.mjs tests/paddle-wear-api.test.mjs tests/paddle-corrections-api.test.mjs
npm run build          # regenerates /images/og/paddles/*.png
```

Open a PR titled `chore(court): paddle register refresh YYYY-MM-DD` with a
summary of what changed and why. `git add` only the data files, the OG cards
under `public/images/og/paddles*` and `paddle-calendar.png`, and the Rally copy
in its own commit to tez-experiments. Deploy follows the normal PointCast path.
