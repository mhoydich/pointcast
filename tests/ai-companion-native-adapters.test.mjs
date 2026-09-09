import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { access } from 'node:fs/promises';
import { CodexNative, CodexRpc, CODEX_TEXT_CONFIG } from '../scripts/ai-companion/codex-native.mjs';
import { ClaudeNative } from '../scripts/ai-companion/claude-native.mjs';
import { captureNative, nativeEnvironment, safeLoginUrl, validateModel, validatePrompt } from '../scripts/ai-companion/native-process.mjs';

const account = { loggedIn: true, authMethod: 'claude.ai', apiProvider: 'firstParty', subscriptionType: 'max', email: 'private@example.test' };
const help = '--safe-mode --tools --strict-mcp-config --no-session-persistence';
function claudeFixture(overrides = {}) {
  const calls = [];
  const capture = async (binary, args, options) => {
    calls.push({ binary, args, options });
    if (args[0] === 'auth' && args[1] === 'status') return { code: 0, stdout: JSON.stringify(overrides.account || account) };
    if (args[0] === '--help') return { code: 0, stdout: overrides.help ?? help };
    return { code: 0, stdout: JSON.stringify(overrides.result || { subtype: 'success', result: 'Hello PointCast.', modelUsage: { 'claude-fable-5-1': {}, 'claude-haiku-4-5': {} }, session_id: 'native-private' }) };
  };
  return { adapter: new ClaudeNative({ capture, models: ['claude-fable-5-1'], environment: { PATH: '/safe', ANTHROPIC_API_KEY: 'do-not-forward', CLAUDE_CODE_OAUTH_TOKEN: 'do-not-forward' } }), calls };
}
class FakeRpc extends EventEmitter {
  constructor(overrides = {}) { super(); this.overrides = overrides; this.calls = []; this.cwd = '/private/tmp/mock-native'; this.closed = 0; this.unexpectedRequests = 0; }
  async connect() {}
  async close() { this.closed++; }
  async request(method, params) {
    this.calls.push({ method, params });
    if (this.overrides[method]) return this.overrides[method](params, this);
    if (method === 'account/read') return { account: { type: 'chatgpt', email: 'private@example.test' } };
    if (method === 'config/read') return { config: { mcp_servers: { inherited: { enabled: false, env: { PRIVATE: 'not-forwarded' } } } } };
    if (method === 'thread/start') return { thread: { id: 'thread-1' }, model: params.model || 'gpt-5.6-luna', sandbox: { type: 'readOnly', networkAccess: false }, approvalPolicy: 'never' };
    if (method === 'mcpServerStatus/list') return { data: [{ name: 'inherited', tools: {} }], nextCursor: null };
    if (method === 'turn/start') {
      this.emit('notification', { method: 'item/agentMessage/delta', params: { threadId: 'thread-1', turnId: 'turn-1', itemId: 'item-1', delta: 'Hello.' } });
      this.emit('notification', { method: 'turn/completed', params: { threadId: 'thread-1', turn: { id: 'turn-1', status: 'completed', items: [] } } });
      return { turn: { id: 'turn-1' } };
    }
    return {};
  }
}

