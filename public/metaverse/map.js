/* Project the thread directory onto a rotatable 3D atlas. Connections run
   through diamond-shaped hubs for names shared by multiple latest senders. */
window.LoomMap = function LoomMap(canvas, onSelect) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setData() {}, select() {}, zoom() {}, reset() {}, orbit() {} };

  const groups = {
    topic:   { color: '#62e6de', center: [-0.49, 0.26, 0.13] },
    handle:  { color: '#ff8f79', center: [0.45, 0.27, -0.14] },
    url:     { color: '#f3c36e', center: [0.36, -0.36, 0.25] },
    other:   { color: '#b29deb', center: [-0.38, -0.34, -0.21] }
  };
  const initialPitch = -0.18;
  const initialYaw = 0.12;
  const tau = 2 * Math.PI;
  let width = 0, height = 0, scale = 1;
  let yaw = initialYaw, pitch = initialPitch, magnification = 1;
  let points = [], hubs = [], selected = '', hovered = '', hits = [];
  let pending = false, drag = null;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function hash(str) {
    let n = 2166136261;
    for (let i = 0; i < str.length; i++) n = Math.imul(n ^ str.charCodeAt(i), 16777619);
    return n >>> 0;
  }

  function setData(logs) {
    const members = { topic: [], handle: [], url: [], other: [] };
    const senders = new Map();
    for (const log of logs) {
      const group = Object.hasOwn(members, log.kind) ? log.kind : 'other';
      members[group].push(log);
    }
    points = [];
    hubs = [];
    for (const [group, logs] of Object.entries(members)) {
      const { color, center } = groups[group];
      // A thread keeps its coordinates across filters and live refreshes.
      for (const log of logs) {
        const seed = log.address;
        const angle = tau * hash('angle/' + seed) / 4294967296;
        const altitude = (hash('vertical/' + seed) / 4294967296) * 2 - 1;
        const radius = Math.cbrt(hash('distance/' + seed) / 4294967296);
        const disk = radius * Math.sqrt(1 - altitude * altitude);
        const dx = Math.cos(angle) * disk, dy = radius * altitude;
        const point = {
          x: center[0] + dx * .41,
          y: center[1] + dy * .24 + dx * .08,
          z: center[2] + Math.sin(angle) * disk * .36,
          log, color, weight: Math.log2(1 + Math.max(1, Number(log.count) || 1))
        };
        points.push(point);
        const name = log.last?.name;
        if (name) {
          if (!senders.has(name)) senders.set(name, []);
          senders.get(name).push(point);
        }
      }
    }
    for (const [name, members] of senders) {
      if (members.length < 2) continue;
      const n = members.length;
      const hub = { name, members, x: 0, y: 0, z: 0 };
      for (const point of members) {
        hub.x += point.x / n;
        hub.y += point.y / n;
        hub.z += point.z / n;
        point.hub = hub;
      }
      hub.z += .13;
      hubs.push(hub);
    }
    schedule();
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      draw();
    });
  }

  function draw() {
    if (width <= 0 || height <= 0) return;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    function project(x, y, z) {
      const nx = cy * x + sy * z, nz = cy * z - sy * x;
      const ny = cp * y - sp * nz, depth = sp * y + cp * nz;
      const p = 3.25 / (3.25 - depth);
      return { x: width * .5 + nx * scale * p, y: height * .5 - ny * scale * p, depth, p };
    }
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a1018';
    ctx.fillRect(0, 0, width, height);
    const sky = ctx.createRadialGradient(width * .51, height * .48, 0, width * .51, height * .48, Math.max(width, height) * .61);
    sky.addColorStop(0, '#14232d');
    sky.addColorStop(1, '#090e16');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Fixed registration grid marks the viewing plane independently of the nodes.
    ctx.fillStyle = 'rgba(168,198,215,.13)';
    const grid = 28;
    for (let y = height / 2 % grid; y < height; y += grid) {
      for (let x = width / 2 % grid; x < width; x += grid) ctx.fillRect(x, y, 1, 1);
    }
    ctx.lineWidth = 1;
    const focus = points.find(p => p.log.address === (hovered || selected));
    const selectedPoint = points.find(p => p.log.address === selected);
    for (const point of points) Object.assign(point, { screen: project(point.x, point.y, point.z) });
    for (const hub of hubs) {
      const h = project(hub.x, hub.y, hub.z);
      hub.screen = h;
      const highlighted = focus && focus.hub === hub;
      for (const point of hub.members) {
        const p = point.screen;
        ctx.strokeStyle = point.color;
        ctx.globalAlpha = highlighted ? .55 : clamp(.16 + p.depth * .08, .07, .24);
        ctx.lineWidth = highlighted ? 1.25 : .8;
        ctx.beginPath();
        ctx.moveTo(h.x, h.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = highlighted ? .95 : .55;
      const r = highlighted ? 4 : 2.8;
      ctx.fillStyle = '#10212b';
      ctx.strokeStyle = '#c7d4e0';
      ctx.beginPath();
      ctx.moveTo(h.x, h.y - r);
      ctx.lineTo(h.x + r, h.y);
      ctx.lineTo(h.x, h.y + r);
      ctx.lineTo(h.x - r, h.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const depthOrder = points.slice().sort((a, b) => a.screen.depth - b.screen.depth);
    hits = [];
    for (const point of depthOrder) {
      const p = point.screen;
      if (p.x < -18 || p.y < -18 || p.x > width + 18 || p.y > height + 18) continue;
      const r = clamp((2.1 + point.weight * .43) * p.p * Math.sqrt(magnification), 1.7, 10);
      point.screenRadius = r;
      const strength = clamp(.81 + p.depth * .24, .58, 1);
      ctx.fillStyle = point.color;
      ctx.globalAlpha = .08 * strength;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.65, 0, tau);
      ctx.fill();
      ctx.globalAlpha = strength;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, tau);
      ctx.fill();
      if (point.weight >= 6) {
        ctx.fillStyle = '#f5ffff';
        ctx.globalAlpha = .62;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * .36, 0, tau);
        ctx.fill();
      }
      hits.push(point);
    }
    ctx.globalAlpha = 1;
    for (const pt of new Set([selectedPoint, focus])) {
      if (!pt || !hits.includes(pt)) continue;
      const p = pt.screen, r = pt.screenRadius + 5;
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, tau);
      ctx.stroke();
      if (pt === selectedPoint) {
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 4, 0, tau);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const boxes = [];
    const priority = [focus, selectedPoint, ...hits.slice().sort((a, b) => b.weight - a.weight)];
    const maxLabels = width < 430 ? 4 : width < 700 ? 7 : 11;
    for (const point of new Set(priority)) {
      if (!point || boxes.length >= maxLabels) continue;
      const p = point.screen;
      if (p.x < 5 || p.x > width - 5 || p.y < 14 || p.y > height - 10) continue;
      const active = point === focus || point === selectedPoint;
      let label = String(point.log.label || point.log.address);
      if (point.log.kind === 'url') label = label.replace(/^https?:\/\/(www\.)?/, '');
      if (label.length > 26) label = label.slice(0, 24) + '…';
      ctx.font = (active ? '600 ' : '') + '11px ui-monospace, monospace';
      const w = ctx.measureText(label).width + 10, h = 18;
      const x = p.x + 14 + w < width ? p.x + 14 : p.x - w - 14;
      const y = p.y - h - 5;
      const collides = boxes.some(b => x < b.x + b.w + 12 && x + w + 12 > b.x && y < b.y + b.h + 9 && y + h + 9 > b.y);
      if (x < 2 || x + w > width - 2 || y < 2 || collides) continue;
      boxes.push({ x, y, w, h });
      ctx.fillStyle = active ? '#10212b' : 'rgba(12,21,30,.82)';
      ctx.fillRect(x, y, w, h);
      if (active) {
        ctx.strokeStyle = point.color;
        ctx.globalAlpha = .65;
        ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = active ? '#f2f7fc' : '#b9c8d3';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 5, y + h / 2 + 1);
    }
  }

  function rescale() {
    scale = Math.min(width * .46, height * .7) * magnification;
    schedule();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rescale();
  }
  function orbit(dx, dy) {
    yaw += dx;
    pitch = clamp(pitch + dy, -1.43, 1.43);
    schedule();
  }
  function zoom(factor) {
    magnification = clamp(magnification * factor, .45, 3.6);
    rescale();
  }
  function reset() {
    yaw = initialYaw;
    pitch = initialPitch;
    magnification = 1;
    rescale();
  }
  function select(address) {
    selected = address;
    hovered = '';
    schedule();
  }
  function hit(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let best = null, nearest = Infinity;
    for (const point of hits) {
      const distance = Math.hypot(x - point.screen.x, y - point.screen.y);
      if (distance <= Math.max(9, point.screenRadius + 4) && distance <= nearest) {
        best = point;
        nearest = distance;
      }
    }
    return best;
  }

  canvas.style.touchAction = 'none';
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 || drag) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, travel: 0 };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (drag) {
      if (drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.travel += Math.hypot(dx, dy);
      if (drag.travel > 3) {
        hovered = '';
        canvas.style.cursor = 'grabbing';
        orbit(dx * .006, -dy * .006);
      }
    } else {
      const point = hit(e);
      const next = point?.log.address || '';
      canvas.style.cursor = point ? 'pointer' : 'grab';
      if (hovered !== next) {
        hovered = next;
        schedule();
      }
    }
  });
  canvas.addEventListener('pointerleave', () => { hovered = ''; schedule(); });
  canvas.addEventListener('pointerup', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const pick = drag.travel <= 4 && hit(e);
    canvas.releasePointerCapture(e.pointerId);
    drag = null;
    canvas.style.cursor = pick ? 'pointer' : 'grab';
    if (pick) {
      select(pick.log.address);
      onSelect(pick.log.address);
    }
  });
  canvas.addEventListener('lostpointercapture', () => { drag = null; canvas.style.cursor = 'grab'; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const pixels = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1);
    zoom(Math.exp(-clamp(pixels, -170, 170) * .0018));
  }, { passive: false });
  new ResizeObserver(resize).observe(canvas);
  resize();
  return { setData, select, zoom, reset, orbit };
};
