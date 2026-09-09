import { captureNative, isolatedDirectory, nativeEnvironment, parseJson, safeLoginUrl, MODEL_ID, TEXT_LIMIT, validateModel, validatePrompt } from './native-process.mjs';

export class ClaudeNative {
  constructor({ binary = process.env.POINTCAST_CLAUDE_BIN || 'claude', models = [], capture = captureNative, environment = process.env } = {}) {
    this.binary = binary; this.models = [...new Set(models.map(validateModel))].filter(Boolean);
    this.capture = capture; this.env = nativeEnvironment('claude', environment);
    this.safetyChecked = false;
  }
  async inspectAccount() {
    try {
      const result = await this.capture(this.binary, ['auth', 'status', '--json'], { env: this.env });
      const data = parseJson(result.stdout);
      return { provider: 'claude', available: true, authenticated: data.loggedIn === true,
        authMode: data.apiProvider === 'firstParty' && (data.authMethod === 'claude.ai' || (data.authMethod === 'oauthToken' && ['pro', 'max', 'team', 'enterprise'].includes(data.subscriptionType))) ? 'subscription'
          : /api|console/i.test(data.authMethod || '') ? 'api' : 'unknown' };
    } catch { return { provider: 'claude', available: false, authenticated: false, authMode: 'unknown' }; }
  }
  async listModels() {
    return { models: this.models.map((id) => ({ id, label: id })), modelDiscovery: this.models.length ? 'configured' : 'unavailable' };
  }
  async ensureSafety() {
    if (this.safetyChecked) return;
    const result = await this.capture(this.binary, ['--help'], { env: this.env });
    for (const flag of ['--safe-mode', '--tools', '--strict-mcp-config', '--no-session-persistence']) {
      if (result.code !== 0 || !result.stdout.includes(flag)) throw new Error('claude-upgrade-required-for-safe-mode');
    }
    this.safetyChecked = true;
  }
  async login({ signal, onProgress = () => {}, timeoutMs = 300_000 } = {}) {
    const existing = await this.inspectAccount();
    if (existing.authenticated) {
      if (existing.authMode !== 'subscription') throw new Error('existing-native-account-is-not-subscription');
      return { status: 'succeeded', text: 'Claude is already signed in through its native subscription.', actualModels: [] };
    }
    if (!existing.available) throw new Error('claude-cli-unavailable');
    let buffer = '', shown = new Set();
    const result = await this.capture(this.binary, ['auth', 'login', '--claudeai'], {
      env: this.env, signal, timeoutMs: Math.min(timeoutMs, 300_000),
      onChunk: async (chunk) => {
        buffer = (buffer + chunk).slice(-16_384);
        for (const candidate of buffer.match(/https:\/\/[^\s<>"\u001b]+(?=[\s<>"\u001b])/g) || []) {
          const verificationUrl = safeLoginUrl(candidate, 'claude');
          if (verificationUrl && !shown.has(verificationUrl)) {
            shown.add(verificationUrl); await onProgress({ verificationUrl });
          }
        }
      },
    });
    if (result.code !== 0) throw new Error('claude-login-failed');
    const account = await this.inspectAccount();
    if (!account.authenticated || account.authMode !== 'subscription') throw new Error('claude-login-not-confirmed');
    return { status: 'succeeded', text: 'Claude native subscription sign-in confirmed.', actualModels: [] };
  }
  async runText({ prompt, model = null, signal, timeoutMs = 120_000 } = {}) {
    validatePrompt(prompt); validateModel(model);
    const account = await this.inspectAccount();
    if (!account.available) throw new Error('claude-cli-unavailable');
    if (!account.authenticated || account.authMode !== 'subscription') throw new Error('claude-subscription-sign-in-required');
    await this.ensureSafety();
    return isolatedDirectory(async (cwd) => {
      const args = ['-p', '--output-format', 'json', '--safe-mode', '--tools', '',
        '--permission-mode', 'dontAsk', '--permission-prompts', 'none', '--strict-mcp-config',
        '--mcp-config', '{"mcpServers":{}}', '--setting-sources', '', '--disable-slash-commands',
        '--no-chrome', '--no-session-persistence', '--max-turns', '1',
        '--system-prompt', 'You are a text-only PointCast companion. Answer the supplied user text in at most 300 words. You have no tools, filesystem access, browsing, or ability to take external actions. Do not claim to have performed actions.'];
      if (model) args.push('--model', model);
      const response = await this.capture(this.binary, args, { env: this.env, cwd, input: prompt,
        signal, timeoutMs: Math.min(timeoutMs, 120_000) });
      const data = parseJson(response.stdout);
      if (response.code !== 0 || data.is_error || (data.subtype && data.subtype !== 'success')) throw new Error('claude-task-failed');
      if (Array.isArray(data.permission_denials) && data.permission_denials.length) throw new Error('claude-unexpected-tool-request');
      if (typeof data.result !== 'string' || !data.result.trim() || data.result.length > TEXT_LIMIT) throw new Error('claude-result-invalid');
      const actualModels = data.modelUsage && typeof data.modelUsage === 'object' && !Array.isArray(data.modelUsage)
        ? Object.keys(data.modelUsage).filter((id) => MODEL_ID.test(id)) : [];
      if (!actualModels.length) throw new Error('claude-model-unverified');
      if (model?.startsWith('claude-') && !actualModels.includes(model)) throw new Error('claude-model-mismatch');
      return { status: 'succeeded', text: data.result, requestedModel: model, actualModels,
        nativeSessionId: typeof data.session_id === 'string' ? data.session_id : null };
    });
  }
  async close() {}
}
