import { getSession } from './auth/client.ts';

export const ME_STATE_KEYS = [
  'passportStamps', 'companion', 'mood', 'library', 'quests', 'highScores',
] as const;
export type MeStateKey = typeof ME_STATE_KEYS[number];
export type MeStateEntry = { updatedAt: number; value: unknown };
export type MeStatePayload = Partial<Record<MeStateKey, MeStateEntry>>;

const ENDPOINT = '/api/me/state';
const ENVELOPE_KEY = 'pc:me-state:v1';
const DEBOUNCE_MS = 2_000;
let pendingWrite: number | null = null;
let initialized = false;

function browser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!browser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function writeJson(key: string, value: unknown): void {
  if (!browser()) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* local-only fallback */ }
}

function readEnvelope(): MeStatePayload {
  const raw = readJson<Record<string, MeStateEntry>>(ENVELOPE_KEY, {});
  const result: MeStatePayload = {};
  for (const key of ME_STATE_KEYS) {
    const entry = raw[key];
    if (entry && Number.isFinite(entry.updatedAt) && entry.updatedAt > 0 && 'value' in entry) result[key] = entry;
  }
  return result;
}

function writeEnvelope(payload: MeStatePayload): void { writeJson(ENVELOPE_KEY, payload); }

function has(key: string): boolean {
  try { return browser() && window.localStorage.getItem(key) !== null; } catch { return false; }
}

function readLegacy(key: MeStateKey): unknown | undefined {
  switch (key) {
    case 'passportStamps': return has('pc:passport:stamps') ? readJson('pc:passport:stamps', {}) : undefined;
    case 'mood': {
      try { return window.localStorage.getItem('pc:mood') ?? undefined; } catch { return undefined; }
    }
    case 'library': return has('pc:dock:saved:v1') ? readJson('pc:dock:saved:v1', []) : undefined;
    case 'quests': return has('pc:quests') ? readJson('pc:quests', {}) : undefined;
    case 'highScores': return has('pc:high-scores') ? readJson('pc:high-scores', {}) : undefined;
    case 'companion': {
      const noun = (() => { try { return window.localStorage.getItem('pc:visitor:noun') ?? window.localStorage.getItem('pc:nounId'); } catch { return null; } })();
      const selected = has('pc:pet:selected') ? readJson<{ id?: string }>('pc:pet:selected', {}) : {};
      const hasCare = has('pc:pet:care');
      const care = hasCare ? readJson('pc:pet:care', []) : [];
      const mood = (() => { try { return window.localStorage.getItem('pc:mood'); } catch { return null; } })();
      if (noun === null && !selected.id && !hasCare && !mood) return undefined;
      const nounId = Number(noun);
      return {
        ...(Number.isInteger(nounId) && nounId >= 0 && nounId <= 1199 ? { nounId } : {}),
        ...(selected.id ? { name: selected.id } : {}),
        ...(mood ? { mood } : {}),
        care,
      };
    }
  }
}

function writeLegacy(key: MeStateKey, value: unknown): void {
  if (!browser()) return;
  switch (key) {
    case 'passportStamps': writeJson('pc:passport:stamps', value); break;
    case 'mood': if (typeof value === 'string') try { window.localStorage.setItem('pc:mood', value); } catch {} break;
    case 'library': writeJson('pc:dock:saved:v1', value); break;
    case 'quests': writeJson('pc:quests', value); break;
    case 'highScores': writeJson('pc:high-scores', value); break;
    case 'companion': {
      if (!value || typeof value !== 'object') break;
      const companion = value as { nounId?: unknown; name?: unknown; mood?: unknown; care?: unknown };
      if (Number.isInteger(companion.nounId)) {
        try {
          window.localStorage.setItem('pc:visitor:noun', String(companion.nounId));
          window.localStorage.setItem('pc:nounId', String(companion.nounId));
        } catch {}
      }
      if (typeof companion.name === 'string') writeJson('pc:pet:selected', { id: companion.name });
      if (Array.isArray(companion.care)) writeJson('pc:pet:care', companion.care);
      if (typeof companion.mood === 'string') try { window.localStorage.setItem('pc:mood', companion.mood); } catch {}
      break;
    }
  }
}

