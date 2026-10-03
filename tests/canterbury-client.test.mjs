import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { initCanterbury } from '../src/scripts/canterbury.mjs';

const data = {
  tales: [
    { id: 'knight', title: 'The Knight’s Tale', pilgrim: 'The Knight', portrait: '/art/portrait-knight.webp', voice: 'A voice of rank and ceremony.', premise: 'Two rivals look toward the same future.', note: 'Captivity and violence.', question: 'Who gets to choose?', themes: ['power'] },
    { id: 'wife', title: 'The Wife of Bath’s Tale', pilgrim: 'The Wife of Bath', portrait: '/art/portrait-wife.webp', voice: 'An experienced, argumentative voice.', premise: 'An answer changes a knight’s fate.', note: 'Sexual violence.', question: 'Who holds authority?', themes: ['power'] },
    { id: 'nun', title: 'The Nun’s Priest’s Tale', pilgrim: 'The Nun’s Priest', portrait: '/art/portrait-nun.webp', voice: 'A grand voice for small creatures.', premise: 'A rooster meets a flattering fox.', note: '', question: 'When does pride become a trap?', themes: ['animal'] },
  ],
  routes: [
    { id: 'play', label: 'A little mischief', description: 'Begin with the barnyard.', tales: ['nun'] },
    { id: 'power', label: 'Who holds the reins?', description: 'Follow questions of authority.', tales: ['wife', 'knight'] },
  ],
  connections: [
    { id: 'authority', title: 'Who gets the last word?', body: 'Different voices compete for authority.', tales: ['wife', 'knight'] },
    { id: 'animal', title: 'Animals with human troubles', body: 'The barnyard becomes a stage.', tales: ['nun'] },
  ],
  journey: [
    { id: 'tabard', title: 'The Tabard', body: 'The company gathers in Southwark.' },
    { id: 'road', title: 'An imagined road', body: 'This diagram is a reading map, not a claim about tale locations.' },
  ],
};

function withPage(run, options = {}) {
  const dom = new JSDOM(`<!doctype html><main data-canterbury>
    <a data-pilgrim="knight" href="#tale-knight">Meet the Knight</a>
    <a data-pilgrim="wife" href="#tale-wife">Meet the Wife of Bath</a>
    <form data-routes><label><input type="radio" name="reading-route" value="play" checked>A little mischief</label><label><input type="radio" name="reading-route" value="power">Who holds the reins?</label></form>
    <h3 data-route-title>A little mischief</h3><p data-route-description>Begin with the barnyard.</p><ol data-route-list><li><a href="#tale-nun">The Nun’s Priest’s Tale</a></li></ol>
    <button data-connection="authority" aria-pressed="true">Authority</button><button data-connection="animal" aria-pressed="false">Animals</button>
    <h3 data-connection-title></h3><p data-connection-body></p><ul data-connection-list></ul>
    <button data-journey="tabard" aria-pressed="true">The Tabard</button><button data-journey="road" aria-pressed="false">The road</button><h3 data-journey-title></h3><p data-journey-body></p>
    <button data-language="middle" aria-pressed="false">Middle English</button><button data-language="gloss" aria-pressed="false">Accessible gloss</button><button data-language="both" aria-pressed="true">Both</button>
    <article id="tale-knight" data-tale="knight" tabindex="-1">Knight</article><article id="tale-wife" data-tale="wife" tabindex="-1">Wife</article><article id="tale-nun" data-tale="nun" tabindex="-1">Nun’s Priest</article>
    <p data-status aria-live="polite"></p>
    <dialog data-pilgrim-dialog aria-labelledby="pilgrim-title"><button data-dialog-close>Close portrait</button><div data-dialog-body></div></dialog>
  </main>`, { url: 'https://pointcast.xyz/books/canterbury-tales/' });
  const { document, MouseEvent, Event } = dom.window;
  const root = document.querySelector('main');
  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];
  const dialog = $('[data-pilgrim-dialog]');
  let opens = 0;
  const scrolls = [];
  dialog.showModal = function () { opens += 1; this.open = true; };
  dialog.close = function () {
    this.open = false;
    if (!options.delayedClose) this.dispatchEvent(new Event('close'));
  };
  dialog.getBoundingClientRect = () => ({ left: 20, right: 320, top: 20, bottom: 420 });
  dom.window.matchMedia = () => ({ matches: Boolean(options.reducedMotion) });
  for (const article of $$('[data-tale]')) article.scrollIntoView = (settings) => scrolls.push({ id: article.id, ...settings });
  const click = (element, settings = {}) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...settings });
    element.dispatchEvent(event);
    return event;
  };
  const choose = (value) => {
    const input = $(`input[value="${value}"]`);
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const cleanup = initCanterbury(root, options.data ?? data);
  try { run({ root, dom, document, dialog, $, $$, click, choose, cleanup, scrolls, opens: () => opens }); }
  finally { cleanup(); dom.window.close(); }
}

