export const HOME_VISIT_DECK_VERSION: 1;
export const HOME_VISIT_DECK_STORAGE_KEY: 'pc:home-visit-deck:v1';
export const HOME_VISIT_DECK_MAX_COUNT: 64;

export interface HomeDeckSelection {
  index: number;
  id: string;
  /** True when getItem succeeded, even if the stored value was invalid. */
  storageRead: boolean;
  /** True when the new ID was successfully written. */
  storageSaved: boolean;
}
export interface HomeDeckStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function chooseHomeDeckIndex(options?: {
  count: number;
  previousIndex?: number | null;
  entropy?: number;
} | null): number | null;
export function chooseAndSaveHomeDeck(options?: {
  ids: readonly string[];
  storage?: HomeDeckStorage | null;
  previousId?: string | null;
  entropy?: number;
} | null): HomeDeckSelection | null;
