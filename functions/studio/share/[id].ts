/**
 * functions/studio/share/[id].ts — pretty share page for a published
 * Studio composition. URL: /studio/share/{id}
 *
 * Why a Pages Function and not an Astro page: we need OG meta tags
 * (og:title, og:description, og:image) set per-composition at request
 * time so links unfurl on Slack / X / Farcaster / iMessage. An Astro
 * static page can't do that for content authored after the build.
 *
 * Renders: HTML page that inlines the composition state, mounts a
 * read-only canvas via the same render code as the editor, plus a
 * "Remix in Studio" link to /studio?remix={id}.
 */

export interface Env {
  PC_STUDIO_KV?: KVNamespace;
}

interface Layer {
  id: number;
  kind: 'noun' | 'photo' | 'text';
  x: number;
  y: number;
  scale: number;
  rotate: number;
  seed?: number;
  dataUrl?: string;
  name?: string;
  value?: string;
  font?: string;
  size?: number;
  color?: string;
}

interface Composition {
  tpl: string;
  bg: string;
  filter: string;
  anim: string;
  layers: Layer[];
  caption?: string;
}

const TPL_DIMS: Record<string, { w: number; h: number }> = {
  postcard: { w: 1200, h: 800 },
  card:     { w: 600,  h: 900 },
  poster:   { w: 800,  h: 1200 },
  pixel:    { w: 720,  h: 720 },
  polaroid: { w: 700,  h: 820 },
};