function keyForLegacyWrite(key: string): MeStateKey | null {
  if (key === 'pc:passport:stamps') return 'passportStamps';
  if (key === 'pc:mood') return 'mood';
  if (key === 'pc:dock:saved:v1') return 'library';
  if (key === 'pc:quests') return 'quests';
  if (key === 'pc:high-scores') return 'highScores';
  if (['pc:visitor:noun', 'pc:nounId', 'pc:pet:selected', 'pc:pet:care'].includes(key)) return 'companion';
  return null;
}

function ensureLocal(key: MeStateKey): MeStateEntry | undefined {
  const payload = readEnvelope();
  if (payload[key]) return payload[key];
  const value = readLegacy(key);
  if (value === undefined) return undefined;
  const entry = { updatedAt: Date.now(), value };
  payload[key] = entry;
  writeEnvelope(payload);
  return entry;
}

function emit(payload: MeStatePayload, source: 'local' | 'server'): void {
  if (!browser()) return;
  window.dispatchEvent(new CustomEvent('pc:me-state', { detail: { payload, source } }));
}

export function readMeState<T>(key: MeStateKey, fallback: T): T {
  return (ensureLocal(key)?.value ?? fallback) as T;
}

export function writeMeState(key: MeStateKey, value: unknown): void {
  if (!browser()) return;
  const payload = readEnvelope();
  payload[key] = { updatedAt: Date.now(), value };
  writeEnvelope(payload);
  writeLegacy(key, value);
  emit(payload, 'local');
  scheduleWrite();
}

export function updateCompanion(change: Record<string, unknown>): void {
  const current = readMeState<Record<string, unknown>>('companion', {});
  writeMeState('companion', { ...current, ...change });
}

export function setHighScore(game: string, score: number): void {
  if (!game || !Number.isFinite(score)) return;
  const scores = readMeState<Record<string, number>>('highScores', {});
  writeMeState('highScores', { ...scores, [game]: Math.max(0, Math.floor(score)) });
}

export async function hydrateMeState(): Promise<MeStatePayload> {
  if (!browser() || !(await getSession().catch(() => null))) return readEnvelope();
  const response = await fetch(ENDPOINT, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) return readEnvelope();
  const remote = (await response.json() as { payload?: MeStatePayload }).payload ?? {};
  const local = readEnvelope();
  const merged: MeStatePayload = { ...remote };
  let localWins = false;
  for (const key of ME_STATE_KEYS) {
    const localEntry = ensureLocal(key);
    const remoteEntry = remote[key];
    if (localEntry && (!remoteEntry || localEntry.updatedAt > remoteEntry.updatedAt)) {
      merged[key] = localEntry;
      localWins = true;
    }
    if (merged[key]) writeLegacy(key, merged[key].value);
  }
  writeEnvelope(merged);
  emit(merged, 'server');
  if (localWins) scheduleWrite();
  return merged;
}

export function scheduleWrite(): void {
  if (!browser() || pendingWrite !== null) return;
  pendingWrite = window.setTimeout(() => {
    pendingWrite = null;
    void flushMeState();
  }, DEBOUNCE_MS);
}

export async function flushMeState(): Promise<void> {
  if (!browser() || !(await getSession().catch(() => null))) return;
  const payload = readEnvelope();
  if (!Object.keys(payload).length) return;
  const response = await fetch(ENDPOINT, {
    method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload }),
  });
  if (!response.ok) return;
  const remote = (await response.json() as { payload?: MeStatePayload }).payload;
  if (remote) {
    writeEnvelope(remote);
    for (const key of ME_STATE_KEYS) {
      if (remote[key]) writeLegacy(key, remote[key].value);
    }
    emit(remote, 'server');
  }
}

export function initMeState(): void {
  if (!browser() || initialized) return;
  initialized = true;
  window.addEventListener('pc:auth-change', (event) => {
    const user = (event as CustomEvent<{ user?: unknown | null }>).detail?.user;
    if (user) void hydrateMeState();
  });
  window.addEventListener('pc:me-state-legacy-write', (event) => {
    const detail = (event as CustomEvent<{ key?: string }>).detail;
    const key = detail?.key ? keyForLegacyWrite(detail.key) : null;
    if (!key) return;
    // Read the compatibility keys after the legacy writer has completed, so
    // pages not yet converted to modules still participate in account sync.
    writeMeState(key, readLegacy(key));
  });
  void hydrateMeState();
}
