export interface DockRecentItem {
  path: string;
  title: string;
  visitedAt: number;
}

export type DockActivityType = 'visit' | 'open' | 'save' | 'remove' | 'agent' | 'account' | 'pet';

export interface DockActivityItem {
  id: string;
  type: DockActivityType;
  label: string;
  path?: string;
  at: number;
}

export const DOCK_RECENTS_KEY = 'pc:dock:recents:v1';
export const DOCK_ACTIVITY_KEY = 'pc:dock:activity:v1';
export const DOCK_SAVED_KEY = 'pc:dock:saved:v1';

const RECENT_LIMIT = 16;
const ACTIVITY_LIMIT = 40;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The dock remains useful without persistence in private storage modes.
  }
}

function announceChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('pc:dock-state-change'));
}

function normalizeTitle(title: string, path: string): string {
  const cleaned = title
    .replace(/\s+[|\u00b7\u2014-]\s+PointCast.*$/i, '')
    .trim();
  if (cleaned) return cleaned.slice(0, 90);
  if (path === '/') return 'PointCast home';
  return path.split('/').filter(Boolean).pop()?.replace(/[-_]+/g, ' ') || 'PointCast';
}

function normalizePath(path: string): string {
  if (!path) return '/';
  try {
    const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'https://pointcast.xyz');
    return `${url.pathname}${url.search}`;
  } catch {
    return path.startsWith('/') ? path : `/${path}`;
  }
}

function activityId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `dock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function readDockRecents(): DockRecentItem[] {
  const items = readJson<DockRecentItem[]>(DOCK_RECENTS_KEY, []);
  return Array.isArray(items) ? items.filter((item) => item?.path && item?.visitedAt) : [];
}

export function readDockActivity(): DockActivityItem[] {
  const items = readJson<DockActivityItem[]>(DOCK_ACTIVITY_KEY, []);
  return Array.isArray(items) ? items.filter((item) => item?.id && item?.label && item?.at) : [];
}

export function readDockSaved(): string[] {
  const items = readJson<string[]>(DOCK_SAVED_KEY, []);
  return Array.isArray(items) ? items.filter((path) => typeof path === 'string') : [];
}

export function recordDockActivity(
  type: DockActivityType,
  label: string,
  path?: string,
): DockActivityItem {
  const item: DockActivityItem = {
    id: activityId(),
    type,
    label: label.trim().slice(0, 120),
    path: path ? normalizePath(path) : undefined,
    at: Date.now(),
  };
  const activity = [item, ...readDockActivity()].slice(0, ACTIVITY_LIMIT);
  writeJson(DOCK_ACTIVITY_KEY, activity);
  announceChange();
  return item;
}

export function recordDockVisit(path: string, title: string): DockRecentItem | null {
  const normalizedPath = normalizePath(path);
  if (/^\/(api|_astro)(?:\/|$)/.test(normalizedPath)) return null;

  const now = Date.now();
  const item: DockRecentItem = {
    path: normalizedPath,
    title: normalizeTitle(title, normalizedPath),
    visitedAt: now,
  };
  const prior = readDockRecents();
  const previousTop = prior[0];
  writeJson(
    DOCK_RECENTS_KEY,
    [item, ...prior.filter((recent) => recent.path !== normalizedPath)].slice(0, RECENT_LIMIT),
  );

  if (!previousTop || previousTop.path !== normalizedPath || now - previousTop.visitedAt > 30 * 60 * 1000) {
    recordDockActivity('visit', `Visited ${item.title}`, normalizedPath);
  } else {
    announceChange();
  }
  return item;
}

export function recordDockOpen(path: string, title: string): void {
  recordDockActivity('open', `Opened ${normalizeTitle(title, path)}`, path);
}

export function toggleDockSaved(path: string, title: string): boolean {
  const normalizedPath = normalizePath(path);
  const saved = readDockSaved();
  const exists = saved.includes(normalizedPath);
  const next = exists
    ? saved.filter((item) => item !== normalizedPath)
    : [normalizedPath, ...saved].slice(0, 48);
  writeJson(DOCK_SAVED_KEY, next);
  recordDockActivity(
    exists ? 'remove' : 'save',
    `${exists ? 'Removed' : 'Saved'} ${normalizeTitle(title, normalizedPath)}`,
    normalizedPath,
  );
  return !exists;
}

export function clearDockActivity(): void {
  writeJson(DOCK_ACTIVITY_KEY, []);
  announceChange();
}

export function formatDockAge(timestamp: number): string {
  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < 60_000) return 'now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h`;
  return `${Math.floor(elapsed / 86_400_000)}d`;
}
