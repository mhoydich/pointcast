/**
 * url-classifier — heuristic detection of what a pasted URL is for.
 *
 * Mike pastes a link in /drop. We classify it so cc knows what kind of
 * Block (or other surface) it should become on the next sprint tick.
 * Conservative: when unsure, we return 'unknown' and let cc pick at
 * processing time — never auto-publish without classification.
 *
 * Categories:
 *   listen   → Spotify, Apple Music, SoundCloud, Bandcamp, Tidal, YouTube Music
 *   watch    → YouTube, Vimeo, Twitch, Loom, Instagram reel
 *   product  → shop.getgoodfeels.com, Shopify-like patterns, /products/, /shop/
 *   location → Google Maps, Apple Maps, Foursquare, OSM, what3words
 *   collab   → linked from a known collaborator's domain (uses the registry)
 *   article  → Substack, Medium, Mirror, generic blog
 *   social   → Twitter/X, Farcaster, Threads, Bluesky
 *   feed     → RSS / JSON Feed / Atom file extensions
 *   unknown  → fallback
 */

export type DropKind =
  | 'listen' | 'watch' | 'product' | 'location'
  | 'collab' | 'article' | 'social' | 'feed' | 'unknown';

export interface Classification {
  kind: DropKind;
  vendor?: string;     // 'spotify', 'youtube', 'getgoodfeels', etc.
  /** Suggested PointCast block type that maps best. */
  blockType?: 'LISTEN' | 'WATCH' | 'NOTE' | 'LINK' | 'VISIT' | 'MINT';
  /** Suggested PointCast channel code. */
  channel?: 'SPN' | 'GF' | 'CRT' | 'GDN' | 'ESC' | 'FD' | 'VST' | 'BTL' | 'FCT';
  /** Optional embed-friendly URL (e.g. spotify track → spotify.com/embed/track). */
  embed?: string;
  /** YouTube/Vimeo id when applicable. */
  videoId?: string;
  /** Reason for the classification — useful for debugging + transparency. */
  rationale?: string;
}

/** Hostnames we know about, sorted by category. */
const LISTEN_HOSTS  = ['open.spotify.com', 'spotify.com', 'music.apple.com', 'soundcloud.com', 'bandcamp.com', 'tidal.com', 'music.youtube.com'];
const WATCH_HOSTS   = ['youtube.com', 'youtu.be', 'm.youtube.com', 'vimeo.com', 'twitch.tv', 'loom.com', 'instagram.com'];
const PRODUCT_HOSTS = ['shop.getgoodfeels.com', 'getgoodfeels.com'];
const LOCATION_HOSTS= ['maps.google.com', 'goo.gl', 'maps.apple.com', 'foursquare.com', 'openstreetmap.org', 'what3words.com'];
const SOCIAL_HOSTS  = ['twitter.com', 'x.com', 'warpcast.com', 'threads.net', 'bsky.app'];
const ARTICLE_HOSTS = ['substack.com', 'medium.com', 'mirror.xyz'];

function host(u: URL): string { return u.hostname.replace(/^www\./, '').toLowerCase(); }
function matchesAny(h: string, list: string[]): boolean { return list.some((x) => h === x || h.endsWith('.' + x)); }

