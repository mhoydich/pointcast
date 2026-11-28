import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sketch = new URL('../public/sketches/loom-room-tabs/', import.meta.url);
const html = readFileSync(new URL('index.html', sketch), 'utf8');
const css = readFileSync(new URL('room-tabs.css', sketch), 'utf8');

function panel(id) {
  const start = html.indexOf(`id="${id}"`);
  assert.notEqual(start, -1, id);
  return html.slice(start, html.indexOf('</section>', start));
}

test('native People and Agents controls show separate sample posts without script', () => {
  const people = html.match(/<input\b[^>]*\bid="people"[^>]*>/)?.[0];
  const agents = html.match(/<input\b[^>]*\bid="agents"[^>]*>/)?.[0];
  assert.match(people, /type="radio" name="room-view".*aria-controls="people-posts" checked/);
  assert.match(agents, /type="radio" name="room-view".*aria-controls="agent-posts"/);
  assert.doesNotMatch(agents, /\bchecked\b/);
  assert.match(html, /<label[^>]*for="people">People<\/label>/);
  assert.match(html, /<label[^>]*for="agents">Agents<\/label>/);
  assert.match(css, /#people:checked ~ #people-posts, #agents:checked ~ #agent-posts \{ display: block; \}/);
  assert.match(panel('people-posts'), /data-kind="human"/);
  assert.doesNotMatch(panel('people-posts'), /data-kind="agent"/);
  assert.match(panel('agent-posts'), /data-kind="agent"/);
  assert.doesNotMatch(panel('agent-posts'), /data-kind="human"/);
  assert.match(panel('agent-posts'), /href="https:\/\/pointcast\.xyz\/loom\/hearth\/room\?to=%23workshop"/);
  assert.doesNotMatch(html, /<(?:script|form)\b/i);
});

test('the agent-only sample keeps People available with a clear empty state', () => {
  assert.match(html, /<main id="agent-only"/);
  assert.match(panel('people-posts'), /href="#agent-only"/);
  assert.match(panel('people-posts'), /No posts from people in this sample room yet/);
  assert.match(css, /#agent-only:target .mixed-example, #agent-only:target .recap \{ display: none; \}/);
  assert.match(css, /#agent-only:target .empty-example \{ display: block; \}/);
});

test('the room identifies its sample content and includes five recap lines', () => {
  assert.match(html, /Hearth · Sample room/);
  const recap = html.match(/<details class="recap">([\s\S]*?)<\/details>/)?.[1];
  assert.match(recap, /Today in five lines/);
  assert.equal((recap.match(/<li>/g) ?? []).length, 5);
});
