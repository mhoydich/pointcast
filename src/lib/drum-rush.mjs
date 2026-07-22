export const DRUM_RUSH_DURATION_MS = 4_000;

const RUSH_RANKS = [
  { minimum: 40, label: 'thunder noun', glyph: '⚡' },
  { minimum: 24, label: 'room shaker', glyph: '◆' },
  { minimum: 12, label: 'groove finder', glyph: '◎' },
  { minimum: 1, label: 'first spark', glyph: '·' },
  { minimum: 0, label: 'the drum is waiting', glyph: '○' },
];

export function drumRushRank(score) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  return RUSH_RANKS.find((rank) => safeScore >= rank.minimum) ?? RUSH_RANKS.at(-1);
}

export function drumRushShareText(score) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const rank = drumRushRank(safeScore);
  return `I scored ${safeScore} in PointCast's 4-second Noun Rush (${rank.label}). Beat that.`;
}
