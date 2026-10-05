import type { HomeDeckStorage } from './home-visit-deck.mjs';

export interface HomeVisitWindowController {
  readonly currentId: string;
  /** Change the visible view only after an explicit reader action. */
  shuffle(): string | null;
}

export function initializeHomeVisitWindow(root: Element | null | undefined, options?: {
  /** Explicit null disables persistence; omission tries window.localStorage. */
  storage?: HomeDeckStorage | null;
  /** One unit sample, or a function sampled once per choice. */
  entropy?: number | (() => number);
} | null): HomeVisitWindowController | null;
