import { drawings, materials } from './scenes.mjs';

// Each score is an arrangement of item 22's loop and instruments.
// [delay in seconds until the next note, kit instrument] pairs repeat per room.
const rooms = [
  {
    name:'Campfire', kind:'Open room', place:'#bonfire', sky:'#263634',
    present:'Pull up a log. There’s room on the circle for one more.',
    empty:'The last voice has gone. Coals hold the place until someone sits down.',
    bed:'Open-air crackle with a pair of wood pops.', crackle:true, notes:[[.36,'tap'],[3.6,'tap'],[5.2,'tap']],
    base:174, width:184, state:'bright', tongues:[[98,77,-.7,23,'#db542f'],[138,95,.44,23,'#ef7038'],[120,115,-.46,23,'#ff9e47'],[117,61,.5,15,'#ffda83']],
  },
  {
    name:'Hearth', kind:'Home room', place:'A familiar desk', sky:'#493a31',
    present:'The fire is low. Someone left your chair in its usual place.',
    empty:'The house is quiet. A little heat stays in the bricks.',
    bed:'Slow crackle with a single settling log.', crackle:true, notes:[[9.2,'tap']],
    base:169, width:188, state:'steady', tongues:[[90,37,-.8,19,'#d85532'],[119,58,.3,23,'#eb703a'],[145,41,.8,20,'#ff9e51'],[117,34,-.2,23,'#ffb966']],
  },
  {
    name:'Forge', kind:'Work room', place:'#loom-ux', sky:'#343731',
    present:'Hands are making something here. The open mouth of the forge burns white.',
    empty:'The bellows rest. The iron is dark and the bench is clear.',
    bed:'A low bellows stroke, then two light strikes.', crackle:false, notes:[[.68,'error'],[.32,'tap'],[4.2,'receive']],
    base:160, width:162, state:'bright', tongues:[[90,40,-1.8,19,'#ef773c'],[145,58,1.7,23,'#ee8e47'],[119,69,.09,36,'#ffbd62'],[121,35,.1,28,'#fff2b2']],
  },
  {
    name:'Candle', kind:'Quiet room', place:'#pray', sky:'#292c3b',
    present:'One small light. Leave it burning and go in peace.',
    empty:'An unlit wick in a quiet alcove. The next light is yours.',
    bed:'One high, soft note with a long space after it.', crackle:false, notes:[[13,'receive']],
    base:125, width:135, state:'steady', tongues:[[120,69,.14,9,'#eb8e51'],[120,47,.13,6,'#fbe3a4']],
  },
  {
    name:'Lantern', kind:'Carried message', place:'On the path', sky:'#2e4149',
    present:'A message is on its way. Its light travels with whoever carries it.',
    empty:'The lantern hangs at the door, ready for the next letter.',
    bed:'A little wick and two rising notes, like a step away.', crackle:true, notes:[[7.8,'send']],
    base:151, width:129, state:'steady', tongues:[[120,76,-.25,13,'#ef9e50'],[120,47,.32,9,'#ffe9a5']],
  },
  {
    name:'Pilot light', kind:'Sleeping room', place:'Back of the house', sky:'#212a32',
    present:'Even after a long absence, a small blue light shows the way back.',
    empty:'Nobody has visited in a while. The blue pinpoint stays on.',
    bed:'A low pulse, with a long quiet interval.', crackle:false, notes:[[17,'error']],
    base:126, width:116, state:'steady', tongues:[[120,59,.18,13,'#499def'],[120,46,-.05,7,'#b5eaf5']],
  },
];

const nav = document.querySelector('nav');
const scene = document.querySelector('.scene');
const get = id => document.getElementById(id);
const emptyButton = get('empty');
const soundButton = get('sound');
let selected = 0, empty = false, optedIn = false, unlocked = false, beat = 0;
let flame, sound, mountFlame, timeout, audioError = '';
try { optedIn = localStorage.getItem('loom:room-fire-audition') === 'on'; } catch {}

