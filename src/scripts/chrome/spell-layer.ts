// @ts-nocheck
export function mountSpellLayer($layer, scope) {
    const {
      on, setTimeout, clearTimeout, setInterval, clearInterval,
      requestAnimationFrame, cancelAnimationFrame,
    } = scope;
    'use strict';

    // Track active companions/ambient so "clear" can wipe them.
    var active = { byId: {}, bursts: 0 };

    function reduce() {
      try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    }

    // ─── confetti (burst) ───────────────────────────────────────
    function castConfetti(durationMs) {
      if (reduce()) return; // no animation in reduced-motion mode
      var palette = ['#d4a437', '#4A9EFF', '#c4952e', '#fdf2d6', '#8a2432', '#2f8f5f'];
      var count = 36;
      for (var i = 0; i < count; i++) {
        var d = document.createElement('span');
        d.className = 'spell-confetti';
        var size = 6 + Math.floor(Math.random() * 8);
        var startX = Math.random() * window.innerWidth;
        var driftX = (Math.random() - 0.5) * 240;
        var rotateStart = Math.floor(Math.random() * 360);
        var rotateEnd = rotateStart + 360 + Math.floor(Math.random() * 720);
        var fallTime = (durationMs || 4500) - Math.floor(Math.random() * 600);
        d.style.cssText =
          'left:' + startX + 'px;' +
          'top:-' + size + 'px;' +
          'width:' + size + 'px;' +
          'height:' + Math.floor(size * 0.6) + 'px;' +
          'background:' + palette[Math.floor(Math.random() * palette.length)] + ';' +
          'transform:rotate(' + rotateStart + 'deg);' +
          'animation:spell-confetti-fall ' + fallTime + 'ms cubic-bezier(.32,.4,.6,1) forwards;' +
          '--spell-drift-x:' + driftX + 'px;' +
          '--spell-rotate-end:' + rotateEnd + 'deg;';
        $layer.appendChild(d);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, fallTime + 100);
        })(d);
      }
    }

    // ─── dock burst pulse (site-wide, ephemeral) ──────────────────────
    // Starts at the dock, expands in the event's channel colour, then leaves
    // no DOM behind. Reduced-motion visitors get the ticker but no pulse.
    function castBurstPulse(color) {
      if (reduce()) return;
      var safeColor = /^#[0-9a-f]{6}$/i.test(String(color || '')) ? color : '#185fa5';
      var pulse = document.createElement('span');
      pulse.className = 'spell-burst-pulse';
      pulse.style.setProperty('--spell-burst-color', safeColor);
      $layer.appendChild(pulse);
      active.bursts++;
      setTimeout(function () {
        if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
        active.bursts = Math.max(0, active.bursts - 1);
      }, 950);
    }

    // ─── cat (companion) ────────────────────────────────────────
    function castCat(durationMs) {
      // One cat at a time — recasting sends the existing one off.
      if (active.byId.cat) {
        var prev = active.byId.cat;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var cat = document.createElement('button');
      cat.className = 'spell-cat';
      cat.type = 'button';
      cat.setAttribute('aria-label', 'A walking cat. Click to send away.');
      cat.title = 'click to send the cat home';
      cat.textContent = '🐈';
      // 60% chance left-to-right, 40% right-to-left (whim).
      var ltr = Math.random() < 0.6;
      cat.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 60000);
      // Scale walk speed to viewport width — keep ~80px/s feel.
      var walkSeconds = Math.max(8, Math.min(30, window.innerWidth / 80));
      cat.style.cssText =
        'animation:spell-cat-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite;';
      on(cat, 'click', function () {
        if (cat.parentNode) cat.parentNode.removeChild(cat);
        active.byId.cat = null;
      });
      $layer.appendChild(cat);
      active.byId.cat = cat;
      // Auto-dismiss after duration so it doesn't loop forever.
      setTimeout(function () {
        if (cat && cat.parentNode) cat.parentNode.removeChild(cat);
        if (active.byId.cat === cat) active.byId.cat = null;
      }, dur);
    }

    // ─── breath (ambient) ───────────────────────────────────────
    // 4-7-8 breathing — inhale 4s, hold 7s, exhale 8s. Cycle ~19s.
    function castBreath() {
      if (active.byId.breath) return; // toggle via dismiss
      var b = document.createElement('div');
      b.className = 'spell-breath';
      b.setAttribute('role', 'button');
      b.setAttribute('aria-label', 'Breathing circle, 4-7-8 rhythm. Click to dismiss.');
      b.tabIndex = 0;
      b.innerHTML =
        '<div class="spell-breath__ring" aria-hidden="true"></div>' +
        '<div class="spell-breath__inner" aria-hidden="true"></div>' +
        '<p class="spell-breath__cue mono" data-pc-ref="pc-spell-breath-cue">breathe in · 4</p>';
      on(b, 'click', dismissBreath);
      on(b, 'keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismissBreath(); }
      });
      $layer.appendChild(b);
      active.byId.breath = b;
      // Cue cycle so the user knows the phase even with reduce-motion.
      var phases = [
        { text: 'breathe in · 4',  ms: 4000 },
        { text: 'hold · 7',        ms: 7000 },
        { text: 'breathe out · 8', ms: 8000 },
      ];
      var idx = 0;
      var $cue = b.querySelector('[data-pc-ref="pc-spell-breath-cue"]');
      function advance() {
        if (!active.byId.breath) return;
        if ($cue) $cue.textContent = phases[idx].text;
        idx = (idx + 1) % phases.length;
        active.byId.breathTimer = setTimeout(advance, phases[(idx + 2) % 3].ms);
      }
      advance();
    }
    function dismissBreath() {
      var b = active.byId.breath;
      if (!b) return;
      if (active.byId.breathTimer) { clearTimeout(active.byId.breathTimer); active.byId.breathTimer = 0; }
      if (b.parentNode) b.parentNode.removeChild(b);
      active.byId.breath = null;
    }

    // ─── candle (ambient) ───────────────────────────────────────
    function castCandle() {
      if (active.byId.candle) return;
      var c = document.createElement('button');
      c.className = 'spell-candle';
      c.type = 'button';
      c.setAttribute('aria-label', 'A lit candle. Click to snuff out.');
      c.title = 'click to snuff out';
      c.innerHTML =
        '<span class="spell-candle__flame" aria-hidden="true">🔥</span>' +
        '<span class="spell-candle__body" aria-hidden="true">🕯️</span>';
      on(c, 'click', function () {
        if (c.parentNode) c.parentNode.removeChild(c);
        active.byId.candle = null;
      });
      $layer.appendChild(c);
      active.byId.candle = c;
    }

    // ─── pup (companion) ────────────────────────────────────────
    // Like cat but bouncier — see the @keyframes spell-pup-walk-* CSS
    // for the small vertical hop on each step. Tail-wag is a separate
    // micro-animation on the glyph.
    function castPup(durationMs) {
      if (active.byId.pup) {
        var prev = active.byId.pup;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var pup = document.createElement('button');
      pup.className = 'spell-pup';
      pup.type = 'button';
      pup.setAttribute('aria-label', 'A walking puppy. Click to send home.');
      pup.title = 'click to send the pup home';
      pup.textContent = '🐶';
      var ltr = Math.random() < 0.5;
      pup.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 50000);
      var walkSeconds = Math.max(7, Math.min(22, window.innerWidth / 110));
      pup.style.cssText =
        'animation:spell-pup-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-pup-bounce 0.42s ease-in-out infinite;';
      on(pup, 'click', function () {
        if (pup.parentNode) pup.parentNode.removeChild(pup);
        active.byId.pup = null;
      });
      $layer.appendChild(pup);
      active.byId.pup = pup;
      setTimeout(function () {
        if (pup && pup.parentNode) pup.parentNode.removeChild(pup);
        if (active.byId.pup === pup) active.byId.pup = null;
      }, dur);
    }

    // ─── penguin (companion) ────────────────────────────────────
    // Slow waddle — long step time + side-to-side rock applied via the
    // wobble keyframe. Penguin doesn't pause; he just keeps going.
    function castPenguin(durationMs) {
      if (active.byId.penguin) {
        var prev2 = active.byId.penguin;
        if (prev2 && prev2.parentNode) prev2.parentNode.removeChild(prev2);
      }
      var pen = document.createElement('button');
      pen.className = 'spell-penguin';
      pen.type = 'button';
      pen.setAttribute('aria-label', 'A waddling penguin. Click to send home.');
      pen.title = 'click to send the penguin home';
      pen.textContent = '🐧';
      var ltr = Math.random() < 0.5;
      pen.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 70000);
      // Penguin walks slower than cat or pup — ~50px/s.
      var walkSeconds = Math.max(14, Math.min(40, window.innerWidth / 50));
      pen.style.cssText =
        'animation:spell-penguin-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-penguin-wobble 0.7s ease-in-out infinite;';
      on(pen, 'click', function () {
        if (pen.parentNode) pen.parentNode.removeChild(pen);
        active.byId.penguin = null;
      });
      $layer.appendChild(pen);
      active.byId.penguin = pen;
      setTimeout(function () {
        if (pen && pen.parentNode) pen.parentNode.removeChild(pen);
        if (active.byId.penguin === pen) active.byId.penguin = null;
      }, dur);
    }

    // ─── rain (ambient) ─────────────────────────────────────────
    // 80 light blue pixel-rain streaks fall continuously. Implemented
    // as a single overlay div with N child spans on randomized
    // animation delays, each a slim translucent line. Click to dismiss.
    function castRain() {
      if (active.byId.rain) return;
      var rain = document.createElement('button');
      rain.className = 'spell-rain';
      rain.type = 'button';
      rain.setAttribute('aria-label', 'Pixel rain overlay. Click to dismiss.');
      rain.title = 'click to clear the rain';
      var html = '';
      for (var i = 0; i < 80; i++) {
        var leftPct = Math.random() * 100;
        var delay = (Math.random() * 1.6).toFixed(2);
        var dur = (1.2 + Math.random() * 1.2).toFixed(2);
        var len = 14 + Math.floor(Math.random() * 14);
        var op = (0.35 + Math.random() * 0.35).toFixed(2);
        html += '<span class="spell-rain__drop" style="' +
          'left:' + leftPct + '%;' +
          'height:' + len + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          'opacity:' + op + ';' +
          '"></span>';
      }
      rain.innerHTML = html;
      on(rain, 'click', function () {
        if (rain.parentNode) rain.parentNode.removeChild(rain);
        active.byId.rain = null;
      });
      $layer.appendChild(rain);
      active.byId.rain = rain;
    }

    // ─── starfield (ambient) ────────────────────────────────────
    // Slow-twinkling stars at random positions. Each star is a small
    // dot with a soft box-shadow + opacity-pulse animation on staggered
    // delay. ~60 stars across the viewport.
    function castStarfield() {
      if (active.byId.starfield) return;
      var sky = document.createElement('button');
      sky.className = 'spell-starfield';
      sky.type = 'button';
      sky.setAttribute('aria-label', 'Starfield overlay. Click to dismiss.');
      sky.title = 'click to dim the stars';
      var html = '';
      for (var j = 0; j < 60; j++) {
        var x = (Math.random() * 100).toFixed(1);
        var y = (Math.random() * 100).toFixed(1);
        var size = (1 + Math.random() * 2).toFixed(1);
        var delay = (Math.random() * 4).toFixed(2);
        var dur = (3 + Math.random() * 4).toFixed(2);
        html += '<span class="spell-starfield__star" style="' +
          'left:' + x + '%;' +
          'top:' + y + '%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          '></span>';
      }
      sky.innerHTML = html;
      on(sky, 'click', function () {
        if (sky.parentNode) sky.parentNode.removeChild(sky);
        active.byId.starfield = null;
      });
      $layer.appendChild(sky);
      active.byId.starfield = sky;
    }

    // ─── firework (burst) ───────────────────────────────────────
    // Three staggered bursts at random viewport positions. Each burst
    // spawns 22 sparks that shoot radially outward and fade. Pure CSS
    // custom-property trick: compute dx/dy in JS, animate in CSS.
    function castFirework(durationMs) {
      if (reduce()) return;
      var colors = ['#d4a437', '#4A9EFF', '#c4952e', '#fdf2d6', '#8a2432', '#2f8f5f', '#a78bfa'];
      function fireBurst(delay) {
        setTimeout(function () {
          var cx = 10 + Math.random() * 80; // vw
          var cy = 10 + Math.random() * 55; // vh
          var sparkCount = 22;
          for (var i = 0; i < sparkCount; i++) {
            var s = document.createElement('span');
            s.className = 'spell-firework-spark';
            var angleRad = (i / sparkCount) * 2 * Math.PI;
            var dist = 55 + Math.random() * 80;
            var dx = (Math.cos(angleRad) * dist).toFixed(1);
            var dy = (Math.sin(angleRad) * dist).toFixed(1);
            var color = colors[Math.floor(Math.random() * colors.length)];
            var sparkDur = 700 + Math.floor(Math.random() * 600);
            s.style.cssText =
              'left:' + cx + 'vw;' +
              'top:' + cy + 'vh;' +
              'background:' + color + ';' +
              '--spell-fw-dx:' + dx + 'px;' +
              '--spell-fw-dy:' + dy + 'px;' +
              'animation:spell-firework-spark-fly ' + sparkDur + 'ms ease-out forwards;';
            $layer.appendChild(s);
            active.bursts++;
            (function (el) {
              setTimeout(function () {
                if (el && el.parentNode) el.parentNode.removeChild(el);
                active.bursts = Math.max(0, active.bursts - 1);
              }, sparkDur + 100);
            })(s);
          }
        }, delay);
      }
      fireBurst(0);
      fireBurst(600);
      fireBurst(1300);
    }

    // ─── fish (companion) ────────────────────────────────────────
    // Glides smoothly at ~60px/s with a gentle vertical bob. Calmer
    // than cat or pup — ease-in-out swim, unhurried.
    function castFish(durationMs) {
      if (active.byId.fish) {
        var prev = active.byId.fish;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var fish = document.createElement('button');
      fish.className = 'spell-fish';
      fish.type = 'button';
      fish.setAttribute('aria-label', 'A fish gliding by. Click to let it swim away.');
      fish.title = 'click to release the fish';
      fish.textContent = '🐟';
      var ltr = Math.random() < 0.5;
      fish.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 45000);
      var swimSeconds = Math.max(10, Math.min(28, window.innerWidth / 60));
      fish.style.cssText =
        'animation:spell-fish-swim-' + (ltr ? 'ltr' : 'rtl') + ' ' + swimSeconds + 's ease-in-out infinite,' +
        'spell-fish-bob 2.4s ease-in-out infinite;';
      on(fish, 'click', function () {
        if (fish.parentNode) fish.parentNode.removeChild(fish);
        active.byId.fish = null;
      });
      $layer.appendChild(fish);
      active.byId.fish = fish;
      setTimeout(function () {
        if (fish && fish.parentNode) fish.parentNode.removeChild(fish);
        if (active.byId.fish === fish) active.byId.fish = null;
      }, dur);
    }

    // ─── moth (companion) ────────────────────────────────────────
    // Flies mid-screen height (not bottom like cat/pup) with an erratic
    // vertical flutter that mimics being drawn toward a light source.
    function castMoth(durationMs) {
      if (active.byId.moth) {
        var prev = active.byId.moth;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var moth = document.createElement('button');
      moth.className = 'spell-moth';
      moth.type = 'button';
      moth.setAttribute('aria-label', 'A moth fluttering by. Click to send it on.');
      moth.title = 'click to send the moth on';
      moth.textContent = '🦋';
      var ltr = Math.random() < 0.5;
      moth.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 55000);
      var flySeconds = Math.max(10, Math.min(30, window.innerWidth / 70));
      moth.style.cssText =
        'animation:spell-moth-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-moth-flutter 0.55s ease-in-out infinite;';
      on(moth, 'click', function () {
        if (moth.parentNode) moth.parentNode.removeChild(moth);
        active.byId.moth = null;
      });
      $layer.appendChild(moth);
      active.byId.moth = moth;
      setTimeout(function () {
        if (moth && moth.parentNode) moth.parentNode.removeChild(moth);
        if (active.byId.moth === moth) active.byId.moth = null;
      }, dur);
    }

    // ─── snow (ambient) ──────────────────────────────────────────
    // 60 soft white flakes, each with a random size, fall speed, and
    // lateral drift. Negative animation-delay puts each flake mid-fall
    // on cast so the screen fills immediately.
    function castSnow() {
      if (active.byId.snow) return;
      var snow = document.createElement('button');
      snow.className = 'spell-snow';
      snow.type = 'button';
      snow.setAttribute('aria-label', 'Snowfall overlay. Click to dismiss.');
      snow.title = 'click to stop the snow';
      var html = '';
      for (var i = 0; i < 60; i++) {
        var leftPct = (Math.random() * 100).toFixed(1);
        var delay = (Math.random() * 8).toFixed(2);
        var dur = (5 + Math.random() * 7).toFixed(2);
        var size = (4 + Math.random() * 5).toFixed(1);
        var drift = ((Math.random() - 0.5) * 70).toFixed(1);
        var op = (0.5 + Math.random() * 0.4).toFixed(2);
        html += '<span class="spell-snow__flake" style="' +
          'left:' + leftPct + '%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'animation-delay:-' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          'opacity:' + op + ';' +
          '--spell-snow-drift:' + drift + 'px;' +
          '"></span>';
      }
      snow.innerHTML = html;
      on(snow, 'click', function () {
        if (snow.parentNode) snow.parentNode.removeChild(snow);
        active.byId.snow = null;
      });
      $layer.appendChild(snow);
      active.byId.snow = snow;
    }

    // ─── shout (burst) ───────────────────────────────────────────
    // Typographic burst: punctuation fans radially from viewport center.
    // Reuses the firework dx/dy CSS-custom-prop trick on text nodes.
    function castShout(durationMs) {
      if (reduce()) return;
      var chars = ['!', '!', '?', '!!', '!', '?!', '!', '!!', '!', '?', '!', '!!', '!', '?', '!'];
      var count = 15;
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.className = 'spell-shout-char';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 80 + Math.random() * 120;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var dur = (durationMs || 2200) - Math.floor(Math.random() * 400);
        var fontSize = 16 + Math.floor(Math.random() * 22);
        s.textContent = chars[i % chars.length];
        s.style.cssText =
          'left:50vw;top:45vh;font-size:' + fontSize + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          'animation:spell-shout-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(s);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(s);
      }
    }

    // ─── wave (burst) ────────────────────────────────────────────
    // 14 hands stagger across the screen L→R with a delay ramp —
    // gives the classic stadium-wave ripple effect.
    function castWave(durationMs) {
      if (reduce()) return;
      var count = 14;
      var dur = durationMs || 3000;
      for (var i = 0; i < count; i++) {
        var w = document.createElement('span');
        w.className = 'spell-wave-hand';
        w.textContent = '👋';
        var leftPct = (i / (count - 1)) * 88 + 6;
        var bottomPct = 18 + Math.random() * 16;
        var delay = Math.round((i / count) * 550);
        var waveDur = 1100 + Math.floor(Math.random() * 300);
        w.style.cssText =
          'left:' + leftPct.toFixed(1) + '%;bottom:' + bottomPct.toFixed(1) + '%;' +
          'animation:spell-wave-appear ' + waveDur + 'ms ease-in-out ' + delay + 'ms forwards;';
        $layer.appendChild(w);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(w);
      }
    }

    // ─── firefly (companion) ─────────────────────────────────────
    // A single glowing dot drifts at a random height (30–70vh) on a
    // slow ease-in-out path. The glow child pulses independently.
    function castFirefly(durationMs) {
      if (active.byId.firefly) {
        var prev = active.byId.firefly;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var fly = document.createElement('button');
      fly.className = 'spell-firefly';
      fly.type = 'button';
      fly.setAttribute('aria-label', 'A firefly drifting by. Click to release it.');
      fly.title = 'click to release the firefly';
      fly.innerHTML = '<span class="spell-firefly__glow" aria-hidden="true"></span>';
      var ltr = Math.random() < 0.5;
      fly.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 40000;
      var heightPct = (30 + Math.random() * 40).toFixed(1);
      var driftSeconds = Math.max(12, Math.min(35, window.innerWidth / 40));
      fly.style.cssText =
        'bottom:' + heightPct + 'vh;' +
        'animation:spell-firefly-drift-' + (ltr ? 'ltr' : 'rtl') + ' ' + driftSeconds + 's ease-in-out infinite;';
      on(fly, 'click', function () {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        active.byId.firefly = null;
      });
      $layer.appendChild(fly);
      active.byId.firefly = fly;
      setTimeout(function () {
        if (fly && fly.parentNode) fly.parentNode.removeChild(fly);
        if (active.byId.firefly === fly) active.byId.firefly = null;
      }, dur);
    }

    // ─── chimes (ambient) ────────────────────────────────────────
    // 5 metallic pipes hang from the top-right corner. Each sways at
    // a slightly different period — staggered delays vary the rhythm.
    function castChimes() {
      if (active.byId.chimes) return;
      var ch = document.createElement('button');
      ch.className = 'spell-chimes';
      ch.type = 'button';
      ch.setAttribute('aria-label', 'Wind chimes. Click to still them.');
      ch.title = 'click to still the chimes';
      var lengths = [62, 48, 72, 54, 68];
      var html = '';
      for (var i = 0; i < 5; i++) {
        var delay = (i * 0.38 + Math.random() * 0.25).toFixed(2);
        var pipeDur = (1.9 + Math.random() * 1.4).toFixed(2);
        html += '<span class="spell-chimes__pipe" style="' +
          'height:' + lengths[i] + 'px;' +
          'animation-delay:' + delay + 's;' +
          'animation-duration:' + pipeDur + 's;' +
          '"></span>';
      }
      ch.innerHTML = html;
      on(ch, 'click', function () {
        if (ch.parentNode) ch.parentNode.removeChild(ch);
        active.byId.chimes = null;
      });
      $layer.appendChild(ch);
      active.byId.chimes = ch;
    }

    // ─── bloom (burst) ───────────────────────────────────────────
    // Flowers scatter radially from viewport center — reuses the
    // firework dx/dy custom-prop trick on emoji text nodes.
    function castBloom(durationMs) {
      if (reduce()) return;
      var flowers = ['🌸', '🌺', '🌼', '🌻', '🌷', '🌸', '🌼', '🌺', '🌸', '🌻', '🌷', '🌼', '🌸', '🌺'];
      var count = 14;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-bloom-petal';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 60 + Math.random() * 110;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rot = (-120 + Math.floor(Math.random() * 240));
        var dur = (durationMs || 2800) - Math.floor(Math.random() * 400);
        var size = 20 + Math.floor(Math.random() * 16);
        b.textContent = flowers[i % flowers.length];
        b.style.cssText =
          'left:50vw;top:45vh;font-size:' + size + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-bloom-rot:' + rot + 'deg;' +
          'animation:spell-bloom-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(b);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(b);
      }
    }

    // ─── aurora (ambient) ────────────────────────────────────────
    // Color bands (green / teal / purple) drift slowly across the top
    // of the viewport — pure CSS pseudo-element gradients, no canvas.
    function castAurora() {
      if (active.byId.aurora) return;
      var a = document.createElement('button');
      a.className = 'spell-aurora';
      a.type = 'button';
      a.setAttribute('aria-label', 'Aurora overlay. Click to dismiss.');
      a.title = 'click to dim the aurora';
      on(a, 'click', function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        active.byId.aurora = null;
      });
      $layer.appendChild(a);
      active.byId.aurora = a;
    }

    // ─── here (ambient) ──────────────────────────────────────────
    // A pulsing location beacon centered on screen — two concentric
    // ripple rings radiate outward from a 📍 glyph. Click to dismiss.
    function castHere() {
      if (active.byId.here) return;
      var h = document.createElement('button');
      h.className = 'spell-here';
      h.type = 'button';
      h.setAttribute('aria-label', 'You are here. Click to dismiss.');
      h.title = 'click to dismiss';
      h.innerHTML =
        '<span class="spell-here__ring spell-here__ring--1" aria-hidden="true"></span>' +
        '<span class="spell-here__ring spell-here__ring--2" aria-hidden="true"></span>' +
        '<span class="spell-here__pin" aria-hidden="true">📍</span>';
      on(h, 'click', function () {
        if (h.parentNode) h.parentNode.removeChild(h);
        active.byId.here = null;
      });
      $layer.appendChild(h);
      active.byId.here = h;
    }

    // ─── mood (ambient) ──────────────────────────────────────────
    // A slowly hue-rotating color orb bottom-left. Cycles through the
    // full spectrum every ~20s — no words, just vibe. Click to dismiss.
    function castMood() {
      if (active.byId.mood) return;
      var m = document.createElement('button');
      m.className = 'spell-mood';
      m.type = 'button';
      m.setAttribute('aria-label', 'Mood orb. Click to dismiss.');
      m.title = 'click to dismiss';
      on(m, 'click', function () {
        if (m.parentNode) m.parentNode.removeChild(m);
        active.byId.mood = null;
      });
      $layer.appendChild(m);
      active.byId.mood = m;
    }

    // ─── bubble (burst) ──────────────────────────────────────────
    // 18 iridescent circles float upward from a random bottom band
    // and pop (scale + fade) at staggered heights. Each bubble gets
    // a random lateral drift — the overall feel is champagne-cork gentle.
    function castBubble(durationMs) {
      if (reduce()) return;
      var count = 18;
      var dur = durationMs || 3200;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-bubble';
        var size = 10 + Math.floor(Math.random() * 22);
        var startX = 5 + Math.random() * 90; // vw
        var drift = ((Math.random() - 0.5) * 80).toFixed(1);
        var rise = Math.floor(dur * (0.6 + Math.random() * 0.4));
        var delay = Math.floor(Math.random() * (dur * 0.3));
        b.style.cssText =
          'left:' + startX + 'vw;' +
          'bottom:8%;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          '--spell-bubble-drift:' + drift + 'px;' +
          'animation:spell-bubble-rise ' + rise + 'ms ease-in ' + delay + 'ms forwards;';
        $layer.appendChild(b);
        active.bursts++;
        (function (el, t, d) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, t + d + 100);
        })(b, rise, delay);
      }
    }

    // ─── dice (burst) ─────────────────────────────────────────────
    // 6 dice scatter radially from viewport center, each tumbling
    // (rotate) as they fly. Reuses the firework dx/dy custom-prop trick.
    function castDice(durationMs) {
      if (reduce()) return;
      var faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      var count = 6;
      var dur = durationMs || 2500;
      for (var i = 0; i < count; i++) {
        var d = document.createElement('span');
        d.className = 'spell-dice-face';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 70 + Math.random() * 90;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rot = (-180 + Math.floor(Math.random() * 360));
        var faceDur = dur - Math.floor(Math.random() * 300);
        var size = 22 + Math.floor(Math.random() * 14);
        d.textContent = faces[i];
        d.style.cssText =
          'left:50vw;top:45vh;font-size:' + size + 'px;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-dice-rot:' + rot + 'deg;' +
          'animation:spell-dice-tumble ' + faceDur + 'ms ease-out forwards;';
        $layer.appendChild(d);
        active.bursts++;
        (function (el, t) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, t + 100);
        })(d, faceDur);
      }
    }

    // ─── bee (companion) ──────────────────────────────────────────
    // A bee crosses the screen at ~55vh height with an erratic zigzag
    // flutter — rapid vertical oscillation overlaid on the horizontal
    // walk. Faster than moth, more purposeful (it has somewhere to be).
    function castBee(durationMs) {
      if (active.byId.bee) {
        var prev = active.byId.bee;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var bee = document.createElement('button');
      bee.className = 'spell-bee';
      bee.type = 'button';
      bee.setAttribute('aria-label', 'A busy bee. Click to shoo it away.');
      bee.title = 'click to shoo the bee';
      bee.textContent = '🐝';
      var ltr = Math.random() < 0.5;
      bee.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 35000;
      var flySeconds = Math.max(8, Math.min(22, window.innerWidth / 75));
      bee.style.cssText =
        'animation:spell-bee-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-bee-zigzag 0.28s ease-in-out infinite;';
      on(bee, 'click', function () {
        if (bee.parentNode) bee.parentNode.removeChild(bee);
        active.byId.bee = null;
      });
      $layer.appendChild(bee);
      active.byId.bee = bee;
      setTimeout(function () {
        if (bee && bee.parentNode) bee.parentNode.removeChild(bee);
        if (active.byId.bee === bee) active.byId.bee = null;
      }, dur);
    }

    // ─── fog (ambient) ────────────────────────────────────────────
    // 8 translucent wisps drift laterally across the bottom quarter of
    // the viewport at different speeds and opacity. The combined effect
    // reads as low morning mist. Click anywhere on the overlay to lift.
    function castFog() {
      if (active.byId.fog) return;
      var fog = document.createElement('button');
      fog.className = 'spell-fog';
      fog.type = 'button';
      fog.setAttribute('aria-label', 'Fog overlay. Click to lift the mist.');
      fog.title = 'click to lift the fog';
      var html = '';
      var wispCount = 8;
      for (var i = 0; i < wispCount; i++) {
        var heightPct = (12 + Math.random() * 22).toFixed(1);
        var widthPct = (90 + Math.random() * 40).toFixed(1);
        var opacity = (0.12 + Math.random() * 0.2).toFixed(2);
        var driftDir = Math.random() < 0.5 ? 'ltr' : 'rtl';
        var driftDur = (18 + Math.random() * 20).toFixed(1);
        var delay = (Math.random() * 8).toFixed(2);
        html += '<span class="spell-fog__wisp" style="' +
          'height:' + heightPct + 'vh;' +
          'width:' + widthPct + '%;' +
          'opacity:' + opacity + ';' +
          'animation:spell-fog-drift-' + driftDir + ' ' + driftDur + 's ease-in-out ' + delay + 's infinite alternate;' +
          '"></span>';
      }
      fog.innerHTML = html;
      on(fog, 'click', function () {
        if (fog.parentNode) fog.parentNode.removeChild(fog);
        active.byId.fog = null;
      });
      $layer.appendChild(fog);
      active.byId.fog = fog;
    }

    // ─── balloon (burst) ─────────────────────────────────────────
    // 10 balloons float up from the bottom, each drifting laterally.
    // Uses translateY so the starting position (bottom:-60px) stays
    // correct without animating `bottom` directly.
    function castBalloon(durationMs) {
      if (reduce()) return;
      var count = 10;
      for (var i = 0; i < count; i++) {
        var b = document.createElement('span');
        b.className = 'spell-balloon';
        var startX = Math.random() * (window.innerWidth - 40) + 20;
        var drift = ((Math.random() - 0.5) * 180).toFixed(1);
        var size = 28 + Math.floor(Math.random() * 20);
        var dur = (durationMs || 4200) - Math.floor(Math.random() * 900);
        var delay = Math.floor(Math.random() * 500);
        b.style.cssText =
          'left:' + startX + 'px;' +
          'font-size:' + size + 'px;' +
          '--spell-balloon-drift:' + drift + 'px;' +
          'animation-duration:' + dur + 'ms;' +
          'animation-delay:' + delay + 'ms;';
        b.textContent = '🎈';
        $layer.appendChild(b);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + delay + 100);
        })(b);
      }
    }

    // ─── turtle (companion) ──────────────────────────────────────
    // Slowest companion — ~30px/s. The charm is in the patience.
    // Gentle head-nod (small vertical) on a separate slow cycle.
    function castTurtle(durationMs) {
      if (active.byId.turtle) {
        var prevT = active.byId.turtle;
        if (prevT && prevT.parentNode) prevT.parentNode.removeChild(prevT);
      }
      var tur = document.createElement('button');
      tur.className = 'spell-turtle';
      tur.type = 'button';
      tur.setAttribute('aria-label', 'A slow turtle. Click to let it be.');
      tur.title = 'click to let the turtle be';
      tur.textContent = '🐢';
      var ltr = Math.random() < 0.5;
      tur.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 90000;
      var walkSeconds = Math.max(22, Math.min(60, window.innerWidth / 28));
      tur.style.cssText =
        'animation:spell-turtle-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-turtle-nod' + (ltr ? '' : '-rtl') + ' 2.4s ease-in-out infinite;';
      on(tur, 'click', function () {
        if (tur.parentNode) tur.parentNode.removeChild(tur);
        active.byId.turtle = null;
      });
      $layer.appendChild(tur);
      active.byId.turtle = tur;
      setTimeout(function () {
        if (tur && tur.parentNode) tur.parentNode.removeChild(tur);
        if (active.byId.turtle === tur) active.byId.turtle = null;
      }, dur);
    }

    // ─── ghost (companion) ───────────────────────────────────────
    // Friendly 👻 drifts at mid-screen height (35–65vh from bottom)
    // with a slow sinusoidal float. Translucent, non-threatening.
    function castGhost(durationMs) {
      if (active.byId.ghost) {
        var prevG = active.byId.ghost;
        if (prevG && prevG.parentNode) prevG.parentNode.removeChild(prevG);
      }
      var g = document.createElement('button');
      g.className = 'spell-ghost';
      g.type = 'button';
      g.setAttribute('aria-label', 'A friendly ghost drifting by. Click to send it on.');
      g.title = 'click to send the ghost on';
      g.textContent = '👻';
      var ltr = Math.random() < 0.5;
      g.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 50000;
      var flySeconds = Math.max(12, Math.min(36, window.innerWidth / 58));
      var heightPct = (35 + Math.random() * 30).toFixed(1);
      g.style.cssText =
        'bottom:' + heightPct + 'vh;' +
        'animation:spell-ghost-fly-' + (ltr ? 'ltr' : 'rtl') + ' ' + flySeconds + 's linear infinite,' +
        'spell-ghost-float' + (ltr ? '' : '-rtl') + ' 3.2s ease-in-out infinite;';
      on(g, 'click', function () {
        if (g.parentNode) g.parentNode.removeChild(g);
        active.byId.ghost = null;
      });
      $layer.appendChild(g);
      active.byId.ghost = g;
      setTimeout(function () {
        if (g && g.parentNode) g.parentNode.removeChild(g);
        if (active.byId.ghost === g) active.byId.ghost = null;
      }, dur);
    }

    // ─── campfire (ambient) ──────────────────────────────────────
    // Two overlaid flame glyphs + a log + a radial glow ellipse.
    // Sits bottom-left (distinct from candle at bottom-right).
    // Recasting is a no-op while active.
    function castCampfire() {
      if (active.byId.campfire) return;
      var cf = document.createElement('button');
      cf.className = 'spell-campfire';
      cf.type = 'button';
      cf.setAttribute('aria-label', 'A campfire. Click to put it out.');
      cf.title = 'click to put out the fire';
      cf.innerHTML =
        '<span class="spell-campfire__glow" aria-hidden="true"></span>' +
        '<span class="spell-campfire__flame spell-campfire__flame--side" aria-hidden="true">🔥</span>' +
        '<span class="spell-campfire__flame spell-campfire__flame--main" aria-hidden="true">🔥</span>' +
        '<span class="spell-campfire__log" aria-hidden="true">🪵</span>';
      on(cf, 'click', function () {
        if (cf.parentNode) cf.parentNode.removeChild(cf);
        active.byId.campfire = null;
      });
      $layer.appendChild(cf);
      active.byId.campfire = cf;
    }

    // ─── spark (burst) ───────────────────────────────────────────
    // 24 thin bright streaks fan radially from a random viewport point —
    // like striking a flint. Each streak is a 2×12 rect rotated to align
    // with its travel direction, using the fw dx/dy custom-prop pattern.
    function castSpark(durationMs) {
      if (reduce()) return;
      var count = 24;
      var cx = (12 + Math.random() * 76).toFixed(1); // vw
      var cy = (15 + Math.random() * 55).toFixed(1); // vh
      for (var i = 0; i < count; i++) {
        var s = document.createElement('span');
        s.className = 'spell-spark';
        var angle = (i / count) * 2 * Math.PI;
        var dist = 35 + Math.random() * 90;
        var dx = (Math.cos(angle) * dist).toFixed(1);
        var dy = (Math.sin(angle) * dist).toFixed(1);
        var rotateDeg = Math.round(angle * 180 / Math.PI + 90);
        var dur = 500 + Math.floor(Math.random() * 600);
        s.style.cssText =
          'left:' + cx + 'vw;top:' + cy + 'vh;' +
          '--spell-fw-dx:' + dx + 'px;--spell-fw-dy:' + dy + 'px;' +
          '--spell-spark-rot:' + rotateDeg + 'deg;' +
          'animation:spell-spark-fly ' + dur + 'ms ease-out forwards;';
        $layer.appendChild(s);
        active.bursts++;
        (function (el) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, dur + 100);
        })(s);
      }
    }

    // ─── frog (companion) ─────────────────────────────────────────
    // Hops across the bottom in parabolic arcs — a separate hop keyframe
    // overlays on the horizontal walk, same composition as pup's bounce.
    // Avg ~60px/s, hops about every 0.9s. The charm is the airtime.
    function castFrog(durationMs) {
      if (active.byId.frog) {
        var prevFr = active.byId.frog;
        if (prevFr && prevFr.parentNode) prevFr.parentNode.removeChild(prevFr);
      }
      var frog = document.createElement('button');
      frog.className = 'spell-frog';
      frog.type = 'button';
      frog.setAttribute('aria-label', 'A hopping frog. Click to let it leap away.');
      frog.title = 'click to let the frog hop away';
      frog.textContent = '🐸';
      var ltr = Math.random() < 0.5;
      frog.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = durationMs || 35000;
      var walkSeconds = Math.max(10, Math.min(30, window.innerWidth / 60));
      frog.style.cssText =
        'animation:spell-frog-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite,' +
        'spell-frog-hop 0.9s cubic-bezier(.4,0,.6,1) infinite;';
      on(frog, 'click', function () {
        if (frog.parentNode) frog.parentNode.removeChild(frog);
        active.byId.frog = null;
      });
      $layer.appendChild(frog);
      active.byId.frog = frog;
      setTimeout(function () {
        if (frog && frog.parentNode) frog.parentNode.removeChild(frog);
        if (active.byId.frog === frog) active.byId.frog = null;
      }, dur);
    }

    // ─── leaves (ambient) ─────────────────────────────────────────
    // 25 leaf emoji spin and drift down the viewport. Like snow but the
    // fall keyframe also rotates each leaf — spin baked in proportionally
    // to fall distance. Negative delay puts leaves mid-fall on cast.
    function castLeaves() {
      if (active.byId.leaves) return;
      var lv = document.createElement('button');
      lv.className = 'spell-leaves';
      lv.type = 'button';
      lv.setAttribute('aria-label', 'Falling leaves overlay. Click to dismiss.');
      lv.title = 'click to clear the leaves';
      var glyphs = ['🍂', '🍁', '🍂', '🍁', '🌿', '🍂', '🍁'];
      var html = '';
      for (var i = 0; i < 25; i++) {
        var leftPct = (Math.random() * 106 - 3).toFixed(1);
        var delay = (Math.random() * 11).toFixed(2);
        var dur = (7 + Math.random() * 8).toFixed(2);
        var size = 13 + Math.floor(Math.random() * 13);
        var drift = ((Math.random() - 0.5) * 200).toFixed(1);
        var spin = Math.random() < 0.5 ? 360 : -360;
        var glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        html += '<span class="spell-leaves__leaf" style="' +
          'left:' + leftPct + '%;' +
          'font-size:' + size + 'px;' +
          'animation-delay:-' + delay + 's;' +
          'animation-duration:' + dur + 's;' +
          '--spell-leaves-drift:' + drift + 'px;' +
          '--spell-leaves-spin:' + spin + 'deg;' +
          '">' + glyph + '</span>';
      }
      lv.innerHTML = html;
      on(lv, 'click', function () {
        if (lv.parentNode) lv.parentNode.removeChild(lv);
        active.byId.leaves = null;
      });
      $layer.appendChild(lv);
      active.byId.leaves = lv;
    }

    // ─── lantern (ambient) ────────────────────────────────────────
    // A paper lantern in the top-left corner — fills the last open corner
    // (candle=BR, chimes=TR, campfire=BL). Swings on its hang-point via
    // transform-origin at the top-center. Warm glow via drop-shadow.
    function castLantern() {
      if (active.byId.lantern) return;
      var l = document.createElement('button');
      l.className = 'spell-lantern';
      l.type = 'button';
      l.setAttribute('aria-label', 'A paper lantern. Click to extinguish.');
      l.title = 'click to extinguish';
      l.textContent = '🏮';
      on(l, 'click', function () {
        if (l.parentNode) l.parentNode.removeChild(l);
        active.byId.lantern = null;
      });
      $layer.appendChild(l);
      active.byId.lantern = l;
    }

    // ─── dispatch ───────────────────────────────────────────────

    // ─── nouns: noun (companion) ────────────────────────────────
    // A random Noun (seed 0–1199, matching Visit Nouns FA2) walks
    // across the bottom. Same shape as cat/pup but uses the live
    // noun.pics SVG instead of an emoji glyph.
    function castNoun(durationMs) {
      if (active.byId.noun) {
        var prev = active.byId.noun;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var seed = Math.floor(Math.random() * 1200);
      var n = document.createElement('button');
      n.className = 'spell-noun';
      n.type = 'button';
      n.setAttribute('aria-label', 'A walking Noun. Click to send home.');
      n.title = 'click to send the noun home · seed ' + seed;
      n.innerHTML = '<img src="https://noun.pics/' + seed + '.svg" alt="" width="56" height="56" />';
      var ltr = Math.random() < 0.6;
      n.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 60000);
      var walkSeconds = Math.max(10, Math.min(34, window.innerWidth / 70));
      n.style.cssText = 'animation:spell-noun-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite;';
      on(n, 'click', function () {
        if (n.parentNode) n.parentNode.removeChild(n);
        active.byId.noun = null;
      });
      $layer.appendChild(n);
      active.byId.noun = n;
      setTimeout(function () {
        if (n && n.parentNode) n.parentNode.removeChild(n);
        if (active.byId.noun === n) active.byId.noun = null;
      }, dur);
    }

    // ─── nouns: noggles (burst) ─────────────────────────────────
    // Inline pixel-art SVG of the iconic noggles. Eight at random
    // y-offsets fly left-to-right across the screen.
    function castNoggles(durationMs) {
      if (reduce()) return;
      var nogglesSvg =
        '<svg viewBox="0 0 80 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' +
          '<rect x="0" y="0" width="32" height="32" fill="#fff" stroke="#000" stroke-width="4"/>' +
          '<rect x="48" y="0" width="32" height="32" fill="#fff" stroke="#000" stroke-width="4"/>' +
          '<rect x="32" y="12" width="16" height="6" fill="#000"/>' +
          '<rect x="12" y="10" width="6" height="14" fill="#d63c5e"/>' +
          '<rect x="60" y="10" width="6" height="14" fill="#d63c5e"/>' +
        '</svg>';
      var count = 8;
      for (var i = 0; i < count; i++) {
        var n = document.createElement('span');
        n.className = 'spell-noggles';
        var size = 60 + Math.floor(Math.random() * 40);
        var startY = 40 + Math.random() * (window.innerHeight - 160);
        var travel = window.innerWidth + size + 80;
        var dur = (durationMs || 5500) + Math.floor(Math.random() * 800);
        var delay = Math.floor(Math.random() * 1200);
        n.innerHTML = nogglesSvg;
        n.style.cssText =
          'left:-' + (size + 20) + 'px;' +
          'top:' + startY + 'px;' +
          'width:' + size + 'px;' +
          'height:' + Math.floor(size * 0.4) + 'px;' +
          'animation:spell-noggles-fly ' + dur + 'ms cubic-bezier(.2,.6,.4,1) ' + delay + 'ms forwards;' +
          '--spell-noggles-x:' + travel + 'px;';
        $layer.appendChild(n);
        active.bursts++;
        (function (el, totalMs) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, totalMs + 100);
        })(n, dur + delay);
      }
    }

    // ─── nouns: proliferate (burst) ─────────────────────────────
    // Twelve mini Noun SVGs scatter outward from screen center,
    // spinning + fading. Visual echo of Nouns proliferation.
    function castProliferate(durationMs) {
      if (reduce()) return;
      var count = 12;
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      for (var i = 0; i < count; i++) {
        var seed = Math.floor(Math.random() * 1200);
        var n = document.createElement('span');
        n.className = 'spell-proliferate';
        var size = 28 + Math.floor(Math.random() * 16);
        var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        var distance = 220 + Math.random() * 240;
        var dx = Math.cos(angle) * distance;
        var dy = Math.sin(angle) * distance;
        var rotate = (Math.random() - 0.5) * 720;
        var dur = (durationMs || 4200) - Math.floor(Math.random() * 600);
        n.innerHTML = '<img src="https://noun.pics/' + seed + '.svg" alt="" width="' + size + '" height="' + size + '" />';
        n.style.cssText =
          'left:' + (cx - size / 2) + 'px;' +
          'top:' + (cy - size / 2) + 'px;' +
          'width:' + size + 'px;' +
          'height:' + size + 'px;' +
          'animation:spell-proliferate-out ' + dur + 'ms cubic-bezier(.2,.7,.3,1) forwards;' +
          '--spell-prolif-dx:' + dx + 'px;' +
          '--spell-prolif-dy:' + dy + 'px;' +
          '--spell-prolif-rot:' + rotate + 'deg;';
        $layer.appendChild(n);
        active.bursts++;
        (function (el, totalMs) {
          setTimeout(function () {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            active.bursts = Math.max(0, active.bursts - 1);
          }, totalMs + 100);
        })(n, dur);
      }
    }

    // ─── nouns: lilnoun (companion) ─────────────────────────────
    // Smaller Noun, faster bouncier walk. Lil Nouns nod.
    function castLilnoun(durationMs) {
      if (active.byId.lilnoun) {
        var prev = active.byId.lilnoun;
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      }
      var seed = Math.floor(Math.random() * 1200);
      var l = document.createElement('button');
      l.className = 'spell-lilnoun';
      l.type = 'button';
      l.setAttribute('aria-label', 'A bouncy lil Noun. Click to send home.');
      l.title = 'click to send the lil noun home · seed ' + seed;
      l.innerHTML = '<img src="https://noun.pics/' + seed + '.svg" alt="" width="36" height="36" />';
      var ltr = Math.random() < 0.6;
      l.setAttribute('data-dir', ltr ? 'ltr' : 'rtl');
      var dur = (durationMs || 45000);
      var walkSeconds = Math.max(7, Math.min(20, window.innerWidth / 100));
      l.style.cssText = 'animation:spell-lilnoun-walk-' + (ltr ? 'ltr' : 'rtl') + ' ' + walkSeconds + 's linear infinite;';
      on(l, 'click', function () {
        if (l.parentNode) l.parentNode.removeChild(l);
        active.byId.lilnoun = null;
      });
      $layer.appendChild(l);
      active.byId.lilnoun = l;
      setTimeout(function () {
        if (l && l.parentNode) l.parentNode.removeChild(l);
        if (active.byId.lilnoun === l) active.byId.lilnoun = null;
      }, dur);
    }

    function castSpell(id) {
      switch (id) {
        case 'confetti':  castConfetti(4500); break;
        case 'cat':       castCat(60000); break;
        case 'pup':       castPup(50000); break;
        case 'penguin':   castPenguin(70000); break;
        case 'breath':    castBreath(); break;
        case 'candle':    castCandle(); break;
        case 'rain':      castRain(); break;
        case 'starfield': castStarfield(); break;
        case 'firework':  castFirework(3500); break;
        case 'fish':      castFish(45000); break;
        case 'moth':      castMoth(55000); break;
        case 'snow':      castSnow(); break;
        case 'shout':     castShout(2200); break;
        case 'wave':      castWave(3000); break;
        case 'firefly':   castFirefly(40000); break;
        case 'chimes':    castChimes(); break;
        case 'bloom':     castBloom(2800); break;
        case 'aurora':    castAurora(); break;
        case 'here':      castHere(); break;
        case 'mood':      castMood(); break;
        case 'bubble':    castBubble(3200); break;
        case 'dice':      castDice(2500); break;
        case 'bee':       castBee(35000); break;
        case 'fog':       castFog(); break;
        case 'balloon':   castBalloon(4200); break;
        case 'turtle':    castTurtle(90000); break;
        case 'ghost':     castGhost(50000); break;
        case 'campfire':  castCampfire(); break;
        case 'spark':     castSpark(2000); break;
        case 'frog':      castFrog(35000); break;
        case 'leaves':    castLeaves(); break;
        case 'lantern':   castLantern(); break;
        case 'noun':         castNoun(60000); break;
        case 'noggles':      castNoggles(5500); break;
        case 'proliferate':  castProliferate(4200); break;
        case 'lilnoun':      castLilnoun(45000); break;
        default:
          // Unknown spell — silent no-op; could surface a toast in the
          // bar but spells are meant to be playful, so we just ignore.
          try { console.info('[spell] unknown:', id); } catch (e) {}
      }
    }

    function clearAll() {
      // Kill all ambients/companions — bursts time out on their own.
      Object.keys(active.byId).forEach(function (k) {
        var el = active.byId[k];
        if (el && el.parentNode) el.parentNode.removeChild(el);
        active.byId[k] = null;
      });
      if (active.byId.breathTimer) { clearTimeout(active.byId.breathTimer); active.byId.breathTimer = 0; }
    }

    on(window, 'pc:spell:cast', function (e) {
      var id = e && e.detail && e.detail.id;
      if (id) castSpell(id);
    });
    on(window, 'pc:spell:clear', clearAll);
    on(window, 'pc:burst', function (e) {
      var burst = e && e.detail;
      if (!burst || !burst.kind) return;
      var meta = burst.meta || {};
      castBurstPulse(meta.color);
      if (burst.kind === 'mint') castConfetti(3600);
      else if (burst.kind === 'ping-answered') castCat(16000);
      else if (burst.kind === 'cast' && /^(confetti|rain|cat|breath)$/.test(String(meta.spell || ''))) {
        castSpell(meta.spell);
      }
    });
    scope.cleanup(function () {
      clearAll();
      $layer.replaceChildren();
      active.bursts = 0;
    });
}
