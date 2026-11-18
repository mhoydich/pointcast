// Item 21. Fixture actions change this mounted sketch only.
const asset = path => new URL('../../' + path, import.meta.url).href;
const hearth = asset('sketches/loom-kit/cards/hearth-unlit.webp');
const litHearth = asset('sketches/loom-kit/cards/hearth-poster.webp');
const portrait = name => asset('images/ufogp/' + name + '.svg');
const fixtures = asset('sketches/loom-kit/cards/cards.json');
const faces = {Ada:'ada', Lou:'lou', Tess:'tess'};
async function readCards() {
  let response;
  try { response = await fetch(fixtures, {credentials:'omit'}); }
  catch (error) { throw new Error('Connection unavailable', {cause:error}); }
  if (!response.ok) throw Error('Sample unavailable');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw Error('Invalid sample');
  return rows.map(row => {
    if (!row || !Object.hasOwn(faces,row.person) || typeof row.title !== 'string' || typeof row.room !== 'string') {
      throw Error('Unrecognized sample card');
    }
    const kind = isApproval(row) ? 'confirm' : row.kind === 'reply' ? 'reply' : 'note';
    return {...row,kind,art:portrait(faces[row.person]),action:{
      confirm:'Yes, in this demo', reply:'Send a thank-you', note:'Save for later'
    }[kind]};
  });
}
const resting = {
  loading: {title:'Opening the stack…', text:'The room’s notes are loading.', art:litHearth},
  empty: {title:'Nothing needs you.', text:'There are no more cards in this local stack.', action:'Restart the demo', art:hearth},
  offline: {title:'No connection.', text:'The stack couldn’t be checked. Try the local demo again.', action:'Try again', art:hearth},
  error: {title:'The stack didn’t load.', text:'Try again to reopen the local sample.', action:'Try again', art:hearth}
};

export function isApproval(card) {
  return card?.kind === 'confirm' && card.request?.recipient === 'demo-guest' &&
    card.request.state === 'awaiting' && typeof card.request.action === 'string' && card.request.action.trim().length > 0;
}

const optional = path => import(path).catch(() => null);
const mounts = new WeakMap();

