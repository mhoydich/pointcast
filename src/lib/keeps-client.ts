/** Shared private shelf. Browser saves move to an account only after an explicit import. */
export type Keep = { id: string; kind: 'post' | 'link'; keptAt: string; text: string; who: string; noun: number; postId: string; postAt: string; source: 'bar' | 'chain' | 'web'; url: string; title: string; site: string; image: string; description: string; note: string; version?: number; itemId?: string };
export type KeepDraft = Partial<Keep> & { kind: 'post' | 'link' };
export type ShelfMode = 'account' | 'browser' | 'unavailable';
export type KeepsShelf = { keeps: Keep[]; mode: ShelfMode; userId?: string };
export type KeepsImport = { acceptedIds: string[]; remaining: KeepDraft[]; complete: boolean };

type ApiResult = { status: number; keeps?: Keep[]; userId?: string; importProtocol?: number; acceptedIds?: string[]; reason?: string };
const LOCAL = 'pc:keeps';
const CAP = 300;
let mode: ShelfMode | null = null;
let cache: Keep[] = [];
let account: string | undefined;
let expectedAccount: string | null | undefined;
let protocol = 0;
let error: string | null = null;
let generation = 0;
let controller = new AbortController();
let loading: Promise<KeepsShelf> | null = null;
let queue: Promise<unknown> = Promise.resolve();

export const keepId = (d: KeepDraft): string => d.kind === 'post' ? `post:${d.postId || ''}` : `link:${d.url || ''}`;
const snapshot = (): KeepsShelf => ({ keeps: [...cache], mode: mode ?? 'unavailable', ...(account ? { userId: account } : {}) });
const announce = () => window.dispatchEvent(new CustomEvent('pc:keeps:change', { detail: { ...snapshot(), error } }));
export const keepsError = (): string | null => error;
export const shelfMode = (): ShelfMode | null => mode;
export const isKept = (id: string): boolean => cache.some((k) => k.id === id);

