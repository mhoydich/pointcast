/**
 * sparrow-digest · aggregate.ts — v0.36 signals aggregation
 *
 * Mirrors the client-side logic in src/pages/sparrow/signals.astro
 * (Panels 1 + 3) so the cron digest carries the same "most co-saved"
 * and "channel distribution" readings the in-app /sparrow/signals
 * view does. Pure function: no I/O, no time-of-day, no persistent
 * state — caller supplies the newest kind-30078 events plus a block
 * lookup.
 *
 * Why a separate module: the web signals panel is ~600 lines of
 * ClientRouter + DOM machinery; this module strips that down to the
 * pure data shapes and a text/HTML formatter that fits inside an
 * HTML email.
 */

import type { NostrEvent } from './nostr';

export interface BlockLookupEntry {
  title: string;
  channel: string;
  channel_name?: string;
}

export type BlockLookup = Record<string, BlockLookupEntry>;

export interface SaverInfo {
  pubkey: string;
  alias?: string;
  displayName?: string;
}

export interface CoSavedRow {
  id: string;
  title: string;
  channel: string;
  channelName: string;
  count: number;
  savers: string[];            // pubkeys
  firstPicker: string;         // pubkey whose event has earliest created_at
  firstPickerAt: number;
}

export interface ChannelDistRow {
  channel: string;
  channelName: string;
  count: number;
  share: number;               // 0..1
}

export interface SignalsBundle {
  activeFriends: number;
  totalEvents: number;
  totalSaves: number;
  topCoSaved: CoSavedRow[];    // count ≥ 2, sorted desc
  channelDist: ChannelDistRow[]; // sorted desc
  window: {
    from?: number;
    to?: number;
  };
}

const DEFAULT_TOP = 5;
const DEFAULT_CHANNELS = 5;
const MIN_CO_SAVE = 2;

/**
 * Parse each newest-per-author kind-30078 event's content + aggregate
 * into the same shape the /sparrow/signals view computes.
 */
export function aggregate(
  newestPerAuthor: Map<string, NostrEvent>,
  lookup: BlockLookup,
  opts: { topN?: number; channelsTopN?: number } = {},
): SignalsBundle {
  const topN = opts.topN ?? DEFAULT_TOP;
  const channelsTopN = opts.channelsTopN ?? DEFAULT_CHANNELS;

  const counts = new Map<
    string,
    { count: number; savers: Set<string>; firstPicker: string; firstPickerAt: number }
  >();
  const channelCounts = new Map<string, number>();
  let totalSaves = 0;
  let totalEvents = 0;
  let earliest: number | undefined;
  let latest: number | undefined;

  for (const [pubkey, ev] of newestPerAuthor) {
    totalEvents += 1;
    if (earliest === undefined || ev.created_at < earliest) earliest = ev.created_at;
    if (latest === undefined || ev.created_at > latest) latest = ev.created_at;

    let body: unknown;
    try { body = JSON.parse(ev.content); } catch { continue; }
    const saved = (body as { saved?: { value?: unknown } })?.saved?.value;
    if (!Array.isArray(saved)) continue;

    const seenInThisList = new Set<string>();
    for (const raw of saved) {
      if (typeof raw !== 'string' || seenInThisList.has(raw)) continue;
      seenInThisList.add(raw);

      const slot = counts.get(raw) || {
        count: 0,
        savers: new Set<string>(),
        firstPicker: pubkey,
        firstPickerAt: ev.created_at,
      };
      slot.count += 1;
      slot.savers.add(pubkey);
      if (ev.created_at < slot.firstPickerAt) {
        slot.firstPicker = pubkey;
        slot.firstPickerAt = ev.created_at;
      }
      counts.set(raw, slot);
      totalSaves += 1;

      const meta = lookup[raw];
      if (meta) {
        channelCounts.set(meta.channel, (channelCounts.get(meta.channel) || 0) + 1);
      }
    }
  }

  const topCoSaved: CoSavedRow[] = Array.from(counts.entries())
    .filter(([, v]) => v.count >= MIN_CO_SAVE)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, topN)
    .map(([id, v]) => {
      const meta = lookup[id];
      return {
        id,
        title: meta?.title ?? 'unknown block',
        channel: meta?.channel ?? '—',
        channelName: meta?.channel_name || meta?.channel || '—',
        count: v.count,
        savers: Array.from(v.savers),
        firstPicker: v.firstPicker,
        firstPickerAt: v.firstPickerAt,
      };
    });

  const totalDist = Array.from(channelCounts.values()).reduce((a, b) => a + b, 0) || 1;
  const channelDist: ChannelDistRow[] = Array.from(channelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, channelsTopN)
    .map(([channel, count]) => {
      const meta = Object.values(lookup).find((m) => m.channel === channel);
      return {
        channel,
        channelName: meta?.channel_name || channel,
        count,
        share: count / totalDist,
      };
    });

  return {
    activeFriends: newestPerAuthor.size,
    totalEvents,
    totalSaves,
    topCoSaved,
    channelDist,
    window: { from: earliest, to: latest },
  };
}

