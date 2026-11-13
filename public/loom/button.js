/*
 * "Post to the Loom" button for any page, on any site. One line:
 *
 *   <script src="https://pointcast.xyz/loom/button.js" data-to="#officenoun" async></script>
 *
 * data-to     optional Loom address (#topic, @handle, a URL). Default: the page's canonical link, else its origin + path (never the query or hash).
 * data-label  optional button text. Default: "Post to the Loom".
 *
 * Renders a small link button beside the script tag (shadow root, textContent
 * only) that opens https://pointcast.xyz/loom?to=<address>&compose=1#thread in a new tab.
 */
(() => {
  const script = document.currentScript;
  if (!script || !script.parentNode) return;
  const ORIGIN = 'https://pointcast.xyz';
  const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
  let to = clean(script.getAttribute('data-to'), 420);
  if (!to) {
    // Never the query string or hash: prefer the page's canonical link, else origin + path.
    try {
      const c = document.querySelector('link[rel~="canonical"]');
      const u = new URL((c && c.getAttribute('href')) || location.href, location.href);
      to = u.origin + u.pathname;
    } catch { to = location.origin + location.pathname; }
  }
  const label = clean(script.getAttribute('data-label'), 40) || 'Post to the Loom';
  const host = document.createElement('span');
  host.setAttribute('data-pointcast-loom-button', '');
  host.style.display = 'inline-block';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host{--ink:#141311;--paper:#fbf8f0;--a:#d23c1e}
    @media (prefers-color-scheme:dark){:host{--ink:#f3eee2;--paper:#1b1a17;--a:#ff7a5c}}
    a{display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;min-height:36px;padding:6px 12px;border:2px solid var(--ink);background:var(--paper);color:var(--ink);box-shadow:3px 3px 0 var(--ink);font:600 14px/1.2 system-ui,-apple-system,'Segoe UI',Arial,sans-serif;text-decoration:none;cursor:pointer}
    a:hover{box-shadow:1px 1px 0 var(--ink);transform:translate(2px,2px)}
    a:focus-visible{outline:3px solid var(--a);outline-offset:2px}
    i{font-style:normal;color:var(--a)}
  `;
  const a = document.createElement('a');
  a.href = `${ORIGIN}/loom?to=${encodeURIComponent(to)}&compose=1#thread`;
  a.target = '_blank';
  a.rel = 'noopener';
  const mark = document.createElement('i');
  mark.textContent = '+';
  mark.setAttribute('aria-hidden', 'true');
  a.append(mark, document.createTextNode(label));
  root.append(style, a);
  script.parentNode.insertBefore(host, script.nextSibling);
})();
