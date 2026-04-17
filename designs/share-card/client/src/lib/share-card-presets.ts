/**
 * share-card-presets.ts — 5 Layout Presets for PointCast Share Cards
 *
 * Each preset receives the full CanvasRenderingContext2D and ShareCardEvent,
 * then composes the card using primitives from share-card.ts.
 *
 * Preset map:
 *   user_milestone    → layoutUserMilestone
 *   mint_receipt      → layoutMintReceipt
 *   leaderboard       → layoutLeaderboard
 *   platform_milestone → layoutPlatformMilestone
 *   weekly_recap      → layoutWeeklyRecap
 */

import type { ShareCardEvent } from "./share-card";
import {
  drawWordmark,
  drawWatermark,
  drawHeroStat,
  drawTitle,
  drawSubtitle,
  drawMetaRow,
  drawBadge,
  drawNounArt,
  drawRule,
} from "./share-card";

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function drawLayout(
  ctx: CanvasRenderingContext2D,
  event: ShareCardEvent
): Promise<void> {
  switch (event.type) {
    case "user_milestone":
      return layoutUserMilestone(ctx, event);
    case "mint_receipt":
      return layoutMintReceipt(ctx, event);
    case "leaderboard":
      return layoutLeaderboard(ctx, event);
    case "platform_milestone":
      return layoutPlatformMilestone(ctx, event);
    case "weekly_recap":
      return layoutWeeklyRecap(ctx, event);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Note: TOKENS values are inlined below to avoid circular init issues.
// SIZE=1024, PAD=64, INNER=896
const SIZE = 1024;
const PAD = 64;
const INNER = SIZE - PAD * 2;
const ACCENT = "#c94d2c";
const INK = "#1a1813";
const MUTED = "#8a8070";
const BORDER = "#d8d0bc";
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = '"JetBrains Mono", "Fira Mono", "Courier New", monospace';
const SANS = '"Helvetica Neue", Arial, sans-serif';

// ─── 1. User Milestone ────────────────────────────────────────────────────────
/**
 * Layout: centered composition, giant stat number, celebratory badge.
 * Used for: "You just hit 100 drums!"
 *
 *  ┌─────────────────────────────┐
 *  │  POINTCAST          (top)   │
 *  │                             │
 *  │   [MILESTONE]               │
 *  │                             │
 *  │         100                 │  ← giant accent stat
 *  │       DRUMS                 │
 *  │                             │
 *  │  You just hit 100 drums!    │
 *  │  Keep the beat going.       │
 *  │                             │
 *  │  Apr 17, 2026  pointcast.xyz│
 *  └─────────────────────────────┘
 */
async function layoutUserMilestone(
  ctx: CanvasRenderingContext2D,
  event: ShareCardEvent
): Promise<void> {
  drawWordmark(ctx);
  drawBadge(ctx, "MILESTONE", PAD, 108);

  // Giant stat — vertically centered in the upper half
  const statY = 310;
  drawHeroStat(ctx, event.stat, SIZE / 2, statY, { size: 220 });

  // "DRUMS" label under stat
  ctx.save();
  ctx.font = `400 32px ${MONO}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "8px";
  ctx.fillText("DRUMS", SIZE / 2, statY + 120);
  ctx.restore();

  drawRule(ctx, PAD, 510, INNER);

  // Title below rule
  const titleY = drawTitle(ctx, event.title, SIZE / 2, 540, {
    size: 48,
    align: "center",
    maxWidth: INNER - 40,
  });

  if (event.subtitle) {
    drawSubtitle(ctx, event.subtitle, SIZE / 2, titleY + 8, {
      align: "center",
      size: 26,
    });
  }

  drawWatermark(ctx, event.date);
}

// ─── 2. Mint Receipt ──────────────────────────────────────────────────────────
/**
 * Layout: left column text + right column Noun art.
 * Used for: "You minted Visit Noun #342"
 *
 *  ┌─────────────────────────────┐
 *  │  POINTCAST          (top)   │
 *  │                             │
 *  │  [MINT]      ┌──────────┐   │
 *  │              │  Noun    │   │
 *  │  #342        │  Art     │   │
 *  │              │  SVG     │   │
 *  │  You minted  └──────────┘   │
 *  │  Visit Noun                 │
 *  │  #342                       │
 *  │                             │
 *  │  Apr 17, 2026  pointcast.xyz│
 *  └─────────────────────────────┘
 */
async function layoutMintReceipt(
  ctx: CanvasRenderingContext2D,
  event: ShareCardEvent
): Promise<void> {
  drawWordmark(ctx);

  const artSize = 380;
  const artX = SIZE - PAD - artSize;
  const artY = 120;

  // Fetch noun art in parallel with text drawing
  const nounPromise = event.nounId != null
    ? drawNounArt(ctx, event.nounId, artX, artY, artSize)
    : Promise.resolve();

  drawBadge(ctx, "MINT", PAD, 120);

  // Big noun number
  ctx.save();
  ctx.font = `700 110px ${SERIF}`;
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`#${event.stat}`, PAD, 168);
  ctx.restore();

  const textMaxW = artX - PAD - 40;

  const titleEndY = drawTitle(ctx, event.title, PAD, 320, {
    size: 42,
    maxWidth: textMaxW,
  });

  if (event.subtitle) {
    drawSubtitle(ctx, event.subtitle, PAD, titleEndY + 8, {
      size: 24,
      color: MUTED,
    });
  }

  // Receipt-style divider
  drawRule(ctx, PAD, artY + artSize + 20, INNER);

  // Meta rows below art
  if (event.meta) {
    let metaY = artY + artSize + 40;
    for (const [k, v] of Object.entries(event.meta)) {
      drawMetaRow(ctx, k, v, PAD, metaY);
      metaY += 36;
    }
  }

  await nounPromise;
  drawWatermark(ctx, event.date);
}

// ─── 3. Leaderboard ───────────────────────────────────────────────────────────
/**
 * Layout: asymmetric — accent stripe on left, content on right.
 * Used for: "Today's top drummer is kana with 847 drums"
 *
 *  ┌─────────────────────────────┐
 *  │  POINTCAST          (top)   │
 *  │ ┌──┐                        │
 *  │ │  │  [LEADERBOARD]         │
 *  │ │  │  kana                  │  ← name large
 *  │ │  │  847                   │  ← stat accent
 *  │ │  │  drums today           │
 *  │ └──┘                        │
 *  │  Apr 17, 2026  pointcast.xyz│
 *  └─────────────────────────────┘
 */
async function layoutLeaderboard(
  ctx: CanvasRenderingContext2D,
  event: ShareCardEvent
): Promise<void> {
  drawWordmark(ctx);

  // Left accent stripe
  ctx.save();
  ctx.fillStyle = ACCENT;
  ctx.fillRect(PAD, 110, 8, SIZE - 110 - PAD - 20);
  ctx.restore();

  const contentX = PAD + 40;

  drawBadge(ctx, "LEADERBOARD", contentX, 120);

  // Name / handle — large serif
  const titleEndY = drawTitle(ctx, event.title, contentX, 192, {
    size: 56,
    maxWidth: INNER - 48,
  });

  drawRule(ctx, contentX, titleEndY + 16, INNER - 48);

  // Hero stat
  drawHeroStat(ctx, event.stat, contentX + 220, titleEndY + 160, {
    size: 200,
    color: ACCENT,
  });

  // Stat label
  ctx.save();
  ctx.font = `400 28px ${MONO}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "4px";
  ctx.fillText("DRUMS TODAY", contentX, titleEndY + 280);
  ctx.restore();

  if (event.subtitle) {
    drawSubtitle(ctx, event.subtitle, contentX, titleEndY + 330, {
      size: 24,
    });
  }

  drawWatermark(ctx, event.date);
}

// ─── 4. Platform Milestone ────────────────────────────────────────────────────
/**
 * Layout: full-bleed typographic poster — stat dominates.
 * Used for: "PointCast reached 10,000 total drums"
 *
 *  ┌─────────────────────────────┐
 *  │  POINTCAST          (top)   │
 *  │                             │
 *  │  PointCast reached          │
 *  │                             │
 *  │       10,000                │  ← massive
 *  │                             │
 *  │       total drums           │
 *  │                             │
 *  │  Apr 17, 2026  pointcast.xyz│
 *  └─────────────────────────────┘
 */
async function layoutPlatformMilestone(
  ctx: CanvasRenderingContext2D,
  event: ShareCardEvent
): Promise<void> {
  drawWordmark(ctx);

  // Faint large background number for depth
  ctx.save();
  ctx.font = `700 340px ${SERIF}`;
  ctx.fillStyle = "#f6f2e8";
  ctx.globalAlpha = 0.06;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(event.stat, SIZE / 2, SIZE / 2 + 20);
  ctx.restore();

  drawBadge(ctx, "PLATFORM MILESTONE", PAD, 108);

  // Pre-stat label
  ctx.save();
  ctx.font = `400 34px ${SANS}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("PointCast reached", SIZE / 2, 180);
  ctx.restore();

  // Giant stat
  drawHeroStat(ctx, event.stat, SIZE / 2, 460, { size: 180 });

  // Post-stat label
  ctx.save();
  ctx.font = `400 36px ${SANS}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "2px";
  ctx.fillText("total drums", SIZE / 2, 570);
  ctx.restore();

  drawRule(ctx, PAD, 650, INNER);

  if (event.subtitle) {
    drawSubtitle(ctx, event.subtitle, SIZE / 2, 672, {
      align: "center",
      size: 26,
    });
  }

  drawWatermark(ctx, event.date);
}

// ─── 5. Weekly Recap ─────────────────────────────────────────────────────────
/**
 * Layout: editorial grid — header, three stat blocks, meta table.
 * Used for: "Week of April 13, 2026: 1,247 drums · 89 visitors · top noun #127"
 *
 *  ┌─────────────────────────────┐
 *  │  POINTCAST          (top)   │
 *  │  [WEEKLY RECAP]             │
 *  │  Week of April 13, 2026     │
 *  │ ┌──────┬──────┬──────┐      │
 *  │ │1,247 │  89  │ #127 │      │
 *  │ │drums │visit │noun  │      │
 *  │ └──────┴──────┴──────┘      │
 *  │  ─────────────────────      │
 *  │  key  value  key  value     │
 *  │  Apr 17, 2026  pointcast.xyz│
 *  └─────────────────────────────┘
 */
async function layoutWeeklyRecap(
  ctx: CanvasRenderingContext2D,
  event: ShareCardEvent
): Promise<void> {
  drawWordmark(ctx);
  drawBadge(ctx, "WEEKLY RECAP", PAD, 108);

  // Week label
  ctx.save();
  ctx.font = `400 30px ${MONO}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(event.title, PAD, 168);
  ctx.restore();

  drawRule(ctx, PAD, 220, INNER);

  // Three stat blocks from meta or parse from title
  const stats = parseWeeklyStats(event);
  const blockW = INNER / 3;
  const blockY = 248;

  stats.forEach((s, i) => {
    const bx = PAD + i * blockW;

    // Vertical divider between blocks
    if (i > 0) {
      ctx.save();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, blockY);
      ctx.lineTo(bx, blockY + 240);
      ctx.stroke();
      ctx.restore();
    }

    // Stat number
    ctx.save();
    ctx.font = `700 72px ${SERIF}`;
    ctx.fillStyle = ACCENT;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(s.value, bx + blockW / 2, blockY + 20);
    ctx.restore();

    // Stat label
    ctx.save();
    ctx.font = `400 22px ${MONO}`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.letterSpacing = "3px";
    ctx.fillText(s.label.toUpperCase(), bx + blockW / 2, blockY + 110);
    ctx.restore();
  });

  drawRule(ctx, PAD, blockY + 240, INNER);

  // Meta table
  if (event.meta) {
    let metaY = blockY + 268;
    const entries = Object.entries(event.meta);
    const half = Math.ceil(entries.length / 2);

    entries.slice(0, half).forEach(([k, v], i) => {
      drawMetaRow(ctx, k, v, PAD, metaY + i * 40);
    });
    entries.slice(half).forEach(([k, v], i) => {
      drawMetaRow(ctx, k, v, PAD + INNER / 2, metaY + i * 40);
    });
  } else if (event.subtitle) {
    drawSubtitle(ctx, event.subtitle, PAD, blockY + 268, { size: 24 });
  }

  drawWatermark(ctx, event.date);
}

// ─── Utility: parse weekly stats ─────────────────────────────────────────────

interface WeeklyStat {
  value: string;
  label: string;
}

function parseWeeklyStats(event: ShareCardEvent): WeeklyStat[] {
  // If meta has explicit stats use them
  if (event.meta) {
    const entries = Object.entries(event.meta).slice(0, 3);
    if (entries.length > 0) {
      return entries.map(([label, value]) => ({ label, value }));
    }
  }

  // Fallback: parse "1,247 drums · 89 visitors · top noun #127"
  const parts = event.title.split("·").map((p) => p.trim());
  return parts.slice(0, 3).map((part) => {
    const match = part.match(/^([\d,#]+)\s+(.+)$/);
    if (match) return { value: match[1], label: match[2] };
    return { value: event.stat, label: part };
  });
}
