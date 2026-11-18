const paper = '#fbf8ef';
const ink = '#262e2a';
const faintInk = '#716e61';
const mono = 'ui-monospace, "SFMono-Regular", Consolas, monospace';

function utcLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

function shortName(author) {
  return (author?.name || 'Unknown').replace(/\s*\([^)]*\)\s*$/, '').trim() || author.name;
}

export function drawStudy(canvas, model, mode, selected, onPick) {
  const context = canvas.getContext('2d');
  const authors = new Map(model.authors.map(author => [author.key, author]));
  const messages = model.messages;
  const indexById = new Map(messages.map((message, index) => [message.id, index]));
  const weave = mode === 'weave';
  let activeId = selected;
  let width = 0;
  let height = 0;
  let hitPoints = [];
  let pending = 0;
  let destroyed = false;
  let hover = -1;

  function line(x1, y1, x2, y2, color, weight = 1) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineWidth = weight;
    context.strokeStyle = color;
    context.stroke();
  }

  function text(value, x, y, { align = 'left', size = 10, color = faintInk, max = Infinity, bold = false } = {}) {
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'middle';
    context.font = (bold ? '600 ' : '') + size + 'px ' + mono;
    let label = String(value);
    if (Number.isFinite(max) && context.measureText(label).width > max) {
      while (label.length > 1 && context.measureText(label + '…').width > max) label = label.slice(0, -1);
      label += '…';
    }
    context.fillText(label, x, y);
  }

  function bead(point, radius) {
    const {x, y, author, message} = point;
    context.fillStyle = author?.color || ink;
    context.strokeStyle = paper;
    context.lineWidth = Math.min(2, radius * .3);
    context.beginPath();
    if (message.kind === 'link') {
      context.moveTo(x, y - radius * 1.22);
      context.lineTo(x + radius * 1.22, y);
      context.lineTo(x, y + radius * 1.22);
      context.lineTo(x - radius * 1.22, y);
      context.closePath();
    } else {
      context.arc(x, y, radius, 0, Math.PI * 2);
    }
    context.fill();
    context.stroke();
  }

  function drawSelected(point, radius) {
    if (!point) return;
    context.beginPath();
    context.arc(point.x, point.y, radius + 4.5, 0, Math.PI * 2);
    context.strokeStyle = paper;
    context.lineWidth = 4;
    context.stroke();
    context.strokeStyle = ink;
    context.lineWidth = 1.5;
    context.stroke();
    bead(point, radius + .5);
  }

  function redraw() {
    if (destroyed || !context || !width || !height) return;
    const small = width < 480;
    const inset = small ? 16 : 29;
    const top = Math.min(height * .20, 54);
    const bottom = height - Math.min(height * .21, 60);
    const nameWidth = weave ? Math.min(small ? 61 : 102, width * .24) : 0;
    const left = inset + nameWidth + (weave ? 0 : 9);
    const right = Math.max(left, width - inset - 9);
    const span = right - left;
    const rowStep = (bottom - top) / Math.max(1, model.authors.length);
    const gap = span / Math.max(1, messages.length - 1);
    const radius = Math.max(2.4, Math.min(weave ? 7 : 9, gap * .37 || 4, weave ? rowStep * .32 : 10));
    const lineY = top + (bottom - top) * .48;
    const laneByKey = new Map(model.authors.map((author, index) => [author.key, top + (index + .5) * rowStep]));
    hitPoints = messages.map((message, index) => ({
      x: messages.length === 1 ? (left + right) / 2 : left + index * gap,
      y: weave ? laneByKey.get(message.authorKey) ?? lineY : lineY,
      message, author: authors.get(message.authorKey)
    }));

    context.fillStyle = paper;
    context.fillRect(0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const tickCount = Math.max(2, Math.min(messages.length, Math.floor(span / 65)));
    for (let tick = 0; tick < tickCount; tick++) {
      const ordinal = Math.round(tick * Math.max(0, messages.length - 1) / (tickCount - 1));
      const x = hitPoints[ordinal]?.x;
      if (x == null || (!ordinal && tick > 0)) continue;
      context.setLineDash([1, 5]);
      line(x, top - 6, x, bottom + 4, '#d8d3c2');
      context.setLineDash([]);
      text(String(ordinal + 1).padStart(2, '0'), x, Math.max(12, top - 19), { align: 'center', size: 9 });
    }

    if (!hitPoints.length) return;

    if (weave) {
      const labelStride = Math.max(1, Math.ceil(13 / Math.max(1, rowStep)));
      const selectedAuthor = messages[indexById.get(activeId)]?.authorKey;
      for (const [index, author] of model.authors.entries()) {
        const y = laneByKey.get(author.key);
        context.globalAlpha = .40;
        line(left - 5, y, right, y, author.color || ink, 1);
        context.globalAlpha = 1;
        if (index % labelStride === 0 || author.key === selectedAuthor) {
          text(shortName(author), left - 10, y, { align: 'right', size: small ? 9 : 10, color: ink, max: nameWidth - 9, bold: author.key === selectedAuthor });
        }
      }
      // This continuous strand shows reading order across lanes, including mirrors.
      for (let i = 1; i < hitPoints.length; i++) {
        const a = hitPoints[i - 1], b = hitPoints[i];
        const bend = Math.min(60, gap * .45);
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.bezierCurveTo(a.x + bend, a.y, b.x - bend, b.y, b.x, b.y);
        context.strokeStyle = paper;
        context.lineWidth = 6;
        context.stroke();
        context.strokeStyle = a.author?.color || ink;
        context.lineWidth = gap < 6 ? 1.5 : 2.5;
        context.stroke();
      }
    } else {
      line(left - 7, lineY, right + 7, lineY, '#b5ad99', 2);
      // Label selected, first and a few well-separated stops. Spacing is ordinal.
      const selectedIndex = indexById.get(activeId);
      const stride = Math.max(1, Math.ceil(107 / Math.max(gap, 1)));
      const picks = [];
      if (selectedIndex !== undefined) picks.push(selectedIndex);
      for (let i = 0; i < messages.length; i += stride) {
        if (picks.every(index => Math.abs(hitPoints[index].x - hitPoints[i].x) >= Math.min(95, span / 2))) picks.push(i);
      }
      picks.sort((a, b) => a - b).forEach((index, order) => {
        const point = hitPoints[index];
        const upward = order % 2 === 0;
        const end = lineY + (upward ? -1 : 1) * Math.min(36, (bottom - top) * .26);
        line(point.x, lineY + (upward ? -radius : radius), point.x, end, '#aa9e87');
        const align = point.x - left < 40 ? 'left' : right - point.x < 40 ? 'right' : 'center';
        text(shortName(point.author), point.x, end + (upward ? -10 : 11), {align, color: ink, bold: index === selectedIndex, max: Math.min(width * .34, 107)});
      });
    }

    for (const point of hitPoints) bead(point, radius);
    if (hitPoints[hover] && hitPoints[hover].message.id !== activeId) bead(hitPoints[hover], radius + 2);
    drawSelected(hitPoints[indexById.get(activeId)], radius);
    const baseline = Math.min(height - 23, bottom + 18);
    line(inset, baseline, width - inset, baseline, '#d5cebd');
    const start = utcLabel(messages[0].at);
    const end = utcLabel(messages.at(-1).at);
    if (small && start !== end) {
      text(start.slice(0, 16), inset, baseline + 13, { size: 9 });
      text(end, width - inset, baseline + 13, { size: 9, align: 'right' });
    } else {
      text(start, inset, baseline + 13, { size: 9 });
      if (start !== end) text(end, width - inset, baseline + 13, { size: 9, align: 'right' });
    }
  }

  function queueRedraw() {
    if (!pending && !destroyed) pending = requestAnimationFrame(() => { pending = 0; redraw(); });
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    redraw();
  }
  function nearest(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best = -1, distance = event.pointerType === 'touch' ? 26 : 16;
    for (let i = 0; i < hitPoints.length; i++) {
      const d = Math.hypot(hitPoints[i].x - x, hitPoints[i].y - y);
      if (d < distance) { best = i; distance = d; }
    }
    return best;
  }
  function move(event) {
    const next = nearest(event);
    if (hover === next) return;
    hover = next;
    canvas.style.cursor = next >= 0 ? 'pointer' : 'default';
    queueRedraw();
  }
  function leave() { hover = -1; queueRedraw(); }
  function click(event) {
    const index = nearest(event);
    if (index !== -1) onPick(hitPoints[index].message.id);
  }
  const observer = window.ResizeObserver ? new ResizeObserver(resize) : null;
  observer?.observe(canvas);
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('click', click);
  resize();
  return {
    setSelected(id) { activeId = id; queueRedraw(); },
    resize,
    destroy() {
      destroyed = true;
      observer?.disconnect();
      if (pending) cancelAnimationFrame(pending);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('click', click);
      canvas.style.cursor = '';
    }
  };
}
