import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderPointCastPickleballHome } from '../src/lib/pickleball-v2/render.js';
import { articles, buildArticleJsonLd, publicArticle } from '../src/lib/pickleball-v2/articles.js';

test('PointCast extension preserves legacy anchors and readable lessons, courts and practices without JS', () => {
  const dom = new JSDOM(renderPointCastPickleballHome());
  const doc = dom.window.document;
  const ids = [...doc.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, 'all shared and v2 anchors remain unique');
  assert.equal(doc.querySelectorAll('.pb-lesson').length, 12);
  assert.equal(doc.querySelectorAll('.pb-drill').length, 8);
  assert.equal(doc.querySelectorAll('[data-court-card]').length, 11);
  assert.equal(doc.querySelectorAll('[data-learning-panel][hidden]').length, 0);
  assert.equal(doc.querySelectorAll('[data-practice-panel][hidden]').length, 0);
  for (const anchor of ['learn','gear','pb-v2-planner','pb-v2-scorecard','pb-v2-articles']) assert.ok(doc.getElementById(anchor));
  assert.equal(doc.querySelectorAll('[data-v2-enhanced-only]:not([hidden])').length, 0);
  assert.equal(doc.querySelectorAll('.v2-static-grid>div').length, 2);
  assert.ok(doc.querySelector('[data-v2-plan] .v2-plan-blocks li'));
  assert.equal(doc.querySelector('textarea').textContent, '');
  assert.ok(doc.querySelector('[data-v2-scorecard] button[type="submit"]'));
  for (const link of ['/pickleball','/paddles','/paddles/compare','/games/noun-pickleball/','https://tez-rally.pages.dev/']) assert.ok(doc.querySelector(`a[href="${link}"]`), link);
  for (const article of articles) assert.ok(doc.querySelector(`a[href="${article.url}"] img[alt]`));
  dom.window.close();
});

test('article machine editions and metadata retain editorial attribution and primary source receipts', () => {
  assert.equal(articles.length, 2);
  for (const article of articles) {
    const data = publicArticle(article);
    assert.equal(data.slug, article.slug);
    assert.equal(data.checkedAt, '2026-10-03');
    assert.ok(Array.isArray(data.sources) && data.sources.length >= 4);
    for (const source of data.sources) assert.match(source.url, /^https:\/\//);
    const schema = buildArticleJsonLd(article);
    assert.equal(schema['@type'], 'Article');
    assert.equal(schema.author.name, 'PointCast Editorial');
    assert.equal(schema.publisher.name, 'PointCast');
    assert.equal(schema.datePublished.slice(0, 10), '2026-10-03');
    assert.ok(!JSON.stringify(data).includes('Morgan'), 'private partner details are not public content');
  }
});
