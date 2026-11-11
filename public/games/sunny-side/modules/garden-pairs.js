const COLORS = ['#ff9b71', '#a9d9b6', '#e5a0b4', '#f4c957', '#bb9271', '#70b79c'];

export default function createGame(api) {
  const cards = Array.from({ length: 12 }, (_, index) => ({ value: index % 6, open: false, matched: false, flip: 0, glow: 0 }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  let selected = -1, focus = 0, moves = 0, matches = 0, total = 0, pending = null, time = 0, complete = false;
  let message = 'Turn over two cards. Find a little friend.';
  api.score(0);
  const X = 44, Y = 143, CW = 120, CH = 85, GAP = 16;
  function rect(index) { return { x: X + (index % 3) * (CW + GAP), y: Y + Math.floor(index / 3) * (CH + GAP) }; }
  function pick(index) {
    if (complete || pending || index < 0 || index >= cards.length) return;
    focus = index;
    const card = cards[index];
    if (card.open || card.matched) return;
    card.open = true;
    if (selected < 0) { selected = index; message = 'Now find its pair.'; return; }
    moves++;
    const first = selected;
    selected = -1;
    if (cards[first].value === card.value) {
      card.matched = cards[first].matched = true;
      card.glow = cards[first].glow = 1;
      matches++;
      total += Math.max(50, 150 - Math.max(0, moves - matches) * 5);
      api.score(total);
      const r = rect(index);
      api.burst(r.x + CW / 2, r.y + CH / 2, COLORS[card.value]);
      message = ['A perfect little pair!', 'Two peas in a garden.', 'Good memory, sunshine.'][matches % 3];
      if (matches === 6) {
        complete = true;
        message = 'Everyone found a friend!';
        pending = { remaining: 0.65, finish: true };
      }
    } else {
      message = 'Have a look… then try another pair.';
      pending = { remaining: 0.95, first, second: index, finish: false };
    }
  }
  function box(ctx, x, y, w, h, radius, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
  }
  function icon(ctx, value) {
    ctx.save();
    if (value === 0) api.drawPuppy(ctx, 0, 0, 53);
    else if (value === 1) api.drawSquirrel(ctx, 0, 0, 53);
    else if (value === 2) {
      ctx.fillStyle = '#dc768e';
      for (let p = 0; p < 6; p++) { const a = p * Math.PI / 3; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 15, Math.sin(a) * 15, 10, 13, a, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#f5ca58'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    } else if (value === 3) {
      ctx.strokeStyle = '#e8a72b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let p = 0; p < 8; p++) { const a = p * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 23, Math.sin(a) * 23); ctx.lineTo(Math.cos(a) * 29, Math.sin(a) * 29); ctx.stroke(); }
      ctx.fillStyle = '#f3c650'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#705439'; ctx.beginPath(); ctx.arc(-6, -2, 2, 0, Math.PI * 2); ctx.arc(6, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#705439'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 3, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    } else if (value === 4) {
      ctx.fillStyle = '#bc8858'; ctx.beginPath(); ctx.ellipse(0, 7, 17, 21, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#78533a'; ctx.beginPath(); ctx.ellipse(0, -9, 21, 10, 0, Math.PI, Math.PI * 2); ctx.lineTo(21, -5); ctx.quadraticCurveTo(0, 1, -21, -5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#78533a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -17); ctx.quadraticCurveTo(0, -26, 7, -27); ctx.stroke();
    } else {
      ctx.rotate(-0.5); ctx.fillStyle = '#69a582'; ctx.beginPath(); ctx.moveTo(0, 26); ctx.bezierCurveTo(-35, 5, -22, -20, 0, -29); ctx.bezierCurveTo(29, -5, 30, 9, 0, 26); ctx.fill();
      ctx.strokeStyle = '#39765c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(0, -18); ctx.moveTo(0, 7); ctx.lineTo(-12, -1); ctx.moveTo(0, -1); ctx.lineTo(11, -10); ctx.stroke();
    }
    ctx.restore();
  }
  return {
    update(dt) {
      time += dt;
      for (const card of cards) {
        const target = card.open || card.matched ? 1 : 0;
        card.flip += Math.sign(target - card.flip) * Math.min(Math.abs(target - card.flip), dt * 5);
        card.glow = Math.max(0, card.glow - dt);
      }
      if (pending) {
        pending.remaining -= dt;
        if (pending.remaining <= 0) {
          if (pending.finish) { pending = null; api.finish(`Garden complete in ${moves} turns. Everyone found a friend!`); }
          else { cards[pending.first].open = cards[pending.second].open = false; pending = null; message = 'Where have you seen that one?'; }
        }
      }
    },
    draw(ctx) {
      ctx.save();
      box(ctx, 24, 26, 432, 90, 25, 'rgba(255,250,235,.94)');
      ctx.fillStyle = '#294c3a'; ctx.font = 'bold 25px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('A garden of little pairs', 43, 62);
      ctx.font = '600 15px system-ui, sans-serif'; ctx.fillStyle = '#63826d'; ctx.fillText(`${matches} / 6 pairs`, 44, 91); ctx.textAlign = 'right'; ctx.fillText(`${moves} ${moves === 1 ? 'turn' : 'turns'}`, 435, 91);
      box(ctx, 24, 126, 432, 415, 25, 'rgba(41,76,58,.15)');
      cards.forEach((card, index) => {
        const r = rect(index), front = card.flip >= 0.5;
        ctx.save(); ctx.translate(r.x + CW / 2, r.y + CH / 2);
        ctx.scale(Math.max(0.04, Math.abs(1 - card.flip * 2)), 1);
        ctx.shadowColor = 'rgba(30,62,45,.15)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 4;
        box(ctx, -CW / 2, -CH / 2, CW, CH, 17, front ? (card.matched ? '#e2f0d8' : '#fff9e9') : '#446f59');
        ctx.shadowOffsetY = 0;
        if (card.glow > 0) { ctx.strokeStyle = `rgba(248,211,108,${card.glow})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-CW / 2 + 2, -CH / 2 + 2, CW - 4, CH - 4, 16); ctx.stroke(); }
        if (front) { icon(ctx, card.value); if (card.matched) { ctx.fillStyle = '#4e7b57'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'right'; ctx.fillText('✓', CW / 2 - 9, -CH / 2 + 19); } }
        else {
          ctx.strokeStyle = 'rgba(255,247,215,.23)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-CW / 2 + 8, -CH / 2 + 8, CW - 16, CH - 16, 10); ctx.stroke();
          ctx.fillStyle = '#b8d2a7'; ctx.beginPath(); ctx.ellipse(-5, -5, 11, 18, -0.6, 0, Math.PI * 2); ctx.ellipse(9, 8, 9, 15, 0.7, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        if (focus === index && !complete) { ctx.strokeStyle = '#f6ca62'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(r.x - 3, r.y - 3, CW + 6, CH + 6, 20); ctx.stroke(); }
      });
      box(ctx, 24, 552, 432, 33, 16, 'rgba(255,250,235,.94)');
      ctx.fillStyle = '#355e46'; ctx.textAlign = 'center'; ctx.font = '600 13px system-ui, sans-serif'; ctx.fillText(message, 240, 574);
      ctx.restore();
    },
    pointer(x, y, phase) {
      if (phase !== 'down') return;
      for (let i = 0; i < cards.length; i++) { const r = rect(i); if (x >= r.x && x <= r.x + CW && y >= r.y && y <= r.y + CH) { pick(i); break; } }
    },
    key(key, pressed) {
      if (!pressed) return;
      if (key === 'ArrowLeft') focus = (focus + 11) % 12;
      else if (key === 'ArrowRight') focus = (focus + 1) % 12;
      else if (key === 'ArrowUp') focus = (focus + 9) % 12;
      else if (key === 'ArrowDown') focus = (focus + 3) % 12;
      else if (key === 'Enter' || key === ' ' || key === 'Space') pick(focus);
    }
  };
}
