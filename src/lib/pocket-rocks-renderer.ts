/** A small, demand-rendered specimen viewer. All appearance comes from the seed. */
export interface Rock {
  seed: number;
  id: string;
  familyId: string;
  name: string;
  geology: string;
  group: string;
  story: string;
  fact: string;
  palette: string[];
  texture: string;
}

export interface RockViewer {
  setRock(rock: Rock): void;
  turn(direction: number): void;
  dispose(): void;
}

type Three = typeof import('three');
type RGB = [number, number, number];

function hash(x: number, y: number, z: number, seed: number): number {
  let h = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const smooth = (v: number) => v * v * (3 - 2 * v);
  const tx = smooth(x - ix), ty = smooth(y - iy), tz = smooth(z - iz);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const a = lerp(hash(ix, iy, iz, seed), hash(ix + 1, iy, iz, seed), tx);
  const b = lerp(hash(ix, iy + 1, iz, seed), hash(ix + 1, iy + 1, iz, seed), tx);
  const c = lerp(hash(ix, iy, iz + 1, seed), hash(ix + 1, iy, iz + 1, seed), tx);
  const d = lerp(hash(ix, iy + 1, iz + 1, seed), hash(ix + 1, iy + 1, iz + 1, seed), tx);
  return lerp(lerp(a, b, ty), lerp(c, d, ty), tz);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  const amount = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount];
}

function palette(rock: Rock): RGB[] {
  const defaults = ['#d6ccbc', '#8e8475', '#3f3b37', '#b7885e'];
  return defaults.map((fallback, index) => {
    const color = /^#[\da-f]{6}$/i.test(rock.palette[index] || '') ? rock.palette[index] : fallback;
    return [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)] as RGB;
  });
}

function surface(rock: Rock, colors: RGB[], x: number, y: number, z: number): { color: RGB; relief: number } {
  const seed = rock.seed >>> 0;
  const broad = noise(x * 3 + 7.1, y * 3, z * 3, seed);
  const fine = noise(x * 26, y * 26 + 1.4, z * 26, seed ^ 0x735ac);
  const grain = hash(Math.floor(x * 175), Math.floor(y * 175), Math.floor(z * 175), seed ^ 0x49a3);
  const [light, base, dark, accent] = colors;
  let color: RGB = mix(base, light, broad * 0.35);
  let relief = 0.5 + (fine - 0.5) * 0.65 + (grain - 0.5) * 0.22;

  switch (rock.familyId) {
    case 'basalt': {
      color = mix(base, dark, 0.22 + broad * 0.6);
      color = mix(color, light, grain > 0.96 ? (grain - 0.96) * 10 : 0);
      if (broad > 0.69) color = mix(color, accent, (broad - 0.69) * 0.8);
      break;
    }
    case 'granite': {
      const mineral = noise(x * 77, y * 77, z * 77, seed);
      color = mix(base, light, 0.45 + broad * 0.35);
      if (mineral < 0.37) color = mix(color, dark, (0.37 - mineral) * 4);
      if (mineral > 0.61) color = mix(color, accent, (mineral - 0.61) * 3.1);
      if (grain > 0.975) color = mix(color, light, 0.6);
      relief = mineral * 0.7 + grain * 0.3;
      break;
    }
    case 'sandstone': {
      const layer = Math.sin(y * 48 + x * 7 + broad * 3);
      const crossBed = Math.sin(y * 93 + x * 19 + z * 6);
      color = mix(base, light, 0.28 + broad * 0.4);
      color = mix(color, accent, Math.max(0, layer) * 0.22);
      color = mix(color, dark, Math.max(0, crossBed) * 0.075);
      relief = 0.45 + layer * 0.11 + (grain - 0.5) * 0.45;
      break;
    }
    case 'slate': {
      const cleavage = Math.abs(Math.sin(y * 66 + x * 4 + broad * 2));
      color = mix(base, light, broad * 0.28);
      color = mix(color, dark, Math.pow(1 - cleavage, 12) * 0.5);
      color = mix(color, accent, Math.max(0, fine - 0.7) * 0.5);
      relief = 0.55 - Math.pow(1 - cleavage, 8) * 0.35 + (grain - 0.5) * 0.12;
      break;
    }
    case 'obsidian': {
      const fracture = Math.pow(Math.max(0, Math.sin(x * 18 + z * 8 + broad * 5)), 28);
      color = mix(dark, base, 0.12 + broad * 0.38);
      color = mix(color, light, fracture * 0.04);
      relief = 0.5 + (fine - 0.5) * 0.06 + fracture * 0.08;
      break;
    }
    case 'pumice': {
      const cavity = Math.pow(Math.max(0, (fine - 0.45) / 0.55), 1.6);
      color = mix(base, light, 0.48 + broad * 0.36);
      color = mix(color, dark, cavity * 0.65);
      if (grain < 0.08) color = mix(color, dark, 0.22);
      relief = 0.8 - cavity * 0.8;
      break;
    }
    case 'agate': {
      // Off-center, warped concentric bands continue around the specimen.
      const ring = Math.sqrt((x + 0.67) ** 2 + (y - 0.4) ** 2 * 1.25 + z * z * 0.34);
      const band = Math.sin(ring * 36 + broad * 3.8);
      const hairline = Math.pow(Math.max(0, Math.cos(ring * 78 + broad * 7.6)), 15);
      color = mix(base, accent, 0.5 + band * 0.5);
      color = mix(color, dark, Math.max(0, -band) * 0.2);
      color = mix(color, light, Math.max(0, band - 0.42) * 0.85 + hairline * 0.58);
      relief = 0.5 + band * 0.015 + (grain - 0.5) * 0.02;
      break;
    }
    case 'jasper': {
      color = mix(base, dark, broad * 0.65);
      color = mix(color, accent, Math.max(0, fine - 0.55) * 1.2);
      const seam = Math.pow(1 - Math.abs(Math.sin(x * 8 + y * 6 + broad * 5)), 22);
      color = mix(color, light, seam * 0.38);
      relief = 0.5 + (fine - 0.5) * 0.15 + (grain - 0.5) * 0.06;
      break;
    }
    case 'serpentinite': {
      const vein = Math.pow(1 - Math.abs(Math.sin(x * 13 + y * 8 + z * 5 + broad * 9)), 18);
      color = mix(base, dark, broad * 0.65);
      color = mix(color, accent, Math.max(0, fine - 0.43) * 0.8);
      color = mix(color, light, vein * 0.77);
      relief = 0.5 + (fine - 0.5) * 0.2 - vein * 0.12;
      break;
    }
    case 'quartzite': {
      color = mix(base, light, 0.38 + broad * 0.48);
      color = mix(color, accent, Math.max(0, fine - 0.54) * 0.45);
      color = mix(color, dark, grain < 0.025 ? 0.24 : 0);
      relief = 0.4 + grain * 0.5 + fine * 0.1;
      break;
    }
  }
  const grainShade = 0.97 + grain * 0.06;
  return { color: color.map(v => Math.min(255, v * grainShade)) as RGB, relief };
}

