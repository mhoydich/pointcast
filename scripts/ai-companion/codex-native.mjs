import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { nativeEnvironment, stopProcess, safeLoginUrl, TEXT_LIMIT, validateModel, validatePrompt } from './native-process.mjs';

export const CODEX_TEXT_CONFIG = {
  'model_provider': 'openai', 'web_search': 'disabled', 'tools.view_image': false,
  'project_doc_max_bytes': 0, 'mcp_servers': {}, 'apps._default.enabled': false,
  ...Object.fromEntries(['shell_tool', 'unified_exec', 'shell_snapshot', 'apps', 'plugins', 'remote_plugin',
    'hooks', 'memories', 'chronicle', 'multi_agent', 'multi_agent_v2', 'goals', 'code_mode', 'code_mode_host',
    'browser_use', 'browser_use_external', 'computer_use', 'image_generation', 'workspace_dependencies',
    'skill_mcp_dependency_install', 'tool_suggest', 'request_permissions_tool', 'standalone_web_search',
  ].map((name) => [`features.${name}`, false])),
};

export class CodexRpc extends EventEmitter {
  constructor({ binary = process.env.POINTCAST_CODEX_BIN || 'codex', spawnImpl = spawn,
    environment = process.env, stopImpl = stopProcess } = {}) {
    super(); this.binary = binary; this.spawnImpl = spawnImpl; this.env = nativeEnvironment('codex', environment);
    this.stopImpl = stopImpl; this.pending = new Map(); this.sequence = 0; this.child = null; this.cwd = null; this.unexpectedRequests = 0;
  }
  async connect() {
    if (this.connecting) return this.connecting;
    if (this.child) return;
    this.connecting = this.openRestricted();
    try { await this.connecting; } finally { this.connecting = null; }
  }
  async openRestricted() {
    // Configuration discovery starts no thread or inference. Only MCP names
    // survive this response; restart before any thread can initialize a server.
    await this.open();
    let names;
    try { names = Object.keys((await this.request('config/read', { includeLayers: false, cwd: this.cwd })).config?.mcp_servers || {}); }
    catch (error) { await this.close(); throw error; }
    await this.close();
    if (names.some((name) => !/^[A-Za-z0-9_-]{1,120}$/.test(name))) throw new Error('codex-mcp-name-not-supported');
    this.disabledServerNames = names;
    await this.open();
    try {
      const disabled = Object.entries((await this.request('config/read', { includeLayers: false, cwd: this.cwd })).config?.mcp_servers || {})
        .map(([name, server]) => [name, server?.enabled === false]);
      if (disabled.some(([name, off]) => !off || !names.includes(name))) throw new Error('codex-inherited-mcp-not-disabled');
    } catch (error) { await this.close(); throw error; }
  }
  async open() {
    this.cwd = await mkdtemp(join(tmpdir(), 'pointcast-codex-'));
    const args = ['app-server', '--stdio'];
    for (const [key, value] of Object.entries(CODEX_TEXT_CONFIG)) args.push('-c', `${key}=${JSON.stringify(value)}`);
    for (const name of this.disabledServerNames || []) args.push('-c', `mcp_servers.${name}.enabled=false`);
    const child = this.spawnImpl(this.binary, args, { cwd: this.cwd, env: this.env,
      stdio: ['pipe', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
    this.child = child;
    let buffer = '';
    child.stdout.setEncoding?.('utf8');
    child.stdout.on('data', (data) => {
      if (Buffer.byteLength(buffer) + Buffer.byteLength(data) > 1_000_000) {
        this.fail(new Error('codex-output-too-large')); this.stopImpl(child); return;
      }
      buffer += data.toString();
      let split;
      while ((split = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, split); buffer = buffer.slice(split + 1);
        if (!line.trim()) continue;
        let msg; try { msg = JSON.parse(line); } catch { this.fail(new Error('codex-protocol-invalid')); this.stopImpl(child); return; }
        if (msg.id != null && msg.method) {
          this.send({ id: msg.id, error: { code: -32601, message: 'This text-only companion does not provide tools, approvals, or external tokens.' } });
          this.unexpectedRequests += 1;
          this.emit('unexpectedRequest', msg.method);
        } else if (msg.id != null) {
          const pending = this.pending.get(msg.id);
          if (pending) {
            this.pending.delete(msg.id); clearTimeout(pending.timer);
            if (msg.error) pending.reject(new Error('codex-request-failed')); else pending.resolve(msg.result);
          }
        } else if (msg.method) this.emit('notification', msg);
      }
    });
    child.stderr.on('data', () => {}); // Drain native diagnostics; never forward them to the cloud.
    child.stdin.on('error', () => {});
    child.once('error', () => this.fail(new Error('codex-cli-unavailable')));
    child.once('close', () => { if (this.child === child) { this.child = null; this.fail(new Error('codex-native-stopped')); } });
    try {
      await this.request('initialize', { clientInfo: { name: 'pointcast-companion', title: 'PointCast companion', version: '0.1.0' },
        capabilities: { experimentalApi: true } });
      this.send({ method: 'initialized', params: {} });
    } catch (error) { await this.close(); throw error; }
  }
  fail(error) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear(); this.emit('failure', error);
  }
  send(message) { if (!this.child?.stdin.writable) throw new Error('codex-native-stopped'); this.child.stdin.write(`${JSON.stringify(message)}\n`); }
  request(method, params = {}, timeoutMs = 15_000) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('codex-request-timeout')); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try { this.send({ id, method, params }); } catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
  async close() {
    if (this.child) { const child = this.child; this.child = null; this.stopImpl(child); }
    this.fail(new Error('codex-native-stopped'));
    if (this.cwd) { await rm(this.cwd, { recursive: true, force: true }); this.cwd = null; }
  }
}

export class CodexNative {
  constructor(options = {}) { this.rpc = options.rpc || new CodexRpc(options); }
  async inspectAccount() {
    try {
      await this.rpc.connect();
      const data = await this.rpc.request('account/read', { refreshToken: false });
      return { provider: 'codex', available: true, authenticated: Boolean(data.account),
        authMode: data.account?.type === 'chatgpt' ? 'subscription' : data.account?.type === 'apiKey' ? 'api' : 'unknown' };
    } catch { return { provider: 'codex', available: false, authenticated: false, authMode: 'unknown' }; }
  }
  async listModels() {
    await this.rpc.connect();
    let cursor = null, models = [];
    for (let page = 0; page < 4; page++) {
      const data = await this.rpc.request('model/list', { limit: 100, includeHidden: false, ...(cursor ? { cursor } : {}) });
      models.push(...(data.data || []).filter((item) => typeof item.model === 'string').map((item) => ({
        id: item.model, label: String(item.displayName || item.model).slice(0, 120),
      })));
      cursor = data.nextCursor; if (!cursor) break;
    }
    return { models: [...new Map(models.map((model) => [model.id, model])).values()], modelDiscovery: 'native' };
  }
  async login({ signal, onProgress = () => {}, timeoutMs = 300_000 } = {}) {
    const existing = await this.inspectAccount();
    if (existing.authenticated) {
      if (existing.authMode !== 'subscription') throw new Error('existing-native-account-is-not-subscription');
      return { status: 'succeeded', text: 'Codex is already signed in through ChatGPT.', actualModels: [] };
    }
    if (!existing.available) throw new Error('codex-cli-unavailable');
    let loginId;
    const notifications = [];
    const record = (msg) => notifications.push(msg);
    this.rpc.on('notification', record);
    try {
      if (signal?.aborted) throw new Error('cancelled');
      const login = await this.rpc.request('account/login/start', { type: 'chatgptDeviceCode' });
      loginId = login.loginId;
      const verificationUrl = safeLoginUrl(login.verificationUrl, 'codex');
      if (!loginId || !verificationUrl || typeof login.userCode !== 'string' || login.userCode.length > 100) throw new Error('codex-login-invalid');
      await onProgress({ verificationUrl, userCode: login.userCode });
      await this.waitFor((msg) => msg.method === 'account/login/completed' && msg.params?.loginId === loginId ? msg.params : null,
        { signal, timeoutMs: Math.min(timeoutMs, 300_000), previous: notifications });
      const account = await this.inspectAccount();
      if (!account.authenticated || account.authMode !== 'subscription') throw new Error('codex-login-not-confirmed');
      return { status: 'succeeded', text: 'Codex native ChatGPT sign-in confirmed.', actualModels: [] };
    } catch (error) {
      if (loginId) await this.rpc.request('account/login/cancel', { loginId }, 2000).catch(() => {});
      throw error;
    } finally { this.rpc.off('notification', record); }
  }
  waitFor(select, { signal, timeoutMs, previous = [] } = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, result) => {
        if (settled) return; settled = true; clearTimeout(timer);
        this.rpc.off('notification', notification); this.rpc.off('failure', failure); this.rpc.off('unexpectedRequest', unexpected);
        signal?.removeEventListener('abort', abort);
        if (error) reject(error); else resolve(result);
      };
      const notification = (msg) => { try { const value = select(msg); if (value) finish(null, value); } catch (e) { finish(e); } };
      const failure = (e) => finish(e), unexpected = () => finish(new Error('codex-unexpected-tool-request'));
      const abort = () => finish(new Error('cancelled'));
      const timer = setTimeout(() => finish(new Error('native-timeout')), timeoutMs);
      this.rpc.on('notification', notification); this.rpc.on('failure', failure); this.rpc.on('unexpectedRequest', unexpected);
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      for (const msg of previous) { notification(msg); if (settled) break; }
    });
  }
  async runText({ prompt, model = null, signal, timeoutMs = 120_000 } = {}) {
    validatePrompt(prompt); validateModel(model);
    const account = await this.inspectAccount();
    if (!account.available) throw new Error('codex-cli-unavailable');
    if (!account.authenticated || account.authMode !== 'subscription') throw new Error('codex-subscription-sign-in-required');
    // Empty maps merge with native user configuration. Discover only server
    // names, discard the response, and explicitly disable each inherited MCP.
    // Neither configuration values nor provider credentials leave this process.
    const disabled = Object.entries((await this.rpc.request('config/read', {
      includeLayers: false, cwd: this.rpc.cwd,
    })).config?.mcp_servers || {}).map(([name, server]) => [name, server?.enabled === false]);
    if (disabled.some(([, off]) => !off)) { await this.rpc.close(); throw new Error('codex-inherited-mcp-not-disabled'); }
    const serverNames = disabled.map(([name]) => name);
    const textConfig = { ...CODEX_TEXT_CONFIG, mcp_servers: Object.fromEntries(
      serverNames.map((name) => [name, { enabled: false }]),
    ) };
    const unexpectedBefore = this.rpc.unexpectedRequests || 0;
    const thread = await this.rpc.request('thread/start', {
      model, modelProvider: 'openai', allowProviderModelFallback: false, ephemeral: true,
      cwd: this.rpc.cwd, sandbox: 'read-only', approvalPolicy: 'never', approvalsReviewer: 'user',
      environments: [], selectedCapabilityRoots: [], runtimeWorkspaceRoots: [], dynamicTools: [],
      config: textConfig, serviceName: 'pointcast-companion',
      baseInstructions: 'You are a text-only PointCast companion. Answer only the supplied user text in at most 300 words. You have no tools or external actions. Do not claim to browse, read files, or run commands.',
      developerInstructions: 'Respond in text only. No tool use, files, shell, network, delegation, or external actions are permitted.',
    });
    const threadId = thread.thread?.id;
    if (!threadId || thread.sandbox?.type !== 'readOnly' || thread.sandbox.networkAccess !== false || thread.approvalPolicy !== 'never') {
      throw new Error('codex-safe-mode-not-confirmed');
    }
    const mcp = await this.rpc.request('mcpServerStatus/list', { threadId, detail: 'toolsAndAuthOnly', limit: 100 });
    // Native inventory includes disabled catalog entries. Every entry must be
    // explicitly disabled in effective config, with an empty tool map.
    if (!Array.isArray(mcp.data) || mcp.nextCursor || mcp.data.some((server) =>
      !serverNames.includes(server.name) || !server.tools || typeof server.tools !== 'object' || Array.isArray(server.tools) || Object.keys(server.tools).length)) {
      await this.rpc.close(); throw new Error('codex-inherited-mcp-not-disabled');
    }
    if ((this.rpc.unexpectedRequests || 0) !== unexpectedBefore) {
      await this.rpc.close(); throw new Error('codex-unexpected-tool-request');
    }
    if (typeof thread.model !== 'string' || !thread.model) throw new Error('codex-model-unverified');
    if (model && thread.model !== model) throw new Error('codex-model-mismatch');
    const actualModels = new Set([thread.model]);
    let turnId = null, textByItem = new Map(), buffered = [];
    const record = (msg) => { if (msg.params?.threadId === threadId) buffered.push(msg); };
    this.rpc.on('notification', record);
    try {
      if (signal?.aborted) throw new Error('cancelled');
      const turn = await this.rpc.request('turn/start', { threadId, input: [{ type: 'text', text: prompt, text_elements: [] }],
        effort: 'low', environments: [], approvalPolicy: 'never', sandboxPolicy: { type: 'readOnly', networkAccess: false } });
      turnId = turn.turn?.id;
      if (!turnId) throw new Error('codex-turn-invalid');
      if ((this.rpc.unexpectedRequests || 0) !== unexpectedBefore) throw new Error('codex-unexpected-tool-request');
      const done = await this.waitFor((msg) => {
        const p = msg.params || {};
        if (p.threadId !== threadId || (p.turnId && p.turnId !== turnId)) return null;
        if (msg.method === 'model/rerouted' && typeof p.toModel === 'string') actualModels.add(p.toModel);
        if (msg.method === 'item/started' && !['agentMessage', 'userMessage', 'reasoning', 'plan'].includes(p.item?.type)) {
          throw new Error('codex-unexpected-tool-request');
        }
        if (msg.method === 'item/agentMessage/delta') textByItem.set(p.itemId, (textByItem.get(p.itemId) || '') + (p.delta || ''));
        if (msg.method === 'item/completed' && p.item?.type === 'agentMessage') textByItem.set(p.item.id, p.item.text || '');
        if ([...textByItem.values()].join('').length > TEXT_LIMIT) throw new Error('native-output-too-large');
        if (msg.method === 'turn/completed' && p.turn?.id === turnId) return p.turn;
        return null;
      }, { signal, timeoutMs: Math.min(timeoutMs, 120_000), previous: buffered });
      if (done.status !== 'completed') throw new Error(done.status === 'interrupted' ? 'cancelled' : 'codex-task-failed');
      for (const item of done.items || []) if (item.type === 'agentMessage') textByItem.set(item.id, item.text || '');
      const text = [...textByItem.values()].filter(Boolean).join('\n\n');
      if (!text.trim() || text.length > TEXT_LIMIT) throw new Error('codex-result-invalid');
      return { status: 'succeeded', text, requestedModel: model, actualModels: [...actualModels], nativeSessionId: threadId };
    } catch (error) {
      if (turnId) await this.rpc.request('turn/interrupt', { threadId, turnId }, 2000).catch(() => {});
      // Stop the dedicated native process as well if an interrupt cannot be
      // confirmed, or a forbidden tool was requested. Nothing is retried.
      await this.rpc.close(); throw error;
    } finally { this.rpc.off('notification', record); }
  }
  async close() { await this.rpc.close(); }
}
