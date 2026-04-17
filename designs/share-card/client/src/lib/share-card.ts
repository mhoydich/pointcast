/**
 * share-card.ts — PointCast Share-Card Generator
 *
 * Design System:
 *   Background  : #f6f2e8  (paper/cream)
 *   Ink         : #1a1813  (deep warm black)
 *   Accent      : #c94d2c  (terracotta/warm red)
 *   Serif       : Georgia, "Times New Roman", serif  (Lora-style fallback)
 *   Mono        : "JetBrains Mono", "Fira Mono", "Courier New", monospace
 *   Sans        : "Helvetica Neue", Arial, sans-serif  (Mondwest-style fallback)
 *
 * Output: 1024×1024 PNG Blob, pure client-side Canvas 2D.
 */

import { drawLayout } from "./share-card-presets";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType =
  | "user_milestone"   // "You just hit 100 drums!"
  | "mint_receipt"     // "You minted Visit Noun #342"
  | "leaderboard"      // "Today's top drummer is kana with 847 drums"
  | "platform_milestone" // "PointCast reached 10,000 total drums"
  | "weekly_recap";    // "Week of April 13, 2026: 1,247 drums…"

export interface ShareCardEvent {
  type: EventType;
  /** Primary headline shown large */
  title: string;
  /** The hero number/stat — shown very large */
  stat: string;
  /** Optional supporting text below the stat */
  subtitle?: string;
  /** Noun ID to embed artwork from noun.pics (e.g. 342) */
  nounId?: number;
  /** ISO date string or human-readable date label */
  date?: string;
  /** Additional key/value pairs for weekly recap grid */
  meta?: Record<string, string>;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

export const TOKENS = {
  SIZE: 1024,
  BG: "#f6f2e8",
  INK: "#1a1813",
  ACCENT: "#c94d2c",
  MUTED: "#8a8070",
  BORDER: "#d8d0bc",
  SERIF: 'Georgia, "Times New Roman", serif',
  MONO: '"JetBrains Mono", "Fira Mono", "Courier New", monospace',
  SANS: '"Helvetica Neue", Arial, sans-serif',
  PAD: 64,
} as const;

// ─── Canvas Primitives ────────────────────────────────────────────────────────

/** Fill the entire canvas with the paper background. */
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  const { SIZE, BG } = TOKENS;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle grain texture via tiny repeated noise dots
  ctx.save();
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#8a7060";
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

/** Draw the PointCast wordmark at the top. */
export function drawWordmark(ctx: CanvasRenderingContext2D, y = 72): void {
  const { PAD, ACCENT, INK, MONO } = TOKENS;

  // "POINT" in accent, "CAST" in ink — mono uppercase
  ctx.save();
  ctx.font = `700 28px ${MONO}`;
  ctx.letterSpacing = "4px";

  ctx.fillStyle = ACCENT;
  ctx.fillText("POINT", PAD, y);
  const pointW = ctx.measureText("POINT").width + 4 * 5; // approx letter-spacing

  ctx.fillStyle = INK;
  ctx.fillText("CAST", PAD + pointW, y);

  // Thin rule under wordmark
  ctx.strokeStyle = TOKENS.BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y + 14);
  ctx.lineTo(TOKENS.SIZE - PAD, y + 14);
  ctx.stroke();
  ctx.restore();
}

/** Draw the bottom watermark: date left, pointcast.xyz right. */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  date?: string
): void {
  const { SIZE, PAD, MUTED, MONO } = TOKENS;
  const y = SIZE - PAD + 18;

  ctx.save();
  ctx.font = `400 18px ${MONO}`;
  ctx.fillStyle = MUTED;

  // Thin rule above watermark
  ctx.strokeStyle = TOKENS.BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, SIZE - PAD);
  ctx.lineTo(SIZE - PAD, SIZE - PAD);
  ctx.stroke();

  if (date) ctx.fillText(date, PAD, y);

  const url = "pointcast.xyz";
  const urlW = ctx.measureText(url).width;
  ctx.fillText(url, SIZE - PAD - urlW, y);
  ctx.restore();
}

