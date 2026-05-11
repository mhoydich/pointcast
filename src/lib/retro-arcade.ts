import tableArt from '../assets/games/solitaire-v2-bg.webp';
import desktopArt from '../assets/games/arcade-desktop-wallpaper.webp';
import cardBackArt from '../assets/games/arcade-card-backs.webp';

export type ArcadeGameSlug =
  | 'solitaire-v2'
  | 'nouns-memory-v2'
  | 'nouns-pyramid-v2'
  | 'nouns-mines-v2';

export interface ArcadeGame {
  slug: ArcadeGameSlug;
  name: string;
  shortName: string;
  path: string;
  kicker: string;
  description: string;
  status: 'live' | 'next';
  category: 'cards' | 'memory' | 'puzzle';
  storageKey: string;
  achievementIds: string[];
}

export const ARCADE_STORAGE_PREFIX = 'pc:arcade:';

export const ARCADE_ACHIEVEMENTS = [
  {
    id: 'first-win',
    name: 'First Clear',
    description: 'Clear any Retro Arcade game once.',
  },
  {
    id: 'three-game-streak',
    name: 'Three Game Streak',
    description: 'Clear three games in one local arcade session.',
  },
  {
    id: 'fast-clear',
    name: 'Fast Clear',
    description: 'Clear a game quickly enough to beat the local fast-clear mark.',
  },
  {
    id: 'perfect-memory',
    name: 'Perfect Memory',
    description: 'Clear Memory with no missed pair attempts.',
  },
  {
    id: 'pyramid-clear',
    name: 'Pyramid Clear',
    description: 'Clear Nouns Pyramid v2.',
  },
  {
    id: 'mine-sweep',
    name: 'Mine Sweep',
    description: 'Clear Nouns Mines v2 without opening a mine.',
  },
];

export const RETRO_ARCADE_GAMES: ArcadeGame[] = [
  {
    slug: 'solitaire-v2',
    name: 'Solitaire v2',
    shortName: 'Solitaire',
    path: '/solitaire-v2',
    kicker: 'KLONDIKE · DRAW 1',
    description: 'Stock, waste, tableau, foundations, Nouns card faces, undo, hints, and local best time.',
    status: 'live',
    category: 'cards',
    storageKey: `${ARCADE_STORAGE_PREFIX}solitaire-v2`,
    achievementIds: ['first-win', 'three-game-streak', 'fast-clear'],
  },
  {
    slug: 'nouns-memory-v2',
    name: 'Nouns Memory v2',
    shortName: 'Memory',
    path: '/nouns-memory-v2',
    kicker: 'PAIRS · LOCAL BEST',
    description: 'Flip Nouns, find twins, choose difficulty, and chase a perfect memory run.',
    status: 'live',
    category: 'memory',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-memory-v2`,
    achievementIds: ['first-win', 'three-game-streak', 'perfect-memory'],
  },
  {
    slug: 'nouns-pyramid-v2',
    name: 'Nouns Pyramid v2',
    shortName: 'Pyramid',
    path: '/nouns-pyramid-v2',
    kicker: 'ADD TO 13',
    description: 'Clear exposed cards that add to thirteen, with undo, recycle count, and pair hints.',
    status: 'live',
    category: 'cards',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-pyramid-v2`,
    achievementIds: ['first-win', 'three-game-streak', 'pyramid-clear'],
  },
  {
    slug: 'nouns-mines-v2',
    name: 'Nouns Mines v2',
    shortName: 'Mines',
    path: '/nouns-mines-v2',
    kicker: 'MINES · FLAGS · NOUNS',
    description: 'Minesweeper-style Win95 board with Nouns reward tiles and local clear tracking.',
    status: 'live',
    category: 'puzzle',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-mines-v2`,
    achievementIds: ['first-win', 'three-game-streak', 'mine-sweep', 'fast-clear'],
  },
];

export const ARCADE_ASSETS = {
  table: tableArt.src,
  desktop: desktopArt.src,
  cardBacks: cardBackArt.src,
};

export function getArcadeGame(slug: string) {
  return RETRO_ARCADE_GAMES.find((game) => game.slug === slug);
}
