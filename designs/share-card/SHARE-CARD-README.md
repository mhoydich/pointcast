# PointCast Share-Card Generator

Turn any PointCast milestone or moment into a tidy **1024 × 1024 PNG** ready for iMessage, Warpcast, Twitter, and Instagram. Pure client-side Canvas 2D — no server roundtrip, no external font loading at render time.

---

## File Map

```
src/
  lib/
    share-card.ts          ← Core generator + Canvas primitives
    share-card-presets.ts  ← 5 layout functions
  components/
    ShareCardModal.tsx     ← React drop-in button + modal
    ShareCardButton.astro  ← Astro drop-in component (custom element)
```

---

## Quick Start

### React

```tsx
import { ShareCardButton } from "@/components/ShareCardModal";

<ShareCardButton
  event={{
    type: "user_milestone",
    title: "You just hit 100 drums!",
    stat: "100",
    subtitle: "Keep the beat going.",
    date: "Apr 17, 2026",
  }}
  label="Share"
/>
```

### Astro

```astro
---
import ShareCardButton from "@/components/ShareCardButton.astro";
---

<ShareCardButton
  type="mint_receipt"
  title="You minted Visit Noun"
  stat="342"
  noun-id="342"
  date="Apr 17, 2026"
  label="Share Mint"
/>
```

### Headless (generate blob directly)

```ts
import { generateShareCard } from "@/lib/share-card";

const blob = await generateShareCard({
  type: "platform_milestone",
  title: "PointCast reached 10,000 total drums",
  stat: "10,000",
  date: "Apr 17, 2026",
});

// blob is a PNG Blob — use however you like
const url = URL.createObjectURL(blob);
```

---

## ShareCardEvent API

```ts
interface ShareCardEvent {
  type: EventType;      // required — selects the layout preset
  title: string;        // required — primary headline
  stat: string;         // required — hero number (shown large)
  subtitle?: string;    // optional — supporting text
  nounId?: number;      // optional — Noun ID → fetches SVG from noun.pics
  date?: string;        // optional — shown in bottom-left watermark
  meta?: Record<string, string>; // optional — key/value pairs for receipt/recap
}

type EventType =
  | "user_milestone"
  | "mint_receipt"
  | "leaderboard"
  | "platform_milestone"
  | "weekly_recap";
```

---

## 5 Layout Presets

| Preset | `type` value | Best for | Hero element |
|---|---|---|---|
| **User Milestone** | `user_milestone` | 100 / 1k / 10k drum counts | Giant centred stat + DRUMS label |
| **Mint Receipt** | `mint_receipt` | Collect success screen | Left text + right Noun SVG art |
| **Leaderboard** | `leaderboard` | Daily top-drummer card | Accent left stripe + large name + stat |
| **Platform Milestone** | `platform_milestone` | Community-wide drum count | Full-bleed typographic poster |
| **Weekly Recap** | `weekly_recap` | End-of-week summary | 3-column stat grid + meta table |

---

## Design Tokens

All cards share the PointCast design system:

| Token | Value | Usage |
|---|---|---|
| `BG` | `#f6f2e8` | Paper/cream background |
| `INK` | `#1a1813` | Primary text |
| `ACCENT` | `#c94d2c` | Stats, badges, wordmark "POINT" |
| `MUTED` | `#8a8070` | Labels, watermark, subtitles |
| `BORDER` | `#d8d0bc` | Rules, dividers, frames |
| `SERIF` | `Georgia, "Times New Roman", serif` | Display / titles |
| `MONO` | `"JetBrains Mono", "Fira Mono", monospace` | Labels, meta, wordmark |
| `SANS` | `"Helvetica Neue", Arial, sans-serif` | Body text |

Tokens are exported from `share-card.ts` as `TOKENS` for use in custom presets.

---

## Canvas Primitives

`share-card.ts` exports these drawing helpers for use in custom presets:

| Function | Signature | Purpose |
|---|---|---|
| `drawBackground` | `(ctx)` | Paper fill + subtle grain texture |
| `drawWordmark` | `(ctx, y?)` | POINT/CAST wordmark + rule |
| `drawWatermark` | `(ctx, date?)` | Date left + pointcast.xyz right |
| `drawHeroStat` | `(ctx, stat, cx, cy, opts?)` | Large centred number |
| `drawTitle` | `(ctx, text, x, y, opts?)` | Word-wrapped title, returns final y |
| `drawSubtitle` | `(ctx, text, x, y, opts?)` | Supporting text, returns final y |
| `drawMetaRow` | `(ctx, label, value, x, y)` | Mono key/value row |
| `drawBadge` | `(ctx, label, x, y)` | Filled accent pill |
| `drawNounArt` | `(ctx, nounId, x, y, size)` | Fetch + draw Noun SVG from noun.pics |
| `drawRule` | `(ctx, x, y, width, color?)` | Thin horizontal rule |

---

## Integration Examples

### DrumModule — Milestone Share Button

Wire a share button into the drum success handler at 100 / 1k / 10k milestones:

