export const BASEBALL_TITLE = 'A game you can sit inside';
export const BASEBALL_DESCRIPTION = 'A look at baseball: the field, the pauses, the pencil, and the people beside you. Follow one illustrated half inning and keep a small memory.';
export const MEMORY_KEY = 'pc:baseball:memory:v1';
export const sources = [
  { id: 'rules', title: 'The shape of the field', publisher: 'Major League Baseball · 2026 Official Rules', url: 'https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf', note: 'Rules 2.01 and 2.04: a 90-foot-square infield; the pitcher’s plate is 60 feet, 6 inches from the rear point of home plate. Rule 7.01 describes regulation games and their exceptions.' },
  { id: 'paper', title: 'The pencil makes a record', publisher: 'National Baseball Hall of Fame · Proof on paper', url: 'https://baseballhall.org/discover/proof-on-paper', note: 'The Hall preserves hundreds of handwritten scorecards and scoresheets. Fan scorecards follow the action; official scoresheets break down the statistics.' },
  { id: 'foster', title: 'Building a league', publisher: 'Negro Leagues Baseball Museum', url: 'https://www.nlbm.com/', note: 'Rube Foster established the Negro National League at the Paseo YMCA in Kansas City in 1920.' },
  { id: 'robinson', title: 'Opening a door', publisher: 'National Baseball Hall of Fame · Jackie Robinson', url: 'https://baseballhall.org/hall-of-famers/robinson-jackie', note: 'Robinson played for the Kansas City Monarchs in 1945 and made his National League debut with Brooklyn on April 15, 1947.' },
  { id: 'song', title: 'A song for the stands', publisher: 'Library of Congress', url: 'https://www.loc.gov/exhibits/baseballs-greatest-hits/take-me-out-the-ball-game.html', note: 'Albert Von Tilzer and Jack Norworth wrote “Take Me Out to the Ball Game” in April 1908.' },
  { id: 'timer', title: 'The pauses have changed', publisher: 'Major League Baseball · Pitch timer', url: 'https://www.mlb.com/glossary/rules/pitch-timer', note: 'MLB uses a pitch timer. Baseball’s rhythm should not be confused with having no clock.' },
];

// A composed half inning, with explicit advances rather than a general rules engine.
export const plays = [
  { code: '1B', name: 'A single', line: 'A ground ball finds the outfield. The first batter reaches first.', pencil: 'Write 1B. Draw the first side of the diamond.', company: 'Someone beside you says, “That’ll do.” A small beginning.', bases: ['01', null, null], outs: 0, runs: 0, hits: 1, ball: [432, 164] },
  { code: 'K', name: 'A strikeout', line: 'Three strikes. The batter is out; the runner stays at first.', pencil: 'K means strikeout. Mark the first out.', company: 'A quick groan, then the conversation picks up again.', bases: ['01', null, null], outs: 1, runs: 0, hits: 1, ball: [310, 303] },
  { code: 'BB', name: 'A walk', line: 'Four balls. The new batter takes first, forcing the runner to second.', pencil: 'BB is a base on balls. Two runners, no new hit.', company: 'Now two people are standing on the field waiting for the next person.', bases: ['03', '01', null], outs: 1, runs: 0, hits: 1, ball: [330, 311] },
  { code: '2B', name: 'A double', line: 'A drive into the gap. The runner from second scores; the runner from first reaches third. The batter stops at second.', pencil: 'Write 2B. Finish the first runner’s diamond and shade it: one run.', company: 'Everybody stands for the same few seconds. A little crowd becomes one body.', bases: [null, '04', '03'], outs: 1, runs: 1, hits: 2, ball: [212, 102] },
  { code: 'SF', name: 'A sacrifice fly', line: 'The fly ball is caught. The runner on third tags up after the catch and scores. The runner on second stays.', pencil: 'SF means sacrifice fly. An out can still bring a run home.', company: 'The applause is for something given up as much as something gained.', bases: [null, '04', null], outs: 2, runs: 2, hits: 2, ball: [390, 128] },
  { code: 'K', name: 'The third out', line: 'A strikeout ends the half inning. Two runs, two hits, and one runner left on base.', pencil: 'Mark out three. One runner is stranded; turn to the next half inning.', company: 'The field changes hands. There is time to ask who wants a drink.', bases: [null, null, null], outs: 3, runs: 2, hits: 2, ball: [310, 303], leftOnBase: 1 },
];

export function inningAt(step) {
  const count = Math.max(0, Math.min(plays.length, Number.isFinite(step) ? Math.trunc(step) : 0));
  return { step: count, bases: [null, null, null], outs: 0, runs: 0, hits: 0, leftOnBase: 0, ...(count ? plays[count - 1] : {}), complete: count === plays.length };
}

export function parseMemory(raw) {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value.note !== 'string') return null;
    return { note: value.note.slice(0, 280), ritual: ['listen', 'pencil', 'company'].includes(value.ritual) ? value.ritual : 'company' };
  } catch { return null; }
}

export function memoryText(note, ritual) {
  const invitation = { listen: 'Bring a radio. Leave room for the story.', pencil: 'Bring a pencil. We can learn the marks together.', company: 'Come watch an inning with me. You do not need to know everything.' };
  return `A small baseball memory\n\n${note.trim().slice(0, 280)}\n\n${invitation[ritual] || invitation.company}\n\nPointCast · A game you can sit inside\nhttps://pointcast.xyz/baseball\n`;
}
