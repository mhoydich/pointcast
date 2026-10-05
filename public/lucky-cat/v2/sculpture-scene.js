import * as THREE from '../vendor/three.module.min.js';
import { createCatModel } from '../cat-model.js';

const PALETTES = {
  daylight: { key: '#fff2da', fill: '#cee5e4', rim: '#d8f3ad', sky: '#f3ecd9', ground: '#60746b', exposure: 1.03, environment: 0.72, surface: '#eeebdf' },
  amber: { key: '#ffd39c', fill: '#a7d1c9', rim: '#ffbb82', sky: '#f6dbba', ground: '#646759', exposure: 1.01, environment: 0.62, surface: '#f0e4cd' },
  moon: { key: '#d1e3ff', fill: '#e7d8c2', rim: '#b7e4df', sky: '#d9e3ed', ground: '#596967', exposure: 1.01, environment: 0.64, surface: '#e6e9e5' },
};
const TONES = ['#c9ef89', '#f08468', '#89bdce', '#e9bd62'];
const clamp = THREE.MathUtils.clamp;

/**
 * Shared visual layer for Human Lucky Cat and the Art Studio.
 * App code owns rounds, scores, persistence, and the accessible slot buttons.
 * onOrb receives { ...descriptor, source }, and may return false to reject a catch.
 * onProject receives CSS-pixel coordinates relative to the scene container.
 */
