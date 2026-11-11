/** Drag along a springy cable, catch acorns, and give birds a little room. */
export default function createGame(api) {
  const W = api.W || 480, H = api.H || 600;
  let x = W / 2, target = x, time = 45, elapsed = 0, score = 0, nuts = 0, lives = 3;
  let spawn = .35, birdSpawn = 2.4, invincible = 0, combo = 0, lastCatch = -10, ended = false;
  const items = [], popups = [], keys = new Set();
  const clamp = v => Math.max(30, Math.min(W - 30, v));
  const cableY = px => 422 + Math.sin(px / W * Math.PI) * 20;
  const rounded = (ctx, px, py, w, h, r = 10) => { ctx.beginPath(); ctx.roundRect(px, py, w, h, r); ctx.fill(); };
  const acorn = (ctx, px, py) => {
    ctx.fillStyle = '#b67532'; ctx.beginPath(); ctx.ellipse(px, py + 4, 10, 14, -.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#66402c'; ctx.beginPath(); ctx.ellipse(px, py - 5, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#66402c'; ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.quadraticCurveTo(px, py - 17, px + 5, py - 16); ctx.stroke();
    ctx.fillStyle = '#f5cc7d'; ctx.beginPath(); ctx.ellipse(px - 4, py + 4, 2, 6, -.2, 0, Math.PI * 2); ctx.fill();
  };
  api.score(0);
  return {
    update(dt) {
      if (ended) return;
      dt = Math.min(dt, .04); elapsed += dt; time = Math.max(0, 45 - elapsed); invincible -= dt;
      const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
      const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
      if (right !== left) target = clamp(target + (right ? 1 : -1) * 360 * dt);
      x += (target - x) * Math.min(1, dt * 18);
      spawn -= dt; birdSpawn -= dt;
      if (spawn <= 0) {
        items.push({ kind: 'nut', x: 35 + Math.random() * (W - 70), y: -25, vy: 155 + elapsed * 2 + Math.random() * 50, phase: Math.random() * 7 });
        spawn = .7 + Math.random() * .35;
      }
      if (birdSpawn <= 0) {
        items.push({ kind: 'bird', x: 30 + Math.random() * (W - 60), y: -30, vy: 150 + elapsed * 2.5, phase: Math.random() * 7 });
        birdSpawn = Math.max(1.25, 2.7 - elapsed * .024) + Math.random() * .65;
      }
      const py = cableY(x) - 23;
      for (const item of items) {
        item.y += item.vy * dt;
        const ix = item.x + (item.kind === 'bird' ? Math.sin(elapsed * 3 + item.phase) * 23 : Math.sin(elapsed * 2 + item.phase) * 7);
        if (!item.done && Math.abs(ix - x) < (item.kind === 'bird' ? 35 : 29) && Math.abs(item.y - py) < 34) {
          if (item.kind === 'nut') {
            item.done = true; nuts++;
            combo = elapsed - lastCatch < 1.9 ? Math.min(5, combo + 1) : 1; lastCatch = elapsed;
            const gain = 10 + (combo - 1) * 2; score += gain; api.score(score);
            popups.push({ x: ix, y: item.y - 18, text: combo > 1 ? `+${gain} · ${combo} in a row` : '+10', life: .9, color: '#36592f' });
            api.burst?.(ix, item.y, '#ffcf58');
          } else if (invincible <= 0) {
            item.done = true; lives--; invincible = 1.5; combo = 0;
            popups.push({ x, y: py - 38, text: 'Easy, birdie!', life: 1, color: '#923c41' });
            api.burst?.(x, py, '#fff0ed');
            if (lives <= 0) { ended = true; api.finish(`The birds claimed the wire! You caught ${nuts} acorns. Have another go.`); }
          }
        }
        if (item.kind === 'nut' && !item.done && item.y > cableY(ix) + 12) { item.done = true; combo = 0; }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].done || items[i].y > H + 30) items.splice(i, 1);
      for (const p of popups) { p.life -= dt; p.y -= dt * 30; }
      for (let i = popups.length - 1; i >= 0; i--) if (popups[i].life <= 0) popups.splice(i, 1);
      if (!ended && time <= 0) { ended = true; api.finish(`A sunny wire walk! ${nuts} acorns tucked away and ${lives} ${lives === 1 ? 'heart' : 'hearts'} to spare.`); }
    },
    draw(ctx) {
      // Two wires echo the reference photo, with the squirrel on the upper one.
      ctx.lineCap = 'round';
      for (const offset of [0, 80]) {
        ctx.beginPath(); ctx.moveTo(-10, 422 + offset); ctx.quadraticCurveTo(W / 2, 466 + offset, W + 10, 422 + offset);
        ctx.strokeStyle = '#34463f'; ctx.lineWidth = offset ? 7 : 10; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-10, 419 + offset); ctx.quadraticCurveTo(W / 2, 463 + offset, W + 10, 419 + offset);
        ctx.strokeStyle = '#82918a'; ctx.lineWidth = 2; ctx.stroke();
      }
      for (const item of items) {
        const ix = item.x + (item.kind === 'bird' ? Math.sin(elapsed * 3 + item.phase) * 23 : Math.sin(elapsed * 2 + item.phase) * 7);
        if (item.kind === 'nut') {
          ctx.fillStyle = 'rgba(255,246,178,.8)'; ctx.beginPath(); ctx.arc(ix, item.y, 23, 0, Math.PI * 2); ctx.fill();
          acorn(ctx, ix, item.y);
        } else {
          ctx.save(); ctx.translate(ix, item.y);
          ctx.fillStyle = '#f7f2e4'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 12, .2, 0, Math.PI * 2); ctx.fill();
          const wing = Math.sin(elapsed * 16 + item.phase) * 9;
          ctx.fillStyle = '#506b79'; ctx.beginPath(); ctx.moveTo(-4, 3); ctx.quadraticCurveTo(-39, -24 - wing, -30, 10); ctx.quadraticCurveTo(-13, 16, -4, 3); ctx.fill();
          ctx.beginPath(); ctx.moveTo(4, 3); ctx.quadraticCurveTo(39, -24 - wing, 30, 10); ctx.quadraticCurveTo(13, 16, 4, 3); ctx.fill();
          ctx.fillStyle = '#e99b4c'; ctx.beginPath(); ctx.moveTo(13, -3); ctx.lineTo(25, 2); ctx.lineTo(13, 5); ctx.fill();
          ctx.fillStyle = '#203e47'; ctx.beginPath(); ctx.arc(10, -3, 2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
      ctx.save();
      if (invincible > 0) ctx.globalAlpha = .45 + Math.sin(elapsed * 28) * .25;
      api.drawSquirrel(ctx, x, cableY(x) - 23, 60);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,251,237,.94)'; rounded(ctx, 18, 20, 98, 42, 20);
      ctx.fillStyle = '#314b43'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center'; ctx.fillText(`${Math.ceil(time)} sec`, 67, 47);
      ctx.fillStyle = 'rgba(255,251,237,.94)'; rounded(ctx, W - 135, 20, 117, 42, 20);
      ctx.font = '22px system-ui'; ctx.fillStyle = '#b35051'; ctx.fillText('♥'.repeat(lives) + '♡'.repeat(3 - lives), W - 76, 48);
      for (const p of popups) {
        ctx.globalAlpha = Math.min(1, p.life * 2); ctx.font = 'bold 17px system-ui';
        ctx.lineWidth = 4; ctx.strokeStyle = '#fff9e8'; ctx.strokeText(p.text, Math.max(90, Math.min(W - 90, p.x)), p.y);
        ctx.fillStyle = p.color; ctx.fillText(p.text, Math.max(90, Math.min(W - 90, p.x)), p.y);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(32,58,55,.88)'; rounded(ctx, 44, H - 55, W - 88, 34, 17);
      ctx.fillStyle = '#fff7df'; ctx.font = '600 13px system-ui'; ctx.fillText('DRAG / ← → · CATCH NUTS, DODGE BIRDS', W / 2, H - 33);
    },
    pointer(px, py, phase) { if (phase === 'down' || phase === 'move') target = clamp(px); },
    key(key, pressed) { if (pressed) keys.add(key); else keys.delete(key); },
  };
}