const FILTERS: Record<string, string> = {
  none:     'none',
  crt:      'contrast(1.08) saturate(1.18)',
  halftone: 'grayscale(0.6) contrast(1.5)',
  pixel:    'contrast(1.05)',
  neon:     'saturate(2) contrast(1.15) brightness(1.05)',
  sepia:    'sepia(0.85) contrast(1.1)',
  warhol:   'saturate(1.8) hue-rotate(20deg)',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function describe(comp: Composition): string {
  const counts = comp.layers.reduce((acc, l) => {
    acc[l.kind] = (acc[l.kind] || 0) + 1; return acc;
  }, {} as Record<string, number>);
  const parts: string[] = [];
  if (counts.noun)  parts.push(`${counts.noun} noun${counts.noun > 1 ? 's' : ''}`);
  if (counts.photo) parts.push(`${counts.photo} photo${counts.photo > 1 ? 's' : ''}`);
  if (counts.text)  parts.push(`${counts.text} text layer${counts.text > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

function pickTitle(comp: Composition): string {
  const firstText = comp.layers.find(l => l.kind === 'text' && l.value);
  if (firstText?.value) return firstText.value.slice(0, 70);
  const tpl = comp.tpl.charAt(0).toUpperCase() + comp.tpl.slice(1);
  return `${tpl} from PointCast Studio`;
}

function notFoundHtml(id: string): string {
  return `<!DOCTYPE html>
<html><head><title>Block not found — PointCast Studio</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 540px; margin: 80px auto; padding: 0 20px;">
  <p style="font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 0.18em; color: #c4952e; text-transform: uppercase;">CH.STUDIO · NOT FOUND</p>
  <h1>No composition at <code>${escapeHtml(id)}</code>.</h1>
  <p>This Studio link has expired, was never published, or the URL has a typo. Try <a href="/studio">the Studio</a> to make a new one.</p>
</body></html>`;
}

function renderHtml(id: string, comp: Composition, createdAt: string | undefined, request: Request): string {
  const dims = TPL_DIMS[comp.tpl] || TPL_DIMS.postcard;
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const title = pickTitle(comp);
  const desc = describe(comp) || 'A PointCast Studio composition.';
  // v2.4 fix (codex review PR 2): /studio-og.png didn't exist. Switched to
  // a static SVG fallback at /studio-og.svg (lives in public/) so the OG
  // image stops 404-ing on every paste-unfurl. Per-composition rendered
  // OG images remain on the follow-up roadmap.
  const ogImage = `${origin}/studio-og.svg`;
  const filter = FILTERS[comp.filter] || 'none';
  const stateJson = JSON.stringify(comp).replace(/</g, '\\u003c');
  const shareUrl = `${origin}/studio/share/${id}`;
  const apiUrl   = `${origin}/api/studio-block/${id}`;
  const remixUrl = `${origin}/studio?remix=${encodeURIComponent(id)}`;
  const datePublished = createdAt || new Date().toISOString();

  // JSON-LD CreativeWork — per codex review recommendation. Helps agents
  // and crawlers understand each share page is a discrete creative
  // artifact, not just a generic page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': shareUrl,
    name: title,
    description: desc,
    url: shareUrl,
    datePublished,
    dateModified: datePublished,
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    creator: { '@type': 'Organization', name: 'PointCast', url: 'https://pointcast.xyz' },
    publisher: { '@type': 'Organization', name: 'PointCast', url: 'https://pointcast.xyz' },
    encodingFormat: 'text/html',
    image: ogImage,
    inLanguage: 'en',
    keywords: ['PointCast', 'Studio', 'Block Maker', comp.tpl],
    mainEntityOfPage: shareUrl,
    additionalType: `https://pointcast.xyz/agent-native-publishing#studio-${comp.tpl}`,
  };
  const jsonLdJson = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — PointCast Studio</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:160" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="PointCast Studio" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:type" content="image/svg+xml" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(title + ' — a PointCast Studio composition')}" />
  <meta property="article:published_time" content="${escapeHtml(datePublished)}" />
  <meta property="article:author" content="PointCast" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@mhoydich" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(title + ' — a PointCast Studio composition')}" />

  <link rel="canonical" href="${escapeHtml(shareUrl)}" />
  <link rel="alternate" type="application/json" href="${escapeHtml(apiUrl)}" />

  <script type="application/ld+json">${jsonLdJson}</script>

  <style>
    :root {
      --ink: #1f1b15; --ink-soft: #6a6154; --paper: #f5efe4;
      --warm: #c4952e; --rule: #d8cdb8; --card: #fbf7ee;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; background: var(--paper); color: var(--ink);
      font-family: 'Outfit', system-ui, sans-serif; line-height: 1.55;
    }
    .wrap { max-width: 920px; margin: 0 auto; padding: 32px 20px 80px; }
    .crumb {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px; letter-spacing: 0.18em; color: var(--warm);
      text-transform: uppercase; margin: 0 0 8px;
    }
    .crumb a { color: var(--ink-soft); text-decoration: none; }
    h1 {
      font-family: 'Syne', system-ui, sans-serif;
      font-size: clamp(28px, 4vw, 44px); margin: 0 0 6px; line-height: 1.1;
    }
    .meta { font-size: 13px; color: var(--ink-soft); margin: 0 0 24px; }
    .stage {
      background: var(--card); border: 1.5px solid var(--rule);
      padding: 20px; border-radius: 3px;
    }
    #canvas {
      position: relative; width: 100%;
      aspect-ratio: ${dims.w} / ${dims.h};
      background: ${comp.bg}; overflow: hidden;
      filter: ${filter};
    }
    .layer { position: absolute; transform-origin: center; }
    .layer--noun img, .layer--photo img {
      display: block; pointer-events: none; user-select: none;
    }
    .layer--noun img {
      width: 200px; height: 200px;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.18));
    }
    .layer--photo img {
      width: 240px; height: auto;
      border: 4px solid #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.22);
    }
    .layer--text {
      font-weight: 700; line-height: 1.05; text-align: center;
      text-shadow: 0 1px 0 rgba(255,255,255,0.4); white-space: nowrap;
    }
    .actions { margin: 18px 0 0; display: flex; flex-wrap: wrap; gap: 8px; }
    .btn {
      padding: 10px 14px; border: 1.5px solid var(--ink);
      background: #fff; color: var(--ink); cursor: pointer;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
      text-decoration: none; border-radius: 2px;
      transition: background 0.12s, color 0.12s;
    }
    .btn:hover { background: var(--ink); color: #fff; }
    .btn--primary { background: var(--ink); color: #fff; }
    .btn--primary:hover { background: var(--warm); border-color: var(--warm); }
    .foot {
      margin: 36px 0 0; padding-top: 16px; border-top: 1px solid var(--rule);
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px; color: var(--ink-soft);
    }
    .foot a { color: var(--ink-soft); }

    /* v2.4 fix (codex review PR 2): keyframes now compose with the
       per-layer --s (scale) and --r (rotate) CSS variables, mirroring
       the editor's transform model. Without this, animated share
       layers drop the layer's scale/rotation. The variables default
       to 1 / 0deg if unset so static + non-animated paths still work. */
    @keyframes pc-bounce {
      0%, 100% { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(var(--r, 0deg)) translateY(0); }
      50%      { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(var(--r, 0deg)) translateY(-12px); }
    }
    @keyframes pc-ring {
      0%, 100% { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(var(--r, 0deg)); }
      50%      { transform: translate(-50%, -50%) scale(calc(var(--s, 1) * 1.06)) rotate(var(--r, 0deg)); }
    }
    @keyframes pc-glitch {
      0%   { transform: translate(-52%, -50%) scale(var(--s, 1)) rotate(var(--r, 0deg)); }
      25%  { transform: translate(-48%, -51%) scale(var(--s, 1)) rotate(var(--r, 0deg)); }
      50%  { transform: translate(-51%, -49%) scale(var(--s, 1)) rotate(var(--r, 0deg)); }
      75%  { transform: translate(-49%, -50%) scale(var(--s, 1)) rotate(var(--r, 0deg)); }
      100% { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(var(--r, 0deg)); }
    }
    @keyframes pc-spin {
      0%   { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(-3deg); }
      50%  { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(3deg); }
      100% { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(-3deg); }
    }
    @keyframes pc-drop {
      0%   { transform: translate(-50%, -150%) scale(var(--s, 1)) rotate(-15deg); opacity: 0; }
      60%  { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(8deg); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(var(--s, 1)) rotate(0deg); opacity: 1; }
    }
    .anim-bounce { animation: pc-bounce 1.4s ease-in-out infinite; }
    .anim-ring   { animation: pc-ring 1.2s ease-in-out infinite; }
    .anim-glitch { animation: pc-glitch 0.4s steps(4) infinite; }
    .anim-spin   { animation: pc-spin 2s ease-in-out infinite; }
    .anim-drop   { animation: pc-drop 1.6s ease-out infinite; }
  </style>
</head>
<body>
  <main class="wrap">
    <p class="crumb"><a href="/studio">CH.STUDIO</a> · SHARE · ${escapeHtml(id)}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">${escapeHtml(desc)} · template: ${escapeHtml(comp.tpl)} · filter: ${escapeHtml(comp.filter)} · animation: ${escapeHtml(comp.anim)}</p>

    <div class="stage">
      <div id="canvas"></div>
    </div>

    <div class="actions">
      <a class="btn btn--primary" href="/studio?remix=${encodeURIComponent(id)}">↺ REMIX IN STUDIO</a>
      <button class="btn" id="copy-link" type="button">🔗 COPY LINK</button>
      <a class="btn" href="/api/studio-block/${encodeURIComponent(id)}">{ } JSON</a>
    </div>

    <p class="foot">
      Made with <a href="/studio">PointCast Studio</a> ·
      composition stored as JSON in PC_STUDIO_KV ·
      <a href="/for-agents">for-agents</a>
    </p>
  </main>

  <script>
    (() => {
      const state = ${stateJson};
      const canvas = document.getElementById('canvas');
      const FONTS = {
        heading: "'Syne', sans-serif",
        body:    "'Outfit', sans-serif",
        serif:   "'Lora', 'Georgia', serif",
        mono:    "'JetBrains Mono', ui-monospace, monospace",
      };

      for (const layer of state.layers) {
        const node = document.createElement('div');
        node.className = 'layer layer--' + layer.kind + ' anim-' + state.anim;
        node.style.left = (layer.x * 100) + '%';
        node.style.top = (layer.y * 100) + '%';
        // v2.4 fix (codex review PR 2): set --s + --r on every layer so
        // both the static-direct-transform path and the keyframe-driven
        // animated path see the layer's actual scale + rotation. This
        // mirrors the editor's render path in src/pages/studio.astro.
        node.style.setProperty('--s', String(layer.scale));
        node.style.setProperty('--r', layer.rotate + 'deg');
        if (state.anim === 'static') {
          node.style.transform = 'translate(-50%, -50%) scale(' + layer.scale + ') rotate(' + layer.rotate + 'deg)';
        }
        if (layer.kind === 'noun') {
          const img = document.createElement('img');
          img.src = 'https://noun.pics/' + layer.seed + '.svg';
          img.alt = 'Noun ' + layer.seed;
          img.draggable = false;
          node.appendChild(img);
        } else if (layer.kind === 'photo') {
          const img = document.createElement('img');
          img.src = layer.dataUrl;
          img.alt = layer.name || 'Photo';
          img.draggable = false;
          node.appendChild(img);
        } else if (layer.kind === 'text') {
          node.textContent = layer.value;
          node.style.fontFamily = FONTS[layer.font] || FONTS.heading;
          node.style.fontSize = layer.size + 'px';
          node.style.color = layer.color || '#1f1b15';
        }
        canvas.appendChild(node);
      }

      const copyBtn = document.getElementById('copy-link');
      copyBtn?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          copyBtn.textContent = '✓ COPIED';
          setTimeout(() => { copyBtn.textContent = '🔗 COPY LINK'; }, 1800);
        } catch (e) {
          prompt('copy this link:', location.href);
        }
      });
    })();
  </script>
</body>
</html>`;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx;
  const id = String(params.id || '');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('method not allowed', { status: 405 });
  }

  if (!/^s-[a-z0-9-]{4,40}$/i.test(id)) {
    return new Response(notFoundHtml(id), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!env.PC_STUDIO_KV) {
    return new Response('PC_STUDIO_KV not bound', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const raw = await env.PC_STUDIO_KV.get(id);
  if (!raw) {
    return new Response(notFoundHtml(id), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  let parsed: { composition: Composition; createdAt?: string };
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return new Response('composition data corrupt', { status: 500 });
  }

  // v2.4 (codex review PR 2): emit Last-Modified from createdAt so
  // crawlers and conditional-GET clients can short-circuit. The record
  // is immutable once stored, so createdAt is also the dateModified.
  const createdAt = parsed.createdAt;
  const lastModified = createdAt
    ? new Date(createdAt).toUTCString()
    : new Date().toUTCString();

  // HEAD requests get the same headers without a body.
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
        'Last-Modified': lastModified,
      },
    });
  }

  const html = renderHtml(id, parsed.composition, createdAt, request);
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
      'Last-Modified': lastModified,
    },
  });
};
