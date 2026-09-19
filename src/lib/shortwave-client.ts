/**
 * Browser helpers shared by every Shortwave surface: the front-door panel,
 * the /shortwave feed, the room ticker and the /me shelf. Everything here
 * returns plain strings; callers put them on the page with textContent.
 */
export type LinkPreview = { url: string; kind: 'spotify' | 'youtube' | 'page'; site: string; title: string; description: string; image: string };

const ES = { lat: 33.9192, lon: -118.4165 };
export function milesFromES(lat: number, lon: number): number {
  const r = Math.PI / 180, dLat = (lat - ES.lat) * r, dLon = (lon - ES.lon) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(ES.lat * r) * Math.cos(lat * r) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export const ago = (iso: string): string => { const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); if (s < 45) return 'now'; if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; if (s < 86400 * 14) return `${Math.floor(s / 86400)}d`; return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };

const URL_RE = /https?:\/\/[^\s<]+/g;
const trimUrl = (u: string) => u.replace(/[),.;!?]+$/, '');
/** The first https link in a post, or ''. */
export function firstUrl(text: string): string { const m = String(text || '').match(URL_RE); const u = m ? trimUrl(m[0]) : ''; return u.startsWith('https://') ? u : ''; }
export const PIN_RE = /📍\s*(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/g;
export const placeLabel = (lat: number, lon: number): string => { const mi = milesFromES(lat, lon); return mi < 1 ? 'El Segundo' : `${Math.round(mi)} mi from El Segundo`; };

/**
 * One readable line: coordinates become a place, a link becomes its preview
 * title (when known) or a short host. `drop` removes the link entirely for
 * surfaces that draw a preview card beside the text.
 */
export function tidyText(text: string, preview?: LinkPreview | null, drop = false): string {
  let out = String(text || '').replace(PIN_RE, (_m, la, lo) => `📍 ${placeLabel(Number(la), Number(lo))}`);
  out = out.replace(URL_RE, (raw) => {
    const u = trimUrl(raw), tail = raw.slice(u.length);
    if (drop && preview && u === preview.url) return tail;
    if (preview && u === preview.url) return `${preview.title}${preview.kind === 'spotify' && preview.description ? ` · ${preview.description}` : ''}${tail}`;
    try { const p = new URL(u); return `${p.hostname.replace(/^www\./, '')}${p.pathname.length > 1 ? '/…' : ''}${tail}`; } catch { return u; }
  });
  return out.replace(/♫\s*$/u, '♫').replace(/\s{2,}/g, ' ').trim();
}

const memo = new Map<string, Promise<LinkPreview | null>>();
const STORE = 'pc:unfurl:v1:';
/** Look a link up once per page (and once per session); null when it has no preview. */
export function fetchPreview(url: string): Promise<LinkPreview | null> {
  if (!url) return Promise.resolve(null);
  const hit = memo.get(url); if (hit) return hit;
  const job = (async () => {
    try { const cached = sessionStorage.getItem(STORE + url); if (cached) return JSON.parse(cached) as LinkPreview | null; } catch { /* no storage */ }
    let value: LinkPreview | null = null;
    try {
      const res = await fetch(`/api/unfurl?url=${encodeURIComponent(url)}`, { headers: { accept: 'application/json' } });
      const data = await res.json();
      if (data?.ok && data.title) value = { url, kind: data.kind, site: String(data.site || ''), title: String(data.title), description: String(data.description || ''), image: String(data.image || '') };
      else if (res.status === 429) return null; // do not remember a rate limit
    } catch { return null; }
    try { sessionStorage.setItem(STORE + url, JSON.stringify(value)); } catch { /* fine */ }
    return value;
  })();
  memo.set(url, job);
  return job;
}

/** A preview card built from DOM nodes only. `compact` is the one-line form. */
export function previewCard(p: LinkPreview, compact = false): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = `sw-card sw-card--${p.kind}${compact ? ' sw-card--compact' : ''}`;
  a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow ugc';
  if (p.image) { const img = document.createElement('img'); img.src = p.image; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer'; img.addEventListener('error', () => img.remove(), { once: true }); a.append(img); }
  const body = document.createElement('span'); body.className = 'sw-card__body';
  const site = document.createElement('small'); site.textContent = `${p.kind === 'spotify' ? '♫ ' : p.kind === 'youtube' ? '▶ ' : ''}${p.site}`;
  const title = document.createElement('strong'); title.textContent = p.title;
  body.append(site, title);
  if (p.description && (!compact || p.kind === 'spotify')) { const d = document.createElement('span'); d.textContent = p.description; body.append(d); }
  a.append(body);
  return a;
}