/** Draw the hero stat — the biggest number on the card. */
export function drawHeroStat(
  ctx: CanvasRenderingContext2D,
  stat: string,
  cx: number,
  cy: number,
  opts: { color?: string; size?: number } = {}
): void {
  const { ACCENT, SERIF } = TOKENS;
  const color = opts.color ?? ACCENT;
  const size = opts.size ?? 160;

  ctx.save();
  ctx.font = `700 ${size}px ${SERIF}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stat, cx, cy);
  ctx.restore();
}

/** Draw a multi-line title string, wrapping at maxWidth. Returns final y. */
export function drawTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    maxWidth?: number;
    size?: number;
    color?: string;
    align?: CanvasTextAlign;
    font?: string;
    lineHeight?: number;
  } = {}
): number {
  const {
    maxWidth = TOKENS.SIZE - TOKENS.PAD * 2,
    size = 52,
    color = TOKENS.INK,
    align = "left",
    font = TOKENS.SERIF,
    lineHeight = size * 1.25,
  } = opts;

  ctx.save();
  ctx.font = `700 ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";

  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  ctx.restore();
  return currentY;
}

/** Draw subtitle / supporting text. Returns final y. */
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { size?: number; color?: string; align?: CanvasTextAlign } = {}
): number {
  const {
    size = 28,
    color = TOKENS.MUTED,
    align = "left",
  } = opts;

  ctx.save();
  ctx.font = `400 ${size}px ${TOKENS.SANS}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();
  return y + size * 1.5;
}

/** Draw a key/value meta row (mono, small). */
export function drawMetaRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number
): void {
  const { MUTED, INK, MONO } = TOKENS;
  ctx.save();
  ctx.font = `400 20px ${MONO}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label.toUpperCase(), x, y);

  ctx.fillStyle = INK;
  ctx.font = `600 20px ${MONO}`;
  const lw = ctx.measureText(label.toUpperCase()).width;
  ctx.fillText(value, x + lw + 12, y);
  ctx.restore();
}

/** Draw an accent pill/badge (e.g. "MILESTONE"). */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number
): void {
  const { ACCENT, MONO } = TOKENS;
  ctx.save();
  ctx.font = `700 16px ${MONO}`;
  ctx.letterSpacing = "3px";
  const tw = ctx.measureText(label).width + 3 * label.length;
  const ph = 10, pv = 6;

  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.roundRect(x, y, tw + ph * 2, 28 + pv * 2, 4);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + ph, y + pv + 1);
  ctx.restore();
}

/** Fetch and draw a Noun SVG from noun.pics into the canvas. */
export async function drawNounArt(
  ctx: CanvasRenderingContext2D,
  nounId: number,
  x: number,
  y: number,
  size: number
): Promise<void> {
  try {
    const url = `https://noun.pics/${nounId}.svg`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`noun.pics ${res.status}`);
    const svgText = await res.text();

    // Convert SVG text → data URL → HTMLImageElement
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const dataUrl = URL.createObjectURL(blob);

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Pixelated rendering honours the Nouns pixel-art aesthetic
        ctx.save();
        (ctx as unknown as { imageSmoothingEnabled: boolean }).imageSmoothingEnabled = false;

        // Draw with a subtle border frame
        ctx.strokeStyle = TOKENS.BORDER;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        URL.revokeObjectURL(dataUrl);
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  } catch {
    // Graceful fallback: draw a placeholder box
    ctx.save();
    ctx.strokeStyle = TOKENS.BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.font = `400 18px ${TOKENS.MONO}`;
    ctx.fillStyle = TOKENS.MUTED;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Noun #${nounId}`, x + size / 2, y + size / 2);
    ctx.restore();
  }
}

/** Draw a thin decorative horizontal rule. */
export function drawRule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color = TOKENS.BORDER
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
  ctx.restore();
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Generate a 1024×1024 share card PNG for the given event.
 *
 * @example
 * const blob = await generateShareCard({
 *   type: "user_milestone",
 *   title: "You just hit 100 drums!",
 *   stat: "100",
 *   subtitle: "Keep the beat going.",
 *   date: "Apr 17, 2026",
 * });
 * const url = URL.createObjectURL(blob);
 */
export async function generateShareCard(
  event: ShareCardEvent
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = TOKENS.SIZE;
  canvas.height = TOKENS.SIZE;
  const ctx = canvas.getContext("2d")!;

  // Seed the random grain with a deterministic-ish value so previews
  // are stable across re-renders of the same event.
  Math.random = (() => {
    let s = event.stat.length * 13 + event.title.length * 7;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  })();

  drawBackground(ctx);
  await drawLayout(ctx, event);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });
}