test('a reader-selected route replaces the reading order with working tale anchors', () => {
  withPage(({ $, choose }) => {
    choose('power');
    assert.equal($('[data-route-title]').textContent, 'Who holds the reins?');
    assert.equal($('[data-route-description]').textContent, 'Follow questions of authority.');
    assert.deepEqual([...$('[data-route-list]').querySelectorAll('a')].map((link) => link.getAttribute('href')), ['#tale-wife', '#tale-knight']);
    assert.equal($('[data-status]').textContent, 'Reading route: Who holds the reins?');
  });
});

test('an unknown route leaves a usable reading order and restores its valid selection', () => {
  withPage(({ $, choose, root, dom }) => {
    choose('power');
    const invalid = dom.window.document.createElement('input');
    invalid.type = 'radio'; invalid.name = 'reading-route'; invalid.value = 'missing';
    $('form').append(invalid);
    invalid.checked = true;
    invalid.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal($('[data-route-title]').textContent, 'Who holds the reins?');
    assert.equal($('input[value="power"]').checked, true);
    assert.equal(root.querySelectorAll('[data-route-list] a').length, 2);
  });
});

test('story connections highlight only participating tales and announce the selected idea', () => {
  withPage(({ $, $$, click }) => {
    click($('[data-connection="animal"]'));
    assert.deepEqual($$('[data-connection]').map((button) => button.getAttribute('aria-pressed')), ['false', 'true']);
    assert.deepEqual($$('[data-tale]').map((article) => article.dataset.connected), ['false', 'false', 'true']);
    assert.equal($('[data-connection-title]').textContent, 'Animals with human troubles');
    assert.equal($('[data-connection-list] a').getAttribute('href'), '#tale-nun');
    assert.equal($('[data-status]').textContent, 'Story connection: Animals with human troubles.');
  });
});

test('the journey control carries its historical qualification into the displayed stop', () => {
  withPage(({ $, click }) => {
    click($('[data-journey="road"]'));
    assert.equal($('[data-journey="road"]').getAttribute('aria-pressed'), 'true');
    assert.equal($('[data-journey="tabard"]').getAttribute('aria-pressed'), 'false');
    assert.match($('[data-journey-body]').textContent, /reading map/);
    assert.equal($('[data-status]').textContent, 'Journey: An imagined road.');
  });
});

test('language selection is exclusive and cleanup restores the readable both-text fallback', () => {
  withPage(({ root, $, $$, click, cleanup }) => {
    assert.equal(root.dataset.language, 'both');
    assert.equal(root.classList.contains('is-enhanced'), true);
    click($('[data-language="gloss"]'));
    assert.equal(root.dataset.language, 'gloss');
    assert.deepEqual($$('button[data-language]').map((button) => button.getAttribute('aria-pressed')), ['false', 'true', 'false']);
    cleanup();
    assert.equal(root.hasAttribute('data-language'), false);
    assert.equal(root.hasAttribute('data-enhanced'), false);
    assert.equal(root.classList.contains('is-enhanced'), false);
  });
});

test('portrait dialogue opens with a labelled title, focuses Close, and Escape restores its invoker', () => {
  withPage(({ $, document, dialog, dom, click }) => {
    const invoker = $('a[data-pilgrim="wife"]');
    invoker.focus();
    const open = click(invoker);
    assert.equal(open.defaultPrevented, true);
    assert.equal(dialog.open, true);
    assert.equal(dialog.getAttribute('aria-labelledby'), 'pilgrim-title');
    assert.equal($('#pilgrim-title').textContent, 'The Wife of Bath');
    const body = $('[data-dialog-body]');
    assert.equal(body.children.length, 2);
    assert.equal(body.children[0].tagName, 'IMG');
    assert.equal(body.children[1].className, 'pilgrim-dialog-copy');
    assert.equal(body.children[1].querySelector('h2'), $('#pilgrim-title'));
    assert.equal(body.children[1].querySelector('a'), $('[data-dialog-read]'));
    assert.equal(body.children[0].width, 640);
    assert.equal(body.children[0].height, 640);
    assert.equal(body.children[0].srcset, '/art/portrait-wife-160.webp 160w, /art/portrait-wife-320.webp 320w, /art/portrait-wife.webp 640w');
    assert.equal(body.children[0].sizes, '(max-width: 760px) 160px, 300px');
    assert.equal(body.querySelector('.ct-content-note')?.textContent, 'Content note: Sexual violence.');
    assert.equal(document.activeElement, $('[data-dialog-close]'));
    assert.match($('[data-dialog-body] img').alt, /interpretive portrait/);
    assert.match($('[data-dialog-body]').textContent, /Content note: Sexual violence\./);
    const escape = new dom.window.Event('cancel', { cancelable: true });
    dialog.dispatchEvent(escape);
    assert.equal(escape.defaultPrevented, true);
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, invoker);
  });
});

