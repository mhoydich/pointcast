// spatial.mjs: a small WebXR hub kit, spec spatial.places/v1.
// One manifest -> a DOM list of links + a walkable three.js scene + WebXR entry.
// Static files only. No requests to other hosts. See README.md and API.md.

import * as THREE from 'three';
import { bearingDistance, geoToLocal, makeGeoScale } from './geo.mjs';
import { safeUrl, validateManifest, layoutPlaces } from './safe.mjs';

export { bearingDistance, geoToLocal, makeGeoScale, safeUrl, validateManifest, layoutPlaces };
export const VERSION = '1.1.0';

// sessiongranted can fire early in a page load (session carry-over between spatial pages). Listen at
// module evaluation and hold the grant until a world that allows VR asks for it.
let xrGranted = false;
const grantWaiters = new Set();
if (typeof navigator !== 'undefined' && navigator.xr && navigator.xr.addEventListener) {
  navigator.xr.addEventListener('sessiongranted', () => { xrGranted = true; for (const fn of grantWaiters) fn(); });
}
/** True when the browser granted a session that no world has taken yet. */
export function sessionGranted() { return xrGranted; }

const RAD = Math.PI / 180;
const EYE = 1.6;              // metres, eye height outside XR and for the 'local' fallback
const DWELL_MS = 1200;        // gaze dwell
const FADE_MS = 60;           // each half of the 120 ms teleport fade
const GLIDE_MAX_MS = 400;
const SNAP = 30 * RAD;
const DEADZONE = 0.6, REARM = 0.3;
const FONT_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace';
const FONT_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "DejaVu Sans", sans-serif';
const FONT_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol"';

const DEFAULT_THEME = {
  skyTop: '#1a1733', skyHorizon: '#c9825a', ground: '#3a2e26', fog: '#5a4048',
  accent: '#ff9a4a', text: '#f3e9d8', plinth: '#8a5a3c', panel: '#17152e',
  sun: '#ffc08a', hemiSky: '#9a8cc0', hemiGround: '#3a2a22', kinds: {},
};

function isObj(v) { return v && typeof v === 'object'; }
function el(tag, attrs, text) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  }
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Resolve a URL and refuse anything on another host. */
function sameOrigin(url, base) {
  const u = new URL(url, base || location.href);
  if (u.origin !== location.origin) throw new Error(`spatial: refusing cross-origin request ${u.href}`);
  return u.href;
}

function listItem(p, attrs, withKind) {
  const li = el('li', attrs);
  const href = safeUrl(p.url);
  const a = href ? el('a', { href }) : el('span', { class: 'spatial-nolink' });
  if (href && typeof location !== 'undefined' && new URL(href).origin !== location.origin) a.setAttribute('rel', 'noopener');
  if (p.glyph) a.appendChild(el('span', { class: 'spatial-glyph', 'aria-hidden': 'true' }, p.glyph));
  a.appendChild(el('span', { class: 'spatial-name' }, p.title));
  li.appendChild(a);
  if (withKind && p.kind) li.appendChild(el('span', { class: 'spatial-kind' }, p.kind));
  if (p.blurb) li.appendChild(el('span', { class: 'spatial-blurb' }, p.blurb));
  return li;
}

/** Build the DOM list (semantic nav of real links) from a manifest. Exported for hubs and tests.
 *  A place whose url fails safeUrl() is shown as plain text, with no link. */
export function buildList(manifest, opts = {}) {
  const nav = el('nav', { class: 'spatial-list', 'aria-label': opts.label || `${manifest.title || 'Places'}: list` });
  const h = el('h2', { class: 'spatial-list-title' }, opts.heading || 'Every place, as a link');
  nav.appendChild(h);
  const ul = el('ul');
  for (const p of manifest.places || []) ul.appendChild(listItem(p, { 'data-place': p.id }, true));
  nav.appendChild(ul);
  if ((manifest.portals || []).length) {
    nav.appendChild(el('h2', { class: 'spatial-list-title' }, opts.portalHeading || 'Other 3D rooms'));
    const ul2 = el('ul', { class: 'spatial-portals' });
    for (const p of manifest.portals) ul2.appendChild(listItem(p, { 'data-portal': p.id || p.url }, false));
    nav.appendChild(ul2);
  }
  if (manifest.credits) nav.appendChild(el('p', { class: 'spatial-credits' }, manifest.credits));
  return nav;
}


// ------------------------------------------------------------------------------------

