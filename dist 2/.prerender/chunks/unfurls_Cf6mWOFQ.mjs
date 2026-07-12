import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { a as absoluteUrl, U as UNFURL_SHRINES, S as SITE_URL, b as absoluteImage } from './unfurl-shrines_CZAaG8nC.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Unfurls = createComponent(($$result, $$props, $$slots) => {
  const title = "URL unfurl shrines";
  const description = "A v2 landing page, shrine wall, and builder for PointCast URL unfurls.";
  const pageUrl = absoluteUrl("/unfurls");
  const shrineKinds = ["all", "block", "page", "room", "campaign", "game", "feed", "system"];
  const totalProofLinks = UNFURL_SHRINES.reduce((sum, shrine) => sum + shrine.proof.length, 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        name: title,
        description,
        url: pageUrl,
        isPartOf: { "@type": "WebSite", name: "PointCast", url: SITE_URL }
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#shrines`,
        name: "PointCast URL unfurl shrines",
        itemListElement: UNFURL_SHRINES.map((shrine, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(shrine.path),
          name: shrine.title,
          description: shrine.description,
          image: absoluteImage(shrine.image)
        }))
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/og-home-v2.png", "imageAlt": "PointCast URL unfurl shrines", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/unfurls.json", title: "URL unfurl shrine manifest" }], "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: "Open shrines", action: "link", target: pageUrl },
      { label: "Shrine JSON", action: "link", target: absoluteUrl("/unfurls.json") },
      { label: "Block 0304", action: "link", target: absoluteUrl("/b/0304/") }
    ]
  }, "data-astro-cid-azdthce3": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="unfurls-page" data-unfurls data-astro-cid-azdthce3> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-azdthce3> <a href="/" data-astro-cid-azdthce3>Home</a> <span data-astro-cid-azdthce3>/</span> <span data-astro-cid-azdthce3>unfurls</span> <a href="/unfurls.json" data-astro-cid-azdthce3>JSON</a> </nav> <header class="hero" data-astro-cid-azdthce3> <div class="hero__copy" data-astro-cid-azdthce3> <p class="kicker mono" data-astro-cid-azdthce3>URL SHRINES · OPEN GRAPH · FRAMES</p> <h1 data-astro-cid-azdthce3>Every important PointCast URL gets a proper little shrine.</h1> <p data-astro-cid-azdthce3>\nV2 is a landing page, a proof wall, and a tiny builder for making the\n          next unfurl before it gets shipped. Paste, share, cast, text, index.\n          each route gets a canonical image, a job, a ritual, and a shareable\n          mini shrine at <code data-astro-cid-azdthce3>/u/slug</code>.\n</p> <div class="hero__stats" aria-label="Unfurl shrine stats" data-astro-cid-azdthce3> <div data-astro-cid-azdthce3><strong data-astro-cid-azdthce3>', '</strong><span class="mono" data-astro-cid-azdthce3>Shrines</span></div> <div data-astro-cid-azdthce3><strong data-astro-cid-azdthce3>', '</strong><span class="mono" data-astro-cid-azdthce3>Proof Links</span></div> <div data-astro-cid-azdthce3><strong data-astro-cid-azdthce3>3</strong><span class="mono" data-astro-cid-azdthce3>Validators</span></div> </div> <div class="hero__actions" data-astro-cid-azdthce3> <a href="#builder" data-astro-cid-azdthce3>Build Shrine</a> <a href="#shrines" data-astro-cid-azdthce3>Browse Wall</a> <a href="/unfurls.json" data-astro-cid-azdthce3>JSON</a> </div> </div> <div class="hero__console" aria-label="Unfurl tester" data-astro-cid-azdthce3> <label for="url-input" class="mono" data-astro-cid-azdthce3>TRY A URL</label> <div class="input-row" data-astro-cid-azdthce3> <input id="url-input" type="url"', ' data-url-input data-astro-cid-azdthce3> <button type="button" data-load-url data-astro-cid-azdthce3>Load</button> </div> <div class="mini-preview" data-mini-preview data-astro-cid-azdthce3> <img src="/images/og/b/0304.png" alt="" width="1200" height="630" loading="eager" data-astro-cid-azdthce3> <div data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>REFERENCE</span> <strong data-astro-cid-azdthce3>CH.SPN · 0304 — breathe</strong> <p data-astro-cid-azdthce3>Article metadata, Farcaster buttons, JSON alternate, and stable OG art.</p> </div> </div> </div> </header> <section class="builder" id="builder" aria-labelledby="builder-title" data-astro-cid-azdthce3> <div class="builder__intro" data-astro-cid-azdthce3> <p class="kicker mono" data-astro-cid-azdthce3>SHRINE BUILDER · V2</p> <h2 id="builder-title" data-astro-cid-azdthce3>Compose the next unfurl before it lands.</h2> <p data-astro-cid-azdthce3>\nFill the fields, inspect the preview, then copy the manifest object or\n          meta tags. It is intentionally local-only: a sketch bench for deciding\n          whether a URL deserves to become a permanent shrine.\n</p> </div> <form class="builder__form" data-builder data-astro-cid-azdthce3> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>URL path</span> <input name="path" value="/b/0304/" autocomplete="off" data-astro-cid-azdthce3> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Title</span> <input name="title" value="CH.SPN · 0304 — breathe" autocomplete="off" data-astro-cid-azdthce3> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Description</span> <textarea name="description" data-astro-cid-azdthce3>A single block unfurl with article metadata, Farcaster buttons, canonical JSON, and a 1200x630 block card.</textarea> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Image</span> <input name="image" value="/images/og/b/0304.png" autocomplete="off" data-astro-cid-azdthce3> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Kind</span> <select name="kind" data-astro-cid-azdthce3> <option value="block" data-astro-cid-azdthce3>block</option> <option value="page" data-astro-cid-azdthce3>page</option> <option value="room" data-astro-cid-azdthce3>room</option> <option value="campaign" data-astro-cid-azdthce3>campaign</option> <option value="game" data-astro-cid-azdthce3>game</option> <option value="feed" data-astro-cid-azdthce3>feed</option> <option value="system" data-astro-cid-azdthce3>system</option> </select> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Audience</span> <input name="audience" value="Farcaster, iMessage, X, Slack, and anyone inspecting per-block previews" autocomplete="off" data-astro-cid-azdthce3> </label> <label class="builder__wide" data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Ritual</span> <input name="ritual" value="Use as the reference specimen for whether block unfurls are healthy." autocomplete="off" data-astro-cid-azdthce3> </label> <div class="builder__buttons" data-astro-cid-azdthce3> <button type="button" data-builder-reset data-astro-cid-azdthce3>Reset</button> <button type="button" data-copy-builder="json" data-astro-cid-azdthce3>Copy JSON</button> <button type="button" data-copy-builder="meta" data-astro-cid-azdthce3>Copy Meta</button> </div> </form> <div class="builder__output" data-astro-cid-azdthce3> <div class="generated-card" data-generated-card data-astro-cid-azdthce3> <img src="/images/og/b/0304.png" alt="" width="1200" height="630" data-astro-cid-azdthce3> <div data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>BLOCK</span> <strong data-astro-cid-azdthce3>CH.SPN · 0304 — breathe</strong> <p data-astro-cid-azdthce3>A single block unfurl with article metadata, Farcaster buttons, canonical JSON, and a 1200x630 block card.</p> <small data-astro-cid-azdthce3>https://pointcast.xyz/b/0304/</small> </div> </div> <pre data-builder-code data-astro-cid-azdthce3></pre> </div> </section> <section class="toolbar" aria-label="Filters" data-astro-cid-azdthce3> ', ' </section> <section class="shrine-grid" id="shrines" aria-label="URL unfurl shrines" data-astro-cid-azdthce3> ', ` </section> </div> <script>
    (function () {
      const root = document.querySelector('[data-unfurls]');
      if (!root) return;

      const cards = Array.from(root.querySelectorAll('.shrine'));
      const filters = Array.from(root.querySelectorAll('[data-filter]'));
      const input = root.querySelector('[data-url-input]');
      const loadButton = root.querySelector('[data-load-url]');
      const preview = root.querySelector('[data-mini-preview]');
      const builder = root.querySelector('[data-builder]');
      const builderCode = root.querySelector('[data-builder-code]');
      const generatedCard = root.querySelector('[data-generated-card]');
      const defaults = {
        path: '/b/0304/',
        title: 'CH.SPN · 0304 — breathe',
        description: 'A single block unfurl with article metadata, Farcaster buttons, canonical JSON, and a 1200x630 block card.',
        image: '/images/og/b/0304.png',
        kind: 'block',
        audience: 'Farcaster, iMessage, X, Slack, and anyone inspecting per-block previews',
        ritual: 'Use as the reference specimen for whether block unfurls are healthy.',
      };

      function copy(text, button) {
        navigator.clipboard?.writeText(text).then(function () {
          if (!button) return;
          const old = button.textContent;
          button.textContent = 'Copied';
          window.setTimeout(function () { button.textContent = old; }, 900);
        }).catch(function () {});
      }

      root.addEventListener('click', function (event) {
        const copyButton = event.target.closest('[data-copy]');
        if (copyButton) {
          copy(copyButton.getAttribute('data-copy'), copyButton);
          return;
        }

        const filterButton = event.target.closest('[data-filter]');
        if (filterButton) {
          const filter = filterButton.getAttribute('data-filter');
          filters.forEach(function (button) {
            button.classList.toggle('is-active', button === filterButton);
          });
          cards.forEach(function (card) {
            const show = filter === 'all' || card.getAttribute('data-kind') === filter;
            card.toggleAttribute('hidden', !show);
          });
        }
      });

      function loadPreview() {
        if (!input || !preview) return;
        const value = input.value.trim();
        const match = cards.find(function (card) {
          return card.getAttribute('data-url') === value || card.getAttribute('data-url').replace(/\\/$/, '') === value.replace(/\\/$/, '');
        });
        const img = preview.querySelector('img');
        const label = preview.querySelector('span');
        const title = preview.querySelector('strong');
        const desc = preview.querySelector('p');
        if (match) {
          img.src = match.getAttribute('data-image');
          label.textContent = match.getAttribute('data-kind').toUpperCase();
          title.textContent = match.getAttribute('data-title');
          desc.textContent = match.getAttribute('data-description');
        } else {
          img.src = '/images/og/og-home-v2.png';
          label.textContent = 'CUSTOM';
          title.textContent = value || 'Paste a URL';
          desc.textContent = 'Open this URL in the validator links below to see how third-party crawlers read it.';
        }
      }

      function slugify(value) {
        return (value || 'new-shrine')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 64) || 'new-shrine';
      }

      function absolute(value) {
        try {
          return new URL(value || '/', 'https://pointcast.xyz').href;
        } catch (error) {
          return 'https://pointcast.xyz/';
        }
      }

      function builderData() {
        if (!builder) return { ...defaults };
        const data = new FormData(builder);
        return {
          path: String(data.get('path') || defaults.path),
          title: String(data.get('title') || defaults.title),
          description: String(data.get('description') || defaults.description),
          image: String(data.get('image') || defaults.image),
          kind: String(data.get('kind') || defaults.kind),
          audience: String(data.get('audience') || defaults.audience),
          ritual: String(data.get('ritual') || defaults.ritual),
        };
      }

      function metaSnippet(item) {
        const url = absolute(item.path);
        const image = absolute(item.image);
        return [
          '<meta property="og:title" content="' + item.title + '" />',
          '<meta property="og:description" content="' + item.description + '" />',
          '<meta property="og:url" content="' + url + '" />',
          '<meta property="og:image" content="' + image + '" />',
          '<meta name="twitter:card" content="summary_large_image" />',
        ].join('\\n');
      }

      function renderBuilder() {
        if (!builderCode || !generatedCard) return;
        const item = builderData();
        const shrine = {
          slug: slugify(item.title),
          path: item.path,
          title: item.title,
          description: item.description,
          image: item.image,
          kind: item.kind,
          audience: item.audience,
          ritual: item.ritual,
          miniPath: '/u/' + slugify(item.title),
          proof: [item.path],
        };
        const img = generatedCard.querySelector('img');
        const label = generatedCard.querySelector('span');
        const title = generatedCard.querySelector('strong');
        const desc = generatedCard.querySelector('p');
        const url = generatedCard.querySelector('small');
        img.src = item.image;
        label.textContent = item.kind.toUpperCase();
        title.textContent = item.title;
        desc.textContent = item.description;
        url.textContent = absolute(item.path);
        builderCode.textContent = JSON.stringify(shrine, null, 2);
      }

      loadButton?.addEventListener('click', loadPreview);
      input?.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') loadPreview();
      });
      builder?.addEventListener('input', renderBuilder);
      root.addEventListener('click', function (event) {
        const copyBuilder = event.target.closest('[data-copy-builder]');
        if (copyBuilder) {
          const mode = copyBuilder.getAttribute('data-copy-builder');
          const item = builderData();
          copy(mode === 'meta' ? metaSnippet(item) : builderCode.textContent, copyBuilder);
        }
        const reset = event.target.closest('[data-builder-reset]');
        if (reset && builder) {
          Object.entries(defaults).forEach(function ([key, value]) {
            const field = builder.elements[key];
            if (field) field.value = value;
          });
          renderBuilder();
        }
      });
      renderBuilder();
    })();
  <\/script> `], [" ", '<div class="unfurls-page" data-unfurls data-astro-cid-azdthce3> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-azdthce3> <a href="/" data-astro-cid-azdthce3>Home</a> <span data-astro-cid-azdthce3>/</span> <span data-astro-cid-azdthce3>unfurls</span> <a href="/unfurls.json" data-astro-cid-azdthce3>JSON</a> </nav> <header class="hero" data-astro-cid-azdthce3> <div class="hero__copy" data-astro-cid-azdthce3> <p class="kicker mono" data-astro-cid-azdthce3>URL SHRINES · OPEN GRAPH · FRAMES</p> <h1 data-astro-cid-azdthce3>Every important PointCast URL gets a proper little shrine.</h1> <p data-astro-cid-azdthce3>\nV2 is a landing page, a proof wall, and a tiny builder for making the\n          next unfurl before it gets shipped. Paste, share, cast, text, index.\n          each route gets a canonical image, a job, a ritual, and a shareable\n          mini shrine at <code data-astro-cid-azdthce3>/u/slug</code>.\n</p> <div class="hero__stats" aria-label="Unfurl shrine stats" data-astro-cid-azdthce3> <div data-astro-cid-azdthce3><strong data-astro-cid-azdthce3>', '</strong><span class="mono" data-astro-cid-azdthce3>Shrines</span></div> <div data-astro-cid-azdthce3><strong data-astro-cid-azdthce3>', '</strong><span class="mono" data-astro-cid-azdthce3>Proof Links</span></div> <div data-astro-cid-azdthce3><strong data-astro-cid-azdthce3>3</strong><span class="mono" data-astro-cid-azdthce3>Validators</span></div> </div> <div class="hero__actions" data-astro-cid-azdthce3> <a href="#builder" data-astro-cid-azdthce3>Build Shrine</a> <a href="#shrines" data-astro-cid-azdthce3>Browse Wall</a> <a href="/unfurls.json" data-astro-cid-azdthce3>JSON</a> </div> </div> <div class="hero__console" aria-label="Unfurl tester" data-astro-cid-azdthce3> <label for="url-input" class="mono" data-astro-cid-azdthce3>TRY A URL</label> <div class="input-row" data-astro-cid-azdthce3> <input id="url-input" type="url"', ' data-url-input data-astro-cid-azdthce3> <button type="button" data-load-url data-astro-cid-azdthce3>Load</button> </div> <div class="mini-preview" data-mini-preview data-astro-cid-azdthce3> <img src="/images/og/b/0304.png" alt="" width="1200" height="630" loading="eager" data-astro-cid-azdthce3> <div data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>REFERENCE</span> <strong data-astro-cid-azdthce3>CH.SPN · 0304 — breathe</strong> <p data-astro-cid-azdthce3>Article metadata, Farcaster buttons, JSON alternate, and stable OG art.</p> </div> </div> </div> </header> <section class="builder" id="builder" aria-labelledby="builder-title" data-astro-cid-azdthce3> <div class="builder__intro" data-astro-cid-azdthce3> <p class="kicker mono" data-astro-cid-azdthce3>SHRINE BUILDER · V2</p> <h2 id="builder-title" data-astro-cid-azdthce3>Compose the next unfurl before it lands.</h2> <p data-astro-cid-azdthce3>\nFill the fields, inspect the preview, then copy the manifest object or\n          meta tags. It is intentionally local-only: a sketch bench for deciding\n          whether a URL deserves to become a permanent shrine.\n</p> </div> <form class="builder__form" data-builder data-astro-cid-azdthce3> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>URL path</span> <input name="path" value="/b/0304/" autocomplete="off" data-astro-cid-azdthce3> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Title</span> <input name="title" value="CH.SPN · 0304 — breathe" autocomplete="off" data-astro-cid-azdthce3> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Description</span> <textarea name="description" data-astro-cid-azdthce3>A single block unfurl with article metadata, Farcaster buttons, canonical JSON, and a 1200x630 block card.</textarea> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Image</span> <input name="image" value="/images/og/b/0304.png" autocomplete="off" data-astro-cid-azdthce3> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Kind</span> <select name="kind" data-astro-cid-azdthce3> <option value="block" data-astro-cid-azdthce3>block</option> <option value="page" data-astro-cid-azdthce3>page</option> <option value="room" data-astro-cid-azdthce3>room</option> <option value="campaign" data-astro-cid-azdthce3>campaign</option> <option value="game" data-astro-cid-azdthce3>game</option> <option value="feed" data-astro-cid-azdthce3>feed</option> <option value="system" data-astro-cid-azdthce3>system</option> </select> </label> <label data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Audience</span> <input name="audience" value="Farcaster, iMessage, X, Slack, and anyone inspecting per-block previews" autocomplete="off" data-astro-cid-azdthce3> </label> <label class="builder__wide" data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>Ritual</span> <input name="ritual" value="Use as the reference specimen for whether block unfurls are healthy." autocomplete="off" data-astro-cid-azdthce3> </label> <div class="builder__buttons" data-astro-cid-azdthce3> <button type="button" data-builder-reset data-astro-cid-azdthce3>Reset</button> <button type="button" data-copy-builder="json" data-astro-cid-azdthce3>Copy JSON</button> <button type="button" data-copy-builder="meta" data-astro-cid-azdthce3>Copy Meta</button> </div> </form> <div class="builder__output" data-astro-cid-azdthce3> <div class="generated-card" data-generated-card data-astro-cid-azdthce3> <img src="/images/og/b/0304.png" alt="" width="1200" height="630" data-astro-cid-azdthce3> <div data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>BLOCK</span> <strong data-astro-cid-azdthce3>CH.SPN · 0304 — breathe</strong> <p data-astro-cid-azdthce3>A single block unfurl with article metadata, Farcaster buttons, canonical JSON, and a 1200x630 block card.</p> <small data-astro-cid-azdthce3>https://pointcast.xyz/b/0304/</small> </div> </div> <pre data-builder-code data-astro-cid-azdthce3></pre> </div> </section> <section class="toolbar" aria-label="Filters" data-astro-cid-azdthce3> ', ' </section> <section class="shrine-grid" id="shrines" aria-label="URL unfurl shrines" data-astro-cid-azdthce3> ', ` </section> </div> <script>
    (function () {
      const root = document.querySelector('[data-unfurls]');
      if (!root) return;

      const cards = Array.from(root.querySelectorAll('.shrine'));
      const filters = Array.from(root.querySelectorAll('[data-filter]'));
      const input = root.querySelector('[data-url-input]');
      const loadButton = root.querySelector('[data-load-url]');
      const preview = root.querySelector('[data-mini-preview]');
      const builder = root.querySelector('[data-builder]');
      const builderCode = root.querySelector('[data-builder-code]');
      const generatedCard = root.querySelector('[data-generated-card]');
      const defaults = {
        path: '/b/0304/',
        title: 'CH.SPN · 0304 — breathe',
        description: 'A single block unfurl with article metadata, Farcaster buttons, canonical JSON, and a 1200x630 block card.',
        image: '/images/og/b/0304.png',
        kind: 'block',
        audience: 'Farcaster, iMessage, X, Slack, and anyone inspecting per-block previews',
        ritual: 'Use as the reference specimen for whether block unfurls are healthy.',
      };

      function copy(text, button) {
        navigator.clipboard?.writeText(text).then(function () {
          if (!button) return;
          const old = button.textContent;
          button.textContent = 'Copied';
          window.setTimeout(function () { button.textContent = old; }, 900);
        }).catch(function () {});
      }

      root.addEventListener('click', function (event) {
        const copyButton = event.target.closest('[data-copy]');
        if (copyButton) {
          copy(copyButton.getAttribute('data-copy'), copyButton);
          return;
        }

        const filterButton = event.target.closest('[data-filter]');
        if (filterButton) {
          const filter = filterButton.getAttribute('data-filter');
          filters.forEach(function (button) {
            button.classList.toggle('is-active', button === filterButton);
          });
          cards.forEach(function (card) {
            const show = filter === 'all' || card.getAttribute('data-kind') === filter;
            card.toggleAttribute('hidden', !show);
          });
        }
      });

      function loadPreview() {
        if (!input || !preview) return;
        const value = input.value.trim();
        const match = cards.find(function (card) {
          return card.getAttribute('data-url') === value || card.getAttribute('data-url').replace(/\\\\/$/, '') === value.replace(/\\\\/$/, '');
        });
        const img = preview.querySelector('img');
        const label = preview.querySelector('span');
        const title = preview.querySelector('strong');
        const desc = preview.querySelector('p');
        if (match) {
          img.src = match.getAttribute('data-image');
          label.textContent = match.getAttribute('data-kind').toUpperCase();
          title.textContent = match.getAttribute('data-title');
          desc.textContent = match.getAttribute('data-description');
        } else {
          img.src = '/images/og/og-home-v2.png';
          label.textContent = 'CUSTOM';
          title.textContent = value || 'Paste a URL';
          desc.textContent = 'Open this URL in the validator links below to see how third-party crawlers read it.';
        }
      }

      function slugify(value) {
        return (value || 'new-shrine')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 64) || 'new-shrine';
      }

      function absolute(value) {
        try {
          return new URL(value || '/', 'https://pointcast.xyz').href;
        } catch (error) {
          return 'https://pointcast.xyz/';
        }
      }

      function builderData() {
        if (!builder) return { ...defaults };
        const data = new FormData(builder);
        return {
          path: String(data.get('path') || defaults.path),
          title: String(data.get('title') || defaults.title),
          description: String(data.get('description') || defaults.description),
          image: String(data.get('image') || defaults.image),
          kind: String(data.get('kind') || defaults.kind),
          audience: String(data.get('audience') || defaults.audience),
          ritual: String(data.get('ritual') || defaults.ritual),
        };
      }

      function metaSnippet(item) {
        const url = absolute(item.path);
        const image = absolute(item.image);
        return [
          '<meta property="og:title" content="' + item.title + '" />',
          '<meta property="og:description" content="' + item.description + '" />',
          '<meta property="og:url" content="' + url + '" />',
          '<meta property="og:image" content="' + image + '" />',
          '<meta name="twitter:card" content="summary_large_image" />',
        ].join('\\\\n');
      }

      function renderBuilder() {
        if (!builderCode || !generatedCard) return;
        const item = builderData();
        const shrine = {
          slug: slugify(item.title),
          path: item.path,
          title: item.title,
          description: item.description,
          image: item.image,
          kind: item.kind,
          audience: item.audience,
          ritual: item.ritual,
          miniPath: '/u/' + slugify(item.title),
          proof: [item.path],
        };
        const img = generatedCard.querySelector('img');
        const label = generatedCard.querySelector('span');
        const title = generatedCard.querySelector('strong');
        const desc = generatedCard.querySelector('p');
        const url = generatedCard.querySelector('small');
        img.src = item.image;
        label.textContent = item.kind.toUpperCase();
        title.textContent = item.title;
        desc.textContent = item.description;
        url.textContent = absolute(item.path);
        builderCode.textContent = JSON.stringify(shrine, null, 2);
      }

      loadButton?.addEventListener('click', loadPreview);
      input?.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') loadPreview();
      });
      builder?.addEventListener('input', renderBuilder);
      root.addEventListener('click', function (event) {
        const copyBuilder = event.target.closest('[data-copy-builder]');
        if (copyBuilder) {
          const mode = copyBuilder.getAttribute('data-copy-builder');
          const item = builderData();
          copy(mode === 'meta' ? metaSnippet(item) : builderCode.textContent, copyBuilder);
        }
        const reset = event.target.closest('[data-builder-reset]');
        if (reset && builder) {
          Object.entries(defaults).forEach(function ([key, value]) {
            const field = builder.elements[key];
            if (field) field.value = value;
          });
          renderBuilder();
        }
      });
      renderBuilder();
    })();
  <\/script> `])), maybeRenderHead(), UNFURL_SHRINES.length, totalProofLinks, addAttribute(absoluteUrl("/b/0304/"), "value"), shrineKinds.map((kind) => renderTemplate`<button type="button"${addAttribute(kind === "all" ? "filter is-active" : "filter", "class")}${addAttribute(kind, "data-filter")} data-astro-cid-azdthce3> ${kind === "all" ? "All" : `${kind[0].toUpperCase()}${kind.slice(1)}s`} </button>`), UNFURL_SHRINES.map((shrine) => {
    const url = absoluteUrl(shrine.path);
    const image = absoluteImage(shrine.image);
    const validator = `https://www.opengraph.xyz/url/${encodeURIComponent(url)}`;
    const miniUrl = absoluteUrl(shrine.miniPath);
    const miniValidator = `https://www.opengraph.xyz/url/${encodeURIComponent(miniUrl)}`;
    const twitter = `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(url)}`;
    return renderTemplate`<article class="shrine"${addAttribute(shrine.kind, "data-kind")}${addAttribute(url, "data-url")}${addAttribute(shrine.title, "data-title")}${addAttribute(shrine.description, "data-description")}${addAttribute(image, "data-image")} data-astro-cid-azdthce3> <a class="shrine__image"${addAttribute(shrine.path, "href")}${addAttribute(`Open ${shrine.title}`, "aria-label")} data-astro-cid-azdthce3> <img${addAttribute(shrine.image, "src")} alt="" width="1200" height="630" loading="lazy" decoding="async" data-astro-cid-azdthce3> </a> <div class="shrine__body" data-astro-cid-azdthce3> <div class="shrine__meta" data-astro-cid-azdthce3> <span class="mono" data-astro-cid-azdthce3>${shrine.kind}</span> <span class="mono" data-astro-cid-azdthce3>${shrine.path}</span> </div> <h2 data-astro-cid-azdthce3><a${addAttribute(shrine.path, "href")} data-astro-cid-azdthce3>${shrine.title}</a></h2> <p data-astro-cid-azdthce3>${shrine.description}</p> <dl data-astro-cid-azdthce3> <div data-astro-cid-azdthce3> <dt data-astro-cid-azdthce3>Audience</dt> <dd data-astro-cid-azdthce3>${shrine.audience}</dd> </div> <div data-astro-cid-azdthce3> <dt data-astro-cid-azdthce3>Ritual</dt> <dd data-astro-cid-azdthce3>${shrine.ritual}</dd> </div> </dl> <div class="proofs" data-astro-cid-azdthce3> ${shrine.proof.map((path) => renderTemplate`<a${addAttribute(path, "href")} data-astro-cid-azdthce3>${path}</a>`)} </div> <div class="actions" data-astro-cid-azdthce3> <a${addAttribute(shrine.path, "href")} data-astro-cid-azdthce3>Open</a> <a${addAttribute(shrine.miniPath, "href")} data-astro-cid-azdthce3>Mini shrine</a> <button type="button"${addAttribute(url, "data-copy")} data-astro-cid-azdthce3>Copy URL</button> <button type="button"${addAttribute(miniUrl, "data-copy")} data-astro-cid-azdthce3>Copy shrine</button> <a${addAttribute(validator, "href")} target="_blank" rel="noopener" data-astro-cid-azdthce3>OG</a> <a${addAttribute(miniValidator, "href")} target="_blank" rel="noopener" data-astro-cid-azdthce3>Mini OG</a> <a${addAttribute(twitter, "href")} target="_blank" rel="noopener" data-astro-cid-azdthce3>Card test</a> </div> </div> </article>`;
  })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/unfurls.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/unfurls.astro";
const $$url = "/unfurls";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Unfurls,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
