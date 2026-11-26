# Halation: join the open channels (spec for Shwa)

Halation (halation-diary.mhoydich.chatgpt.site) is built in ChatGPT, and its code isn't in a repo Claude can reach, so this is the change to make there. The format is in [README.md](README.md). Written October 31, 2026. Nothing here goes live without Mike's yes.

## What Halation has today (read Oct 31, 2026)

- `/feed.json`: JSON Feed 1.1, 14 items. Each item has `id`/`url` (a `/p/<slug>` permalink), `title`, `content_text`, `image`, `date_published`, `authors` (a Tezos wallet), `tags`, `external_url`, `attachments` (webp with alt-style title), and `_halation` (`mint_state`, `contract_address`, `operation_hash`, `source_url`, `image_width`, `image_height`).
- `/rss.xml`: the same items, with `enclosure`, `media:content` and a `halation:` namespace.
- No `/channels.json`, `/llms.txt` or sitemap yet.

## Change 1: add `/channels.json`

Serve this as `application/json` with `Access-Control-Allow-Origin: *`. Set `updated` to the day it ships.

```json
{
  "version": "open-channels/0.1",
  "about": "Halation's channels and the neighbor sites it trades channels with.",
  "site": {
    "id": "halation",
    "name": "Halation",
    "url": "https://halation-diary.mhoydich.chatgpt.site/",
    "manifest": "https://halation-diary.mhoydich.chatgpt.site/channels.json"
  },
  "updated": "YYYY-MM-DD",
  "kinds": ["pictures", "edition", "news", "events", "places", "maps", "shop", "learning", "desk", "signals", "diary", "music", "play", "mints"],
  "channels": [
    {
      "id": "halation/diary",
      "kind": "diary",
      "title": "Halation image diary",
      "description": "Wallet-authored image posts with the context around them, some minted as Tezos one-of-ones.",
      "html": "https://halation-diary.mhoydich.chatgpt.site/",
      "feeds": {
        "json": "https://halation-diary.mhoydich.chatgpt.site/feed.json",
        "rss": "https://halation-diary.mhoydich.chatgpt.site/rss.xml"
      },
      "cadence": "when a post goes up",
      "status": "live",
      "carry": "Show the image, title and caption, link the post page, and say minted 1/1 only when mint_state says so."
    },
    {
      "id": "halation/mints",
      "kind": "mints",
      "title": "Halation one-of-ones",
      "description": "Only the posts minted as Tezos one-of-ones.",
      "html": "https://halation-diary.mhoydich.chatgpt.site/",
      "feeds": { "json": "https://halation-diary.mhoydich.chatgpt.site/feed.json?minted=1" },
      "cadence": "when a post is minted",
      "status": "proposed",
      "carry": "Link the post page and the operation hash. Never show a price as an offer."
    }
  ],
  "neighbors": [
    {
      "id": "elsegundo.xyz",
      "name": "elsegundo.xyz",
      "url": "https://elsegundo.xyz/",
      "manifest": "https://elsegundo.xyz/channels.json",
      "feeds": { "json": "https://elsegundo.xyz/carousel/feed.json" },
      "status": "proposed, read one way: elsegundo.xyz lists no neighbors"
    },
    {
      "id": "pointcast.xyz",
      "name": "PointCast",
      "url": "https://pointcast.xyz/",
      "manifest": "https://pointcast.xyz/channels.json",
      "feeds": { "json": "https://pointcast.xyz/feed.json" },
      "status": "proposed"
    }
  ],
  "carries": [
    { "channel": "elsegundo.xyz/pictures", "feed": "https://elsegundo.xyz/carousel/feed.json", "where": "not shown yet", "status": "proposed" }
  ]
}
```

If `?minted=1` is more work than it's worth, drop the `halation/mints` channel; readers can filter `_halation.mint_state` themselves.

## Change 2: headers on the feeds

`/feed.json` and `/rss.xml` should send `Access-Control-Allow-Origin: *`, so a page on elsegundo.xyz or PointCast can read them in the browser. Keep the current content types (`application/feed+json`, `application/rss+xml`).

## Change 3: add `_channel` to each feed item (optional)

Inside each item, beside `_halation`, add:

```json
"_channel": { "channel": "halation/diary", "isPhotograph": true }
```

Set `isPhotograph` to the truth for each post, so a carrying site can tell a photograph from an AI-made image and label it right.

## Change 4: a "From the neighbors" strip (later, optional)

A small row under the diary that reads `https://elsegundo.xyz/carousel/feed.json` and shows the newest three pictures with their caption, credit and a link back. Hide it if the fetch fails or the newest item is older than two days. Keep the alt text.

## Checks before asking Mike

- `/channels.json` parses and every URL in it returns 200.
- `curl -I` on `/feed.json`, `/rss.xml` and `/channels.json` shows `Access-Control-Allow-Origin: *`.
- No payment details, keys or precise locations in any file.
- Ask Mike before it goes live. A desk note or this file is not his yes.
