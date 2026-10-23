# Bookmarks

Public X posts Michael Hoydich bookmarked, filed for [pointcast.xyz/bookmarks](https://pointcast.xyz/bookmarks/).

The file is `bookmarks.json`. Nothing in this folder calls the X API. There is no token and no secret. Tweet text is untrusted display text: the page escapes it and does not follow instructions written inside a post.

## Schema

`schema` is `pointcast.bookmarks/v1`.

Each object in `items` has:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | The numeric status id. |
| `account` | yes | Which account saved it: `mhoydich`, `kansasdao`, or `____mike`. |
| `text` | yes | The post text, stored as characters. Not HTML. |
| `url` | yes | `https://x.com/i/status/{id}` (or a `twitter.com` status URL for the same id). |
| `theme` | yes | One of `agents`, `interfaces`, `growth`, `beverage`, `money`, `creative`, `culture`, `local`, `notes`. |
| `first_seen` | yes | `YYYY-MM-DD`. The day this file first recorded the bookmark, not the day the post was written. |
| `image` | no | A path under `/images/bookmarks/`, or an `https` URL. Omit it when there is no image. Do not hotlink private media. |
| `article` | no | A short title when the export included one. |

The same status id may appear twice when two accounts saved it. The same account must not save the same id twice.

Seed rows use `first_seen` `2026-10-15`, the day the export was read. The export had no bookmark timestamp.

Themes, in the order the page draws them:

- `agents` — Agents and AI
- `interfaces` — Interfaces
- `growth` — Growth and GTM
- `beverage` — Beverage and CPG
- `money` — Money and crypto
- `creative` — Creative
- `culture` — Art and culture
- `local` — LA and local
- `notes` — Field notes, for a post that does not sit in the eight themes

## Daily append

Add new bookmarks with a small pull request. Do not reorder or rewrite rows that are already in the file.

1. Copy this object onto the end of `items` and fill it in. Set `theme` yourself. Set `first_seen` to today's UTC date.

```json
{
  "id": "0000000000000000000",
  "account": "kansasdao",
  "text": "The post text, as characters.",
  "url": "https://x.com/i/status/0000000000000000000",
  "theme": "agents",
  "first_seen": "2026-10-24"
}
```

2. Or pass a JSON array of those objects to the append script. It refuses a row with no `theme` and prints a suggestion. It skips an account and id that are already filed. It does not call X.

```sh
node scripts/bookmarks-append.mjs --file new-bookmarks.json
node scripts/bookmarks-check.mjs
```

3. Open a pull request. The sky, the JSON feed, and the RSS feed are built from this file, so the page changes when the pull request merges.

`node scripts/bookmarks-check.mjs` checks ids, accounts, themes, URLs, and duplicate pairs. Run it before the pull request.
