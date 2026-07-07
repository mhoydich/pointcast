import tableArt from '../assets/games/solitaire-v2-bg.webp';
import desktopArt from '../assets/games/arcade-desktop-wallpaper.webp';
import cardBackArt from '../assets/games/arcade-card-backs.webp';

export type ArcadeGameSlug =
  | 'solitaire-v2'
  | 'nouns-memory-v2'
  | 'nouns-pyramid-v2'
  | 'nouns-mines-v2'
  | 'noggle-drop'
  | 'nouns-2048'
  | 'nouns-snake'
  | 'nouns-slide'
  | 'nouns-reversi'
  | 'nouns-breakout'
  | 'noggle-crush'
  | 'nouns-jam'
  | 'nouns-jelly'
  | 'noggle-crush-v2'
  | 'nouns-jam-v2'
  | 'nouns-jelly-v2';

export interface ArcadeGame {
  slug: ArcadeGameSlug;
  name: string;
  shortName: string;
  path: string;
  kicker: string;
  description: string;
  status: 'live' | 'next';
  category: 'cards' | 'memory' | 'puzzle' | 'action' | 'strategy' | 'match';
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
  {
    id: 'noggle-tetris',
    name: 'Noggle Tetris',
    description: 'Clear four lines at once in Noggle Drop.',
  },
  {
    id: 'reach-2048',
    name: 'Reach 2048',
    description: 'Merge your way to the 2048 tile in Nouns 2048.',
  },
  {
    id: 'snake-twenty',
    name: 'Twenty Long',
    description: 'Grow the snake to length twenty in Nouns Snake.',
  },
  {
    id: 'slide-solver',
    name: 'Slide Solver',
    description: "Solve the day's Noun in Nouns Slide.",
  },
  {
    id: 'reversi-win',
    name: 'Board Flipper',
    description: 'Beat the computer in Nouns Reversi.',
  },
  {
    id: 'brick-clear',
    name: 'Wall Breaker',
    description: 'Clear every brick in Nouns Breakout.',
  },
  {
    id: 'crush-clear',
    name: 'Noggle Crusher',
    description: 'Beat the score target in Noggle Crush.',
  },
  {
    id: 'jam-clear',
    name: 'Jam Session',
    description: 'Hit the score target in Nouns Jam.',
  },
  {
    id: 'jelly-clear',
    name: 'Squeaky Clean',
    description: 'Scrub every jelly square in Nouns Jelly.',
  },
  {
    id: 'cascade-chain',
    name: 'Chain Reaction',
    description: 'Trigger a triple cascade or pop ten noggles at once in a match game.',
  },
  {
    id: 'crush-campaign',
    name: 'Crush Campaign',
    description: 'Clear all five levels of Noggle Crush v2.',
  },
  {
    id: 'jam-campaign',
    name: 'Jam Campaign',
    description: 'Clear all four levels of Nouns Jam v2.',
  },
  {
    id: 'jelly-campaign',
    name: 'Jelly Campaign',
    description: 'Scrub every level of Nouns Jelly v2, double jelly and all.',
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
  {
    slug: 'noggle-drop',
    name: 'Noggle Drop',
    shortName: 'Drop',
    path: '/noggle-drop',
    kicker: 'DROP · CLEAR · STACK',
    description: 'A Tetris-style stack of falling noggle blocks — clear lines, chase the level, keep a local high score.',
    status: 'live',
    category: 'action',
    storageKey: `${ARCADE_STORAGE_PREFIX}noggle-drop`,
    achievementIds: ['first-win', 'three-game-streak', 'noggle-tetris'],
  },
  {
    slug: 'nouns-2048',
    name: 'Nouns 2048',
    shortName: '2048',
    path: '/nouns-2048',
    kicker: 'MERGE · 2048 · NOUNS',
    description: 'Slide and merge tiles up toward a full Noun at 2048, with undo and a local best score.',
    status: 'live',
    category: 'puzzle',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-2048`,
    achievementIds: ['first-win', 'three-game-streak', 'reach-2048'],
  },
  {
    slug: 'nouns-snake',
    name: 'Nouns Snake',
    shortName: 'Snake',
    path: '/nouns-snake',
    kicker: 'GROW · EAT · WRAP',
    description: 'A noggle snake eating coffee beans across El Segundo — grow long, dodge yourself, beat your best length.',
    status: 'live',
    category: 'action',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-snake`,
    achievementIds: ['first-win', 'three-game-streak', 'snake-twenty'],
  },
  {
    slug: 'nouns-slide',
    name: 'Nouns Slide',
    shortName: 'Slide',
    path: '/nouns-slide',
    kicker: 'DAILY · 15-PUZZLE · NOUN',
    description: "A 15-puzzle cut from the day's Noun — slide the tiles home, track moves and time, one puzzle a day.",
    status: 'live',
    category: 'puzzle',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-slide`,
    achievementIds: ['first-win', 'three-game-streak', 'slide-solver'],
  },
  {
    slug: 'nouns-reversi',
    name: 'Nouns Reversi',
    shortName: 'Reversi',
    path: '/nouns-reversi',
    kicker: 'OTHELLO · FLIP · NOUNS',
    description: 'Outflank the computer on an 8x8 Othello board of red and blue Noun discs, with hints and a best-margin record.',
    status: 'live',
    category: 'strategy',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-reversi`,
    achievementIds: ['first-win', 'three-game-streak', 'reversi-win'],
  },
  {
    slug: 'nouns-breakout',
    name: 'Nouns Breakout',
    shortName: 'Breakout',
    path: '/nouns-breakout',
    kicker: 'PADDLE · BRICKS · BOUNCE',
    description: 'Bounce a ball off a noggle paddle to break a wall of Nouns-colored bricks and reveal the Noun behind.',
    status: 'live',
    category: 'action',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-breakout`,
    achievementIds: ['first-win', 'three-game-streak', 'brick-clear'],
  },
  {
    slug: 'noggle-crush',
    name: 'Noggle Crush',
    shortName: 'Crush',
    path: '/noggle-crush',
    kicker: 'MATCH 3 · SPECIALS',
    description: 'Swap noggles, chain cascades, and earn striped and rainbow specials to beat the score target in 25 moves.',
    status: 'live',
    category: 'match',
    storageKey: `${ARCADE_STORAGE_PREFIX}noggle-crush`,
    achievementIds: ['first-win', 'three-game-streak', 'crush-clear', 'cascade-chain'],
  },
  {
    slug: 'nouns-jam',
    name: 'Nouns Jam',
    shortName: 'Jam',
    path: '/nouns-jam',
    kicker: 'TAP BLAST · BIG GROUPS',
    description: 'Pop groups of matching noggles, collapse the columns, and chase huge group bonuses in 30 taps.',
    status: 'live',
    category: 'match',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-jam`,
    achievementIds: ['first-win', 'three-game-streak', 'jam-clear', 'cascade-chain'],
  },
  {
    slug: 'nouns-jelly',
    name: 'Nouns Jelly',
    shortName: 'Jelly',
    path: '/nouns-jelly',
    kicker: 'MATCH 3 · CLEAR JELLY',
    description: 'Every tile sits on jelly — match on top of it to scrub all 64 squares clean in 40 moves.',
    status: 'live',
    category: 'match',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-jelly`,
    achievementIds: ['first-win', 'three-game-streak', 'jelly-clear', 'cascade-chain'],
  },
  {
    slug: 'noggle-crush-v2',
    name: 'Noggle Crush v2',
    shortName: 'Crush v2',
    path: '/noggle-crush-v2',
    kicker: 'CAMPAIGN · BOMBS',
    description: 'A five-level match-3 campaign with striped and rainbow specials plus new bomb noggles from cross-shaped matches.',
    status: 'live',
    category: 'match',
    storageKey: `${ARCADE_STORAGE_PREFIX}noggle-crush-v2`,
    achievementIds: ['first-win', 'three-game-streak', 'crush-clear', 'crush-campaign'],
  },
  {
    slug: 'nouns-jam-v2',
    name: 'Nouns Jam v2',
    shortName: 'Jam v2',
    path: '/nouns-jam-v2',
    kicker: 'CAMPAIGN · BOMB DROPS',
    description: 'A four-level tap-blast campaign where big pops leave bomb power-ups you tap to blast a 3x3.',
    status: 'live',
    category: 'match',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-jam-v2`,
    achievementIds: ['first-win', 'three-game-streak', 'jam-clear', 'jam-campaign'],
  },
  {
    slug: 'nouns-jelly-v2',
    name: 'Nouns Jelly v2',
    shortName: 'Jelly v2',
    path: '/nouns-jelly-v2',
    kicker: 'CAMPAIGN · DOUBLE JELLY',
    description: 'A four-level jelly campaign that adds double-layer jelly needing two matches to scrub clean.',
    status: 'live',
    category: 'match',
    storageKey: `${ARCADE_STORAGE_PREFIX}nouns-jelly-v2`,
    achievementIds: ['first-win', 'three-game-streak', 'jelly-clear', 'jelly-campaign'],
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