function makeTextures(THREE: Three, rock: Rock) {
  const width = 512, height = 256;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = width;
  colorCanvas.height = bumpCanvas.height = height;
  const colorContext = colorCanvas.getContext('2d');
  const bumpContext = bumpCanvas.getContext('2d');
  if (!colorContext || !bumpContext) throw new Error('Rock textures are unavailable.');
  const colorPixels = colorContext.createImageData(width, height);
  const bumpPixels = bumpContext.createImageData(width, height);
  const colors = palette(rock);
  for (let py = 0; py < height; py++) {
    const latitude = (py / (height - 1)) * Math.PI;
    const sine = Math.sin(latitude), y = Math.cos(latitude);
    for (let px = 0; px < width; px++) {
      const longitude = (px / (width - 1) - 0.5) * Math.PI * 2;
      const x = -Math.cos(longitude) * sine, z = Math.sin(longitude) * sine;
      const sample = surface(rock, colors, x, y, z);
      const offset = (py * width + px) * 4;
      colorPixels.data[offset] = sample.color[0];
      colorPixels.data[offset + 1] = sample.color[1];
      colorPixels.data[offset + 2] = sample.color[2];
      colorPixels.data[offset + 3] = 255;
      const bump = Math.round(Math.max(0, Math.min(1, sample.relief)) * 255);
      bumpPixels.data[offset] = bumpPixels.data[offset + 1] = bumpPixels.data[offset + 2] = bump;
      bumpPixels.data[offset + 3] = 255;
    }
  }
  colorContext.putImageData(colorPixels, 0, 0);
  bumpContext.putImageData(bumpPixels, 0, 0);
  const map = new THREE.CanvasTexture(colorCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = bumpMap.wrapS = THREE.RepeatWrapping;
  return { map, bumpMap };
}

function makeSpecimen(THREE: Three, rock: Rock) {
  const seed = rock.seed >>> 0;
  const geometry = new THREE.IcosahedronGeometry(1, 14);
  const positions = geometry.getAttribute('position');
  const isSlate = rock.familyId === 'slate';
  const isAgate = rock.familyId === 'agate';
  const isObsidian = rock.familyId === 'obsidian';
  const stretchX = 1.05 + hash(7, 1, 2, seed) * 0.25;
  const stretchY = isSlate ? 0.47 : isAgate ? 0.84 : 0.84 + hash(3, 8, 2, seed) * 0.22;
  const stretchZ = isSlate ? 0.85 : 0.79 + hash(3, 2, 9, seed) * 0.18;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const broad = noise(x * 2.3 + 4.2, y * 2.3, z * 2.3, seed);
    const medium = noise(x * 6, y * 6, z * 6, seed ^ 0x491be);
    const roughness = isAgate ? 0.025 : isObsidian ? 0.04 : 0.085;
    let radius = 0.84 + broad * 0.3 + (medium - 0.5) * roughness;
    if (rock.familyId === 'pumice') radius -= Math.max(0, noise(x * 20, y * 20, z * 20, seed) - 0.61) * 0.15;
    let px = x * radius * stretchX + y * y * 0.13;
    let py = y * radius * stretchY + x * 0.05;
    let pz = z * radius * stretchZ;
    // Worn broad faces keep the specimen from reading as a decorated sphere.
    py = Math.max(py, -stretchY * 0.79 + px * 0.065);
    if (isSlate) py += Math.sin(x * 4 + z) * 0.018;
    if (isObsidian) {
      px = Math.min(px, 0.92 - py * 0.22);
      pz = Math.max(pz, -0.68 + px * 0.16);
    }
    positions.setXYZ(i, px, py, pz);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  // IcosahedronGeometry duplicates vertices at UV seams. Average coincident
  // normals without merging the UVs, so the entire worn surface stays smooth.
  const normals = geometry.getAttribute('normal');
  const shared = new Map<string, [number, number, number]>();
  const keys: string[] = [];
  for (let i = 0; i < positions.count; i++) {
    const key = `${Math.round(positions.getX(i) * 100000)},${Math.round(positions.getY(i) * 100000)},${Math.round(positions.getZ(i) * 100000)}`;
    keys.push(key);
    const normal = shared.get(key) || [0, 0, 0];
    normal[0] += normals.getX(i);
    normal[1] += normals.getY(i);
    normal[2] += normals.getZ(i);
    shared.set(key, normal);
  }
  for (let i = 0; i < positions.count; i++) {
    const normal = shared.get(keys[i])!;
    const length = Math.hypot(...normal) || 1;
    normals.setXYZ(i, normal[0] / length, normal[1] / length, normal[2] / length);
  }
  normals.needsUpdate = true;
  geometry.computeBoundingSphere();
  let textures: ReturnType<typeof makeTextures>;
  try {
    textures = makeTextures(THREE, rock);
  } catch (error) {
    geometry.dispose();
    throw error;
  }
  const { map, bumpMap } = textures;
  const polished = isAgate || isObsidian || rock.familyId === 'jasper';
  const material = new THREE.MeshPhysicalMaterial({
    map,
    bumpMap,
    bumpScale: isObsidian ? 0.018 : isAgate ? 0.012 : rock.familyId === 'pumice' ? 0.14 : 0.065,
    roughness: isObsidian ? 0.25 : isAgate ? 0.39 : polished ? 0.53 : 0.88,
    metalness: 0,
    clearcoat: isObsidian ? 0.65 : isAgate ? 0.3 : 0,
    clearcoatRoughness: 0.3,
  });
  return new THREE.Mesh(geometry, material);
}

/** Loads Three only when a specimen is opened; there is no idle animation. */
export async function createRockViewer(container: HTMLElement, rock: Rock): Promise<RockViewer> {
  const THREE = await import('three');
  if (!container.isConnected) throw new Error('The specimen display is closed.');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'rock-viewer-canvas';
  Object.assign(canvas.style, { width: '100%', height: '100%', position: 'absolute', inset: '0', touchAction: 'pan-y' });
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) throw new Error('WebGL is unavailable.');
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 20);
  camera.position.set(0, 0.18, 6);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xf9f4e7, 0x65716d, 2.05));
  const key = new THREE.DirectionalLight(0xfff0d6, 3.5);
  key.position.set(-3, 4, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdcebf2, 1.1);
  fill.position.set(3, 0.5, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xf2e8d9, 1.9);
  rim.position.set(0.7, 2, -3);
  scene.add(rim);
  const group = new THREE.Group();
  scene.add(group);
  let specimen: ReturnType<typeof makeSpecimen> | undefined;
  let specimenId: string | undefined;
  let disposed = false, contextLost = false, active = false, frame = 0, intersecting = true;
  let pointer: { id: number; x: number; y: number; lastX: number; lastY: number; mode: 'pending' | 'dragging'; touch: boolean } | undefined;
  const oldTouchAction = container.style.touchAction;
  const oldCursor = container.style.cursor;
  const oldPosition = container.style.position;
  const positionChanged = getComputedStyle(container).position === 'static';

  function releaseSpecimen() {
    if (!specimen) return;
    group.remove(specimen);
    specimen.geometry.dispose();
    specimen.material.map?.dispose();
    specimen.material.bumpMap?.dispose();
    specimen.material.dispose();
    specimen = undefined;
    specimenId = undefined;
  }

  function draw() {
    frame = 0;
    if (disposed || contextLost || !active || !intersecting || document.visibilityState === 'hidden') return;
    renderer.render(scene, camera);
  }

  function requestDraw() {
    if (!disposed && !contextLost && active && !frame && intersecting && document.visibilityState !== 'hidden') frame = requestAnimationFrame(draw);
  }

  function resize() {
    if (disposed || contextLost) return;
    const { width, height } = container.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const aspect = width / height;
    const halfHeight = Math.max(1.52, 1.56 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(Math.round(width), Math.round(height), false);
    requestDraw();
  }

  function setRock(nextRock: Rock) {
    if (disposed || (specimen && specimenId === nextRock.id)) return;
    const nextSpecimen = makeSpecimen(THREE, nextRock);
    releaseSpecimen();
    specimen = nextSpecimen;
    specimenId = nextRock.id;
    group.add(specimen);
    group.rotation.set(-0.12, 0.24 + hash(1, 9, 5, nextRock.seed) * 0.55, -0.065);
    requestDraw();
  }

  function endPointer(event?: PointerEvent) {
    if (event && pointer && event.pointerId !== pointer.id) return;
    if (pointer && container.hasPointerCapture(pointer.id)) container.releasePointerCapture(pointer.id);
    pointer = undefined;
    container.style.cursor = 'grab';
  }

  function down(event: PointerEvent) {
    if (disposed || contextLost || !event.isPrimary || event.button !== 0) return;
    const touch = event.pointerType === 'touch';
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, mode: touch ? 'pending' : 'dragging', touch };
    if (!touch) container.setPointerCapture(event.pointerId);
    container.style.cursor = touch ? 'grab' : 'grabbing';
  }

  function move(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (pointer.mode === 'pending') {
      if (Math.abs(dy) > 7 && Math.abs(dy) > Math.abs(dx)) { endPointer(event); return; }
      if (Math.abs(dx) < 5 || Math.abs(dx) < Math.abs(dy)) return;
      pointer.mode = 'dragging';
      container.setPointerCapture(event.pointerId);
      container.style.cursor = 'grabbing';
    }
    if (event.cancelable) event.preventDefault();
    group.rotation.y += (event.clientX - pointer.lastX) * 0.011;
    if (!pointer.touch) group.rotation.x = Math.max(-0.9, Math.min(0.9, group.rotation.x + (event.clientY - pointer.lastY) * 0.006));
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    requestDraw();
  }

  function lost(event: Event) {
    event.preventDefault();
    contextLost = true;
    container.dataset.viewerReady = 'false';
    container.dispatchEvent(new CustomEvent('rock-viewer-status', {detail:{available:false}}));
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    endPointer();
  }

  function restored() {
    if (disposed) return;
    contextLost = false;
    resize();
    renderer.render(scene, camera);
    container.dataset.viewerReady = 'true';
    container.dispatchEvent(new CustomEvent('rock-viewer-status', {detail:{available:true}}));
  }

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(entries => {
    intersecting = entries[0]?.isIntersecting ?? true;
    if (intersecting) requestDraw();
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    endPointer();
    resizeObserver.disconnect();
    intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', requestDraw);
    container.removeEventListener('pointerdown', down);
    container.removeEventListener('pointermove', move);
    container.removeEventListener('pointerup', endPointer);
    container.removeEventListener('pointercancel', endPointer);
    container.removeEventListener('lostpointercapture', endPointer);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
    releaseSpecimen();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    container.style.touchAction = oldTouchAction;
    container.style.cursor = oldCursor;
    if (positionChanged) container.style.position = oldPosition;
    container.dataset.viewerReady = 'false';
  }

  try {
    setRock(rock);
    if (positionChanged) container.style.position = 'relative';
    container.style.touchAction = 'pan-y';
    container.style.cursor = 'grab';
    container.append(canvas);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    resize();
    // Three's async compiler can keep polling after context loss. Preparation
    // here is bounded, and the existing checks preserve the illustrated fallback.
    renderer.compile(scene, camera);
    if (!container.isConnected || contextLost || context.isContextLost()) throw new Error('The specimen display is unavailable.');
    renderer.render(scene, camera);
    active = true;
    container.dataset.viewerReady = 'true';
    resizeObserver.observe(container);
    intersectionObserver?.observe(container);
    document.addEventListener('visibilitychange', requestDraw);
    container.addEventListener('pointerdown', down);
    container.addEventListener('pointermove', move, { passive: false });
    container.addEventListener('pointerup', endPointer);
    container.addEventListener('pointercancel', endPointer);
    container.addEventListener('lostpointercapture', endPointer);
    return {
      setRock,
      turn(direction: number) { if (!disposed) { group.rotation.y += Math.sign(direction) * Math.PI / 5; requestDraw(); } },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