export function classifyUrl(input: string, opts: { knownCollabHosts?: string[] } = {}): Classification {
  let u: URL;
  try { u = new URL(input.trim()); } catch {
    return { kind: 'unknown', rationale: 'not-a-url' };
  }
  const h = host(u);

  // 1. Watch — extract video id when possible
  if (matchesAny(h, WATCH_HOSTS)) {
    let videoId: string | undefined;
    if (h === 'youtu.be') videoId = u.pathname.slice(1) || undefined;
    else if (h.includes('youtube.com')) {
      if (u.pathname === '/watch') videoId = u.searchParams.get('v') || undefined;
      else {
        const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([\w-]+)/);
        if (m) videoId = m[1];
      }
    } else if (h.includes('vimeo.com')) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) videoId = m[1];
    }
    const vendor = h.includes('youtube') || h === 'youtu.be' ? 'youtube'
                 : h.includes('vimeo') ? 'vimeo'
                 : h.includes('twitch') ? 'twitch'
                 : h.includes('loom') ? 'loom'
                 : h.includes('instagram') ? 'instagram'
                 : 'video';
    const embed = vendor === 'youtube' && videoId ? `https://www.youtube.com/embed/${videoId}`
                : vendor === 'vimeo' && videoId ? `https://player.vimeo.com/video/${videoId}`
                : undefined;
    return {
      kind: 'watch',
      vendor,
      blockType: 'WATCH',
      channel: 'SPN',  // default; cc can swap to GDN/CRT/ESC based on title
      videoId,
      embed,
      rationale: `host matches ${vendor} watch list`,
    };
  }

  // 2. Listen — music platforms
  if (matchesAny(h, LISTEN_HOSTS)) {
    const vendor = h.includes('spotify') ? 'spotify'
                 : h.includes('apple') ? 'apple-music'
                 : h.includes('soundcloud') ? 'soundcloud'
                 : h.includes('bandcamp') ? 'bandcamp'
                 : h.includes('tidal') ? 'tidal'
                 : 'music';
    let embed: string | undefined;
    if (vendor === 'spotify') {
      // open.spotify.com/track/abc → open.spotify.com/embed/track/abc
      const m = u.pathname.match(/^\/(track|album|playlist|episode|show|artist)\/([\w-]+)/);
      if (m) embed = `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
    }
    return {
      kind: 'listen',
      vendor,
      blockType: 'LISTEN',
      channel: 'SPN',
      embed,
      rationale: `host matches ${vendor} listen list`,
    };
  }

  // 3. Product — Good Feels first, then shop heuristics
  if (matchesAny(h, PRODUCT_HOSTS) || /\/(products|product|shop|store)\//.test(u.pathname)) {
    const isGoodFeels = matchesAny(h, ['getgoodfeels.com']);
    return {
      kind: 'product',
      vendor: isGoodFeels ? 'getgoodfeels' : h,
      blockType: 'LINK',
      channel: 'GF',
      rationale: isGoodFeels ? 'Good Feels product' : 'shop URL pattern',
    };
  }

  // 4. Location
  if (matchesAny(h, LOCATION_HOSTS) || /\/maps?\//.test(u.pathname) || /\/place\//.test(u.pathname)) {
    return {
      kind: 'location',
      vendor: h,
      blockType: 'VISIT',
      channel: 'VST',
      rationale: 'maps / place URL',
    };
  }

  // 5. Collab — passed-in list of known collaborator hosts wins early
  const collabHosts = (opts.knownCollabHosts || []).map((x) => x.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase());
  if (collabHosts.some((c) => h === c || h.endsWith('.' + c))) {
    return { kind: 'collab', vendor: h, blockType: 'LINK', channel: 'FD', rationale: 'collaborator domain' };
  }

  // 6. Social
  if (matchesAny(h, SOCIAL_HOSTS)) {
    return { kind: 'social', vendor: h, blockType: 'LINK', channel: 'FD', rationale: 'social network URL' };
  }

  // 7. Article
  if (matchesAny(h, ARTICLE_HOSTS) || /\/(blog|posts?|essays?|articles?)\//.test(u.pathname)) {
    return { kind: 'article', vendor: h, blockType: 'READ', channel: 'FD', rationale: 'blog / article URL' };
  }

  // 8. Feed
  if (/\.(rss|xml|atom|json)$/.test(u.pathname) || /\/(feed|rss|atom)\/?$/.test(u.pathname)) {
    return { kind: 'feed', vendor: h, blockType: 'LINK', channel: 'FD', rationale: 'feed URL pattern' };
  }

  // 9. Unknown — leave it for cc to decide
  return { kind: 'unknown', vendor: h, blockType: 'LINK', channel: 'FD', rationale: 'no rule matched' };
}

// Re-export type for downstream consumers
export type { Classification as DropClassification };