export function createSculptureScene(container, options = {}) {
  if (!container || !container.appendChild) throw new TypeError('A scene container is required.');
  const onPet = typeof options.onPet === 'function' ? options.onPet : () => {};
  const onOrb = typeof options.onOrb === 'function' ? options.onOrb : () => {};
  const onProject = typeof options.onProject === 'function' ? options.onProject : () => {};
  const onError = typeof options.onError === 'function' ? options.onError : () => {};
  const state = {
    disposed: false, available: false, contextLost: false, inView: true,
    reducedMotion: Boolean(options.reducedMotion), design: options.design || { id: 'classic', family: 'classic', color: '#ffe4b0' },
    lighting: 'daylight', focus: 'full', width: 1, height: 1, seconds: 0,
    yaw: -0.14, yawGoal: -0.14, pitch: 0.16, pitchGoal: 0.16, zoom: 1, zoomGoal: 1,
    target: new THREE.Vector3(0, 1.36, 0), targetGoal: new THREE.Vector3(0, 1.36, 0),
    excitedUntil: 0, lastError: null, catches: 0, frames: 0,
  };
  const maxFPS = clamp(Number(options.maxFPS) || 50, 20, 60);
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const orbs = new Map();
  const bursts = [];
  const listeners = [];
  const pointers = new Map();
  let renderer, scene, camera, model, environmentTarget, resizeObserver, intersectionObserver;
  let floorMaterial, plinthMaterial, key, fill, rim, hemisphere, canvas, fallback;
  let raf = 0, lastFrame = 0, lastProjection = -Infinity, pinch = null, suppressTap = false;
  let gesture = null, dirty = true, hoverAt = 0;
  const eye = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const toward = new THREE.Vector3(), projected = new THREE.Vector3(), rayPoint = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const raySphere = new THREE.Sphere();
  let sphereGeometry, ringGeometry, haloGeometry, haloTemplate;
  const numberTextures = new Map();
  const anchors = [[-0.69, 0.10], [0.69, 0.10], [-0.65, -0.27], [0.64, -0.18]];

  function ownGeometry(value) { geometries.add(value); return value; }
  function ownMaterial(value) { materials.add(value); return value; }
  function listen(target, type, handler, settings) {
    target.addEventListener(type, handler, settings);
    listeners.push(() => target.removeEventListener(type, handler, settings));
  }
  function clearGesture() {
    pointers.clear(); gesture = null; pinch = null; suppressTap = false;
    if (canvas) canvas.style.cursor = 'grab';
  }
  function markDirty() { dirty = true; schedule(); }
  function running() { return !state.disposed && state.available && !document.hidden && state.inView && state.width > 1 && state.height > 1; }
  function schedule() { if (!raf && running()) raf = requestAnimationFrame(frame); }

  function showFallback(error) {
    state.available = false;
    const rect = container.getBoundingClientRect();
    state.width = Math.max(1, rect.width); state.height = Math.max(1, rect.height);
    state.lastError = error instanceof Error ? error.message : String(error || '3D preview unavailable');
    cancelAnimationFrame(raf); raf = 0;
    clearGesture();
    if (canvas) canvas.hidden = true;
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.className = 'sculpture-fallback';
      fallback.style.cssText = 'display:grid;place-items:center;width:100%;height:100%;padding:24px;box-sizing:border-box;text-align:center;color:inherit';
      const image = document.createElement('img');
      image.style.cssText = 'display:block;max-width:82%;max-height:75%;object-fit:contain';
      const text = document.createElement('p');
      text.setAttribute('role', 'status');
      text.style.cssText = 'font:inherit;max-width:32ch;margin:8px auto';
      text.textContent = '3D preview is unavailable. Collection controls and numbered catches still work.';
      fallback.append(image, text);
      container.appendChild(fallback);
    }
    fallback.firstElementChild.src = new URL('../cats/' + encodeURIComponent(state.design.id || 'classic') + '.png', import.meta.url).href;
    fallback.firstElementChild.alt = state.design.name || 'Lucky cat sculpture';
    onError({ message: state.lastError, recoverable: state.contextLost });
    publishPositions(true);
  }

  function makeEnvironment() {
    if (environmentTarget) environmentTarget.dispose();
    const room = new THREE.Scene();
    room.background = new THREE.Color('#8b9990');
    const panelGeometry = new THREE.PlaneGeometry(1, 1);
    const panelMaterials = [];
    for (const [position, size, color] of [
      [[-4, 2.8, 1], [4, 6], '#fff2dc'],
      [[3, 2.6, -1], [3, 5], '#d8e8e2'],
      [[0, 5, 0], [5, 5], '#f7f4e8'],
      [[0, 1.4, 5], [3, 4], '#e9dcc2'],
    ]) {
      const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      panelMaterials.push(material);
      const panel = new THREE.Mesh(panelGeometry, material);
      panel.position.set(...position);
      panel.scale.set(size[0], size[1], 1);
      panel.lookAt(0, 1, 0);
      room.add(panel);
    }
    const generator = new THREE.PMREMGenerator(renderer);
    try {
      environmentTarget = generator.fromScene(room, 0.075, 0.1, 30);
      scene.environment = environmentTarget.texture;
    } finally {
      generator.dispose(); panelGeometry.dispose(); panelMaterials.forEach(material => material.dispose());
    }
  }

  function makeStage() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.08, 40);
    hemisphere = new THREE.HemisphereLight('#f3ecd9', '#60746b', 1.2);
    key = new THREE.DirectionalLight('#fff2da', 3.25);
    key.position.set(-3.3, 5.7, 4.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -3.7, right: 3.7, top: 5, bottom: -2.1, near: 0.1, far: 18 });
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 3;
    key.target.position.set(0, 1.25, 0);
    fill = new THREE.DirectionalLight('#cee5e4', 1.1);
    fill.position.set(4.2, 2.5, 3.0);
    rim = new THREE.DirectionalLight('#d8f3ad', 1.7);
    rim.position.set(1.3, 4.2, -4.2);
    scene.add(hemisphere, key, key.target, fill, rim);

    const floorGeometry = ownGeometry(new THREE.PlaneGeometry(12, 12));
    floorMaterial = ownMaterial(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color('#eeebdf') } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform vec3 uColor; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} void main(){vec2 p=(vUv-.5)*2.0;float alpha=1.0-smoothstep(.38,.93,length(p));float grain=(hash(floor(vUv*900.0))-.5)*.012;gl_FragColor=vec4(uColor+grain,alpha*.92);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    }));
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.21;
    scene.add(floor);
    const shadow = new THREE.Mesh(floorGeometry, ownMaterial(new THREE.ShadowMaterial({ color: '#223a2e', opacity: 0.19, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.205; shadow.receiveShadow = true;
    scene.add(shadow);
    const profile = [[1.08, -0.2], [1.16, -0.19], [1.21, -0.14], [1.22, -0.085], [1.2, -0.045], [1.15, -0.015], [0, -0.015]].map(p => new THREE.Vector2(...p));
    plinthMaterial = ownMaterial(new THREE.MeshPhysicalMaterial({ color: '#efede1', roughness: 0.76, metalness: 0.01, clearcoat: 0.14 }));
    const plinth = new THREE.Mesh(ownGeometry(new THREE.LatheGeometry(profile, 64)), plinthMaterial);
    plinth.receiveShadow = true; plinth.castShadow = true;
    scene.add(plinth);
    const edge = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(1.185, 0.008, 6, 80)), ownMaterial(new THREE.MeshStandardMaterial({ color: '#bdc6a1', roughness: 0.7 })));
    edge.rotation.x = Math.PI / 2; edge.position.y = -0.125; scene.add(edge);
    makeEnvironment();

    sphereGeometry = ownGeometry(new THREE.SphereGeometry(1, 24, 16));
    ringGeometry = ownGeometry(new THREE.TorusGeometry(0.215, 0.011, 6, 40));
    haloGeometry = ownGeometry(new THREE.PlaneGeometry(0.72, 0.72));
    haloTemplate = ownMaterial(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: true,
      uniforms: { uColor: { value: new THREE.Color(TONES[0]) }, uPulse: { value: 0 }, uOpacity: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec2 vUv;uniform vec3 uColor;uniform float uPulse;uniform float uOpacity;void main(){float d=length(vUv-.5)*2.0;float glow=pow(max(0.0,1.0-d),2.2)*.32;float ring=(1.0-smoothstep(.018,.05,abs(d-(.56+uPulse*.025))))*.20;gl_FragColor=vec4(uColor,(glow+ring)*uOpacity);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    }));
  }

  function numberTexture(slot) {
    if (numberTextures.has(slot)) return numberTextures.get(slot);
    const image = document.createElement('canvas'); image.width = image.height = 96;
    const context = image.getContext('2d');
    if (context) {
      context.fillStyle = '#17382e'; context.font = 'bold 60px system-ui, sans-serif';
      context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(String(slot), 48, 51);
    }
    const texture = new THREE.CanvasTexture(image); texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture); numberTextures.set(slot, texture);
    return texture;
  }
  function orbColor(descriptor) {
    if (descriptor.golden) return '#eac068';
    if (typeof descriptor.tone === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(descriptor.tone)) return descriptor.tone;
    if (typeof descriptor.tone === 'number') return TONES[Math.abs(descriptor.tone) % TONES.length];
    return ({ lime: TONES[0], coral: TONES[1], sky: TONES[2], mint: '#9ad3b3', gold: TONES[3] }[descriptor.tone]) || TONES[(descriptor.slot - 1) % TONES.length];
  }
  function createOrb(descriptor) {
    const orb = { descriptor, phase: descriptor.slot * 1.61, group: null, owned: [], born: state.seconds, position: new THREE.Vector3() };
    if (!state.available) return orb;
    const color = new THREE.Color(orbColor(descriptor));
    orb.group = new THREE.Group(); orb.group.name = 'Luck orb ' + descriptor.id;
    const coreMaterial = new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.12, emissive: color.clone().multiplyScalar(0.08) });
    const core = new THREE.Mesh(sphereGeometry, coreMaterial);
    core.scale.setScalar(descriptor.golden ? 0.152 : 0.137);
    core.userData.orbId = descriptor.id;
    // A world-space sphere gives touch a generous hit radius while still using a ray.
    core.raycast = function castOrb(ray, hits) {
      this.getWorldPosition(raySphere.center);
      const distance = camera.position.distanceTo(raySphere.center);
      const unitsPerPixel = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, state.height);
      raySphere.radius = Math.max(0.235, unitsPerPixel * 25);
      if (!ray.ray.intersectSphere(raySphere, rayPoint)) return;
      const hitDistance = ray.ray.origin.distanceTo(rayPoint);
      if (hitDistance >= ray.near && hitDistance <= ray.far) hits.push({ distance: hitDistance, point: rayPoint.clone(), object: this });
    };
    const ringMaterial = new THREE.MeshBasicMaterial({ color: descriptor.golden ? '#ab7d28' : '#28523e', transparent: true, opacity: 0.82 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    const haloMaterial = haloTemplate.clone(); haloMaterial.uniforms.uColor.value.copy(color);
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    const labelMaterial = new THREE.SpriteMaterial({ map: numberTexture(descriptor.slot), transparent: true, depthWrite: false, toneMapped: false });
    const label = new THREE.Sprite(labelMaterial); label.scale.set(0.21, 0.21, 1);
    orb.group.add(core, ring, halo, label); scene.add(orb.group);
    Object.assign(orb, { core, ring, halo, label, haloMaterial });
    orb.owned.push(coreMaterial, ringMaterial, haloMaterial, labelMaterial);
    return orb;
  }
  function removeOrb(id) {
    const orb = orbs.get(id); if (!orb) return;
    if (orb.group) orb.group.removeFromParent();
    orb.owned.forEach(material => material.dispose());
    orbs.delete(id);
  }
  function setOrbs(descriptors = []) {
    if (state.disposed) return 0;
    const valid = new Map(), slots = new Set();
    for (const raw of Array.isArray(descriptors) ? descriptors : []) {
      if (!raw || !((typeof raw.id === 'string' && raw.id.length) || (typeof raw.id === 'number' && Number.isFinite(raw.id)))) continue;
      const slot = Math.trunc(Number(raw.slot));
      if (!Number.isInteger(slot) || slot < 1 || slot > 4 || valid.has(raw.id) || slots.has(slot)) continue;
      slots.add(slot); valid.set(raw.id, { ...raw, slot, golden: Boolean(raw.golden) });
      if (valid.size === 4) break;
    }
    for (const id of orbs.keys()) if (!valid.has(id)) removeOrb(id);
    for (const [id, descriptor] of valid) {
      const previous = orbs.get(id);
      if (previous && (previous.descriptor.slot !== descriptor.slot || previous.descriptor.tone !== descriptor.tone || previous.descriptor.golden !== descriptor.golden || (state.available && !previous.group))) removeOrb(id);
      if (!orbs.has(id)) orbs.set(id, createOrb(descriptor));
      else orbs.get(id).descriptor = descriptor;
    }
    if (state.available) { cameraFrame(); updateOrbPositions(); }
    markDirty(); publishPositions(true);
    return orbs.size;
  }
  function updateOrbPositions() {
    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    toward.copy(camera.position).sub(state.target).normalize();
    const distance = camera.position.distanceTo(state.target);
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    const halfWidth = halfHeight * camera.aspect;
    for (const orb of orbs.values()) {
      if (!orb.group) continue;
      const [x, y] = anchors[orb.descriptor.slot - 1];
      const phase = state.reducedMotion ? orb.phase : orb.phase + state.seconds * 0.63;
      const drift = state.reducedMotion ? 0 : 1;
      orb.position.copy(state.target)
        .addScaledVector(right, (x + Math.sin(phase) * 0.035 * drift) * halfWidth)
        .addScaledVector(up, (y + Math.cos(phase * 0.81) * 0.026 * drift) * halfHeight)
        .addScaledVector(toward, 0.82 + Math.sin(phase * 0.72) * 0.12 * drift);
      orb.group.position.copy(orb.position);
      orb.ring.quaternion.copy(camera.quaternion);
      if (!state.reducedMotion) orb.ring.rotateY(Math.sin(phase) * 0.21);
      orb.halo.quaternion.copy(camera.quaternion);
      orb.label.position.copy(toward).multiplyScalar(0.15);
      orb.haloMaterial.uniforms.uPulse.value = state.reducedMotion ? 0 : Math.sin(phase * 2);
      orb.core.rotation.y = state.reducedMotion ? 0 : phase * 0.3;
    }
  }
  function positions() {
    const result = [];
    for (const orb of orbs.values()) {
      if (!state.available || !orb.group) {
        const [x, y] = anchors[orb.descriptor.slot - 1];
        result.push({ ...orb.descriptor, x: (x * 0.5 + 0.5) * state.width, y: (-y * 0.5 + 0.5) * state.height, xPercent: x * 50 + 50, yPercent: -y * 50 + 50, visible: true });
      } else {
        projected.copy(orb.group.position).project(camera);
        const xPercent = projected.x * 50 + 50, yPercent = -projected.y * 50 + 50;
        result.push({ ...orb.descriptor, x: xPercent * state.width / 100, y: yPercent * state.height / 100, xPercent, yPercent, visible: projected.z > -1 && projected.z < 1 && xPercent > 2 && xPercent < 98 && yPercent > 2 && yPercent < 98 });
      }
    }
    return result;
  }
  function publishPositions(force = false) {
    if (!force && state.seconds - lastProjection < 1 / 30) return;
    lastProjection = state.seconds;
    onProject(positions());
  }
  function makeBurst(position, color) {
    if (state.reducedMotion || !state.available) return;
    while (bursts.length >= 8) removeBurst(bursts.shift());
    const group = new THREE.Group(); group.position.copy(position); scene.add(group);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false });
    const particles = [];
    for (let n = 0; n < 7; n++) {
      const particle = new THREE.Mesh(sphereGeometry, material); particle.scale.setScalar(0.024 + (n % 2) * 0.01); group.add(particle); particles.push(particle);
    }
    const ring = new THREE.Mesh(ringGeometry, material); ring.quaternion.copy(camera.quaternion); group.add(ring);
    bursts.push({ group, material, particles, ring, born: state.seconds, origin: position.clone() });
  }
  function removeBurst(burst) { if (!burst) return; burst.group.removeFromParent(); burst.material.dispose(); }
  function animateBursts() {
    for (let n = bursts.length - 1; n >= 0; n--) {
      const burst = bursts[n];
      const progress = (state.seconds - burst.born) / 0.6;
      if (progress >= 1 || state.reducedMotion) { removeBurst(burst); bursts.splice(n, 1); continue; }
      const ease = 1 - (1 - progress) ** 3;
      const token = new THREE.Vector3(0, 0.85, 0.55);
      burst.group.position.copy(burst.origin).lerp(token, ease * 0.86);
      burst.material.opacity = (1 - progress) * 0.72;
      burst.ring.scale.setScalar(1 + ease * 1.5);
      burst.particles.forEach((particle, i) => {
        const angle = i * Math.PI * 2 / 7;
        particle.position.set(Math.cos(angle) * ease * 0.24, Math.sin(angle) * ease * 0.24, Math.sin(i * 2.1) * ease * 0.13);
        particle.scale.setScalar((0.024 + i % 2 * 0.01) * (1 - progress * 0.4));
      });
    }
  }
  function catchOrb(orb, source) {
    if (!orb || state.disposed) return false;
    const descriptor = { ...orb.descriptor, source };
    const position = orb.position.clone();
    const color = orbColor(orb.descriptor);
    if (onOrb(descriptor) === false) return false;
    removeOrb(descriptor.id);
    state.catches++; state.excitedUntil = state.seconds + 0.65;
    makeBurst(position, color); markDirty(); publishPositions(true);
    return true;
  }
  function catchSlot(slot) { return catchOrb([...orbs.values()].find(orb => orb.descriptor.slot === Number(slot)), 'keyboard'); }

  function cameraFrame(immediate = false) {
    const blend = immediate || state.reducedMotion ? 1 : 0.14;
    state.yaw += (state.yawGoal - state.yaw) * blend;
    state.pitch += (state.pitchGoal - state.pitch) * blend;
    state.zoom += (state.zoomGoal - state.zoom) * blend;
    state.target.lerp(state.targetGoal, blend);
    const verticalFit = 2.13 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const horizontalFit = 1.75 / Math.max(0.3, camera.aspect) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(verticalFit, horizontalFit) * state.zoom;
    eye.set(Math.sin(state.yaw) * Math.cos(state.pitch), Math.sin(state.pitch), Math.cos(state.yaw) * Math.cos(state.pitch)).multiplyScalar(distance).add(state.target);
    camera.position.copy(eye); camera.lookAt(state.target); camera.updateMatrixWorld();
  }
  function render(immediate = false) {
    if (!state.available || state.disposed) return;
    try {
      cameraFrame(immediate);
      model?.wave(state.seconds, state.seconds < state.excitedUntil, state.reducedMotion);
      updateOrbPositions(); animateBursts();
      renderer.render(scene, camera); state.frames++; dirty = false;
      publishPositions();
    } catch (error) { showFallback(error); }
  }
  function frame(timestamp) {
    raf = 0;
    if (!running()) return;
    if (!lastFrame || timestamp - lastFrame >= 1000 / maxFPS) {
      const elapsed = lastFrame ? Math.min(0.055, (timestamp - lastFrame) / 1000) : 0;
      state.seconds += elapsed; lastFrame = timestamp;
      const movingCamera = Math.abs(state.yawGoal - state.yaw) + Math.abs(state.pitchGoal - state.pitch) + Math.abs(state.zoomGoal - state.zoom) + state.target.distanceTo(state.targetGoal) > 0.0002;
      if (!state.reducedMotion || dirty || movingCamera || bursts.length) render();
    }
    schedule();
  }
  function resize() {
    if (state.disposed) return;
    const rect = container.getBoundingClientRect();
    state.width = Math.max(1, rect.width); state.height = Math.max(1, rect.height);
    if (renderer && state.available) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.width < 600 ? 1.5 : 1.75));
      renderer.setSize(state.width, state.height, false);
      camera.aspect = state.width / state.height; camera.updateProjectionMatrix(); render(true);
    }
    markDirty();
  }
  function pick(event) {
    if (!state.available) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects([...orbs.values()].map(orb => orb.core).filter(Boolean), false)[0];
    return hit ? orbs.get(hit.object.userData.orbId) : null;
  }
  function pet() {
    if (state.disposed) return;
    state.excitedUntil = state.seconds + 1.15; onPet({ design: state.design, source: 'sculpture' }); markDirty();
  }
  function pointerDown(event) {
    if (event.button !== 0 || !state.available) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture?.(event.pointerId);
    if (pointers.size === 1) { gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, dragged: false }; suppressTap = false; }
    if (pointers.size === 2) {
      const points = [...pointers.values()];
      pinch = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), zoom: state.zoomGoal }; suppressTap = true;
    }
    canvas.style.cursor = 'grabbing';
  }
  function pointerMove(event) {
    if (!state.available) return;
    if (!pointers.has(event.pointerId)) {
      if (performance.now() - hoverAt > 60) { hoverAt = performance.now(); canvas.style.cursor = pick(event) ? 'pointer' : 'grab'; }
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && pinch) {
      const points = [...pointers.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (distance > 8) state.zoomGoal = clamp(pinch.zoom * pinch.distance / distance, 0.62, 1.55);
      markDirty(); return;
    }
    if (!gesture || gesture.id !== event.pointerId || suppressTap) return;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5) gesture.dragged = true;
    if (gesture.dragged) {
      state.yawGoal -= (event.clientX - gesture.lastX) * 0.008;
      state.pitchGoal = clamp(state.pitchGoal + (event.clientY - gesture.lastY) * 0.005, -0.18, 0.65);
      markDirty();
    }
    gesture.lastX = event.clientX; gesture.lastY = event.clientY;
  }
  function pointerUp(event) {
    const tap = gesture && gesture.id === event.pointerId && !gesture.dragged && !suppressTap && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 7;
    pointers.delete(event.pointerId);
    if (tap && state.available) {
      const orb = pick(event);
      if (orb) catchOrb(orb, 'pointer');
      else if (model && raycaster.intersectObject(model.group, true).length) pet();
    }
    if (!pointers.size) clearGesture();
  }
  function keyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (event.repeat && /^[1-4]$/.test(event.key)) { event.preventDefault(); event.stopPropagation(); return; }
    let handled = true;
    if (/^[1-4]$/.test(event.key)) handled = catchSlot(Number(event.key));
    else if (event.key === 'ArrowLeft') state.yawGoal -= 0.14;
    else if (event.key === 'ArrowRight') state.yawGoal += 0.14;
    else if (event.key === 'ArrowUp') state.pitchGoal = clamp(state.pitchGoal + 0.08, -0.18, 0.65);
    else if (event.key === 'ArrowDown') state.pitchGoal = clamp(state.pitchGoal - 0.08, -0.18, 0.65);
    else if (event.key === '+' || event.key === '=') state.zoomGoal = clamp(state.zoomGoal * 0.9, 0.62, 1.55);
    else if (event.key === '-' || event.key === '_') state.zoomGoal = clamp(state.zoomGoal / 0.9, 0.62, 1.55);
    else if (event.key === 'Home') setFocus('full');
    else if (event.key === 'Enter' || event.key === ' ') pet();
    else handled = false;
    if (handled) { event.preventDefault(); event.stopPropagation(); markDirty(); }
  }

  function setDesign(design) {
    if (state.disposed || !design) return false;
    state.design = { ...design };
    if (!state.available) {
      if (fallback) { fallback.firstElementChild.src = new URL('../cats/' + encodeURIComponent(design.id || 'classic') + '.png', import.meta.url).href; fallback.firstElementChild.alt = design.name || 'Lucky cat sculpture'; }
      return false;
    }
    const next = createCatModel(state.design);
    model?.dispose(); model = next; scene.add(model.group);
    state.excitedUntil = state.seconds + 0.4;
    markDirty(); render(true); return true;
  }
  function setLighting(name = 'daylight') {
    if (state.disposed || !Object.hasOwn(PALETTES, name)) return false;
    state.lighting = name;
    if (!state.available) return true;
    const palette = PALETTES[name];
    key.color.set(palette.key); fill.color.set(palette.fill); rim.color.set(palette.rim);
    hemisphere.color.set(palette.sky); hemisphere.groundColor.set(palette.ground);
    renderer.toneMappingExposure = palette.exposure; scene.environmentIntensity = palette.environment;
    floorMaterial.uniforms.uColor.value.set(palette.surface);
    plinthMaterial.color.set(palette.surface);
    markDirty(); return true;
  }
  function setFocus(mode = 'full') {
    if (state.disposed) return false;
    if (typeof mode === 'boolean') mode = mode ? 'play' : 'full';
    const presets = {
      full: { target: [0, 1.36, 0], zoom: 1, yaw: -0.14, pitch: 0.16 },
      face: { target: [0, 2.1, 0.18], zoom: 0.67, yaw: -0.12, pitch: 0.035 },
      token: { target: [0, 0.95, 0.22], zoom: 0.70, yaw: -0.18, pitch: 0.09 },
      material: { target: [0, 1.36, 0], zoom: 0.87, yaw: -0.62, pitch: 0.28 },
      play: { target: [0, 1.39, 0], zoom: 1.02, yaw: -0.08, pitch: 0.12 },
    };
    const preset = typeof mode === 'object' && mode ? mode : Object.hasOwn(presets, mode) ? presets[mode] : null;
    if (!preset) return false;
    state.focus = typeof mode === 'string' ? mode : 'custom';
    if (Array.isArray(preset.target) && preset.target.length === 3 && preset.target.every(Number.isFinite)) state.targetGoal.set(...preset.target.map(value => clamp(value, -4, 5)));
    if (Number.isFinite(preset.zoom)) state.zoomGoal = clamp(preset.zoom, 0.62, 1.55);
    if (Number.isFinite(preset.yaw)) state.yawGoal = preset.yaw;
    if (Number.isFinite(preset.pitch)) state.pitchGoal = clamp(preset.pitch, -0.18, 0.65);
    markDirty(); return true;
  }
  function setReducedMotion(value) {
    if (state.disposed) return;
    state.reducedMotion = Boolean(value);
    if (state.reducedMotion) while (bursts.length) removeBurst(bursts.pop());
    markDirty();
  }
  function capture(settings = {}) {
    if (!state.available || state.disposed) return null;
    const width = clamp(Math.round(Number(settings.width) || state.width), 64, 2400);
    const height = clamp(Math.round(Number(settings.height) || state.height), 64, 2400);
    const ratio = renderer.getPixelRatio(), oldAspect = camera.aspect;
    const oldPosition = camera.position.clone(), oldQuaternion = camera.quaternion.clone();
    const oldAlpha = renderer.getClearAlpha(), oldColor = renderer.getClearColor(new THREE.Color());
    const orbVisibility = [...orbs.values()].map(orb => [orb.group, orb.group?.visible]);
    try {
      renderer.setPixelRatio(1); renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      // Maintain the current pose, expanding the framing if a narrower export needs it.
      if (camera.aspect < oldAspect) camera.position.sub(state.target).multiplyScalar(oldAspect / camera.aspect).add(state.target);
      camera.lookAt(state.target);
      if (settings.transparent === false) renderer.setClearColor(settings.background || '#f5f2e7', 1);
      if (settings.orbs !== true) for (const [group] of orbVisibility) if (group) group.visible = false;
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    } finally {
      for (const [group, visible] of orbVisibility) if (group) group.visible = visible;
      renderer.setClearColor(oldColor, oldAlpha); renderer.setPixelRatio(ratio);
      renderer.setSize(state.width, state.height, false);
      camera.aspect = oldAspect; camera.updateProjectionMatrix(); camera.position.copy(oldPosition); camera.quaternion.copy(oldQuaternion); camera.updateMatrixWorld();
      dirty = true; render();
    }
  }
  function getDebugState() {
    return {
      available: state.available, disposed: state.disposed, contextLost: state.contextLost, lastError: state.lastError,
      designId: state.design.id, family: state.design.family, lighting: state.lighting, focus: state.focus,
      reducedMotion: state.reducedMotion, visible: state.inView && !document.hidden,
      viewport: { width: state.width, height: state.height }, camera: { yaw: state.yaw, pitch: state.pitch, zoom: state.zoom, target: state.target.toArray(), position: camera?.position.toArray() || null },
      orbs: positions(), catches: state.catches, renderedFrames: state.frames, pointerCount: pointers.size,
      memory: renderer ? { ...renderer.info.memory, programs: renderer.info.programs?.length || 0, calls: renderer.info.render.calls } : null,
    };
  }
  function dispose() {
    if (state.disposed) return;
    state.disposed = true; cancelAnimationFrame(raf); raf = 0;
    listeners.forEach(remove => remove()); resizeObserver?.disconnect(); intersectionObserver?.disconnect(); clearGesture();
    for (const id of orbs.keys()) removeOrb(id);
    while (bursts.length) removeBurst(bursts.pop());
    model?.dispose(); environmentTarget?.dispose();
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose());
    key?.shadow.map?.dispose(); renderer?.renderLists.dispose(); renderer?.dispose(); renderer?.forceContextLoss();
    canvas?.remove(); fallback?.remove(); scene?.clear();
    geometries.clear(); materials.clear(); textures.clear(); numberTextures.clear(); listeners.length = 0;
    state.available = false;
  }

  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor('#f5f2e7', 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas = renderer.domElement; canvas.className = 'sculpture-canvas';
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
    canvas.tabIndex = 0; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-roledescription', 'interactive sculpture');
    canvas.setAttribute('aria-label', 'Lucky cat sculpture. Drag to rotate, pinch or scroll to zoom. Arrow keys rotate, plus and minus zoom, Enter beckons, and keys 1 to 4 catch visible luck.');
    container.appendChild(canvas); state.available = true;
    makeStage(); setLighting(options.lighting || 'daylight'); setDesign(state.design);
    listen(canvas, 'pointerdown', pointerDown); listen(canvas, 'pointermove', pointerMove); listen(canvas, 'pointerup', pointerUp);
    listen(canvas, 'pointercancel', clearGesture); listen(canvas, 'lostpointercapture', () => { if (pointers.size && !canvas.hasPointerCapture?.(gesture?.id)) clearGesture(); });
    listen(canvas, 'wheel', event => { if (!state.available) return; event.preventDefault(); state.zoomGoal = clamp(state.zoomGoal * Math.exp(clamp(event.deltaY, -180, 180) * 0.0015), 0.62, 1.55); markDirty(); }, { passive: false });
    listen(canvas, 'keydown', keyDown);
    listen(canvas, 'webglcontextlost', event => { event.preventDefault(); state.contextLost = true; showFallback(new Error('3D context paused')); });
    listen(canvas, 'webglcontextrestored', () => {
      if (state.disposed) return;
      try { state.contextLost = false; state.available = true; state.lastError = null; canvas.hidden = false; fallback?.remove(); fallback = null; makeEnvironment(); setLighting(state.lighting); setOrbs([...orbs.values()].map(orb => orb.descriptor)); lastFrame = 0; resize(); }
      catch (error) { showFallback(error); }
    });
    listen(document, 'visibilitychange', () => { lastFrame = 0; if (document.hidden) { cancelAnimationFrame(raf); raf = 0; clearGesture(); } else markDirty(); });
    listen(window, 'blur', clearGesture);
    if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container); }
    else listen(window, 'resize', resize);
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(entries => { state.inView = entries[0]?.isIntersecting ?? true; lastFrame = 0; if (!state.inView) { cancelAnimationFrame(raf); raf = 0; clearGesture(); } else markDirty(); }, { threshold: 0.01 });
      intersectionObserver.observe(container);
    }
    resize(); schedule();
  } catch (error) { showFallback(error); }

  return { setDesign, setLighting, setFocus, setReducedMotion, setOrbs, catchSlot, pet, resize, capture, getDebugState, dispose };
}
