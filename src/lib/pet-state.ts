import { PET_CARE_ACTIONS, POINTCAST_PETS } from './play-layer';
import { recordDockActivity } from './dock-state';

export const PET_CARE_KEY = 'pc:pet:care';
export const PET_SELECTED_KEY = 'pc:pet:selected';
export const PET_STAMPS_KEY = 'pc:passport:stamps';
export const PET_ACTIVITY_SYNC_KEY = 'pc:dock:pet-care-sync:v1';

interface PetCareEntry {
  id: string;
  petId?: string;
  at: string;
}

export interface PointCastPetSnapshot {
  id: string;
  name: string;
  kind: string;
  nounId: number;
  accent: string;
  line: string;
  state: 'sleepy signal' | 'awake signal' | 'bright signal';
  careCount: number;
  lastCareAt: number | null;
  lastAction: string | null;
}

const EMPTY_MARKER = '__empty__';
const defaultPet = POINTCAST_PETS[0];
const petById = new Map(POINTCAST_PETS.map((pet) => [pet.id, pet]));
const actionById = new Map(PET_CARE_ACTIONS.map((action) => [action.id, action]));

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

function readCare(): PetCareEntry[] {
  const care = readJson<PetCareEntry[]>(PET_CARE_KEY, []);
  if (!Array.isArray(care)) return [];
  return care.filter((entry) => (
    typeof entry?.id === 'string'
    && typeof entry?.at === 'string'
    && Number.isFinite(Date.parse(entry.at))
  ));
}

function selectedPet() {
  const selected = readJson<{ id?: string }>(PET_SELECTED_KEY, {});
  return (selected.id && petById.get(selected.id)) || defaultPet;
}

function belongsToPet(entry: PetCareEntry, petId: string): boolean {
  return (entry.petId || defaultPet.id) === petId;
}

function entrySignature(entry: PetCareEntry): string {
  return `${entry.at}|${entry.petId || defaultPet.id}|${entry.id}`;
}

function careActivityLabel(entry: PetCareEntry): string {
  const pet = petById.get(entry.petId || defaultPet.id) || defaultPet;
  const verbs: Record<string, string> = {
    feed: 'Fed',
    water: 'Watered',
    rest: 'Rested with',
    spark: 'Sparked',
  };
  return `${verbs[entry.id] || 'Cared for'} ${pet.name}`;
}

export function readPetSnapshot(): PointCastPetSnapshot {
  const pet = selectedPet();
  const care = readCare();
  const petCare = care.filter((entry) => belongsToPet(entry, pet.id));
  const stamps = readJson<Record<string, unknown>>(PET_STAMPS_KEY, {});
  const scores: Record<'signal' | 'glow' | 'calm' | 'charge', number> = {
    signal: 8,
    glow: 8,
    calm: 8,
    charge: 8,
  };

  scores[pet.affinity] += 10;
  PET_CARE_ACTIONS.forEach((action) => {
    if (stamps[action.stampId]) scores[action.stat] += action.effect;
  });
  petCare.forEach((entry) => {
    const action = actionById.get(entry.id);
    if (action) scores[action.stat] += 10;
  });

  const average = Math.round(
    (scores.signal + scores.glow + scores.calm + scores.charge) / 4,
  );
  const lastCare = petCare.at(-1);

  return {
    id: pet.id,
    name: pet.name,
    kind: pet.kind,
    nounId: pet.nounId,
    accent: pet.accent,
    line: pet.line,
    state: average >= 70 ? 'bright signal' : average >= 44 ? 'awake signal' : 'sleepy signal',
    careCount: petCare.length,
    lastCareAt: lastCare ? Date.parse(lastCare.at) : null,
    lastAction: lastCare ? actionById.get(lastCare.id)?.label || 'Care' : null,
  };
}

export function syncPetCareActivity(): number {
  if (!canUseStorage()) return 0;
  const care = readCare();
  const latest = care.at(-1);
  const marker = window.localStorage.getItem(PET_ACTIVITY_SYNC_KEY);

  if (marker === null) {
    window.localStorage.setItem(PET_ACTIVITY_SYNC_KEY, latest ? entrySignature(latest) : EMPTY_MARKER);
    return 0;
  }
  if (!latest || marker === entrySignature(latest)) return 0;

  const markerIndex = marker === EMPTY_MARKER
    ? -1
    : care.findIndex((entry) => entrySignature(entry) === marker);
  const pending = marker === EMPTY_MARKER
    ? care
    : markerIndex >= 0
      ? care.slice(markerIndex + 1)
      : [latest];

  pending.slice(-6).forEach((entry) => {
    recordDockActivity('pet', careActivityLabel(entry), '/pet');
  });
  window.localStorage.setItem(PET_ACTIVITY_SYNC_KEY, entrySignature(latest));
  return Math.min(pending.length, 6);
}
