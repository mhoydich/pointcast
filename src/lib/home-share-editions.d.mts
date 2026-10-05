export type HomeShareEditionId =
  | '2026-10-signal-atlas'
  | '2026-10-listening-garden'
  | '2026-10-paper-constellation'
  | '2026-10-tide-observatory'
  | '2026-10-making-room'
  | '2026-10-night-arcade';

export interface HomeShareEdition {
  readonly id: HomeShareEditionId;
  readonly slug: string;
  readonly title: string;
  readonly number: number;
  readonly alt: string;
  readonly imagePath: string;
  readonly imageUrl: string;
  readonly path: string;
  readonly url: string;
}

export const HOME_SHARE_CANONICAL: 'https://pointcast.xyz/';
export const HOME_SHARE_TITLE: 'PointCast';
export const HOME_SHARE_DESCRIPTION: string;
export const HOME_SHARE_WIDTH: 1200;
export const HOME_SHARE_HEIGHT: 630;
export const HOME_SHARE_ANCHOR: '2026-10-03';
export const HOME_SHARE_EDITIONS: readonly HomeShareEdition[];
export function homeShareEditionForDate(now?: Date | number | string): HomeShareEdition;
export function findHomeShareEdition(id: unknown): HomeShareEdition | null;