// ─── Rendering helpers ──────────────────────────────────────────────
//
// Formatters for the email body. Pure functions that take the bundle
// + a few environment strings and return plain text / minimal HTML
// the MailChannels transport can carry.

export function renderTopCoSavedText(bundle: SignalsBundle): string {
  if (!bundle.topCoSaved.length) return '';
  const lines: string[] = ['Most co-saved (≥2 friends):'];
  for (const row of bundle.topCoSaved) {
    lines.push(`  · ×${row.count} · № ${row.id} — ${row.title} · ${row.channelName}`);
  }
  return lines.join('\n');
}

export function renderTopCoSavedHTML(bundle: SignalsBundle, origin: string): string {
  if (!bundle.topCoSaved.length) return '';
  const rows = bundle.topCoSaved.map((row) => `
    <tr>
      <td style="padding:6px 10px;border-left:2px solid #c8742a;">
        <span style="display:inline-block;min-width:36px;padding:2px 8px;border-radius:999px;background:rgba(200,116,42,0.14);color:#c8742a;font-family:ui-monospace,monospace;font-size:11px;font-weight:700;">×${row.count}</span>
        <span style="font-family:ui-monospace,monospace;font-size:11px;color:#888;margin-left:8px;">№ ${escapeHTML(row.id)}</span>
      </td>
      <td style="padding:6px 10px;">
        <a href="${origin}/sparrow/b/${encodeURIComponent(row.id)}" style="color:#1a1a2e;text-decoration:none;font-family:Georgia,serif;font-size:14px;">${escapeHTML(row.title)}</a>
        <span style="display:inline-block;margin-left:8px;font-family:ui-monospace,monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#888;">${escapeHTML(row.channelName)}</span>
      </td>
    </tr>`).join('');
  return `
  <h2 style="font-family:'Gloock',Georgia,serif;font-weight:400;font-size:20px;margin-top:32px;">Most co-saved</h2>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px;">
    ${rows}
  </table>`;
}

export function renderChannelDistText(bundle: SignalsBundle): string {
  if (!bundle.channelDist.length) return '';
  const lines: string[] = ['Channel distribution:'];
  for (const row of bundle.channelDist) {
    const pct = (row.share * 100).toFixed(0);
    lines.push(`  · ${row.channelName.padEnd(14)} ${String(row.count).padStart(3)} (${pct}%)`);
  }
  return lines.join('\n');
}

export function renderChannelDistHTML(bundle: SignalsBundle, origin: string): string {
  if (!bundle.channelDist.length) return '';
  const rows = bundle.channelDist.map((row) => {
    const pct = Math.round(row.share * 100);
    return `
    <tr>
      <td style="padding:4px 10px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;vertical-align:middle;width:120px;">${escapeHTML(row.channelName)}</td>
      <td style="padding:4px 10px;vertical-align:middle;">
        <div style="height:6px;border-radius:3px;background:rgba(200,116,42,0.2);">
          <div style="height:6px;border-radius:3px;background:#c8742a;width:${pct}%;"></div>
        </div>
      </td>
      <td style="padding:4px 10px;font-family:ui-monospace,monospace;font-size:11px;color:#555;width:60px;text-align:right;">${row.count} (${pct}%)</td>
    </tr>`;
  }).join('');
  return `
  <h2 style="font-family:'Gloock',Georgia,serif;font-weight:400;font-size:20px;margin-top:32px;">Channel distribution</h2>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px;">
    ${rows}
  </table>`;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c] ?? c);
}
