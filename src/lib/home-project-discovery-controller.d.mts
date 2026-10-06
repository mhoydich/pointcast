export const HOME_PROJECT_ROTATION_PAUSE_KEY: 'pc:home-project-rotation:paused:v1';
export const HOME_PROJECT_ROTATION_INTERVAL_MS: 10000;
export interface HomeProjectRotationController {
  readonly currentIndex: number;
  readonly paused: boolean;
  readonly running: boolean;
  previous(): number;
  next(): number;
  pause(): void;
  play(): boolean;
  destroy(): void;
}
export function initializeHomeProjectRotation(root: Element | null | undefined, options?: {
  storage?: { getItem(key: string): string | null; setItem(key: string, value: string): void } | null;
} | null): HomeProjectRotationController | null;
export function initializeLatestProjectBrowser(root: Element | null | undefined): {
  filter(): number;
  destroy(): void;
} | null;
