export const SKIES = ['Snow hush', 'Violet sky', 'First light'];
export const LIGHTS_PER_SKY = 7;
export const MAX_STEP = 0.05;
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

export function createSkyward(width = 960, height = 420, random = Math.random) {
  return { width, height, x: width / 2, phase: 'ready', stage: 0, lights: 0,
    total: 0, time: 0, spawnIn: 0.2, nextId: 0, orbs: [], sparks: [], random };
}

export function resumeSkyward(state) {
  if (state.phase !== 'complete') state.phase = 'playing';
}

export function pauseSkyward(state) {
  if (state.phase === 'playing') state.phase = 'paused';
}

export function resizeSkyward(state, width, height) {
  const sx = width / state.width, sy = height / state.height;
  state.x *= sx;
  for (const orb of state.orbs) { orb.x *= sx; orb.y *= sy; }
  for (const spark of state.sparks) { spark.x *= sx; spark.y *= sy; }
  state.width = width;
  state.height = height;
}

export function stepSkyward(state, seconds, steer = 0, targetX = null) {
  if (state.phase !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return;
  const dt = Math.min(seconds, MAX_STEP);
  state.time += dt;
  const speed = Math.max(250, state.width * 0.62);
  if (steer) state.x += clamp(steer, -1, 1) * speed * dt;
  else if (targetX !== null && Number.isFinite(targetX)) {
    state.x += clamp(targetX - state.x, -speed * dt, speed * dt);
  }
  state.x = clamp(state.x, 22, state.width - 22);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    state.orbs.push({ id: state.nextId++, x: 28 + state.random() * (state.width - 56), y: -14 });
    state.spawnIn += 0.85;
  }
  const playerY = state.height - 57;
  const fallSpeed = state.height / 6;
  const remaining = [];
  for (const orb of state.orbs) {
    orb.y += fallSpeed * dt;
    if (Math.hypot(orb.x - state.x, orb.y - playerY) < 29) {
      state.sparks.push({ x: orb.x, y: orb.y, life: 0.7 });
      state.total++;
      state.lights++;
      if (state.lights === LIGHTS_PER_SKY) {
        if (state.stage === SKIES.length - 1) {
          state.phase = 'complete';
          state.orbs = [];
          return;
        }
        state.stage++;
        state.lights = 0;
        state.orbs = [];
        state.spawnIn = 0.3;
        return;
      }
    } else if (orb.y < state.height + 20) remaining.push(orb);
  }
  state.orbs = remaining;
  state.sparks = state.sparks.filter(spark => (spark.life -= dt) > 0);
}
