import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TAU = Math.PI * 2;
const HEIGHT = 7.9;
const BASE = 0.53;
const FLANGE = 2.28;
const INK = '#56473b';

function threadPoint(lane, count, t) {
  const twist = lane * TAU / count + t * TAU * 0.92;
  const radius = 1.7 + 0.43 * Math.sin(Math.PI * t);
  return new THREE.Vector3(Math.cos(twist) * radius, BASE + t * HEIGHT, Math.sin(twist) * radius);
}

function makeShadow() {
  const paper = document.createElement('canvas');
  paper.width = paper.height = 128;
  const ctx = paper.getContext('2d');
  const falloff = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  falloff.addColorStop(0, 'rgba(72,53,33,.24)');
  falloff.addColorStop(0.42, 'rgba(72,53,33,.13)');
  falloff.addColorStop(1, 'rgba(72,53,33,0)');
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(paper);
}

// Each continuous strand is an author lane. Only the dashed interior ties encode reply edges.
export function drawSpindle(canvas, model, selected, onPick) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f4efe4');
  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 120);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minZoom = 0.65;
  controls.maxZoom = 4.5;
  controls.minPolarAngle = 0.16;
  controls.maxPolarAngle = Math.PI * 0.60;
  controls.rotateSpeed = 0.78;
  controls.zoomSpeed = 0.85;

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const keepMaterial = value => { materials.add(value); return value; };
  function mesh(geometry, material, parent = scene) {
    geometries.add(geometry);
    materials.add(material);
    const result = new THREE.Mesh(geometry, material);
    parent.add(result);
    return result;
  }
  function finish(color, roughness = 0.65, metalness = 0) {
    return keepMaterial(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }
  function lathe(profile, material) {
    return mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 80), material);
  }
  function hoop(radius, width, y, material) {
    const ring = mesh(new THREE.TorusGeometry(radius, width, 6, 84), material);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    return ring;
  }
  function stroke(points, material, dashed = false) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometries.add(geometry);
    const segment = new THREE.Line(geometry, material);
    if (dashed) segment.computeLineDistances();
    scene.add(segment);
  }

  scene.add(new THREE.HemisphereLight('#fff8ec', '#b1a18b', 1.95));
  const key = new THREE.DirectionalLight('#fff3df', 2.15);
  key.position.set(3, 14, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#d6e6eb', 1.2);
  rim.position.set(-6, 8, -4);
  scene.add(rim);

  const oak = finish('#ba946d', 0.77);
  const clay = finish('#e2caa5', 0.8);
  const brass = finish('#846344', 0.44, 0.22);
  const centerWood = finish('#d6be99', 0.8);
  const ink = finish(INK, 0.58);
  const height = BASE + HEIGHT;
  const flange = [[0.01,0], [1.78,0], [2.2,.07], [FLANGE,.14], [FLANGE,.23], [2.2,.29], [1.82,.33], [.38,.36], [.01,.36]];

  // Turned wooden flanges support the threads without adding implied message-to-message links.
  lathe(flange, oak).position.y = .03;
  lathe(flange, clay).position.y = height + .08;
  hoop(FLANGE - .015, .03, .205, brass);
  hoop(FLANGE - .015, .03, height + .265, brass);
  lathe([[.01,0],[.40,0],[.33,.22],[.24,1.1],[.24,HEIGHT-.6],[.32,HEIGHT+.1],[.4,HEIGHT+.28],[.01,HEIGHT+.28]], centerWood).position.y = .32;
  for (const y of [.40, height+.45]) {
    mesh(new THREE.CylinderGeometry(.39,.39,.12,32), brass).position.y = y;
    mesh(new THREE.CylinderGeometry(.16,.16,.17,24), ink).position.y = y + .05;
  }
  // A narrow engraved scale on the spindle, count-independent and purely structural.
  for (let i = 1; i < 10; i++) hoop(.249, .012, BASE + HEIGHT * i / 10, brass);

  const shadow = makeShadow();
  textures.add(shadow);
  const shade = mesh(new THREE.PlaneGeometry(9.5, 8), new THREE.MeshBasicMaterial({
    map: shadow, transparent: true, depthWrite: false, toneMapped: false
  }));
  shade.rotation.x = -Math.PI / 2;
  shade.position.set(.32,.005,-.12);

  const messages = model.messages || [];
  const authorList = model.authors || [];
  const authorIndex = new Map(authorList.map((author, i) => [author.key, i]));
  const beads = [];
  const byId = new Map();
  const laneCount = Math.max(authorList.length, 1);
  const beadRadius = Math.max(.105, .19 - messages.length / 1800);
  const beadShape = new THREE.SphereGeometry(beadRadius, 20, 14);
  geometries.add(beadShape);
  const laneMaterials = authorList.map(author => {
    const color = new THREE.Color(author.color);
    const thread = finish(color, .78);
    const glass = keepMaterial(new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: .11, metalness: .13, roughness: .22
    }));
    return { thread, glass };
  });
  for (const [lane, {thread}] of laneMaterials.entries()) {
    const points = Array.from({ length: 49 }, (_, i) => threadPoint(lane, laneCount, i / 48));
    const curve = new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(curve, 108, laneCount > 12 ? .023 : .038, 6, false), thread);
    // Show each strand pinned to its seat at both ends.
    for (const t of [0, 1]) {
      const end = threadPoint(lane, laneCount, t);
      const ferrule = mesh(new THREE.CylinderGeometry(.068,.068,.14,10), brass);
      ferrule.position.copy(end);
      ferrule.position.y += t ? .045 : -.045;
    }
  }
  for (const [order, message] of messages.entries()) {
    const lane = authorIndex.get(message.authorKey);
    if (lane === undefined) continue;
    const t = (order + .5) / messages.length;
    const bead = mesh(beadShape, laneMaterials[lane].glass);
    bead.position.copy(threadPoint(lane, laneCount, t));
    bead.userData.messageId = message.id;
    beads.push(bead);
    byId.set(message.id, bead);
  }
  const tie = keepMaterial(new THREE.LineDashedMaterial({
    color: '#5b4b3c', dashSize: .10, gapSize: .065, transparent: true, opacity: .76
  }));
  for (const message of messages) {
    const from = byId.get(message.parent);
    const to = byId.get(message.id);
    if (!from || !to || from === to) continue;
    const midpoint = from.position.clone().lerp(to.position, .5);
    midpoint.x *= .56;
    midpoint.z *= .56;
    const arc = new THREE.QuadraticBezierCurve3(from.position, midpoint, to.position);
    stroke(arc.getPoints(32), tie, true);
  }
  const highlight = mesh(new THREE.RingGeometry(beadRadius * 1.5, beadRadius * 1.9, 40),
    new THREE.MeshBasicMaterial({ color: '#463829', depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
  highlight.renderOrder = 3;
  let activeBead, frame = 0, disposed = false, contextLost = false;
  function requestDraw() {
    if (disposed || frame || contextLost) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (activeBead) highlight.quaternion.copy(camera.quaternion);
      renderer.render(scene, camera);
    });
  }
  function setSelected(id) {
    activeBead = byId.get(id);
    highlight.visible = !!activeBead;
    if (activeBead) highlight.position.copy(activeBead.position);
    requestDraw();
  }
  function reset() {
    controls.target.set(0, height * .49, 0);
    camera.position.copy(controls.target).add(new THREE.Vector3(10, 4.4, 15));
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.update();
    requestDraw();
  }
  function zoom(factor) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom);
    camera.updateProjectionMatrix();
    requestDraw();
  }
  function rotate(angle) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), angle);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    requestDraw();
  }
  let width = 0, heightPx = 0;
  function resize() {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    width = Math.round(box.width);
    heightPx = Math.round(box.height);
    const ratio = width / heightPx;
    const half = Math.max(5.25, 3.15 / ratio);
    camera.left = -half * ratio;
    camera.right = half * ratio;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    renderer.setSize(width, heightPx, false);
    requestDraw();
  }
  const pickRay = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let press = null;
  function down(event) {
    if (!event.isPrimary || event.button !== 0) { press = null; return; }
    press = {id: event.pointerId, x: event.clientX, y: event.clientY};
  }
  function move(event) {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5) press = null;
  }
  function up(event) {
    if (!press || press.id !== event.pointerId) return;
    press = null;
    const box = canvas.getBoundingClientRect();
    mouse.set((event.clientX-box.left) / box.width * 2 - 1, 1 - (event.clientY-box.top) / box.height * 2);
    pickRay.setFromCamera(mouse, camera);
    const hit = pickRay.intersectObjects(beads, false)[0];
    if (hit) onPick?.(hit.object.userData.messageId);
  }
  const cancel = () => { press = null; };
  const lost = event => { event.preventDefault(); contextLost = true; };
  const restored = () => { contextLost = false; requestDraw(); };
  controls.addEventListener('change', requestDraw);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  reset();
  resize();
  setSelected(selected);
  return {
    setSelected, reset, rotate, zoom, resize,
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener('change', requestDraw);
      controls.dispose();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      for (const resource of geometries) resource.dispose();
      for (const resource of materials) resource.dispose();
      for (const resource of textures) resource.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
