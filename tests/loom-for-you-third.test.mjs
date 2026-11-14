import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { buildPiles } from '../src/lib/loom/for-you.mjs';
import { serveFor } from '../src/lib/loom/for-route.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';
const now = new Date('2026-11-14T18:00:00Z');
const ago = h => new Date(+now - h * 3600000).toISOString();
const me = { name: 'Jason', kind: 'human', address: '@jason' };
const bot = { name: 'Desk', kind: 'agent', address: '@desk' };
const message = (id, hours, body, extra = {}) => ({ id, seq: 1, at: ago(hours), kind: 'note', from: me, body, ...extra });
const thread = messages => ({ address: '#work', key: 'abcdef0123456789abcdef01', messages });
test('24-hour boundary and older count are separate; replies by others still answer', () => {
  const recent = message('m_recent', 10, 'Please show the next draft.');
  const boundary = message('m_boundary', 24, 'Exactly at the boundary.');
  const old = message('m_old', 25, 'An older unanswered request.');
  const answered = message('m_answered', 3, 'This one already got an answer.');
  const reply = message('m_reply', 1, 'Here it is.', { from: bot, parent: answered.id });
  const r = buildPiles({ owner: 'jason', now, threads: [thread([recent, boundary, old, answered, reply])] });
  assert.deepEqual(r.activity.unanswered.map(x => x.id), ['m_recent', 'm_boundary']);
  assert.deepEqual(r.activity.olderUnanswered.map(x => x.id), ['m_old']);
  const nudge = message('m_nudge', 1, 'nudge', {parent:recent.id});
  const after = buildPiles({owner:'jason',now,threads:[thread([recent,nudge])]});
  assert.deepEqual(after.activity.unanswered.map(x=>x.id),[recent.id], 'a self-nudge neither answers the request nor creates another request');
});
test('later canonical links and clear whole-post quotations in another thread answer; echoes and earlier references do not', () => {
  const source = message('m_source', 10, 'Please show me the updated phone card.');
  const t = thread([source]);
  const link = `https://pointcast.xyz/loom?to=%23work#${source.id}`;
  const result = (body, extra = {}) => buildPiles({ owner:'jason', now, threads:[t, {address:'#reply', key:'other', messages:[message('m_reference', 2, body, {from:bot, ...extra})]}] }).activity.unanswered.map(x => x.id);
  for (const body of [link, link + '.', `loom:${t.key}#${source.id}`, `> ${source.body}`, `“${source.body}”`]) assert.deepEqual(result(body), [], body);
  assert.ok(!result(link, {from:me}).includes(source.id), 'any author, including the owner');
  assert.deepEqual(result(link, {from:{name:'Helper',kind:'robot',address:'@helper'}}), [], 'a non-house robot can reference an answer');
  for (const extra of [{at:ago(11)}, {hidden:true}, {withdrawn:true}, {via:{key:t.key,id:source.id}}, {from:{name:'Collator',kind:'robot'}}]) assert.deepEqual(result(link, extra), [source.id]);
  assert.deepEqual(result(link.replace('pointcast.xyz', 'example.com')), [source.id]);
  assert.deepEqual(result('“A different request entirely.”'), [source.id]);
});
test('HTML browser short link selects a public queue; explicit machine formats stay available and invalid handles never redirect', async () => {
  const down = {get:async () => { throw Error('no KV read needed for redirect'); }};
  const res = await serveFor(new Request('https://pointcast.xyz/loom/for/Jason', {headers:{Accept:'text/html,application/xhtml+xml'}}), down, 'Jason');
  assert.equal(res.status,302); assert.equal(res.headers.get('Location'), '/loom?for=jason#for-you');
  assert.equal(res.headers.get('Cache-Control'),'no-store');
  const bad = await serveFor(new Request('https://pointcast.xyz/loom/for/bad', {headers:{Accept:'text/html'}}), down, '../bad');
  assert.equal(bad.status,400); assert.equal(bad.headers.get('Location'),null);
  const explicit = await serveFor(new Request('https://pointcast.xyz/loom/for/jason?format=text', {headers:{Accept:'text/html'}}), down, 'jason');
  assert.equal(explicit.status,503, 'explicit text still reads the service, not the browser redirect');
});
test('public For You shows only nudge for own unanswered posts, folds older posts and keeps the stored posting identity', async () => {
  const map = new Map(); const kv = {get:async k => map.get(k) ?? null, put:async (k,v) => map.set(k,v)};
  for (const [hours, body] of [[10,'@chief Please show the latest phone card.'], [26,'@chief This older request is still waiting.']]) {
    const res = await handleLoom(new Request('https://pointcast.xyz/api/loom', {method:'POST',body:JSON.stringify({to:'@chief',from:me,body})}), {kv,firstHelloEnabled:false,clock:()=>new Date(Date.now()-hours*3600000)});
    assert.equal(res.status,201);
  }
  const source = readFileSync(new URL('../src/pages/loom/index.astro',import.meta.url),'utf8');
  const between = (a,b) => {const start=source.indexOf(a)+a.length;return source.slice(start,source.indexOf(b,start));};
  const dom = new JSDOM('<!doctype html><html><body>'+between('<body>','<script is:inline>')+'</body></html>', {url:'https://pointcast.xyz/loom?for=jason#for-you',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window; const writes=[];
  w.localStorage.setItem('loom.name','Mike'); w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.fetch=async (url,init={})=>{const {signal,cache,...options}=init;if(options.method==='POST') writes.push(JSON.parse(options.body));return handleLoom(new Request(new URL(url,'https://pointcast.xyz'),options),{kv,firstHelloEnabled:false});};
  try {
    w.eval(between('<script is:inline>','</script>')); await new Promise(r=>setTimeout(r,850));
    assert.match(w.document.querySelector('#fyDyn').textContent,/Public For You for @jason/);
    assert.equal(w.document.querySelector('#asBtn').textContent,'Mike');
    assert.equal(w.localStorage.getItem('loom.name'),'Mike'); assert.ok(w.document.querySelector('#fyDyn a[href=\"/loom/for/jason\"]')); assert.deepEqual(writes,[],'a public queue view never moves its seen mark');
    const old=w.document.querySelector('#fyOlder'); assert.ok(old); assert.equal(old.open,false); assert.match(old.querySelector('summary').textContent,/1 older/);
    for(const node of w.document.querySelectorAll('[data-activity="unanswered"]')) assert.deepEqual([...node.querySelectorAll('.fyacts button')].map(b=>b.textContent),['nudge']);
    assert.ok(!w.document.querySelector('#fyDyn').textContent.includes('Recent activity from up to'));
    const nudge=w.document.querySelector('[data-activity="unanswered"] .fyacts button');nudge.click();await new Promise(r=>setTimeout(r,80));
    assert.equal(writes.length,1);assert.equal(writes[0].body,'nudge');assert.equal(writes[0].kind,'note');assert.equal(writes[0].from.name,'Mike');
  } finally {w.close();}
});
