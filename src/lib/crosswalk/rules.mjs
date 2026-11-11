/**
 * Crosswalk rules: hops, collisions, the crossing clock, towers and score.
 *
 * A run is one game: a stage of lanes, a beach-goer on a cell, four towers to
 * fill, a clock per crossing and a score. `hop` moves the beach-goer one cell
 * and says what happened; `stepRun` advances the lanes and the clock and
 * reports a hit or a timeout. The page turns those reports into sound, mood
 * events and messages. Nothing here touches the DOM.
 *
 * Scoring follows the 1981 arcade's shape: points for every new row reached,
 * a tower bonus plus the unused seconds, a bigger bonus for the beach ball,
 * and a stage bonus when all four towers are filled.
 */
import { W, COLS, CELL, ROWS, ROW_KINDS, START, TOWER_COLS, buildLanes, stepLanes, laneAt, vehiclesOverlapping, paceForStage } from './field.mjs';

export const SCORE = Object.freeze({ hop: 10, tower: 50, perSecond: 10, ball: 200, stage: 1000, extraEvery: 2000 });
export const LIVES = 3;
export const HOP_TIME = 0.1;
/** The hit box is narrower than the cell so a near miss stays a miss. */
export const HIT_INSET = 4;

/** Crosswalk's own words for the shared dial; the mood model's blurbs are about Breakwater's balls. */
export const DIAL_NOTES = Object.freeze({
  calm: 'No lives. A hit just walks you back to the sidewalk.',
  play: 'Three beach-goers, one more every 2000 points.',
  rush: 'Starts hot: faster lanes, tighter gaps, a beach ball on the sand.',
});

export const DIRS = Object.freeze({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] });

/** How much of the stage clock each mood gives: DRIFT eases, RUSH presses. */
export const CLOCK_BY_LABEL = Object.freeze({ DAWN: 1, FLOW: 1, RUSH: 0.9, DRIFT: 1.3 });

/**
 * What the mood does to the street. `response` is moodResponse() from
 * src/lib/breakwater/mood.mjs: speed and density are its multipliers, and
 * the label picks the clock (DRIFT gives you longer, RUSH a little less).
 */
export function trafficFromResponse(response, pace = paceForStage(0)) {
  const label = response?.label || 'DAWN';
  const speed = (Number.isFinite(response?.speed) ? response.speed : 1) * (label === 'RUSH' ? 1.1 : 1) * pace.speed;
  const density = label === 'DRIFT' ? 0.45 : Math.min(1, 0.55 + 0.45 * (Number.isFinite(response?.density) ? response.density : 0.5));
  const timer = Math.round(pace.timer * (CLOCK_BY_LABEL[label] ?? 1));
  return { speed, density, timer, beachBall: label === 'RUSH', label };
}

export function createRun({ stage = 0, seed = 1, lives = LIVES, unlimited = false, timer } = {}) {
  const pace = paceForStage(stage);
  const run = {
    stage, seed, pace, lanes: buildLanes(stage, seed),
    player: { col: START.col, row: START.row, facing: 'up', hopT: 0, fromCol: START.col, fromRow: START.row },
    towers: TOWER_COLS.map(() => false),
    timerMax: timer ?? pace.timer, timer: timer ?? pace.timer,
    score: 0, lives: unlimited ? Infinity : lives, nextExtra: SCORE.extraEvery,
    best: START.row, hops: 0, crossings: 0, stagesCleared: 0,
    ball: null, carrying: false,
    alive: true,
  };
  return run;
}

/** Start a new crossing from the sidewalk, keeping towers and score. */
export function resetCrossing(run, timer) {
  run.player = { col: START.col, row: START.row, facing: 'up', hopT: 0, fromCol: START.col, fromRow: START.row };
  run.best = START.row;
  run.carrying = false;
  if (Number.isFinite(timer)) run.timerMax = timer;
  run.timer = run.timerMax;
  run.alive = true;
  return run;
}

/** Put the beach ball on a free sand cell (RUSH only), or take it away. */
export function placeBall(run, on, pick = Math.random) {
  if (!on) { if (!run.carrying) run.ball = null; return run; }
  if (run.ball || run.carrying) return run;
  const col = Math.floor(pick() * COLS);
  run.ball = { col, row: 1 };
  return run;
}

/** Pixel hit box of the beach-goer on its logical cell. */
export function playerBox(p) {
  return { x0: p.col * CELL + HIT_INSET, x1: (p.col + 1) * CELL - HIT_INSET };
}

/**
 * Try a hop. Returns an object with `type`:
 *   hop       moved to a plain cell (`forward` true when it reached a new row this crossing)
 *   blocked   off the field, or into water that is not a tower, or a filled tower
 *   splash    jumped into water between the towers: a loss
 *   tower     reached an empty tower: a home
 * The player is updated in place; the page animates from (fromCol, fromRow).
 */
