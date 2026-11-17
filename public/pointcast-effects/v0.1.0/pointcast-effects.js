/* PointCast Effects v0.1.0. Lifecycle adapted from pc-still-light's
 * small-shrines-audio.ts; one-shot synthesis inspired by still-light-client.ts.
 * Original procedural synthesis; no samples, network, or persistence. */
(function (root) {
  'use strict';
  var recipes = {
    bell: [[440, 2.8, .13], [880, 2.0, .055], [1321, 1.4, .025]],
    gong: [[110, 4.4, .13], [165, 3.6, .07], [277, 2.6, .035]],
    bowl: [[220, 4.0, .13], [440.6, 3.0, .05], [661.1, 2.2, .025]],
    chime: [[659.25, 2.2, .11], [988.9, 1.6, .045], [1318.5, 1.1, .02]]
  };
  function createAudio(options) {
    options = options || {};
    var doc = options.document || root.document, win = doc && doc.defaultView || root;
    var session = null, serial = 0, disposed = false, muted = false, status = 'idle';
    function publish(error) { if (options.onState) options.onState({ status: status, muted: muted, error: error || null }); }
    function hidden() { return doc && doc.visibilityState === 'hidden'; }
    function disconnect(node) { try { node.disconnect(); } catch (_) {} }
    function close(ctx) { try { var p = ctx.close(); if (p && p.catch) p.catch(function () {}); } catch (_) {} }
    function stopVoice(s, voice) {
      if (!s.voices.delete(voice)) return;
      voice.sources.forEach(function (source) { try { source.stop(); } catch (_) {} });
      voice.nodes.forEach(disconnect);
    }
    var retiring = new Set();
    function teardown(s) {
      if (s.releaseTimer) clearTimeout(s.releaseTimer);
      if (s.muteTimer) clearTimeout(s.muteTimer);
      s.releaseTimer = s.muteTimer = null;
      retiring.delete(s);
      Array.from(s.voices).forEach(function (v) { stopVoice(s, v); });
      if (s.master) disconnect(s.master); if (s.compressor) disconnect(s.compressor); close(s.ctx);
    }
    function fade(s) {
      var gain = s.master.gain, now = s.ctx.currentTime;
      // Hold the current automated gain when supported, then reach zero in 30ms.
      if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
      else { gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now); }
      gain.linearRampToValueAtTime(0, now + .03);
    }
    function clear(immediate) {
      serial++;
      var s = session; session = null;
      if (!s) return;
      if (s.cancel) s.cancel();
      if (s.stateListener && s.ctx.removeEventListener) s.ctx.removeEventListener('statechange', s.stateListener);
      if (s.timeout) clearTimeout(s.timeout);
      if (s.muteTimer) { clearTimeout(s.muteTimer); s.muteTimer = null; }
      if (!immediate && s.master && s.ctx.state === 'running' && s.voices.size) {
        try {
          fade(s); retiring.add(s);
          s.releaseTimer = setTimeout(function () { teardown(s); }, 40);
          return;
        } catch (_) {}
      }
      teardown(s);
    }
    function flushRetiring() { Array.from(retiring).forEach(teardown); }
    function stop() { if (disposed) return; clear(false); status = 'idle'; publish(); }
    function fail(message) { clear(true); status = 'error'; publish(message); }
    function volume() {
      if (!session || !session.master || session.muteTimer) return;
      var gain = session.master.gain, now = session.ctx.currentTime;
      gain.cancelScheduledValues(now);
      gain.setTargetAtTime(muted || hidden() ? 0 : .28, now, .025);
    }
    async function enable() {
      if (disposed || hidden()) return false;
      flushRetiring(); clear(true); var attempt = serial, s;
      status = 'starting'; publish();
      try {
        var Audio = win.AudioContext || win.webkitAudioContext;
        var ctx = options.contextFactory ? options.contextFactory() : Audio ? new Audio() : null;
        if (!ctx) { fail('Sound is unavailable.'); return false; }
        s = { ctx: ctx, master: null, compressor: null, voices: new Set(), cancel: null, timeout: null, stateListener: null };
        session = s;
        var master = ctx.createGain(); s.master = master; master.gain.value = 0;
        s.compressor = ctx.createDynamicsCompressor();
        s.compressor.threshold.value = -18; s.compressor.knee.value = 12; s.compressor.ratio.value = 5;
        s.compressor.attack.value = .005; s.compressor.release.value = .25;
        master.connect(s.compressor); s.compressor.connect(ctx.destination);
        // Resume synchronously in the caller's gesture before the first await.
        var ready = ctx.state === 'running' ? Promise.resolve(true) : Promise.resolve(ctx.resume()).then(function () { return true; });
        var cancelled = new Promise(function (resolve) { s.cancel = function () { resolve(false); }; });
        var timeout = new Promise(function (resolve) { s.timeout = setTimeout(function () { resolve(false); }, 2500); });
        var running = await Promise.race([ready, cancelled, timeout]);
        clearTimeout(s.timeout); s.timeout = null; s.cancel = null;
        if (attempt !== serial || session !== s || disposed) return false;
        if (hidden()) { stop(); return false; }
        if (!running || ctx.state !== 'running') { fail('Sound did not start. Try again.'); return false; }
        s.stateListener = function () {
          if (session === s && status === 'ready' && ctx.state !== 'running') fail('Sound was interrupted. Try again.');
        };
        if (ctx.addEventListener) ctx.addEventListener('statechange', s.stateListener);
        status = 'ready'; volume(); publish(); return true;
      } catch (_) {
        if (attempt === serial && !disposed) fail('Sound did not start. Try again.');
        return false;
      }
    }
    function setMuted(value) {
      if (disposed) return;
      muted = Boolean(value);
      var s = session;
      if (muted && s && s.master && s.ctx.state === 'running' && s.voices.size && !s.muteTimer) {
        try {
          fade(s);
          s.muteTimer = setTimeout(function () {
            s.muteTimer = null;
            Array.from(s.voices).forEach(function (v) { stopVoice(s, v); });
            if (session === s) volume();
          }, 40);
        } catch (_) { Array.from(s.voices).forEach(function (v) { stopVoice(s, v); }); volume(); }
      } else volume();
      publish();
    }
    function ring(family) {
      var s = session, recipe = recipes[family];
      if (!recipe || !s || disposed || muted || hidden() || s.muteTimer || status !== 'ready' || s.ctx.state !== 'running') return false;
      // Cap whole strikes, rather than individual partials.
      while (s.voices.size >= 3) stopVoice(s, s.voices.values().next().value);
      var voice = { sources: [], nodes: [], remaining: recipe.length }, now = s.ctx.currentTime;
      s.voices.add(voice);
      try {
        recipe.forEach(function (part) {
          var osc = s.ctx.createOscillator(), gain = s.ctx.createGain();
          voice.sources.push(osc); voice.nodes.push(osc, gain);
          osc.type = 'sine'; osc.frequency.setValueAtTime(part[0], now);
          gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(part[2], now + .02);
          gain.gain.exponentialRampToValueAtTime(.0001, now + part[1]);
          osc.connect(gain); gain.connect(s.master);
          osc.addEventListener('ended', function () { if (--voice.remaining === 0 && s.voices.delete(voice)) voice.nodes.forEach(disconnect); }, { once: true });
          osc.start(now); osc.stop(now + part[1] + .05);
        });
        return true;
      } catch (_) { stopVoice(s, voice); return false; }
    }
    function visibility() { if (hidden()) { flushRetiring(); clear(true); status = 'idle'; publish(); } }
    function pagehide() { flushRetiring(); clear(true); status = 'idle'; publish(); }
    function dispose() {
      if (disposed) return;
      flushRetiring(); clear(true); disposed = true; status = 'disposed';
      if (doc) doc.removeEventListener('visibilitychange', visibility);
      if (win && win.removeEventListener) win.removeEventListener('pagehide', pagehide);
      publish();
    }
    if (doc) doc.addEventListener('visibilitychange', visibility);
    if (win && win.addEventListener) win.addEventListener('pagehide', pagehide);
    return { enable: enable, setMuted: setMuted, mute: function () { setMuted(true); }, ring: ring, stop: stop, dispose: dispose };
  }
  function createRipple(surface, options) {
    options = options || {};
    var doc = surface.ownerDocument, active = new Set(), disposed = false;
    function remove(item) { if (!active.delete(item)) return; clearTimeout(item.timer); item.node.removeEventListener('animationend', item.end); item.node.remove(); }
    function trigger(event) {
      if (disposed) return false;
      var rect = surface.getBoundingClientRect(), keyboard = !event || event.type === 'keydown' || typeof event.clientX !== 'number';
      var x = keyboard ? rect.width / 2 : event.clientX - rect.left, y = keyboard ? rect.height / 2 : event.clientY - rect.top;
      x = Math.max(0, Math.min(rect.width, x)); y = Math.max(0, Math.min(rect.height, y));
      if (options.onRipple) options.onRipple({ x: x, y: y, originalEvent: event || null });
      var win = doc.defaultView;
      var reduced = options.reducedMotion ? options.reducedMotion() : Boolean(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (reduced) { Array.from(active).forEach(remove); return true; }
      while (active.size >= 3) remove(active.values().next().value);
      var node = doc.createElement('span'); node.className = 'pointcast-ripple'; node.setAttribute('aria-hidden', 'true');
      node.style.left = x + 'px'; node.style.top = y + 'px';
      var item = { node: node, timer: null, end: null };
      item.end = function (e) { if (e.target === node) remove(item); };
      node.addEventListener('animationend', item.end); active.add(item); surface.appendChild(node);
      item.timer = setTimeout(function () { remove(item); }, 1600);
      return true;
    }
    function pointer(e) { if (e.button === undefined || e.button === 0) trigger(e); }
    function keyboard(e) { if (!e.repeat && (e.key === 'Enter' || e.key === ' ')) { if (e.key === ' ' && e.preventDefault) e.preventDefault(); trigger(e); } }
    surface.addEventListener('pointerdown', pointer); surface.addEventListener('keydown', keyboard);
    function clearRipples() { Array.from(active).forEach(remove); }
    function dispose() { if (disposed) return; disposed = true; surface.removeEventListener('pointerdown', pointer); surface.removeEventListener('keydown', keyboard); clearRipples(); }
    return { trigger: trigger, clear: clearRipples, dispose: dispose };
  }
  root.PointCastEffects = { version: '0.1.0', createAudio: createAudio, createRipple: createRipple };
})(typeof window !== 'undefined' ? window : globalThis);
