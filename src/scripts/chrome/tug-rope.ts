// @ts-nocheck
export function mountTugRope(root, scope) {
    const { on, setTimeout, clearTimeout, setInterval, clearInterval } = scope;
    const IntersectionObserver = function (callback, options) {
      return scope.observe(callback, options);
    };
    'use strict';

    var $pull = root.querySelector('[data-pc-ref="pc-tug-pull"]');
    var $human = root.querySelector('[data-pc-ref="pc-tug-human"]');
    var $machine = root.querySelector('[data-pc-ref="pc-tug-machine"]');
    var $read = root.querySelector('[data-pc-ref="pc-tug-read"]');
    if (!$pull) return;

    // These three must match the worker (workers/presence/src/index.ts).
    // The client only mirrors them so your own pull moves under your
    // finger before the round trip lands; the server is always truth.
    var HALF_LIFE_MS = 90000; // TUG_HALF_LIFE_MS
    var HUMAN_PULL = 0.04; // TUG_HUMAN_PULL

    var POLL_MS = 6000; // visible cadence
    var HIDDEN_POLL_MS = 30000; // retain a quiet pulse for a background tab
    var TAP_FLOOR_MS = 220; // local throttle; the DO rate-limits for real
    var SID_KEY = 'pc:room:sid'; // same visitor id the cursor room uses
    var DEAD_ZONE = 0.02; // below this the rope simply reads slack

    var knot = 0;
    var knotAt = Date.now();
    var humanPulls = 0;
    var machinePulls = 0;
    var lastTap = 0;
    var lastRead = 'the rope is slack';
    var pollTimer = null;
    var paintTimer = null;
    var inViewport = false;

    function sid() {
      try {
        var s = localStorage.getItem(SID_KEY);
        if (s) return s;
        s = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : 's-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SID_KEY, s);
        return s;
      } catch (e) {
        return 's-' + Date.now().toString(36);
      }
    }

    function fmt(n) {
      try { return Number(n).toLocaleString('en-US'); }
      catch (e) { return String(n); }
    }

    // Same lazy decay the worker does — the rope slackens by half every
    // ninety seconds of quiet, computed from the clock, never ticked.
    function decayed(now) {
      if (!knot) return 0;
      var d = knot * Math.pow(0.5, (now - knotAt) / HALF_LIFE_MS);
      return Math.abs(d) < 0.0005 ? 0 : d;
    }

    function paint() {
      var now = Date.now();
      var k = Math.max(-1, Math.min(1, decayed(now)));
      // −1 → 4%, 0 → 50%, +1 → 96%. The knot never reaches the posts.
      root.style.setProperty('--tug-pos', (50 + k * 46).toFixed(2) + '%');
      var lead = k < -DEAD_ZONE ? 'people' : k > DEAD_ZONE ? 'machines' : 'slack';
      root.setAttribute('data-lead', lead);
      if ($human) $human.textContent = fmt(humanPulls);
      if ($machine) $machine.textContent = fmt(machinePulls);
      var read = lead === 'people' ? 'people have it'
        : lead === 'machines' ? 'machines have it'
        : 'the rope is slack';
      // Only speak when the reading actually changes — a live region
      // that narrates every poll is a nuisance, not an affordance.
      if ($read && read !== lastRead) {
        $read.textContent = read;
        lastRead = read;
      }
    }

    function adopt(tug) {
      if (!tug || typeof tug !== 'object') return;
      if (typeof tug.humanPulls === 'number') humanPulls = tug.humanPulls;
      if (typeof tug.machinePulls === 'number') machinePulls = tug.machinePulls;
      if (typeof tug.knot === 'number') {
        // The server hands back a knot already decayed to its own now,
        // so we restamp it against ours and carry on decaying locally.
        knot = Math.max(-1, Math.min(1, tug.knot));
        knotAt = Date.now();
      }
      paint();
    }

    function read() {
      fetch('/api/tug', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.tug) adopt(d.tug); })
        .catch(function () { /* network blip — the next poll tries again */ });
    }

    function pull() {
      var now = Date.now();
      if (now - lastTap < TAP_FLOOR_MS) return;
      lastTap = now;

      // Optimistic: move the knot under the finger immediately. If the
      // DO refuses (rate limit) its response carries the true rope and
      // adopt() puts everything back where it belongs.
      // Swap to the short transition BEFORE moving the knot — a pull is
      // a shove, not the slow drift back to centre.
      root.setAttribute('data-pulled', 'people');
      knot = Math.max(-1, Math.min(1, decayed(now) - HUMAN_PULL));
      knotAt = now;
      humanPulls += 1;
      paint();
      setTimeout(function () { root.removeAttribute('data-pulled'); }, 260);

      fetch('/api/tug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side: 'human', by: sid() }),
        cache: 'no-store',
      })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.tug) adopt(d.tug); })
        .catch(function () {});
    }

    on($pull, 'click', pull);

    function schedulePoll(immediate) {
      if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      if (!inViewport) return;
      var delay = document.hidden ? HIDDEN_POLL_MS : POLL_MS;
      if (immediate) read();
      pollTimer = setTimeout(function tick() {
        read();
        schedulePoll(false);
      }, delay);
    }
    function start() {
      schedulePoll(true);
      // Repaint at 1 Hz so the drift back to centre is visible without
      // a network round trip. The CSS transition smooths the steps.
      if (!document.hidden && !paintTimer) paintTimer = setInterval(paint, 1000);
    }
    function stop() {
      if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      if (paintTimer) { clearInterval(paintTimer); paintTimer = null; }
    }

    on(document, 'visibilitychange', function () {
      if (!inViewport) { stop(); return; }
      if (document.hidden) {
        if (paintTimer) { clearInterval(paintTimer); paintTimer = null; }
        schedulePoll(false);
      } else start();
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        inViewport = !!(entries[0] && entries[0].isIntersecting);
        if (inViewport) start();
        else stop();
      }, { threshold: 0.01 });
      observer.observe(root);
    } else {
      inViewport = true;
      start();
    }
    scope.cleanup(function () {
      stop();
      root.removeAttribute('data-pulled');
    });
}