export function hop(run, dir) {
  const d = DIRS[dir];
  const p = run.player;
  if (!d || !run.alive) return { type: 'blocked', reason: 'none' };
  const col = p.col + d[0], row = p.row + d[1];
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return { type: 'blocked', reason: 'edge' };
  p.facing = dir;
  if (row === 0) {
    const t = TOWER_COLS.indexOf(col);
    if (t < 0) {
      // Water between towers: in the arcade this drowned you. Here it does too.
      p.fromCol = p.col; p.fromRow = p.row; p.col = col; p.row = row; p.hopT = HOP_TIME;
      run.alive = false;
      return { type: 'splash', col };
    }
    if (run.towers[t]) return { type: 'blocked', reason: 'full', tower: t };
    p.fromCol = p.col; p.fromRow = p.row; p.col = col; p.row = row; p.hopT = HOP_TIME;
    run.towers[t] = true;
    const seconds = Math.max(0, Math.floor(run.timer));
    let points = SCORE.hop + SCORE.tower + seconds * SCORE.perSecond;
    const withBall = run.carrying;
    if (withBall) { points += SCORE.ball; run.carrying = false; run.ball = null; }
    run.score += points;
    run.crossings += 1;
    const filled = run.towers.every(Boolean);
    if (filled) { run.score += SCORE.stage; run.stagesCleared += 1; }
    run.alive = false;
    return { type: 'tower', tower: t, points, seconds, withBall, filled };
  }
  p.fromCol = p.col; p.fromRow = p.row; p.col = col; p.row = row; p.hopT = HOP_TIME;
  run.hops += 1;
  let forward = false, laneCleared = false, pickedBall = false;
  if (row < run.best) {
    forward = true;
    run.score += SCORE.hop;
    laneCleared = ROW_KINDS[p.fromRow] === 'lane';
    run.best = row;
  }
  if (run.ball && !run.carrying && run.ball.col === col && run.ball.row === row) { run.carrying = true; run.ball = null; pickedBall = true; }
  return { type: 'hop', forward, laneCleared, pickedBall, row, col, kind: ROW_KINDS[row] };
}

/** The vehicle under the beach-goer right now, or null. */
export function collision(run) {
  const p = run.player;
  if (ROW_KINDS[p.row] !== 'lane') return null;
  const lane = laneAt(run.lanes, p.row);
  const box = playerBox(p);
  const hits = vehiclesOverlapping(lane, box.x0, box.x1);
  return hits.length ? { lane, vehicle: hits[0] } : null;
}

/**
 * Advance the run by `dt` with the current traffic settings. Returns a list
 * of events: {type:'hit', lane, vehicle} or {type:'timeout'}; both end the
 * crossing and set `alive` false so a page can play the moment out.
 */
export function stepRun(run, dt, traffic) {
  const events = [];
  stepLanes(run.lanes, dt, traffic);
  if (run.player.hopT > 0) run.player.hopT = Math.max(0, run.player.hopT - dt);
  if (!run.alive) return events;
  run.timer = Math.max(0, run.timer - dt);
  const hit = collision(run);
  if (hit) { run.alive = false; events.push({ type: 'hit', lane: hit.lane, vehicle: hit.vehicle }); return events; }
  if (run.timer <= 0) { run.alive = false; events.push({ type: 'timeout' }); }
  return events;
}

/** A life is lost (unless lives are unlimited). Returns true when the run is over. */
export function loseLife(run) {
  if (run.lives === Infinity) return false;
  run.lives -= 1;
  return run.lives <= 0;
}

/** Award extra lives as the score passes each threshold. Returns how many were added. */
export function checkExtraLife(run) {
  let added = 0;
  while (run.score >= run.nextExtra) {
    run.nextExtra += SCORE.extraEvery;
    if (run.lives !== Infinity) { run.lives += 1; added += 1; }
  }
  return added;
}

/** Move to the next stage: new lanes, empty towers, the pace steps up. */
export function nextStage(run) {
  run.stage += 1;
  run.pace = paceForStage(run.stage);
  run.lanes = buildLanes(run.stage, run.seed);
  run.towers = TOWER_COLS.map(() => false);
  run.ball = null;
  resetCrossing(run, run.pace.timer);
  return run;
}

/** Is a cell safe to stand on right now (for the attract-mode walker and tests)? */
export function cellIsSafe(run, col, row) {
  if (ROW_KINDS[row] !== 'lane') return row !== 0 || TOWER_COLS.includes(col);
  const lane = laneAt(run.lanes, row);
  return vehiclesOverlapping(lane, col * CELL + HIT_INSET, (col + 1) * CELL - HIT_INSET).length === 0;
}

/** Will the cell be clear `ahead` seconds from now? Used by the attract walker to look before it hops. */
export function cellSafeIn(run, col, row, ahead, traffic) {
  if (ROW_KINDS[row] !== 'lane') return cellIsSafe(run, col, row);
  const lane = laneAt(run.lanes, row);
  // Sweep the cell against the whole window, so a vehicle cannot pass through between two samples.
  const shift = lane.dir * lane.speed * (traffic?.speed ?? 1) * ahead;
  const x0 = col * CELL + HIT_INSET - Math.max(0, shift), x1 = (col + 1) * CELL - HIT_INSET - Math.min(0, shift);
  return vehiclesOverlapping(lane, x0, x1).length === 0;
}

export { W, COLS, ROWS, START, TOWER_COLS };
