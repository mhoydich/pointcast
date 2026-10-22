import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('search preserves query/filter URLs, safely renders text, and opens additional results', async () => {
  const rows = Array.from({ length:65 }, (_, i) => ({kind:'PROJECT',id:`/room-${i}`,url:`/room-${i}`,label:'PROJECT',labelBg:'#fff',labelFg:'#000',type:'EXPLORE',title:`Room ${i}`,dek:'A local tool',timestamp:'2026-10-19',haystack:'local tool'}));
  rows.push({ ...rows[0],kind:'BLOCK',id:'0719',url:'/b/0719',title:'<img src=x onerror=alert(1)>',haystack:'safety' });
  const dom = new JSDOM(`<form id="search-form"><input id="q"/><button type="button" data-kind="ALL">All</button><button type="button" data-kind="PROJECT">Projects</button><button type="button" data-kind="BLOCK">Blocks</button><span id="count"></span></form><section id="results"></section><button id="search-more" hidden>More</button><script id="pointcast-search-index" type="application/json"></script>`, {url:'https://pointcast.xyz/search?q=local&kind=PROJECT'});
  const globals = { window:globalThis.window, document:globalThis.document, history:globalThis.history, AbortController:globalThis.AbortController };
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,history:dom.window.history,AbortController:dom.window.AbortController});
  try {
    document.getElementById('pointcast-search-index').textContent=JSON.stringify(rows);
    await import('../src/scripts/pointcast-search.mjs');
    assert.equal(document.querySelectorAll('.hit').length,60);
    assert.equal(document.querySelector('[data-kind="PROJECT"]').getAttribute('aria-pressed'),'true');
    document.getElementById('search-more').click();
    assert.equal(document.querySelectorAll('.hit').length,65);
    assert.equal(document.getElementById('search-more').hidden,true);
    const input=document.getElementById('q');
    input.value='safety';
    input.dispatchEvent(new dom.window.Event('input'));
    assert.equal(document.querySelectorAll('.hit').length,0);
    document.querySelector('[data-kind="ALL"]').click();
    assert.equal(document.querySelector('.hit__title').textContent,'<img src=x onerror=alert(1)>');
    assert.equal(document.querySelectorAll('#results img').length,0);
    assert.equal(window.location.search,'?q=safety');
    history.pushState(null,'','/search?q=local&kind=PROJECT');
    window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
    assert.equal(input.value,'local');
    assert.equal(document.querySelectorAll('.hit').length,60);
  } finally {
    dom.window.close();
    Object.assign(globalThis,globals);
  }
});
