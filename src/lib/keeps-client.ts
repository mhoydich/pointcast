/**
 * Keeps — the visitor's shelf of Shortwave posts and links.
 *
 * Signed in: the shelf lives on the account (/api/keeps) and shows on /me.
 * Not signed in: it lives in this browser (localStorage `pc:keeps`) and is
 * carried into the account the first time a signed-in page loads it.
 * Every change fires `pc:keeps:change` with the new list.
 */
export type Keep = { id: string; kind: 'post' | 'link'; keptAt: string; text: string; who: string; noun: number; postId: string; postAt: string; source: 'bar' | 'chain' | 'web'; url: string; title: string; site: string; image: string; description: string; note: string };
export type KeepDraft = Partial<Keep> & { kind: 'post' | 'link' };
export type ShelfMode = 'account' | 'browser';

const LOCAL = 'pc:keeps';
let mode: ShelfMode | null = null;
let cache: Keep[] = [];
let loading: Promise<{ keeps: Keep[]; mode: ShelfMode }> | null = null;

export const keepId = (d: KeepDraft): string => (d.kind === 'post' ? `post:${d.postId || ''}` : `link:${d.url || ''}`);
const readLocal = (): Keep[] => { try { const v = JSON.parse(localStorage.getItem(LOCAL) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const writeLocal = (items: Keep[]) => { try { localStorage.setItem(LOCAL, JSON.stringify(items.slice(0, 300))); } catch { /* storage may be off */ } };
const announce = () => window.dispatchEvent(new CustomEvent('pc:keeps:change', { detail: { keeps: cache, mode } }));
const complete = (d: KeepDraft): Keep => ({ id: keepId(d), kind: d.kind, keptAt: d.keptAt || new Date().toISOString(), text: d.text || '', who: d.who || '', noun: Number(d.noun) || 0, postId: d.postId || '', postAt: d.postAt || '', source: d.source || 'web', url: d.url || '', title: d.title || '', site: d.site || '', image: d.image || '', description: d.description || '', note: d.note || '' });

async function api(method: 'GET' | 'POST' | 'DELETE', body?: unknown): Promise<{ status: number; keeps?: Keep[] }> {
  const res = await fetch('/api/keeps', { method, credentials: 'include', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json().catch(() => null);
  return { status: res.status, keeps: data?.ok && Array.isArray(data.keeps) ? data.keeps : undefined };
}

export function loadKeeps(force = false): Promise<{ keeps: Keep[]; mode: ShelfMode }> {
  if (loading && !force) return loading;
  loading = (async () => {
    try {
      const first = await api('GET');
      if (first.keeps) {
        mode = 'account'; cache = first.keeps;
        const local = readLocal();
        if (local.length) { const merged = await api('POST', { items: local }); if (merged.keeps) { cache = merged.keeps; writeLocal([]); } }
      } else { mode = 'browser'; cache = readLocal(); }
    } catch { mode = 'browser'; cache = readLocal(); }
    announce();
    return { keeps: cache, mode: mode as ShelfMode };
  })();
  return loading;
}
export const isKept = (id: string): boolean => cache.some((k) => k.id === id);
export const shelfMode = (): ShelfMode | null => mode;

export async function addKeep(draft: KeepDraft): Promise<boolean> {
  await loadKeeps();
  const item = complete(draft);
  if (!item.id || item.id.endsWith(':')) return false;
  if (mode === 'account') { const r = await api('POST', { item }); if (!r.keeps) return false; cache = r.keeps; }
  else { cache = [item, ...cache.filter((k) => k.id !== item.id)]; writeLocal(cache); }
  announce(); return true;
}
export async function removeKeep(id: string): Promise<boolean> {
  await loadKeeps();
  if (mode === 'account') { const r = await api('DELETE', { id }); if (!r.keeps) return false; cache = r.keeps; }
  else { cache = cache.filter((k) => k.id !== id); writeLocal(cache); }
  announce(); return true;
}
/** Toggle and report the new state. */
export async function toggleKeep(draft: KeepDraft): Promise<boolean> {
  await loadKeeps();
  const id = keepId(draft);
  if (isKept(id)) { await removeKeep(id); return false; }
  return addKeep(draft);
}

const SVG = 'http://www.w3.org/2000/svg';
/** A bookmark toggle wired to the shelf. Stays in sync across every surface on the page. */
export function keepButton(draft: KeepDraft, label = 'this'): HTMLButtonElement {
  const id = keepId(draft);
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'sw-keep'; b.dataset.keepId = id;
  const svg = document.createElementNS(SVG, 'svg'); svg.setAttribute('viewBox', '0 0 16 16'); svg.setAttribute('width', '14'); svg.setAttribute('height', '14'); svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path'); path.setAttribute('d', 'M4 2.5h8v11.2l-4-2.9-4 2.9z'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.4'); path.setAttribute('stroke-linejoin', 'round');
  svg.append(path); b.append(svg);
  const paint = () => { const on = isKept(id); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Kept on your shelf. Click to let it go.' : 'Keep on your shelf'; b.setAttribute('aria-label', on ? `Remove ${label} from your shelf` : `Keep ${label} on your shelf`); };
  paint();
  b.addEventListener('click', async (ev) => { ev.preventDefault(); ev.stopPropagation(); b.disabled = true; try { await toggleKeep(draft); } finally { b.disabled = false; paint(); } });
  window.addEventListener('pc:keeps:change', () => { if (b.isConnected) paint(); });
  return b;
}
