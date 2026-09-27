/**
 * Contour Field — the 3D engine behind the homepage art module
 * (src/components/HomeContourField.astro).
 *
 * A single high-density plane is displaced on the GPU by a domain-warped
 * simplex field. The same field drives a set of flowing contour bands
 * (red / paper / blue / pink / periwinkle, one green thread) and a few
 * ink-black voids, after the "Hoydich Enterprises Network · El Segundo"
 * poster loop. Everything is computed in shaders: no textures, no models,
 * no network. Pointer bends the stripes, a tap drops a ripple, drag tilts
 * the camera, and the seed changes with the Los Angeles date.
 */
import {
  Color,
  Mesh,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three';

export type Palette = {
  id: string;
  label: string;
  bg: string;
  ink: string;
  bands: [string, string, string, string, string, string];
  thread: string;
};

export const PALETTES: Palette[] = [
  {
    id: 'poster',
    label: 'Poster',
    bg: '#f1ede4',
    ink: '#121114',
    bands: ['#e4402f', '#f6f2e9', '#2c50d8', '#f2a0a6', '#9bb1f4', '#f6f2e9'],
    thread: '#23a24a',
  },
  {
    id: 'night',
    label: 'Night shift',
    bg: '#0b0d1c',
    ink: '#020308',
    bands: ['#ff4f3a', '#171b3a', '#3f7bff', '#ff8fc0', '#7fe3ff', '#171b3a'],
    thread: '#8dff6a',
  },
  {
    id: 'refinery',
    label: 'Refinery dusk',
    bg: '#f7e9d7',
    ink: '#1c0c24',
    bands: ['#ff6a3d', '#fff3de', '#5a3cf0', '#ffb38a', '#ffd166', '#fff3de'],
    thread: '#08c792',
  },
];

const MAX_RIPPLES = 6;

// Ashima simplex noise (MIT) — compact 3D variant.
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const VERTEX = /* glsl */ `
uniform float uTime;
uniform vec2 uSeed;
uniform vec3 uPointer;      // xy = field position, z = strength 0..1
uniform vec4 uRipples[${MAX_RIPPLES}]; // xy = origin, z = start time, w = amp
uniform float uCalm;        // 1 = still (reduced motion), 0 = live
varying float vStripe;
varying float vVoid;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vEdge;

${NOISE}

// x = height, y = void field, z = stripe coordinate
vec3 field(vec2 p){
  float t = uTime * (1. - uCalm * .96);
  vec2 q = p + uSeed;
  vec2 warp = vec2(
    snoise(vec3(q * .55, t * .045)),
    snoise(vec3(q * .55 + 17.3, t * .045))
  );
  vec2 w = q + warp * .75;
  float voids = snoise(vec3(w * .62 + 5.1, t * .03)) + .45 * snoise(vec3(w * 1.35 - 2.7, t * .05));
  float bowl = smoothstep(.2, .9, voids);
  float lowH = -.34 * bowl + .09 * snoise(vec3(w * 1.6, t * .07));
  float h = lowH + .03 * snoise(vec3(w * 4.2, t * .11));

  // pointer: a soft swell that also pushes the bands aside
  vec2 dp = p - uPointer.xy;
  float pd = dot(dp, dp);
  float swell = uPointer.z * exp(-pd * 2.6);
  h += .26 * swell;
  lowH += .26 * swell;

  // tap ripples
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w > 0. && age > 0. && age < 7.) {
      float d = length(p - r.xy);
      float front = age * .95;
      float ring = sin((d - front) * 11.) * exp(-abs(d - front) * 2.6) * exp(-age * .5);
      h += r.w * .22 * ring;
      lowH += r.w * .22 * ring;
    }
  }

  // contour coordinate: bands run roughly north-south and wrap around the voids
  float stripe = p.x * 8.5 + warp.x * 3.1 + warp.y * .9 + voids * 2.6 + swell * 3.2 + lowH * 4.;
  return vec3(h, voids, stripe);
}

void main(){
  vec2 p = position.xy;
  // keep the far rim calm so the plane dissolves into the paper
  float rim = 1. - smoothstep(2.1, 3.1, length(p * vec2(.9, 1.)));
  vec3 f = field(p);
  float e = .02;
  float hx = field(p + vec2(e, 0.)).x;
  float hy = field(p + vec2(0., e)).x;
  vec3 dx = vec3(e, 0., (hx - f.x) * rim);
  vec3 dy = vec3(0., e, (hy - f.x) * rim);
  vNormal = normalize(cross(dx, dy));
  vec3 pos = vec3(p, f.x * rim);
  vStripe = f.z;
  vVoid = f.y;
  vEdge = rim;
  vec4 world = modelMatrix * vec4(pos, 1.);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uBands[6];
uniform vec3 uThread;
uniform vec3 uInk;
uniform vec3 uBg;
uniform float uThreadBand;
uniform vec3 uCam;
uniform vec2 uRes;
varying float vStripe;
varying float vVoid;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vEdge;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 band(float idx){
  if (abs(idx - uThreadBand) < .5) return uThread;
  float k = mod(idx, 6.);
  if (k < .5) return uBands[0];
  if (k < 1.5) return uBands[1];
  if (k < 2.5) return uBands[2];
  if (k < 3.5) return uBands[3];
  if (k < 4.5) return uBands[4];
  return uBands[5];
}

void main(){
  float s = vStripe;
  float idx = floor(s);
  float f = fract(s);
  float w = max(fwidth(s), 1e-4) * 1.1;
  vec3 col = mix(band(idx), band(idx + 1.), smoothstep(1. - w, 1., f));
  // printed edge: a slightly darker lip at every band boundary
  float lip = 1. - smoothstep(0., w * 2.2 + .045, min(f, 1. - f));
  col *= 1. - .14 * lip;

  // ink voids with grain and a whisper of the band color underneath
  float vw = fwidth(vVoid) + .012;
  float m = smoothstep(.5 - vw, .5 + vw, vVoid);
  float g = hash(floor(gl_FragCoord.xy * .75) + floor(uTime * 12.));
  vec3 inkCol = uInk + (g - .5) * .09 + band(idx) * .07 * step(.9, g);
  float halo = smoothstep(.36, .5, vVoid) * (1. - m);
  col = mix(col, col * .78, halo * .6);
  col = mix(col, inkCol, m);

  // light: soft lambert + a wet-ink sheen
  vec3 n = normalize(vNormal);
  vec3 L = normalize(vec3(-.45, .55, .9));
  float lam = clamp(dot(n, L), 0., 1.);
  vec3 V = normalize(uCam - vWorld);
  float spec = pow(clamp(dot(reflect(-L, n), V), 0., 1.), 28.) * (1. - m * .6);
  col = col * (.62 + .45 * lam) + spec * .16;

  // paper tooth + fade into the page
  float tooth = hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5;
  col += tooth * .045;
  float fog = smoothstep(4.2, 7.2, distance(uCam, vWorld));
  col = mix(col, uBg, max(fog, 1. - vEdge));
  vec2 uv = gl_FragCoord.xy / uRes;
  col *= 1. - .16 * pow(length(uv - .5) * 1.25, 2.2);
  gl_FragColor = vec4(col, 1.);
}
`;

export type ContourFieldOptions = {
  canvas: HTMLCanvasElement;
  seed: number;
  reducedMotion: boolean;
  onFrame?: (fps: number) => void;
};

export type ContourField = {
  setPalette(id: string): Palette;
  setSeed(seed: number): void;
  ripple(x?: number, y?: number): void;
  setPaused(paused: boolean): void;
  setVisible(visible: boolean): void;
  setScroll(progress: number): void;
  snapshot(): HTMLCanvasElement;
  dispose(): void;
};

function seedVec(seed: number) {
  const a = Math.sin(seed * 12.9898) * 43758.5453;
  const b = Math.sin(seed * 78.233) * 12543.123;
  return new Vector2((a - Math.floor(a)) * 40 - 20, (b - Math.floor(b)) * 40 - 20);
}

export function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function createContourField(opts: ContourFieldOptions): ContourField {
  const { canvas } = opts;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let dprCap = Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2);
  renderer.setPixelRatio(dprCap);
  renderer.setClearColor(PALETTES[0].bg);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 40);
  const segments = coarse ? 220 : 340;
  const geometry = new PlaneGeometry(7, 7, segments, segments);

  const ripples = Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, -99, 0));
  const uniforms = {
    uTime: { value: 0 },
    uSeed: { value: seedVec(opts.seed) },
    uPointer: { value: new Vector3(0, 0, 0) },
    uRipples: { value: ripples },
    uCalm: { value: opts.reducedMotion ? 1 : 0 },
    uBands: { value: PALETTES[0].bands.map((c) => new Color(c)) },
    uThread: { value: new Color(PALETTES[0].thread) },
    uInk: { value: new Color(PALETTES[0].ink) },
    uBg: { value: new Color(PALETTES[0].bg) },
    uThreadBand: { value: 2 },
    uCam: { value: new Vector3() },
    uRes: { value: new Vector2(1, 1) },
  };
  const material = new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  // camera rig: yaw/pitch with damping; drag nudges, idle drifts
  const rig = { yaw: 0.35, pitch: 0.95, dist: 4.6, tYaw: 0.35, tPitch: 0.95, scroll: 0 };
  const target = new Vector3(0, 0, 0.2);
  const raycaster = new Raycaster();
  const ground = new Plane(new Vector3(0, 1, 0), 0);
  const ndc = new Vector2();
  const hit = new Vector3();
  const pointer = { x: 0, y: 0, strength: 0, target: 0 };
  let rippleSlot = 0;

  let paused = false;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let clock = 0;
  let slowFrames = 0;
  let fpsAcc = 0;
  let fpsN = 0;

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: pull back so the field still fills the frame
    camera.fov = w / h < 0.9 ? 44 : 34;
    camera.updateProjectionMatrix();
    const px = renderer.getDrawingBufferSize(new Vector2());
    uniforms.uRes.value.copy(px);
  }

  function toField(clientX: number, clientY: number): Vector3 | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(ground, hit)) return null;
    // mesh is rotated -90° about x: world (x, z) -> field (x, -z)
    return new Vector3(hit.x, -hit.z, 0);
  }

  let dragging = false;
  let dragMoved = 0;
  let lastX = 0;
  let lastY = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    dragMoved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const p = toField(e.clientX, e.clientY);
    if (p) {
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.target = 1;
    }
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      rig.tYaw = Math.max(-1.1, Math.min(1.1, rig.tYaw - dx * 0.005));
      rig.tPitch = Math.max(0.45, Math.min(1.35, rig.tPitch + dy * 0.004));
    }
    if (paused || !visible) requestFrame();
  };
  const onUp = (e: PointerEvent) => {
    if (dragging && dragMoved < 8) {
      const p = toField(e.clientX, e.clientY);
      if (p) api.ripple(p.x, p.y);
    }
    dragging = false;
  };
  const onLeave = () => {
    pointer.target = 0;
    dragging = false;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onLeave);
  canvas.addEventListener('pointerleave', onLeave);

  const ro = new ResizeObserver(() => {
    resize();
    requestFrame();
  });
  ro.observe(canvas);
  resize();

  const ripplingAt = (t: number) => ripples.some((r) => r.w > 0 && t - r.z < 7);

  function renderOnce(dt: number) {
    const live = !opts.reducedMotion;
    // reduced motion: the field holds still; only a visitor's own ripple advances time
    if (live || ripplingAt(clock)) clock += dt;
    uniforms.uTime.value = clock;

    pointer.strength += (pointer.target - pointer.strength) * Math.min(1, dt * 4);
    uniforms.uPointer.value.set(pointer.x, pointer.y, pointer.strength);

    const idle = live && !dragging ? Math.sin(clock * 0.11) * 0.28 : 0;
    rig.yaw += (rig.tYaw + idle - rig.yaw) * Math.min(1, dt * 2.4);
    const pitch = rig.tPitch + (rig.scroll - 0.5) * 0.22;
    rig.pitch += (pitch - rig.pitch) * Math.min(1, dt * 2.4);
    const cp = Math.cos(rig.pitch);
    camera.position.set(
      target.x + Math.sin(rig.yaw) * cp * rig.dist,
      target.y + Math.sin(rig.pitch) * rig.dist,
      target.z + Math.cos(rig.yaw) * cp * rig.dist,
    );
    camera.lookAt(target);
    uniforms.uCam.value.copy(camera.position);
    renderer.render(scene, camera);
  }

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    renderOnce(dt);

    // adaptive resolution: if we keep missing ~40fps, shed pixels once or twice
    if (dt > 0.026) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && dprCap > 1) {
      dprCap = Math.max(1, dprCap - 0.5);
      renderer.setPixelRatio(dprCap);
      resize();
      slowFrames = 0;
    }
    fpsAcc += dt;
    fpsN++;
    if (fpsAcc > 0.5) {
      opts.onFrame?.(Math.round(fpsN / fpsAcc));
      fpsAcc = 0;
      fpsN = 0;
    }

    const settling = Math.abs(pointer.target - pointer.strength) > 0.01 || Math.abs(rig.tYaw - rig.yaw) > 0.002;
    const rippling = ripplingAt(clock);
    if (visible && (!paused || settling) && (!opts.reducedMotion || settling || dragging || rippling)) requestFrame();
  }

  function requestFrame() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  const api: ContourField = {
    setPalette(id) {
      const pal = PALETTES.find((p) => p.id === id) ?? PALETTES[0];
      pal.bands.forEach((c, i) => uniforms.uBands.value[i].set(c));
      uniforms.uThread.value.set(pal.thread);
      uniforms.uInk.value.set(pal.ink);
      uniforms.uBg.value.set(pal.bg);
      renderer.setClearColor(pal.bg);
      requestFrame();
      return pal;
    },
    setSeed(seed) {
      uniforms.uSeed.value.copy(seedVec(seed));
      uniforms.uThreadBand.value = (seed % 5) - 1;
      requestFrame();
    },
    ripple(x, y) {
      const px = x ?? (Math.random() - 0.5) * 2.4;
      const py = y ?? (Math.random() - 0.5) * 2.4;
      ripples[rippleSlot].set(px, py, clock, 1);
      rippleSlot = (rippleSlot + 1) % MAX_RIPPLES;
      requestFrame();
    },
    setPaused(p) {
      paused = p;
      if (!p) requestFrame();
    },
    setVisible(v) {
      visible = v;
      if (v) requestFrame();
    },
    setScroll(progress) {
      rig.scroll = Math.max(0, Math.min(1, progress));
      if (!paused && visible) requestFrame();
    },
    snapshot() {
      renderOnce(0);
      return canvas;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onLeave);
      canvas.removeEventListener('pointerleave', onLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };

  api.setSeed(opts.seed);
  requestFrame();
  return api;
}
