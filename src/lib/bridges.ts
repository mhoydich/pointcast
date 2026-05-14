/**
 * Outbound bridges — map SignalEvents to other-network post shapes.
 *
 * Sprint 9 of the live-artifacts arc · Distribution #3.
 *
 * pointcast.xyz publishes its canonical event stream at
 * /signal-feed.json. To distribute beyond the webring, we re-publish
 * that stream in formats other networks already consume:
 *
 *   - RSS / Atom — universal subscriber format, works in any reader
 *   - Bluesky / ATProto — record shape compatible with bsky.social
 *     posts (post text + facets)
 *   - Farcaster — cast shape compatible with hub.farcaster.xyz casts
 *     (text + embeds + parent_url)
 *
 * Static-build constraint: pointcast.xyz is SSG. We GENERATE the
 * payloads here; an external cron worker (Cloudflare Worker, GitHub
 * Action, or a small node script run by Codex) picks up the payloads
 * and posts them to the actual networks. See docs/bridges.md for the
 * worker spec.
 *
 * Why payloads-as-files instead of an inline posting client:
 *   1. Auth — Bluesky + Farcaster both need credentials Codex holds
 *   2. Idempotency — file-based payloads + cron worker can dedupe
 *      against already-posted state on the worker side
 *   3. Auditable — the payloads are checked into the deployed site,
 *      so we can see exactly what gets bridged outward
 *
 * The shapes here track the v1 contracts at the partner networks.
 */
import type { SignalEvent } from './signal-contract';

// ─── ATProto / Bluesky ──────────────────────────────────────────────

/**
 * A Bluesky post in the at://app.bsky.feed.post shape. Worker code
 * authenticates against bsky.social, then POSTs each record to the
 * `com.atproto.repo.createRecord` endpoint with `collection:
 * app.bsky.feed.post` and this payload as `record`.
 */
export interface BlueskyRecord {
  $type: 'app.bsky.feed.post';
  text: string;
  createdAt: string;
  langs?: string[];
  facets?: BlueskyFacet[];
  /** External link card — Bluesky's preview embed. */
  embed?: {
    $type: 'app.bsky.embed.external';
    external: { uri: string; title: string; description: string };
  };
}

export interface BlueskyFacet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{ $type: 'app.bsky.richtext.facet#link'; uri: string }>;
}

/**
 * Build a Bluesky record from a SignalEvent. Returns null for kinds
 * we don't bridge (presence_change is too chatty for a public feed).
 */
export function toBlueskyRecord(event: SignalEvent, nodeHome: string): BlueskyRecord | null {
  if (event.kind === 'presence_change') return null;

  const url = event.href ? new URL(event.href, nodeHome).toString() : nodeHome;
  const text = `${event.headline}\n\n${url}`;
  const titleByKind: Record<SignalEvent['kind'], string> = {
    block_published: 'New block on PointCast',
    room_opened: 'A room just opened',
    room_closed: 'A room just closed',
    verb_fired: 'Someone did a thing',
    presence_change: 'Presence update',
    federation_subscribed: 'New node on the webring',
    ship_landed: 'New feature shipped',
  };

  // Build the link facet — Bluesky needs UTF-8 byte offsets, not chars.
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const urlBytes = encoder.encode(url);
  const byteStart = textBytes.length - urlBytes.length;
  const byteEnd = textBytes.length;

  return {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: event.at,
    langs: ['en'],
    facets: [
      {
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
      },
    ],
    embed: {
      $type: 'app.bsky.embed.external',
      external: {
        uri: url,
        title: titleByKind[event.kind] ?? 'PointCast',
        description: event.headline,
      },
    },
  };
}

// ─── Farcaster ───────────────────────────────────────────────────────

/**
 * A Farcaster cast in the hub-API shape. Worker code authenticates
 * with the user's app key and submits this via
 * `submitMessage` (FID + signer required).
 */
export interface FarcasterCast {
  type: 'cast';
  text: string;
  embeds: Array<{ url: string }>;
  parentUrl?: string;
  mentions?: number[];
  mentionsPositions?: number[];
}

/** Pointcast.xyz is registered as a channel on Farcaster's pointcast parent_url. */
const FARCASTER_PARENT = 'https://pointcast.xyz';

export function toFarcasterCast(event: SignalEvent, nodeHome: string): FarcasterCast | null {
  if (event.kind === 'presence_change') return null;

  const url = event.href ? new URL(event.href, nodeHome).toString() : nodeHome;
  // Farcaster casts cap at 320 bytes. Trim the headline if needed; the
  // URL goes in embeds, not body text, so we don't double-charge.
  const room = event.room ? ` · /r/${event.room}` : '';
  let text = `${event.headline}${room}`;
  const MAX_BYTES = 320;
  const enc = new TextEncoder();
  if (enc.encode(text).length > MAX_BYTES) {
    // Trim by char until "<trimmed>…" fits under the byte cap.
    // '…' is 3 UTF-8 bytes; budget the rest for the trimmed prefix.
    const ellipsisBytes = enc.encode('…').length;
    let prefix = text;
    while (enc.encode(prefix).length + ellipsisBytes > MAX_BYTES && prefix.length > 0) {
      prefix = prefix.slice(0, -1);
    }
    text = prefix + '…';
  }

  return {
    type: 'cast',
    text,
    embeds: [{ url }],
    parentUrl: FARCASTER_PARENT,
  };
}

// ─── RSS / Atom ──────────────────────────────────────────────────────

/**
 * Build an Atom feed XML from a list of SignalEvents.
 *
 * Atom (not RSS 2.0) because: a) all major readers handle it, b) Atom
 * has a more reasonable spec (timezones, well-formed XML), c) it's
 * the recommended format for new feeds in 2026.
 */
export function toAtomFeed(opts: {
  nodeId: string;
  nodeHome: string;
  title: string;
  description: string;
  generatedAt: string;
  events: SignalEvent[];
}): string {
  const { nodeId, nodeHome, title, description, generatedAt, events } = opts;
  const selfUrl = `${nodeHome.replace(/\/$/, '')}/signal-feed.atom.xml`;

  const entries = events
    .filter((e) => e.kind !== 'presence_change')
    .map((e) => {
      const href = e.href ? new URL(e.href, nodeHome).toString() : nodeHome;
      return `  <entry>
    <id>tag:${nodeId},2026:${esc(e.id)}</id>
    <title type="text">${esc(e.headline)}</title>
    <link rel="alternate" href="${esc(href)}" />
    <published>${esc(e.at)}</published>
    <updated>${esc(e.at)}</updated>
    <category term="${esc(e.kind)}" />
    ${e.room ? `<category term="room:${esc(e.room)}" />` : ''}
    <summary type="text">${esc(e.headline)}</summary>
  </entry>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>tag:${nodeId},2026:signal-feed</id>
  <title>${esc(title)}</title>
  <subtitle>${esc(description)}</subtitle>
  <link rel="self" href="${esc(selfUrl)}" />
  <link rel="alternate" href="${esc(nodeHome)}" />
  <updated>${esc(generatedAt)}</updated>
  <author><name>${esc(nodeId)}</name></author>
${entries}
</feed>
`;
}

function esc(s: string): string {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Filter events down to the ones safe to broadcast outward. */
export function bridgeableEvents(events: SignalEvent[]): SignalEvent[] {
  return events.filter((e) => e.kind !== 'presence_change');
}
