/* PointCast Effects visual extensions v0.1.0. Load after pointcast-effects.js. */
(function (root) {
  'use strict';
  var api = root.PointCastEffects = root.PointCastEffects || {};
  function createCandle(button, options) {
    options = options || {};
    var host = options.root || button, disposed = false;
    var lit = button.getAttribute('aria-pressed') === 'true';
    function render() { host.setAttribute('data-lit', String(lit)); button.setAttribute('aria-pressed', String(lit)); }
    function setLit(value) {
      if (disposed) return;
      var changed = lit !== Boolean(value); lit = Boolean(value); render();
      if (changed && options.onChange) options.onChange(lit);
    }
    function toggle() { setLit(!lit); }
    function dispose() { if (disposed) return; disposed = true; button.removeEventListener('click', toggle); }
    render(); button.addEventListener('click', toggle);
    return { setLit: setLit, getState: function () { return lit; }, dispose: dispose };
  }
  function createArtworkTransition(options) {
    var current = options.current, next = options.next, status = options.status;
    var doc = current.ownerDocument, serial = 0, disposed = false, pending = null, art = null;
    function notify(loading, error) {
      if (status) status.textContent = loading ? 'Loading artwork…' : error ? 'Artwork could not be loaded.' : '';
      if (options.onState) options.onState({ loading: loading, error: error || null, art: art });
    }
    function cancel() {
      serial++;
      if (pending) { clearTimeout(pending.timer); pending.resolve(false); pending = null; }
      next.classList.remove('is-visible');
    }
    function reduced() {
      if (options.reducedMotion) return Boolean(options.reducedMotion());
      var win = doc.defaultView;
      return Boolean(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function apply(image, data) { image.src = data.src; image.alt = data.alt || ''; image.title = data.title || ''; }
    async function set(data) {
      if (disposed || !data || !data.src) return null;
      cancel(); var attempt = serial;
      notify(true, null);
      var image = doc.createElement('img');
      try {
        image.src = data.src;
        if (typeof image.decode === 'function') await image.decode();
        else await new Promise(function (resolve, reject) {
          if (image.complete) { if (image.naturalWidth) resolve(); else reject(new Error('Image failed')); return; }
          image.onload = resolve; image.onerror = reject;
        });
        if (disposed || attempt !== serial) return null;
        apply(next, data);
        if (!reduced()) {
          next.classList.add('is-visible');
          var finished = await new Promise(function (resolve) {
            pending = { resolve: resolve, timer: setTimeout(function () { pending = null; resolve(true); }, 750) };
          });
          if (!finished || disposed || attempt !== serial) return null;
        }
        apply(current, data); next.classList.remove('is-visible');
        art = { src: data.src, alt: data.alt || '', title: data.title || '' };
        notify(false, null); return image;
      } catch (_) {
        if (!disposed && attempt === serial) notify(false, 'Artwork could not be loaded.');
        return null;
      }
    }
    function clear() { if (disposed) return; cancel(); notify(false, null); }
    function dispose() { if (disposed) return; cancel(); disposed = true; }
    return { set: set, clear: clear, dispose: dispose };
  }
  api.createCandle = createCandle;
  api.createArtworkTransition = createArtworkTransition;
})(typeof window !== 'undefined' ? window : globalThis);
