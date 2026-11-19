# Open channels across PointCast and its neighbors

How PointCast, Halation and elsegundo.xyz list their channels so each can read the others' feeds: pictures, editions, news, diaries, mints, music, play and agent work. Written October 31, 2026. Owner: Michael Hoydich. The same open-channels/0.1 format is used by elsegundo.xyz, which keeps a copy that covers only its own channels.

## The idea in one line

Every channel has one source site. That site publishes it as a feed. Any other site can carry it by reading the feed and linking back. Each site lists its own channels, and the neighbors it reads, in one file at `/channels.json`.

## What each site publishes

All three already speak JSON Feed 1.1, so nothing new has to be invented, only listed.

| Site | Channels it is the source for | Feeds today |
| --- | --- | --- |
| PointCast | ten channels: Front Door, Court, Spinning, Good Feels, Garden, El Segundo, Faucet, Visit, Battler, Birthday; plus play, music and mints | `/feed.json`, `/feed.xml`, `/c/{slug}.json`, `/c/{slug}.rss`, `/channels.json` (this change) |
| Halation | diary (image posts with captions, a source link, optional Tezos one-of-one) | `/feed.json`, `/rss.xml` |
| elsegundo.xyz | pictures (daily art carousel), news (South Bay Today), edition, events, places, signals, maps, learning, desk | `/carousel/feed.json` + `.xml` (proposed), `/today/feed.json` + `.xml`, `/webhooks/feed.json`, `/events.ics`, `/channels.json` (proposed) |
| imagefm | mood images from Mike's Midjourney work | no feed known yet |

## The shared kinds

`pictures`, `edition`, `news`, `events`, `places`, `maps`, `shop`, `learning`, `desk`, `signals`, `diary`, `music`, `play`, `mints`. A channel picks one. A site that carries a channel shows it in the way its `carry` line says.

## The manifest: `/channels.json`

```json
{
  "version": "open-channels/0.1",
  "site": { "id": "pointcast.xyz", "name": "...", "url": "...", "manifest": ".../channels.json" },
  "updated": "YYYY-MM-DD",
  "kinds": ["pictures", "..."],
  "channels": [
    { "id": "pointcast.xyz/front-door", "kind": "edition", "title": "...", "description": "...",
      "html": "...", "feeds": { "json": "...", "rss": "..." }, "data": "...",
      "cadence": "as blocks publish", "status": "live | proposed | no feed yet | off", "carry": "how to show it elsewhere" }
  ],
  "neighbors": [ { "id": "halation", "name": "Halation", "url": "...", "manifest": "...", "feeds": {}, "status": "..." } ],
  "carries": [ { "channel": "halation/diary", "feed": "...", "where": "not shown yet", "status": "proposed" } ]
}
```

Rules:

1. A channel id is `<site id>/<slug>`. Only the source site lists it under `channels`.
2. Feeds are JSON Feed 1.1 first, RSS 2.0 beside it. Site-specific fields go under `_channel` (or the site's own `_pointcast`, `_halation`).
3. Every item links home. A carrying site shows the title, picture and credit, and sends readers to the item's `url`.
4. The manifest and feeds send `Access-Control-Allow-Origin: *` so a page on another site can read them.
5. `status` says what is true today. `proposed` means built but not merged or not shown.
6. Each site's own rules travel with its channels. elsegundo.xyz never carries cannabis topics, so the Good Feels channel is never offered to it.

## First wiring

- **elsegundo.xyz → PointCast and Halation: pictures and news, one way.** elsegundo.xyz publishes its feeds and lists its own channels, but lists no neighbors and carries nothing from PointCast or Halation. It is a civic site and keeps to its own content.
- **PointCast → anyone: every channel.** `/channels.json` lists all ten channels with their feeds. PointCast lists elsegundo.xyz and Halation as neighbors and their feeds under `carries` as proposed; showing them on a page is a later step.
- **Halation → PointCast: diary.** `/feed.json` is live. Halation adds its own `/channels.json`; see [halation.md](halation.md).
- **Desk.** Agent coordination isn't a public feed yet.

## What this does not do

It publishes nothing by itself, posts nowhere, and needs no key or account. Merging is Mike's call through Shwa.
