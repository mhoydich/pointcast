/** A one-button rooftop runner. Coordinates are in the shared 480 × 600 world. */
export default function createGame(api) {
  const W = api.W || 480, H = api.H || 600;
  const x = 112, radius = 18;
  let y = 451, vy = 0, elapsed = 0, distance = 0, nuts = 0, ended = false;
  let grounded = true, coyote = .1, jumpBuffer = 0, jumpHeld = false;
  let platforms = [{ x: -40, w: 520, y: 470 }];
  let acorns = [{ x: 300, y: 402, taken: false }];
  let labels = [], total = -1;
  const roundRect = (ctx, x, y, w, h, r = 8) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  };
  const setScore = () => {
    const next = Math.floor(distance / 16) + nuts * 25;
    if (next !== total) { total = next; api.score(total); }
  };
  function jump() {
    if (!ended) jumpBuffer = .16;
  }
  function acorn(ctx, ax, ay, rotation = 0) {
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(rotation);
    ctx.fillStyle = '#b87530'; ctx.beginPath(); ctx.ellipse(0, 2, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#54381f'; ctx.beginPath(); ctx.ellipse(0, -5, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#54381f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(1, -16, 6, -15); ctx.stroke();
    ctx.fillStyle = '#f7cf86'; ctx.beginPath(); ctx.ellipse(-3, 3, 2, 5, -.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function addPlatform() {
    const last = platforms[platforms.length - 1];
    const gap = 66 + Math.random() * 35;
    const top = Math.max(425, Math.min(488, last.y + (Math.random() - .5) * 46));
    const platform = { x: last.x + last.w + gap, w: 225 + Math.random() * 135, y: top };
    platforms.push(platform);
    for (let i = 0; i < 3; i++) acorns.push({ x: platform.x + 52 + i * 52, y: top - 66 - (i === 1 ? 12 : 0), taken: false });
  }
  setScore();
  return {
    update(dt) {
      if (ended) return;
      dt = Math.min(dt, .04);
      elapsed += dt;
      const speed = 175 + Math.min(70, elapsed * 1.5);
      const dx = speed * dt;
      distance += dx;
      platforms.forEach(p => { p.x -= dx; });
      acorns.forEach(a => { a.x -= dx; });
      while (platforms[platforms.length - 1].x + platforms[platforms.length - 1].w < W + 450) addPlatform();
      platforms = platforms.filter(p => p.x + p.w > -60);
      acorns = acorns.filter(a => a.x > -40 && !a.taken);
      labels.forEach(l => { l.life -= dt; l.y -= dt * 32; });
      labels = labels.filter(l => l.life > 0);
      jumpBuffer -= dt;
      coyote -= dt;
      if (jumpBuffer > 0 && coyote > 0) {
        vy = -605; grounded = false; coyote = 0; jumpBuffer = 0;
        api.burst?.(x, y + radius, '#fff4b3');
      }
      const oldFeet = y + radius;
      vy += 1570 * dt;
      y += vy * dt;
      grounded = false;
      if (vy >= 0) for (const p of platforms) {
        if (x + 12 > p.x && x - 12 < p.x + p.w && oldFeet <= p.y + 2 && y + radius >= p.y) {
          y = p.y - radius; vy = 0; grounded = true; coyote = .11; break;
        }
      }
      for (const a of acorns) if (!a.taken && Math.hypot(a.x - x, a.y - y) < 32) {
        a.taken = true; nuts++; labels.push({ x: a.x, y: a.y, life: .8 });
        api.burst?.(a.x, a.y, '#ffcc55');
      }
      setScore();
      if (y > H + 60) { ended = true; api.finish(`A lovely little leap! ${nuts} acorns collected. Try another rooftop run.`); }
      else if (elapsed >= 45) { ended = true; api.finish(`You made it across the neighborhood! ${nuts} acorns and a sunny finish.`); }
    },
    draw(ctx) {
      // A quiet layer behind the roofs keeps jumps legible on either photo or illustration.
      const shade = ctx.createLinearGradient(0, 360, 0, H);
      shade.addColorStop(0, 'rgba(240,249,242,0)'); shade.addColorStop(1, 'rgba(52,94,99,.6)');
      ctx.fillStyle = shade; ctx.fillRect(0, 360, W, H - 360);
      for (const p of platforms) {
        ctx.fillStyle = '#f7e9cf'; roundRect(ctx, p.x, p.y, p.w, H - p.y + 20, 9);
        ctx.fillStyle = '#e9b984'; ctx.fillRect(p.x, p.y + 17, p.w, 10);
        ctx.fillStyle = '#735847'; roundRect(ctx, p.x - 3, p.y - 5, p.w + 6, 16, 5);
        ctx.fillStyle = '#a77c58'; ctx.fillRect(p.x, p.y + 7, p.w, 4);
        ctx.strokeStyle = 'rgba(160,112,75,.24)'; ctx.lineWidth = 2;
        for (let bx = p.x + 25; bx < p.x + p.w; bx += 50) {
          ctx.beginPath(); ctx.moveTo(bx, p.y + 35); ctx.lineTo(bx, H); ctx.stroke();
        }
        for (let wy = p.y + 48; wy < H; wy += 57) {
          ctx.fillStyle = '#9abbb3';
          for (let wx = p.x + 31; wx < p.x + p.w - 30; wx += 65) {
            roundRect(ctx, wx, wy, 28, 34, 4);
            ctx.fillStyle = '#d1ebe0'; ctx.fillRect(wx + 3, wy + 3, 9, 28); ctx.fillStyle = '#9abbb3';
          }
        }
      }
      for (const a of acorns) if (!a.taken) {
        ctx.fillStyle = 'rgba(255,242,164,.66)'; ctx.beginPath(); ctx.arc(a.x, a.y, 20 + Math.sin(elapsed * 5 + a.x) * 2, 0, Math.PI * 2); ctx.fill();
        acorn(ctx, a.x, a.y + Math.sin(elapsed * 4 + a.x) * 3, -.15);
      }
      ctx.save();
      if (grounded) ctx.translate(0, Math.sin(elapsed * 25) * 1.7);
      api.drawSquirrel(ctx, x, y - 2, 55);
      ctx.restore();
      ctx.textAlign = 'center'; ctx.font = 'bold 18px system-ui';
      for (const l of labels) {
        ctx.globalAlpha = Math.min(1, l.life * 2); ctx.fillStyle = '#3f4223'; ctx.fillText('+25', l.x, l.y);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,251,237,.94)'; roundRect(ctx, 18, 20, 124, 42, 20);
      ctx.fillStyle = '#314b43'; ctx.font = 'bold 17px system-ui'; ctx.fillText(`${Math.max(0, Math.ceil(45 - elapsed))}s to home`, 80, 47);
      ctx.fillStyle = 'rgba(255,251,237,.94)'; roundRect(ctx, W - 124, 20, 106, 42, 20);
      ctx.fillStyle = '#63462b'; ctx.fillText(`${nuts} acorns`, W - 71, 47);
      ctx.fillStyle = 'rgba(32,58,55,.88)'; roundRect(ctx, 80, H - 43, W - 160, 29, 14);
      ctx.fillStyle = '#fff7df'; ctx.font = '600 13px system-ui'; ctx.fillText('TAP / SPACE TO JUMP', W / 2, H - 23);
    },
    pointer(px, py, phase) { if (phase === 'down') jump(); },
    key(key, pressed) {
      if (key === ' ' || key === 'Space' || key === 'Spacebar' || key === 'ArrowUp' || key.toLowerCase() === 'w') {
        if (pressed && !jumpHeld) jump();
        jumpHeld = pressed;
      }
    },
  };
}