export async function createWorld(opts = {}) {
  const mount = opts.mount;
  if (!(mount instanceof HTMLElement)) throw new Error('spatial: opts.mount must be an HTMLElement');
  let manifest = opts.manifest;
  if (typeof manifest === 'string') {
    const res = await fetch(sameOrigin(manifest));
    if (!res.ok) throw new Error(`spatial: manifest ${res.status}`);
    manifest = await res.json();
  }
  if (!isObj(manifest) || !Array.isArray(manifest.places)) throw new Error('spatial: manifest needs a places array');
  { const v = validateManifest(manifest); for (const w of v.warnings.concat(v.errors)) console.warn(`spatial: ${w}`); }
  const basePath = opts.basePath || './';
  const theme = Object.assign({}, DEFAULT_THEME, opts.theme || {});
  const xrOpts = Object.assign({ vr: true, ar: false, handTracking: true }, opts.xr || {});
  const labelMax = (opts.labels && opts.labels.max) || 40;
  const teleportRadius = opts.teleportRadius || 40;
  // camera: fov/minHFov/maxVFov (degrees) for page view; pageEye (m) eye height on the page only
  // (XR always uses the real head pose); pitch (degrees, negative looks down) for the page start.
  const camOpts = Object.assign({ fov: 60, minHFov: 60, maxVFov: 80, pageEye: EYE, pitch: -5.7 }, opts.camera || {});

  // ---------- DOM first: the list is the page if WebGL fails ----------
  const root = el('div', { class: 'spatial' });
  const stage = el('div', { class: 'spatial-stage' });
  const bar = el('div', { class: 'spatial-enter', role: 'group', 'aria-label': 'Headset' });
  const status = el('p', { class: 'spatial-status', 'aria-live': 'polite' });
  stage.appendChild(bar);
  root.appendChild(stage);
  root.appendChild(status);
  const list = buildList(manifest, opts.list || {});
  (opts.listMount || root).appendChild(list);
  mount.appendChild(root);

  let disposed = false;
  const listeners = {};
  const emit = (ev, ...a) => { for (const fn of listeners[ev] || []) { try { fn(...a); } catch (e) { console.error(e); } } };
  const on = (ev, fn) => { (listeners[ev] ||= []).push(fn); return () => { listeners[ev] = listeners[ev].filter((f) => f !== fn); }; };

  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reducedMotion = !!(mq && mq.matches);

  // ---------- WebGL ----------
  const canvas = el('canvas', {
    class: 'spatial-canvas', role: 'img',
    'aria-label': `${manifest.title || 'Places'}: a 3D view of ${manifest.places.length} places. Every place is also a link in the list on this page.`,
  });
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!xrOpts.ar, powerPreference: 'high-performance' });
  } catch (err) {
    stage.classList.add('spatial-nogl');
    stage.appendChild(el('p', { class: 'spatial-notice' }, '3D view is not available on this device. Every place is in the list below.'));
    const noop = () => {};
    return {
      webgl: false, manifest, places: [], start: noop, dispose: () => root.remove(), goTo: noop,
      enterVR: () => Promise.reject(new Error('no WebGL')), enterAR: () => Promise.reject(new Error('no WebGL')),
      info: () => ({ calls: 0, triangles: 0, textures: 0, geometries: 0, fps: 0 }), on, flushInstances: noop,
    };
  }
  stage.insertBefore(canvas, bar);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 1);
  renderer.xr.enabled = true;
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 600);
  camera.position.set(0, EYE, 0);
  const rig = new THREE.Group();
  rig.name = 'rig';
  rig.add(camera);
  scene.add(rig);
  scene.fog = new THREE.Fog(theme.fog, 22, 95);

  // shared resources (disposed once)
  const shared = {
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    disc: new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
    ring: new THREE.RingGeometry(0.42, 0.5, 48),
    lambert: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  };
  const ownedTextures = new Set();

  // lights: one hemisphere + one directional
  const hemi = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, 1.7);
  const sun = new THREE.DirectionalLight(theme.sun, 1.6);
  sun.position.set(-8, 6, 10);
  scene.add(hemi, sun);

  // sky dome (cheap gradient)
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(theme.skyTop) }, horizon: { value: new THREE.Color(theme.skyHorizon) }, bottom: { value: new THREE.Color(theme.fog) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vDir;' +
      'void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.3)) : mix(horizon, bottom, clamp(-h*4.0,0.0,1.0));' +
      'gl_FragColor = vec4(c,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), skyMat);
  sky.name = 'sky'; sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(120, 48), new THREE.MeshLambertMaterial({ color: theme.ground }));
  ground.rotation.x = -Math.PI / 2; ground.name = 'ground';
  scene.add(ground);

  // ---------- instancing ----------
  const batches = new Map(); // key -> { geometry, material, items:[{m,c}], mesh, dirty }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
  function addInstance(key, geometry, material, matrix, color) {
    let b = batches.get(key);
    if (!b) { b = { geometry, material, items: [], mesh: null, dirty: true }; batches.set(key, b); }
    b.items.push({ m: matrix.clone(), c: color != null ? new THREE.Color(color) : null });
    b.dirty = true;
    return b.items.length - 1;
  }
  /** Unit box as an instance. parent: Object3D whose matrixWorld frames the local coords. */
  function addBox(o) {
    const parent = o.parent || null;
    _e.set(o.rotX || 0, o.rotY || 0, o.rotZ || 0);
    _q.setFromEuler(_e);
    _p.set(o.x || 0, o.y || 0, o.z || 0); _s.set(o.sx || 1, o.sy || 1, o.sz || 1);
    _m.compose(_p, _q, _s);
    if (parent) { parent.updateWorldMatrix(true, false); _m.premultiply(parent.matrixWorld); }
    return addInstance(o.key || 'box', o.geometry || shared.box, o.material || shared.lambert, _m, o.color ?? '#ffffff');
  }
  function flushInstances() {
    buildAtlasMeshes();
    for (const [key, b] of batches) {
      if (!b.dirty) continue;
      if (b.mesh) { scene.remove(b.mesh); b.mesh.dispose(); }
      const mesh = new THREE.InstancedMesh(b.geometry, b.material, b.items.length);
      mesh.name = `instances:${key}`;
      b.items.forEach((it, i) => { mesh.setMatrixAt(i, it.m); if (it.c) mesh.setColorAt(i, it.c); });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
      b.mesh = mesh; b.dirty = false;
    }
  }

  // ---------- labels ----------
  let labelsUsed = 0, labelWarned = false;
  const billboards = [];
  function canvasTexture(cv) {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    ownedTextures.add(t);
    return t;
  }
  function labelBudget() {
    if (labelsUsed >= labelMax) {
      if (!labelWarned) { console.warn(`spatial: label cap ${labelMax} reached`); labelWarned = true; }
      return false;
    }
    labelsUsed++;
    return true;
  }
  /** Draw a label into a canvas. Returns { cv, wm, hm } (canvas <= 512 px, size in metres). */
  function drawLabel(text, o = {}) {
    const size = o.size || 0.12, base = 48, pad = 18;
    const caps = o.caps !== false;
    const main = caps ? String(text).toUpperCase() : String(text);
    const mainFont = `700 ${base}px ${o.font === 'sans' ? FONT_SANS : FONT_MONO}`;
    const subFont = `400 30px ${FONT_SANS}`;
    const glyphFont = `${base * 1.5}px ${FONT_EMOJI}, ${FONT_SANS}`;
    const cv = document.createElement('canvas');
    const g = cv.getContext('2d');
    g.font = mainFont; const mw = g.measureText(main).width;
    let sw = 0; if (o.sub) { g.font = subFont; sw = g.measureText(o.sub).width; }
    let gw = 0; if (o.glyph) { g.font = glyphFont; gw = Math.max(base * 1.5, g.measureText(o.glyph).width) + pad; }
    const lineH = base * 1.2, subH = o.sub ? 30 * 1.35 : 0;
    const contentH = Math.max(lineH + subH, o.glyph ? base * 1.7 : 0);
    const W = pad * 2 + gw + Math.max(mw, sw), H = pad * 2 + contentH;
    const k = Math.min(1, 512 / W, 512 / H);
    cv.width = Math.ceil(W * k); cv.height = Math.ceil(H * k);
    g.scale(k, k);
    if (o.bg !== null) {
      g.fillStyle = o.bg || 'rgba(23,21,46,0.9)';
      g.fillRect(0, 0, W, H);
      g.strokeStyle = o.border || theme.accent; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
    }
    g.textBaseline = 'middle';
    if (o.glyph) { g.font = glyphFont; g.fillStyle = o.glyphColor || theme.accent; g.textAlign = 'center'; g.fillText(o.glyph, pad + gw / 2 - pad / 2, H / 2); }
    g.textAlign = 'left';
    const tx = pad + gw, top = (H - (lineH + subH)) / 2;
    g.font = mainFont; g.fillStyle = o.color || theme.text; g.fillText(main, tx, top + lineH / 2);
    if (o.sub) { g.font = subFont; g.fillStyle = o.subColor || '#b9aec4'; g.fillText(o.sub, tx, top + lineH + subH / 2); }
    let wm = (W / base) * size, hm = (H / base) * size;
    const maxW = o.maxWidth || 2.4;
    if (wm > maxW) { hm *= maxW / wm; wm = maxW; }
    return { cv, wm, hm, main };
  }
  /** A standalone label mesh with its own texture (one draw call). */
  function makeLabel(text, o = {}) {
    if (!labelBudget()) return null;
    const { cv, wm, hm, main } = drawLabel(text, o);
    const tex = canvasTexture(cv);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, fog: false, toneMapped: false });
    const mesh = new THREE.Mesh(shared.plane, mat);
    mesh.scale.set(wm, hm, 1);
    mesh.name = `label:${main}`;
    if (o.billboard) { mesh.userData.billboard = true; billboards.push(mesh); }
    return mesh;
  }

  // Label atlas: many labels in 1024 px pages, one instanced draw call per page. A page holds up to
  // LCAP labels; labels can be added after the page is built and removed (their cell is reused).
  const ATLAS = 1024, AP = 4, LCAP = 96;
  const atlasPages = []; // { cv, g, x, y, shelf, items:[], tex, mesh, uvr }
  const atlasLabels = []; // { page, index, cell, world, wm, hm, billboard, boost, yaw, color, visible, removed }
  const boostRef = (opts.labels && opts.labels.boostRef) || 8, boostMax = (opts.labels && opts.labels.boostMax) || 2;
  function atlasPage() {
    const cv = document.createElement('canvas'); cv.width = cv.height = ATLAS;
    const pg = { cv, g: cv.getContext('2d'), x: AP, y: AP, shelf: 0, items: [], tex: null, mesh: null, uvr: new Float32Array(LCAP * 4) };
    atlasPages.push(pg); return pg;
  }
  function allocCell(w, h) {
    // 1) reuse the smallest removed cell that fits
    let best = null;
    for (const r of atlasLabels) if (r.removed && r.cell.w >= w && r.cell.h >= h && (!best || r.cell.w * r.cell.h < best.cell.w * best.cell.h)) best = r;
    if (best) { best.removed = false; return { page: best.page, cell: best.cell, rec: best }; }
    // 2) shelf-pack into the last page, else a new page
    let pg = atlasPages[atlasPages.length - 1] || atlasPage();
    for (let tries = 0; tries < 2; tries++) {
      if (pg.x + w + AP > ATLAS) { pg.x = AP; pg.y += pg.shelf + AP; pg.shelf = 0; }
      if (pg.y + h + AP <= ATLAS && pg.items.length < LCAP) {
        const cell = { x: pg.x, y: pg.y, w, h };
        pg.x += w + AP; pg.shelf = Math.max(pg.shelf, h);
        return { page: pg, cell, rec: null };
      }
      pg = atlasPage();
    }
    return null;
  }
  /**
   * Add a label to the shared atlas. parent: Object3D framing local (x, y, z).
   * opts as makeLabel, plus bottom (y of the lower edge), yaw (radians, added to the parent's),
   * boost (page view only: grow with distance up to labels.boostMax so far labels stay readable).
   * Returns a handle { setColor(css), setVisible(bool), remove(), wm, hm, world } or null at the cap.
   */
  function addLabel(text, o = {}, parent = null, x = 0, y = 0, z = 0) {
    if (!labelBudget()) return null;
    const d = drawLabel(text, o);
    const w = d.cv.width, h = d.cv.height;
    const slot = allocCell(w, h);
    if (!slot) { labelsUsed--; return null; }
    const pg = slot.page, cell = slot.cell;
    pg.g.clearRect(cell.x, cell.y, cell.w, cell.h);
    pg.g.drawImage(d.cv, cell.x, cell.y);
    if (pg.tex) pg.tex.needsUpdate = true;
    if (o.bottom != null) y = o.bottom + d.hm / 2;
    const world = new THREE.Vector3(x, y, z);
    let baseYaw = 0;
    if (parent) { parent.updateWorldMatrix(true, false); world.applyMatrix4(parent.matrixWorld); baseYaw = parent.rotation.y; }
    let rec = slot.rec;
    if (!rec) { rec = { page: pg, index: pg.items.length, cell, color: new THREE.Color(0xffffff) }; pg.items.push(rec); atlasLabels.push(rec); }
    Object.assign(rec, { world, wm: d.wm, hm: d.hm, billboard: !!o.billboard, boost: !!o.boost, yaw: baseYaw + (o.yaw || 0), visible: true, removed: false });
    rec.color.set(0xffffff);
    pg.uvr.set([cell.x / ATLAS, 1 - (cell.y + h) / ATLAS, w / ATLAS, h / ATLAS], rec.index * 4);
    if (pg.mesh) {
      const attr = pg.mesh.geometry.getAttribute('uvRect'); attr.needsUpdate = true;
      pg.mesh.count = pg.items.length;
      pg.mesh.setColorAt(rec.index, rec.color); pg.mesh.instanceColor.needsUpdate = true;
      writeLabelMatrix(rec);
    }
    const handle = {
      wm: d.wm, hm: d.hm, world, _rec: rec,
      setColor(c) { rec.color.set(c); if (rec.page.mesh) { rec.page.mesh.setColorAt(rec.index, rec.color); rec.page.mesh.instanceColor.needsUpdate = true; } },
      setVisible(v) { rec.visible = !!v && !rec.removed; if (rec.page.mesh) writeLabelMatrix(rec); },
      remove() { removeLabel(handle); },
    };
    return handle;
  }
  /** Give a label back: an addLabel handle (its atlas cell is reused) or a makeLabel mesh (disposed). */
  function removeLabel(h) {
    if (!h) return false;
    if (h._rec) {
      const r = h._rec; if (r.removed) return false;
      r.removed = true; r.visible = false; labelsUsed--;
      if (r.page.mesh) writeLabelMatrix(r);
      return true;
    }
    if (h.isMesh) {
      const i = billboards.indexOf(h); if (i >= 0) billboards.splice(i, 1);
      if (h.parent) h.parent.remove(h);
      if (h.material) { if (h.material.map) { h.material.map.dispose(); ownedTextures.delete(h.material.map); } h.material.dispose(); }
      labelsUsed--;
      return true;
    }
    return false;
  }
  function buildAtlasMeshes() {
    for (const pg of atlasPages) {
      if (pg.mesh || !pg.items.length) continue;
      pg.tex = canvasTexture(pg.cv);
      const mat = new THREE.MeshBasicMaterial({ map: pg.tex, transparent: true, alphaTest: 0.02, fog: false, toneMapped: false });
      mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nattribute vec4 uvRect;')
          .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = uv * uvRect.zw + uvRect.xy;\n#endif');
      };
      const geo = shared.plane.clone();
      geo.setAttribute('uvRect', new THREE.InstancedBufferAttribute(pg.uvr, 4));
      const mesh = new THREE.InstancedMesh(geo, mat, LCAP);
      mesh.count = pg.items.length;
      mesh.name = `labels:atlas${atlasPages.indexOf(pg)}`;
      mesh.frustumCulled = false; // instances move every frame (billboards); bounds would go stale
      pg.mesh = mesh;
      for (const r of pg.items) { mesh.setColorAt(r.index, r.color); writeLabelMatrix(r); }
      mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);
    }
  }
  const _lq = new THREE.Quaternion(), _lp = new THREE.Vector3(), _ls = new THREE.Vector3(), _ly = new THREE.Vector3(0, 1, 0), _lm = new THREE.Matrix4();
  function writeLabelMatrix(r, yaw, k = 1) {
    _lq.setFromAxisAngle(_ly, yaw ?? r.yaw);
    const v = r.visible && !r.removed;
    _ls.set(v ? r.wm * k : 0, v ? r.hm * k : 0, 1);
    if (k !== 1) { _lp.copy(r.world); _lp.y += (k - 1) * r.hm / 2; _lm.compose(_lp, _lq, _ls); } // grow upward from the lower edge
    else _lm.compose(r.world, _lq, _ls);
    r.page.mesh.setMatrixAt(r.index, _lm);
    r.page.mesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- interactables: one select path ----------
  const interactables = [];
  function addInteractable(object, o = {}) {
    object.updateWorldMatrix(true, true);
    // dwell: gaze dwell may call onSelect only when dwell === true. onDwell (kit-internal for places)
    // is the gentler action dwell takes instead: it only opens the place's panel.
    const it = { object, label: o.label || object.name || '', onSelect: o.onSelect || null, onHover: o.onHover || null,
      box: new THREE.Box3(), inv: new THREE.Matrix4(), hover: 0, place: o.place || null,
      dwell: o.dwell === true, onDwell: typeof o.onDwell === 'function' ? o.onDwell : null };
    if (o.box) {
      const c = o.box.center || [0, 0, 0], s = o.box.size || [1, 1, 1];
      it.box.min.set(c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2);
      it.box.max.set(c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2);
    } else {
      const inv = new THREE.Matrix4().copy(object.matrixWorld).invert();
      const tb = new THREE.Box3(), tm = new THREE.Matrix4();
      object.traverse((ch) => {
        if (!ch.isMesh || !ch.geometry) return;
        if (!ch.geometry.boundingBox) ch.geometry.computeBoundingBox();
        tb.copy(ch.geometry.boundingBox).applyMatrix4(tm.multiplyMatrices(inv, ch.matrixWorld));
        it.box.union(tb);
      });
    }
    object.userData.spatialInteractive = true;
    interactables.push(it);
    return it;
  }
  function removeInteractable(object) {
    const i = interactables.findIndex((it) => it.object === object);
    if (i >= 0) interactables.splice(i, 1);
  }
  function attached(o) { let x = o; while (x) { if (!x.visible) return false; if (x === scene) return true; x = x.parent; } return false; }

  const _ray = new THREE.Ray(), _lray = new THREE.Ray(), _hp = new THREE.Vector3();
  function makeHit() { return { type: null, it: null, point: new THREE.Vector3(), distance: Infinity }; }
  function pick(ray, out) {
    out.type = null; out.it = null; out.distance = Infinity;
    for (let i = 0; i < interactables.length; i++) {
      const it = interactables[i];
      if (!attached(it.object)) continue;
      _lray.copy(ray).applyMatrix4(it.inv);
      if (_lray.intersectBox(it.box, _hp) === null) continue;
      _hp.applyMatrix4(it.object.matrixWorld);
      const d = _hp.distanceTo(ray.origin);
      if (d < out.distance) { out.distance = d; out.type = 'object'; out.it = it; out.point.copy(_hp); }
    }
    if (mode !== 'ar' && ray.direction.y < -1e-4) {
      const t = -ray.origin.y / ray.direction.y;
      if (t > 0 && t < out.distance) {
        _hp.copy(ray.direction).multiplyScalar(t).add(ray.origin);
        if (_hp.x * _hp.x + _hp.z * _hp.z <= teleportRadius * teleportRadius) {
          out.distance = t; out.type = 'ground'; out.it = null; out.point.copy(_hp);
        }
      }
    }
    return out;
  }
  function setHover(ptr, it) {
    if (ptr.hoverIt === it) return;
    const prev = ptr.hoverIt; ptr.hoverIt = it;
    if (prev && --prev.hover === 0) { if (prev.onHover) prev.onHover(false); emit('hover', prev.label, false, prev); }
    if (it && it.hover++ === 0) { if (it.onHover) it.onHover(true); emit('hover', it.label, true, it); }
  }

  // ---------- markers: teleport ring, hover highlight, fade, reticle ----------
  const accentMat = new THREE.MeshBasicMaterial({ color: theme.accent, side: THREE.DoubleSide, transparent: true, opacity: 0.9, fog: false, depthWrite: false });
  const tpRing = new THREE.Mesh(shared.ring, accentMat);
  tpRing.rotation.x = -Math.PI / 2; tpRing.scale.setScalar(0.9); tpRing.visible = false; tpRing.name = 'teleport-marker';
  scene.add(tpRing);
  const highlight = new THREE.Mesh(shared.ring, accentMat);
  highlight.rotation.x = -Math.PI / 2; highlight.visible = false; highlight.name = 'hover-highlight';
  scene.add(highlight);
  let highlightOwner = null;
  function showHighlight(owner, x, z, r) { highlightOwner = owner; highlight.position.set(x, 0.03, z); highlight.scale.setScalar(r * 2); highlight.visible = true; }
  function hideHighlight(owner) { if (highlightOwner === owner) { highlight.visible = false; highlightOwner = null; } }

  const fadeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false });
  const fade = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), fadeMat);
  fade.renderOrder = 999; fade.visible = false; fade.frustumCulled = false; fade.name = 'fade';
  camera.add(fade);
  const reticleGeo = new THREE.RingGeometry(0.012, 0.02, 32, 1);
  const reticle = new THREE.Mesh(reticleGeo, new THREE.MeshBasicMaterial({ color: theme.text, depthTest: false, fog: false, transparent: true }));
  reticle.position.set(0, 0, -1); reticle.renderOrder = 998; reticle.visible = false; reticle.name = 'gaze-reticle';
  camera.add(reticle);
  const reticleFull = reticleGeo.index.count;

  // ---------- panel ----------
  // 1024 x 576 canvas on a 1.28 x 0.72 m plane (1.25 mm per px). Body text 42 px is about 1.3 degrees
  // of arc at 1.6 m; the smallest line (40 px) is about 1.25 degrees.
  const PW = 1.28, PH = 0.72, PCW = 1024, PCH = 576;
  const panel = new THREE.Group(); panel.name = 'panel'; panel.visible = false;
  const pcv = document.createElement('canvas'); pcv.width = PCW; pcv.height = PCH;
  const ptex = canvasTexture(pcv);
  const panelMesh = new THREE.Mesh(shared.plane, new THREE.MeshBasicMaterial({ map: ptex, fog: false, toneMapped: false }));
  panelMesh.scale.set(PW, PH, 1);
  panel.add(panelMesh);
  function makeButton(text) {
    const cv = document.createElement('canvas'); cv.width = 384; cv.height = 112;
    const g = cv.getContext('2d');
    g.fillStyle = theme.accent; g.fillRect(0, 0, 384, 112);
    g.fillStyle = theme.panel; g.font = `700 52px ${FONT_MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 192, 58);
    const m = new THREE.Mesh(shared.plane, new THREE.MeshBasicMaterial({ map: canvasTexture(cv), fog: false, toneMapped: false }));
    m.scale.set(0.4, 0.117, 1); m.name = `button:${text}`;
    return m;
  }
  const openBtn = makeButton('OPEN'), closeBtn = makeButton('CLOSE');
  openBtn.position.set(-0.25, -0.25, 0.005); closeBtn.position.set(0.25, -0.25, 0.005);
  panel.add(openBtn, closeBtn);
  scene.add(panel);
  let panelItem = null;
  function wrap(g, text, maxW) {
    const words = String(text || '').split(/\s+/); const lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    return lines;
  }
  function fitEnd(g, text, maxW) {
    let t = String(text || ''); if (g.measureText(t).width <= maxW) return t;
    while (t.length > 1 && g.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  }
  function fitMiddle(g, text, maxW) {
    const t = String(text || ''); if (g.measureText(t).width <= maxW) return t;
    let a = Math.ceil(t.length / 2), b = Math.floor(t.length / 2);
    while (a > 1 && g.measureText(t.slice(0, a) + '…' + t.slice(t.length - b)).width > maxW) { if (a >= b) a--; else b--; }
    return t.slice(0, a) + '…' + t.slice(t.length - b);
  }
  /** Lines shown on the panel. Order: place.panel object, then opts.panel(place), then defaults. */
  function panelLines(item) {
    const href = safeUrl(item.url);
    const d = {
      kicker: String(item.kind || (item.spatial ? '3d room' : 'page')),
      title: `${item.glyph ? item.glyph + ' ' : ''}${item.title || ''}`,
      body: item.blurb || '',
      link: '',
    };
    let custom = null;
    if (isObj(item.panel)) custom = item.panel;
    else if (typeof opts.panel === 'function') { try { custom = opts.panel(item); } catch (e) { console.error(e); } }
    // The shown link, the "Open: ..." status and the opened address always agree: a custom panel cannot change them.
    return Object.assign(d, isObj(custom) ? custom : {}, { href, link: href ? String(item.url) : '' });
  }
  function drawPanel(L) {
    const g = pcv.getContext('2d'), M = 48, TW = PCW - 2 * M;
    g.fillStyle = theme.panel; g.fillRect(0, 0, PCW, PCH);
    g.strokeStyle = theme.accent; g.lineWidth = 6; g.strokeRect(3, 3, PCW - 6, PCH - 6);
    g.textBaseline = 'top'; g.textAlign = 'left';
    g.fillStyle = theme.accent; g.font = `600 40px ${FONT_MONO}`;
    g.fillText(fitEnd(g, String(L.kicker || '').toUpperCase(), TW), M, 30);
    g.fillStyle = theme.text; g.font = `700 64px ${FONT_MONO}`;
    g.fillText(fitEnd(g, String(L.title || '').toUpperCase(), TW), M, 84);
    g.font = `400 42px ${FONT_SANS}`; g.fillStyle = theme.text;
    const lines = wrap(g, L.body, TW);
    if (lines.length > 3) { lines.length = 3; lines[2] = fitEnd(g, lines[2] + ' …', TW); }
    lines.forEach((ln, i) => g.fillText(ln, M, 172 + i * 54));
    if (L.link) { g.fillStyle = '#c9bfd6'; g.font = `400 40px ${FONT_MONO}`; g.fillText(fitMiddle(g, L.link, TW), M, 344); }
    ptex.needsUpdate = true;
  }
  const _cw = new THREE.Vector3(), _fw = new THREE.Vector3();
  function showPanel(item) {
    const L = panelLines(item);
    panelItem = item; drawPanel(L);
    openBtn.visible = !!L.href;
    camera.getWorldPosition(_cw); camera.getWorldDirection(_fw);
    _fw.y = 0; if (_fw.lengthSq() < 1e-6) _fw.set(0, 0, -1); _fw.normalize();
    let d = 1.6;
    if (mode === 'page') {
      const hfov = 2 * Math.atan(Math.tan((camera.fov * RAD) / 2) * camera.aspect);
      d = Math.min(2.5, Math.max(1.2, (PW / 2 + 0.06) / Math.tan(hfov / 2)));
    }
    panel.position.set(_cw.x + _fw.x * d, _cw.y - 0.15, _cw.z + _fw.z * d);
    panel.rotation.set(0, Math.atan2(-_fw.x, -_fw.z), 0);
    panel.visible = true;
    panel.updateWorldMatrix(true, true);
    status.textContent = [L.title, L.body, L.href ? `Open: ${L.link}` : ''].filter(Boolean).join(' · ');
  }
  function hidePanel() { panel.visible = false; panelItem = null; }
  addInteractable(panelMesh, { label: 'panel' });
  addInteractable(openBtn, { label: 'open', onSelect: () => panelItem && openItem(panelItem),
    onHover: (h) => openBtn.material.color.set(h ? '#ffffff' : '#e8e0d4') });
  addInteractable(closeBtn, { label: 'close', onSelect: hidePanel,
    onHover: (h) => closeBtn.material.color.set(h ? '#ffffff' : '#e8e0d4') });
  openBtn.material.color.set('#e8e0d4'); closeBtn.material.color.set('#e8e0d4');

  function openItem(item) {
    const href = safeUrl(item && item.url);
    if (!href) return false;
    const session = renderer.xr.getSession();
    if (session && !item.spatial) { session.end().finally(() => { location.href = href; }); return true; }
    location.href = href;
    return true;
  }

  // ---------- movement ----------
  let mode = 'page'; // 'page' | 'vr' | 'ar'
  const glide = { active: false, t0: 0, dur: 0, fx: 0, fz: 0, fyaw: 0, tx: 0, tz: 0, tyaw: 0 };
  const fader = { phase: 0, t0: 0, tx: 0, tz: 0, tyaw: null, queued: false, qx: 0, qz: 0, qyaw: null }; // 0 idle, 1 out, 2 in
  function applyPose(x, z, yaw) {
    if (yaw != null) rig.rotation.y = yaw;
    const cx = mode === 'page' ? 0 : camera.position.x, cz = mode === 'page' ? 0 : camera.position.z;
    const cos = Math.cos(rig.rotation.y), sin = Math.sin(rig.rotation.y);
    rig.position.x = x - (cx * cos + cz * sin);
    rig.position.z = z - (-cx * sin + cz * cos);
    rig.updateMatrixWorld(true);
  }
  function viewerXZ(out) { camera.getWorldPosition(out); return out; }
  function moveTo(x, z, yaw, how) {
    hidePanel();
    if (mode !== 'page') {
      if (fader.phase !== 0) { fader.queued = true; fader.qx = x; fader.qz = z; fader.qyaw = yaw ?? null; } // mid-fade: queue, never drop
      else { fader.phase = 1; fader.t0 = performance.now(); fader.tx = x; fader.tz = z; fader.tyaw = yaw ?? null; fade.visible = true; }
    } else if (reducedMotion) {
      glide.active = false; applyPose(x, z, yaw);
    } else {
      viewerXZ(_cw);
      const dist = Math.hypot(x - _cw.x, z - _cw.z);
      glide.active = true; glide.t0 = performance.now(); glide.dur = Math.min(GLIDE_MAX_MS, 120 + dist * 25);
      glide.fx = _cw.x; glide.fz = _cw.z; glide.fyaw = rig.rotation.y;
      glide.tx = x; glide.tz = z;
      let ty = yaw ?? rig.rotation.y;
      ty = glide.fyaw + Math.atan2(Math.sin(ty - glide.fyaw), Math.cos(ty - glide.fyaw));
      glide.tyaw = ty;
    }
    emit('move', { x, z, yaw: yaw ?? rig.rotation.y, how: how || 'api' });
  }
  function snapTurn(dir) {
    viewerXZ(_cw);
    applyPose(_cw.x, _cw.z, rig.rotation.y - dir * SNAP);
    emit('move', { x: _cw.x, z: _cw.z, yaw: rig.rotation.y, how: 'snap' });
  }

  // ---------- places ----------
  const slots = layoutPlaces(manifest);
  const places = [];
  const byId = new Map();
  function selectPlace(place, how) {
    emit('select', place, how);
    if (opts.onSelect && opts.onSelect(place, how) === false) return;
    showPanel(place);
  }
  function kindColor(kind) { return (theme.kinds && theme.kinds[kind]) || theme.plinth; }

  const ctxBase = {
    THREE, scene, renderer, camera, rig, addInteractable, removeInteractable, makeLabel, addLabel, addInstance, addBox, flushInstances,
    loadGLB, onFrame, selectPlace, showHighlight, hideHighlight, theme, shared, manifest,
    addPlaceHit, addSpot, removeLabel, safeUrl, showPanel, hidePanel,
    get reducedMotion() { return reducedMotion; },
  };

  /** Gaze dwell on a place: open its panel, nothing else (no custom handler, no navigation, no move). */
  function dwellPlace(place) {
    if (opts.gazeDwell === false) return;
    emit('dwell', place);
    showPanel(place);
  }
  /**
   * Make a place selectable: an invisible box hit zone on its anchor. Select opens the panel
   * (via selectPlace); gaze dwell only opens the panel. Returns the interactable.
   */
  function addPlaceHit(place, anchor, o = {}) {
    const hit = new THREE.Object3D(); hit.name = `hit:${place.id}`; anchor.add(hit);
    const size = o.size || [1.9, 1.5, 1.3], center = o.center || [0, size[1] / 2, 0], r = o.highlightRadius || 1.25;
    return addInteractable(hit, { label: place.title, place, box: { center, size },
      onSelect: (how) => selectPlace(place, how),
      onDwell: () => dwellPlace(place),
      onHover: (h) => {
        if (o.onHover) o.onHover(h);
        anchor.getWorldPosition(_hp);
        if (h) showHighlight(anchor, _hp.x, _hp.z, r); else hideHighlight(anchor);
      } });
  }
  /**
   * Standing spot (threshold) in front of a place: selecting it moves the viewer there. Never a
   * dwell target. o.distance (m, default 1.8) is also used by goTo(); o.visual:false skips the disc.
   */
  function addSpot(place, anchor, o = {}) {
    const dist = o.distance ?? 1.8;
    anchor.userData.standDistance = dist;
    anchor.updateWorldMatrix(true, false);
    if (o.visual !== false) addInstance('spot', shared.disc, shared.lambert,
      _m.compose(_p.set(0, 0.07, dist), _q.identity(), _s.set(0.7, 0.02, 0.7)).premultiply(anchor.matrixWorld), theme.spot || theme.accent);
    const spot = new THREE.Object3D(); spot.position.set(0, 0, dist); spot.name = `spot:${place.id}`; anchor.add(spot);
    const size = o.size || [0.9, 0.12, 0.9];
    return addInteractable(spot, { label: `stand at ${place.title}`, place, box: { center: [0, size[1] / 2, 0], size },
      onSelect: (how) => goTo(place.id, how),
      onHover: (h) => { spot.getWorldPosition(_hp); if (h) showHighlight(spot, _hp.x, _hp.z, o.highlightRadius || 0.5); else hideHighlight(spot); } });
  }
  function defaultStation(place, ctx) {
    const a = ctx.anchor;
    const col = kindColor(place.kind);
    addBox({ parent: a, y: 0.22, sx: 1.4, sy: 0.44, sz: 1.0, color: col });
    addBox({ parent: a, y: 0.48, sx: 1.9, sy: 0.08, sz: 1.3, color: theme.plinthCap || '#d9c3a0' });
    let top = 0.6;
    if (place.image) {
      const tex = new THREE.TextureLoader().load(sameOrigin(basePath + place.image));
      tex.colorSpace = THREE.SRGBColorSpace; ownedTextures.add(tex);
      const poster = new THREE.Mesh(shared.plane, new THREE.MeshBasicMaterial({ map: tex, fog: false }));
      poster.scale.set(1.1, 0.74, 1); poster.position.set(0, top + 0.4, 0);
      a.add(poster); top += 0.82;
    }
    const label = addLabel(place.title, { glyph: place.glyph, sub: place.labelSub || place.kind, size: 0.15, billboard: true, maxWidth: 2.2, bottom: top + 0.1 }, a);
    const hh = top + 0.9;
    addPlaceHit(place, a, { center: [0, hh / 2, 0], size: [1.9, hh, 1.3],
      onHover: (h) => { if (label) label.setColor(h ? '#ffffff' : '#e6dccd'); } });
    if (label) label.setColor('#e6dccd');
    addSpot(place, a, { distance: 1.8 });
    return a;
  }
  function defaultMarker(place, ctx) {
    const a = ctx.anchor;
    addBox({ parent: a, y: 0.45, sx: 0.16, sy: 0.9, sz: 0.16, color: kindColor(place.kind) });
    addBox({ parent: a, y: 0.92, sx: 0.5, sy: 0.05, sz: 0.3, color: theme.plinthCap || '#d9c3a0' });
    addLabel(place.title, { glyph: place.glyph, sub: place.labelSub, size: 0.11, billboard: true, maxWidth: 1.6, bottom: 1.05 }, a);
    addPlaceHit(place, a, { center: [0, 0.75, 0], size: [0.9, 1.5, 0.9], highlightRadius: 0.6 });
    return a;
  }
  const builders = Object.assign({ station: defaultStation, marker: defaultMarker }, opts.builders || {});

  for (const place of manifest.places) {
    const slot = slots.get(place.id);
    const rec = { ...place, slot: slot || null, object: null };
    byId.set(place.id, rec); places.push(rec);
    if (!slot) continue; // listed in the DOM, left out of the scene
    const anchor = new THREE.Group(); anchor.name = `place:${place.id}`;
    anchor.position.set(slot.x, 0, slot.z); anchor.rotation.y = slot.yaw;
    scene.add(anchor); anchor.updateWorldMatrix(true, false);
    const b = builders[place.kind] || builders.station;
    const obj = b(rec, Object.assign(Object.create(ctxBase), { anchor, slot })) || anchor;
    if (obj !== anchor) anchor.add(obj);
    if (!anchor.userData.spatialInteractive && !hasInteractive(anchor)) addInteractable(anchor, { label: place.title, place, onSelect: (how) => selectPlace(rec, how), onDwell: () => dwellPlace(rec) });
    rec.object = anchor;
  }
  function hasInteractive(o) { let f = false; o.traverse((c) => { if (c.userData.spatialInteractive) f = true; }); return f; }

  // portals
  const portalMat = new THREE.MeshBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.35, side: THREE.DoubleSide, fog: false, depthWrite: false });
  const portals = [];
  for (const p of manifest.portals || []) {
    if (!p.position) continue;
    const a = new THREE.Group(); a.name = `portal:${p.title}`;
    a.position.set(p.position.x, 0, p.position.z);
    a.rotation.y = p.yaw != null ? -p.yaw * RAD : Math.atan2(-p.position.x, -p.position.z);
    scene.add(a); a.updateWorldMatrix(true, false);
    const pc = theme.portal || '#6b4a3a';
    addBox({ parent: a, x: -0.95, y: 1.15, sx: 0.3, sy: 2.3, sz: 0.5, color: pc });
    addBox({ parent: a, x: 0.95, y: 1.15, sx: 0.3, sy: 2.3, sz: 0.5, color: pc });
    addBox({ parent: a, x: 0.35, y: 2.38, sx: 3.2, sy: 0.16, sz: 0.9, color: theme.plinthCap || '#d9c3a0' });
    addInstance('portal-inner', shared.plane, portalMat, _m.compose(_p.set(0, 1.12, 0), _q.identity(), _s.set(1.6, 2.2, 1)).premultiply(a.matrixWorld));
    const inner = new THREE.Object3D(); inner.position.set(0, 1.12, 0); inner.name = `portal-hit:${p.title}`; a.add(inner);
    addLabel(p.title, { sub: '3D room', size: 0.12, billboard: true, glyph: '↗', maxWidth: 2.0, bottom: 2.6 }, a);
    const item = { id: p.id || p.url, kind: p.kind || '3d room', ...p, spatial: !!p.spatial };
    addInteractable(inner, { label: p.title, place: item, box: { center: [0, 0, 0], size: [1.6, 2.2, 0.3] }, onSelect: (how) => selectPlace(item, how),
      onDwell: () => dwellPlace(item),
      onHover: (h) => { a.getWorldPosition(_hp); if (h) showHighlight(a, _hp.x, _hp.z, 1.3); else hideHighlight(a); } });
    portals.push({ ...item, object: a });
  }

  camera.position.y = camOpts.pageEye; camera.rotation.x = camOpts.pitch * RAD;
  const startPose = { x: (manifest.start && manifest.start.x) || 0, z: (manifest.start && manifest.start.z) ?? 8, yaw: -((manifest.start && manifest.start.yaw) || 0) * RAD };
  applyPose(startPose.x, startPose.z, startPose.yaw);

  function goTo(placeId, how) {
    const p = byId.get(placeId) || portals.find((x) => x.id === placeId);
    if (!p || !p.object) return false;
    const a = p.object; a.getWorldPosition(_hp);
    const yaw = a.rotation.y; // station local +z faces the viewer spot
    const sd = a.userData.standDistance ?? 1.8;
    const sx = _hp.x + Math.sin(yaw) * sd, sz = _hp.z + Math.cos(yaw) * sd;
    moveTo(sx, sz, Math.atan2(-(_hp.x - sx), -(_hp.z - sz)), how || 'api');
    return true;
  }

  // ---------- GLB loading (same origin only, meshopt-aware) ----------
  let gltfLoader = null;
  async function loadGLB(url) {
    const href = sameOrigin(/^(\/|\.|[a-z]+:)/i.test(url) ? url : basePath + url);
    if (!gltfLoader) {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
        import(new URL('./vendor/three-r185/addons/loaders/GLTFLoader.js', import.meta.url).href),
        import(new URL('./vendor/three-r185/addons/libs/meshopt_decoder.module.js', import.meta.url).href),
      ]);
      gltfLoader = new GLTFLoader();
      gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }
    const gltf = await gltfLoader.loadAsync(href);
    return gltf.scene;
  }

  // ---------- frame loop ----------
  const frameFns = [];
  function onFrame(fn) { frameFns.push(fn); return () => { const i = frameFns.indexOf(fn); if (i >= 0) frameFns.splice(i, 1); }; }

  // page pointer (mouse / touch / pen)
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const pagePtr = { hoverIt: null, hit: makeHit() };
  const drag = { id: null, x: 0, y: 0, moved: false, yaw: 0, pitch: 0, type: 'mouse' };
  function pageRay(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray;
  }
  function onPointerDown(e) {
    if (mode !== 'page' || drag.id !== null) return;
    drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; drag.moved = false; drag.type = e.pointerType || 'mouse';
    drag.yaw = rig.rotation.y; drag.pitch = camera.rotation.x;
    canvas.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (mode !== 'page') return;
    if (drag.id === e.pointerId) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
      if (drag.moved) {
        glide.active = false;
        const k = 2.4 / Math.max(300, canvas.clientWidth);
        rig.rotation.y = drag.yaw + dx * k;
        camera.rotation.x = Math.max(-1.1, Math.min(1.0, drag.pitch + dy * k));
        return;
      }
    }
    if (e.pointerType === 'mouse' && drag.id === null) {
      pick(pageRay(e.clientX, e.clientY), pagePtr.hit);
      setHover(pagePtr, pagePtr.hit.type === 'object' ? pagePtr.hit.it : null);
      canvas.style.cursor = pagePtr.hit.type ? 'pointer' : 'grab';
      if (pagePtr.hit.type === 'ground') { tpRing.position.set(pagePtr.hit.point.x, 0.02, pagePtr.hit.point.z); tpRing.visible = true; } else tpRing.visible = false;
    }
  }
  function onPointerUp(e) {
    if (drag.id !== e.pointerId) return;
    drag.id = null;
    if (drag.moved || mode !== 'page') return;
    const hit = pick(pageRay(e.clientX, e.clientY), pagePtr.hit);
    doSelect(hit, e.pointerType || 'mouse');
    if (e.pointerType !== 'mouse') setHover(pagePtr, null);
  }
  function onPointerCancel(e) { if (drag.id === e.pointerId) drag.id = null; }
  function onPointerLeave() { setHover(pagePtr, null); tpRing.visible = false; }
  function doSelect(hit, how) {
    if (hit.type === 'object') { if (hit.it.onSelect) hit.it.onSelect(how, hit); }
    else if (hit.type === 'ground') moveTo(hit.point.x, hit.point.z, null, how);
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.style.cursor = 'grab';

  // keyboard: Tab through the DOM list; focusing a place moves the viewer there
  function onListFocus(e) {
    const li = e.target.closest && e.target.closest('li[data-place]');
    if (li && mode === 'page' && byId.get(li.dataset.place)?.object) goTo(li.dataset.place, 'keyboard');
  }
  list.addEventListener('focusin', onListFocus);

  // XR controllers: tracked-pointer, hands (pinch = select), transient-pointer, gaze
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
  const lineMat = new THREE.LineBasicMaterial({ color: theme.accent, fog: false });
  const ctrls = [];
  // Four slots: two hands or controllers, plus transient pointers (visionOS pinch arrives as a third
  // source while hands are tracked). three only fills slots that exist when a source is added.
  for (let i = 0; i < 4; i++) {
    const c = renderer.xr.getController(i);
    const line = new THREE.Line(lineGeo, lineMat); line.name = 'ray'; line.scale.z = 5; line.visible = false;
    c.add(line); rig.add(c);
    const st = { c, line, source: null, hoverIt: null, hit: makeHit(), armed: true };
    c.addEventListener('connected', (e) => {
      st.source = e.data;
      const m = e.data.targetRayMode;
      line.visible = m === 'tracked-pointer'; // no ray for gaze, screen or transient-pointer (its ray is the user's gaze)
      emit('input', { slot: i, mode: m, hand: !!e.data.hand, handedness: e.data.handedness, connected: true });
    });
    c.addEventListener('disconnected', () => {
      const m = st.source && st.source.targetRayMode;
      st.source = null; line.visible = false; setHover(st, null);
      emit('input', { slot: i, mode: m, connected: false });
    });
    c.addEventListener('select', (e) => {
      const src = e.data || st.source;
      c.updateWorldMatrix(true, false);
      ctrlRay(c, _ray);
      const how = src && src.hand ? 'hand' : src && src.targetRayMode === 'transient-pointer' ? 'transient' : src && src.targetRayMode === 'gaze' ? 'gaze' : 'controller';
      doSelect(pick(_ray, st.hit), how);
    });
    ctrls.push(st);
  }
  const _o = new THREE.Vector3(), _d = new THREE.Vector3();
  function ctrlRay(obj, ray) {
    _o.setFromMatrixPosition(obj.matrixWorld);
    _d.set(0, 0, -1).transformDirection(obj.matrixWorld);
    ray.set(_o, _d);
    return ray;
  }
  const gazePtr = { hoverIt: null, hit: makeHit(), t0: 0, target: null };

  // fps
  let frames = 0, fpsT0 = performance.now(), fps = 0, lastT = performance.now();
  let started = false, readyEmitted = false, frameCount = 0;

  function frame(t, xrFrame) {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    // keep interactable inverses current (no allocation)
    for (let i = 0; i < interactables.length; i++) interactables[i].inv.copy(interactables[i].object.matrixWorld).invert();

    if (glide.active) {
      let u = Math.min(1, (now - glide.t0) / glide.dur);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      applyPose(glide.fx + (glide.tx - glide.fx) * e, glide.fz + (glide.tz - glide.fz) * e, glide.fyaw + (glide.tyaw - glide.fyaw) * e);
      if (u >= 1) glide.active = false;
    }
    if (fader.phase) {
      const u = Math.min(1, (now - fader.t0) / FADE_MS);
      if (fader.phase === 1) {
        fadeMat.opacity = u;
        if (u >= 1) { applyPose(fader.tx, fader.tz, fader.tyaw); fader.phase = 2; fader.t0 = now; }
      } else {
        fadeMat.opacity = 1 - u;
        if (u >= 1) {
          fader.phase = 0; fadeMat.opacity = 0; fade.visible = false;
          if (fader.queued) { fader.queued = false; fader.phase = 1; fader.t0 = now; fader.tx = fader.qx; fader.tz = fader.qz; fader.tyaw = fader.qyaw; fade.visible = true; }
        }
      }
    }

    if (mode !== 'page') {
      let pointerSources = 0, gazeSource = false;
      tpRing.visible = false;
      for (let i = 0; i < ctrls.length; i++) {
        const st = ctrls[i], src = st.source;
        if (!src) continue;
        if (src.targetRayMode === 'gaze') { gazeSource = true; continue; }
        pointerSources++;
        ctrlRay(st.c, _ray);
        pick(_ray, st.hit);
        setHover(st, st.hit.type === 'object' ? st.hit.it : null);
        st.line.scale.z = st.hit.type ? st.hit.distance : 5;
        if (st.hit.type === 'ground' && src.targetRayMode !== 'transient-pointer') { tpRing.position.set(st.hit.point.x, 0.02, st.hit.point.z); tpRing.visible = true; }
        // snap turn: thumbstick X with deadzone and re-arm
        const gp = src.gamepad;
        if (gp && gp.axes && gp.axes.length) {
          const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0];
          if (st.armed && Math.abs(ax) > DEADZONE) { st.armed = false; snapTurn(ax > 0 ? 1 : -1); }
          else if (!st.armed && Math.abs(ax) < REARM) st.armed = true;
        }
      }
      // gaze dwell when there is no pointer, or a gaze-mode source
      // Dwell never moves the viewer, follows a link, presses Open or enters a portal: it only opens a
      // place's panel (onDwell), or calls onSelect for interactables registered with dwell: true.
      // Off in AR, where the reticle is hidden.
      const useGaze = (gazeSource || pointerSources === 0) && mode === 'vr' && opts.gazeDwell !== false;
      reticle.visible = useGaze;
      if (useGaze) {
        ctrlRay(camera, _ray);
        pick(_ray, gazePtr.hit);
        const hi = gazePtr.hit.type === 'object' ? gazePtr.hit.it : null;
        const target = hi && (hi.onDwell || (hi.dwell && hi.onSelect)) ? hi : null;
        setHover(gazePtr, target);
        if (target !== gazePtr.target) { gazePtr.target = target; gazePtr.t0 = now; }
        const u = target ? Math.min(1, (now - gazePtr.t0) / DWELL_MS) : 0;
        reticleGeo.setDrawRange(0, target ? Math.max(6, Math.floor((reticleFull * u) / 6) * 6) : reticleFull);
        if (target && u >= 1) {
          gazePtr.t0 = now + 1e9;
          if (target.onDwell) target.onDwell(gazePtr.hit); else target.onSelect('gaze', gazePtr.hit);
        }
      } else if (gazePtr.hoverIt) setHover(gazePtr, null);
    }

    // label billboards (yaw only)
    if (billboards.length || atlasLabels.length) {
      camera.getWorldPosition(_cw);
      for (let i = 0; i < atlasLabels.length; i++) {
        const r = atlasLabels[i];
        if (!(r.billboard || r.boost) || !r.visible || r.removed || !r.page.mesh) continue;
        let k = 1;
        if (r.boost && mode === 'page') { const dd = Math.hypot(_cw.x - r.world.x, _cw.z - r.world.z); k = Math.min(boostMax, Math.max(1, dd / boostRef)); }
        writeLabelMatrix(r, r.billboard ? Math.atan2(_cw.x - r.world.x, _cw.z - r.world.z) : r.yaw, k);
      }
      for (let i = 0; i < billboards.length; i++) {
        const b = billboards[i], par = b.parent;
        if (!par) continue;
        b.getWorldPosition(_hp);
        b.rotation.y = Math.atan2(_cw.x - _hp.x, _cw.z - _hp.z) - par.rotation.y;
      }
    }
    for (let i = 0; i < frameFns.length; i++) frameFns[i](dt, now / 1000);

    renderer.render(scene, camera);
    frames++; frameCount++;
    if (now - fpsT0 >= 1000) { fps = (frames * 1000) / (now - fpsT0); frames = 0; fpsT0 = now; }
    if (!readyEmitted) { readyEmitted = true; emit('ready', world); }
  }

  // ---------- sizing ----------
  function resize() {
    if (disposed || renderer.xr.isPresenting) return;
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Camera policy: keep the horizontal FOV at camOpts.minHFov or more by raising the vertical FOV,
    // never above camOpts.maxVFov. Tall canvases then do not shrink the world.
    const needV = 2 * Math.atan(Math.tan((camOpts.minHFov * RAD) / 2) / camera.aspect) / RAD;
    camera.fov = Math.min(camOpts.maxVFov, Math.max(camOpts.fov, needV));
    camera.updateProjectionMatrix();
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(stage); else window.addEventListener('resize', resize);
  resize();

  function onMotionChange() { reducedMotion = !!(mq && mq.matches); if (reducedMotion) glide.active = false; }
  if (mq) mq.addEventListener ? mq.addEventListener('change', onMotionChange) : mq.addListener(onMotionChange);

  // ---------- XR sessions ----------
  const saved = { pitch: 0, fog: null };
  async function startSession(session, m) {
    let type = 'local-floor';
    try { await session.requestReferenceSpace('local-floor'); } catch (e) { type = 'local'; }
    renderer.xr.setReferenceSpaceType(type);
    try { renderer.xr.setFoveation(1); } catch (e) { /* not supported */ }
    saved.pitch = camera.rotation.x;
    glide.active = false;
    viewerXZ(_cw); const keepX = _cw.x, keepZ = _cw.z;
    try { await renderer.xr.setSession(session); } catch (e) { try { await session.end(); } catch (e2) { /* already ended */ } throw e; }
    mode = m;
    rig.position.y = type === 'local' ? EYE : 0;
    camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
    applyPose(keepX, keepZ, rig.rotation.y);
    setHover(pagePtr, null);
    if (m === 'ar') {
      renderer.setClearAlpha(0); sky.visible = false; ground.visible = false; saved.fog = scene.fog; scene.fog = null;
    }
    session.addEventListener('end', onSessionEnd);
    world.referenceSpaceType = type;
    stage.classList.add('spatial-presenting');
    updateLoop();
    emit('sessionstart', { mode: m, referenceSpace: type });
  }
  function onSessionEnd() {
    const wasAR = mode === 'ar';
    // a teleport the user asked for during the fade still happens
    if (fader.phase === 1 || fader.queued) applyPose(fader.queued ? fader.qx : fader.tx, fader.queued ? fader.qz : fader.tz, fader.queued ? fader.qyaw : fader.tyaw);
    fader.queued = false;
    viewerXZ(_cw); const keepX = _cw.x, keepZ = _cw.z;
    mode = 'page';
    rig.position.y = 0;
    camera.position.set(0, camOpts.pageEye, 0); camera.quaternion.identity(); camera.rotation.x = saved.pitch;
    applyPose(keepX, keepZ, rig.rotation.y);
    if (wasAR) { renderer.setClearAlpha(1); sky.visible = true; ground.visible = true; scene.fog = saved.fog; }
    for (const st of ctrls) { setHover(st, null); st.source = null; st.line.visible = false; }
    setHover(gazePtr, null); reticle.visible = false; tpRing.visible = false;
    fader.phase = 0; fadeMat.opacity = 0; fade.visible = false;
    hidePanel();
    if (overlay.parentNode) overlay.remove();
    stage.classList.remove('spatial-presenting');
    resize();
    updateLoop();
    emit('sessionend', { mode: wasAR ? 'ar' : 'vr' });
  }
  // One pending entry at a time: a second call while starting (or while presenting) gets the same promise.
  let pendingEntry = null;
  function enterOnce(fn) {
    if (pendingEntry) return pendingEntry;
    if (renderer.xr.isPresenting) return Promise.resolve();
    pendingEntry = (async () => fn())().finally(() => { pendingEntry = null; });
    return pendingEntry;
  }
  function enterVR() {
    return enterOnce(async () => {
      if (disposed) throw new Error('world disposed');
      if (!navigator.xr) throw new Error('WebXR not available');
      const features = ['local-floor'];
      if (xrOpts.handTracking) features.push('hand-tracking');
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: features });
      await startSession(session, 'vr');
    });
  }
  const overlay = el('div', { class: 'spatial-ar-overlay' });
  function enterAR() {
    return enterOnce(async () => {
      if (!xrOpts.ar) throw new Error('AR not enabled for this page');
      if (!navigator.xr) throw new Error('WebXR not available');
      root.appendChild(overlay);
      if (!overlay.firstChild) {
        const x = el('button', { type: 'button', class: 'spatial-btn' }, 'Exit AR');
        x.addEventListener('click', () => renderer.xr.getSession()?.end());
        overlay.appendChild(x);
      }
      try {
        const session = await navigator.xr.requestSession('immersive-ar', { optionalFeatures: ['hit-test', 'local-floor', 'dom-overlay'], domOverlay: { root: overlay } });
        await startSession(session, 'ar');
      } catch (err) { if (overlay.parentNode) overlay.remove(); throw err; }
    });
  }
  function makeEnter(label, fn) {
    const b = el('button', { type: 'button', class: 'spatial-btn' }, label);
    b.addEventListener('click', () => { fn().catch((err) => { status.textContent = `Could not start: ${err.message}`; }); });
    bar.appendChild(b);
    return b;
  }
  const enterButtons = {};
  if (navigator.xr && navigator.xr.isSessionSupported) {
    if (xrOpts.vr) navigator.xr.isSessionSupported('immersive-vr').then((ok) => { if (ok && !disposed) enterButtons.vr = makeEnter('Enter VR', enterVR); }).catch(() => {});
    if (xrOpts.ar) navigator.xr.isSessionSupported('immersive-ar').then((ok) => { if (ok && !disposed) enterButtons.ar = makeEnter('Enter AR', enterAR); }).catch(() => {});
  }
  function onGranted() {
    if (!xrOpts.vr || disposed || !xrGranted) return;
    xrGranted = false;
    enterVR().catch(() => {});
  }
  grantWaiters.add(onGranted);

  // ---------- public object ----------
  // Render only when useful: always during an XR session; on the page only while the canvas is on
  // screen and the document is visible.
  let onScreen = true, looping = false;
  function updateLoop() {
    const want = started && !disposed && (renderer.xr.isPresenting || (onScreen && !document.hidden));
    if (want === looping) return;
    looping = want;
    renderer.setAnimationLoop(want ? frame : null);
    if (want) lastT = performance.now();
  }
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((es) => { for (const e of es) onScreen = e.isIntersecting; updateLoop(); }) : null;
  if (io) io.observe(stage);
  function onVisibility() { updateLoop(); }
  document.addEventListener('visibilitychange', onVisibility);
  function start() { if (started || disposed) return; started = true; updateLoop(); }
  function info() {
    const r = renderer.info;
    return { calls: r.render.calls, triangles: r.render.triangles, textures: r.memory.textures, geometries: r.memory.geometries, fps: Math.round(fps * 10) / 10 };
  }
  function dispose() {
    if (disposed) return; disposed = true;
    renderer.setAnimationLoop(null); looping = false;
    if (io) io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    grantWaiters.delete(onGranted);
    const s = renderer.xr.getSession(); if (s) s.end().catch(() => {});
    canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    list.removeEventListener('focusin', onListFocus);
    if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
    if (mq) mq.removeEventListener ? mq.removeEventListener('change', onMotionChange) : mq.removeListener(onMotionChange);
    const geos = new Set(), mats = new Set();
    scene.traverse((o) => {
      if (o.geometry) geos.add(o.geometry);
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
      if (o.isInstancedMesh) o.dispose();
    });
    for (const b of batches.values()) { geos.add(b.geometry); mats.add(b.material); }
    Object.values(shared).forEach((x) => (x.isMaterial ? mats.add(x) : geos.add(x)));
    for (const m of mats) { for (const k in m) { const v = m[k]; if (v && v.isTexture) ownedTextures.add(v); } m.dispose(); }
    for (const g of geos) g.dispose();
    for (const t of ownedTextures) t.dispose();
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) { /* already lost */ }
    interactables.length = 0; frameFns.length = 0; billboards.length = 0; batches.clear(); atlasLabels.length = 0; atlasPages.length = 0;
    for (const k in listeners) delete listeners[k];
    root.remove();
  }

  const world = {
    webgl: true, version: VERSION, manifest, scene, camera, renderer, rig, places, portals, list, root,
    start, dispose, goTo, enterVR, enterAR, info, on, flushInstances,
    moveTo: (x, z, yawDeg) => moveTo(x, z, yawDeg == null ? null : -yawDeg * RAD, 'api'),
    snapTurn, select: (id, how) => { const p = byId.get(id) || portals.find((x) => x.id === id); if (p) selectPlace(p, how || 'api'); },
    get mode() { return mode; }, get reducedMotion() { return reducedMotion; },
    get frameCount() { return frameCount; }, get running() { return looping; },
    showPanel, hidePanel, removeLabel, get panelOpen() { return panel.visible; },
    referenceSpaceType: null,
    ctx: null,
  };
  ctxBase.world = world;
  world.ctx = Object.create(ctxBase);

  if (opts.decorate) await opts.decorate(world.ctx);
  flushInstances();
  if (opts.autoStart !== false) start();
  if (xrGranted) queueMicrotask(onGranted); // a grant that arrived before this world existed
  return world;
}
