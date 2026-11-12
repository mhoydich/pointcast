// Baby Bonfire room: scenery, flame, embers, sound and "blow on it", built on the spatial kit.
// Everything is local. No network use other than files in this folder.

export const FIRE = { x: 0, y: 0.75, z: -2.2 };       // table-top point under the fireplace (metres)
const ARCH_YAW = 0;                                    // which way the arch opening faces (radians about Y)
const MAX_EMBERS = 60;
export const ROOM_C = { x: 0, z: -1.6 };     // centre of the curved wall
export const ROOM_R = 3.6;
const ARC = Math.PI * 5 / 3;                  // 300 degrees of wall; the 60 degree gap faces the viewer's back
// Flame placement in model space (metres), tuned against the arch opening of baby-bonfire.glb
const FLAME = { y: 0.030, z: 0.030, w: 0.034, h: 0.040 };

/* ---------- the four exits: slim door frames ---------- */
export function doorBuilder(place, ctx) {
  const { THREE, addBox, addInstance, addLabel, shared } = ctx;
  const a = ctx.anchor, sl = place.slot;
  a.rotation.y = Math.atan2(-(ROOM_C.x - sl.x), -(ROOM_C.z - sl.z));   // local -z faces the room centre
  a.userData.standDistance = -1.2;   // doors face inward: the stand point is 1.2 m inside the room, not outside the wall
  a.updateWorldMatrix(true, false);
  const wood = '#7a5240', lintel = '#d9b48a';
  addBox({ parent: a, x: -0.5, y: 1.0, sx: 0.1, sy: 2.0, sz: 0.14, color: wood });
  addBox({ parent: a, x: 0.5, y: 1.0, sx: 0.1, sy: 2.0, sz: 0.14, color: wood });
  addBox({ parent: a, y: 2.05, sx: 1.1, sy: 0.1, sz: 0.16, color: lintel });
  const spatialDoor = !!place.spatial;
  const m = new THREE.Matrix4(), p = new THREE.Vector3(0, 0.98, 0.0), q = new THREE.Quaternion(), sc = new THREE.Vector3(0.9, 1.96, 1);
  if (!doorPanelMat) doorPanelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, fog: false });
  addInstance('door-panel', shared.plane, doorPanelMat, m.compose(p, q, sc).premultiply(a.matrixWorld), spatialDoor ? '#c9b4f0' : '#ffbe85');
  const label = addLabel(place.title, { glyph: place.glyph, sub: spatialDoor ? '3D room' : 'page', size: 0.07, billboard: true, maxWidth: 1.4, bottom: 2.14 }, a);
  if (label) label.setColor('#f3e9d8');
  // The kit's own place hit: select opens the door's panel, and so does a gaze dwell (panel only,
  // never a move or a link), so someone with no controller and no tracked hands can still read it.
  ctx.addPlaceHit(place, a, { center: [0, 1.05, 0], size: [1.0, 2.1, 0.4], highlightRadius: 0.9,
    onHover: (h) => { if (label) label.setColor(h ? '#ffffff' : '#f3e9d8'); } });
  return a;
}
let doorPanelMat = null;

