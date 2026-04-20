# src/content/gallery/

One JSON file per entry. Rendered at `/gallery` as a grid → lightbox viewer.

## Minimum shape

```json
{
  "slug": "el-segundo-sunset-01",
  "title": "El Segundo sunset over the refinery",
  "imageUrl": "https://cdn.midjourney.com/abc/image.png",
  "createdAt": "2026-04-18",
  "tool": "midjourney"
}
```

All other fields optional: `promptSummary` (≤280 chars, Mike's words), `mood`
(slug for future /mood/{slug} filter), `author` (default `mike`), `source`
(where the URL came from — `/drop` key, chat timestamp, etc.).

## How to add

**Fastest:** `/drop` the image URL from chat or your phone. On next cron
tick cc classifies it as an image + files it here with `author: 'mike'`
and `source` pointing to the drop key.

**Git-native:** commit a JSON file under this directory. cc reads on next
build.

## Seeded demo content

Four Nouns (from noun.pics · CC0) are seeded to prove the viewer. When
Mike adds real MJ entries, they sort to the top by `createdAt`. The Nouns
stay as permanent demo content unless Mike deletes them.
