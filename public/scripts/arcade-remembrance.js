(() => {
  'use strict';

  // Inline scripts can run again during Astro navigation; keep one boot owner.
  if (window.__pointcastArcadeRemembrance) {
    window.__pointcastArcadeRemembrance.boot();
    return;
  }
  const cleanups = new Set();

  const COLORS = ['#f2bd56', '#77d9d0', '#ff7895', '#b69aff'];
  const TITLES = { sprint: 'Super Sprint', gauntlet: 'Gauntlet', offroad: 'Super Off Road', room: 'The room' };
  const VERBS = { sprint: 'Start a lap', gauntlet: 'Cast magic', offroad: 'Hit Nitro', room: 'Light the room' };
  const HINTS = {
    sprint: 'Turn the wheel. Roll the ball. Start a lap together.',
    gauntlet: 'Roll to explore. Turn to face a new direction. Cast a little magic.',
    offroad: 'Turn into the dirt. Roll to change your line. Give it a little Nitro.',
    room: 'Roll the light around. Turn the wheel. Let the room glow.'
  };

  function initialize(root) {
    if (root.dataset.arcadeReady) return;
    root.dataset.arcadeReady = 'true';
    const canvas = root.querySelector('[data-arcade-screen]');
    const ctx = canvas?.getContext('2d');
    if (!ctx) { delete root.dataset.arcadeReady; return; }
    const controller = new AbortController();
    let disposed = false;
    function listen(target, event, callback, options = {}) {
      target?.addEventListener?.(event, callback, { ...options, signal: controller.signal });
    }
    const label = root.querySelector('[data-screen-label]');
    const status = root.querySelector('[data-cabinet-status]');
    const wheel = root.querySelector('[data-wheel]');
    const ball = root.querySelector('[data-trackball]');
    const soundButton = root.querySelector('[data-sound]');
    const modeButtons = [...root.querySelectorAll('[data-cabinet]')];
    const seats = [...root.querySelectorAll('[data-player]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const players = COLORS.map((color, i) => ({ color, active: i === 0, progress: i * .85, x: [2, 4, 8, 10][i], y: 2, heading: -Math.PI / 2 }));
    const state = { mode: 'sprint', steering: 0, wheelAngle: 0, rollX: 0, rollY: 0, time: 0, action: 0, boost: 0, pulse: 0, centerX: 450, centerY: 244, sparks: [], magic: [], animateUntil: 0, sound: false };
    let audioContext = null;
    let frame = 0;
    let last = 0;
    let hidden = document.hidden;
    const keys = new Set();
    const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 137.51) % 900, y: (i * 73.17) % 480, r: i % 5 === 0 ? 1.5 : .7 }));
    const maze = [
      '11111111111111111',
      '10000010000000001',
      '10000010000000001',
      '10111010111011101',
      '10000000000010001',
      '11101011101010111',
      '10001000001000001',
      '10111011111011101',
      '10000000000000001',
      '10001000100010001',
      '11111111111111111'
    ];
    const tile = 34;
    const mazeX = (900 - maze[0].length * tile) / 2;
    const mazeY = 62;

    function destroy() {
      if (disposed) return;
      disposed = true; controller.abort(); keys.clear();
      if (frame) cancelAnimationFrame(frame);
      frame = 0; last = 0; state.sound = false;
      if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
      audioContext = null;
      delete root.dataset.arcadeReady; cleanups.delete(destroy);
    }
    cleanups.add(destroy);

    function feedback(message) { if (status) status.textContent = message; }
    function awake(seconds = 3) { state.animateUntil = performance.now() + seconds * 1000; schedule(); }
    function schedule() { if (!disposed && !frame && !hidden) frame = requestAnimationFrame(tick); }
    function activePlayers() { return players.filter(p => p.active); }
    function tone(frequency = 220, duration = .12, type = 'sine') {
      if (!state.sound || !audioContext || audioContext.state !== 'running') return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(.035, audioContext.currentTime + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
    }
    function resetPositions() {
      players.forEach((p, i) => { p.progress = i * .85; p.x = [2, 4, 8, 10][i]; p.y = 2; p.heading = -Math.PI / 2; });
      state.steering = 0; state.wheelAngle = 0; state.rollX = 0; state.rollY = 0;
      state.boost = 0; state.pulse = 0; state.action = 0; state.magic = []; state.sparks = [];
      state.centerX = 450; state.centerY = 244;
      wheel?.style.setProperty('--wheel-angle', '0deg');
      ball?.style.setProperty('--ball-x', '0px'); ball?.style.setProperty('--ball-y', '0px');
    }
    function updateSeats() {
      seats.forEach(button => {
        const i = Number(button.dataset.player);
        const disabled = i === 3 && (state.mode === 'sprint' || state.mode === 'offroad');
        const playing = Boolean(players[i]?.active);
        button.disabled = disabled;
        button.setAttribute('aria-disabled', String(disabled));
        button.setAttribute('aria-pressed', String(playing));
        const seatLabel = button.querySelector('span');
        if (seatLabel) seatLabel.textContent = disabled ? 'four-player seat' : playing ? 'playing' : 'join in';
        button.setAttribute('aria-label', `Player ${i + 1}: ${disabled ? 'available in Gauntlet and The room' : playing ? 'playing, press to leave' : 'press to join'}`);
      });
    }
    function updateSoundButton() {
      if (!soundButton) return;
      soundButton.setAttribute('aria-pressed', String(state.sound));
      soundButton.textContent = state.sound ? 'Sound on' : 'Sound off';
    }
    function chooseMode(mode) {
      if (!TITLES[mode]) return;
      state.mode = mode; resetPositions();
      if (mode === 'sprint' || mode === 'offroad') players[3].active = false;
      if (!activePlayers().length) players[0].active = true;
      modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cabinet === mode)));
      updateSeats();
      if (label) label.textContent = TITLES[mode];
      root.querySelectorAll('[data-action-label]').forEach(el => { el.textContent = VERBS[mode]; });
      root.querySelector('[data-action]')?.setAttribute('aria-label', VERBS[mode]);
      root.dataset.mode = mode;
      feedback(HINTS[mode]); awake(1); draw();
    }
    function walk(dx, dy) {
      activePlayers().forEach((p, i) => {
        const nextX = Math.max(1.15, Math.min(15.85, p.x + dx));
        const nextY = Math.max(1.15, Math.min(9.85, p.y + dy));
        if (maze[Math.floor(p.y)]?.[Math.floor(nextX)] === '0') p.x = nextX;
        if (maze[Math.floor(nextY)]?.[Math.floor(p.x)] === '0') p.y = nextY;
        if (dx || dy) p.heading = Math.atan2(dy, dx) + i * .015;
      });
    }
    function steer(amount) {
      state.steering = Math.max(-1, Math.min(1, state.steering + amount));
      state.wheelAngle = Math.max(-160, Math.min(160, state.wheelAngle + amount * 90));
      wheel?.style.setProperty('--wheel-angle', `${state.wheelAngle}deg`);
      if (state.mode === 'gauntlet') {
        activePlayers().forEach(p => { p.heading += amount * 2; });
        walk(Math.cos(players[0].heading) * Math.abs(amount) * .7, Math.sin(players[0].heading) * Math.abs(amount) * .7);
      }
      if (state.mode === 'room') state.centerX = Math.max(130, Math.min(770, state.centerX + amount * 90));
      awake(); draw();
    }
    function roll(dx, dy) {
      state.rollX += dx * .15; state.rollY += dy * .15;
      ball?.style.setProperty('--ball-x', `${state.rollX % 40}px`);
      ball?.style.setProperty('--ball-y', `${state.rollY % 40}px`);
      if (state.mode === 'gauntlet') walk(dx * .012, dy * .012);
      else if (state.mode === 'room') {
        state.centerX = Math.max(120, Math.min(780, state.centerX + dx * 1.2));
        state.centerY = Math.max(110, Math.min(380, state.centerY + dy * 1.2));
        state.sparks.push({ x: state.centerX, y: state.centerY, life: 1, color: COLORS[Math.floor(state.time * 2) % 4] });
      } else {
        state.steering = Math.max(-1, Math.min(1, state.steering + dx * .009));
        activePlayers().forEach(p => { p.progress += (dx + dy) * .001; });
      }
      awake(); draw();
    }
    function action() {
      state.action++; state.pulse = 1; state.boost = state.mode === 'offroad' ? 2.4 : 2;
      if (state.mode === 'gauntlet') activePlayers().forEach(p => {
        state.magic.push({ x: mazeX + (p.x + .5) * tile, y: mazeY + (p.y + .5) * tile, dx: Math.cos(p.heading), dy: Math.sin(p.heading), color: p.color, life: 1 });
      });
      if (state.mode === 'room') {
        for (let i = 0; i < 24; i++) state.sparks.push({ x: state.centerX + Math.cos(i / 24 * Math.PI * 2) * 80, y: state.centerY + Math.sin(i / 24 * Math.PI * 2) * 80, life: 1, color: COLORS[i % 4] });
      }
      feedback({ sprint: `Lap ${state.action}. ${activePlayers().length} at the wheel. Keep turning.`, gauntlet: `A little magic, shared by ${activePlayers().length}. Roll onward.`, offroad: `Nitro ${state.action}. A little dirt, a little friendly competition.`, room: `${activePlayers().length} lights in the room. Stay a while.` }[state.mode]);
      tone(state.mode === 'gauntlet' ? 523.25 : state.mode === 'offroad' ? 164.81 : 329.63, .22);
      awake(5); draw();
    }
    function draggable(element, move) {
      if (!element) return;
      let pointer = null, x = 0, y = 0, moved = false;
      element.style.touchAction = 'none';
      listen(element, 'pointerdown', event => {
        if (event.button !== 0) return;
        pointer = event.pointerId; x = event.clientX; y = event.clientY; moved = false;
        element.setPointerCapture(pointer); element.dataset.dragging = 'true'; awake();
      });
      listen(element, 'pointermove', event => {
        if (event.pointerId !== pointer) return;
        const dx = event.clientX - x, dy = event.clientY - y;
        if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
        move(dx, dy); x = event.clientX; y = event.clientY;
      });
      const stop = event => { if (event.pointerId === pointer) { pointer = null; delete element.dataset.dragging; } };
      listen(element, 'pointerup', stop); listen(element, 'pointercancel', stop);
      listen(element, 'lostpointercapture', stop);
      listen(element, 'click', event => { if (!moved || event.detail === 0) move(12, 0); });
    }
    draggable(wheel, dx => steer(dx * .014));
    draggable(ball, roll);
    modeButtons.forEach(button => listen(button, 'click', () => chooseMode(button.dataset.cabinet)));
    listen(root.querySelector('[data-action]'), 'click', action);
    root.querySelectorAll('[data-steer]').forEach(button => listen(button, 'click', () => {
      const direction = button.dataset.steer === 'left' ? -1 : 1;
      if (state.mode === 'gauntlet') { walk(direction * .6, 0); awake(); draw(); }
      else steer(direction * .28);
    }));
    seats.forEach(button => listen(button, 'click', () => {
      const i = Number(button.dataset.player);
      if (!players[i] || button.disabled) return;
      if (players[i].active && activePlayers().length === 1) { feedback('One light stays on. Invite someone to the next seat.'); return; }
      players[i].active = !players[i].active;
      updateSeats();
      feedback(`Player ${i + 1} ${players[i].active ? 'joined' : 'left'} the cabinet. ${activePlayers().length} playing together on this device.`);
      state.pulse = .7; tone(220 * (1 + i * .25)); awake(2); draw();
    }));
    listen(root.querySelector('[data-reset]'), 'click', () => { resetPositions(); feedback('A fresh quarter. Same good company.'); awake(1); draw(); });
    listen(soundButton, 'click', async () => {
      state.sound = !state.sound;
      updateSoundButton();
      if (state.sound) {
        try {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) throw new Error('Audio unavailable');
          if (!audioContext) audioContext = new Audio();
          await audioContext.resume();
          if (disposed || !state.sound) return;
          tone(329.63, .18);
          feedback('Sound on. A few original cabinet tones.');
        } catch (_) {
          if (disposed) return;
          state.sound = false; updateSoundButton(); feedback('Sound is unavailable here. The cabinet still plays.');
        }
      } else feedback('Sound off. The glow stays on.');
    });
    listen(root, 'keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) return;
      // Space retains the native click behavior of focused buttons.
      if (event.key === ' ' && event.target.closest('button, a')) return;
      if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && state.mode !== 'gauntlet') return;
      event.preventDefault();
      if (event.key === ' ') { if (!event.repeat) action(); return; }
      keys.add(event.key); awake();
    });
    listen(root, 'keyup', event => keys.delete(event.key));
    listen(root, 'focusout', event => { if (!root.contains(event.relatedTarget)) keys.clear(); });
    listen(window, 'blur', () => keys.clear());

    function rounded(x, y, w, h, r = 8) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
    function text(value, x, y, size = 12, color = '#b7c1d3', align = 'center') {
      ctx.font = `500 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y);
    }
    function glow(color, blur = 12) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
    function base() {
      const gradient = ctx.createLinearGradient(0, 0, 900, 480);
      gradient.addColorStop(0, '#101c2a'); gradient.addColorStop(.5, '#0c1220'); gradient.addColorStop(1, '#20192a');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 900, 480);
      stars.forEach(star => { ctx.fillStyle = '#b9c4d126'; ctx.fillRect(star.x, star.y, star.r, star.r); });
    }
    function drawTrack() {
      const dirt = state.mode === 'offroad';
      const cx = 450, cy = 239, rx = 321, ry = 139;
      ctx.save();
      ctx.strokeStyle = dirt ? '#756044' : '#506273'; ctx.lineWidth = 88;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = dirt ? '#45352b' : '#1b2939'; ctx.lineWidth = 76; ctx.stroke();
      ctx.strokeStyle = dirt ? '#9e795327' : '#cadde334'; ctx.lineWidth = 1.5; ctx.setLineDash([10, 13]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = dirt ? '#b48c58' : '#7bdad2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx + 43, ry + 43, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = dirt ? '#937947' : '#f3bd5c';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx - 43, ry - 43, 0, 0, Math.PI * 2); ctx.stroke();
      if (dirt) {
        for (let i = 0; i < 48; i++) {
          const a = i * .71, lane = (i % 5 - 2) * 9;
          ctx.fillStyle = '#cfb58440'; ctx.fillRect(cx + Math.cos(a) * (rx + lane), cy + Math.sin(a) * (ry + lane), 3, 2);
        }
        [[210,210],[681,252],[331,168],[582,298]].forEach(([x,y]) => {
          ctx.fillStyle = '#593e2c'; ctx.beginPath(); ctx.ellipse(x,y,19,7,.3,0,Math.PI*2); ctx.fill();
          ctx.strokeStyle='#c69f6429';ctx.lineWidth=2;ctx.stroke();
        });
      }
      for (let x = 412; x < 490; x += 13) for (let y = 62; y < 105; y += 11) {
        ctx.fillStyle = ((x - 412) / 13 + (y - 62) / 11) % 2 === 0 ? '#e5e6d1' : '#18202c'; ctx.fillRect(x, y, 13, 11);
      }
      text(dirt ? 'A LITTLE DIRT. A LOT OF COMPANY.' : 'SHOULDER TO SHOULDER.', 450, 232, 16, '#e7d2a8');
      text(`${activePlayers().length} AT THE CABINET`, 450, 259, 11, '#8eb3b8');
      if (state.pulse > 0) {
        ctx.globalAlpha = state.pulse * .6; ctx.strokeStyle = dirt ? '#f2bd56' : '#77d9d0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx,cy,130 + (1-state.pulse)*80,44 + (1-state.pulse)*24,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      }
      activePlayers().forEach((p, i) => {
        const a = p.progress - Math.PI / 2;
        const offset = (i - 1) * 18 + state.steering * 21;
        const bump = dirt ? Math.sin(p.progress * 17 + i) * 2.4 : 0;
        const x = cx + Math.cos(a) * (rx + offset), y = cy + Math.sin(a) * (ry + offset) + bump;
        const angle = Math.atan2((ry + offset) * Math.cos(a), -(rx + offset) * Math.sin(a)) + state.steering * .14;
        ctx.save(); ctx.translate(x,y);ctx.rotate(angle);
        if (dirt || state.boost > .1) {
          const length = state.boost > .1 ? 27 : 12;
          const trail = ctx.createLinearGradient(-length,0,-7,0);trail.addColorStop(0,'#f1ca7200');trail.addColorStop(1,dirt?'#b48c5870':p.color+'80');
          ctx.fillStyle=trail;ctx.beginPath();ctx.moveTo(-length,-7);ctx.lineTo(-8,-4);ctx.lineTo(-8,4);ctx.lineTo(-length,7);ctx.fill();
        }
        ctx.fillStyle='#0009';rounded(-12,-9,28,19,5);ctx.fill();
        ctx.fillStyle='#080d15';ctx.fillRect(-8,-11,7,4);ctx.fillRect(5,-11,7,4);ctx.fillRect(-8,7,7,4);ctx.fillRect(5,7,7,4);
        glow(p.color,12);ctx.fillStyle=p.color;rounded(-12,-7,27,14,4);ctx.fill();ctx.shadowBlur=0;
        ctx.fillStyle='#14243c';rounded(-1,-5,8,10,2);ctx.fill();ctx.fillStyle='#f7ead6';ctx.fillRect(11,-4,3,3);ctx.fillRect(11,2,3,3);
        ctx.restore();text(`P${players.indexOf(p)+1}`,x,y-20,10,p.color);
      });ctx.restore();
    }
    function drawMaze() {
      ctx.save();
      maze.forEach((row,y)=>[...row].forEach((cell,x)=>{
        const px=mazeX+x*tile,py=mazeY+y*tile;
        if(cell==='1'){
          ctx.fillStyle='#283849';rounded(px+2,py+2,tile-4,tile-4,4);ctx.fill();
          ctx.strokeStyle='#65888860';ctx.lineWidth=1;ctx.stroke();
          ctx.fillStyle='#85b8b015';ctx.fillRect(px+6,py+5,tile-12,2);
        } else {ctx.fillStyle='#141f2c';ctx.fillRect(px,py,tile,tile);ctx.fillStyle='#becaa509';ctx.fillRect(px+6,py+8,3,3);}
      }));
      [[3,4],[13,2],[9,8],[1,8]].forEach(([x,y],i)=>{
        const px=mazeX+(x+.5)*tile,py=mazeY+(y+.5)*tile;
        glow('#f1b859',10);ctx.fillStyle='#f1b859';ctx.beginPath();ctx.moveTo(px,py-8);ctx.quadraticCurveTo(px+10,py+7,px,py+9);ctx.quadraticCurveTo(px-10,py+4,px,py-8);ctx.fill();ctx.shadowBlur=0;
      });
      activePlayers().forEach(p=>{
        const x=mazeX+(p.x+.5)*tile,y=mazeY+(p.y+.5)*tile;
        glow(p.color,14);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        ctx.fillStyle='#152333';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+Math.cos(p.heading)*11,y+Math.sin(p.heading)*11);ctx.lineTo(x+Math.cos(p.heading)*17,y+Math.sin(p.heading)*17);ctx.stroke();
        text(`P${players.indexOf(p)+1}`,x,y-17,9,p.color);
      });
      state.magic.forEach(m=>{
        ctx.globalAlpha=m.life;glow(m.color,16);ctx.fillStyle=m.color;ctx.beginPath();ctx.arc(m.x,m.y,4,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=m.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(m.x,m.y,7+(1-m.life)*18,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;
      });
      text('FOUR DIFFERENT COLORS. ONE WAY THROUGH.',450,457,12,'#d6c6a4');ctx.restore();
    }
    function drawRoom() {
      ctx.save();
      const x=state.centerX,y=state.centerY;
      const haze=ctx.createRadialGradient(x,y,5,x,y,260);haze.addColorStop(0,'#8d79ff25');haze.addColorStop(.5,'#39d5c017');haze.addColorStop(1,'#11182700');ctx.fillStyle=haze;ctx.fillRect(0,0,900,480);
      // A row of little cabinets, each with room for someone beside you.
      for(let i=0;i<5;i++){
        const px=153+i*128,py=98+Math.abs(2-i)*15;
        ctx.fillStyle='#080e19';ctx.beginPath();ctx.moveTo(px-42,py);ctx.lineTo(px+35,py);ctx.lineTo(px+44,py+42);ctx.lineTo(px+30,py+152);ctx.lineTo(px+44,py+180);ctx.lineTo(px-48,py+180);ctx.lineTo(px-37,py+140);ctx.closePath();ctx.fill();
        ctx.fillStyle=COLORS[i%4]+'55';rounded(px-30,py+9,60,14,2);ctx.fill();
        glow(COLORS[i%4],15);ctx.fillStyle=COLORS[i%4]+'50';rounded(px-26,py+39,53,60,5);ctx.fill();ctx.shadowBlur=0;
        ctx.strokeStyle=COLORS[i%4]+'bb';ctx.lineWidth=1;ctx.stroke();
        ctx.fillStyle='#102439';rounded(px-21,py+44,43,49,3);ctx.fill();
        ctx.strokeStyle=COLORS[i%4];ctx.beginPath();ctx.moveTo(px-14,py+70);ctx.lineTo(px-4,py+58);ctx.lineTo(px+10,py+75);ctx.lineTo(px+16,py+63);ctx.stroke();
        ctx.fillStyle='#4f4961';ctx.fillRect(px-31,py+113,61,12);ctx.fillStyle=COLORS[(i+1)%4];ctx.beginPath();ctx.arc(px+14,py+119,3,0,Math.PI*2);ctx.fill();
      }
      activePlayers().forEach((p,i)=>{
        const a=state.time*.35+i*Math.PI*2/activePlayers().length+state.steering;
        const radius=70+i*15;
        const px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius*.48;
        ctx.strokeStyle=p.color+'44';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.48,0,0,Math.PI*2);ctx.stroke();
        glow(p.color,24);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;text(`P${players.indexOf(p)+1}`,px,py-17,10,p.color);
        // Small abstract silhouettes stay distinct from the playable light.
        const seatX=320+players.indexOf(p)*88;
        ctx.fillStyle=p.color+'88';ctx.beginPath();ctx.arc(seatX,355,9,0,Math.PI*2);ctx.fill();rounded(seatX-13,369,26,34,12);ctx.fill();
      });
      if(state.pulse>0){ctx.globalAlpha=state.pulse*.7;ctx.strokeStyle='#ecd5ac';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,35+(1-state.pulse)*180,20+(1-state.pulse)*80,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
      state.sparks.forEach(s=>{ctx.globalAlpha=s.life;glow(s.color,12);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,s.y,2+s.life*2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;});
      text('THE BEST PART WAS WHO STOOD BESIDE YOU.',450,450,13,'#e5cba4');ctx.restore();
    }
    function draw() {
      ctx.save();ctx.setTransform(canvas.width/900,0,0,canvas.height/480,0,0);base();
      if(state.mode==='gauntlet')drawMaze();else if(state.mode==='room')drawRoom();else drawTrack();
      ctx.shadowBlur=0;ctx.fillStyle='#07101b88';ctx.fillRect(0,0,900,37);
      text('A MEMORY YOU CAN PLAY WITH',22,24,10,'#b4c6cc','left');text('ORIGINAL CABINET TOY',878,24,10,'#8ea4ae','right');
      // A quiet CRT texture; no flashing or strobing.
      ctx.fillStyle='#03070d16';for(let y=0;y<480;y+=4)ctx.fillRect(0,y,900,1);
      ctx.restore();
    }
    function update(dt) {
      state.time+=dt;
      const direction=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);
      if(state.mode==='gauntlet') {
        const vertical=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
        if(direction||vertical)walk(direction*dt*3.5,vertical*dt*3.5);
      } else if(direction)steer(direction*dt*1.7);
      if(state.mode==='sprint'||state.mode==='offroad')activePlayers().forEach((p,i)=>{p.progress+=dt*(.25+i*.012+(state.boost>0?.65:0));});
      state.boost=Math.max(0,state.boost-dt);state.pulse=Math.max(0,state.pulse-dt*.65);
      state.magic.forEach(m=>{m.x+=m.dx*dt*145;m.y+=m.dy*dt*145;m.life-=dt*.6;});state.magic=state.magic.filter(m=>m.life>0);
      state.sparks.forEach(s=>{s.life-=dt*.7;});state.sparks=state.sparks.filter(s=>s.life>0).slice(-80);
    }
    function tick(timestamp) {
      frame=0;
      if(disposed)return;
      if(!root.isConnected){destroy();return;}
      if(hidden){last=0;return;}
      const moving=!reduced.matches||timestamp<state.animateUntil||keys.size>0;
      const dt=last?Math.min((timestamp-last)/1000,.04):0;last=timestamp;
      if(moving)update(dt);draw();
      if(moving)schedule();else last=0;
    }
    function resize(){
      const dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(900*dpr);canvas.height=Math.round(480*dpr);draw();
    }
    listen(window, 'resize',resize,{passive:true});
    listen(document, 'visibilitychange',()=>{hidden=document.hidden;last=0;keys.clear();if(hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else schedule();});
    listen(reduced, 'change',()=>{last=0;draw();schedule();});
    // Initial paint remains still when reduced motion is requested.
    chooseMode('sprint');updateSoundButton();state.animateUntil=0;resize();schedule();
  }
  function boot(){document.querySelectorAll('[data-arcade]').forEach(initialize);}
  window.__pointcastArcadeRemembrance = { boot };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  document.addEventListener('astro:page-load',boot);
  document.addEventListener('astro:before-swap', () => { for (const cleanup of [...cleanups]) cleanup(); });
})();
