/**
 * Browser board for Loom Rush. Draws on a 390×240 canvas with local
 * sprites only. Sound stays off until the player turns it on.
 */
import {
  EXHIBITION,
  MAP,
  MAX_HEARTS,
  SPRITE_SRC,
  STARTING_GOLD,
  TOWER_TYPES,
  WAVES,
  createMatch,
  placeTower,
  playExhibition,
  playNext,
  simulatePlan,
  stampMatch,
  upgradeTower,
} from './loom-rush-sim.mjs';

const WIDTH = 390;
const HEIGHT = 240;
const SPRITE = 32;

const ENEMY_SPRITE = {
  scout: 'collator-scout',
  knight: 'noun-knight',
  raider: 'night-raider',
  dragon: 'silo-dragon',
};

function reducedMotion(window) {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}

function element(document, name, attrs = {}, text) {
  const node = document.createElement(name);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  if (text != null) node.textContent = text;
  return node;
}

export function mountLoomRush(root, window) {
  const document = root.ownerDocument;
  root.replaceChildren();

  const canvas = element(document, 'canvas', {
    id: 'field',
    width: String(WIDTH),
    height: String(HEIGHT),
    'aria-label': 'The coastal road to the Living Hearth',
  });
  const status = element(document, 'p', { id: 'status', role: 'status', 'aria-live': 'polite' });
  const seedInput = element(document, 'input', { id: 'seed', type: 'number', min: '0', max: '4294967295', value: '1126', inputmode: 'numeric', 'aria-label': 'Seed' });
  const reset = element(document, 'button', { id: 'reset', type: 'button' }, 'New run');
  const send = element(document, 'button', { id: 'send', type: 'button', class: 'primary' }, 'Send wave');
  const watch = element(document, 'button', { id: 'watch', type: 'button' }, 'Watch exhibition');
  const soundButton = element(document, 'button', { id: 'sound', type: 'button', 'aria-pressed': 'false' }, 'Sound off');
  const upgrade = element(document, 'button', { id: 'upgrade', type: 'button' }, 'Upgrade pad');
  const proof = element(document, 'p', { id: 'proof', class: 'proof' });
  const standings = element(document, 'ol', { id: 'standings' });
  const log = element(document, 'ol', { id: 'log' });
  const towerRow = element(document, 'div', { class: 'towers', role: 'group', 'aria-label': 'Towers' });
  const padRow = element(document, 'div', { class: 'pads', role: 'group', 'aria-label': 'Pads 0 through 5' });

  const actions = element(document, 'div', { class: 'actions' });
  actions.append(reset, send, watch, soundButton);
  const seedRow = element(document, 'div', { class: 'seed-row' });
  seedRow.append(element(document, 'label', { for: 'seed' }, 'Seed'), seedInput);

  root.append(canvas, status, seedRow, towerRow, padRow, upgrade, actions, proof, standings, log);

  const images = {};
  if (typeof window.Image === 'function') {
    for (const [id, src] of Object.entries(SPRITE_SRC)) {
      try {
        const image = new window.Image();
        image.decoding = 'sync';
        image.onload = () => { if (!busy) draw(); };
        image.src = src;
        images[id] = image;
      } catch {
        // A missing image decoder still leaves the drawn marks.
      }
    }
  }

  let match = createMatch(1126).match;
  let selectedTower = 'barracks';
  let selectedPad = 0;
  let sound = false;
  let audio = null;
  let sceneNight = false;
  let frameToken = 0;
  let busy = false;

  for (const id of Object.keys(TOWER_TYPES)) {
    const spec = TOWER_TYPES[id];
    const button = element(document, 'button', {
      type: 'button',
      'data-tower': id,
      'aria-pressed': id === selectedTower ? 'true' : 'false',
    }, spec.name);
    button.addEventListener('click', () => {
      selectedTower = id;
      for (const other of towerRow.querySelectorAll('button')) {
        other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
      }
      say(spec.unlockWave > 1 ? `${spec.name} unlocks at wave ${spec.unlockWave}.` : `${spec.name}. ${spec.role}`);
    });
    towerRow.append(button);
  }

  for (let pad = 0; pad < MAP.pads.length; pad += 1) {
    const button = element(document, 'button', { type: 'button', 'data-pad': String(pad) }, String(pad));
    button.addEventListener('click', () => {
      selectedPad = pad;
      if (busy || match.fallen || match.nextWave > WAVES.length) return;
      const placed = placeTower(match, pad, selectedTower);
      if (!placed.ok) {
        say(placed.error.message);
        return;
      }
      say(`Pad ${pad} built. ${placed.view.gold} gold left.`);
      draw();
    });
    padRow.append(button);
  }

  upgrade.addEventListener('click', () => {
    if (busy) return;
    const result = upgradeTower(match, selectedPad);
    say(result.ok ? `Pad ${selectedPad} upgraded. ${result.view.gold} gold left.` : result.error.message);
    draw();
  });

  reset.addEventListener('click', () => {
    const raw = seedInput.value.trim();
    if (!/^\d+$/.test(raw)) {
      say('Seed must be an integer from 0 through 4294967295.');
      return;
    }
    const made = createMatch(Number(raw));
    if (!made.ok) {
      say(made.error.message);
      return;
    }
    frameToken += 1;
    busy = false;
    match = made.match;
    sceneNight = false;
    proof.textContent = '';
    standings.replaceChildren();
    say(`New run. Seed ${match.seed}. ${STARTING_GOLD} gold. ${MAX_HEARTS} hearts.`);
    draw();
  });

  send.addEventListener('click', () => {
    if (busy || match.fallen || match.nextWave > WAVES.length) return;
    const waveNo = match.nextWave;
    sceneNight = !!WAVES[waveNo - 1].night;
    const played = playNext(match, { replay: !reducedMotion(window) });
    if (!played.ok) {
      say(played.error.message);
      return;
    }
    busy = true;
    animate(played.wave.frames || [], () => {
      busy = false;
      sceneNight = !!WAVES[Math.min(match.nextWave, WAVES.length) - 1]?.night && !played.view.done;
      finishStatus(played.view, played.wave);
      draw();
    });
  });

  watch.addEventListener('click', () => {
    const raw = seedInput.value.trim();
    if (!/^\d+$/.test(raw)) {
      say('Seed must be an integer from 0 through 4294967295.');
      return;
    }
    const seed = Number(raw);
    const board = playExhibition(seed);
    if (!board.ok) {
      say(board.error.message);
      return;
    }
    standings.replaceChildren();
    for (const run of board.runs) {
      const item = element(document, 'li');
      item.textContent = `${run.place}. ${run.agent} — ${run.stars} star — ${run.hearts}/20 hearts — score ${run.score} — ${run.proof}`;
      standings.append(item);
    }
    const winner = board.runs[0];
    const plan = EXHIBITION.find((entry) => entry.agent === winner.agent);
    say(`Exhibition on seed ${seed}. First: ${winner.agent}, score ${winner.score}.`);
    if (!plan || reducedMotion(window)) {
      proof.textContent = `${winner.agent} · proof ${winner.proof} · ${winner.sensory.cue}`;
      return;
    }
    const replay = simulatePlan({ seed, agent: winner.agent, steps: plan.steps, replay: true });
    busy = true;
    frameToken += 1;
    const token = frameToken;
    const waves = replay.waves || [];
    let index = 0;
    const stepWave = () => {
      if (token !== frameToken) return;
      if (index >= waves.length) {
        busy = false;
        proof.textContent = `${winner.agent} · proof ${winner.proof} · ${winner.sensory.cue}`;
        sceneNight = false;
        draw();
        return;
      }
      sceneNight = !!waves[index].night;
      animate(waves[index].frames || [], () => {
        index += 1;
        stepWave();
      }, token);
    };
    stepWave();
  });

  soundButton.addEventListener('click', () => {
    sound = !sound;
    soundButton.textContent = sound ? 'Sound on' : 'Sound off';
    soundButton.setAttribute('aria-pressed', sound ? 'true' : 'false');
    if (sound && !audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (typeof Ctx === 'function') audio = new Ctx();
    }
    if (sound && audio) blip(440, 0.06);
    say(sound ? 'Sound on.' : 'Sound off.');
  });

  function say(text) {
    status.textContent = text;
  }

  function finishStatus(view, wave) {
    const night = wave.night ? ' Night map.' : '';
    if (view.done && view.survived) {
      const stamped = stampMatch(match, 'player');
      say(`Cleared ${view.wavesCleared} of ${view.waveCount}. ${view.stars} star. ${view.hearts} hearts. Score ${view.score}. MVP ${view.mvp}.`);
      proof.textContent = `Seed ${view.seed} · score ${view.score} · ${view.mvp || 'no MVP'}${stamped ? ` · proof ${stamped}` : ''}`;
    } else if (view.done) {
      say(`The hearth fell on wave ${wave.wave}. ${view.wavesCleared} waves cleared. Score ${view.score}.`);
    } else {
      say(`Wave ${view.nextWave} of ${view.waveCount}. Hearts ${view.hearts}. Gold ${view.gold}.${night}`);
    }
    log.replaceChildren();
    for (const row of view.log) {
      const item = element(document, 'li');
      item.textContent = `Wave ${row.wave} ${row.name}: ${row.killed} down, ${row.leaked} through, ${row.hearts} hearts`;
      log.append(item);
    }
  }

  function blip(freq, duration) {
    if (!sound || !audio || typeof audio.createOscillator !== 'function') return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(audio.destination);
    const now = audio.currentTime || 0;
    osc.start(now);
    osc.stop(now + duration);
  }

  function animate(frames, done, token = frameToken) {
    if (reducedMotion(window) || !frames.length || typeof window.requestAnimationFrame !== 'function') {
      paint(null);
      done();
      return;
    }
    let index = 0;
    const step = () => {
      if (token !== frameToken) return;
      paint(frames[Math.min(index, frames.length - 1)]);
      if (sound && frames[Math.min(index, frames.length - 1)]?.shots?.length) blip(180 + (index % 5) * 40, 0.03);
      index += 3;
      if (index >= frames.length) {
        paint(null);
        done();
        return;
      }
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  function sx(x) {
    return 16 + (Math.max(0, x) / MAP.length) * (WIDTH - 32);
  }

  function roadY(x) {
    const t = Math.max(0, Math.min(MAP.length, x)) / MAP.length;
    return 148 + Math.sin(t * Math.PI) * 26;
  }

  function blit(ctx, id, x, y) {
    const image = images[id];
    if (image && image.complete && image.naturalWidth) {
      ctx.drawImage(image, Math.round(x - SPRITE / 2), Math.round(y - SPRITE), SPRITE, SPRITE);
      return true;
    }
    return false;
  }

  function paint(frame) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = sceneNight ? '#12151c' : '#d5e4ea';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = sceneNight ? '#1c2433' : '#e6d3ad';
    ctx.fillRect(0, 168, WIDTH, HEIGHT - 168);
    ctx.strokeStyle = sceneNight ? '#3d4a63' : '#8d7358';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(sx(0), roadY(0));
    for (let x = 0; x <= MAP.length; x += 500) ctx.lineTo(sx(x), roadY(x));
    ctx.stroke();
    ctx.fillStyle = sceneNight ? '#f2d48a' : '#e07040';
    ctx.fillRect(WIDTH - 28, 118, 12, 18);
    match.towers.forEach((tower, pad) => {
      if (!tower) return;
      const x = sx(MAP.pads[pad]);
      const y = roadY(MAP.pads[pad]);
      const sprite = tower.type === 'gong' ? 'gong-bombard' : tower.type === 'paladin' ? 'signing-paladin' : tower.type === 'barracks' ? 'noun-knight' : '';
      if (!sprite || !blit(ctx, sprite, x, y - 4)) {
        ctx.fillStyle = tower.type === 'mage' ? '#6ea8fe' : '#f4ede4';
        ctx.fillRect(x - 6, y - 22, 12, 12);
      }
    });
    if (frame) {
      for (const unit of frame.units) {
        const x = sx(unit.x);
        const y = roadY(Math.max(0, unit.x));
        const sprite = ENEMY_SPRITE[unit.kind];
        if (unit.kind === 'knight') {
          ctx.fillStyle = '#6e2430';
          ctx.fillRect(x - 8, y - 8, 16, 6);
        }
        if (!sprite || !blit(ctx, sprite, x, y)) {
          ctx.fillStyle = unit.kind === 'dragon' ? '#6dbf4b' : unit.kind === 'scout' ? '#2a9d8f' : '#5c5346';
          ctx.fillRect(x - 5, y - 12, unit.kind === 'dragon' ? 16 : 8, 8);
        }
      }
    }
  }

  function draw() {
    for (const button of padRow.querySelectorAll('button')) {
      const pad = Number(button.getAttribute('data-pad'));
      const tower = match.towers[pad];
      const short = { archer: 'Archers', barracks: 'Barracks', mage: 'Mage', gong: 'Gong', paladin: 'Paladin' };
      button.textContent = tower ? `${pad} · ${short[tower.type]} ${tower.level}` : `${pad} · empty`;
      if (pad === selectedPad) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    paint(null);
  }

  say(`Seed ${match.seed}. ${STARTING_GOLD} gold. ${MAX_HEARTS} hearts. Sound off.`);
  draw();
  return { canvas, status, soundButton };
}