function quietRoom() {
  return empty && ['Forge','Candle','Lantern'].includes(rooms[selected].name);
}
function playScore() {
  clearTimeout(timeout);
  if (!unlocked || document.hidden || !optedIn || !sound) return;
  const room = rooms[selected];
  if (quietRoom()) return;
  const [seconds, note] = room.notes[beat % room.notes.length];
  sound.play(note);
  beat++;
  timeout = setTimeout(playScore, seconds * (empty ? 2 : 1) * 1000);
}
function syncScore() {
  clearTimeout(timeout);
  beat = 0;
  if (!sound || !unlocked) return;
  sound.setFireBed(optedIn && rooms[selected].crackle && !quietRoom());
  if (optedIn && !document.hidden) playScore();
}
function buttons() {
  emptyButton.setAttribute('aria-pressed', String(empty));
  soundButton.setAttribute('aria-pressed', String(optedIn && !!sound));
  soundButton.textContent = sound ? (optedIn ? 'Sound on' : 'Sound off') : 'Sound unavailable';
  soundButton.disabled = !sound;
}
function draw() {
  const room = rooms[selected];
  const scale = room.width / 240;
  const baselineGap = 224 - room.base - 27 * scale;
  scene.style.setProperty('--sky',room.sky);
  scene.style.setProperty('--width',`${room.width / 360 * 100}%`);
  scene.style.setProperty('--bottom',`${baselineGap / 224 * 100}%`);
  scene.setAttribute('aria-label', `${room.name}. ${empty ? room.empty : room.present}`);
  get('vessel').innerHTML = materials + drawings[selected]();
  get('kind').textContent = room.kind;
  get('place').textContent = room.place;
  get('fire-name').textContent = room.name;
  get('description').textContent = empty ? room.empty : room.present;
  get('sound-note').textContent = quietRoom() ? 'The room is silent.' : `Sound · ${room.bed}`;
  get('status').textContent = [mountFlame ? '' : 'Flame study unavailable.', audioError].filter(Boolean).join(' ');
  [...nav.children].forEach((button, index) => button.setAttribute('aria-pressed', String(selected === index)));
  flame?.destroy();
  flame = undefined;
  if (mountFlame && !quietRoom()) {
    const resting = empty ? (room.name === 'Pilot light' ? 'steady' : 'embers') : room.state;
    const tongues = empty && room.name === 'Pilot light'
      ? room.tongues.map(([x,h,lean,w,color]) => [x,h*.48,lean,w*.62,color]) : room.tongues;
    flame = mountFlame(get('flame'), resting, {bare:true,tongues,particles:selected===0});
  }
  buttons();
  syncScore();
}
for (const [index, room] of rooms.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = room.name;
  button.addEventListener('click', () => {
    selected = index;
    draw();
    if (!empty && index === 0) flame?.spark();
  });
  nav.append(button);
}
emptyButton.addEventListener('click', () => { empty = !empty; draw(); });

async function unlockSound() {
  if (!optedIn || !sound) return;
  const ok = await sound.setEnabled(true);
  if (!optedIn) return;
  unlocked = ok;
  audioError = ok ? '' : 'Audio unavailable on this device.';
  get('status').textContent = [mountFlame ? '' : 'Flame study unavailable.', audioError].filter(Boolean).join(' ');
  if (ok) syncScore();
}
soundButton.addEventListener('click', () => {
  optedIn = !optedIn;
  try { localStorage.setItem('loom:room-fire-audition',optedIn ? 'on' : 'off'); } catch {}
  if (optedIn) unlockSound();
  else {
    unlocked = false;
    clearTimeout(timeout);
    sound.setEnabled(false);
    sound.setFireBed(false);
    audioError = '';
    get('status').textContent = mountFlame ? '' : 'Flame study unavailable.';
  }
  buttons();
});
document.addEventListener('click', event => {
  if (event.target.closest('button') !== soundButton && optedIn && !unlocked) unlockSound();
});
document.addEventListener('visibilitychange', syncScore);
window.addEventListener('pagehide', e => {
  clearTimeout(timeout);
  if (!e.persisted) { flame?.destroy(); sound?.dispose(); }
});
window.addEventListener('pageshow', e => { if (e.persisted) syncScore(); });

// Only the pinned public sketch assembles its two draft modules from the preview host.
const hostedPreview = location.origin === 'https://raw.githack.com' &&
  /^\/mhoydich\/pointcast\/[a-f0-9]{40}\/public\/sketches\/loom-fire-family\/(?:index\.html)?$/.test(location.pathname);
const [flameModule,soundModule] = await Promise.allSettled([
  hostedPreview
    ? import('/mhoydich/pointcast/f5787a1d1ac5113ab10268f0fe267dd2694d75e0/public/loom/kit/flame.mjs')
    : import('/loom/kit/flame.mjs'),
  hostedPreview
    ? import('/mhoydich/pointcast/fefc09da6210de06a87f4eff6b6eab892f0eade3/public/loom/kit/sound.mjs')
    : import('/loom/kit/sound.mjs'),
]);
if (flameModule.status === 'fulfilled') mountFlame = flameModule.value.mountFlame;
if (soundModule.status === 'fulfilled') sound = soundModule.value.createLoomSound({storage:null});
draw();
