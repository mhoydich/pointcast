import * as THREE from './vendor/three.module.min.js';

// Original, bounded sculpture grammars. No renderer, network request, or global cache.
// Every model owns its resources; wave() takes elapsed seconds.
export function createCatModel(design = {}) {
  const family = design.family || 'classic';
  const index = Math.abs(Math.trunc(Number(design.index) || 0)) % (family === 'master' ? 6 : 8);
  const group = new THREE.Group();
  const sculpture = new THREE.Group();
  group.add(sculpture);
  group.name = 'Lucky Cat ' + (design.id || family);
  group.userData.designId = design.id || null;
  group.userData.family = family;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const motions = [];
  let paw;
  let disposed = false;

  const color = new THREE.Color(design.color || '#ffe4b0');
  const accentColor = new THREE.Color(design.accent || '#ee9c89');
  const shade = (value, factor) => new THREE.Color(value).multiplyScalar(factor);
  const makeMaterial = (value, options = {}) => {
    const material = new THREE.MeshPhysicalMaterial({
      color: value, roughness: 0.55, metalness: 0.02, ...options,
    });
    materials.add(material);
    return material;
  };
  const body = makeMaterial(color, family === 'wire'
    ? { roughness: 0.35, metalness: 0.72 }
    : family === 'stone' ? { roughness: 0.92, metalness: 0 }
    : family === 'kiln' ? { roughness: index % 3 === 0 ? 0.74 : 0.29, clearcoat: index % 3 === 0 ? 0.12 : 0.72, clearcoatRoughness: 0.18 }
    : family === 'classic' ? { roughness: 0.43, metalness: 0.08 }
    : { roughness: 0.43, clearcoat: 0.25 });
  const accent = makeMaterial(accentColor, { roughness: 0.45, metalness: family === 'wire' ? 0.5 : 0.03 });
  const faceOnPorcelain = family === 'wire' || (family === 'master' && (index === 1 || index === 4));
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  const ink = makeMaterial(!faceOnPorcelain && luminance < 0.18 ? '#f4e9d0' : '#26392e', { roughness: 0.82, metalness: 0 });
  const gold = makeMaterial('#efca69', { roughness: 0.28, metalness: 0.66 });
  const rim = makeMaterial('#ac8338', { roughness: 0.45, metalness: 0.5 });
  const porcelain = makeMaterial('#f4e9d0', { roughness: 0.55, clearcoat: 0.35 });
  const pink = makeMaterial('#ef9994', { roughness: 0.58 });
  const coral = makeMaterial('#d85d51', { roughness: 0.43 });
  const finish = String(design.material || '').toLowerCase();
  if (family !== 'classic') {
    if (/porcelain|glaze|celadon|enamel/.test(finish)) { body.clearcoat = 0.7; body.roughness = 0.28; }
    if (/basalt|granite|stone|chalk|matte|clay/.test(finish)) { body.clearcoat = 0; body.roughness = 0.85; }
    if (/copper|brass|bronze|silver|gold|metal/.test(finish)) { body.metalness = 0.72; body.roughness = 0.34; }
  }
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  geometries.add(sphere);

  function mesh(geometry, material, position = [0, 0, 0], scale = [1, 1, 1], parent = sculpture) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.scale.set(...scale);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function ball(material, position, scale, parent = sculpture) {
    return mesh(sphere, material, position, scale, parent);
  }
  function tube(points, material, radius = 0.02, parent = sculpture, closed = false) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)), closed, 'centripetal');
    return mesh(new THREE.TubeGeometry(curve, Math.max(10, points.length * 4), radius, 6, closed), material, [0, 0, 0], [1, 1, 1], parent);
  }
  function rod(a, b, material, radius = 0.02, parent = sculpture) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const object = mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material, start.clone().add(end).multiplyScalar(0.5).toArray(), [1, 1, 1], parent);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return object;
  }
  function torus(radius, thickness, material, position, scale = [1, 1, 1], parent = sculpture, arc = Math.PI * 2) {
    return mesh(new THREE.TorusGeometry(radius, thickness, 8, 48, arc), material, position, scale, parent);
  }
  function roundedRectangle(width, height, radius) {
    const x = -width / 2;
    const y = -height / 2;
    const r = Math.min(radius, width / 3, height / 3);
    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }
  function block(width, height, depth, material, position, parent = sculpture, bevel = 0.035) {
    const shape = roundedRectangle(width - bevel * 2, height - bevel * 2, 0.08);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 5, steps: 1 });
    geometry.translate(0, 0, -(depth - bevel * 2) / 2);
    return mesh(geometry, material, position, [1, 1, 1], parent);
  }
  function pedestal(material = body, style = 'round') {
    if (style === 'steps') {
      block(1.76, 0.1, 1.25, material, [0, 0.05, 0]);
      block(1.48, 0.12, 1.05, accent, [0, 0.15, 0]);
    } else if (style === 'square') {
      block(1.65, 0.12, 1.15, material, [0, 0.05, 0]);
    } else {
      mesh(new THREE.CylinderGeometry(0.78, 0.84, 0.12, 40), material, [0, 0.05, 0], [1, 1, 0.75]);
    }
  }
  function ear(x, y, z, width, height, material = body, innerMaterial = accent, wire = false) {
    const lean = x < 0 ? 0.12 : -0.12;
    const points = [[x - width / 2, y - height / 2, z], [x + lean, y + height / 2, z], [x + width / 2, y - height / 2, z], [x - width / 2, y - height / 2, z]];
    if (wire) {
      tube(points, material, 0.028);
      tube(points.map(([a, b, c]) => [a * 0.94, b, c - 0.16]), material, 0.025);
      rod(points[0], [points[0][0] * 0.94, points[0][1], z - 0.16], material, 0.018);
      return;
    }
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(lean, height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.025, bevelSegments: 2, steps: 1 });
    geometry.translate(0, 0, -0.1);
    mesh(geometry, material, [x, y, z]);
    const innerShape = new THREE.Shape();
    innerShape.moveTo(-width * 0.28, -height * 0.29);
    innerShape.lineTo(lean * 0.7, height * 0.27);
    innerShape.lineTo(width * 0.28, -height * 0.29);
    innerShape.closePath();
    mesh(new THREE.ShapeGeometry(innerShape), innerMaterial, [x, y + 0.025, z + 0.139]);
  }
  function face(y = 2.04, z = 0.59, width = 0.84, cheeks = true, curved = true) {
    const surface = x => curved ? z * Math.sqrt(Math.max(0.3, 1 - (x / width) ** 2)) + 0.016 : z + 0.016;
    const eyes = width * 0.4;
    for (const x of [-eyes, eyes]) {
      const points = [[x - 0.14, y + 0.08, surface(x - 0.14)], [x - 0.07, y + 0.14, surface(x - 0.07)], [x, y + 0.155, surface(x)], [x + 0.07, y + 0.14, surface(x + 0.07)], [x + 0.14, y + 0.08, surface(x + 0.14)]];
      tube(points, ink, 0.028);
      if (cheeks) ball(pink, [x * 1.55, y - 0.14, surface(x * 1.55) - 0.035], [0.14, 0.075, 0.04]);
    }
    ball(pink, [0, y - 0.10, z + 0.025], [0.068, 0.04, 0.025]);
    tube([[0, y - 0.10, z + 0.04], [0, y - 0.19, z + 0.042], [-0.09, y - 0.23, z + 0.034], [-0.18, y - 0.19, surface(-0.18)]], ink, 0.02);
    tube([[0, y - 0.19, z + 0.042], [0.09, y - 0.23, z + 0.034], [0.18, y - 0.19, surface(0.18)]], ink, 0.02);
  }
  function head({ y = 2.07, sx = 0.87, sy = 0.68, sz = 0.58, material = body, earsMaterial = material, wire = false, box = false, cheeks = true } = {}) {
    if (wire) {
      cage([0, y, 0], [sx, sy, sz], material, 8, index % 2 ? 0.2 : 0, 0.018);
      // The opaque face medallion sits ahead of every cage rib, preserving
      // a clean expression while the surrounding shell stays transparent.
      ball(porcelain, [0, y - 0.045, sz + 0.07], [sx * 0.76, sy * 0.66, 0.07]);
      face(y, sz + 0.12, sx * 0.91, false, false);
    } else if (box) {
      block(sx * 2, sy * 2, sz * 2, material, [0, y, 0]);
      face(y, sz, sx, cheeks, false);
    } else {
      ball(material, [0, y, 0], [sx, sy, sz]);
      face(y, sz, sx, cheeks);
    }
    const ew = 0.44 + (index % 3) * 0.045;
    const eh = 0.61 + (index % 2) * 0.06;
    for (const side of [-1, 1]) ear(side * sx * 0.68, y + sy * 0.73, -0.005, ew, eh, earsMaterial, wire ? accent : pink, wire);
  }
  function feet(material = body, box = false, y = 0.23) {
    for (const side of [-1, 1]) {
      if (box) block(0.48, 0.26, 0.61, material, [side * 0.42, y, 0.19]);
      else ball(material, [side * 0.43, y, 0.21], [0.29, 0.22, 0.36]);
    }
  }
  function paws(material = body, kind = 'soft', x = 0.76, y = 1.01) {
    paw = new THREE.Group();
    paw.position.set(x, y, 0.03);
    sculpture.add(paw);
    if (kind === 'wire') {
      rod([0, 0, 0], [0.08, 0.79, 0], material, 0.045, paw);
      torus(0.18, 0.036, material, [0.08, 0.93, 0.03], [1, 1.14, 0.75], paw);
      for (const dx of [-0.08, 0, 0.08]) rod([0.08 + dx, 1.03, 0.025], [0.08 + dx, 1.12, 0.025], accent, 0.016, paw);
      rod([-0.7, 0.8, 0], [-0.53, 0.54, 0.25], material, 0.065);
    } else if (kind === 'block') {
      block(0.29, 0.79, 0.33, material, [0.035, 0.42, 0], paw);
      block(0.41, 0.38, 0.39, material, [0.045, 0.94, 0.025], paw);
      block(0.17, 0.15, 0.03, accent, [0.045, 0.93, 0.238], paw, 0.009);
      block(0.29, 0.62, 0.32, accent, [-0.66, 0.76, 0.15]).rotation.z = -0.35;
    } else {
      ball(material, [0.04, 0.44, 0], [0.2, 0.53, 0.2], paw).rotation.z = -0.12;
      ball(material, [0.10, 0.93, 0.025], [0.24, 0.25, 0.22], paw);
      ball(family === 'classic' ? pink : accent, [0.10, 0.94, 0.246], [0.09, 0.09, 0.015], paw);
      for (const dx of [-0.085, 0, 0.085]) ball(family === 'classic' ? pink : accent, [0.10 + dx, 1.067, 0.204], [0.027, 0.04, 0.016], paw);
      ball(material, [-0.66, 0.77, 0.15], [0.22, 0.4, 0.22]).rotation.z = -0.48;
    }
  }
  function collar(material = coral, bell = true) {
    const object = torus(0.53, 0.054, material, [0, 1.53, 0], [1.21, 1, 0.9]);
    object.rotation.x = Math.PI / 2;
    if (bell) {
      ball(gold, [0, 1.48, 0.55], [0.13, 0.13, 0.12]);
      tube([[0, 1.49, 0.675], [0, 1.41, 0.664]], ink, 0.012);
    }
  }
  function token(parent = sculpture, position = [0, 0.72, 0.57], radius = 0.4, material = gold, symbol = false) {
    const tokenGroup = new THREE.Group();
    tokenGroup.position.set(...position);
    parent.add(tokenGroup);
    const disc = mesh(new THREE.CylinderGeometry(radius, radius, 0.095, 40), material, [0, 0, 0], [1, 1, 1], tokenGroup);
    disc.rotation.x = Math.PI / 2;
    torus(radius * 0.9, Math.max(0.009, radius * 0.032), rim, [0, 0, 0.052], [1, 1, 1], tokenGroup);
    if (symbol && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#26392e';
        context.font = 'bold 88px serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('福', 64, 66);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.add(texture);
        const label = makeMaterial('#ffffff', { map: texture, transparent: true, roughness: 0.6, depthWrite: false });
        mesh(new THREE.PlaneGeometry(radius * 1.35, radius * 1.35), label, [0, 0, 0.055], [1, 1, 1], tokenGroup);
      }
    } else {
      // A geometric four-petal seal is original and legible without a font.
      for (let n = 0; n < 4; n++) {
        const angle = n * Math.PI / 2;
        const petal = ball(accent, [Math.cos(angle) * radius * 0.32, Math.sin(angle) * radius * 0.32, 0.056], [radius * 0.11, radius * 0.24, 0.018], tokenGroup);
        petal.rotation.z = angle - Math.PI / 2;
      }
    }
    return tokenGroup;
  }
  function tail(material = body, type = 'curve') {
    if (type === 'ring') {
      torus(0.28, 0.065, material, [-0.75, 0.65, -0.34], [0.9, 1.3, 0.85]);
    } else {
      tube([[-0.36, 0.44, -0.37], [-0.80, 0.46, -0.28], [-0.92, 0.81, -0.23], [-0.79, 1.09 + index * 0.015, -0.19]], material, type === 'wire' ? 0.027 : 0.075);
    }
  }
  function surfaceNoise(material, seed, strength = 0.025) {
    const size = 48;
    const pixels = new Uint8Array(size * size * 4);
    let random = (seed + 1) * 7919;
    for (let n = 0; n < pixels.length; n += 4) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const value = 150 + (random >>> 27) * 3;
      pixels[n] = pixels[n + 1] = pixels[n + 2] = value;
      pixels[n + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.repeat.set(3, 3);
    texture.needsUpdate = true;
    textures.add(texture);
    material.bumpMap = texture;
    material.bumpScale = strength;
    material.roughnessMap = texture;
  }
  function cage(center, radii, material, count, twist = 0, thickness = 0.022) {
    for (let n = 0; n < count; n++) {
      const points = [];
      for (let step = 0; step <= 12; step++) {
        const theta = Math.PI * step / 12;
        const angle = n * Math.PI * 2 / count + twist * Math.sin(theta) * Math.cos(theta);
        points.push([center[0] + Math.sin(theta) * Math.cos(angle) * radii[0], center[1] - Math.cos(theta) * radii[1], center[2] + Math.sin(theta) * Math.sin(angle) * radii[2]]);
      }
      tube(points, material, thickness);
    }
    for (const step of [0.28, 0.5, 0.72]) {
      const theta = Math.PI * step;
      const ring = torus(Math.sin(theta), thickness, material, [center[0], center[1] - Math.cos(theta) * radii[1], center[2]], [radii[0], radii[2], 1]);
      ring.rotation.x = Math.PI / 2;
    }
  }
  function pendant(anchor, length, radius, material = gold, type = 0) {
    const pivot = new THREE.Group();
    pivot.position.set(...anchor);
    sculpture.add(pivot);
    rod([0, 0, 0], [0, -length, 0], rim, 0.012, pivot);
    if (type % 3 === 0) token(pivot, [0, -length, 0], radius, material);
    else if (type % 3 === 1) {
      const petal = mesh(new THREE.OctahedronGeometry(radius), material, [0, -length, 0], [1, 1.45, 0.28], pivot);
      petal.rotation.z = 0.25;
    } else torus(radius * 0.86, radius * 0.16, material, [0, -length, 0], [1, 1.15, 0.7], pivot, Math.PI * 1.68).rotation.z = 0.5;
    motions.push({ object: pivot, type: 'pendant', phase: motions.length * 1.7, base: 0 });
    return pivot;
  }
  function classic() {
    ball(body, [0, 1.02, 0], [0.73, 0.91, 0.55]);
    head();
    paws();
    feet();
    collar();
    token(sculpture, [0, 0.71, 0.62], 0.44, gold, true);
  }
  function kiln() {
    const waist = [0.65, 0.60, 0.70, 0.62, 0.72, 0.60, 0.69, 0.63][index];
    const points = [new THREE.Vector2(0.35, 0.11), new THREE.Vector2(0.5, 0.15), new THREE.Vector2(waist, 0.39), new THREE.Vector2(waist + 0.05, 0.71), new THREE.Vector2(waist, 1.01), new THREE.Vector2(0.51, 1.30), new THREE.Vector2(0.43 + index % 3 * 0.035, 1.52)];
    // Grooves are part of the profile, so the ceramic has actual recessed rings.
    for (let n = 0; n < 2 + index % 3; n++) {
      const y = 0.57 + n * 0.14;
      const r = waist + 0.025;
      points.push(new THREE.Vector2(r, y - 0.014), new THREE.Vector2(r - 0.028, y), new THREE.Vector2(r, y + 0.014));
    }
    points.sort((a, b) => a.y - b.y);
    mesh(new THREE.LatheGeometry(points, 48), body, [0, 0, 0], [index % 2 ? 1.02 : 0.97, 1, 0.78]);
    head({ sx: 0.81 + index % 3 * 0.025, sy: 0.65 + index % 2 * 0.035, material: body });
    paws(body, 'soft', 0.72 + index % 2 * 0.04);
    feet();
    collar(accent, index % 2 === 0);
    token(sculpture, [index % 2 ? -0.05 : 0.05, 0.83, 0.61], 0.32 + index % 3 * 0.025, gold);
    tail(body, index % 2 ? 'ring' : 'curve');
    pedestal(body);
    surfaceNoise(body, index, 0.011);
    const incisions = makeMaterial(shade(color, 0.55), { roughness: 0.75 });
    for (let n = 0; n < 3 + index % 3; n++) {
      const angle = -0.92 + n * 0.34;
      tube([[Math.sin(angle) * 0.58, 0.37, Math.cos(angle) * 0.40], [Math.sin(angle) * 0.70, 0.74, Math.cos(angle) * 0.545], [Math.sin(angle) * 0.57, 1.16, Math.cos(angle) * 0.425]], incisions, 0.008);
    }
  }
  function blockParty() {
    pedestal(accent, index % 2 ? 'steps' : 'square');
    const offset = index % 2 ? 0.105 : 0;
    if (index === 2 || index === 6) {
      for (let n = 0; n < 3; n++) mesh(new THREE.CylinderGeometry(0.62 - n * 0.04, 0.67 - n * 0.04, 0.38, index === 2 ? 8 : 4), n % 2 ? accent : body, [Math.sin(n * 1.2) * offset, 0.43 + n * 0.36, 0], [1, 1, 0.8]).rotation.y = n * 0.22;
    } else if (index === 3 || index === 7) {
      block(0.33, 1.15, 0.73, body, [-0.42, 0.86, 0]);
      block(0.33, 1.15, 0.73, accent, [0.42, 0.86, 0]);
      block(1.18, 0.3, 0.73, body, [0, 1.30, 0]);
      if (index === 7) block(0.18, 0.85, 0.5, porcelain, [0, 0.79, -0.12]);
    } else {
      block(1.26, 0.61, 0.86, body, [-offset, 0.61, 0]).rotation.z = index === 4 ? 0.09 : 0;
      block(1.08, 0.62, 0.77, accent, [offset, 1.13, 0]).rotation.z = index === 5 ? -0.12 : 0;
    }
    head({ sx: 0.77 + index % 3 * 0.025, sy: 0.51 + index % 2 * 0.05, sz: 0.46, box: true, y: 2.02, cheeks: false });
    paws(body, 'block', 0.78, 0.96);
    feet(accent, true, 0.31);
    const coin = token(sculpture, [offset, 0.82, 0.51], 0.31, gold);
    coin.rotation.z = (index % 3 - 1) * 0.12;
    const stripes = 2 + index % 3;
    for (let n = 0; n < stripes; n++) block(0.095, 0.24 + n % 2 * 0.04, 0.025, porcelain, [-0.26 + n * 0.19, 1.24, 0.448], sculpture, 0.005);
    block(0.15, 0.69, 0.19, accent, [-0.75, 0.72, -0.33]).rotation.z = -0.24 - index % 3 * 0.12;
  }
  function stone(master = false) {
    surfaceNoise(body, index + 20, 0.026);
    const openRing = torus(0.52 + index % 3 * 0.02, 0.215 - index % 2 * 0.015, body, [0, 0.93, 0], [1.04 + index % 2 * 0.05, 1.42 - index % 3 * 0.05, 0.82], sculpture, index === 3 ? Math.PI * 1.83 : Math.PI * 2);
    openRing.rotation.z = (index % 3 - 1) * 0.055;
    head({ sx: 0.81, sy: 0.66, material: body, cheeks: false });
    paws(body, 'soft', 0.74);
    feet(body);
    tail(body, index % 2 ? 'ring' : 'curve');
    pedestal(accent);
    rod([0, 1.52, 0.04], [0, 0.94, 0.04], rim, 0.012);
    token(sculpture, [0, 0.91, 0.13], 0.17 + index % 3 * 0.02, gold);
    if (index === 4 || index === 6) torus(0.33, 0.03, accent, [0, 0.93, 0.19], [1, 1.3, 1]);
    if (master) {
      torus(0.79, 0.028, gold, [0, 2.07, -0.2], [1, 1.05, 1]);
      const pearl = ball(ink, [0, 0.92, 0.05], [0.15, 0.15, 0.15]);
      motions.push({ object: pearl, type: 'spin', phase: 0, base: 0 });
    }
  }
  function wire(lantern = false) {
    const ribCount = [8, 10, 12, 9, 11, 8, 12, 10][index];
    cage([0, 0.92, 0], [0.67 + index % 3 * 0.025, 0.8 + index % 2 * 0.02, 0.52], body, ribCount, (index % 4 - 1) * 0.38);
    head({ material: body, wire: true, sx: 0.85, sy: 0.63, sz: 0.58 });
    paws(body, 'wire', 0.79, 1.01);
    for (const side of [-1, 1]) torus(0.24, 0.037, body, [side * 0.43, 0.21, 0.18], [1, 0.68, 1]).rotation.x = Math.PI / 2;
    tail(accent, 'wire');
    pedestal(accent);
    const seedMaterial = lantern ? makeMaterial(accentColor, { roughness: 0.42, emissive: accentColor, emissiveIntensity: 0.7 }) : accent;
    const seed = mesh(index % 2 ? new THREE.OctahedronGeometry(0.23) : new THREE.IcosahedronGeometry(0.22, 1), seedMaterial, [0, 0.95, 0], [1, 1.4 + index % 3 * 0.1, 1]);
    motions.push({ object: seed, type: 'spin', phase: index, base: 0 });
    if (lantern) {
      const glow = makeMaterial('#ffe0a0', { transparent: true, opacity: 0.42, roughness: 0.55, emissive: '#ffbd54', emissiveIntensity: 0.2, depthWrite: false });
      ball(glow, [0, 0.93, 0], [0.48, 0.66, 0.36]);
      torus(0.74, 0.036, gold, [0, 2.08, -0.14], [1, 1, 1]);
    }
    token(sculpture, [0, 0.69, 0.49], 0.235, gold);
  }
  function balance(solstice = false) {
    ball(body, [0, 1.00, 0], [0.57 + index % 3 * 0.035, 0.86, 0.44]);
    head({ sx: 0.80, sy: 0.64, sz: 0.54, cheeks: false });
    paws(body, 'soft', 0.69, 1.04);
    feet(body);
    pedestal(accent, index % 2 ? 'steps' : 'round');
    collar(accent, false);
    tail(rim, 'wire');
    pendant([0, 1.49, 0.50], 0.58 - index % 3 * 0.05, 0.29, gold, 0);
    const anchor = [-0.69, 1.82 + index % 3 * 0.12, -0.1];
    rod([-0.58, 0.49, -0.15], anchor, rim, 0.035);
    rod(anchor, [-0.98, anchor[1] - 0.05, 0], gold, 0.02);
    pendant([-0.98, anchor[1] - 0.05, 0], 0.31 + index % 2 * 0.12, 0.14 + index % 3 * 0.015, accent, index % 3);
    if (index >= 4 || solstice) {
      rod([-0.55, 2.48, -0.27], [0.69, 2.57, -0.27], rim, 0.018);
      pendant([-0.48, 2.48, -0.22], 0.28, 0.14, gold, index % 3);
      pendant([0.66, 2.57, -0.22], 0.38, 0.11, accent, (index + 1) % 3);
    }
    if (solstice) {
      torus(0.54, 0.026, gold, [0, 0.93, 0.12], [1, 1.25, 1]);
      torus(0.86, 0.032, rim, [0, 2.05, -0.28], [1, 1, 1], sculpture, Math.PI * 1.66).rotation.z = 0.45;
    }
  }
  function colorField() {
    const width = 0.59 + index % 3 * 0.045;
    ball(body, [0, 1.00, 0], [width, 0.86 + index % 2 * 0.03, 0.47]);
    head({ sx: 0.81, sy: 0.64 + index % 2 * 0.02, sz: 0.56, cheeks: false });
    paws(body, index === 3 || index === 7 ? 'block' : 'soft', 0.74);
    feet(accent);
    pedestal(porcelain, index % 2 ? 'square' : 'round');
    collar(accent, false);
    tail(accent, index % 2 ? 'ring' : 'curve');
    const third = makeMaterial(color.clone().lerp(new THREE.Color('#f5edd4'), 0.64), { roughness: 0.55 });
    for (let n = 0; n < 3 + index % 2; n++) {
      const radius = 0.49 - n * 0.105;
      const material = [accent, porcelain, third, gold][n];
      const x = (index % 3 - 1) * n * 0.022;
      const y = 0.92 + (index % 2 ? n * 0.022 : 0);
      if (index % 2) {
        const shape = roundedRectangle(radius * 2, radius * 2.4, 0.15);
        const hole = new THREE.Path();
        hole.absellipse(0, 0, radius * 0.72, radius * 0.94, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 1, curveSegments: 20, steps: 1 });
        const frame = mesh(geometry, material, [x, y, 0.39 + n * 0.038]);
        frame.rotation.z = (index === 3 ? 0.055 : -0.04) * n;
      } else torus(radius, 0.052, material, [x, y, 0.41 + n * 0.039], [1, 1.23 - index % 3 * 0.045, 1]);
    }
    token(sculpture, [0, 0.92, 0.58], 0.14, gold);
  }
  function tideTemple() {
    body.roughness = 0.26;
    body.clearcoat = 0.75;
    surfaceNoise(body, 83, 0.008);
    pedestal(accent, 'steps');
    const gate = new THREE.Shape();
    gate.moveTo(-0.67, 0.25);
    gate.lineTo(-0.67, 1.02);
    gate.bezierCurveTo(-0.67, 1.48, -0.31, 1.65, 0, 1.65);
    gate.bezierCurveTo(0.31, 1.65, 0.67, 1.48, 0.67, 1.02);
    gate.lineTo(0.67, 0.25);
    gate.closePath();
    const voidPath = new THREE.Path();
    voidPath.moveTo(-0.34, 0.43);
    voidPath.lineTo(0.34, 0.43);
    voidPath.lineTo(0.34, 0.99);
    voidPath.bezierCurveTo(0.34, 1.31, -0.34, 1.31, -0.34, 0.99);
    voidPath.closePath();
    gate.holes.push(voidPath);
    const geometry = new THREE.ExtrudeGeometry(gate, { depth: 0.53, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 2, curveSegments: 22, steps: 1 });
    geometry.translate(0, 0, -0.265);
    mesh(geometry, body);
    head({ material: body, sx: 0.84, sy: 0.66, cheeks: false });
    paws(body, 'soft', 0.74, 1.02);
    feet(body, false, 0.33);
    for (const side of [-1, 1]) for (let n = 0; n < 3; n++) block(0.30, 0.035, 0.025, accent, [side * 0.5, 0.68 + n * 0.17, 0.302], sculpture, 0.005);
    rod([0, 1.49, 0.04], [0, 0.95, 0.04], rim, 0.012);
    token(sculpture, [0, 0.92, 0.09], 0.21, gold);
    tail(body, 'ring');
  }
  function orbit() {
    ball(porcelain, [0, 1.03, 0], [0.55, 0.86, 0.43]);
    head({ material: porcelain, sx: 0.82, sy: 0.64, cheeks: false });
    paws(porcelain, 'soft', 0.73);
    feet(porcelain);
    pedestal(body);
    for (let n = 0; n < 3; n++) {
      const ring = torus(0.72 + n * 0.07, 0.025, n % 2 ? accent : gold, [0, 0.96, 0], [1, 1.09, 1]);
      ring.rotation.set(n * 0.48, (n - 1) * 0.77, n * 0.32);
      motions.push({ object: ring, type: 'orbit', phase: n * 1.8, base: ring.rotation.y });
    }
    const kernel = mesh(new THREE.IcosahedronGeometry(0.22, 1), accent, [0, 0.9, 0.59]);
    motions.push({ object: kernel, type: 'spin', phase: 1, base: 0 });
    token(sculpture, [0, 0.9, 0.79], 0.15, gold);
    tail(body, 'ring');
  }
  function goodFortune() {
    body.roughness = 0.28;
    body.clearcoat = 0.85;
    ball(body, [0, 1.0, 0], [0.74, 0.87, 0.53]);
    head({ material: body, sx: 0.90, sy: 0.68, earsMaterial: gold });
    paws(body, 'soft', 0.79, 1.03);
    feet(body);
    pedestal(accent, 'steps');
    collar(gold);
    torus(0.51, 0.073, accent, [0, 0.78, 0.48], [1, 1, 1]);
    token(sculpture, [0, 0.78, 0.65], 0.36, gold, true);
    for (let n = 0; n < 7; n++) {
      const angle = n * Math.PI * 2 / 7;
      const petal = ball(n % 2 ? accent : gold, [Math.cos(angle) * 0.43, 0.78 + Math.sin(angle) * 0.43, 0.55], [0.10, 0.20, 0.055]);
      petal.rotation.z = angle - Math.PI / 2;
    }
    torus(0.82, 0.023, gold, [0, 2.06, -0.23], [1, 1.04, 1], sculpture, Math.PI * 1.5).rotation.z = 0.8;
    tail(gold, 'ring');
  }

  if (family === 'master') {
    [() => stone(true), () => wire(true), () => balance(true), tideTemple, orbit, goodFortune][index]();
  } else {
    ({ classic, kiln, block: blockParty, stone, wire, balance, color: colorField }[family] || classic)();
  }

  // Neutral-pose bounding box: all catalog pieces share a display scale and ground.
  sculpture.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(sculpture);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = Math.min(2.2 / Math.max(size.x, 0.01), 3 / Math.max(size.y, 0.01));
  sculpture.scale.setScalar(scale);
  sculpture.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  group.userData.modelSize = [size.x * scale, size.y * scale, size.z * scale];

  return {
    group,
    wave(t, excited = false, reducedMotion = false) {
      if (disposed) return;
      const seconds = Number.isFinite(t) ? t : 0;
      if (paw) paw.rotation.z = reducedMotion ? -0.06 : -0.06 + Math.sin(seconds * (excited ? 12 : 2.3)) * (excited ? 0.23 : 0.09);
      sculpture.rotation.z = reducedMotion || !excited ? 0 : Math.sin(seconds * 8) * 0.008;
      for (const motion of motions) {
        if (motion.type === 'pendant') motion.object.rotation.z = reducedMotion ? motion.base : motion.base + Math.sin(seconds * 1.3 + motion.phase) * 0.065;
        if (motion.type === 'spin') motion.object.rotation.y = reducedMotion ? motion.base : motion.base + Math.sin(seconds * 0.55 + motion.phase) * 0.45;
        if (motion.type === 'orbit') motion.object.rotation.y = reducedMotion ? motion.base : motion.base + Math.sin(seconds * 0.45 + motion.phase) * 0.12;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      group.clear();
      geometries.clear();
      materials.clear();
      textures.clear();
      motions.length = 0;
    },
  };
}
