import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { toPublicManifest } from '../src/lib/art-v2.mjs';
import { initArtGallery } from '../src/scripts/art-v2.mjs';

const root = new URL('../', import.meta.url);
const require = createRequire(new URL('../package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const sharp = require('sharp');
const compiler = await import(pathToFileURL(require.resolve('@astrojs/compiler')));
const { experimental_AstroContainer } = await import(pathToFileURL(require.resolve('astro/container')));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const displayTitle = (work) => work.v2?.title || work.title;

test('Midjourney V2: verified assets, paired interactions, provenance, and safe disabled commerce', { concurrency: false }, async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), 'pointcast-art-v2-test-'));
  const originalGlobals = Object.fromEntries(['document', 'Element', 'HTMLElement', 'AbortController'].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(async () => {
    for (const [name, descriptor] of Object.entries(originalGlobals)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
    await rm(temporary, { recursive: true, force: true });
  });
  const input = JSON.parse(await readFile(new URL('src/data/art-v2.json', root), 'utf8'));
  const stagedSource = await readFile(new URL('src/pages/art/v2/index.astro', root), 'utf8');
  const manifest = toPublicManifest(input);
  const checks = [];
  const check = async (name, action) => { await t.test(name, action); checks.push(name); };

  await check('All 50 original and V2 titles, captions, prompts, and provenance hashes survive public projection', () => {
    assert.equal(manifest.works.length, 50);
    assert.equal(new Set(manifest.works.map((work) => work.v2?.title)).size, 50);
    assert.equal(new Set(manifest.works.map((work) => work.v2?.sha256)).size, 50);
    assert.equal(new Set(manifest.works.map((work) => work.source.sha256)).size, 50);
    input.works.forEach((original, index) => {
      const published = manifest.works[index];
      assert.equal(published.id, original.id);
      assert.equal(published.title, original.title);
      for (const field of ['catalogUrl', 'prompt', 'sha256', 'generationDate', 'referenceRole', 'visualFamily']) {
        assert.equal(published.source[field], original.source[field], `${original.id}: source ${field}`);
      }
      for (const field of ['title', 'caption', 'prompt', 'generatedAt', 'generator', 'sha256', 'masterSha256']) {
        assert.ok(original.v2[field], `${original.id}: missing V2 ${field}`);
        assert.equal(published.v2[field], original.v2[field], `${original.id}: V2 ${field}`);
      }
      assert.match(published.source.sha256, /^[0-9a-f]{64}$/);
      assert.match(published.v2.sha256, /^[0-9a-f]{64}$/);
      // Master hashes are preserved producer receipts; masters are not repo assets.
      assert.match(published.v2.masterSha256, /^[0-9a-f]{64}$/);
    });
  });
  await check('All 200 actual WebPs decode at source 900/480 and V2 1024/420; all 50 V2 file hashes match', async () => {
    for (const work of manifest.works) {
      const files = [[work.source.asset, 900], [work.source.thumbnail, 480], [work.v2.asset, 1024], [work.v2.thumbnail, 420]];
      await Promise.all(files.map(async ([asset, size]) => {
        assert.match(asset, /^\/images\/art-v2\/[A-Za-z0-9/_-]+\.webp$/);
        const bytes = await readFile(new URL(`public${asset}`, root));
        const metadata = await sharp(bytes).metadata();
        assert.equal(metadata.format, 'webp', `${work.id}: ${asset}`);
        assert.equal(metadata.width, size, `${work.id}: ${asset}`);
        assert.equal(metadata.height, size, `${work.id}: ${asset}`);
        const decoded = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
        assert.equal(decoded.info.width, size);
        assert.equal(decoded.info.height, size);
        if (asset === work.v2.asset) assert.equal(digest(bytes), work.v2.sha256, `${work.id}: V2 byte digest`);
      }));
      assert.equal(work.source.width, 900);
      assert.equal(work.source.height, 900);
      assert.equal(work.source.thumbnailWidth, 480);
      assert.equal(work.v2.width, 1024);
      assert.equal(work.v2.height, 1024);
      assert.equal(work.v2.thumbnailWidth, 420);
    }
  });
  await check('Original source hashes and titles match the owner-published repository catalog and JPEG bytes', async () => {
    for (const work of manifest.works) {
      const slug = new URL(work.source.catalogUrl).pathname.split('/').at(-1);
      const catalog = JSON.parse(await readFile(new URL(`src/content/gallery/${slug}`, root), 'utf8'));
      assert.equal(catalog.title, work.title, `${work.id}: original catalog title`);
      assert.equal(catalog.promptSummary, work.source.prompt, `${work.id}: original prompt fragment`);
      assert.match(catalog.imageUrl, /^\/images\/[A-Za-z0-9/_.-]+\.jpg$/);
      assert.equal(digest(await readFile(new URL(`public${catalog.imageUrl}`, root))), work.source.sha256, `${work.id}: original source JPEG digest`);
    }
  });

  // Compile the real staged template, preserving every production interaction
  // selector. Replace only the shared layout with its main wrapper, use props for
  // data injection, and omit the bundled bootstrap (the actual client is imported
  // above). Compiler output and evidence are written only into os.tmpdir().
  const fixtureSource = stagedSource
    .replace(/^import BlockLayout.*\n/m, '')
    .replace(/^import gallery.*\n/m, 'const gallery = Astro.props.fixture;\n')
    .replace(/^import \{ toPublicManifest \}.*$/m, `import { toPublicManifest } from '${new URL('src/lib/art-v2.mjs', root)}';`)
    .replace(/^import ['"].*art-v2\.css.*\n/m, '')
    .replace(/<BlockLayout[\s\S]*?>/, '<main id="main-content">')
    .replace('</BlockLayout>', '</main>')
    .replace(/<script>\s*import \{ initArtGallery \}[\s\S]*?<\/script>/, '');
  const compiled = await compiler.transform(fixtureSource, {
    filename: join(temporary, 'fixture.astro'),
    internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href,
    resultScopedSlot: true,
  });
  const fixtureModulePath = join(temporary, 'compiled-fixture.mjs');
  // The standalone compiler emits legacy bundler metadata that Astro 6 normally
  // strips during its Vite transform. It is unused by this component render.
  const compiledCode = compiled.code
    .replace(/,\s*createMetadata as \$\$createMetadata/, '')
    .replace(/^export const \$\$metadata.*\n/m, '')
    .replace(/['"]astro\/runtime\/server\/index\.js['"]/g, JSON.stringify(pathToFileURL(require.resolve('astro/runtime/server/index.js')).href));
  await writeFile(fixtureModulePath, compiledCode);
  const { default: Fixture } = await import(pathToFileURL(fixtureModulePath));
  const container = await experimental_AstroContainer.create();
  const render = (fixture) => container.renderToString(Fixture, { props: { fixture } });
  const html = await render(input);
  await writeFile(join(temporary, 'rendered-fixture.html'), html);
  const dom = new JSDOM(html, { url: 'https://pointcast.xyz/art/v2/', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const { window } = dom;
  for (const name of ['document', 'Element', 'HTMLElement', 'AbortController']) globalThis[name] = window[name];
  const document = window.document;
  const gallery = document.querySelector('[data-art-gallery]');
  const dialog = gallery.querySelector('[data-viewer]');

  // jsdom has neither native modal top-layer/inert behavior nor browser layout.
  // These shims test the gallery's listeners/state/focus paths; they do not claim
  // real-browser validation of modal containment or visual presentation.
  dialog.showModal = function () { this.open = true; };
  dialog.close = function () {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new window.Event('close'));
  };
  window.HTMLElement.prototype.getClientRects = function () {
    const hidden = this.closest('[hidden]') || (this.closest('details:not([open])') && this.tagName !== 'SUMMARY');
    return hidden ? [] : [{ x: 0, y: 0, width: 10, height: 10 }];
  };
  const cleanup = initArtGallery(gallery);
  const q = (selector) => gallery.querySelector(selector);
  const qa = (selector) => [...gallery.querySelectorAll(selector)];
  const click = (element) => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  const key = (element, name, options = {}) => {
    const event = new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
    return event;
  };
  const visible = () => qa('[data-work-id]').filter((element) => !element.hidden).map((element) => element.dataset.workId);
  const linkFor = (id) => qa('[data-open-work]').find((element) => element.dataset.openWork === id);
  const setCategory = (category) => click(qa('[data-category]').find((element) => element.dataset.category === category));
  const search = q('[data-search]');
  const setQuery = async (value) => {
    search.value = value;
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 160));
  };
  const title = () => q('[data-viewer-title]').textContent;

  await check('Actual data has exactly 50 unique fixed source IDs and null job URLs', () => {
    assert.equal(manifest.works.length, 50);
    assert.equal(new Set(manifest.works.map((work) => work.id)).size, 50);
    assert.deepEqual(manifest.works.map((work) => work.id), Array.from({ length: 50 }, (_, i) => `MJ-JUL18-${String(i + 1).padStart(2, '0')}`));
    assert.ok(manifest.works.every((work) => work.source.jobUrl === null && work.source.promptKind === 'fragment'));
  });
  await check('Real template renders 50 cards, actual 900w/480w descriptors, and one main landmark', () => {
    assert.equal(visible().length, 50);
    assert.equal(document.querySelectorAll('main').length, 1);
    assert.ok(qa('.art-image-source img').every((image) => /480w, .*900w$/.test(image.srcset)));
    assert.equal(qa('.art-image-v2 img').length, 50);
    assert.ok(qa('.art-image-v2 img').every((image) => /420w, .*1024w$/.test(image.srcset)));
    assert.equal(q('[data-gallery-controls]').hidden, false);
    assert.match(q('[data-result-count]').textContent, /^50 works \/ paired view$/);
  });
  await check('Every card prefers its V2 title while preserving the original figure title and alt text', () => {
    manifest.works.forEach((work) => {
      const card = qa('[data-work-id]').find((element) => element.dataset.workId === work.id);
      assert.equal(card.querySelector('h3').textContent, displayTitle(work));
      assert.equal(card.querySelector('.art-image-source .art-image-title').textContent, work.title);
      assert.equal(card.querySelector('.art-image-v2 .art-image-title').textContent, displayTitle(work));
      assert.equal(card.querySelector('.art-image-source img').alt, `${work.title} — Midjourney source reference`);
      assert.equal(card.querySelector('.art-image-v2 img').alt, `${displayTitle(work)} — V2 interpretation`);
      assert.ok(card.querySelector('[data-open-work]').getAttribute('aria-label').includes(displayTitle(work)));
    });
  });
  for (const button of qa('.art-controls [data-view-control]')) {
    const view = button.dataset.viewControl;
    click(button);
    await check(`Grid ${view} control synchronizes view and both control sets`, () => {
      assert.equal(gallery.dataset.view, view);
      assert.equal(dialog.dataset.view, view);
      qa('[data-view-control]').forEach((control) => assert.equal(control.getAttribute('aria-pressed'), String(control.dataset.viewControl === view)));
    });
  }
  for (const category of [...new Set(manifest.works.map((work) => work.category))]) {
    setCategory(category);
    await check(`Category ${category} selects exactly its source IDs`, () => {
      assert.deepEqual(visible(), manifest.works.filter((work) => work.category === category).map((work) => work.id));
      assert.equal(qa('[data-work-id][data-featured="true"]').length, 1);
      assert.equal(qa('[data-category]').find((button) => button.dataset.category === category).getAttribute('aria-pressed'), 'true');
    });
  }
  setCategory('all');
  await setQuery(manifest.works[0].v2.title);
  await check('Search finds the V2 title across the combined searchable fields', () => assert.ok(visible().includes(manifest.works[0].id)));
  await setQuery(manifest.works[0].title);
  await check('Search also finds the original source title', () => assert.deepEqual(visible(), [manifest.works[0].id]));
  await setQuery(manifest.works[0].v2.caption);
  await check('Search includes the exact producer caption', () => assert.deepEqual(visible(), [manifest.works[0].id]));
  await setQuery('mJ-jUl18-07');
  await check('Search is case-insensitive and selects the actual source ID', () => assert.deepEqual(visible(), ['MJ-JUL18-07']));
  click(linkFor('MJ-JUL18-07'));
  await check('Viewer opens, focuses Close, and disables navigation for one filtered work', () => {
    assert.equal(dialog.open, true);
    assert.equal(document.activeElement, q('[data-close]'));
    assert.equal(q('[data-previous]').disabled, true);
    assert.equal(q('[data-next]').disabled, true);
    assert.equal(title(), displayTitle(manifest.works[6]));
    assert.match(q('[data-viewer-counter]').textContent, /01 \/ 01/);
  });
  key(dialog, 'ArrowRight');
  await check('Keyboard navigation cannot escape single-result filter', () => assert.equal(title(), displayTitle(manifest.works[6])));
  await check('Null-job provenance uses the pinned catalog, fragment label, reference role, and digest', () => {
    const source = q('[data-viewer-source]');
    assert.equal(source.querySelector('a').href, manifest.works[6].source.catalogUrl);
    assert.match(source.textContent, /Source prompt fragment/);
    assert.match(source.textContent, /original complete Midjourney prompt is unavailable/);
    assert.ok(source.textContent.includes(manifest.works[6].source.referenceRole));
    assert.ok(source.textContent.includes(manifest.works[6].source.sha256));
    assert.equal(source.querySelector('a').rel, 'noopener noreferrer');
    assert.equal(source.querySelector('a').target, '_blank');
  });
  await check('Viewer preserves the original source title and exact V2 caption, prompt, title, and image metadata', () => {
    const work = manifest.works[6];
    assert.equal(q('[data-viewer-source-title]').textContent, `Source: ${work.title}`);
    assert.equal(q('[data-viewer-v2] .art-v2-title').textContent, work.v2.title);
    assert.equal(q('[data-viewer-v2] .art-v2-caption').textContent, work.v2.caption);
    assert.ok(q('[data-viewer-v2]').textContent.includes(work.v2.prompt));
    assert.equal(q('[data-viewer-images] .art-image-source img').width, 900);
    assert.equal(q('[data-viewer-images] .art-image-v2 img').width, 1024);
    assert.equal(q('[data-viewer-images] .art-image-v2 .art-image-title').textContent, displayTitle(work));
  });
  await check('Profile link is present in real staged markup', () => assert.ok(qa('a').some((link) => link.href === 'https://www.midjourney.com/@mhoydich?tab=spotlight')));
  click(q('[data-close]'));
  await check('Closing restores the exact opening card and releases body state', () => {
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, linkFor('MJ-JUL18-07'));
    assert.equal(document.body.classList.contains('art-dialog-open'), false);
  });
  await setQuery(manifest.works[0].source.prompt.split(',')[0]);
  await check('Search includes prompt fragments and respects category intersection', () => {
    const expected = manifest.works.filter((work) => `${work.id} ${work.number} ${work.title} ${work.category} ${work.source.prompt} ${work.v2.title} ${work.v2.caption} ${work.v2.prompt}`.toLowerCase().includes(manifest.works[0].source.prompt.split(',')[0].toLowerCase())).map((work) => work.id);
    assert.deepEqual(visible(), expected);
    setCategory(manifest.works[0].category);
    assert.deepEqual(visible(), expected.filter((id) => manifest.works.find((work) => work.id === id).category === manifest.works[0].category));
  });
  await setQuery('no-such-work-zzzz-999999');
  await check('Empty search announces zero and reset restores 50 with search focus', () => {
    assert.equal(visible().length, 0);
    assert.equal(q('[data-empty]').hidden, false);
    assert.match(q('[data-filter-status]').textContent, /^0 of 50 works shown/);
    click(q('[data-reset]'));
    assert.equal(visible().length, 50);
    assert.equal(search.value, '');
    assert.equal(document.activeElement, search);
  });
  setCategory(manifest.works[0].category);
  const filteredWorks = manifest.works.filter((work) => work.category === manifest.works[0].category);
  click(linkFor(filteredWorks[0].id));
  key(dialog, 'ArrowRight');
  await check('ArrowRight advances within category scope', () => assert.equal(title(), displayTitle(filteredWorks[1])));
  key(dialog, 'ArrowLeft');
  await check('ArrowLeft returns within category scope', () => assert.equal(title(), displayTitle(filteredWorks[0])));
  key(dialog, 'ArrowLeft');
  await check('Previous wraps only to final filtered work', () => assert.equal(title(), displayTitle(filteredWorks.at(-1))));
  click(q('[data-next]'));
  await check('Next button wraps to first filtered work', () => assert.equal(title(), displayTitle(filteredWorks[0])));
  const sourceSummary = q('[data-viewer-source] summary');
  sourceSummary.focus();
  key(sourceSummary, 'ArrowRight');
  await check('Arrow shortcut preserves native summary interaction', () => assert.equal(title(), displayTitle(filteredWorks[0])));
  const sourceLink = q('[data-viewer-source] a');
  sourceLink.focus();
  key(sourceLink, 'ArrowRight');
  await check('Navigation restores focus to newly rendered source link', () => {
    assert.equal(title(), displayTitle(filteredWorks[1]));
    assert.equal(document.activeElement, q('[data-viewer-source] a'));
  });
  for (const button of qa('[data-viewer] [data-view-control]')) {
    const view = button.dataset.viewControl;
    click(button);
    await check(`Viewer ${view} control synchronizes both views`, () => {
      assert.equal(gallery.dataset.view, view);
      assert.equal(dialog.dataset.view, view);
    });
  }
  const focusables = [...dialog.querySelectorAll('a[href], button:not([disabled]), summary')];
  focusables.at(-1).focus();
  key(focusables.at(-1), 'Tab');
  await check('Tab handler wraps from last to first focus target', () => assert.equal(document.activeElement, focusables[0]));
  key(focusables[0], 'Tab', { shiftKey: true });
  await check('Shift+Tab handler wraps from first to last focus target', () => assert.equal(document.activeElement, focusables.at(-1)));
  // Native Escape is a browser behavior, so emulate only its cancel/close default.
  const escape = key(dialog, 'Escape');
  if (!escape.defaultPrevented) dialog.close();
  await check('Emulated native Escape restores opener focus', () => {
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, linkFor(filteredWorks[0].id));
  });
  click(linkFor(filteredWorks[0].id));
  await setQuery('MJ-JUL18-50');
  await check('Filtering away an open work closes viewer and focuses a visible result or search', () => {
    assert.equal(dialog.open, false);
    assert.ok(document.activeElement === search || visible().includes(document.activeElement.dataset.openWork));
  });
  await check('Every published commerce entry and purchase control remains unavailable', () => {
    assert.ok(manifest.works.every((work) => work.commerce.status === 'unavailable' && work.commerce.priceMutez === 1000000 && ['network', 'tokenId', 'contract', 'listingUrl'].every((field) => work.commerce[field] === null)));
    assert.equal(q('.art-edition button').disabled, true);
    assert.equal(qa('a').some((link) => /objkt|wallet|mint|checkout/.test(link.href)), false);
  });
  click(q('[data-reset]'));
  click(linkFor(manifest.works[0].id));
  assert.equal(dialog.open, true);
  cleanup();
  await check('Cleanup closes viewer and detaches client handlers', () => {
    assert.equal(dialog.open, false);
    // Prevent jsdom's unimplemented anchor navigation after the gallery listener
    // has had its chance to run; this listener is outside the gallery root.
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    click(linkFor(manifest.works[0].id));
    assert.equal(dialog.open, false);
    assert.equal(document.body.classList.contains('art-dialog-open'), false);
  });

  const unsafe = structuredClone(input);
  const attack = '</script><img src=x onerror="window.__injected=1"><script>window.__injected=2</script>';
  unsafe.title = attack;
  unsafe.description = attack;
  unsafe.works[0].title = attack;
  unsafe.works[0].source.prompt = attack;
  unsafe.works[0].v2.title = attack;
  unsafe.works[0].v2.caption = attack;
  unsafe.works[0].v2.prompt = attack;
  unsafe.works[0].commerce = { status: 'available', network: 'mainnet', tokenId: '1', contract: 'fake', listingUrl: 'https://example.com/mint' };
  unsafe.works[0].source.jobUrl = 'javascript:alert(1)';
  const unsafeHtml = await render(unsafe);
  const unsafeDom = new JSDOM(unsafeHtml, { url: 'https://pointcast.xyz/art/v2/' });
  t.after(() => unsafeDom.window.close());
  await check('SSR treats hostile titles as text and both embedded JSON documents round-trip safely', () => {
    assert.equal(unsafeDom.window.document.querySelectorAll('img[onerror]').length, 0);
    assert.equal(unsafeDom.window.document.querySelector('[data-gallery-data]').textContent.includes('</script>'), false);
    assert.equal(JSON.parse(unsafeDom.window.document.querySelector('[data-gallery-data]').textContent).works[0].title, attack);
    const jsonLd = JSON.parse(unsafeDom.window.document.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(jsonLd.name, attack);
    assert.equal(jsonLd.associatedMedia[0].name, attack);
    assert.equal(jsonLd.associatedMedia[1].name, attack);
  });
  await check('Projection rejects unsafe URLs and ignores supplied live commerce config', () => {
    const projected = toPublicManifest(unsafe).works[0];
    assert.equal(projected.source.jobUrl, null);
    assert.equal(projected.commerce.status, 'unavailable');
    assert.equal(projected.commerce.listingUrl, null);
    const privateInput = structuredClone(input);
    privateInput.works[0].source.prompt = '/private/gallery-owner-proof.txt';
    assert.throws(() => toPublicManifest(privateInput), /privacy validation/);
  });
  const unsafeWindow = unsafeDom.window;
  for (const name of ['document', 'Element', 'HTMLElement', 'AbortController']) globalThis[name] = unsafeWindow[name];
  const unsafeRoot = unsafeWindow.document.querySelector('[data-art-gallery]');
  const unsafeDialog = unsafeRoot.querySelector('[data-viewer]');
  unsafeDialog.showModal = function () { this.open = true; };
  unsafeDialog.close = function () { this.open = false; this.dispatchEvent(new unsafeWindow.Event('close')); };
  const unsafeCleanup = initArtGallery(unsafeRoot);
  unsafeRoot.querySelector('[data-open-work]').dispatchEvent(new unsafeWindow.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  await check('Client renders hostile prompt/title through textContent without executable nodes', () => {
    assert.equal(unsafeRoot.querySelector('[data-viewer-title]').textContent, attack);
    assert.ok(unsafeRoot.querySelector('[data-viewer-source]').textContent.includes(attack));
    assert.equal(unsafeRoot.querySelector('[data-viewer-source] img'), null);
    assert.equal(unsafeRoot.querySelector('[data-viewer-source] script'), null);
    assert.equal(unsafeRoot.querySelector('[data-viewer-v2] script'), null);
    assert.equal(unsafeRoot.querySelector('[data-viewer-v2] .art-v2-caption').textContent, attack);
    assert.equal(unsafeRoot.querySelector('.art-edition button').disabled, true);
  });
  unsafeCleanup();
  const result = {
    checks: checks.length,
    names: checks,
    data: { sourceCount: manifest.works.length, v2Count: manifest.works.filter((work) => work.v2?.asset).length, nullJobUrlCount: manifest.works.filter((work) => work.source.jobUrl === null).length },
    limits: ['jsdom modal showModal/close and native Escape are emulated; real top-layer/inert behavior is unverified', 'getClientRects is shimmed; visual layout, contrast, image decoding, and actual browser rendering are unverified', 'The shared layout is replaced by its single main wrapper; isolation props were checked by earlier read-only code review'],
  };
  await writeFile(join(temporary, 'interaction-results.json'), JSON.stringify(result, null, 2));
  t.diagnostic(`${checks.length} gallery checks; ${result.data.sourceCount} sources and ${result.data.v2Count} V2 assets; native modal/layout behavior emulated.`);
  dom.window.close();
  unsafeDom.window.close();

});
