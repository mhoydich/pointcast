const TAU = Math.PI * 2;

function roundPanel(ctx, x, y, w, h, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

export default function createGame(api) {
  const { W, H } = api;
  const duration = 30;
  const beatLength = 1.85;
  const targetAt = 1.42;
  let elapsed = 0;
  let beatAge = 0;
  let used = false;
  let total = 0;
  let perfect = 0;
  let hits = 0;
  let streak = 0;
  let feedback = 'Wait for the rings to meet';
  let feedbackColor = '#334c49';
  let feedbackTime = 1.8;
  let ended = false;
  let pulse = 0;
  let wake = 0;
  api.score(0);

  function tap() {
    if (ended || used) return;
    used = true;
    pulse = 1;
    const error = Math.abs(beatAge - targetAt);
    if (error <= 0.13) {
      perfect++;
      hits++;
      streak++;
      total += 100 + Math.min(5, streak - 1) * 10;
      feedback = streak > 2 ? `Perfect · ${streak} in a row!` : 'Perfect. Sweet dreams!';
      feedbackColor = '#22643f';
      api.burst(W / 2, 285, '#ffe095');
    } else if (error <= 0.3) {
      hits++;
      streak++;
      total += 50;
      feedback = 'Nice and cozy';
      feedbackColor = '#417676';
      api.burst(W / 2, 285, '#b1ded0');
    } else {
      streak = 0;
      wake = 1;
      feedback = beatAge < targetAt ? 'A little early — try the next ring' : 'A little late — try the next ring';
      feedbackColor = '#8a603e';
    }
    feedbackTime = 1.3;
    api.score(total);
  }

  return {
    update(dt) {
      if (ended) return;
      const step = Math.min(dt, 0.1);
      elapsed += step;
      beatAge += step;
      pulse = Math.max(0, pulse - step * 2.8);
      wake = Math.max(0, wake - step * 1.5);
      feedbackTime = Math.max(0, feedbackTime - step);
      if (beatAge > targetAt + 0.31 && !used) {
        used = true;
        streak = 0;
        feedback = 'Missed that one. Breathe and try again';
        feedbackColor = '#8a603e';
        feedbackTime = 0.9;
      }
      if (beatAge >= beatLength) {
        beatAge -= beatLength;
        used = false;
      }
      if (elapsed >= duration) {
        ended = true;
        api.finish(`${perfect} perfect rings · ${hits} cozy moments. The puppy is dreaming.`);
      }
    },
    draw(ctx) {
      const cx = W / 2;
      const cy = 285;
      roundPanel(ctx, 28, 22, W - 56, 70, 22, 'rgba(255,252,234,.94)');
      ctx.fillStyle = '#3d574c';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('COZY MOMENTS', 48, 48);
      ctx.font = '700 21px system-ui, sans-serif';
      ctx.fillText(`${hits}`, 48, 73);
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.max(0, Math.ceil(duration - elapsed))}s`, W - 48, 66);
      ctx.fillStyle = '#d8e5d8';
      ctx.beginPath(); ctx.roundRect(143, 52, 160, 9, 5); ctx.fill();
      ctx.fillStyle = '#739c76';
      ctx.beginPath(); ctx.roundRect(143, 52, 160 * Math.max(0, 1 - elapsed / duration), 9, 5); ctx.fill();

      ctx.fillStyle = 'rgba(255,251,224,.83)';
      ctx.beginPath(); ctx.arc(cx, cy, 164, 0, TAU); ctx.fill();
      const drift = Math.sin(elapsed * 0.95) * 6;
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * TAU + elapsed * 0.08;
        const x = cx + Math.cos(angle) * (142 + Math.sin(elapsed + i) * 4);
        const y = cy + Math.sin(angle) * 142;
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle + elapsed * 0.1);
        ctx.fillStyle = i % 2 ? '#f5c67b' : '#8eae86';
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 8, 0.5, 0, TAU); ctx.fill(); ctx.restore();
      }
      const targetRadius = 71;
      ctx.lineWidth = 16;
      ctx.strokeStyle = 'rgba(134,177,137,.28)';
      ctx.beginPath(); ctx.arc(cx, cy, targetRadius, 0, TAU); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#648b65';
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(cx, cy, targetRadius, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      if (!used) {
        const radius = 153 - Math.min(1.73, beatAge) / targetAt * (153 - targetRadius);
        const inWindow = Math.abs(beatAge - targetAt) <= 0.13;
        ctx.lineWidth = inWindow ? 9 : 6;
        ctx.strokeStyle = inWindow ? '#e39a40' : '#5a8e93';
        ctx.shadowColor = inWindow ? '#ffc263' : '#a2c8c0';
        ctx.shadowBlur = inWindow ? 18 : 0;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(22, radius), 0, TAU); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.save();
      ctx.translate(cx, cy + 8 + drift * 0.2);
      ctx.rotate(Math.sin(elapsed * 1.6) * 0.025 + Math.sin(elapsed * 35) * wake * 0.025);
      api.drawPuppy(ctx, 0, 0, 104 + pulse * 8);
      ctx.restore();
      ctx.font = '700 23px system-ui, sans-serif';
      ctx.fillStyle = '#638372';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.55 + Math.sin(elapsed * 1.8) * 0.25;
      ctx.fillText('z', cx + 42, cy - 54 + drift);
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillText('z', cx + 65, cy - 82 + drift);
      ctx.globalAlpha = 1;
      roundPanel(ctx, 28, H - 133, W - 56, 105, 24, 'rgba(255,252,234,.95)');
      ctx.fillStyle = feedbackTime > 0 ? feedbackColor : '#334c49';
      ctx.textAlign = 'center';
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillText(feedbackTime > 0 ? feedback : 'Tap when the blue ring meets the dotted ring', cx, H - 96, W - 80);
      ctx.font = '500 14px system-ui, sans-serif';
      ctx.fillStyle = '#637568';
      ctx.fillText('Tap anywhere or press Space', cx, H - 68);
      ctx.fillStyle = '#ac874d';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillText('30 SECONDS OF SWEET LITTLE VICTORIES', cx, H - 44);
    },
    pointer(_x, _y, phase) { if (phase === 'down') tap(); },
    key(key, pressed) { if (pressed && (key === ' ' || key === 'Space' || key === 'Enter')) tap(); }
  };
}
