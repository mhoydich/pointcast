import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { assessDoor } from './door-assessment.mjs';
const base = 'https://pointcast.xyz';
const cap = { id: 'paid.bench', path: '/api/agent/bench', method: 'POST', probe: { method: 'POST', path: '/api/agent/bench', expected: [402] }, readiness: { state: 'degraded', status: 402, observedAt: 'now' } };
const run = (path, status, capabilities = []) => assessDoor({ url: base + path, status }, base, capabilities);
test('recognizes only evidenced POST capability responses', () => {
 assert.equal(run(cap.path, 404, [cap]).kind, 'expected');
 assert.equal(run(cap.path, 404, []).kind, 'broken');
 assert.equal(run(cap.path, 404, [{ ...cap, probe: { ...cap.probe, path: '/api/agents/challenge' } }]).kind, 'broken');
 assert.equal(run(cap.path, 404, [{ ...cap, readiness: { state: 'unknown', status: 402 } }]).kind, 'broken');
 assert.equal(run(cap.path, 404, [{ ...cap, readiness: { state: 'degraded', status: 503 } }]).kind, 'broken');
});
test('keeps preparation, private access and failure distinct', () => {
 assert.equal(run(cap.path, 404, [{...cap, publicationAvailability: 'prepared-only'}]).kind, 'unavailable');
 assert.equal(run(cap.path, 200, [{...cap, publicationAvailability: 'prepared-only'}]).kind, 'unavailable');
 assert.equal(run(cap.path, 0, [{...cap, publicationAvailability: 'prepared-only'}]).kind, 'broken');
 assert.equal(run('/me.json', 401).kind, 'expected');
 assert.equal(run('/unrelated', 401).kind, 'broken');
 assert.equal(run('/unrelated', 200).kind, 'open');
});
test('recognizes documented GET quote responses only', () => {
 const quote = {...cap, method:'GET', probe: {method:'GET',path:cap.path, expected:[402]}};
 assert.equal(run(cap.path, 402, [quote]).kind, 'expected');
 assert.equal(run(cap.path, 503, [quote]).kind, 'broken');
});
