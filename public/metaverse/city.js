/* Orthographic architectural study. World y is up and the lot plane is x/z. */
window.LoomCityLayout = {
  lotHalf: 13.8,
  plinthHeight: .78,
  initialYaw: .64,
  initialPitch: .56,
  sites: [
    [-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5],
    [-1.5, -.5], [.5, 1.5], [-.5, -1.5], [1.5, .5],
    [-1.5, .5], [-.5, 1.5], [.5, -1.5], [1.5, -.5]
  ].map(([x, z]) => [x * 31, z * 31])
};
window.LoomCity = function LoomCity(canvas, onSelect) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { select() {}, zoom() {}, reset() {}, rotate() {} };

  const { initialYaw, initialPitch, lotHalf, plinthHeight, sites } = window.LoomCityLayout;
  const buildings = window.LoomBuildings || [];
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  const lots = buildings.slice(0, sites.length).map((building, index) => {
    const [x, z] = sites[index];
    const model = window.LoomModel(building.model || building.id || building.name || building.title, index);
    const faces = model.faces.map(face => ({
      ...face,
      normal: faceNormal(face.vertices),
      vertices: face.vertices.map(([px, y, pz]) => [px + x, y + plinthHeight, pz + z])
    }));
    const shadow = hull(faces.flatMap(face => (
      face.shadow === false ? [] : face.vertices.map(([px, y, pz]) => [px + y * .62, pz - y * .44])
    ))).map(([px, pz]) => [px, plinthHeight + .01, pz]);
    return { index, x, z, faces, shadow };
  });

  let width = 0, height = 0, pixelRatio = 1;
  let yaw = initialYaw, pitch = initialPitch, magnification = 1;
  let transform, size, centerX, centerY;
  let active = 0, hover = -1, markerHits = [], faceHits = [];
  let pending = false, drag = null;

  function hull(points) {
    if (points.length < 3) return points;
    const sorted = points.slice().sort(([ax, az], [bx, bz]) => ax - bx || az - bz);
    const edge = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    function chain(sequence) {
      const result = [];
      for (const point of sequence) {
        while (result.length > 1 && edge(result.at(-2), result.at(-1), point) <= 0) result.pop();
        result.push(point);
      }
      result.pop();
      return result;
    }
    return chain(sorted).concat(chain(sorted.reverse()));
  }

  function faceNormal(vertices) {
    const [a, b, c] = vertices;
    const u = b.map((value, index) => value - a[index]);
    const v = c.map((value, index) => value - a[index]);
    const x = u[1] * v[2] - u[2] * v[1];
    const y = u[2] * v[0] - u[0] * v[2];
    const z = u[0] * v[1] - u[1] * v[0];
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function litColor(color, normal) {
    const rgb = Number.parseInt(color.slice(1), 16);
    const sun = [-.42, .76, .5];
    const illumination = .82 + Math.max(0, dot(sun, normal)) * .23;
    const channels = [rgb >> 16, (rgb >> 8) & 255, rgb & 255];
    return 'rgb(' + channels.map(value => Math.round(Math.min(255, value * illumination))).join(',') + ')';
  }

  function basis(angle, elevation) {
    const cosYaw = Math.cos(angle), sinYaw = Math.sin(angle);
    const cosPitch = Math.cos(elevation), sinPitch = Math.sin(elevation);
    return ([x, y, z]) => {
      const forward = x * sinYaw + z * cosYaw;
      return [x * cosYaw - z * sinYaw, forward * sinPitch - y * cosPitch, forward * cosPitch + y * sinPitch];
    };
  }

  function project(vertex) {
    const [x, y, depth] = transform(vertex);
    return [x * size + centerX, y * size + centerY, depth];
  }

  function rectangle(x, z, halfX, halfZ, y) {
    return [
      [x - halfX, y, z - halfZ], [x + halfX, y, z - halfZ],
      [x + halfX, y, z + halfZ], [x - halfX, y, z + halfZ]
    ];
  }

  const groundBounds = lots.map(({ x, z }) => rectangle(x, z, lotHalf, lotHalf, 0)).flat();
  const fitVertices = groundBounds.concat(lots.flatMap(lot => lot.faces.flatMap(face => face.vertices)));
  const fit = projectedBounds(basis(initialYaw, initialPitch));
  function projectedBounds(toView) {
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    for (const vertex of fitVertices) {
      const [x, y] = toView(vertex);
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
    return bounds;
  }

  function polygon(points, fill, stroke, lineWidth = 1) {
    if (points.length < 3) return;
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function path(vertices, color, lineWidth = 1) {
    ctx.beginPath();
    vertices.map(project).forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawLot(lot) {
    const { x, z, index } = lot;
    const focused = index === active;
    const hovered = index === hover;
    const base = rectangle(x, z, lotHalf, lotHalf, 0).map(project);
    const top = rectangle(x, z, lotHalf, lotHalf, plinthHeight).map(project);
    const sideColors = ['#c5b8a3', '#d3c5b0', '#b9ab96', '#cdbfa9'];
    top.map((point, side) => {
      const next = (side + 1) % 4;
      return { side, points: [base[side], base[next], top[next], point], depth: (base[side][2] + base[next][2]) / 2 };
    }).sort((a, b) => a.depth - b.depth).forEach(({ side, points }) => polygon(points, sideColors[side]));
    polygon(top, focused ? '#f3e6ce' : hovered ? '#eee3cf' : '#e9e0ce', '#c7bba7', .7);

    const curb = lotHalf - .75;
    polygon(rectangle(x, z, curb, curb, plinthHeight + .015).map(project), null, focused ? '#b68b54' : '#c9bba4', focused ? 1 : .65);
    const tickColor = focused ? '#b68b54' : '#bbae95';
    for (const [dx, dz] of [[-1,-1], [1,-1], [1,1], [-1,1]]) {
      const px = x + dx * curb;
      const pz = z + dz * curb;
      const y = plinthHeight + .03;
      path([[px - dx * 1.75, y, pz], [px, y, pz], [px, y, pz - dz * 1.75]], tickColor, 1.15);
    }

    ctx.save();
    polygon(top, null);
    ctx.clip();
    ctx.filter = 'blur(2px)';
    polygon(lot.shadow.map(project), 'rgba(95,75,45,.22)');
    ctx.restore();
  }

  function drawFace({ points, face, index }) {
    polygon(points, litColor(face.color, face.normal), face.stroke ?? 'rgba(63,49,34,.15)', face.lineWidth ?? .42);
    faceHits.push({ index, points });
  }

  function drawMarker(lot) {
    const { x, z, index } = lot;
    const focus = index === active;
    const over = index === hover;
    const nearX = Math.sin(yaw) >= 0 ? 1 : -1;
    const nearZ = Math.cos(yaw) >= 0 ? 1 : -1;
    const [cx, cy] = project([x + nearX * 11.8, plinthHeight + .2, z + nearZ * 11.8]);
    const markerY = cy + 1;
    const radius = focus ? 14 : 11;
    ctx.beginPath();
    ctx.arc(cx, markerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = focus ? '#a4291d' : over ? '#3d3325' : '#f9f3e7';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = focus ? '#842419' : over ? '#3d3325' : '#aa9c83';
    ctx.stroke();
    ctx.fillStyle = focus || over ? '#fffaf0' : '#3e392f';
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1).padStart(2, '0'), cx, markerY + .5);
    markerHits.push({ index, x: cx, y: markerY, radius: Math.max(17, radius) });
  }

  function draw() {
    if (!width || !height) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const background = ctx.createRadialGradient(width * .45, height * .37, 0, width * .5, height * .49, Math.max(width, height) * .74);
    background.addColorStop(0, '#f8f2e7');
    background.addColorStop(1, '#e9dfce');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    markerHits = [];
    faceHits = [];
    if (!lots.length) return;

    transform = basis(yaw, pitch);
    const framing = projectedBounds(transform);
    const insetX = width < 560 ? 40 : 92;
    const insetY = height < 410 ? 42 : 88;
    size = Math.max(.25, Math.min((width - insetX) / (fit.maxX - fit.minX), (height - insetY) / (fit.maxY - fit.minY))) * magnification;
    centerX = width / 2 - (framing.minX + framing.maxX) * size / 2;
    centerY = height / 2 - (framing.minY + framing.maxY) * size / 2;
    const orderedLots = lots.slice().sort((a, b) => transform([a.x, 0, a.z])[2] - transform([b.x, 0, b.z])[2]);

    // Soft shadow underneath the district, then the individual architectural boards.
    ctx.save();
    ctx.filter = 'blur(6px)';
    for (const { x, z } of orderedLots) {
      polygon(rectangle(x + .8, z + 1.3, lotHalf, lotHalf, -.75).map(project), 'rgba(100,74,39,.17)');
    }
    ctx.restore();
    orderedLots.forEach(drawLot);

    const viewDirection = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    const faces = lots.flatMap(({ index, faces }) => faces
      .filter(face => face.doubleSided || dot(face.normal, viewDirection) > 0)
      .map(face => {
        const points = face.vertices.map(project);
        return { index, face, points, depth: points.reduce((sum, point) => sum + point[2], 0) / points.length };
      }));
    faces.sort((a, b) => a.depth - b.depth).forEach(drawFace);
    orderedLots.forEach(drawMarker);
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      draw();
    });
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    schedule();
  }

  function hit(x, y) {
    for (let i = markerHits.length - 1; i >= 0; i--) {
      const marker = markerHits[i];
      if (Math.hypot(x - marker.x, y - marker.y) <= marker.radius) return marker.index;
    }
    for (let i = faceHits.length - 1; i >= 0; i--) {
      const { points, index } = faceHits[i];
      let inside = false;
      for (let a = 0, b = points.length - 1; a < points.length; b = a++) {
        const [ax, ay] = points[a], [bx, by] = points[b];
        if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
      }
      if (inside) return index;
    }
    return -1;
  }

  function select(index) {
    active = Number.isInteger(index) && lots[index] ? index : -1;
    schedule();
  }

  function zoom(factor) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    magnification = clamp(magnification * factor, .65, 3);
    schedule();
  }

  function rotate(angle) {
    if (!Number.isFinite(angle)) return;
    yaw += angle;
    schedule();
  }

  function reset() {
    yaw = initialYaw;
    pitch = initialPitch;
    magnification = 1;
    schedule();
  }

  canvas.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch, moved: false };
  });
  canvas.addEventListener('pointermove', event => {
    if (drag) {
      if (event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      drag.moved ||= Math.hypot(dx, dy) > 4;
      if (!drag.moved) return;
      canvas.style.cursor = 'grabbing';
      yaw = drag.yaw + dx * .009;
      pitch = clamp(drag.pitch + dy * .005, .24, 1.02);
      schedule();
      return;
    }
    const index = hit(event.offsetX, event.offsetY);
    if (index === hover) return;
    hover = index;
    canvas.style.cursor = hover < 0 ? 'grab' : 'pointer';
    schedule();
  });
  canvas.addEventListener('pointerup', event => {
    if (drag?.id !== event.pointerId) return;
    const index = drag.moved ? -1 : hit(event.offsetX, event.offsetY);
    drag = null;
    canvas.style.cursor = index < 0 ? 'grab' : 'pointer';
    if (index >= 0) {
      select(index);
      onSelect?.(index);
    }
  });
  canvas.addEventListener('lostpointercapture', () => {
    if (!drag) return;
    drag = null;
    canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('pointerleave', () => {
    if (drag || hover < 0) return;
    hover = -1;
    schedule();
  });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(Math.exp(-event.deltaY * (event.deltaMode === 1 ? .04 : .0013)));
  }, { passive: false });
  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';
  new ResizeObserver(resize).observe(canvas);
  resize();
  return { select, zoom, reset, rotate };
};
