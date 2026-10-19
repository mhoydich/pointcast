import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const page = readFileSync(new URL('../src/pages/front-desk/agents/index.astro', import.meta.url), 'utf8');
const script = readFileSync(new URL('../src/scripts/front-desk-page.mjs', import.meta.url), 'utf8');
const markup = {};
for (const id of ['agent', 'human']) {
  markup[id] = page.match(new RegExp(`<form\\b[^>]*id="${id}-form"[\\s\\S]*?<\\/form>`))?.[0];
  assert.ok(markup[id], `${id} form is present`);
}
const submitter = (id) => markup[id].match(/<button\b[^>]*\btype="submit"[^>]*>/)?.[0] || '';
const disabled = (id) => /\sdisabled(?:\s|>|=)/.test(submitter(id));

function fixture(failAt = '') {
  const buttons = { agent: { disabled: disabled('agent') }, human: { disabled: disabled('human') } };
  const attached = [];
  const posts = [];
  const reads = [];
  const forms = {};
  for (const id of ['agent', 'human']) forms[id] = {
    values: id === 'agent'
      ? { passport: JSON.stringify({ schema: 'fixture', name: 'visiting-agent' }), company: '' }
      : { handle: 'Visiting Person', company: '' },
    handler: null,
    reset() {},
    addEventListener(type, handler) {
      if (type !== 'submit') return;
      if (failAt === id) throw new Error(`${id} handler failed`);
      attached.push([id, buttons[id].disabled]);
      this.handler = handler;
    },
  };
  const nodes = { 'agent-form': forms.agent, 'human-form': forms.human, 'agent-submit': buttons.agent, 'human-submit': buttons.human };
  const context = vm.createContext({
    document: { getElementById: (id) => nodes[id] || null },
    FormData: class { constructor(form) { this.form = form; } get(name) { return this.form.values[name] ?? ''; } },
    fetch: async (url, init = {}) => {
      if (init.method === 'POST') {
        assert.equal(url, '/api/front-desk');
        posts.push(JSON.parse(init.body));
        return { ok: true, json: async () => ({ ok: true, visit: { level: 'self-declared' } }) };
      }
      assert.equal(url, '/front-desk/agents.json');
      reads.push(url);
      return { ok: true, json: async () => ({ visitors: [], counts: {} }) };
    },
  });
  return { buttons, forms, attached, posts, reads, context };
}

// HTML's disabled default submitter prevents clicks and implicit Enter submission.
// This checks shipped native form policy; the VM tests execute actual script wiring.
test('both native forms are inert before JavaScript, including named passport and handle fields', () => {
  for (const id of ['agent', 'human']) {
    assert.equal([...markup[id].matchAll(/<button\b[^>]*\btype="submit"[^>]*>/g)].length, 1);
    assert.match(submitter(id), new RegExp(`\\bid="${id}-submit"`));
    assert.equal(disabled(id), true, `${id} default submitter must be disabled in HTML`);
  }
  assert.match(markup.agent, /<textarea\b[^>]*name="passport"/);
  assert.match(markup.human, /<input\b[^>]*name="handle"/);
});

test('failed handler installation never enables an unprotected native form', () => {
  for (const failAt of ['agent', 'human']) {
    const f = fixture(failAt);
    assert.throws(() => vm.runInContext(script, f.context), new RegExp(`${failAt} handler failed`));
    assert.equal(f.buttons[failAt].disabled, true);
    assert.equal(f.forms[failAt].handler, null);
    if (failAt === 'human') {
      assert.equal(f.buttons.agent.disabled, false);
      assert.equal(typeof f.forms.agent.handler, 'function');
    } else assert.equal(f.buttons.human.disabled, true);
    assert.equal(f.posts.length, 0);
  }
});

test('actual page enables each form after preventDefault attaches and keeps explicit public JSON POST', async () => {
  const f = fixture();
  vm.runInContext(script, f.context);
  assert.deepEqual(f.attached, [['agent', true], ['human', true]]);
  assert.equal(f.buttons.agent.disabled, false);
  assert.equal(f.buttons.human.disabled, false);
  assert.equal(f.posts.length, 0, 'loading the board does not check anyone in');
  for (const id of ['agent', 'human']) {
    let prevented = false;
    f.forms[id].handler({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true, `${id} submission cannot fall through to native GET`);
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(f.posts.length, 2);
  assert.equal(f.posts[0].passport.name, 'visiting-agent');
  assert.equal(f.posts[1].kind, 'human');
  assert.equal(f.posts[1].handle, 'Visiting Person');
  assert.ok(f.reads.length >= 1);
});