export async function mountDemo(container, options = {}) {
  mounts.get(container)?.();
  const doc = container.ownerDocument;
  const hostSound = options.sound;
  const css = new URL('./card-stack.css',import.meta.url).href;
  if (![...doc.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === css)) {
    const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = css; doc.head.append(link);
  }
  const root = doc.createElement('section');
  root.className = 'lk-stack';
  root.setAttribute('data-stack','');
  root.setAttribute('aria-label','For You card stack sketch');
  root.innerHTML = `
    <header class="lk-top">
      <div class="lk-fire" data-fire><img alt="" width="40" height="40"></div>
      <div class="lk-brand"><h2>For You</h2><small>Local sketch</small></div>
      ${hostSound ? '' : '<button type="button" class="lk-sound" data-sound aria-pressed="false" disabled>Sound off</button>'}
    </header>
    <div class="lk-stage">
      <article class="lk-card" data-card>
        <div class="lk-art"><img class="lk-scene" alt="" draggable="false"><img class="lk-face" alt="" draggable="false"></div>
        <div class="lk-copy"><p class="lk-by"></p><h3></h3><p class="lk-desc"></p></div>
        <div class="lk-actions"><button type="button" class="lk-primary" data-primary></button><button type="button" class="lk-next" data-next aria-label="Next card"><i aria-hidden="true"></i></button></div>
      </article>
      <div class="lk-toast" hidden><span></span><button type="button" data-undo>Undo</button></div>
    </div>
    <nav class="lk-nav" aria-label="Sketch views"><button type="button" data-home aria-current="page">For You</button><button type="button" data-rooms>Rooms</button></nav>
    <dialog class="lk-sheet" aria-label="Rooms"><div class="lk-sheet-head"><h3>Rooms</h3><button type="button" data-close>Close</button></div>
      <p>Choose a room to see its first sample card.</p><div data-room-list></div></dialog>
    <span class="lk-sr" role="status" aria-live="polite"></span>`;
  container.replaceChildren(root);
  const find = selector => root.querySelector(selector);
  const card = find('[data-card]'), primary = find('[data-primary]'), next = find('[data-next]');
  const toast = find('.lk-toast'), undo = find('[data-undo]'), fire = find('[data-fire]');
  const sheet = find('dialog'), toggle = find('[data-sound]'), status = find('[role=status]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let state = Object.hasOwn(resting,options.state) ? options.state : 'loading';
  let notes = [], skipped = false;
  let index = 0, saved = null, undoTimer, sparkTimer, disposed = false;
  let sound = hostSound;
  let flame, motion, gesture, animation, departing, flameState = 'steady';
  const listeners = new AbortController();
  function play(name) { if (sound?.enabled) sound.play(name); }
  function setFire(value) {
    flameState = value;
    fire.dataset.flameState = value;
    fire.setAttribute('aria-label', {bright:'Waiting',spark:'Action received',steady:'Loading',embers:'At rest'}[value]);
    if (flame) {
      if (value === 'spark') flame.spark();
      else { flame.setAvailable(state !== 'offline' && state !== 'error'); flame.setState(value); }
    }
    else find('.lk-fire img').src = value === 'bright' || value === 'spark' ? litHearth : hearth;
  }
  function steadyState() { return state === 'ready' ? 'bright' : state === 'loading' ? 'steady' : 'embers'; }
  function clearUndo() {
    clearTimeout(undoTimer); saved = null; toast.hidden = true;
  }
  function draw(announce = false) {
    const item = state === 'ready' ? notes[index] : resting[state];
    root.dataset.state = state;
    root.dataset.cardType = item.kind || '';
    const confirm = isApproval(item);
    const scene = find('.lk-scene'), face = find('.lk-face');
    scene.src = confirm ? litHearth : item.art;
    scene.alt = confirm || !item.kind ? 'Baby Bonfire tabletop hearth' : item.person + '’s Noun portrait';
    face.hidden = !confirm;
    if (confirm) { face.src = item.art; face.alt = item.person + '’s Noun portrait'; }
    find('.lk-by').textContent = item.person ? item.person + ' · ' + item.room : 'For You';
    const title = state === 'empty' && skipped ? 'End of the stack.' : item.title;
    find('.lk-copy h3').textContent = title;
    find('.lk-desc').textContent = item.text || '';
    find('.lk-desc').hidden = !item.text;
    card.dataset.visual = item.kind || 'resting';
    primary.hidden = !item.action;
    // Never turn a second tap on a departing low-risk card into a yes.
    if (confirm && departing?.isConnected) primary.setAttribute('aria-disabled','true');
    else primary.removeAttribute('aria-disabled');
    primary.textContent = item.kind === 'confirm' && !confirm ? 'Next card' : item.action || '';
    next.hidden = state !== 'ready';
    setFire(steadyState());
    if (announce) status.textContent = title;
  }
  function enterCard() {
    animation?.cancel();
    const frames = reduce.matches
      ? [{opacity:.55},{opacity:1}]
      : [{opacity:.55,transform:'translateY(12px) scale(.94)'},{opacity:1,transform:'none'}];
    if (motion?.playMotion) void motion.playMotion(card,frames,{duration:motion.MOTION.cardIn,fade:[.55,1]});
    else animation = card.animate(frames,{duration:reduce.matches?150:260,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
  function leaveCard(drag) {
    departing?.remove();
    const visual = card.cloneNode(true);
    visual.inert = true;
    visual.setAttribute('aria-hidden','true');
    visual.classList.add('lk-departing');
    visual.removeAttribute('data-card');
    visual.querySelectorAll('button').forEach(b=>{ for(const a of [...b.attributes]) if (a.name.startsWith('data-')) b.removeAttribute(a.name); });
    const start = getComputedStyle(card).transform;
    const width = card.offsetWidth;
    const velocity = drag || {x:-1,y:0,vx:0,vy:0};
    const end = motion?.flickProjection?.(velocity,width) || {x:Math.sign(velocity.x || -1)*(width+24),y:0,angle:Math.sign(velocity.x || -1)*5};
    const frames = [{transform:start,opacity:1},{transform:'translate('+end.x+'px,'+end.y+'px) rotate('+end.angle+'deg)',opacity:0}];
    card.parentElement.append(visual); departing = visual;
    const finished = motion?.playMotion ? motion.playMotion(visual,frames,{duration:motion.MOTION.cardOut,fade:[1,0]})
      : visual.animate(reduce.matches ? [{opacity:1},{opacity:0}] : frames,{duration:reduce.matches?150:300,easing:'cubic-bezier(.2,.8,.2,1)'}).finished;
    function settle() {
      visual.remove();
      if (departing === visual) { departing = null; primary.removeAttribute('aria-disabled'); }
    }
    finished.then(settle,settle);
  }
  function advance(action, drag) {
    leaveCard(drag);
    resetDrag();
    const item = notes[index];
    const restoreFocus = card.contains(doc.activeElement);
    if (action) clearUndo(); else skipped = true;
    clearTimeout(sparkTimer);
    if (action && item.kind !== 'confirm') {
      saved = index;
      toast.querySelector('span').textContent = item.kind === 'reply' ? 'Thank-you sent in demo' : 'Saved for later';
      toast.hidden = false;
      undoTimer = setTimeout(clearUndo,5000);
    }
    index++;
    state = index < notes.length ? 'ready' : 'empty';
    draw(true); enterCard();
    if (action) {
      play(isApproval(item) ? 'yes' : item.kind === 'reply' ? 'send' : 'tap');
      navigator.vibrate?.(isApproval(item) ? [10,35,10] : 10);
      setFire('spark'); sparkTimer = setTimeout(()=>setFire(steadyState()),600);
    } else play('tap');
    if (state === 'empty') {
      play('stack-cleared');
      if (!action) { setFire('spark'); sparkTimer=setTimeout(()=>setFire(steadyState()),600); }
    }
    if (restoreFocus) primary.focus({preventScroll:true});
  }
  primary.addEventListener('click', () => {
    if (primary.getAttribute('aria-disabled') === 'true') return;
    if (state === 'ready') return advance(notes[index].kind !== 'confirm' || isApproval(notes[index]));
    void load(true);
  });
  next.addEventListener('click', () => { if (state === 'ready') advance(false); });
  undo.addEventListener('click', () => {
    if (saved === null) return;
    index = saved; state = 'ready'; clearUndo(); clearTimeout(sparkTimer); draw(true); enterCard(); play('undo'); primary.focus({preventScroll:true});
  });
  async function load(refocus) {
    clearUndo(); clearTimeout(sparkTimer); index = 0; skipped = false;
    state = 'loading'; draw();
    try {
      notes = await readCards();
      if (disposed) return;
      state = notes.length ? 'ready' : 'empty';
    } catch (error) {
      if (disposed) return;
      notes = [];
      state = error.cause instanceof TypeError || navigator.onLine === false ? 'offline' : 'error';
      play('error');
    }
    draw(true);
    if (refocus) { enterCard(); primary.focus({preventScroll:true}); }
  }
  function sheetMove(frames, fade) {
    const duration = motion?.MOTION.sheet || 380;
    if (motion?.playMotion) return motion.playMotion(sheet,frames,{duration,fade});
    sheet.getAnimations().forEach(anim=>anim.cancel());
    return sheet.animate(reduce.matches ? fade.map(opacity=>({opacity})) : frames,
      {duration:reduce.matches?150:duration,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.then(()=>true,()=>false);
  }
  let sheetDrag = null, closeSequence = 0;
  function closeSheet() {
    const token = ++closeSequence;
    const position = getComputedStyle(sheet).transform;
    void sheetMove([{transform:position},{transform:'translateY(100%)'}],[1,0]).then(done=>{
      if (done && token === closeSequence && sheet.open) sheet.close();
    });
  }
  find('[data-rooms]').onclick = () => {
    play('tap');
    const list = find('[data-room-list]'); list.replaceChildren();
    const rooms = new Set();
    for (const [i, item] of notes.entries()) {
      if (rooms.has(item.room)) continue;
      rooms.add(item.room);
      const button = doc.createElement('button'); button.type='button'; button.dataset.room=i;
      button.textContent=item.room; button.onclick = () => {
        sheet.close(); index=i; state='ready'; clearTimeout(sparkTimer); draw(true); enterCard(); primary.focus({preventScroll:true});
      }; list.append(button);
    }
    sheet.querySelector('p').textContent=rooms.size?'Choose a room to see its first sample card.':'Load the sample stack to see its rooms.';
    closeSequence++; sheet.style.transform=''; sheet.style.setProperty('--lk-backdrop','.58');
    sheet.showModal(); find('[data-close]').focus(); void sheetMove([{transform:'translateY(100%)'},{transform:'none'}],[0,1]);
  };
  find('[data-close]').onclick = closeSheet;
  sheet.addEventListener('cancel', e=>{e.preventDefault();closeSheet();});
  sheet.addEventListener('pointerdown', e=>{
    if (!e.isPrimary || e.button!==0 || e.target.closest('button')) return;
    closeSequence++; motion?.cancelMotion?.(sheet); sheet.getAnimations().forEach(a=>a.cancel());
    sheetDrag={y:e.clientY,id:e.pointerId}; sheet.setPointerCapture(e.pointerId);
  });
  sheet.addEventListener('pointermove', e=>{
    if (sheetDrag?.id!==e.pointerId) return;
    const dy=Math.max(0,e.clientY-sheetDrag.y);
    if (!reduce.matches) sheet.style.transform='translateY('+dy+'px)';
    sheet.style.setProperty('--lk-backdrop',String(.58*Math.max(0,1-dy/sheet.offsetHeight)));
  });
  function releaseSheet(e) {
    if (sheetDrag?.id!==e.pointerId) return;
    const close=e.type==='pointerup' && e.clientY-sheetDrag.y>50;
    sheetDrag=null;
    if (close) closeSheet();
    else { const from=getComputedStyle(sheet).transform; sheet.style.transform=''; sheet.style.setProperty('--lk-backdrop','.58');
      void sheetMove([{transform:from},{transform:'none'}],[.85,1]); }
  }
  sheet.addEventListener('pointerup',releaseSheet); sheet.addEventListener('pointercancel',releaseSheet);
  find('[data-home]').onclick = () => { (primary.hidden ? find('[data-rooms]') : primary).focus({preventScroll:true}); };
  function resetDrag() { gesture = null; card.style.transform = ''; }
  card.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0 || state !== 'ready' || e.target.closest('button')) return;
    gesture = {id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp};
  });
  card.addEventListener('pointermove', e => {
    if (gesture?.id !== e.pointerId) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    if (!gesture.dragging && Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy)) {
      card.setPointerCapture(e.pointerId); animation?.cancel(); motion?.cancelMotion?.(card); gesture.dragging = true;
    }
    if (gesture.dragging && !reduce.matches) card.style.transform = 'translateX('+dx*.65+'px) rotate('+Math.max(-6,Math.min(6,dx/23))+'deg)';
  });
  card.addEventListener('pointerup', e => {
    if (gesture?.id !== e.pointerId) return;
    const flick = gesture.dragging && Math.abs(e.clientX-gesture.x)>48;
    const x=e.clientX-gesture.x, y=e.clientY-gesture.y, dt=Math.max(1,e.timeStamp-gesture.t);
    if (flick) advance(false,{x,y,vx:x/dt,vy:y/dt}); else resetDrag();
  });
  card.addEventListener('pointercancel',resetDrag);
  if (toggle) toggle.onclick = async () => {
    if (!sound) return;
    const enable = !sound.enabled;
    if (!await sound.setEnabled(enable) && enable) {
      await sound.setEnabled(false); status.textContent = 'Audio is unavailable on this device.';
    }
    if (disposed) return;
    updateSound(); play('tap');
  };
  function updateSound() {
    toggle.disabled = !sound;
    toggle.textContent = sound ? (sound.enabled ? 'Sound on' : 'Sound off') : 'Sound unavailable';
    toggle.setAttribute('aria-pressed',String(Boolean(sound?.enabled)));
  }
  function unlock() { if (sound?.enabled) void sound.unlock(); }
  if (toggle) {
    root.addEventListener('pointerdown',unlock); root.addEventListener('keydown',unlock);
  }
  function destroy() {
    if (disposed) return;
    disposed = true; clearUndo(); clearTimeout(sparkTimer);  animation?.cancel();
    listeners.abort();
    if (!hostSound) sound?.dispose();
    flame?.destroy?.(); root.remove(); mounts.delete(container);
  }
  mounts.set(container,destroy);
  draw();
  const initialRead = options.state && Object.hasOwn(resting,options.state) ? Promise.resolve() : load(false);
  const [soundModule, flameModule, motionModule] = await Promise.all([
    hostSound ? null : optional(options.kit?.sound || './sound.mjs'),
    optional(options.kit?.flame || './flame.mjs'), optional(options.kit?.motion || './motion.mjs')
  ]);
  if (disposed) return destroy;
  if (soundModule?.createLoomSound) sound = soundModule.createLoomSound();
  if (toggle) updateSound();
  if (flameModule?.mountFlame) {
    fire.replaceChildren();
    flame = flameModule.mountFlame(fire,steadyState(),{bare:true});
    setFire(flameState);
  }
  motion = motionModule;
  if (motion?.bindPress) for (const button of root.querySelectorAll('button')) {
    motion.bindPress(button,{signal:listeners.signal});
  }
  await initialRead;
  return destroy;
}