test('native environment removes API billing and injected runtime overrides without changing source', () => {
  const source = { HOME: '/native', PATH: '/bin', OPENAI_API_KEY: 'x', OPENAI_BASE_URL: 'x', ANTHROPIC_API_KEY: 'x', ANTHROPIC_BASE_URL: 'x', CLAUDE_CODE_OAUTH_TOKEN: 'x', CODEX_API_KEY: 'x', CLAUDE_CODE_USE_BEDROCK: '1', NODE_OPTIONS: '--require evil', CLAUDECODE: 'nested' };
  const result = nativeEnvironment('claude', source);
  assert.deepEqual(result, { HOME: '/native', PATH: '/bin', CLAUDE_CODE_SAFE_MODE: '1' });
  assert.equal(source.OPENAI_API_KEY, 'x');
});
test('login URL, prompt, and model validation reject unsafe or unbounded values', () => {
  assert.equal(safeLoginUrl('https://auth.openai.com/device', 'codex'), 'https://auth.openai.com/device');
  for (const value of ['http://auth.openai.com/device', 'https://auth.openai.com.evil.test/', 'https://user@auth.openai.com/', 'https://arbitrary.openai.com/', 'https://claude.ai/login']) assert.equal(safeLoginUrl(value, 'codex'), null);
  assert.throws(() => validatePrompt('x'.repeat(6001)), /invalid-prompt/);
  assert.throws(() => validateModel('--model evil'), /invalid-model/);
});
test('Claude exposes sanitized native subscription status and configured models honestly', async () => {
  const { adapter } = claudeFixture();
  assert.deepEqual(await adapter.inspectAccount(), { provider: 'claude', available: true, authenticated: true, authMode: 'subscription' });
  assert.deepEqual(await adapter.listModels(), { models: [{ id: 'claude-fable-5-1', label: 'claude-fable-5-1' }], modelDiscovery: 'configured' });
  assert.equal((await new ClaudeNative({ capture: async () => ({ code: 0, stdout: JSON.stringify({ ...account, authMethod: 'oauthToken' }) }) }).inspectAccount()).authMode, 'subscription');
  assert.deepEqual(await new ClaudeNative().listModels(), { models: [], modelDiscovery: 'unavailable' });
});
test('Claude bounded text invocation disables tools/customizations and proves actual models', async () => {
  const { adapter, calls } = claudeFixture();
  const result = await adapter.runText({ prompt: 'Hello', model: 'claude-fable-5-1' });
  assert.deepEqual(result.actualModels, ['claude-fable-5-1', 'claude-haiku-4-5']);
  const task = calls.find(call => call.args[0] === '-p');
  for (const flag of ['--safe-mode', '--strict-mcp-config', '--disable-slash-commands', '--no-chrome', '--no-session-persistence']) assert.ok(task.args.includes(flag));
  assert.equal(task.args[task.args.indexOf('--tools') + 1], '');
  assert.equal(task.args[task.args.indexOf('--setting-sources') + 1], '');
  assert.equal(task.args[task.args.indexOf('--model') + 1], 'claude-fable-5-1');
  assert.equal(task.args.includes('--bare'), false);
  assert.equal(task.options.input, 'Hello');
  assert.equal(task.options.env.ANTHROPIC_API_KEY, undefined);
  await assert.rejects(access(task.options.cwd));
});
test('Claude blocks API billing and unsafe CLI versions before inference', async () => {
  for (const override of [{ account: { ...account, authMethod: 'api_key' } }, { help: '--tools' }]) {
    const { adapter, calls } = claudeFixture(override);
    await assert.rejects(adapter.runText({ prompt: 'Hello' }), /subscription-sign-in-required|upgrade-required/);
    assert.equal(calls.some(call => call.args[0] === '-p'), false);
  }
});
test('Claude fails on missing model proof, different requested model, tools, and excessive output', async () => {
  for (const [result, expected] of [
    [{ result: 'hello' }, /model-unverified/],
    [{ result: 'hello', modelUsage: { 'claude-other': {} } }, /model-mismatch/],
    [{ result: 'hello', permission_denials: [{}] }, /unexpected-tool/],
    [{ result: 'x'.repeat(16001), modelUsage: { 'claude-fable-5-1': {} } }, /result-invalid/],
    [{ subtype: 'error_max_turns', result: 'hello' }, /task-failed/],
  ]) await assert.rejects(claudeFixture({ result }).adapter.runText({ prompt: 'Hi', model: 'claude-fable-5-1' }), expected);
});
test('Claude login preserves existing account and only publishes a complete native URL', async () => {
  const existing = claudeFixture(); await existing.adapter.login();
  assert.equal(existing.calls.some(call => call.args[1] === 'login'), false);
  const api = claudeFixture({ account: { ...account, authMethod: 'api_key' } });
  await assert.rejects(api.adapter.login(), /existing-native-account/);
  const progress = []; let loggedIn = false;
  const adapter = new ClaudeNative({ capture: async (_binary, args, options) => {
    if (args[1] === 'status') return { code: 0, stdout: JSON.stringify({ ...account, loggedIn }) };
    assert.deepEqual(args, ['auth', 'login', '--claudeai']);
    await options.onChunk('Open https://claude.ai/oauth/auth'); assert.equal(progress.length, 0);
    await options.onChunk('orize?state=temporary\n'); loggedIn = true;
    return { code: 0, stdout: '' };
  } });
  await adapter.login({ onProgress: value => progress.push(value) });
  assert.deepEqual(progress, [{ verificationUrl: 'https://claude.ai/oauth/authorize?state=temporary' }]);
});
test('Codex sanitizes subscription status and never routes API auth to inference', async () => {
  const rpc = new FakeRpc(); const adapter = new CodexNative({ rpc });
  assert.deepEqual(await adapter.inspectAccount(), { provider: 'codex', available: true, authenticated: true, authMode: 'subscription' });
  const api = new FakeRpc({ 'account/read': () => ({ account: { type: 'apiKey' } }) });
  await assert.rejects(new CodexNative({ rpc: api }).runText({ prompt: 'Hello' }), /subscription-sign-in-required/);
  await assert.rejects(new CodexNative({ rpc: api }).login(), /existing-native-account/);
  assert.equal(api.calls.some(call => call.method === 'thread/start'), false);
});
test('Codex explicitly disables inherited servers, accepts disabled zero-tool catalog, and captures early completion', async () => {
  const rpc = new FakeRpc(); const result = await new CodexNative({ rpc }).runText({ prompt: 'Hello', model: 'gpt-5.6-luna' });
  assert.equal(result.text, 'Hello.'); assert.deepEqual(result.actualModels, ['gpt-5.6-luna']);
  const thread = rpc.calls.find(call => call.method === 'thread/start').params;
  assert.deepEqual(thread.config.mcp_servers, { inherited: { enabled: false } });
  assert.equal(JSON.stringify(thread).includes('not-forwarded'), false);
  assert.equal(thread.approvalPolicy, 'never'); assert.equal(thread.sandbox, 'read-only');
  assert.deepEqual(thread.dynamicTools, []); assert.deepEqual(thread.environments, []);
  for (const flag of ['features.shell_tool', 'features.apps', 'features.plugins', 'features.hooks', 'features.code_mode']) assert.equal(thread.config[flag], false);
  assert.equal(thread.config.web_search, 'disabled');
});
test('Codex fails closed before inference for inherited enabled/unknown MCP, any tools, or pagination', async () => {
  const cases = [
    { 'config/read': () => ({ config: { mcp_servers: { inherited: { enabled: true } } } }) },
    { 'mcpServerStatus/list': () => ({ data: [{ name: 'unknown', tools: {} }] }) },
    { 'mcpServerStatus/list': () => ({ data: [{ name: 'inherited', tools: { shell: {} } }] }) },
    { 'mcpServerStatus/list': () => ({ data: [], nextCursor: 'more' }) },
  ];
  for (const overrides of cases) {
    const rpc = new FakeRpc(overrides);
    await assert.rejects(new CodexNative({ rpc }).runText({ prompt: 'Hi' }), /inherited-mcp-not-disabled/);
    assert.equal(rpc.calls.some(call => call.method === 'turn/start'), false);
    assert.equal(rpc.closed, 1);
  }
});
test('Codex detects server requests received before the completion listener and interrupts without retry', async () => {
  const rpc = new FakeRpc({ 'turn/start': (_params, self) => { self.unexpectedRequests++; self.emit('unexpectedRequest', 'item/tool/call'); return { turn: { id: 'turn-1' } }; } });
  await assert.rejects(new CodexNative({ rpc }).runText({ prompt: 'Hi' }), /unexpected-tool/);
  assert.equal(rpc.calls.filter(call => call.method === 'turn/start').length, 1);
  assert.ok(rpc.calls.some(call => call.method === 'turn/interrupt'));
  assert.equal(rpc.closed, 1);
});
test('Codex cancellation interrupts the active turn and stops its native process', async () => {
  const controller = new AbortController();
  const rpc = new FakeRpc({ 'turn/start': () => { setTimeout(() => controller.abort(), 5); return { turn: { id: 'turn-1' } }; } });
  await assert.rejects(new CodexNative({ rpc }).runText({ prompt: 'Hi', signal: controller.signal }), /cancelled/);
  assert.ok(rpc.calls.some(call => call.method === 'turn/interrupt'));
  assert.equal(rpc.closed, 1);
});
test('Codex native model list follows pagination and preserves actual native model ids', async () => {
  const rpc = new FakeRpc({ 'model/list': params => params.cursor ? { data: [{ model: 'gpt-b', displayName: 'B' }], nextCursor: null } : { data: [{ model: 'gpt-a', displayName: 'A' }], nextCursor: 'page2' } });
  assert.deepEqual(await new CodexNative({ rpc }).listModels(), { models: [{ id: 'gpt-a', label: 'A' }, { id: 'gpt-b', label: 'B' }], modelDiscovery: 'native' });
});
function childFixture(onMessage) {
  const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.stdin = new PassThrough(); child.exitCode = null;
  let input = '';
  child.stdin.on('data', data => { input += data; let split; while ((split = input.indexOf('\n')) >= 0) { const line = input.slice(0, split); input = input.slice(split + 1); if (line) onMessage(JSON.parse(line), child); } });
  return child;
}
test('Codex transport restarts with explicit disabled server flags and denies every server request', async () => {
  const spawns = [], sent = []; let responseToTool;
  const rpc = new CodexRpc({ spawnImpl: (_binary, args, options) => {
    const index = spawns.length;
    const child = childFixture((message, proc) => {
      sent.push(message);
      if (message.error) { responseToTool = message; return; }
      if (!message.id) return;
      const result = message.method === 'config/read' ? { config: { mcp_servers: { 'local-server': { enabled: index > 0 ? false : true, env: { SECRET: 'never-forward' } } } } } : {};
      queueMicrotask(() => proc.stdout.write(JSON.stringify({ id: message.id, result }) + '\n'));
    });
    spawns.push({ args, options, child }); return child;
  }, stopImpl: child => child.emit('close', 0), environment: { HOME: '/native', OPENAI_API_KEY: 'never-forward' } });
  try {
    await rpc.connect(); assert.equal(spawns.length, 2);
    assert.ok(spawns[1].args.includes('mcp_servers.local-server.enabled=false'));
    assert.equal(JSON.stringify(spawns.map(spawn => spawn.args)).includes('never-forward'), false);
    assert.equal(spawns[1].options.env.OPENAI_API_KEY, undefined);
    spawns[1].child.stdout.write(JSON.stringify({ id: 900, method: 'account/chatgptAuthTokens/refresh', params: {} }) + '\n');
    assert.equal(responseToTool.error.code, -32601); assert.equal(rpc.unexpectedRequests, 1);
  } finally { await rpc.close(); }
});
test('native process awaits ordered login progress and aborts bounded output', async () => {
  let child, stopped = 0, progressDone = false;
  const running = captureNative('native', ['auth'], { spawnImpl: () => { child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); return child; }, stopImpl: () => stopped++, onChunk: async () => { await new Promise(resolve => setTimeout(resolve, 5)); progressDone = true; } });
  child.stdout.write('ok'); child.emit('close', 0);
  const result = await running; assert.equal(result.stdout, 'ok'); assert.equal(progressDone, true); assert.equal(stopped, 0);
  const tooMuch = captureNative('native', [], { maxBytes: 2, spawnImpl: () => { child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); return child; }, stopImpl: () => stopped++ });
  child.stdout.write('long'); await assert.rejects(tooMuch, /output-too-large/); assert.equal(stopped, 1);
});

