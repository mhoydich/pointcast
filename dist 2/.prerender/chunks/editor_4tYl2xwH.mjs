import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { m as moonPhase, z as zodiacOfDate, a as season } from './sky_MtFZoqPn.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Editor = createComponent(async ($$result, $$props, $$slots) => {
  const now = /* @__PURE__ */ new Date();
  const moon = moonPhase(now);
  const zodiac = zodiacOfDate(now);
  const se = season(now, 33.919);
  const zeitgeistPolls = (await getCollection("polls", ({ data }) => !data.draft && data.zeitgeist)).sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime());
  const featuredPoll = zeitgeistPolls[0] ?? null;
  const clockBlock = (await getCollection("blocks", ({ data }) => data.id === "0324" && !data.draft))[0];
  const clockZones = clockBlock?.data.clock?.zones ?? [];
  const featuredZone = clockZones.find((z) => z.label === "El Segundo") ?? clockZones[0];
  const [allProducts, allBlocks] = await Promise.all([
    getCollection("products", ({ data }) => !data.draft),
    getCollection("blocks", ({ data }) => !data.draft)
  ]);
  const productMoods = /* @__PURE__ */ new Set();
  allProducts.forEach((p) => (p.data.pairsWithMood ?? []).forEach((m) => productMoods.add(m)));
  const moodCounts = /* @__PURE__ */ new Map();
  allBlocks.forEach((b) => {
    if (b.data.mood && productMoods.has(b.data.mood)) {
      moodCounts.set(b.data.mood, (moodCounts.get(b.data.mood) ?? 0) + 1);
    }
  });
  const featuredMood = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "good-feels";
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(now);
  const dateShort = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit"
  }).format(now).toUpperCase();
  const unsplashKeywords = [
    featuredZone?.label?.toLowerCase().split(",")[0] ?? "el segundo",
    se.name,
    featuredMood.replace(/-/g, " ")
  ].filter(Boolean).join(" ");
  const unsplashUrl = `https://unsplash.com/s/photos/${encodeURIComponent(unsplashKeywords)}`;
  const presetKicker = `POINTCAST · ${dateShort} 2026`;
  const presetTitle = featuredPoll?.data.question ?? "Today, composed.";
  const presetSubtitle = featuredZone ? `${featuredZone.label} · ${featuredZone.region ?? ""}` : `${moon.glyph} ${moon.label} · ${zodiac.glyph} ${zodiac.name}`;
  const title = "Moment · Editor";
  const description = "Compose a PointCast postcard from any image URL — ChatGPT-generated, Unsplash photo, or anything hosted. Text overlays, live canvas, PNG export.";
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "data-astro-cid-md3hmd4k": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="page" data-astro-cid-md3hmd4k> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-md3hmd4k> <a href="/" data-astro-cid-md3hmd4k>Home</a> <span aria-hidden="true" data-astro-cid-md3hmd4k>›</span> <a href="/moment" data-astro-cid-md3hmd4k>moment</a> <span aria-hidden="true" data-astro-cid-md3hmd4k>›</span> <span data-astro-cid-md3hmd4k>editor</span> </nav> <header class="head" data-astro-cid-md3hmd4k> <p class="kicker mono" data-astro-cid-md3hmd4k>MOMENT · EDITOR · ', ' 2026</p> <h1 class="title" data-astro-cid-md3hmd4k>Image in, postcard out.</h1> <p class="dek" data-astro-cid-md3hmd4k>\nPaste any image URL — <a href="https://chatgpt.com/images/" target="_blank" rel="noopener" data-astro-cid-md3hmd4k>ChatGPT Images</a>, <a', ' target="_blank" rel="noopener" data-astro-cid-md3hmd4k>Unsplash</a>, or anything hosted — and compose a PointCast postcard. Text overlays are live. Download as PNG. All rendering happens in your browser.\n</p> </header> <section class="editor" data-astro-cid-md3hmd4k> <div class="editor__controls" data-astro-cid-md3hmd4k> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>IMAGE URL</span> <input type="url" id="f-src" placeholder="https://… (paste ChatGPT or Unsplash URL)" data-astro-cid-md3hmd4k> </label> <div class="sources" data-astro-cid-md3hmd4k> <a class="btn btn--ghost mono" href="https://chatgpt.com/images/" target="_blank" rel="noopener" data-astro-cid-md3hmd4k>▶ CHATGPT IMAGES</a> <a class="btn btn--ghost mono"', ' target="_blank" rel="noopener" data-astro-cid-md3hmd4k>▶ UNSPLASH · ', `</a> <button type="button" class="btn btn--text mono" id="load-saved" data-astro-cid-md3hmd4k>↺ LOAD TODAY'S /MOMENT URL</button> </div> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>KICKER</span> <input type="text" id="f-kicker" maxlength="80"`, ' data-astro-cid-md3hmd4k> </label> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>TITLE</span> <input type="text" id="f-title" maxlength="140"', ' data-astro-cid-md3hmd4k> </label> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>SUBTITLE</span> <input type="text" id="f-subtitle" maxlength="200"', ` data-astro-cid-md3hmd4k> </label> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>LAYOUT</legend> <div class="chips" data-astro-cid-md3hmd4k> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="bottom-left" checked data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>BOTTOM-LEFT</span> </label> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="top-left" data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>TOP-LEFT</span> </label> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="center" data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>CENTER</span> </label> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="bottom-right" data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>BOTTOM-RIGHT</span> </label> </div> </fieldset> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>COLOR</legend> <div class="chips" data-astro-cid-md3hmd4k> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#F7F5EE" checked data-astro-cid-md3hmd4k><span style="background:#F7F5EE;color:#12110E" data-astro-cid-md3hmd4k>CREAM</span></label> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#FBB040" data-astro-cid-md3hmd4k><span style="background:#FBB040;color:#12110E" data-astro-cid-md3hmd4k>AMBER</span></label> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#8A2432" data-astro-cid-md3hmd4k><span style="background:#8A2432;color:#fff" data-astro-cid-md3hmd4k>CRIMSON</span></label> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#12110E" data-astro-cid-md3hmd4k><span style="background:#12110E;color:#fff" data-astro-cid-md3hmd4k>INK</span></label> </div> </fieldset> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>ASPECT</legend> <div class="chips" data-astro-cid-md3hmd4k> <label class="chip" data-astro-cid-md3hmd4k><input type="radio" name="aspect" value="16:9" checked data-astro-cid-md3hmd4k><span data-astro-cid-md3hmd4k>16:9 · 1200×675</span></label> <label class="chip" data-astro-cid-md3hmd4k><input type="radio" name="aspect" value="1:1" data-astro-cid-md3hmd4k><span data-astro-cid-md3hmd4k>1:1 · 1080×1080</span></label> <label class="chip" data-astro-cid-md3hmd4k><input type="radio" name="aspect" value="4:5" data-astro-cid-md3hmd4k><span data-astro-cid-md3hmd4k>4:5 · 1080×1350</span></label> </div> </fieldset> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>OVERLAY</legend> <label class="inline" data-astro-cid-md3hmd4k> <input type="checkbox" id="f-gradient" checked data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>DARKEN GRADIENT BEHIND TEXT</span> </label> <label class="inline" data-astro-cid-md3hmd4k> <input type="checkbox" id="f-watermark" checked data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>POINTCAST WATERMARK CORNER</span> </label> </fieldset> <div class="actions" data-astro-cid-md3hmd4k> <button type="button" class="btn btn--primary" id="download" data-astro-cid-md3hmd4k>⬇ DOWNLOAD PNG</button> <button type="button" class="btn btn--ghost" id="copy-data-url" data-astro-cid-md3hmd4k>⎘ COPY DATA URL</button> </div> <p class="status mono" id="status" aria-live="polite" data-astro-cid-md3hmd4k>&nbsp;</p> </div> <div class="editor__preview" data-astro-cid-md3hmd4k> <p class="preview__kicker mono" data-astro-cid-md3hmd4k>PREVIEW · LIVE</p> <div class="canvas-wrap" data-astro-cid-md3hmd4k> <canvas id="canvas" width="1200" height="675" data-astro-cid-md3hmd4k></canvas> <div class="canvas-empty" id="canvas-empty" data-astro-cid-md3hmd4k> <p data-astro-cid-md3hmd4k>Paste an image URL above<br data-astro-cid-md3hmd4k>to start composing.</p> </div> </div> </div> </section> <section class="agent-strip" data-astro-cid-md3hmd4k> <p class="agent-strip__label mono" data-astro-cid-md3hmd4k>MACHINE-READABLE</p> <ul data-astro-cid-md3hmd4k> <li data-astro-cid-md3hmd4k><a href="/api/moment.json" data-astro-cid-md3hmd4k>/api/moment.json</a></li> <li data-astro-cid-md3hmd4k><a href="/moment" data-astro-cid-md3hmd4k>/moment</a></li> <li data-astro-cid-md3hmd4k><a href="/clock/0324" data-astro-cid-md3hmd4k>/clock/0324</a></li> </ul> </section> <script>
      (() => {
        const canvas = document.getElementById('canvas');
        const emptyOverlay = document.getElementById('canvas-empty');
        const ctx = canvas.getContext('2d');

        const fSrc = document.getElementById('f-src');
        const fKicker = document.getElementById('f-kicker');
        const fTitle = document.getElementById('f-title');
        const fSubtitle = document.getElementById('f-subtitle');
        const fGradient = document.getElementById('f-gradient');
        const fWatermark = document.getElementById('f-watermark');
        const status = document.getElementById('status');
        const download = document.getElementById('download');
        const copyDataUrl = document.getElementById('copy-data-url');
        const loadSaved = document.getElementById('load-saved');

        let currentImage = null;

        const ASPECTS = {
          '16:9': { w: 1200, h: 675 },
          '1:1':  { w: 1080, h: 1080 },
          '4:5':  { w: 1080, h: 1350 },
        };

        function getAspect() {
          const r = document.querySelector('input[name="aspect"]:checked');
          return ASPECTS[r?.value || '16:9'];
        }
        function getAnchor() {
          return document.querySelector('input[name="anchor"]:checked')?.value || 'bottom-left';
        }
        function getColor() {
          return document.querySelector('input[name="color"]:checked')?.value || '#F7F5EE';
        }

        function setStatus(msg, kind) {
          status.textContent = msg;
          status.dataset.kind = kind || '';
          if (msg) setTimeout(() => { if (status.textContent === msg) { status.textContent = '\\u00a0'; status.dataset.kind = ''; } }, 4000);
        }

        function draw() {
          const { w, h } = getAspect();
          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;

          // Background
          ctx.fillStyle = '#12110E';
          ctx.fillRect(0, 0, w, h);

          if (currentImage) {
            // Object-fit: cover
            const ir = currentImage.naturalWidth / currentImage.naturalHeight;
            const cr = w / h;
            let sx = 0, sy = 0, sw = currentImage.naturalWidth, sh = currentImage.naturalHeight;
            if (ir > cr) {
              sw = sh * cr;
              sx = (currentImage.naturalWidth - sw) / 2;
            } else {
              sh = sw / cr;
              sy = (currentImage.naturalHeight - sh) / 2;
            }
            try { ctx.drawImage(currentImage, sx, sy, sw, sh, 0, 0, w, h); } catch (e) {}
          }

          // Darken gradient
          if (fGradient.checked && currentImage) {
            const anchor = getAnchor();
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            if (anchor.startsWith('top')) {
              grad.addColorStop(0, 'rgba(0,0,0,0.55)');
              grad.addColorStop(0.55, 'rgba(0,0,0,0)');
            } else if (anchor === 'center') {
              grad.addColorStop(0, 'rgba(0,0,0,0)');
              grad.addColorStop(0.45, 'rgba(0,0,0,0.55)');
              grad.addColorStop(0.55, 'rgba(0,0,0,0.55)');
              grad.addColorStop(1, 'rgba(0,0,0,0)');
            } else {
              // bottom-*
              grad.addColorStop(0.45, 'rgba(0,0,0,0)');
              grad.addColorStop(1, 'rgba(0,0,0,0.65)');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }

          // Text composition
          const color = getColor();
          const anchor = getAnchor();
          const kicker = (fKicker.value || '').trim();
          const title = (fTitle.value || '').trim();
          const subtitle = (fSubtitle.value || '').trim();

          const pad = Math.round(Math.min(w, h) * 0.06);
          const maxTextWidth = w - pad * 2;

          // Sizes relative to canvas height
          const kickerSize = Math.round(h * 0.024);
          const titleSize = Math.round(h * 0.08);
          const subtitleSize = Math.round(h * 0.032);

          // Text alignment from anchor
          const align = anchor === 'bottom-right' ? 'right' : anchor === 'center' ? 'center' : 'left';
          ctx.textAlign = align;
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = color;

          // Compute text block origin (y for title baseline)
          let textX, titleY;
          if (anchor === 'top-left' || anchor === 'top-right') {
            textX = anchor === 'top-right' ? (w - pad) : pad;
            titleY = pad + kickerSize * 2 + titleSize;
          } else if (anchor === 'center') {
            textX = w / 2;
            titleY = h / 2;
          } else {
            // bottom-*
            textX = anchor === 'bottom-right' ? (w - pad) : pad;
            titleY = h - pad - subtitleSize * 2;
          }

          // Kicker
          if (kicker) {
            ctx.font = \`700 \${kickerSize}px "JetBrains Mono", "Menlo", monospace\`;
            const letterSpacing = 0.16; // emulated via manual spacing if needed
            // Native canvas doesn't support letter-spacing; fallback via char-by-char draw
            const kText = kicker.toUpperCase();
            const spacing = kickerSize * letterSpacing * 0.5;
            const trackedWidth = ctx.measureText(kText).width + spacing * (kText.length - 1);
            let kx = textX;
            if (align === 'right') kx = textX - trackedWidth;
            if (align === 'center') kx = textX - trackedWidth / 2;
            ctx.textAlign = 'left';
            let cx = kx;
            for (const ch of kText) {
              ctx.fillText(ch, cx, titleY - titleSize - subtitleSize * 0.9);
              cx += ctx.measureText(ch).width + spacing;
            }
            ctx.textAlign = align;
          }

          // Title
          if (title) {
            ctx.font = \`800 \${titleSize}px "Inter", "Inter Tight", system-ui, sans-serif\`;
            wrapText(ctx, title, textX, titleY, maxTextWidth, titleSize * 1.08, 3);
          }

          // Subtitle
          if (subtitle) {
            ctx.font = \`500 \${subtitleSize}px "Inter", "Inter Tight", system-ui, sans-serif\`;
            ctx.fillStyle = color === '#12110E' ? 'rgba(18,17,14,0.78)' : 'rgba(247,245,238,0.82)';
            if (color !== '#F7F5EE' && color !== '#12110E') ctx.fillStyle = color;
            const subY = titleY + subtitleSize * 1.2;
            wrapText(ctx, subtitle, textX, subY, maxTextWidth, subtitleSize * 1.25, 2);
          }

          // Watermark
          if (fWatermark.checked) {
            const wmW = Math.round(w * 0.12);
            const wmH = Math.round(wmW * 0.28);
            const wmX = anchor === 'bottom-right' ? pad : w - pad - wmW;
            const wmY = anchor === 'top-right' ? h - pad - wmH : pad;
            // Dark pill with amber dot + POINTCAST
            ctx.fillStyle = 'rgba(18,17,14,0.85)';
            roundRect(ctx, wmX, wmY, wmW, wmH, wmH * 0.2);
            ctx.fill();
            // dot
            ctx.beginPath();
            const cx = wmX + wmH * 0.55;
            const cy = wmY + wmH * 0.5;
            const r = wmH * 0.24;
            const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            dotGrad.addColorStop(0, '#FBB040');
            dotGrad.addColorStop(1, '#8A2432');
            ctx.fillStyle = dotGrad;
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            // wordmark
            ctx.fillStyle = '#F7F5EE';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = \`700 \${Math.round(wmH * 0.38)}px "JetBrains Mono", monospace\`;
            ctx.fillText('POINTCAST', wmX + wmH * 1.0, cy);
          }

          if (currentImage) emptyOverlay.hidden = true;
          else emptyOverlay.hidden = false;
        }

        function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
          const words = text.split(/\\s+/);
          const lines = [];
          let current = '';
          for (const w of words) {
            const test = current ? current + ' ' + w : w;
            if (ctx.measureText(test).width > maxWidth && current) {
              lines.push(current);
              current = w;
            } else {
              current = test;
            }
            if (lines.length >= maxLines - 1 && ctx.measureText(current + '…').width > maxWidth) {
              while (ctx.measureText(current + '…').width > maxWidth && current.length > 1) {
                current = current.slice(0, -1);
              }
              current = current + '…';
              break;
            }
          }
          if (current) lines.push(current);
          lines.slice(0, maxLines).forEach((line, i) => {
            ctx.fillText(line, x, y + i * lineHeight);
          });
        }

        function roundRect(ctx, x, y, w, h, r) {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
        }

        // Image loading
        function loadImage(url) {
          if (!url) return;
          setStatus('loading image…', '');
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            currentImage = img;
            draw();
            setStatus('loaded · text overlays apply live', 'ok');
          };
          img.onerror = () => {
            currentImage = null;
            draw();
            setStatus('image failed to load (CORS or 404) · try a direct .png/.jpg URL', 'err');
          };
          img.src = url;
        }

        // Events — redraw on any input change
        [fSrc, fKicker, fTitle, fSubtitle, fGradient, fWatermark].forEach((el) => {
          el.addEventListener('input', () => {
            if (el === fSrc) loadImage(fSrc.value.trim());
            else draw();
          });
        });
        document.querySelectorAll('input[name="anchor"], input[name="color"], input[name="aspect"]').forEach((r) => {
          r.addEventListener('change', draw);
        });

        download.addEventListener('click', () => {
          if (!currentImage) { setStatus('load an image first', 'warn'); return; }
          try {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            a.download = \`pointcast-moment-\${today}.png\`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setStatus('downloaded · pointcast-moment-' + today + '.png', 'ok');
          } catch (e) {
            setStatus('export blocked — image origin denies canvas read. try a direct hosted URL.', 'err');
          }
        });

        copyDataUrl.addEventListener('click', async () => {
          if (!currentImage) { setStatus('load an image first', 'warn'); return; }
          try {
            const url = canvas.toDataURL('image/png');
            await navigator.clipboard.writeText(url);
            setStatus('data URL copied · paste anywhere images are accepted', 'ok');
          } catch (e) {
            setStatus('export blocked — CORS prevents reading canvas pixels', 'err');
          }
        });

        loadSaved.addEventListener('click', () => {
          const key = 'pc:moment:image:' + new Date().toISOString().slice(0, 10);
          try {
            const cached = JSON.parse(localStorage.getItem(key) || 'null');
            if (cached && cached.url) {
              fSrc.value = cached.url;
              loadImage(cached.url);
              setStatus('loaded today\\u2019s saved moment URL', 'ok');
            } else {
              setStatus('no saved URL for today on this device · save one on /moment first', 'warn');
            }
          } catch (e) {
            setStatus('localStorage blocked', 'err');
          }
        });

        // Initial paint (no image)
        draw();

        // Seed from ?src= URL param
        const params = new URLSearchParams(window.location.search);
        const seed = params.get('src');
        if (seed) { fSrc.value = seed; loadImage(seed); }
      })();
    <\/script> </main> `], [" ", '<main class="page" data-astro-cid-md3hmd4k> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-md3hmd4k> <a href="/" data-astro-cid-md3hmd4k>Home</a> <span aria-hidden="true" data-astro-cid-md3hmd4k>›</span> <a href="/moment" data-astro-cid-md3hmd4k>moment</a> <span aria-hidden="true" data-astro-cid-md3hmd4k>›</span> <span data-astro-cid-md3hmd4k>editor</span> </nav> <header class="head" data-astro-cid-md3hmd4k> <p class="kicker mono" data-astro-cid-md3hmd4k>MOMENT · EDITOR · ', ' 2026</p> <h1 class="title" data-astro-cid-md3hmd4k>Image in, postcard out.</h1> <p class="dek" data-astro-cid-md3hmd4k>\nPaste any image URL — <a href="https://chatgpt.com/images/" target="_blank" rel="noopener" data-astro-cid-md3hmd4k>ChatGPT Images</a>, <a', ' target="_blank" rel="noopener" data-astro-cid-md3hmd4k>Unsplash</a>, or anything hosted — and compose a PointCast postcard. Text overlays are live. Download as PNG. All rendering happens in your browser.\n</p> </header> <section class="editor" data-astro-cid-md3hmd4k> <div class="editor__controls" data-astro-cid-md3hmd4k> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>IMAGE URL</span> <input type="url" id="f-src" placeholder="https://… (paste ChatGPT or Unsplash URL)" data-astro-cid-md3hmd4k> </label> <div class="sources" data-astro-cid-md3hmd4k> <a class="btn btn--ghost mono" href="https://chatgpt.com/images/" target="_blank" rel="noopener" data-astro-cid-md3hmd4k>▶ CHATGPT IMAGES</a> <a class="btn btn--ghost mono"', ' target="_blank" rel="noopener" data-astro-cid-md3hmd4k>▶ UNSPLASH · ', `</a> <button type="button" class="btn btn--text mono" id="load-saved" data-astro-cid-md3hmd4k>↺ LOAD TODAY'S /MOMENT URL</button> </div> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>KICKER</span> <input type="text" id="f-kicker" maxlength="80"`, ' data-astro-cid-md3hmd4k> </label> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>TITLE</span> <input type="text" id="f-title" maxlength="140"', ' data-astro-cid-md3hmd4k> </label> <label class="field" data-astro-cid-md3hmd4k> <span class="field__label mono" data-astro-cid-md3hmd4k>SUBTITLE</span> <input type="text" id="f-subtitle" maxlength="200"', ` data-astro-cid-md3hmd4k> </label> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>LAYOUT</legend> <div class="chips" data-astro-cid-md3hmd4k> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="bottom-left" checked data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>BOTTOM-LEFT</span> </label> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="top-left" data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>TOP-LEFT</span> </label> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="center" data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>CENTER</span> </label> <label class="chip" data-astro-cid-md3hmd4k> <input type="radio" name="anchor" value="bottom-right" data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>BOTTOM-RIGHT</span> </label> </div> </fieldset> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>COLOR</legend> <div class="chips" data-astro-cid-md3hmd4k> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#F7F5EE" checked data-astro-cid-md3hmd4k><span style="background:#F7F5EE;color:#12110E" data-astro-cid-md3hmd4k>CREAM</span></label> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#FBB040" data-astro-cid-md3hmd4k><span style="background:#FBB040;color:#12110E" data-astro-cid-md3hmd4k>AMBER</span></label> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#8A2432" data-astro-cid-md3hmd4k><span style="background:#8A2432;color:#fff" data-astro-cid-md3hmd4k>CRIMSON</span></label> <label class="chip chip--swatch" data-astro-cid-md3hmd4k><input type="radio" name="color" value="#12110E" data-astro-cid-md3hmd4k><span style="background:#12110E;color:#fff" data-astro-cid-md3hmd4k>INK</span></label> </div> </fieldset> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>ASPECT</legend> <div class="chips" data-astro-cid-md3hmd4k> <label class="chip" data-astro-cid-md3hmd4k><input type="radio" name="aspect" value="16:9" checked data-astro-cid-md3hmd4k><span data-astro-cid-md3hmd4k>16:9 · 1200×675</span></label> <label class="chip" data-astro-cid-md3hmd4k><input type="radio" name="aspect" value="1:1" data-astro-cid-md3hmd4k><span data-astro-cid-md3hmd4k>1:1 · 1080×1080</span></label> <label class="chip" data-astro-cid-md3hmd4k><input type="radio" name="aspect" value="4:5" data-astro-cid-md3hmd4k><span data-astro-cid-md3hmd4k>4:5 · 1080×1350</span></label> </div> </fieldset> <fieldset class="group" data-astro-cid-md3hmd4k> <legend class="field__label mono" data-astro-cid-md3hmd4k>OVERLAY</legend> <label class="inline" data-astro-cid-md3hmd4k> <input type="checkbox" id="f-gradient" checked data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>DARKEN GRADIENT BEHIND TEXT</span> </label> <label class="inline" data-astro-cid-md3hmd4k> <input type="checkbox" id="f-watermark" checked data-astro-cid-md3hmd4k> <span data-astro-cid-md3hmd4k>POINTCAST WATERMARK CORNER</span> </label> </fieldset> <div class="actions" data-astro-cid-md3hmd4k> <button type="button" class="btn btn--primary" id="download" data-astro-cid-md3hmd4k>⬇ DOWNLOAD PNG</button> <button type="button" class="btn btn--ghost" id="copy-data-url" data-astro-cid-md3hmd4k>⎘ COPY DATA URL</button> </div> <p class="status mono" id="status" aria-live="polite" data-astro-cid-md3hmd4k>&nbsp;</p> </div> <div class="editor__preview" data-astro-cid-md3hmd4k> <p class="preview__kicker mono" data-astro-cid-md3hmd4k>PREVIEW · LIVE</p> <div class="canvas-wrap" data-astro-cid-md3hmd4k> <canvas id="canvas" width="1200" height="675" data-astro-cid-md3hmd4k></canvas> <div class="canvas-empty" id="canvas-empty" data-astro-cid-md3hmd4k> <p data-astro-cid-md3hmd4k>Paste an image URL above<br data-astro-cid-md3hmd4k>to start composing.</p> </div> </div> </div> </section> <section class="agent-strip" data-astro-cid-md3hmd4k> <p class="agent-strip__label mono" data-astro-cid-md3hmd4k>MACHINE-READABLE</p> <ul data-astro-cid-md3hmd4k> <li data-astro-cid-md3hmd4k><a href="/api/moment.json" data-astro-cid-md3hmd4k>/api/moment.json</a></li> <li data-astro-cid-md3hmd4k><a href="/moment" data-astro-cid-md3hmd4k>/moment</a></li> <li data-astro-cid-md3hmd4k><a href="/clock/0324" data-astro-cid-md3hmd4k>/clock/0324</a></li> </ul> </section> <script>
      (() => {
        const canvas = document.getElementById('canvas');
        const emptyOverlay = document.getElementById('canvas-empty');
        const ctx = canvas.getContext('2d');

        const fSrc = document.getElementById('f-src');
        const fKicker = document.getElementById('f-kicker');
        const fTitle = document.getElementById('f-title');
        const fSubtitle = document.getElementById('f-subtitle');
        const fGradient = document.getElementById('f-gradient');
        const fWatermark = document.getElementById('f-watermark');
        const status = document.getElementById('status');
        const download = document.getElementById('download');
        const copyDataUrl = document.getElementById('copy-data-url');
        const loadSaved = document.getElementById('load-saved');

        let currentImage = null;

        const ASPECTS = {
          '16:9': { w: 1200, h: 675 },
          '1:1':  { w: 1080, h: 1080 },
          '4:5':  { w: 1080, h: 1350 },
        };

        function getAspect() {
          const r = document.querySelector('input[name="aspect"]:checked');
          return ASPECTS[r?.value || '16:9'];
        }
        function getAnchor() {
          return document.querySelector('input[name="anchor"]:checked')?.value || 'bottom-left';
        }
        function getColor() {
          return document.querySelector('input[name="color"]:checked')?.value || '#F7F5EE';
        }

        function setStatus(msg, kind) {
          status.textContent = msg;
          status.dataset.kind = kind || '';
          if (msg) setTimeout(() => { if (status.textContent === msg) { status.textContent = '\\\\u00a0'; status.dataset.kind = ''; } }, 4000);
        }

        function draw() {
          const { w, h } = getAspect();
          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;

          // Background
          ctx.fillStyle = '#12110E';
          ctx.fillRect(0, 0, w, h);

          if (currentImage) {
            // Object-fit: cover
            const ir = currentImage.naturalWidth / currentImage.naturalHeight;
            const cr = w / h;
            let sx = 0, sy = 0, sw = currentImage.naturalWidth, sh = currentImage.naturalHeight;
            if (ir > cr) {
              sw = sh * cr;
              sx = (currentImage.naturalWidth - sw) / 2;
            } else {
              sh = sw / cr;
              sy = (currentImage.naturalHeight - sh) / 2;
            }
            try { ctx.drawImage(currentImage, sx, sy, sw, sh, 0, 0, w, h); } catch (e) {}
          }

          // Darken gradient
          if (fGradient.checked && currentImage) {
            const anchor = getAnchor();
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            if (anchor.startsWith('top')) {
              grad.addColorStop(0, 'rgba(0,0,0,0.55)');
              grad.addColorStop(0.55, 'rgba(0,0,0,0)');
            } else if (anchor === 'center') {
              grad.addColorStop(0, 'rgba(0,0,0,0)');
              grad.addColorStop(0.45, 'rgba(0,0,0,0.55)');
              grad.addColorStop(0.55, 'rgba(0,0,0,0.55)');
              grad.addColorStop(1, 'rgba(0,0,0,0)');
            } else {
              // bottom-*
              grad.addColorStop(0.45, 'rgba(0,0,0,0)');
              grad.addColorStop(1, 'rgba(0,0,0,0.65)');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }

          // Text composition
          const color = getColor();
          const anchor = getAnchor();
          const kicker = (fKicker.value || '').trim();
          const title = (fTitle.value || '').trim();
          const subtitle = (fSubtitle.value || '').trim();

          const pad = Math.round(Math.min(w, h) * 0.06);
          const maxTextWidth = w - pad * 2;

          // Sizes relative to canvas height
          const kickerSize = Math.round(h * 0.024);
          const titleSize = Math.round(h * 0.08);
          const subtitleSize = Math.round(h * 0.032);

          // Text alignment from anchor
          const align = anchor === 'bottom-right' ? 'right' : anchor === 'center' ? 'center' : 'left';
          ctx.textAlign = align;
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = color;

          // Compute text block origin (y for title baseline)
          let textX, titleY;
          if (anchor === 'top-left' || anchor === 'top-right') {
            textX = anchor === 'top-right' ? (w - pad) : pad;
            titleY = pad + kickerSize * 2 + titleSize;
          } else if (anchor === 'center') {
            textX = w / 2;
            titleY = h / 2;
          } else {
            // bottom-*
            textX = anchor === 'bottom-right' ? (w - pad) : pad;
            titleY = h - pad - subtitleSize * 2;
          }

          // Kicker
          if (kicker) {
            ctx.font = \\\`700 \\\${kickerSize}px "JetBrains Mono", "Menlo", monospace\\\`;
            const letterSpacing = 0.16; // emulated via manual spacing if needed
            // Native canvas doesn't support letter-spacing; fallback via char-by-char draw
            const kText = kicker.toUpperCase();
            const spacing = kickerSize * letterSpacing * 0.5;
            const trackedWidth = ctx.measureText(kText).width + spacing * (kText.length - 1);
            let kx = textX;
            if (align === 'right') kx = textX - trackedWidth;
            if (align === 'center') kx = textX - trackedWidth / 2;
            ctx.textAlign = 'left';
            let cx = kx;
            for (const ch of kText) {
              ctx.fillText(ch, cx, titleY - titleSize - subtitleSize * 0.9);
              cx += ctx.measureText(ch).width + spacing;
            }
            ctx.textAlign = align;
          }

          // Title
          if (title) {
            ctx.font = \\\`800 \\\${titleSize}px "Inter", "Inter Tight", system-ui, sans-serif\\\`;
            wrapText(ctx, title, textX, titleY, maxTextWidth, titleSize * 1.08, 3);
          }

          // Subtitle
          if (subtitle) {
            ctx.font = \\\`500 \\\${subtitleSize}px "Inter", "Inter Tight", system-ui, sans-serif\\\`;
            ctx.fillStyle = color === '#12110E' ? 'rgba(18,17,14,0.78)' : 'rgba(247,245,238,0.82)';
            if (color !== '#F7F5EE' && color !== '#12110E') ctx.fillStyle = color;
            const subY = titleY + subtitleSize * 1.2;
            wrapText(ctx, subtitle, textX, subY, maxTextWidth, subtitleSize * 1.25, 2);
          }

          // Watermark
          if (fWatermark.checked) {
            const wmW = Math.round(w * 0.12);
            const wmH = Math.round(wmW * 0.28);
            const wmX = anchor === 'bottom-right' ? pad : w - pad - wmW;
            const wmY = anchor === 'top-right' ? h - pad - wmH : pad;
            // Dark pill with amber dot + POINTCAST
            ctx.fillStyle = 'rgba(18,17,14,0.85)';
            roundRect(ctx, wmX, wmY, wmW, wmH, wmH * 0.2);
            ctx.fill();
            // dot
            ctx.beginPath();
            const cx = wmX + wmH * 0.55;
            const cy = wmY + wmH * 0.5;
            const r = wmH * 0.24;
            const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            dotGrad.addColorStop(0, '#FBB040');
            dotGrad.addColorStop(1, '#8A2432');
            ctx.fillStyle = dotGrad;
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            // wordmark
            ctx.fillStyle = '#F7F5EE';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = \\\`700 \\\${Math.round(wmH * 0.38)}px "JetBrains Mono", monospace\\\`;
            ctx.fillText('POINTCAST', wmX + wmH * 1.0, cy);
          }

          if (currentImage) emptyOverlay.hidden = true;
          else emptyOverlay.hidden = false;
        }

        function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
          const words = text.split(/\\\\s+/);
          const lines = [];
          let current = '';
          for (const w of words) {
            const test = current ? current + ' ' + w : w;
            if (ctx.measureText(test).width > maxWidth && current) {
              lines.push(current);
              current = w;
            } else {
              current = test;
            }
            if (lines.length >= maxLines - 1 && ctx.measureText(current + '…').width > maxWidth) {
              while (ctx.measureText(current + '…').width > maxWidth && current.length > 1) {
                current = current.slice(0, -1);
              }
              current = current + '…';
              break;
            }
          }
          if (current) lines.push(current);
          lines.slice(0, maxLines).forEach((line, i) => {
            ctx.fillText(line, x, y + i * lineHeight);
          });
        }

        function roundRect(ctx, x, y, w, h, r) {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
        }

        // Image loading
        function loadImage(url) {
          if (!url) return;
          setStatus('loading image…', '');
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            currentImage = img;
            draw();
            setStatus('loaded · text overlays apply live', 'ok');
          };
          img.onerror = () => {
            currentImage = null;
            draw();
            setStatus('image failed to load (CORS or 404) · try a direct .png/.jpg URL', 'err');
          };
          img.src = url;
        }

        // Events — redraw on any input change
        [fSrc, fKicker, fTitle, fSubtitle, fGradient, fWatermark].forEach((el) => {
          el.addEventListener('input', () => {
            if (el === fSrc) loadImage(fSrc.value.trim());
            else draw();
          });
        });
        document.querySelectorAll('input[name="anchor"], input[name="color"], input[name="aspect"]').forEach((r) => {
          r.addEventListener('change', draw);
        });

        download.addEventListener('click', () => {
          if (!currentImage) { setStatus('load an image first', 'warn'); return; }
          try {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            a.download = \\\`pointcast-moment-\\\${today}.png\\\`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setStatus('downloaded · pointcast-moment-' + today + '.png', 'ok');
          } catch (e) {
            setStatus('export blocked — image origin denies canvas read. try a direct hosted URL.', 'err');
          }
        });

        copyDataUrl.addEventListener('click', async () => {
          if (!currentImage) { setStatus('load an image first', 'warn'); return; }
          try {
            const url = canvas.toDataURL('image/png');
            await navigator.clipboard.writeText(url);
            setStatus('data URL copied · paste anywhere images are accepted', 'ok');
          } catch (e) {
            setStatus('export blocked — CORS prevents reading canvas pixels', 'err');
          }
        });

        loadSaved.addEventListener('click', () => {
          const key = 'pc:moment:image:' + new Date().toISOString().slice(0, 10);
          try {
            const cached = JSON.parse(localStorage.getItem(key) || 'null');
            if (cached && cached.url) {
              fSrc.value = cached.url;
              loadImage(cached.url);
              setStatus('loaded today\\\\u2019s saved moment URL', 'ok');
            } else {
              setStatus('no saved URL for today on this device · save one on /moment first', 'warn');
            }
          } catch (e) {
            setStatus('localStorage blocked', 'err');
          }
        });

        // Initial paint (no image)
        draw();

        // Seed from ?src= URL param
        const params = new URLSearchParams(window.location.search);
        const seed = params.get('src');
        if (seed) { fSrc.value = seed; loadImage(seed); }
      })();
    <\/script> </main> `])), maybeRenderHead(), dateShort, addAttribute(unsplashUrl, "href"), addAttribute(unsplashUrl, "href"), unsplashKeywords, addAttribute(presetKicker, "value"), addAttribute(presetTitle, "value"), addAttribute(presetSubtitle, "value")) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/moment/editor.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/moment/editor.astro";
const $$url = "/moment/editor";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Editor,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
