(function () {
  'use strict';

  var source = document.currentScript;
  var networkOrigin = source && source.src
    ? new URL(source.src, window.location.href).origin
    : 'https://pointcast.xyz';
  var inventoryUrl = networkOrigin + '/ads.json';
  var metricsUrl = networkOrigin + '/api/ad-metrics';
  var inventoryPromise;

  function trackingDisabled() {
    try {
      return navigator.doNotTrack === '1' || localStorage.getItem('pc:no-track') === '1';
    } catch (_) {
      return navigator.doNotTrack === '1';
    }
  }

  function words(value) {
    return String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }

  function hash(value) {
    var result = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function loadInventory() {
    if (!inventoryPromise) {
      inventoryPromise = fetch(inventoryUrl, {
        mode: 'cors',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
      }).then(function (response) {
        if (!response.ok) throw new Error('inventory ' + response.status);
        return response.json();
      });
    }
    return inventoryPromise;
  }

  function publisherForMount(feed, mount) {
    var configured = mount.dataset.publisher || 'unknown';
    var publishers = feed && feed.network && Array.isArray(feed.network.publishers)
      ? feed.network.publishers
      : [];
    if (configured === 'common-hours' && /^\/rally(?:\/|$)/.test(window.location.pathname)) {
      if (publishers.some(function (publisher) { return publisher.id === 'rally'; })) return 'rally';
    }
    return configured;
  }

  function selectCreative(feed, mount, publisherId) {
    var publishers = feed && feed.network && Array.isArray(feed.network.publishers)
      ? feed.network.publishers
      : [];
    var publisher = publishers.find(function (entry) { return entry.id === publisherId; });
    var aliases = new Set((publisher && publisher.advertiserAliases || []).map(function (entry) {
      return entry.toLowerCase();
    }));
    var candidates = (Array.isArray(feed.campaigns) ? feed.campaigns : []).filter(function (ad) {
      return ad && ad.status === 'house' && !aliases.has(String(ad.advertiser || '').toLowerCase());
    });
    if (!candidates.length) return null;

    var context = new Set(words([
      window.location.hostname,
      window.location.pathname,
      mount.dataset.context || '',
    ].join(' ')));
    var day = new Date().toISOString().slice(0, 10);
    var placement = mount.dataset.placement || 'site-footer';
    var seed = [publisherId, window.location.pathname, placement, day].join('|');

    return candidates.map(function (ad) {
      var matchScore = (Array.isArray(ad.contexts) ? ad.contexts : []).reduce(function (score, item) {
        return score + (context.has(String(item).toLowerCase()) ? 20 : 0);
      }, 0);
      return { ad: ad, score: matchScore + (hash(seed + '|' + ad.id) % 17) };
    }).sort(function (left, right) {
      return right.score - left.score || String(left.ad.id).localeCompare(String(right.ad.id));
    })[0].ad;
  }

  function destinationFor(ad, publisherId, placement) {
    var destination = new URL(ad.href, networkOrigin + '/');
    if (destination.protocol !== 'https:' && destination.origin !== window.location.origin) return null;
    destination.searchParams.set('utm_source', publisherId);
    destination.searchParams.set('utm_medium', 'open-ad-network');
    destination.searchParams.set('utm_campaign', String(ad.campaign || ad.id).toLowerCase());
    destination.searchParams.set('utm_content', placement + ':' + String(ad.id).toLowerCase());
    return destination.href;
  }

  function sendMetric(event, adId, publisher, placement) {
    if (trackingDisabled()) return;
    var payload = JSON.stringify({ event: event, adId: adId, publisher: publisher, placement: placement });
    if (navigator.sendBeacon) {
      var queued = navigator.sendBeacon(metricsUrl, new Blob([payload], { type: 'text/plain;charset=UTF-8' }));
      if (queued) return;
    }
    fetch(metricsUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: payload,
      keepalive: true,
    }).catch(function () {});
  }

  function observeImpression(element, ad, publisher, placement) {
    if (trackingDisabled() || !('IntersectionObserver' in window)) return;
    var key = ['pc', 'open-ad', publisher, window.location.pathname, placement, ad.id].join(':');
    try { if (sessionStorage.getItem(key) === '1') return; } catch (_) {}
    var timer;
    var observer = new IntersectionObserver(function (entries) {
      var entry = entries[0];
      if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (timer) return;
        timer = window.setTimeout(function () {
          try { sessionStorage.setItem(key, '1'); } catch (_) {}
          sendMetric('impression', ad.id, publisher, placement);
          observer.disconnect();
        }, 1000);
      } else if (timer) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    }, { threshold: [0.5] });
    observer.observe(element);
  }

  function addText(parent, name, value, className) {
    var node = document.createElement(name);
    if (className) node.className = className;
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }

  function render(mount, feed, ad, publisher) {
    var placement = mount.dataset.placement || 'site-footer';
    var destination = destinationFor(ad, publisher, placement);
    if (!destination) return;
    var root = mount.shadowRoot || mount.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = [
      ':host{display:block;--ink:#17140f;--paper:#f4efe3;--accent:#bd3d20;color-scheme:light}',
      '*{box-sizing:border-box}',
      '.unit{width:min(1120px,calc(100% - 24px));margin:28px auto;padding:10px;border:1px solid var(--ink);background:var(--paper);color:var(--ink);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      '.head,.boundary{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:8px;line-height:1.45;letter-spacing:.12em;text-transform:uppercase}',
      '.head{padding:1px 2px 8px;border-bottom:1px solid var(--ink)}',
      '.head a,.boundary a{color:inherit;text-underline-offset:3px}',
      '.creative{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px 22px;margin-top:8px;padding:16px;border:1px solid var(--ink);box-shadow:inset 0 4px 0 var(--accent);background:#fffaf0;color:inherit;text-decoration:none}',
      '.creative:hover{background:#fff}.creative:focus-visible{outline:3px solid var(--accent);outline-offset:2px}',
      '.meta{grid-column:1/-1;color:var(--accent);font-size:7px;letter-spacing:.13em;text-transform:uppercase}',
      'h2{grid-column:1/-1;margin:3px 0 0;font:500 clamp(24px,4.5vw,46px)/.98 Georgia,serif;letter-spacing:-.035em}',
      '.copy{max-width:66ch;font:400 12px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '.cta{align-self:end;color:var(--accent);font-size:9px;font-weight:700;letter-spacing:.08em;text-align:right;text-transform:uppercase}',
      'img{grid-column:1/-1;width:100%;max-height:250px;object-fit:cover;border:1px solid var(--ink)}',
      '.boundary{padding:8px 2px 0;color:#6f675b}',
      ':host([data-theme="dark"]) .unit{--ink:#f4efe3;--paper:#17140f;--accent:#d8ff52}.creative{background:color-mix(in srgb,var(--paper) 9%,#fffaf0)}',
      '@media(max-width:640px){.creative{grid-template-columns:1fr}.cta{text-align:left}.head,.boundary{align-items:flex-start;flex-direction:column}.unit{width:min(100% - 16px,1120px);margin:18px auto}}',
    ].join('');

    var unit = document.createElement('aside');
    unit.className = 'unit';
    unit.setAttribute('aria-label', 'Advertisement from ' + ad.advertiser);
    var head = document.createElement('div');
    head.className = 'head';
    addText(head, 'span', 'ADVERTISEMENT · POINTCAST OPEN AD NETWORK');
    var inspect = document.createElement('a');
    inspect.href = networkOrigin + '/ads';
    inspect.textContent = 'INSPECT THE NETWORK ↗';
    head.appendChild(inspect);
    unit.appendChild(head);

    var creative = document.createElement('a');
    creative.className = 'creative';
    creative.href = destination;
    creative.dataset.adRecord = ad.id;
    creative.addEventListener('click', function () { sendMetric('click', ad.id, publisher, placement); });
    if (ad.image) {
      var image = document.createElement('img');
      image.src = new URL(ad.image, networkOrigin + '/').href;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      creative.appendChild(image);
    }
    addText(creative, 'span', 'HOUSE AD · ' + ad.id + ' · ' + ad.advertiser, 'meta');
    addText(creative, 'h2', ad.headline);
    addText(creative, 'span', ad.copy, 'copy');
    addText(creative, 'span', ad.cta + ' →', 'cta');
    unit.appendChild(creative);

    var boundary = document.createElement('div');
    boundary.className = 'boundary';
    addText(boundary, 'span', 'CONTEXT, NOT SURVEILLANCE · NO VISITOR PROFILE · NO WALLET DATA');
    var receipt = document.createElement('a');
    receipt.href = networkOrigin + '/ads.json';
    receipt.textContent = 'PUBLIC RECEIPT';
    boundary.appendChild(receipt);
    unit.appendChild(boundary);
    root.replaceChildren(style, unit);
    mount.dataset.networkReady = 'true';
    mount.dataset.networkPublisher = publisher;
    observeImpression(creative, ad, publisher, placement);
  }

  function initialize(mount) {
    if (mount.dataset.networkReady === 'true') return;
    loadInventory().then(function (feed) {
      var publisher = publisherForMount(feed, mount);
      var ad = selectCreative(feed, mount, publisher);
      if (ad) render(mount, feed, ad, publisher);
    }).catch(function () { mount.dataset.networkReady = 'unavailable'; });
  }

  function boot() {
    document.querySelectorAll('[data-pointcast-network]').forEach(initialize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