test('Codex native device-code login handles immediate completion and sanitizes its progress', async () => {
  let signedIn = false; const progress = [];
  const rpc = new FakeRpc({
    'account/read': () => ({ account: signedIn ? { type: 'chatgpt' } : null }),
    'account/login/start': (params, self) => {
      assert.deepEqual(params, { type: 'chatgptDeviceCode' }); signedIn = true;
      self.emit('notification', { method: 'account/login/completed', params: { loginId: 'login-1', success: true } });
      return { loginId: 'login-1', verificationUrl: 'https://auth.openai.com/device', userCode: 'TEST-CODE' };
    },
  });
  const result = await new CodexNative({ rpc }).login({ onProgress: value => progress.push(value) });
  assert.equal(result.status, 'succeeded'); assert.deepEqual(result.actualModels, []);
  assert.deepEqual(progress, [{ verificationUrl: 'https://auth.openai.com/device', userCode: 'TEST-CODE' }]);
  assert.equal(rpc.calls.some(call => call.method === 'account/logout'), false);
});
test('Codex login cancellation cancels only the pending native login', async () => {
  const controller = new AbortController();
  const rpc = new FakeRpc({ 'account/read': () => ({ account: null }), 'account/login/start': () => ({ loginId: 'login-1', verificationUrl: 'https://auth.openai.com/device', userCode: 'TEST-CODE' }) });
  await assert.rejects(new CodexNative({ rpc }).login({ signal: controller.signal, onProgress: () => controller.abort() }), /cancelled/);
  assert.deepEqual(rpc.calls.find(call => call.method === 'account/login/cancel').params, { loginId: 'login-1' });
  assert.equal(rpc.calls.some(call => call.method === 'account/logout'), false);
});
test('Codex retains actual model reroute evidence and refuses unexpected tool activity', async () => {
  const rpc = new FakeRpc({ 'turn/start': (_params, self) => {
    self.emit('notification', { method: 'model/rerouted', params: { threadId: 'thread-1', turnId: 'turn-1', toModel: 'gpt-rerouted' } });
    self.emit('notification', { method: 'turn/completed', params: { threadId: 'thread-1', turn: { id: 'turn-1', status: 'completed', items: [{ type: 'agentMessage', id: 'answer', text: 'Hello' }] } } });
    return { turn: { id: 'turn-1' } };
  } });
  assert.deepEqual((await new CodexNative({ rpc }).runText({ prompt: 'Hi', model: 'gpt-5.6-luna' })).actualModels, ['gpt-5.6-luna', 'gpt-rerouted']);
  const unsafe = new FakeRpc({ 'turn/start': (_params, self) => {
    self.emit('notification', { method: 'item/started', params: { threadId: 'thread-1', turnId: 'turn-1', item: { type: 'commandExecution' } } });
    return { turn: { id: 'turn-1' } };
  } });
  await assert.rejects(new CodexNative({ rpc: unsafe }).runText({ prompt: 'Hi' }), /unexpected-tool/);
  assert.ok(unsafe.calls.some(call => call.method === 'turn/interrupt'));
});