test('Read the tale transfers focus and reduced-motion scrolling to its article even with a late close event', () => {
  withPage(({ $, document, dialog, dom, click, scrolls }) => {
    click($('a[data-pilgrim="wife"]'));
    click($('[data-dialog-read]'));
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, $('#tale-wife'));
    assert.deepEqual(scrolls, [{ id: 'tale-wife', behavior: 'auto', block: 'start' }]);
    dialog.dispatchEvent(new dom.window.Event('close'));
    assert.equal(document.activeElement, $('#tale-wife'));
  }, { reducedMotion: true, delayedClose: true });
});

test('keyboard tabbing wraps at both dialog edges, ignores unavailable controls, and Escape returns to the portrait', () => {
  withPage(({ $, document, dialog, dom, click }) => {
    const invoker = $('a[data-pilgrim="wife"]');
    click(invoker);
    const close = $('[data-dialog-close]');
    const read = $('[data-dialog-read]');
    const hidden = document.createElement('button');
    hidden.hidden = true;
    hidden.textContent = 'Unavailable';
    const disabled = document.createElement('button');
    disabled.disabled = true;
    disabled.textContent = 'Disabled';
    $('[data-dialog-body]').append(hidden, disabled);
    const reverse = new dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    close.dispatchEvent(reverse);
    assert.equal(reverse.defaultPrevented, true);
    assert.equal(document.activeElement, read);
    const forward = new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    read.dispatchEvent(forward);
    assert.equal(forward.defaultPrevented, true);
    assert.equal(document.activeElement, close);
    dialog.dispatchEvent(new dom.window.Event('cancel', { cancelable: true }));
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, invoker);
  });
});

test('interrupted portrait selection ignores an earlier close event and returns to the latest invoker', () => {
  withPage(({ $, document, dialog, dom, click }) => {
    click($('a[data-pilgrim="knight"]'));
    click($('a[data-pilgrim="wife"]'));
    dialog.dispatchEvent(new dom.window.Event('close'));
    assert.equal(dialog.open, true);
    assert.equal($('#pilgrim-title').textContent, 'The Wife of Bath');
    assert.equal(document.activeElement, $('[data-dialog-close]'));
    click($('[data-dialog-close]'));
    assert.equal(document.activeElement, $('a[data-pilgrim="wife"]'));
  }, { delayedClose: true });
});

test('only backdrop clicks dismiss a portrait; modified portrait links retain their native behavior', () => {
  withPage(({ $, dialog, click, opens }) => {
    const modified = click($('a[data-pilgrim="knight"]'), { ctrlKey: true });
    assert.equal(modified.defaultPrevented, false);
    assert.equal(opens(), 0);
    click($('a[data-pilgrim="knight"]'));
    click(dialog, { clientX: 100, clientY: 100 });
    assert.equal(dialog.open, true);
    click(dialog, { clientX: 10, clientY: 10 });
    assert.equal(dialog.open, false);
  });
});

test('browsers without a working showModal retain the original anchor reading path', () => {
  withPage(({ $, dialog, click }) => {
    dialog.showModal = undefined;
    const unavailable = click($('a[data-pilgrim="knight"]'));
    assert.equal(unavailable.defaultPrevented, false);
    assert.equal($('a[data-pilgrim="knight"]').getAttribute('href'), '#tale-knight');
    dialog.showModal = () => { throw new Error('Dialog unavailable'); };
    const failed = click($('a[data-pilgrim="wife"]'));
    assert.equal(failed.defaultPrevented, false);
    assert.equal(dialog.open, false);
  });
});

test('repeated mounting does not double-open and cleanup supports a fresh mounting', () => {
  withPage(({ root, $, click, cleanup, opens }) => {
    assert.equal(initCanterbury(root, data), cleanup);
    click($('a[data-pilgrim="knight"]'));
    assert.equal(opens(), 1);
    cleanup();
    click($('a[data-pilgrim="knight"]'));
    assert.equal(opens(), 1);
    const freshCleanup = initCanterbury(root, data);
    cleanup(); // A stale cleanup must not tear down the fresh mounting.
    click($('a[data-pilgrim="knight"]'));
    assert.equal(opens(), 2);
    freshCleanup();
  });
});

test('curated source strings render as text rather than injected markup', () => {
  const content = structuredClone(data);
  content.tales[0].pilgrim = '<img src=x onerror=alert(1)>';
  content.tales[0].premise = '<script>not executable</script>';
  withPage(({ $, click }) => {
    click($('a[data-pilgrim="knight"]'));
    assert.equal($('#pilgrim-title').textContent, '<img src=x onerror=alert(1)>');
    assert.equal($('[data-dialog-body] script'), null);
    assert.equal($('[data-dialog-body]').querySelectorAll('img').length, 1);
  }, { data: content });
});
