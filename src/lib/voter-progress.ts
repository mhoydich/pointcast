/**
 * voter-progress — XP / level / title math for the voting game layer.
 *
 * Mike 2026-04-18: "in an entertaining and fun way, cookie clicker,
 * rewarding". All client-side / localStorage. No server, no auth —
 * reputation is personal-to-the-browser, which is the right privacy
 * posture for anonymous polling.
 *
 * LS keys (namespaced):
 *   pc:voter:count        integer — total votes cast
 *   pc:voter:polls        JSON array of slugs voted on (for unique poll count)
 *   pc:voter:unlocks      JSON array of achievement ids earned
 *   pc:voter:streak       integer — session streak (resets when tab closes)
 *   pc:voter:zeitgeist    integer — zeitgeist polls voted on
 *   pc:voter:forecast     integer — forecast polls voted on
 *
 * This file is TypeScript-compatible but the pattern is designed to be
 * inline-able as plain JS in `is:inline` scripts, so components don't
 * need to import it. See PollsOnHome + /poll/[slug] for the mirror.
 */

export interface VoterTitle {
  min: number;
  title: string;
  emoji: string;
}

// Levels = floor(votes / 3) + 1, capped at 20
// Titles unlock at specific vote counts
export const TITLES: VoterTitle[] = [
  { min: 0,  title: 'Novice Voter',  emoji: '🗳️' },
  { min: 3,  title: 'Apprentice',    emoji: '🎯' },
  { min: 8,  title: 'Scout',         emoji: '🔍' },
  { min: 15, title: 'Regular',       emoji: '📊' },
  { min: 25, title: 'Witness',       emoji: '👁️' },
  { min: 40, title: 'Forecaster',    emoji: '🔮' },
  { min: 60, title: 'Schelling Point', emoji: '⚡' },
  { min: 99, title: 'Oracle',        emoji: '🌀' },
];

export function titleForCount(n: number): VoterTitle {
  let t = TITLES[0];
  for (const x of TITLES) if (n >= x.min) t = x;
  return t;
}

export function levelForCount(n: number): number {
  return Math.min(Math.floor(n / 3) + 1, 20);
}

export interface Achievement {
  id: string;
  label: string;
  emoji: string;
  check: (s: VoterState) => boolean;
}

export interface VoterState {
  count: number;
  uniquePolls: number;
  zeitgeist: number;
  forecast: number;
  streak: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-vote',   label: 'First Vote',     emoji: '🗳️', check: (s) => s.count >= 1 },
  { id: 'five-votes',   label: 'Warmed Up',      emoji: '🔥', check: (s) => s.count >= 5 },
  { id: 'ten-votes',    label: 'Double Digits',  emoji: '🎯', check: (s) => s.count >= 10 },
  { id: 'thirty-votes', label: 'Dedicated',      emoji: '💪', check: (s) => s.count >= 30 },
  { id: 'first-zeit',   label: 'Zeitgeist Caught', emoji: '⚡', check: (s) => s.zeitgeist >= 1 },
  { id: 'first-cast',   label: 'First Forecast',  emoji: '🔮', check: (s) => s.forecast >= 1 },
  { id: 'five-polls',   label: 'Five Polls',      emoji: '📊', check: (s) => s.uniquePolls >= 5 },
  { id: 'streak-3',     label: 'Three in a Row',  emoji: '⚡', check: (s) => s.streak >= 3 },
  { id: 'streak-7',     label: 'Lucky Seven',     emoji: '🍀', check: (s) => s.streak >= 7 },
];
