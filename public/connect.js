/*!
 * Sign in with PointCast · connect.js v1
 * A login for the small web that does not track people.
 *
 *   <script src="https://pointcast.xyz/connect.js" defer></script>
 *   <button data-pointcast-connect data-scope="card">Continue with PointCast</button>
 *   <script>
 *     document.addEventListener('pointcast:connected', (e) => console.log(e.detail.card));
 *   </script>
 *
 * Or call it yourself:  const who = await PointCast.connect({ scope: ['card', 'wallet'] });
 *
 * Nothing to register: your site's origin is its name. The person sees what
 * you will get and says yes; you get a one-time code, traded here for a
 * snapshot { sub, card, wallet? }. `sub` is stable for your site and differs
 * on every other site. There is no ongoing access and no token to keep.
 *
 * Trust: a result traded in the browser is only as trustworthy as the
 * browser. If your server needs to trust it, pass { exchange: false }, send
 * the returned code to your server, and have it POST { code, client } to
 * https://pointcast.xyz/api/connect/token itself.
 */
(function () {
  'use strict';
  if (window.PointCast && window.PointCast.version) return;
  var script = document.currentScript;
  var BASE = 'https://pointcast.xyz';
  try { if (script && script.src) BASE = new URL(script.src).origin; } catch (e) { /* default */ }
  var CLIENT = location.origin;
  // Pending sign-ins, keyed by state. localStorage (not sessionStorage) because
  // some browsers open the consent "popup" as a fresh tab that comes back here.
  var STATE_KEY = 'pointcast:connect:pending';
  var STATE_TTL = 10 * 60 * 1000;
  function pending() {
    try { var all = JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); return all && typeof all === 'object' ? all : {}; } catch (e) { return {}; }
  }
  function savePending(all) {
    var now = Date.now(), keep = {};
    Object.keys(all).forEach(function (k) { if (all[k] && now - all[k].at < STATE_TTL) keep[k] = all[k]; });
    try { localStorage.setItem(STATE_KEY, JSON.stringify(keep)); } catch (e) { /* state check will fail closed */ }
  }

  function rand() {
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function scopeOf(opts) {
    var s = opts && opts.scope;
    return (Array.isArray(s) ? s : String(s || 'card').split(/[\s,+]+/)).filter(Boolean).join(' ');
  }
  function consentUrl(opts, state, mode, redirect) {
    var u = new URL('/connect', BASE);
    u.searchParams.set('client', CLIENT);
    u.searchParams.set('scope', scopeOf(opts));
    u.searchParams.set('state', state);
    u.searchParams.set('mode', mode);
    if (redirect) u.searchParams.set('redirect_uri', redirect);
    return u.toString();
  }
  function exchange(code) {
    return fetch(BASE + '/api/connect/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      body: JSON.stringify({ code: code, client: CLIENT }),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || !j.ok) throw new Error(j.error || 'PointCast could not complete the sign-in.');
        return j;
      });
    });
  }
  function backUrl(opts) { return (opts && opts.redirectUri) || location.href.split('#')[0]; }
  function remember(state, opts) {
    var all = pending(); all[state] = { exchange: opts.exchange !== false, at: Date.now() }; savePending(all);
  }
  function forget(state) { var all = pending(); delete all[state]; savePending(all); }
  function redirectTo(opts) {
    var state = rand();
    remember(state, opts);
    location.assign(consentUrl(opts, state, 'redirect', backUrl(opts)));
    return new Promise(function () { /* the page is leaving */ });
  }

  /** Open the consent window. Resolves with the identity (or { code, state } when exchange is false). */
  function connect(opts) {
    opts = opts || {};
    if (opts.mode === 'redirect') return redirectTo(opts);
    var state = rand();
    // In-app browsers often open "popups" in the same tab. The consent screen
    // then has no opener and comes back here by redirect instead, so keep the
    // state and a return address ready either way.
    remember(state, opts);
    var w = window.open(consentUrl(opts, state, 'popup', backUrl(opts)), 'pointcast-connect', 'popup,width=460,height=720');
    if (!w) return redirectTo(opts);
    return new Promise(function (resolve, reject) {
      var done = false;
      function finish(err, value) {
        if (done) return; done = true; forget(state);
        window.removeEventListener('message', onMessage); clearInterval(timer);
        try { w.close(); } catch (e) { /* already closed */ }
        err ? reject(err) : resolve(value);
      }
      function onMessage(ev) {
        if (ev.origin !== BASE || !ev.data || ev.data.type !== 'pointcast:connect' || ev.data.state !== state) return;
        if (ev.data.error) return finish(new Error(ev.data.error === 'denied' ? 'The person said no.' : ev.data.error));
        if (opts.exchange === false) return finish(null, { code: ev.data.code, state: state, client: CLIENT });
        exchange(ev.data.code).then(function (id) { finish(null, id); }, finish);
      }
      window.addEventListener('message', onMessage);
      var timer = setInterval(function () { if (w.closed) setTimeout(function () { finish(new Error('The PointCast window was closed.')); }, 400); }, 500);
    });
  }

  /** After a redirect-mode sign-in, call on load. Resolves with the identity or null. */
  function handleRedirect() {
    var u = new URL(location.href);
    var code = u.searchParams.get('pc_code'), state = u.searchParams.get('pc_state'), error = u.searchParams.get('pc_error');
    if (!code && !error) return Promise.resolve(null);
    var all = pending(), saved = state && all[state];
    if (state) forget(state);
    ['pc_code', 'pc_state', 'pc_error'].forEach(function (k) { u.searchParams.delete(k); });
    history.replaceState(history.state, '', u.toString());
    if (!saved || Date.now() - saved.at > STATE_TTL) return Promise.reject(new Error('This sign-in did not start on this site, so it was ignored.'));
    if (error) return Promise.reject(new Error(error === 'denied' ? 'The person said no.' : error));
    return saved.exchange ? exchange(code) : Promise.resolve({ code: code, state: state, client: CLIENT });
  }

  function wire(el) {
    if (el.dataset.pointcastWired) return; el.dataset.pointcastWired = '1';
    if (!el.textContent.trim()) el.textContent = 'Continue with PointCast';
    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      var opts = { scope: el.getAttribute('data-scope') || 'card', mode: el.getAttribute('data-mode') || undefined, exchange: el.getAttribute('data-exchange') !== 'false' };
      el.setAttribute('aria-busy', 'true');
      connect(opts).then(function (id) {
        el.dispatchEvent(new CustomEvent('pointcast:connected', { bubbles: true, detail: id }));
      }, function (err) {
        el.dispatchEvent(new CustomEvent('pointcast:error', { bubbles: true, detail: { message: err.message } }));
      }).then(function () { el.removeAttribute('aria-busy'); });
    });
  }
  function wireAll() { document.querySelectorAll('[data-pointcast-connect]').forEach(wire); }

  window.PointCast = { version: '1', base: BASE, connect: connect, handleRedirect: handleRedirect, exchange: exchange, wire: wireAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireAll); else wireAll();
  handleRedirect().then(function (id) {
    if (id) document.dispatchEvent(new CustomEvent('pointcast:connected', { detail: id }));
  }, function (err) {
    document.dispatchEvent(new CustomEvent('pointcast:error', { detail: { message: err.message } }));
  });
})();
