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
7. Bump `meta.asOf`. Keep block `0596`'s `meta.releases` equal to the count.

## Rules

- Nothing goes in without a URL. Conflicting sources: keep the better-sourced
  claim and say in the row that sources disagree.
- Certification is shown only where a source states it. Unknown stays unknown.
- Do not copy a lab's measurements wholesale. Swingweight and twistweight may be
  quoted per variant with `specSource`; power, pop and spin numbers stay with
  the lab and get a link.
- Do not copy product photos. The images are the generated drawings.
- Never scan the filesystem for credentials; this pass needs none.

## Ship

```
node --test tests/paddle-calendar-room.test.mjs tests/paddle-register.test.mjs
npm run build          # regenerates /images/og/paddles/*.png
```

Open a PR titled `chore(court): paddle register refresh YYYY-MM-DD` with a
summary of what changed and why. `git add` only the data files, the OG cards
under `public/images/og/paddles*` and `paddle-calendar.png`, and the Rally copy
in its own commit to tez-experiments. Deploy follows the normal PointCast path.