function framingRpc() {
  let activeChild, stops = 0;
  const rpc = new CodexRpc({ spawnImpl: () => {
    activeChild = childFixture((message, child) => {
      if (!message.id || message.method === 'hold') return;
      const result = message.method === 'config/read' ? { config: { mcp_servers: {} } } : {};
      queueMicrotask(() => child.stdout.write(JSON.stringify({ id: message.id, result }) + '\n'));
    });
    return activeChild;
  }, stopImpl: child => { stops++; child.emit('close', 0); } });
  return { rpc, get child() { return activeChild; }, get stops() { return stops; } };
}
test('Codex transport keeps working after more than 4 MB of sequential complete messages', async () => {
  const f = framingRpc(); let notifications = 0;
  try {
    await f.rpc.connect();
    f.rpc.on('notification', () => notifications++);
    const message = JSON.stringify({ method: 'test/heartbeat', params: { padding: 'x'.repeat(50_000) } }) + '\n';
    for (let i = 0; i < 100; i++) f.child.stdout.write(message);
    assert.ok(Buffer.byteLength(message) * 100 > 4_000_000);
    assert.equal(notifications, 100);
    assert.deepEqual(await f.rpc.request('test/ping'), {});
    assert.equal(f.stops, 1); // Only the deliberate configuration-discovery restart.
  } finally { await f.rpc.close(); }
});
test('Codex transport stops a single oversized pending message and rejects outstanding requests', async () => {
  const f = framingRpc();
  try {
    await f.rpc.connect();
    await assert.rejects(async () => {
      const pending = f.rpc.request('hold');
      f.child.stdout.write('x'.repeat(600_000));
      f.child.stdout.write('x'.repeat(400_001));
      await pending;
    }, /codex-output-too-large/);
    assert.equal(f.stops, 2);
  } finally { await f.rpc.close(); }
});
