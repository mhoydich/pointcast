/**
 * /og/r/<spot>.png — the unfurl card for a Field Reports spot. A /r/courts
 * link dropped in the group chat shows what the courts say right now:
 * "1–4 waiting", then "3 agree · 7:39 AM", with the spot's signal bars.
 * With nothing live, the courts card shows the next Court Call and a spot
 * without one asks its question. Read straight from D1 (no extra hop through
 * /api/air), drawn with the shared unfurl frame, cached for a minute.
 * Named [spot].ts like og/live/[room].ts (the param arrives as "courts.png"):
 * the build's SEO pass drops any og:image no file or [param].ts serves.
 */
import { lightAt } from '../../../src/lib/unfurl/light.mjs';
import { unfurlClient } from '../../../src/lib/unfurl/client.mjs';
import { COLORS, clean, esc, fitTitle, framedCard, heavy } from '../../../src/lib/unfurl/cards.mjs';
import { AIR_CONFIG, courtCallLabel, mhzLabel } from '../../../src/lib/air.ts';
// @ts-ignore — plain module shared with the tests
import { laClock, supportLabel } from '../../_lib/air-reading.mjs';
import { liveReading, targetOf } from '../../_lib/air-store.ts';
import { bumpUnfurlCounter, cached, fallback, pngResponse, renderPng } from '../../_lib/og-render';

type Env = { AUTH_DB?: D1Database };
type Target = NonNullable<ReturnType<typeof targetOf>>;
type Reading = Awaited<ReturnType<typeof liveReading>>;

const { INK, FAINT, MONO, SANS, CX, CY, CW } = COLORS;

function signalBars(n: number, color: string): string {
  const x0 = CX + CW - 32 - 5 * 16;
  return Array.from({ length: 5 }, (_, i) => {
    const h = 8 + i * 5;
    return `<rect x="${x0 + i * 16}" y="${CY + 50 - h}" width="10" height="${h}" fill="${i < n ? color : '#D8D6CF'}" />`;
  }).join('');
}

function spotCard({ t, r, light, client, serial }: { t: Target; r: Reading | null; light: any; client: string; serial: number }): string {
  const { spot, cfg } = t;
  const color = spot.color; // the channel's 600, same as the frame's panel
  const mhz = mhzLabel(spot);
  const call = courtCallLabel(spot);
  const live = Boolean(r && r.status !== 'none');
  const at = (iso: string) => laClock(Date.parse(iso), { ampm: true }) as string;
  const big = live && r?.label ? r.label : call ? 'Court Call' : cfg.question;
  const line = live && r?.observedAt ? `${supportLabel(r.support)} · ${at(r.observedAt)}` : call ? `${call} on ${mhz}` : 'Nobody on the air right now.';
  const sub = live ? spot.name : r?.last ? `Last report ${at(r.last.observedAt)}: ${r.last.label}` : call ? cfg.question : spot.name;
  // Readings are short ("1–4 waiting"): one line, as big as fits. Anything long wraps.
  const words = clean(big);
  const title = words.length <= 30
    ? { size: Math.max(56, Math.min(128, Math.floor((CW - 64) / (words.length * 0.56)))), lines: [words] }
    : fitTitle(big, CW - 64, 2);
  const lead = Math.round(title.size * 1.04);
  const y0 = CY + 84 + Math.round(title.size * 0.8);
  const yLine = y0 + lead * (title.lines.length - 1) + 64;
  const body = `${title.lines.map((l: string, i: number) => `<text x="${CX + 28}" y="${y0 + i * lead}" font-family="${SANS}" font-size="${title.size}" font-weight="800" letter-spacing="-2" fill="${INK}"${heavy(title.size, INK, 800)}>${esc(l)}</text>`).join('')}
    <text x="${CX + 32}" y="${yLine}" font-family="${SANS}" font-size="36" font-weight="700" fill="${color}"${heavy(36, color, 700)}>${esc(clean(line))}</text>
    <text x="${CX + 32}" y="${yLine + 44}" font-family="${MONO}" font-size="18" font-weight="700" letter-spacing="1" fill="${FAINT}">${esc(clean(sub))}</text>`;
  const side = `${live ? `<text x="${CX + CW - 132}" y="${CY + 48}" text-anchor="end" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="3" fill="#C8102E">ON AIR</text>` : ''}${signalBars(live ? r?.bars ?? 0 : 0, color)}`;
  return framedCard({
    light,
    code: spot.channel,
    label: `${spot.name}: ${big}. ${line}`,
    kicker: `CH.${spot.channel} · ${spot.short} · ${mhz} MHZ`,
    side,
    body,
    quip: live ? 'Tap what you see. One tap, no account.' : 'Be the first on the air.',
    client,
    serial,
    extra: `DRAWN ${light.clock.label}`,
  });
}

async function handle({ request, env, params, waitUntil }: {
  request: Request; env: Env; params: Record<string, string | string[]>; waitUntil: (p: Promise<unknown>) => void;
}): Promise<Response> {
  const raw = String(Array.isArray(params.spot) ? params.spot[0] : params.spot ?? '');
  const t = targetOf(AIR_CONFIG, raw.replace(/\.png$/, ''));
  if (!t) return new Response('Not found', { status: 404 });
  const now = Date.now();
  const client = unfurlClient(request.headers.get('user-agent') ?? '');
  const key = `https://pointcast.xyz/og/r/${t.spot.id}.png?m=${Math.floor(now / 60_000)}&c=${client || 'none'}`;
  try {
    return await cached(request, key, waitUntil, async () => {
      // No store or a slow one still draws a card: the Court Call, or the question.
      const r = env.AUTH_DB ? await liveReading(env.AUTH_DB, t, now).catch(() => null) : null;
      // Only real unfurlers are counted; browsers and the wall don't bump the stamp.
      const serial = client ? await bumpUnfurlCounter(env) : 0;
      const svg = spotCard({ t, r, light: lightAt(new Date(now), ''), client, serial });
      return pngResponse(await renderPng(svg), 60, { 'X-PointCast-Card': `air:${t.spot.id}` });
    });
  } catch {
    return fallback(request, 'render');
  }
}

export const onRequestGet: PagesFunction<Env> = (ctx) => handle(ctx as any);
// Unfurl crawlers (iMessage, Slack, LinkedIn) probe with HEAD before they GET.
export const onRequestHead: PagesFunction<Env> = (ctx) => handle(ctx as any);
