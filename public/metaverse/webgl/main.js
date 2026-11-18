import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld } from './world.js';
import { makeWalk, districtWalkRules } from './walk.js';

const viewAngle = { yaw: .64, pitch: .56 };
const eyeHeight = 2.2;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function createBadge(number, active) {
  const badge = document.createElement('canvas');
  badge.width = badge.height = 96;
  const context = badge.getContext('2d');
  context.shadowColor = 'rgba(56,40,25,.25)';
  context.shadowBlur = 7;
  context.shadowOffsetY = 3;
  context.beginPath();
  context.arc(48, 47, active ? 39 : 35, 0, Math.PI * 2);
  context.fillStyle = active ? '#a9291e' : '#faf4e8';
  context.fill();
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.strokeStyle = active ? '#842218' : '#9c8c70';
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = active ? '#fff9ee' : '#41382c';
  context.font = '600 30px ui-monospace, Consolas, monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(number).padStart(2, '0'), 48, 48);
  const texture = new THREE.CanvasTexture(badge);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addLighting(scene, center, radius) {
  scene.add(new THREE.HemisphereLight('#fff5e2', '#aea897', 1.55));
  const sun = new THREE.DirectionalLight('#fff0d9', 1.9);
  sun.position.copy(center).add(new THREE.Vector3(-.58, 1.16, .85).multiplyScalar(radius));
  sun.target.position.copy(center);
  sun.castShadow = true;
  const shadowExtent = radius * 1.2;
  Object.assign(sun.shadow.camera, {
    left: -shadowExtent, right: shadowExtent, top: shadowExtent, bottom: -shadowExtent,
    near: .5, far: radius * 4.1
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = .085;
  sun.shadow.bias = -.00035;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
}

window.LoomWebCity = function LoomWebCity(canvas, onSelect, onModeChange) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eae2d3');
  const district = buildWorld(THREE, scene);
  const { center, radius, markers, targets, bounds } = district;
  scene.fog = new THREE.Fog('#eae2d3', radius * 2.6, radius * 5.8);
  addLighting(scene, center, radius);

  const orbitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, radius * 8);
  const walkCamera = new THREE.PerspectiveCamera(62, 1, .12, radius * 8);
  const controls = new OrbitControls(orbitCamera, canvas);
  controls.enableDamping = !reduceMotion.matches;
  controls.dampingFactor = .12;
  controls.minPolarAngle = .17;
  controls.maxPolarAngle = 1.36;
  controls.minZoom = .7;
  controls.maxZoom = 5;
  controls.zoomSpeed = .86;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', () => { transition = null; });

  const badgeSprites = markers.map((position, index) => {
    const inactive = createBadge(index + 1, false);
    const active = createBadge(index + 1, true);
    const material = new THREE.SpriteMaterial({ map: inactive, transparent: true, depthWrite: false, toneMapped: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 1.25;
    sprite.userData = { plate: index, inactive, active };
    scene.add(sprite);
    return sprite;
  });

  const direction = new THREE.Vector3(
    Math.sin(viewAngle.yaw) * Math.cos(viewAngle.pitch),
    Math.sin(viewAngle.pitch),
    Math.cos(viewAngle.yaw) * Math.cos(viewAngle.pitch)
  );
  const right = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
  const up = direction.clone().cross(right);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const canMove = districtWalkRules(district);
  const walk = makeWalk(THREE, walkCamera, canvas, { onMove: invalidate, canMove });
  let frame = 0;
  let previousTime = 0;
  let width = 0, height = 0;
  let active = true, contextLost = false;
  let selected = -1;
  let mode = 'orbit';
  let transition = null;
  let gesture = null;
  canvas.dataset.mode = mode;
  canvas.style.cursor = 'grab';

  const corners = [];
  if (bounds?.isBox3 && !bounds.isEmpty()) {
    const { min, max } = bounds;
    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) corners.push(new THREE.Vector3(x, y, z).sub(center));
      }
    }
  }

  function invalidate() {
    if (!frame && active && !contextLost && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function draw(time) {
    frame = 0;
    if (!active || contextLost || !width || !height) return;
    const dt = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    if (transition) {
      const t = Math.min(1, (time - transition.start) / 360);
      const eased = 1 - (1 - t) ** 3;
      const { fromTarget, toTarget, offset, fromZoom, toZoom } = transition;
      controls.target.lerpVectors(fromTarget, toTarget, eased);
      orbitCamera.position.copy(controls.target).add(offset);
      orbitCamera.zoom = THREE.MathUtils.lerp(fromZoom, toZoom, eased);
      orbitCamera.updateProjectionMatrix();
      if (t === 1) transition = null;
    }
    const camera = mode === 'walk' ? walkCamera : orbitCamera;
    if (mode === 'walk') walk.update(dt);
    else controls.update();

    const orbitPixels = height * orbitCamera.zoom / (orbitCamera.top - orbitCamera.bottom);
    const perspectiveScale = 2 * Math.tan(THREE.MathUtils.degToRad(walkCamera.fov / 2)) / height;
    for (const badge of badgeSprites) {
      const isSelected = badge.userData.plate === selected;
      const desiredPixels = isSelected ? 34 : 27;
      const distance = badge.position.distanceTo(camera.position);
      const size = mode === 'orbit' ? desiredPixels / orbitPixels : THREE.MathUtils.clamp(perspectiveScale * distance * desiredPixels, .65, 3.8);
      badge.scale.set(size, size, 1);
    }
    renderer.render(scene, camera);
    if ((mode === 'walk' && walk.moving) || transition) invalidate();
    else if (mode === 'walk') previousTime = 0;
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = Math.round(box.width);
    height = Math.round(box.height);
    if (!width || !height) return;
    const aspect = width / height;
    const halfWidth = corners.length ? Math.max(...corners.map(point => Math.abs(point.dot(right)))) : radius;
    const halfHeight = corners.length ? Math.max(...corners.map(point => Math.abs(point.dot(up)))) : radius * .72;
    const vertical = Math.max(halfHeight, halfWidth / aspect) * 1.14;
    orbitCamera.left = -vertical * aspect;
    orbitCamera.right = vertical * aspect;
    orbitCamera.top = vertical;
    orbitCamera.bottom = -vertical;
    orbitCamera.updateProjectionMatrix();
    walkCamera.aspect = aspect;
    walkCamera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  }

  function resetOrbit() {
    transition = null;
    controls.target.copy(center);
    orbitCamera.position.copy(center).addScaledVector(direction, radius * 2.35);
    orbitCamera.zoom = 1;
    orbitCamera.updateProjectionMatrix();
    controls.update();
    invalidate();
  }

  function select(index) {
    if (!Number.isInteger(index) || !markers[index]) return;
    if (badgeSprites[selected]) badgeSprites[selected].material.map = badgeSprites[selected].userData.inactive;
    selected = index;
    badgeSprites[index].material.map = badgeSprites[index].userData.active;
    district.select(index);
    invalidate();
  }

  function siteCenter(index) {
    const { x, z } = district.lots[index];
    return new THREE.Vector3(x, 0, z);
  }

  function moveToSite(index) {
    const site = siteCenter(index);
    const spawn = new THREE.Vector3(site.x + 3.8, eyeHeight, site.z + 15.6);
    const candidates = [
      spawn,
      new THREE.Vector3(site.x, eyeHeight, site.z + 14.5),
      new THREE.Vector3(site.x + 14.5, eyeHeight, site.z),
      new THREE.Vector3(site.x, eyeHeight, site.z - 14.5),
      new THREE.Vector3(site.x - 14.5, eyeHeight, site.z)
    ];
    const position = candidates.find(point => !canMove || canMove(point.x, point.z)) || spawn;
    walk.start(position, new THREE.Vector3(site.x, eyeHeight + .5, site.z));
    if (!active || contextLost) walk.pause();
    invalidate();
  }

  function focus(index = selected) {
    if (!markers[index]) return;
    select(index);
    if (mode === 'walk') {
      moveToSite(index);
      return;
    }
    const toTarget = siteCenter(index);
    toTarget.y = 4.5;
    const offset = orbitCamera.position.clone().sub(controls.target);
    const displaySpan = Math.min(orbitCamera.top - orbitCamera.bottom, orbitCamera.right - orbitCamera.left);
    const toZoom = THREE.MathUtils.clamp(displaySpan / 46, 1.8, controls.maxZoom);
    if (reduceMotion.matches) {
      controls.target.copy(toTarget);
      orbitCamera.position.copy(toTarget).add(offset);
      orbitCamera.zoom = toZoom;
      orbitCamera.updateProjectionMatrix();
      controls.update();
    } else {
      transition = {
        start: performance.now(), fromTarget: controls.target.clone(), toTarget, offset,
        fromZoom: orbitCamera.zoom, toZoom
      };
    }
    invalidate();
  }

  function setMode(next) {
    if ((next !== 'orbit' && next !== 'walk') || next === mode) return mode;
    mode = next;
    transition = null;
    controls.enabled = active && mode === 'orbit';
    canvas.dataset.mode = mode;
    canvas.style.cursor = mode === 'walk' ? 'crosshair' : 'grab';
    if (mode === 'walk') {
      moveToSite(Math.max(0, selected));
      if (active) canvas.focus({ preventScroll: true });
    } else {
      walk.stop();
    }
    onModeChange?.(mode);
    invalidate();
    return mode;
  }

  function zoom(factor) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    transition = null;
    if (mode === 'walk') {
      walkCamera.fov = THREE.MathUtils.clamp(walkCamera.fov / factor, 35, 84);
      walkCamera.updateProjectionMatrix();
    } else {
      orbitCamera.zoom = THREE.MathUtils.clamp(orbitCamera.zoom * factor, controls.minZoom, controls.maxZoom);
      orbitCamera.updateProjectionMatrix();
    }
    invalidate();
  }

  function rotate(angle) {
    if (mode !== 'orbit' || !Number.isFinite(angle)) return;
    transition = null;
    const offset = orbitCamera.position.clone().sub(controls.target);
    offset.applyAxisAngle(orbitCamera.up, angle);
    orbitCamera.position.copy(controls.target).add(offset);
    controls.update();
    invalidate();
  }

  function reset() {
    if (mode === 'orbit') {
      resetOrbit();
    } else {
      walkCamera.fov = 62;
      walkCamera.updateProjectionMatrix();
      moveToSite(Math.max(0, selected));
    }
  }

  function step(direction) {
    if (active && mode === 'walk') walk.step(direction);
  }

  function setActive(value) {
    if (active === Boolean(value)) return;
    active = Boolean(value);
    previousTime = 0;
    controls.enabled = active && mode === 'orbit';
    if (active) {
      if (mode === 'walk' && !contextLost) walk.resume();
      invalidate();
    } else {
      if (mode === 'walk') walk.pause();
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function pick(event) {
    const box = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      1 - ((event.clientY - box.top) / box.height) * 2
    );
    raycaster.setFromCamera(pointer, mode === 'walk' ? walkCamera : orbitCamera);
    const match = raycaster.intersectObjects(targets.concat(badgeSprites), false)
      .find(result => Number.isInteger(result.object.userData.plate));
    if (!match) return;
    const index = match.object.userData.plate;
    select(index);
    onSelect?.(index);
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary) {
      gesture = null;
      return;
    }
    if (event.button === 0) gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointermove', event => {
    if (gesture?.id === event.pointerId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 4) gesture = null;
  });
  canvas.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return;
    gesture = null;
    pick(event);
  });
  canvas.addEventListener('pointercancel', () => { gesture = null; });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    if (mode === 'walk') walk.pause();
    cancelAnimationFrame(frame);
    frame = 0;
    canvas.dispatchEvent(new Event('loomwebglcontextlost'));
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    renderer.shadowMap.needsUpdate = true;
    previousTime = 0;
    if (active && mode === 'walk') walk.resume();
    invalidate();
    canvas.dispatchEvent(new Event('loomwebglcontextrestored'));
  });
  document.addEventListener('visibilitychange', () => {
    previousTime = 0;
    if (!document.hidden) invalidate();
  });

  new ResizeObserver(resize).observe(canvas);
  if (markers.length) select(0);
  resetOrbit();
  resize();
  return { select, zoom, reset, rotate, focus, setMode, step, setActive };
};