function readLocal(): Keep[] | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(LOCAL) || '[]');
    if (!Array.isArray(value) || value.some((item) => !item || typeof item !== 'object' || typeof item.id !== 'string')) throw new Error('invalid shelf');
    return value as Keep[];
  } catch {
    error = 'Could not read this browser’s saves. They have not been replaced.';
    return null;
  }
}
export const browserKeeps = (): Keep[] => readLocal() ?? [];
function writeLocal(items: Keep[]): boolean {
  try { localStorage.setItem(LOCAL, JSON.stringify(items)); return true; }
  catch { error = 'Browser storage is unavailable or full. This change was not saved.'; return false; }
}
const complete = (d: KeepDraft): Keep => ({ id: keepId(d), kind: d.kind, keptAt: d.keptAt || new Date().toISOString(), text: d.text || '', who: d.who || '', noun: Number(d.noun) || 0, postId: d.postId || '', postAt: d.postAt || '', source: d.source || 'web', url: d.url || '', title: d.title || '', site: d.site || '', image: d.image || '', description: d.description || '', note: d.note || '' });

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}
async function api(method: 'GET' | 'POST' | 'DELETE' | 'PATCH', signal: AbortSignal, body?: unknown): Promise<ApiResult> {
  const request = new AbortController();
  const abort = () => request.abort();
  if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const res = await fetch('/api/keeps', { method, signal: request.signal, credentials: 'include', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json().catch(() => null);
    return { status: res.status, keeps: res.ok && data?.ok && Array.isArray(data.keeps) ? data.keeps : undefined, userId: typeof data?.userId === 'string' ? data.userId : undefined, importProtocol: data?.importProtocol, acceptedIds: Array.isArray(data?.acceptedIds) ? data.acceptedIds.filter((id: unknown) => typeof id === 'string') : undefined, reason: data?.reason };
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', abort); }
}
function unavailable(message = 'Your account shelf is unavailable. Try again; nothing was saved to this browser.'): void {
  mode = 'unavailable'; cache = []; account = undefined; protocol = 0; error = message;
}
function guest(): void {
  account = undefined; protocol = 0;
  const local = readLocal();
  mode = local ? 'browser' : 'unavailable'; cache = local ?? [];
}
function failure(result: ApiResult): void {
  if (result.status === 401) {
    guest();
    error = 'Your session ended. Sign in again to save to your account.';
  } else if (result.reason === 'account-changed' || (result.keeps && account && result.userId !== account)) {
    unavailable('Your account changed. Reload your shelf before continuing.');
  } else error = result.reason === 'version-conflict' || result.reason === 'conflict' ? 'This save changed in another tab. Reload it before making changes.' : result.reason === 'limit-reached' ? 'Your shelf is full. Remove a save before adding another.' : 'Could not save that change. Try again.';
  announce();
}
function matching(result: ApiResult, userId: string | undefined): boolean {
  return Boolean(result.keeps) && (!userId || result.userId === userId);
}

export function loadKeeps(force = false): Promise<KeepsShelf> {
  if (loading && !force) return loading;
  if (!force && mode !== null) return Promise.resolve(snapshot());
  const token = generation, signal = controller.signal;
  const pending = serialized(async () => {
    if (token !== generation) return snapshot();
    error = null;
    try {
      const result = await api('GET', signal);
      if (token !== generation) return snapshot();
      if (result.keeps && (expectedAccount === undefined || expectedAccount === result.userId)) {
        mode = 'account'; account = result.userId; cache = result.keeps; protocol = result.importProtocol ?? 0;
      } else if (result.status === 401) guest();
      else unavailable();
    } catch { if (token !== generation) return snapshot(); unavailable(); }
    announce();
    return snapshot();
  });
  loading = pending;
  void pending.finally(() => { if (loading === pending) loading = null; });
  return pending;
}

async function mutate(body: Record<string, unknown>, method: 'POST' | 'DELETE' | 'PATCH', localChange: (items: Keep[]) => Keep[] | null): Promise<boolean> {
  const token = generation;
  await loadKeeps();
  if (token !== generation) return false;
  const intendedMode = mode, intendedAccount = account;
  return serialized(async () => {
    if (token !== generation || mode !== intendedMode || account !== intendedAccount) return false;
    error = null;
    if (mode === 'account') {
      const userId = account;
      try {
        const result = await api(method, controller.signal, { ...body, ...(userId ? { expectedUserId: userId } : {}) });
        if (token !== generation) return false;
        if (!matching(result, userId)) { failure(result); return false; }
        cache = result.keeps!;
      } catch { if (token !== generation) return false; error = 'Could not save that change. Try again.'; announce(); return false; }
    } else if (mode === 'browser') {
      const local = readLocal();
      if (!local) { announce(); return false; }
      const next = localChange(local);
      if (!next || !writeLocal(next)) { announce(); return false; }
      cache = next;
    } else { error = 'The shelf is unavailable. Retry before saving.'; announce(); return false; }
    announce(); return true;
  });
}
export async function addKeep(draft: KeepDraft): Promise<boolean> {
  const item = complete(draft);
  if (!item.id || item.id.endsWith(':')) { error = 'Choose a post or link to keep.'; return false; }
  if (item.kind === 'link') {
    try { const u = new URL(item.url); if (u.protocol !== 'https:' || u.username || u.password || item.url.length > 600) throw new Error('invalid url'); }
    catch { error = 'Enter an HTTPS link of at most 600 characters without embedded credentials.'; return false; }
  }
  return mutate({ item }, 'POST', (items) => {
    if (items.some((k) => k.id === item.id)) return items;
    if (items.length >= CAP) { error = 'Your browser shelf is full. Remove a save before adding another.'; return null; }
    return [item, ...items];
  });
}
export function removeKeep(id: string, version = cache.find((item) => item.id === id)?.version, expectedItemId = cache.find((item) => item.id === id)?.itemId): Promise<boolean> {
  return mutate({ id, ...(version !== undefined ? { version } : {}), ...(expectedItemId ? { expectedItemId } : {}) }, 'DELETE', (items) => items.filter((k) => k.id !== id));
}
export function updateKeep(id: string, fields: { title?: string; note?: string }, version = 1, expectedItemId = cache.find((item) => item.id === id)?.itemId): Promise<boolean> {
  return mutate({ id, ...fields, version, ...(expectedItemId ? { expectedItemId } : {}) }, 'PATCH', (items) => items.map((item) => item.id === id ? { ...item, ...fields } : item));
}
/** Toggle and report the resulting saved state; failures retain the previous state. */
export async function toggleKeep(draft: KeepDraft): Promise<boolean> {
  const token = generation;
  await loadKeeps();
  if (token !== generation) return false;
  const id = keepId(draft);
  if (isKept(id)) return await removeKeep(id) ? false : isKept(id);
  return addKeep(draft);
}

async function importItems(items: KeepDraft[], fromBrowser: boolean): Promise<KeepsImport> {
  const token = generation;
  const pending = items.map((item) => ({ ...item, id: item.id || keepId(item) }));
  const acceptedIds = new Set<string>();
  const result = (): KeepsImport => ({ acceptedIds: [...acceptedIds], remaining: pending.filter((item) => !acceptedIds.has(item.id)), complete: pending.every((item) => acceptedIds.has(item.id)) });
  await loadKeeps();
  if (token !== generation) return result();
  return serialized(async () => {
    if (token !== generation) return result();
    error = null;
    if (mode !== 'account' || !account) { error = 'Sign in and check the destination account before importing.'; announce(); return result(); }
    if (protocol !== 2) { error = 'Safe import is not available yet. Your browser saves are unchanged.'; announce(); return result(); }
    const userId = account;
    for (let offset = 0; offset < pending.length; offset += 100) {
      if (token !== generation) return result();
      const batch = pending.slice(offset, offset + 100);
      try {
        const response = await api('POST', controller.signal, { importProtocol: 2, items: batch, expectedUserId: userId });
        if (token !== generation) return result();
        if (!matching(response, userId) || response.importProtocol !== 2 || !response.acceptedIds) { failure(response); break; }
        const sent = new Set(batch.map((item) => item.id));
        const acknowledged = new Set(response.acceptedIds.filter((id) => sent.has(id)));
        cache = response.keeps!;
        if (fromBrowser && acknowledged.size) {
          const local = readLocal();
          if (!local) break;
          // A second tab may have edited or re-saved an item during the request.
          // Only the exact acknowledged version may leave the browser shelf.
          const versions = new Map(batch.map((item) => [item.id, JSON.stringify(item)]));
          const remaining = local.filter((item) => !acknowledged.has(item.id) || JSON.stringify(item) !== versions.get(item.id));
          if (!writeLocal(remaining)) break;
        }
        acknowledged.forEach((id) => acceptedIds.add(id));
        if (acknowledged.size < sent.size) error = 'Some saves could not be imported. They remain available to retry.';
        announce();
      } catch { if (token !== generation) return result(); error = 'Import stopped. Unacknowledged saves are unchanged; retry to continue.'; break; }
    }
    if (token === generation) announce();
    return result();
  });
}
export function importKeeps(items: KeepDraft[]): Promise<KeepsImport> { return importItems(items, false); }
export function importBrowserKeeps(): Promise<KeepsImport> {
  const items = readLocal();
  return items ? importItems(items, true) : Promise.resolve({ acceptedIds: [], remaining: [], complete: false });
}

if (typeof window !== 'undefined') {
  window.addEventListener('pc:auth-change', (event) => {
    const user = (event as CustomEvent<{ user?: { userId?: string } | null }>).detail?.user;
    generation += 1; controller.abort(); controller = new AbortController();
    mode = null; cache = []; account = undefined; protocol = 0; error = null; loading = null; queue = Promise.resolve();
    expectedAccount = typeof user?.userId === 'string' ? user.userId : user === null ? null : undefined;
    announce();
    void loadKeeps(true);
  });
  window.addEventListener('storage', (event) => {
    if ((event as StorageEvent).key !== LOCAL || mode !== 'browser') return;
    error = null; guest(); announce();
  });
}

const SVG = 'http://www.w3.org/2000/svg';
/** A bookmark toggle wired to the shelf. Stays in sync across every surface on the page. */
export function keepButton(draft: KeepDraft, label = 'this', glyph: 'bookmark' | 'star' = 'bookmark'): HTMLButtonElement {
  const id = keepId(draft);
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'sw-keep'; b.dataset.keepId = id;
  const svg = document.createElementNS(SVG, 'svg'); svg.setAttribute('viewBox', '0 0 16 16'); svg.setAttribute('width', '14'); svg.setAttribute('height', '14'); svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path'); path.setAttribute('d', glyph === 'star' ? 'M8 1.8l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.4l-3.9 2.2.9-4.3-3.2-3 4.3-.5z' : 'M4 2.5h8v11.2l-4-2.9-4 2.9z'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.4'); path.setAttribute('stroke-linejoin', 'round');
  svg.append(path); b.append(svg);
  const paint = () => { const on = isKept(id); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Kept on your shelf. Click to let it go.' : 'Keep on your shelf'; b.setAttribute('aria-label', on ? `Remove ${label} from your shelf` : `Keep ${label} on your shelf`); };
  paint();
  b.addEventListener('click', async (ev) => { ev.preventDefault(); ev.stopPropagation(); b.disabled = true; try { await toggleKeep(draft); } finally { b.disabled = false; paint(); } });
  window.addEventListener('pc:keeps:change', () => { if (b.isConnected) paint(); });
  return b;
}
