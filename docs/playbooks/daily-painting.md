# Daily Painting Pipeline

The homepage Morning Hero is fed by `src/data/morning-hero.json`. Each entry has a `date` field; when a visitor lands on `/`, the homepage picks the entry matching today and renders it as the LEAD.

This is the workflow for keeping it fresh.

## Anatomy of an entry

```json
{
  "date": "2026-05-13",
  "kicker": "WEDNESDAY · MARINE LAYER BURNED OFF · 68°F",
  "title": "Clear day. The whole coast is visible.",
  "body": "After Tuesday's overcast, today opens up. Crisp blue sky...",
  "image": "/bar/daily/2026-05-13.png",
  "imageAlt": "El Segundo on a clear Wednesday morning...",
  "cta": "open /tide",
  "ctaHref": "/tide",
  "secondaryCta": "or /coffee",
  "secondaryHref": "/coffee",
  "byline": "cc"
}
```

## Manual workflow (current — works today)

The night before, or the morning of, do this:

### 1. Generate the painting via Codex `image_gen`

From a Claude Code session with the Codex MCP loaded:

```
codex prompt:
  "Generate ONE image using your built-in image_gen tool. Save to
  /tmp/codex-bar-{date}.png. Prompt: Pixel-art panorama of El Segundo
  California at {time-of-day}, {weather}, {mood-detail}. Refinery on
  left, residential and palms middle, mid-rise offices, beach + Pacific
  right. 16-bit retro pixel-art aesthetic, hard pixel edges, dithered
  gradients."
```

Then:

```bash
cp /tmp/codex-bar-{date}.png public/bar/daily/{date}.png
```

### 2. Append an entry to `morning-hero.json`

New entries go at the **top** of the `posts` array. Older entries stay (the homepage finds by exact date match; everything else is ignored that day).

Write the editorial in real voice. 2-4 sentences. Specific, not generic. Reference what's actually happening (the weather, a recent ship, an event). The CTA should be one verb phrase pointing to a real route.

### 3. Push

The next deploy picks up the new entry; visitors today see the new hero.

## Editorial voice guide

**Kicker line**: Day of week · weather word · time of day or temp. Example: `TUESDAY · 60°F · MARINE LAYER`.

**Title**: A sentence ending with a period. NOT a headline in headline-case. Like *"Anticipation lives in the blue hour."* or *"The bar got 11 paintings overnight."*

**Body**: 2-4 sentences. Specific. Mention real things (the marine layer, the refinery flares, the Tuesday block). Avoid generic AI prose ("PointCast is a unique platform that..."). Real voice = the voice of someone who lives here and is paying attention.

**CTA**: A verb phrase pointing somewhere real. *"open /tide"*, *"see the mood board"*, *"tap the bell at /lobby"*. Not *"learn more"*.

## Automation (next sprint — TODO)

The current manual workflow is fine for the first weeks. To automate:

1. **Cloudflare Scheduled Worker** runs at 6am PT daily
2. Fetches `/api/weather` to get today's actual conditions
3. Constructs a prompt: *"Pixel-art panorama of El Segundo, {weather.condition}, {weather.temp}°F, {time-of-day}, ..."*
4. Calls OpenAI Images API (or Codex via a fallback) with credentials from env
5. Saves the PNG to Cloudflare R2 or commits to the repo via gh API
6. Generates a placeholder entry in `morning-hero.json` with `byline: "cc-auto"` and image URL — Mike or an agent can edit the editorial later

Cost: ~$0.05/day at the gpt-image-1 medium tier. ~$1.50/month. Negligible.

**Open questions before automating**:

- Should the prompt be hand-curated each day or formula-derived from weather?
- Should auto-entries have a flag like `byline: "auto"` so we can differentiate?
- Where do auto-entries get committed — the repo (every day a new commit) or a separate KV store the homepage reads at build time?

## Image specs

- ~1659×948 PNG (Codex `image_gen` default)
- Wide aspect ratio (~16:9)
- ~2-3 MB file size
- Pixel-art preferred for the canonical bar aesthetic; can experiment with Ghibli watercolor, Moebius, etc. on weekends or for special moments
- Path: `public/bar/daily/YYYY-MM-DD.png`

## Failure modes + fallbacks

If `morning-hero.json` has no entry for today, the homepage LEAD falls back to:

1. Ship-as-lead (latest entry in `recent-ships.json`)
2. Featured-block-as-lead (latest block with `featured: true`)
3. Last-resort: latest block of any kind

So if you forget to add an entry, no regression. The ship-as-lead path is the silent backup.