export async function decorate(ctx) {
  const { THREE, scene, camera, renderer, onFrame, loadGLB } = ctx;
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => !!(ctx.reducedMotion || (mq && mq.matches));   // read live, so a change takes effect at once
  const state = { blow: false, power: 0, holder: null, haptics: 0, model: 'none', sound: 'off' };
  window.__hearth = { state, ctx, mats: {} };

  /* ---------- shared materials and geometries ---------- */
  const plaster = new THREE.MeshLambertMaterial({ color: 0xc48a68, emissive: 0x5c3a30, side: THREE.DoubleSide });
  const plasterLight = new THREE.MeshLambertMaterial({ color: 0xc89a7c, emissive: 0x42302c });
  const stone = new THREE.MeshLambertMaterial({ color: 0x5b5560, emissive: 0x1c1a22 });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x44323c, emissive: 0x20141a });
  const wood = new THREE.MeshLambertMaterial({ color: 0x8b6248, emissive: 0x24160f });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const solidMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x1c1a22 });
  const add = (geo, mat, x, y, z, sx, sy, sz, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry;
    m.userData.solid = true; scene.add(m); return m;
  };

  // Curved plaster wall: a 220 degree arc behind the table, open toward the viewer (+z).
  const R = ROOM_R, H = 2.9;
  const arc = ARC;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 40, 1, true, Math.PI - arc / 2, arc), plaster);
  wall.position.set(0, H / 2, ROOM_C.z); wall.name = 'wall';
  scene.add(wall);
  // floor
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.6, 40), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.01, ROOM_C.z); floor.name = 'floor'; scene.add(floor);
  // low cantilevered roof slab over the table (Wright-style horizontal plane)
  add(box, plasterLight, 0, H, -2.4, 5.6, 0.14, 2.8).name = 'roof';
  // textile-block frieze: one repeating pattern drawn on a small canvas
  const fc = document.createElement('canvas'); fc.width = 256; fc.height = 64;
  const g = fc.getContext('2d');
  g.fillStyle = '#7d4f43'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#c89a7c';
  for (let i = 0; i < 8; i++) { g.fillRect(i * 32 + 4, 8, 24, 48); g.fillStyle = i % 2 ? '#c89a7c' : '#3a2a52'; g.fillRect(i * 32 + 10, 20, 12, 24); g.fillStyle = '#c89a7c'; }
  const ftex = new THREE.CanvasTexture(fc); ftex.wrapS = THREE.RepeatWrapping; ftex.repeat.set(5, 1); ftex.colorSpace = THREE.SRGBColorSpace;
  const frieze = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.32, 40, 1, true, Math.PI - arc / 2, arc), new THREE.MeshBasicMaterial({ map: ftex, side: THREE.DoubleSide }));
  frieze.position.set(0, 2.45, ROOM_C.z); frieze.name = 'frieze'; scene.add(frieze);

  // stone table: slab on two piers (top at y = 0.75), and a bench beside it. Instanced: one draw call.
  const solidBoxes = [];
  const solid = (x, y, z, sx, sy, sz, color) => { ctx.addBox({ key: 'hearth-solid', material: solidMat, x, y, z, sx, sy, sz, color }); solidBoxes.push([x, y, z, sx, sy, sz]); };
  solid(FIRE.x, FIRE.y - 0.03, FIRE.z, 1.3, 0.06, 0.55, '#8f8898');
  solid(FIRE.x - 0.5, (FIRE.y - 0.06) / 2, FIRE.z, 0.16, FIRE.y - 0.06, 0.4, '#8f8898');
  solid(FIRE.x + 0.5, (FIRE.y - 0.06) / 2, FIRE.z, 0.16, FIRE.y - 0.06, 0.4, '#8f8898');
  solid(1.35, 0.43, -2.4, 0.4, 0.07, 1.4, '#8b6248');
  solid(1.35, 0.2, -2.95, 0.3, 0.4, 0.14, '#8f8898');
  solid(1.35, 0.2, -1.85, 0.3, 0.4, 0.14, '#8f8898');
  window.__hearth.solidBoxes = solidBoxes;

  /* ---------- the fireplace model ---------- */
  const holder = new THREE.Group(); window.__hearth.holder = holder;
  holder.position.set(FIRE.x, FIRE.y, FIRE.z);
  holder.rotation.y = ARCH_YAW;
  scene.add(holder);
  try {
    const m = await loadGLB('models/baby-bonfire.glb'); holder.add(m); state.model = 'main';
  } catch (e) {
    try { const m = await loadGLB('models/baby-bonfire-simple.glb'); holder.add(m); state.model = 'simple'; }
    catch (e2) { state.model = 'none'; }
  }

  /* ---------- fake glow: a soft additive sprite on the wall + an emissive disc ---------- */
  const gc = document.createElement('canvas'); gc.width = gc.height = 128;
  const gg = gc.getContext('2d'); const grad = gg.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,190,110,1)'); grad.addColorStop(.35, 'rgba(255,140,60,.45)'); grad.addColorStop(1, 'rgba(255,100,30,0)');
  gg.fillStyle = grad; gg.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(gc);
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .55 });
  const poolMat = glowMat.clone();
  window.__hearth.mats = { glowMat, poolMat };
  const wallGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat);
  wallGlow.scale.set(2.4, 1.8, 1); wallGlow.position.set(0, 1.2, -1.6 - R + 0.25); scene.add(wallGlow);
  const tableGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), poolMat);   // light pool on the slab
  tableGlow.rotation.x = -Math.PI / 2; tableGlow.scale.set(.7, .5, 1); tableGlow.position.set(FIRE.x, FIRE.y + .002, FIRE.z); scene.add(tableGlow);
  const coreMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffb060, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .85 });
  const core = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), coreMat);
  core.position.set(0, FLAME.y + 0.014, FLAME.z + 0.004); holder.add(core);

  /* ---------- flame: three additive billboard quads with a small shader ---------- */
  const flameMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
    vertexShader: [
      'attribute float aSeed; attribute vec3 aBase; attribute vec2 aSize; varying vec2 vUv; varying float vSeed; uniform float uPower;',
      'void main(){ vUv=uv; vSeed=aSeed; float g=1.0+0.3*uPower;',
      '  vec3 pos = aBase + vec3(position.x*aSize.x*g, position.y*aSize.y*g, 0.0);',
      '  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0); }'
    ].join('\n'),
    fragmentShader: [
      'varying vec2 vUv; varying float vSeed; uniform float uTime; uniform float uPower;',
      'void main(){ float uSeed=vSeed;',
      '  vec2 p = vec2(vUv.x-0.5, vUv.y);',
      '  float h = vUv.y;',
      '  float sway = sin(uTime*5.0+uSeed+h*6.0)*0.07*h + sin(uTime*9.0+uSeed*2.0+h*11.0)*0.035*h;',
      '  float w = (0.30*(1.0-h)) * (0.55+0.45*sin(h*3.14159)) * (1.0+0.35*uPower);',
      '  float d = abs(p.x - sway)/max(w,0.001);',
      '  float body = smoothstep(1.0,0.2,d) * smoothstep(1.0,0.55,h) * smoothstep(0.0,0.08,h);',
      '  float flick = 0.8 + 0.2*sin(uTime*13.0+uSeed*3.0);',
      '  vec3 col = mix(vec3(1.0,0.35,0.08), vec3(1.0,0.82,0.45), smoothstep(0.9,0.1,d)*(1.0-h*0.6));',
      '  col = mix(col, vec3(1.0,0.95,0.8), smoothstep(0.35,0.0,d)*(1.0-h)*0.8);',
      '  gl_FragColor = vec4(col*body*flick*(0.9+0.4*uPower), body*flick);',
      '}'
    ].join('\n')
  });
  // Three flame tongues in ONE mesh (one draw call): quads with per-vertex seed, base offset and size.
  const specs = [[0, 0, 1.0, 0.0], [-0.010, 0.003, 0.75, 1.7], [0.012, -0.003, 0.6, 3.1]];
  const fPos = [], fUv = [], fSeed = [], fBase = [], fSize = [], fIdx = [];
  specs.forEach(([x, z, sc, seed], i) => {
    const corners = [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]];
    for (const [cx, cy] of corners) { fPos.push(cx, cy, 0); fUv.push(cx + 0.5, cy); fSeed.push(seed); fBase.push(x, 0, z); fSize.push(FLAME.w * sc, FLAME.h * sc); }
    fIdx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const flameGeo = new THREE.BufferGeometry();
  flameGeo.setAttribute('position', new THREE.Float32BufferAttribute(fPos, 3));
  flameGeo.setAttribute('uv', new THREE.Float32BufferAttribute(fUv, 2));
  flameGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(fSeed, 1));
  flameGeo.setAttribute('aBase', new THREE.Float32BufferAttribute(fBase, 3));
  flameGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(fSize, 2));
  flameGeo.setIndex(fIdx);
  const flameGroup = new THREE.Group();
  flameGroup.position.set(0, FLAME.y, FLAME.z);              // inside the arch opening, in model space
  holder.add(flameGroup);
  const flameMesh = new THREE.Mesh(flameGeo, flameMat); flameMesh.frustumCulled = false; flameMesh.name = 'flame';
  flameGroup.add(flameMesh);
  window.__hearth.flameGroup = flameGroup; window.__hearth.flameMat = flameMat;

  /* ---------- embers: <= 60 points in one reused buffer ---------- */
  const ePos = new Float32Array(MAX_EMBERS * 3), eVel = new Float32Array(MAX_EMBERS * 3), eLife = new Float32Array(MAX_EMBERS);
  const eGeo = new THREE.BufferGeometry();
  const eAttr = new THREE.BufferAttribute(ePos, 3); eAttr.setUsage(THREE.DynamicDrawUsage);
  eGeo.setAttribute('position', eAttr);
  eGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(FIRE.x, FIRE.y + .3, FIRE.z), 1);
  const dc = document.createElement('canvas'); dc.width = dc.height = 32;
  const dg = dc.getContext('2d'); const dgr = dg.createRadialGradient(16, 16, 0, 16, 16, 16);
  dgr.addColorStop(0, 'rgba(255,230,160,1)'); dgr.addColorStop(.5, 'rgba(255,140,50,.8)'); dgr.addColorStop(1, 'rgba(255,100,30,0)');
  dg.fillStyle = dgr; dg.fillRect(0, 0, 32, 32);
  const eMat = new THREE.PointsMaterial({ size: 0.012, sizeAttenuation: true, map: new THREE.CanvasTexture(dc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const embers = new THREE.Points(eGeo, eMat); embers.frustumCulled = false; scene.add(embers); window.__hearth.embers = embers;
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // no Math.random garbage, deterministic
  const respawn = (i) => {
    const o = i * 3;
    ePos[o] = FIRE.x + (rnd() - .5) * .02; ePos[o + 1] = FIRE.y + .125 + rnd() * .02; ePos[o + 2] = FIRE.z + (rnd() - .5) * .02;
    eVel[o] = (rnd() - .5) * .03; eVel[o + 1] = .06 + rnd() * .1; eVel[o + 2] = (rnd() - .5) * .03;
    eLife[i] = .6 + rnd() * 1.6;
  };
  for (let i = 0; i < MAX_EMBERS; i++) { respawn(i); eLife[i] = rnd() * 2; }

  /* ---------- per-frame ---------- */
  const camPos = new THREE.Vector3(), q = new THREE.Quaternion(), fwd = new THREE.Vector3();
  let t = 0, hapticClock = 0, audioClock = 0;
  onFrame((dt, time) => {
    t += dt;
    const target = state.blow ? 1 : 0;
    state.power += (target - state.power) * Math.min(1, dt * (target ? 4 : 1.5));
    const p = state.power;
    camera.getWorldPosition(camPos);
    const isRM = reduced(); const mo = isRM ? 0 : 1;      // reduced motion: still flame, no flicker, no embers, no breathing
    flameMat.uniforms.uTime.value = t * mo; flameMat.uniforms.uPower.value = p;
    flameGroup.getWorldPosition(fwd);                        // billboard around Y toward the viewer
    flameGroup.rotation.y = Math.atan2(camPos.x - fwd.x, camPos.z - fwd.z) - ARCH_YAW;
    const rm = isRM ? 0 : 1;           // glow and pool hold still under reduced motion
    const flick = 0.9 + 0.1 * Math.sin(t * 11) * mo;
    glowMat.opacity = (0.45 + 0.35 * p) * (1 + 0.05 * Math.sin(t * 0.8) * rm);
    poolMat.opacity = (0.55 + 0.3 * p) * (1 + 0.04 * Math.sin(t * 0.8 + 1.3) * rm);
    coreMat.opacity = (0.7 + 0.3 * p) * flick;
    embers.visible = !isRM;
    const active = isRM ? 0 : Math.round(24 + 36 * p);
    eMat.opacity = 1;
    for (let i = 0; i < MAX_EMBERS; i++) {
      const o = i * 3;
      if (i >= active) { ePos[o + 1] = -10; continue; }
      eLife[i] -= dt;
      if (eLife[i] <= 0 || ePos[o + 1] < 0) { respawn(i); continue; }
      ePos[o] += eVel[o] * dt * mo; ePos[o + 1] += eVel[o + 1] * dt * (1 + p) * mo; ePos[o + 2] += eVel[o + 2] * dt * mo;
      eVel[o] += (Math.sin(t * 3 + i) * .02) * dt;
    }
    eAttr.needsUpdate = true;
    // haptic pulse while blowing
    if (state.blow && state.holder) {
      hapticClock -= dt;
      if (hapticClock <= 0) { hapticClock = 0.12; pulse(state.holder, 0.25 + 0.2 * p, 50); }
    }
    // audio listener follow (about 10 Hz)
    audioClock += dt;
    if (audioClock > 0.1) { audioClock = 0; updateListener(); }
  });

  /* ---------- haptics ---------- */
  function pulse(source, intensity, ms) {
    try {
      const gp = source && source.gamepad;
      if (gp && gp.hapticActuators && gp.hapticActuators.length && typeof gp.hapticActuators[0].pulse === 'function') {
        gp.hapticActuators[0].pulse(intensity, ms); state.haptics++;
      }
    } catch (e) { /* never throw */ }
  }

  /* ---------- blow on it: press and hold select on the fire ---------- */
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(FIRE.x, FIRE.y + 0.07, FIRE.z); scene.add(hit);
  // Registered so the kit's select path treats the fire as a target (a release on it must not teleport the viewer).
  try { ctx.addInteractable(hit, { label: 'The fire: press and hold to blow', onSelect: () => {} }); } catch (e) { /* optional */ }
  const ray = new THREE.Raycaster(); const o3 = new THREE.Vector3(), d3 = new THREE.Vector3(), m4 = new THREE.Matrix4();
  function startFromRay(origin, dir, source) {
    ray.set(origin, dir); ray.far = 8;
    hit.updateMatrixWorld();
    if (ray.intersectObject(hit, false).length) { state.blow = true; state.holder = source || null; return true; }
    return false;
  }
  const held = [null, null, null, null];
  for (let i = 0; i < 4; i++) {            // four input slots: two controllers or hands plus extra pointers
    const c = renderer.xr.getController(i); (ctx.rig || scene).add(c);
    c.addEventListener('selectstart', (e) => {
      m4.identity().extractRotation(c.matrixWorld);
      o3.setFromMatrixPosition(c.matrixWorld); d3.set(0, 0, -1).applyMatrix4(m4).normalize();
      if (startFromRay(o3, d3, e.data)) held[i] = true;
    });
    const end = () => { if (held[i]) { held[i] = null; state.blow = false; state.holder = null; } };
    c.addEventListener('selectend', end); c.addEventListener('select', end);
  }
  // Screen and keyboard: press and hold on the flame, or hold the "Blow on it" button, or hold B.
  const canvas = renderer.domElement;
  const nd = new THREE.Vector2();
  canvas.addEventListener('pointerdown', (e) => {
    if (renderer.xr.isPresenting) return;
    const r = canvas.getBoundingClientRect();
    nd.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(nd, camera); hit.updateMatrixWorld();
    if (ray.intersectObject(hit, false).length) { state.blow = true; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
  });
  const stopPtr = () => { if (!held.some(Boolean)) state.blow = false; };
  canvas.addEventListener('pointerup', stopPtr); canvas.addEventListener('pointercancel', stopPtr);
  const blowBtn = document.getElementById('blow');
  if (blowBtn) {
    const on = (e) => { e.preventDefault(); state.blow = true; };
    const off = () => { state.blow = false; };
    blowBtn.addEventListener('pointerdown', on); blowBtn.addEventListener('pointerup', off);
    blowBtn.addEventListener('pointerleave', off); blowBtn.addEventListener('pointercancel', off);
    blowBtn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); state.blow = true; } });
    blowBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') state.blow = false; });
    // Losing focus or the window mid-press must not leave the fire being blown on.
    blowBtn.addEventListener('blur', off); window.addEventListener('blur', () => { if (!held.some(Boolean)) state.blow = false; });
  }

  /* ---------- sound: starts only from a press on the "Sound" control ---------- */
  let ac = null, panner = null, gain = null, src = null, buffer = null, loading = false;
  function updateListener() {
    if (!ac || !ac.listener) return;
    try {
      const L = ac.listener;
      camera.getWorldPosition(camPos); camera.getWorldQuaternion(q);
      fwd.set(0, 0, -1).applyQuaternion(q);
      if (L.positionX) {
        L.positionX.value = camPos.x; L.positionY.value = camPos.y; L.positionZ.value = camPos.z;
        L.forwardX.value = fwd.x; L.forwardY.value = fwd.y; L.forwardZ.value = fwd.z;
        L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
      } else if (L.setPosition) { L.setPosition(camPos.x, camPos.y, camPos.z); L.setOrientation(fwd.x, fwd.y, fwd.z, 0, 1, 0); }
      if (gain) gain.gain.value = 0.7 + 0.3 * state.power;
    } catch (e) { /* never throw */ }
  }
  async function toggleSound() {
    try {
      if (src) { try { src.stop(); } catch (_) {} src.disconnect(); src = null; state.sound = 'off'; return state.sound; }
      if (loading) return state.sound;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { state.sound = 'unsupported'; return state.sound; }
      if (!ac) {
        ac = new AC(); gain = ac.createGain(); gain.gain.value = 0.7;
        if (ac.createPanner) {
          panner = ac.createPanner(); panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse';
          panner.refDistance = 0.8; panner.rolloffFactor = 1.2;
          if (panner.positionX) { panner.positionX.value = FIRE.x; panner.positionY.value = FIRE.y + 0.08; panner.positionZ.value = FIRE.z; }
          else if (panner.setPosition) panner.setPosition(FIRE.x, FIRE.y + 0.08, FIRE.z);
          panner.connect(gain);
        }
        gain.connect(ac.destination);
      }
      if (ac.state === 'suspended') await ac.resume();
      if (!buffer) {
        loading = true;
        const res = await fetch('media/fire.mp3'); const arr = await res.arrayBuffer();
        buffer = await new Promise((ok, no) => { const p = ac.decodeAudioData(arr, ok, no); if (p && p.catch) p.catch(no); });
        loading = false;
      }
      src = ac.createBufferSource(); src.buffer = buffer; src.loop = true;
      src.connect(panner || gain); src.start(0); state.sound = 'on'; updateListener();
    } catch (e) { loading = false; src = null; state.sound = 'blocked'; }
    return state.sound;
  }
  window.__hearth.toggleSound = toggleSound;
  const sbtn = document.getElementById('sound');
  // The page button always shows the real state, whichever control (page or in-headset) changed it.
  function syncSoundBtn(s = state.sound) {
    if (!sbtn) return;
    sbtn.setAttribute('aria-pressed', String(s === 'on'));
    sbtn.textContent = s === 'on' ? 'Sound: on' : (s === 'off' || s === undefined || s === null) ? 'Sound' : 'Sound unavailable';
  }
  if (sbtn) sbtn.addEventListener('click', async () => { syncSoundBtn(await toggleSound()); });
  // Hidden tab: pause the audio; back again: resume only if sound was on.
  let resumeOnShow = false;
  document.addEventListener('visibilitychange', () => {
    try {
      if (!ac) return;
      if (document.hidden) { resumeOnShow = !!src && ac.state === 'running'; if (resumeOnShow) ac.suspend(); }
      else if (resumeOnShow) { resumeOnShow = false; ac.resume(); }
    } catch (e) { /* never throw */ }
  });
  // A "Sound" control inside the scene, shown only while an XR session is running (a press, never automatic).
  let soundLbl = null;
  try {
    soundLbl = ctx.makeLabel('Sound', { size: 0.07, color: '#17152e', bg: '#ffd27a', maxWidth: 0.3 });
    if (soundLbl) {
      soundLbl.position.set(FIRE.x + 0.4, FIRE.y + 0.14, FIRE.z + 0.28); soundLbl.visible = false; scene.add(soundLbl);
      ctx.addInteractable(soundLbl, { label: 'Sound', onSelect: () => { if (renderer.xr.isPresenting) toggleSound().then((st) => syncSoundBtn(st)); } });
    }
  } catch (e) { /* labels are optional */ }
  const syncXR = () => { if (soundLbl) soundLbl.visible = !!renderer.xr.isPresenting; };
  try { renderer.xr.addEventListener('sessionstart', syncXR); renderer.xr.addEventListener('sessionend', syncXR); } catch (e) { /* ignore */ }

  /* ---------- one marked spot on the floor, 0.8 m from the fire, to teleport to ---------- */
  const SPOT = { x: FIRE.x, z: FIRE.z + 0.8 };
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, fog: false, side: THREE.DoubleSide });
  const ringGeo = new THREE.RingGeometry(0.26, 0.34, 32); ringGeo.rotateX(-Math.PI / 2);
  const spotRing = new THREE.Mesh(ringGeo, spotMat); spotRing.position.set(SPOT.x, 0.02, SPOT.z); scene.add(spotRing);
  const spotHit = new THREE.Object3D(); spotHit.position.set(SPOT.x, 0, SPOT.z); scene.add(spotHit);
  ctx.addInteractable(spotHit, { label: 'Stand here: 0.8 m from the fire', box: { center: [0, 0.05, 0], size: [0.8, 0.12, 0.8] },
    onSelect: (how) => { const w = ctx.world || window.__world; if (w) w.moveTo(SPOT.x, SPOT.z, 0, how); } });
}