```tsx
// DrumModule.tsx
import { useState } from "react";
import { ShareCardButton } from "@/components/ShareCardModal";
import type { ShareCardEvent } from "@/lib/share-card";

const MILESTONES = [100, 1000, 10000];

export function DrumModule() {
  const [drumCount, setDrumCount] = useState(0);
  const [shareEvent, setShareEvent] = useState<ShareCardEvent | null>(null);

  function handleDrum() {
    const next = drumCount + 1;
    setDrumCount(next);

    if (MILESTONES.includes(next)) {
      setShareEvent({
        type: "user_milestone",
        title: `You just hit ${next.toLocaleString()} drums!`,
        stat: next.toLocaleString(),
        subtitle: "Keep the beat going — you're on a roll.",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }
  }

  return (
    <div>
      <button onClick={handleDrum}>Drum ({drumCount})</button>
      {shareEvent && (
        <ShareCardButton
          event={shareEvent}
          label={`Share ${shareEvent.stat} drums!`}
        />
      )}
    </div>
  );
}
```

### Collect Success Screen — Mint Receipt

```tsx
// CollectSuccessScreen.tsx
import { ShareCardButton } from "@/components/ShareCardModal";
import type { ShareCardEvent } from "@/lib/share-card";

interface Props {
  noun: { id: number; name: string };
  txHash: string;
}

export function CollectSuccessScreen({ noun, txHash }: Props) {
  const event: ShareCardEvent = {
    type: "mint_receipt",
    title: `You minted ${noun.name}`,
    stat: String(noun.id),
    nounId: noun.id,
    subtitle: "Collected on PointCast",
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    meta: {
      "Noun": `#${noun.id}`,
      "Network": "Base",
      "Tx": `${txHash.slice(0, 6)}…${txHash.slice(-4)}`,
    },
  };

  return (
    <div>
      <h2>Minted!</h2>
      <p>You collected {noun.name}</p>
      <ShareCardButton event={event} label="Share Mint" />
    </div>
  );
}
```

### Weekly Recap (server-triggered or cron)

```tsx
// WeeklyRecapCard.tsx
import { ShareCardButton } from "@/components/ShareCardModal";

export function WeeklyRecapCard({ week }: { week: WeekStats }) {
  return (
    <ShareCardButton
      event={{
        type: "weekly_recap",
        title: `Week of ${week.label}`,
        stat: week.drums.toLocaleString(),
        date: week.dateRange,
        meta: {
          "Drums":    week.drums.toLocaleString(),
          "Visitors": String(week.visitors),
          "Top Noun": `#${week.topNounId}`,
          "New Users": String(week.newUsers),
          "Mints":    String(week.mints),
        },
      }}
      label="Share Recap"
    />
  );
}
```

---

## Adding a New Preset

1. **Define the new `EventType`** in `share-card.ts`:
   ```ts
   export type EventType =
     | "user_milestone"
     | "mint_receipt"
     | "leaderboard"
     | "platform_milestone"
     | "weekly_recap"
     | "your_new_type"; // ← add here
   ```

2. **Add the layout function** in `share-card-presets.ts`:
   ```ts
   async function layoutYourNewType(
     ctx: CanvasRenderingContext2D,
     event: ShareCardEvent
   ): Promise<void> {
     drawWordmark(ctx);
     drawBadge(ctx, "YOUR BADGE", PAD, 108);
     drawHeroStat(ctx, event.stat, SIZE / 2, 460);
     drawTitle(ctx, event.title, PAD, 560, { size: 48 });
     drawWatermark(ctx, event.date);
   }
   ```

3. **Register it in the dispatcher**:
   ```ts
   export async function drawLayout(ctx, event) {
     switch (event.type) {
       // ...existing cases...
       case "your_new_type":
         return layoutYourNewType(ctx, event);
     }
   }
   ```

4. **Use it** — the `generateShareCard` function will route to your layout automatically.

---

## Noun Art

Noun artwork is fetched at render time from [noun.pics](https://noun.pics):

```
GET https://noun.pics/{id}.svg
```

The SVG is drawn with `imageSmoothingEnabled = false` to preserve the pixel-art aesthetic. If the fetch fails (network error, invalid ID), a graceful fallback placeholder is drawn instead.

**CORS note:** `noun.pics` serves SVGs with permissive CORS headers, so cross-origin fetch works in the browser without a proxy.

---

## Share Flow

When the user clicks the share button:

1. `generateShareCard(event)` renders the 1024 × 1024 canvas and returns a `Blob`.
2. The modal opens with the PNG preview.
3. Three actions are available:
   - **Save** — triggers `<a download>` for a local PNG file.
   - **Copy** — writes to `ClipboardItem` (`image/png`); falls back to opening the image in a new tab.
   - **Share** — calls `navigator.share({ files: [File] })` (Web Share API Level 2); falls back to Save on unsupported browsers.

---

## Browser Support

| Feature | Chrome | Firefox | Safari | iOS Safari |
|---|---|---|---|---|
| Canvas 2D / `toBlob` | ✓ | ✓ | ✓ | ✓ |
| `ClipboardItem` (Copy) | ✓ | ✓ 127+ | ✓ | ✓ |
| Web Share API (Share) | ✓ | — | ✓ | ✓ |
| `roundRect` | ✓ 99+ | ✓ 112+ | ✓ 15.4+ | ✓ 15.4+ |

The Share button degrades gracefully to Save on browsers without Web Share API support.

---

## Performance

Card generation is synchronous canvas drawing except for the optional `drawNounArt` call, which does a single `fetch` to `noun.pics`. Typical render time on a modern device is **< 50 ms** without Noun art, **< 300 ms** with (network-dependent).

The `Math.random` override in `generateShareCard` seeds the grain texture deterministically from the event data, so repeated calls for the same event produce visually identical cards.
