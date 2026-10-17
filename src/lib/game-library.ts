import catalog from '../data/game-catalog.json';

export interface GameLink { label: string; url: string; description: string }
export interface GameEdition { name: string; url: string }
export interface LibraryGame {
  slug: string;
  name: string;
  family: string;
  kicker: string;
  description: string;
  hero?: string;
  accent: string;
  controls: string[];
  steps: string[];
  playUrl: string;
  players: string;
  participation: GameLink[];
  editions: GameEdition[];
  download: { kind: 'local' | 'online' | 'prepared'; entry: string; include: string[]; note: string };
  saveNote: string;
  networkNote: string;
}

export const GAME_LIBRARY = catalog as LibraryGame[];
export const gameLanding = (game: LibraryGame) => `/play/games/${game.slug}/`;
export const gameDownload = (game: LibraryGame) => `/downloads/games/${game.slug}.zip`;
export const gameDownloadLabel = (game: LibraryGame) => game.download.kind === 'online' ? 'Download online launch kit' : 'Download game pack';
export const gameDownloadType = (game: LibraryGame) => game.download.kind === 'online' ? 'Online launch kit' : 'Local game pack';
export const gameFamilies = [...new Set(GAME_LIBRARY.map(game => game.family))];
