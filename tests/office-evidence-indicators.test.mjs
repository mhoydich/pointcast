import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEvidence } from '../public/office/evidence-indicators.mjs';
const document = { createElementNS(ns, tag) { return this.createElement(tag); }, createElement(tag) { return { tag, children:[], dataset:{}, setAttribute(){}, append(...nodes){this.children.push(...nodes);} }; } };
const rows = props => renderEvidence(document, props).children[3].children;
const merged = { number:1, verified:true, url:'https://github.com/x/y/pull/1', mergedAt:'2026-11-17T12:00:00Z' };
const current = { asOf:'2026-11-17T13:00:00Z', stale:false };
test('only complete fresh provider evidence lights ember', () => {
 assert.equal(rows({...current, merges:[merged]})[0].dataset.state,'verified-merged');
 for (const change of [{verified:false},{url:'javascript:alert(1)'},{mergedAt:null}]) assert.equal(rows({...current, merges:[{...merged,...change}]})[0].dataset.state,'unknown');
 for (const change of [{stale:true},{asOf:null}, {stale:undefined}]) assert.equal(rows({...current,...change,merges:[merged]})[0].dataset.state,'unknown');
});
test('empty evidence conveys unknown, never success', () => {
 const root = renderEvidence(document);
 assert.equal(root.dataset.state,'stale');
 assert.match(root.children[3].children[0].textContent,/No verified/);
});
test('untrusted source is omitted and text remains literal', () => {
 const row = rows({...current,merges:[{...merged,url:'data:text/html,bad',number:'<script>'}]})[0];
 assert.equal(row.children.length,2);
 assert.match(row.children[1].textContent,/<script>/);
});

test('SVG flame exists only for verified fresh merge evidence', () => {
 const icon = props => rows({...current, merges:[merged], ...props})[0].children[0];
 assert.equal(icon({}).tag, 'svg');
 assert.equal(icon({}).dataset.state, 'lit');
 assert.equal(icon({}).children.length, 3);
 for (const props of [{stale:true}, {merges:[{...merged,verified:false}]}, {asOf:null}]) {
  assert.equal(icon(props).dataset.state, 'unlit');
  assert.equal(icon(props).children.length, 1);
 }
});
