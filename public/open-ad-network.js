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
    var requestedCampaign = String(mount.dataset.campaign || '').trim().toLowerCase();
    var candidates = (Array.isArray(feed.campaigns) ? feed.campaigns : []).filter(function (ad) {
      if (!ad || ad.status !== 'house' || aliases.has(String(ad.advertiser || '').toLowerCase())) return false;
      if (!requestedCampaign) return true;
      return [ad.campaign, ad.id].some(function (value) {
        return String(value || '').toLowerCase() === requestedCampaign;
      });
    });
    var preferredCampaigns = new Set(Array.isArray(publisher && publisher.campaigns)
      ? publisher.campaigns.map(String)
      : []);
    if (preferredCampaigns.size) {
      var preferred = candidates.filter(function (ad) { return preferredCampaigns.has(String(ad.campaign || '')); });
      if (preferred.length) candidates = preferred;
    }
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

  function tonePalette(tone) {
    return {
      signal: ['#7dd8ff', '#122a8a', '#070b23'],
      garden: ['#c9ff73', '#17785b', '#071e19'],
      play: ['#ffcf4a', '#df315f', '#250717'],
      ritual: ['#f1b6ff', '#6e39bd', '#160923'],
      network: ['#c8ff2f', '#2857ff', '#060c31'],
      field: ['#ffdc7c', '#b44c1d', '#261007'],
    }[tone] || ['#c8ff2f', '#2857ff', '#060c31'];
  }

  function setupTilt(scene, creative) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var rx = 0;
    var ry = 0;
    function paint() {
      scene.style.setProperty('--rx', rx + 'deg');
      scene.style.setProperty('--ry', ry + 'deg');
    }
    function reset() {
      rx = 0;
      ry = 0;
      scene.style.setProperty('--mx', '50%');
      scene.style.setProperty('--my', '50%');
      paint();
    }
    if (precisePointer.matches && !reducedMotion.matches) {
      creative.addEventListener('pointermove', function (event) {
        var bounds = creative.getBoundingClientRect();
        var x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        var y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
        rx = (0.5 - y) * 10;
        ry = (x - 0.5) * 13;
        scene.style.setProperty('--mx', (x * 100) + '%');
        scene.style.setProperty('--my', (y * 100) + '%');
        paint();
      });
      creative.addEventListener('pointerleave', reset);
    }
    creative.addEventListener('keydown', function (event) {
      if (reducedMotion.matches || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowUp') rx = Math.min(7, rx + 2);
      if (event.key === 'ArrowDown') rx = Math.max(-7, rx - 2);
      if (event.key === 'ArrowLeft') ry = Math.max(-9, ry - 2);
      if (event.key === 'ArrowRight') ry = Math.min(9, ry + 2);
      paint();
    });
    creative.addEventListener('blur', reset);
    reducedMotion.addEventListener('change', reset);
  }

  function render(mount, feed, ad, publisher) {
    var placement = mount.dataset.placement || 'site-footer';
    var destination = destinationFor(ad, publisher, placement);
    if (!destination) return;
    var root = mount.shadowRoot || mount.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = [
      ':host{display:block;--ink:#f7f5ed;--paper:#08080d;--accent:#c8ff2f;--mid:#2857ff;--deep:#060c31;color-scheme:dark}',
      '*{box-sizing:border-box}',
      '.unit{width:min(1120px,calc(100% - 24px));margin:32px auto;padding:12px;border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:28px;background:radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--mid) 24%,var(--paper)),var(--paper) 62%);box-shadow:0 28px 90px color-mix(in srgb,var(--deep) 62%,transparent);color:var(--ink);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      '.head,.boundary{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:8px;line-height:1.45;letter-spacing:.12em;text-transform:uppercase}',
      '.head{padding:3px 6px 10px;color:color-mix(in srgb,var(--accent) 78%,#fff);border-bottom:1px solid color-mix(in srgb,var(--accent) 24%,transparent)}',
      '.head a,.boundary a{color:inherit;text-underline-offset:3px}',
      '.scene{--rx:0deg;--ry:0deg;--mx:50%;--my:50%;position:relative;min-height:clamp(360px,43vw,520px);margin-top:12px;perspective:1200px;isolation:isolate}',
      '.back,.middle,.creative{position:absolute;border-radius:22px;transform-style:preserve-3d}',
      '.back{inset:9% 6% 0;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 55%,transparent),transparent 58%),var(--deep);border:1px solid color-mix(in srgb,var(--accent) 28%,transparent);transform:rotateX(calc(var(--rx) * .35)) rotateY(calc(var(--ry) * .35)) translateZ(-80px) translateY(28px);transition:transform 500ms cubic-bezier(.2,.8,.2,1)}',
      '.middle{inset:5% 3% 5%;background:linear-gradient(145deg,color-mix(in srgb,var(--mid) 60%,#08080b),var(--deep));border:1px solid color-mix(in srgb,var(--accent) 46%,transparent);transform:rotateX(calc(var(--rx) * .68)) rotateY(calc(var(--ry) * .68)) translateZ(-40px) translateY(14px);transition:transform 420ms cubic-bezier(.2,.8,.2,1)}',
      '.creative{inset:0 0 8%;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(220px,.7fr);grid-template-rows:auto 1fr auto;gap:16px 36px;align-items:end;overflow:hidden;padding:clamp(24px,4vw,46px);color:inherit;background:linear-gradient(115deg,color-mix(in srgb,var(--deep) 91%,transparent) 8%,color-mix(in srgb,var(--mid) 74%,transparent));border:1px solid color-mix(in srgb,var(--accent) 70%,#fff);box-shadow:inset 0 1px color-mix(in srgb,#fff 45%,transparent),0 28px 72px color-mix(in srgb,var(--deep) 70%,transparent);text-decoration:none;transform:rotateX(var(--rx)) rotateY(var(--ry));transition:transform 260ms cubic-bezier(.2,.8,.2,1),box-shadow 260ms ease;will-change:transform}',
      '.creative:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,color-mix(in srgb,var(--deep) 92%,transparent) 0 42%,transparent 76%),linear-gradient(0deg,color-mix(in srgb,var(--deep) 90%,transparent),transparent 64%);pointer-events:none}',
      '.creative:hover{box-shadow:inset 0 1px color-mix(in srgb,#fff 55%,transparent),0 42px 96px color-mix(in srgb,var(--deep) 80%,transparent)}',
      '.creative:focus-visible{outline:4px solid var(--accent);outline-offset:5px}',
      '.image{position:absolute;inset:0;z-index:-2;overflow:hidden;border-radius:inherit;transform:translateZ(-2px) scale(1.04)}',
      '.image img{width:100%;height:100%;display:block;object-fit:cover;filter:saturate(1.12) contrast(1.08)}',
      '.glint{position:absolute;inset:-1px;z-index:0;border-radius:inherit;background:radial-gradient(circle at var(--mx) var(--my),color-mix(in srgb,var(--accent) 34%,transparent),transparent 30%);mix-blend-mode:screen;pointer-events:none}',
      '.meta,.number,h2,.copy,.cta{position:relative;z-index:1;transform:translateZ(52px)}',
      '.meta{align-self:start;color:var(--accent);font-size:7px;letter-spacing:.13em;text-transform:uppercase}',
      '.number{align-self:start;justify-self:end;color:color-mix(in srgb,var(--accent) 75%,#fff);font-size:clamp(36px,7vw,76px);line-height:.75;letter-spacing:-.1em;opacity:.68;transform:translateZ(88px)}',
      'h2{align-self:end;margin:0;font:500 clamp(40px,7vw,78px)/.84 Georgia,serif;letter-spacing:-.055em;text-wrap:balance;text-shadow:0 4px 28px var(--deep)}',
      '.copy{max-width:44ch;color:color-mix(in srgb,#fff 82%,var(--accent));font:500 clamp(12px,1.5vw,15px)/1.48 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-shadow:0 2px 14px var(--deep);transform:translateZ(68px)}',
      '.cta{grid-column:1/-1;width:max-content;padding:10px 13px;color:var(--deep);background:var(--accent);border-radius:999px;font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;transform:translateZ(96px)}',
      '.hint{margin:9px 5px 0;color:#85828e;font-size:7px;letter-spacing:.11em;text-align:center;text-transform:uppercase}',
      '.boundary{padding:10px 6px 2px;color:#85828e}',
      ':host([data-theme="light"]) .unit{--paper:#11111a}',
      '@media(max-width:640px){.unit{width:min(100% - 16px,1120px);margin:18px auto;border-radius:22px}.scene{min-height:480px}.creative{grid-template-columns:1fr auto;grid-template-rows:auto 1fr auto auto;gap:14px;padding:24px}.creative h2,.copy{grid-column:1/-1}.number{font-size:40px}.head,.boundary{align-items:flex-start;flex-direction:column}}',
      '@media(prefers-reduced-motion:reduce){.back,.middle,.creative{transition:none;transform:none}.hint{display:none}}',
    ].join('');

    var unit = document.createElement('aside');
    unit.className = 'unit';
    unit.setAttribute('aria-label', 'Advertisement from ' + ad.advertiser);
    var palette = tonePalette(ad.tone);
    unit.style.setProperty('--accent', palette[0]);
    unit.style.setProperty('--mid', palette[1]);
    unit.style.setProperty('--deep', palette[2]);
    var head = document.createElement('div');
    head.className = 'head';
    addText(head, 'span', 'ADVERTISEMENT · POINTCAST OPEN AD NETWORK');
    var inspect = document.createElement('a');
    inspect.href = networkOrigin + '/ads';
    inspect.textContent = 'INSPECT THE NETWORK ↗';
    head.appendChild(inspect);
    unit.appendChild(head);

    var scene = document.createElement('div');
    scene.className = 'scene';
    var back = document.createElement('span');
    back.className = 'back';
    back.setAttribute('aria-hidden', 'true');
    scene.appendChild(back);
    var middle = document.createElement('span');
    middle.className = 'middle';
    middle.setAttribute('aria-hidden', 'true');
    scene.appendChild(middle);

    var creative = document.createElement('a');
    creative.className = 'creative';
    creative.href = destination;
    creative.dataset.adRecord = ad.id;
    creative.addEventListener('click', function () { sendMetric('click', ad.id, publisher, placement); });
    if (ad.image) {
      var imageFrame = document.createElement('span');
      imageFrame.className = 'image';
      imageFrame.setAttribute('aria-hidden', 'true');
      var image = document.createElement('img');
      image.src = new URL(ad.image, networkOrigin + '/').href;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      imageFrame.appendChild(image);
      creative.appendChild(imageFrame);
    }
    var glint = document.createElement('span');
    glint.className = 'glint';
    glint.setAttribute('aria-hidden', 'true');
    creative.appendChild(glint);
    addText(creative, 'span', 'HOUSE AD · ' + ad.id + ' · ' + ad.advertiser, 'meta');
    addText(creative, 'span', '3D', 'number').setAttribute('aria-hidden', 'true');
    addText(creative, 'h2', ad.headline);
    addText(creative, 'span', ad.copy, 'copy');
    addText(creative, 'span', ad.cta + ' →', 'cta');
    scene.appendChild(creative);
    unit.appendChild(scene);
    addText(unit, 'p', 'Move pointer / arrow keys to tilt · Enter to open', 'hint');

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
    mount.dataset.networkCampaign = String(ad.campaign || ad.id);
    setupTilt(scene, creative);
    observeImpression(creative, ad, publisher, placement);
  }

  function initialize(mount) {
    if (mount.dataset.networkReady === 'true') return;
    loadInventory().then(function (feed) {
      var publisher = publisherForMount(feed, mount);
      var ad = selectCreative(feed, mount, publisher);
      if (ad) render(mount, feed, ad, publisher);
      else mount.dataset.networkReady = mount.dataset.campaign ? 'campaign-unavailable' : 'unavailable';
    }).catch(function () { mount.dataset.networkReady = 'unavailable'; });
  }

  function boot() {
    document.querySelectorAll('[data-pointcast-network]').forEach(initialize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
