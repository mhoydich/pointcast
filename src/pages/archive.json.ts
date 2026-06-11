/**
 * /archive.json — machine-readable Archive Wave 2.
 *
 * Codex review 2026-05-07 (PR 5/5 — final follow-up): the HTML archive
 * page has month markers, jump nav, and three density tiers. The JSON
 * was just `byMonth: { ... }` with stripped block entries. This pass
 * brings the JSON to parity:
 *
 *  - `months`         — array (ordered desc) with rich per-month metadata:
 *                       key, label, shortLabel, count, tier, latest +
 *                       oldest blocks, ISO dateRange, anchor href.
 *  - `tier` per block — full | compact | deep, picked the same way the
 *                       HTML page picks them (≤30 days / 30-90 days /
 *                       >90 days from now).
 *  - `byMonth`        — kept for backward compatibility (existing agents
 *                       may already consume this shape).
 *
 * Query filters (?since=YYYY-MM, ?from=YYYY-MM&to=YYYY-MM, ?channel,
 * ?type, ?tier) are queued for a follow-up sprint — the project is
 * static-build-only (no SSR adapter), so per-request filtering needs
 * either the @astrojs/cloudflare adapter or a sibling Pages Function
 * that reads pre-baked data. For now agents can pull the full payload
 * (~80 KB) and filter client-side; that's what /archive does too.
 *
 * Sibling: /archive (HTML), /blocks.json (full bodies), /sitemap-blocks.xml.
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import type { APIRoute } from 'astro';

function tierForDate(d: Date, now: Date): 'full' | 'compact' | 'deep' {
  const ageMs = +now - +d;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  if (ageMs <= monthMs)     return 'full';
  if (ageMs <= 3 * monthMs) return 'compact';
  return 'deep';
}

function monthLabels(d: Date) {
  const long = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(d).toUpperCase();
  const short = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(d).toUpperCase();
  return { label: long, shortLabel: short };
}

export const GET: APIRoute = async () => {
  const all = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const now = new Date();

  // ── Build entries ──────────────────────────────────────────────────────
  const entries = all.map(b => {
    const d = b.data.timestamp;
    const ch = CHANNELS[b.data.channel];
    return {
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      channel: { code: ch.code, slug: ch.slug },
      type: b.data.type,
      title: b.data.title,
      timestamp: d.toISOString(),
      tier: tierForDate(d, now),
    };
  });

  // ── byMonth (backward-compat) ──────────────────────────────────────────
  const byMonth: Record<string, typeof entries> = {};
  for (const e of entries) {
    const d = new Date(e.timestamp);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = byMonth[key] ?? [];
    byMonth[key].push(e);
  }

  // ── months[] (Wave 2 — rich metadata, ordered desc) ────────────────────
  interface MonthSummary {
    key: string;
    label: string;
    shortLabel: string;
    count: number;
    tier: 'full' | 'compact' | 'deep';
    dateRange: { from: string; to: string };
    latest: { id: string; title: string; channel: string; timestamp: string } | null;
    oldest: { id: string; title: string; channel: string; timestamp: string } | null;
    href:  string;       // direct-link to the HTML mile marker
    jsonHref: string;    // direct-link to a single-month JSON slice
  }
  const monthKeys = Object.keys(byMonth).sort((a, b) => (a < b ? 1 : -1));
  const months: MonthSummary[] = monthKeys.map(key => {
    const arr = byMonth[key];
    const latest = arr[0];
    const oldest = arr[arr.length - 1];
    const sample = new Date(latest.timestamp);
    const labels = monthLabels(sample);
    return {
      key,
      label: labels.label,
      shortLabel: labels.shortLabel,
      count: arr.length,
      // Group tier follows the latest block's tier — same rule as the HTML page.
      tier: tierForDate(new Date(latest.timestamp), now),
      dateRange: { from: oldest.timestamp, to: latest.timestamp },
      latest: { id: latest.id, title: latest.title, channel: latest.channel.code, timestamp: latest.timestamp },
      oldest: { id: oldest.id, title: oldest.title, channel: oldest.channel.code, timestamp: oldest.timestamp },
      href:     `https://pointcast.xyz/archive#m-${key}`,
      jsonHref: `https://pointcast.xyz/archive.json?from=${key}&to=${key}`,
    };
  });

  // ── Aggregate counts across the FILTERED set ──────────────────────────
  const channelCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const tierCounts: Record<string, number> = { full: 0, compact: 0, deep: 0 };
  for (const e of entries) {
    channelCounts[e.channel.code] = (channelCounts[e.channel.code] ?? 0) + 1;
    typeCounts[e.type]             = (typeCounts[e.type]            ?? 0) + 1;
    tierCounts[e.tier] = (tierCounts[e.tier] ?? 0) + 1;
  }

  const payload = {
    $schema: 'https://pointcast.xyz/BLOCKS.md',
    total: entries.length,
    updatedAt: now.toISOString(),
    since: entries.length > 0 ? entries[entries.length - 1].timestamp.slice(0, 10) : null,
    latest: entries.length > 0 ? entries[0].timestamp.slice(0, 10) : null,
    counts: {
      total: entries.length,
      channels: channelCounts,
      types: typeCounts,
      tiers: tierCounts,
    },
    months,
    byMonth: Object.fromEntries(monthKeys.map(k => [k, byMonth[k]])),
    queriesAvailable: {
      note: 'Query-filtered slices (?since/?from/?to/?channel/?type/?tier) are queued. The project is static-build-only; per-request filtering needs either an SSR adapter or a sibling Pages Function. For now, pull the full payload and filter client-side.',
      plannedKeys: ['since', 'from', 'to', 'channel', 'type', 'tier'],
    },
    links: {
      human:    'https://pointcast.xyz/archive',
      flat:     'https://pointcast.xyz/blocks.json',
      sitemap:  'https://pointcast.xyz/sitemap-blocks.xml',
      rss:      'https://pointcast.xyz/feed.xml',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
