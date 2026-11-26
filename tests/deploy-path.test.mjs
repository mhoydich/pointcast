import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub is the deploy path (.github/workflows/cloudflare-pages.yml) and
// scripts/deploy.sh is the iMac fallback. These checks keep the script from
// silently becoming a second deploy path again and keep the workflow's gates
// in order. The pinned-release behaviour of the fallback is covered by
// tests/test_deploy_pinned_release.py.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/deploy.sh');
const workflowPath = join(root, '.github/workflows/cloudflare-pages.yml');

function runScript(args) {
  const home = mkdtempSync(join(tmpdir(), 'pc-deploy-path-'));
  const env = {
    PATH: process.env.PATH,
    LANG: 'C',
    HOME: home,
    PC_DEPLOY_LOCK: join(home, 'lock'),
    PC_DEPLOY_LOG: join(home, 'logs/deploy.log'),
    PC_DEPLOY_DIR: join(home, 'pc-deploy'),
  };
  const result = spawnSync('bash', [script, ...args], { env, encoding: 'utf8', timeout: 15000 });
  const left = readdirSync(home);
  rmSync(home, { recursive: true, force: true });
  return { ...result, left };
}

function loadYaml() {
  try {
    return createRequire(import.meta.url)('js-yaml');
  } catch {
    return null;
  }
}

test('deploy.sh passes bash -n', () => {
  const result = spawnSync('bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('deploy.sh with no flags points at GitHub and touches nothing', () => {
  for (const args of [[], ['--force']]) {
    const result = runScript(args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /GitHub deploys main on every merge/);
    assert.match(result.stdout, /gh run list --workflow cloudflare-pages\.yml --branch main --limit 3/);
    assert.match(result.stdout, /gh workflow run cloudflare-pages\.yml --ref main/);
    assert.match(result.stdout, /--fallback is only for when that run failed or GitHub is\s+down/);
    assert.deepEqual(result.left, [], `no lock, log or deploy dir for ${JSON.stringify(args)}`);
  }
});

test('deploy.sh --release-sha without --fallback exits 2 before any work', () => {
  for (const args of [['--release-sha=' + 'a'.repeat(40)], ['--dry-run', '--release-sha=' + 'a'.repeat(40)]]) {
    const result = runScript(args);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /--fallback/);
    assert.equal(result.stderr.trim().split('\n').length, 1);
    assert.deepEqual(result.left, []);
  }
});

test('deploy workflow runs build, gate, token check, deploy, smoke in that order', (t) => {
  const text = readFileSync(workflowPath, 'utf8');
  const yaml = loadYaml();
  if (!yaml) {
    t.skip('js-yaml is not installed; run npm ci');
    return;
  }
  const workflow = yaml.load(text);
  const steps = workflow.jobs.deploy.steps;
  const index = (name) => steps.findIndex((step) => step.name === name);
  const order = ['Build', 'Gate the build', 'Check for the Cloudflare token', 'Deploy to Cloudflare Pages', 'Smoke test pointcast.xyz'];
  const positions = order.map(index);
  assert.ok(positions.every((position) => position >= 0), `missing step: ${order[positions.indexOf(-1)]}`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);

  assert.deepEqual(workflow.permissions, { contents: 'read' });
  const deploy = steps[index('Deploy to Cloudflare Pages')];
  assert.match(deploy.run, /wrangler@4\.158\.0 pages deploy dist/);
  assert.match(deploy.run, /--commit-message="\$subject"/);
  assert.doesNotMatch(deploy.run, /github\.event/);
  assert.equal(steps[index('Smoke test pointcast.xyz')].if, "steps.token.outputs.present == 'true'");
});

test('workflow gate fails on a thin dist and passes a complete one', (t) => {
  const yaml = loadYaml();
  if (!yaml) {
    t.skip('js-yaml is not installed; run npm ci');
    return;
  }
  const steps = yaml.load(readFileSync(workflowPath, 'utf8')).jobs.deploy.steps;
  const gate = steps.find((step) => step.name === 'Gate the build').run;
  const runGate = (fill) => {
    const dir = mkdtempSync(join(tmpdir(), 'pc-gate-'));
    try {
      fill(dir);
      const output = join(dir, 'github-output');
      writeFileSync(output, '');
      const result = spawnSync('bash', ['-eo', 'pipefail', '-c', gate], {
        cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH, GITHUB_OUTPUT: output },
      });
      return { ...result, output: readFileSync(output, 'utf8') };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const writeRequired = (dir) => {
    mkdirSync(join(dir, 'dist/court'), { recursive: true });
    for (const page of ['index.html', 'court/index.html', 'blocks.json']) writeFileSync(join(dir, 'dist', page), 'x');
  };

  assert.notEqual(runGate(() => {}).status, 0, 'no dist');
  assert.notEqual(runGate(writeRequired).status, 0, 'three files only');
  const missing = runGate((dir) => {
    writeRequired(dir);
    rmSync(join(dir, 'dist/blocks.json'));
    for (let i = 0; i < 3000; i += 1) writeFileSync(join(dir, 'dist', `f${i}.txt`), '');
  });
  assert.notEqual(missing.status, 0, 'missing blocks.json');
  const ok = runGate((dir) => {
    writeRequired(dir);
    for (let i = 0; i < 2997; i += 1) writeFileSync(join(dir, 'dist', `f${i}.txt`), '');
  });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /dist holds 3000 files/);
  assert.equal(ok.output.trim(), 'files=3000');
  assert.ok(!existsSync(join(tmpdir(), 'dist')));
});
