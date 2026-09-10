import type { PointCastUser } from './types.ts';
import type { NativeProvider, ProviderState } from '../../../functions/_lib/ai-runtimes.ts';

const ENDPOINT = '/api/me/ai-runtimes';
const PROVIDER_NAMES = { codex: 'ChatGPT · Codex', claude: 'Claude · Claude Code' };
const CONTEXTS: Record<string, string> = {
  'elemental-shrine': 'Elemental Shrine — a quiet interactive altar of stone, light, fire, and water, with an optional soundscape. Reference link: https://pointcast.xyz/elemental-shrine',
  'open-road': 'Open Road — a quiet shrine around a 1955 Chevrolet painting: one minute of stillness, slow breathing, and offering a light. Reference link: https://pointcast.xyz/open-road',
};
export type RuntimeSummary = {
  id: string; label: string; status: 'waiting' | 'offline' | 'online';
  expiresAt: string | null; lastSeenAt: string | null; lastSuccessAt: string | null; providers: ProviderState[];
};
export type RuntimeJobSummary = {
  id: string; requestId?: string; runtimeId: string; kind: 'login' | 'prompt'; provider: NativeProvider; model?: string | null;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'; createdAt: string; expiresAt: string;
  login?: { verificationUrl: string; userCode?: string };
  result?: { text: string; requestedModel?: string; actualModels?: string[] }; error?: string;
};
type Snapshot = { runtimes: RuntimeSummary[]; jobs: RuntimeJobSummary[] };
type Pairing = { runtimeId: string; code: string; expiresAt: string };

export function buildRuntimePrompt(prompt: string, context: string, note: string): string {
  return [prompt.trim(), CONTEXTS[context] ? `Selected PointCast context (provided text only):\n${CONTEXTS[context]}` : '', note.trim() ? `My note for this task:\n${note.trim()}` : ''].filter(Boolean).join('\n\n');
}

export function nativeLoginUrl(value: unknown, provider: NativeProvider): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const hosts = provider === 'codex' ? ['auth.openai.com', 'chatgpt.com'] : ['claude.ai', 'claude.com', 'platform.claude.com', 'console.anthropic.com'];
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && hosts.includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export function runtimeErrorMessage(reason: string): string {
  const messages: Record<string, string> = {
    unauthorized: 'Sign in to PointCast to manage your AI.',
    'origin-not-allowed': 'Open your PointCast profile directly and try again.',
    'runtime-offline': 'Your companion is offline. Open it on your computer, then check status.',
    'runtime-not-found': 'This computer is no longer paired. Refresh your connections.',
    'runtime-limit': 'You have five paired or waiting computers. Remove one before pairing another.',
    'request-conflict': 'This retry no longer matches the original request. Change the task before submitting a new request.',
    'runtime-busy': 'This companion already has a task in progress. Wait or cancel it first.',
    'provider-unavailable': 'The native AI client is unavailable on this computer. Check the companion setup guide.',
    'claude-login-native-terminal-required': 'Claude needs its native terminal to finish sign-in. Run claude auth login --claudeai in a terminal on the paired computer, finish sign-in there, then choose Check status.',
    'provider-not-ready': 'Finish signing in to your AI, then check status.',
    'subscription-required': 'Use native subscription sign-in for this pilot. Separately billed API access remains an advanced manual option.',
    'model-not-available': 'That model is no longer available. Check status and choose a listed model.',
    'invalid-prompt': 'Enter a task and keep the complete preview within 4,000 characters.',
    'invalid-label': 'Give this computer a short name before pairing.',
    'job-limit': 'The hourly task limit has been reached. Try again later.',
    'job-expired': 'This request expired. Start a new one when your companion is online.',
    'body-too-large': 'This request is too large. Shorten the task and note, then try again.',
    'model-proof-required': 'The task did not report its actual model. It has not verified this connection.',
  };
  return messages[reason] || 'Your AI connection is unavailable right now. Check your companion and try again.';
}

export class AiRuntimeRequestError extends Error {
  status: number;
  reason: string;
  constructor(status: number, reason: string) {
    super(runtimeErrorMessage(reason)); this.name = 'AiRuntimeRequestError'; this.status = status; this.reason = reason;
  }
}

export async function readRuntimeResponse(response: Response): Promise<Record<string, any>> {
  let payload: any = null;
  try { payload = await response.json(); } catch { /* Edge errors can be HTML. */ }
  if (!response.ok || !payload || typeof payload !== 'object' || Array.isArray(payload) || payload.ok === false) {
    throw new AiRuntimeRequestError(response.status, typeof payload?.reason === 'string' ? payload.reason : response.status === 401 ? 'unauthorized' : 'invalid-response');
  }
  return payload;
}

export function buildRuntimeView(runtime: RuntimeSummary | null, provider: NativeProvider, jobs: RuntimeJobSummary[], now = Date.now()) {
  const client = runtime?.providers.find((item) => item.provider === provider) ?? null;
  const online = runtime?.status === 'online' && Boolean(runtime.lastSeenAt) && now - Date.parse(runtime.lastSeenAt!) < 45_000;
  const subscriptionReady = Boolean(online && client?.available && client.authenticated && client.authMode === 'subscription');
  const successfulTask = jobs.find((job) => job.runtimeId === runtime?.id && job.provider === provider && job.kind === 'prompt'
    && job.status === 'succeeded' && Boolean(job.result?.text?.trim()) && Boolean(job.result?.actualModels?.length));
  const verified = Boolean(subscriptionReady && runtime?.lastSuccessAt && successfulTask);
  const state = !runtime ? 'unpaired' : runtime.status === 'waiting' && Date.parse(runtime.expiresAt || '') > now ? 'waiting'
    : !online ? 'offline' : verified ? 'verified' : subscriptionReady ? 'ready' : 'online';
  const badge = { unpaired: 'Not paired', waiting: 'Waiting for companion', offline: 'Companion offline', online: 'Companion online', ready: 'Ready to try', verified: 'Connected · task verified' }[state];
  const providerStatus = !client?.available ? 'This native AI client is not available on the selected computer.'
    : !client.authenticated ? 'Native provider sign-in is needed.'
      : client.authMode !== 'subscription' ? 'API or unrecognized access detected. Use native subscription sign-in for this pilot; separately billed API use stays in advanced manual setup.'
        : 'Native subscription sign-in is confirmed. A successful task verifies the connection.';
  return { state, badge, online, client, subscriptionReady, verified, providerStatus, successfulTask };
}

export function mountAiRuntime(root: HTMLElement, options: { pollMs?: number } = {}): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  let requests = new win.AbortController();
  let lastAuthOwner: string | null = null;
  let epoch = 0;
  let readVersion = 0;
  let busy = false;
  let acceptedSession = false;
  let loading = true;
  let authMissing = false;
  let available = false;
  let snapshot: Snapshot | null = null;
  let selectedId = '';
  let provider: NativeProvider = 'codex';
  let pairing: Pairing | null = null;
  let pending: RuntimeJobSummary | null = null;
  let submission: { requestId: string; fingerprint: string; kind: 'login' | 'prompt'; retryable: boolean } | null = null;
  const cancelled = new Map<string, RuntimeJobSummary>();
  const confirmedCancellations = new Set<string>();
  let hiddenRuntime = '';
  let notice = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const text = (selector: string, value: string) => { q(selector).textContent = value; };
  const live = (version = epoch) => !lifetime.signal.aborted && root.isConnected && version === epoch;
  const form = q<HTMLFormElement>('[data-runtime-task-form]');
  const prompt = q<HTMLTextAreaElement>('[data-runtime-prompt]');
  const note = q<HTMLTextAreaElement>('[data-runtime-note]');
  const context = q<HTMLSelectElement>('[data-runtime-context]');
  const gentle = q<HTMLInputElement>('[data-runtime-gentle]');
  const model = q<HTMLSelectElement>('[data-runtime-model]');
  const computer = q<HTMLSelectElement>('[data-runtime-select]');
  const providerSelect = q<HTMLSelectElement>('[data-runtime-provider]');
  const completePrompt = () => buildRuntimePrompt(prompt.value, context.value, note.value);
  const jobBody = (kind: 'login' | 'prompt'): Record<string, unknown> => ({ operation: 'job', kind, runtimeId: selectedId, provider,
    ...(kind === 'prompt' ? { ...(model.value ? { model: model.value } : {}), prompt: completePrompt(), gentle: gentle.checked } : {}) });
  const isRetry = (kind: 'login' | 'prompt') => Boolean(submission?.retryable && submission.kind === kind && submission.fingerprint === JSON.stringify(jobBody(kind)));
  const current = () => snapshot?.runtimes.find((item) => item.id === selectedId && item.id !== hiddenRuntime) ?? null;
  const jobs = () => {
    const observed = (snapshot?.jobs ?? []).map((job) => cancelled.get(job.id) ?? job);
    const missing = [...cancelled.values()].filter((job) => !observed.some((item) => item.id === job.id));
    return [...missing, ...observed].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  };
  const activeJob = () => jobs().find((job) => job.runtimeId === selectedId && ['queued', 'running'].includes(job.status))
    ?? (pending?.runtimeId === selectedId && !cancelled.has(pending.id) ? pending : null);

  async function request(method = 'GET', body?: Record<string, unknown>) {
    let response: Response;
    try {
      response = await fetch(ENDPOINT, { method, credentials: 'include', cache: 'no-store', signal: requests.signal,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    } catch (error) {
      if (requests.signal.aborted || lifetime.signal.aborted) throw error;
      throw new AiRuntimeRequestError(0, 'network-error');
    }
    return readRuntimeResponse(response);
  }

  function clearSensitive() {
    pairing = null; pending = null; submission = null; snapshot = null; selectedId = ''; provider = 'codex'; cancelled.clear(); confirmedCancellations.clear(); hiddenRuntime = '';
    form.reset(); q<HTMLFormElement>('[data-runtime-pair-form]').reset(); model.replaceChildren(); computer.replaceChildren(); providerSelect.value = 'codex';
    q<HTMLTextAreaElement>('[data-runtime-command]').value = '';
    q<HTMLTextAreaElement>('[data-runtime-code]').value = '';
    q('[data-runtime-result-text]').replaceChildren();
    q('[data-runtime-login-link]').removeAttribute('href');
    text('[data-runtime-login-code]', '');
  }

  function invalidateSession(message: string) {
    ++epoch; ++readVersion; requests.abort(); requests = new win.AbortController(); clearTimeout(timer);
    lastAuthOwner = null; acceptedSession = false; authMissing = true; available = false; loading = false;
    busy = false; notice = message; clearSensitive(); render();
  }

  function render() {
    if (!live()) return;
    const runtime = current();
    const view = buildRuntimeView(runtime, provider, jobs());
    const active = runtime ? activeJob() : null;
    const selectedJobs = jobs().filter((job) => job.runtimeId === selectedId && job.provider === provider);
    const latest = active ?? selectedJobs[0] ?? null;
    const cancellationPending = Boolean(latest && cancelled.has(latest.id) && !confirmedCancellations.has(latest.id));
    const cancellationText = cancellationPending ? 'Cancellation requested. Waiting for confirmation from PointCast.' : latest?.kind === 'login' ? 'Sign-in request cancelled.' : 'Task cancelled.';
    const blocked = busy || !available;
    root.dataset.state = !available ? loading ? 'checking' : authMissing ? 'signed-out' : 'unavailable' : view.state;
    root.setAttribute('aria-busy', String(busy || loading));
    text('[data-runtime-badge]', !available ? loading ? 'Checking…' : authMissing ? 'Sign-in required' : 'Status unavailable' : view.badge);
    text('[data-runtime-status]', notice || (latest?.status === 'cancelled' ? cancellationText : !runtime ? 'Pair your computer to begin. Pairing does not sign in to an AI provider.'
      : view.state === 'waiting' ? pairing ? 'Run the pairing command on your computer. This invitation expires after ten minutes.' : 'Pairing is waiting. If you no longer have its one-use code, cancel this pairing and create another.'
        : active ? `${active.kind === 'login' ? 'Native sign-in' : 'Your task'} is ${active.status}. Waiting for your companion.`
        : !view.online ? 'Open the companion on your computer to continue.'
          : view.verified ? 'A real task completed on the reported model. Your companion is online.'
            : view.subscriptionReady ? 'Your subscription sign-in is ready. Try a task to verify this connection.' : 'Your companion is online. Complete native subscription sign-in next.'));
    q<HTMLButtonElement>('[data-runtime-invite]').disabled = blocked;
    const runtimes = snapshot?.runtimes ?? [];
    const optionsKey = runtimes.map((item) => `${item.id}:${item.label}:${item.status}`).join('|');
    if (computer.dataset.options !== optionsKey) {
      computer.replaceChildren(...runtimes.map((item) => { const option = doc.createElement('option'); option.value = item.id; option.textContent = `${item.label} · ${item.status}`; return option; }));
      computer.dataset.options = optionsKey;
    }
    computer.value = selectedId; computer.disabled = blocked;
    providerSelect.value = provider; providerSelect.disabled = blocked || !runtime || Boolean(active);
    q('[data-runtime-connection]').hidden = !runtime;
    const pairValid = pairing && pairing.runtimeId === selectedId && runtime?.status === 'waiting' && Date.parse(pairing.expiresAt) > Date.now();
    q('[data-runtime-pair-code]').hidden = !pairValid;
    q<HTMLTextAreaElement>('[data-runtime-command]').value = pairValid ? `node scripts/ai-companion/runner.mjs --pair-stdin --origin ${win.location.origin}` : '';
    q<HTMLTextAreaElement>('[data-runtime-code]').value = pairValid ? pairing!.code : '';
    text('[data-runtime-pair-expiry]', pairValid ? `One use. Expires at ${new Date(pairing!.expiresAt).toLocaleTimeString()}.` : '');
    if (pairing && (!runtime || runtime.status !== 'waiting' || Date.parse(pairing.expiresAt) <= Date.now())) pairing = null;
    text('[data-runtime-presence]', runtime ? `${runtime.label} · ${view.online ? 'companion online' : view.state === 'waiting' ? 'pairing pending' : 'offline'}${runtime.lastSeenAt ? ` · last seen ${new Date(runtime.lastSeenAt).toLocaleTimeString()}` : ''}` : '');
    text('[data-runtime-provider-status]', `${PROVIDER_NAMES[provider]}: ${view.providerStatus}`);
    const loginButton = q<HTMLButtonElement>('[data-runtime-login]');
    loginButton.textContent = isRetry('login') ? 'Retry same sign-in request' : provider === 'codex' ? 'Sign in with ChatGPT' : 'Sign in with Claude';
    loginButton.disabled = blocked || !view.online || !view.client?.available || Boolean(active);
    loginButton.hidden = view.subscriptionReady;
    q<HTMLButtonElement>('[data-runtime-refresh]').disabled = busy;
    q<HTMLButtonElement>('[data-runtime-disconnect]').disabled = blocked;
    q<HTMLButtonElement>('[data-runtime-disconnect]').textContent = runtime?.status === 'waiting' ? 'Cancel pairing' : 'Disconnect computer';
    const modelList = view.client?.models ?? [];
    const modelKey = `${selectedId}:${provider}:${modelList.map((item) => `${item.id}:${item.label}`).join('|')}`;
    if (model.dataset.options !== modelKey) {
      const previous = model.value;
      const defaultOption = doc.createElement('option'); defaultOption.value = ''; defaultOption.textContent = 'Use the native client default';
      model.replaceChildren(defaultOption, ...modelList.map((item) => { const option = doc.createElement('option'); option.value = item.id; option.textContent = item.label; return option; }));
      model.value = modelList.some((item) => item.id === previous) ? previous : '';
      model.dataset.options = modelKey;
    }
    model.disabled = blocked || !view.subscriptionReady || Boolean(active);
    text('[data-runtime-model-source]', view.client?.modelDiscovery === 'native' ? 'Model choices reported by the native client.'
      : view.client?.modelDiscovery === 'configured' ? 'These model choices are configured on your companion; they are not a provider discovery result.' : 'Model discovery is unavailable. The native client default can be tested after subscription sign-in.');
    const body = completePrompt();
    text('[data-runtime-preview]', body || 'Your task preview will appear here.');
    text('[data-runtime-count]', `${body.length.toLocaleString()} / 4,000 characters${body.length > 4000 ? ' · shorten the task or note' : ''}`);
    q('[data-runtime-gentle-preview]').hidden = !gentle.checked;
    text('[data-runtime-run]', isRetry('prompt') ? 'Retry same task' : 'Try this task with my AI');
    q<HTMLButtonElement>('[data-runtime-run]').disabled = blocked || !view.subscriptionReady || Boolean(active) || !prompt.value.trim() || body.length > 4000;
    q('[data-runtime-job]').hidden = !latest;
    text('[data-runtime-job-status]', latest ? latest.status === 'queued' ? `${latest.kind === 'login' ? 'Sign-in' : 'Task'} queued. Waiting for your companion.`
      : latest.status === 'running' ? latest.kind === 'login' ? 'Native sign-in is in progress.' : 'Your AI is working on this task.'
        : latest.status === 'failed' ? runtimeErrorMessage(latest.error || '')
          : latest.status === 'cancelled' ? cancellationText : latest.kind === 'login' ? 'Sign-in request finished. Provider status above determines whether you are signed in.' : 'Task completed.' : '');
    const cancel = q<HTMLButtonElement>('[data-runtime-cancel]'); cancel.hidden = !active; cancel.disabled = busy;
    const login = active?.kind === 'login' && active.status === 'running' && available && Date.parse(active.expiresAt) > Date.now() ? active.login : null;
    const loginUrl = login ? nativeLoginUrl(login.verificationUrl, active!.provider) : null;
    const link = q<HTMLAnchorElement>('[data-runtime-login-link]');
    q('[data-runtime-login-panel]').hidden = !loginUrl;
    link.hidden = !loginUrl;
    if (loginUrl) link.href = loginUrl; else link.removeAttribute('href');
    link.textContent = `Open ${active?.provider === 'claude' ? 'Claude' : 'ChatGPT'} sign-in ↗`;
    const userCode = loginUrl && /^[A-Za-z0-9-]{4,32}$/.test(login?.userCode || '') ? login!.userCode : '';
    text('[data-runtime-login-code]', userCode ? `Enter this code on the provider page: ${userCode}` : '');
    q('[data-runtime-login-code]').hidden = !userCode;
    text('[data-runtime-login-expiry]', loginUrl ? `Finish before ${new Date(active!.expiresAt).toLocaleTimeString()}.` : '');
    const result = runtime ? selectedJobs.find((job) => job.kind === 'prompt' && job.status === 'succeeded' && job.result?.text && job.result.actualModels?.length) : null;
    q('[data-runtime-result]').hidden = !result || Boolean(hiddenRuntime);
    text('[data-runtime-result-title]', result && latest?.id !== result.id ? 'Previous AI response' : 'Your AI’s response');
    text('[data-runtime-result-text]', result?.result?.text || '');
    text('[data-runtime-result-model]', result ? `${PROVIDER_NAMES[result.provider]} · actual model: ${result.result!.actualModels!.join(', ')}${result.model ? ` · requested: ${result.model}` : ' · native default requested'}` : '');
  }

  function schedule() {
    clearTimeout(timer);
    if (live() && acceptedSession && doc.visibilityState === 'visible') timer = setTimeout(() => void load(), options.pollMs ?? 3000);
  }

  async function load() {
    if (!live()) return;
    const version = epoch; const read = ++readVersion;
    try {
      const data = await request();
      if (!live(version) || read !== readVersion) return;
      if (!Array.isArray(data.runtimes) || !Array.isArray(data.jobs)) throw new AiRuntimeRequestError(200, 'invalid-response');
      if (!available || JSON.stringify(snapshot?.jobs.map((job) => [job.id, job.status])) !== JSON.stringify(data.jobs.map((job: RuntimeJobSummary) => [job.id, job.status]))) notice = '';
      acceptedSession = true; authMissing = false; available = true; snapshot = { runtimes: data.runtimes, jobs: data.jobs };
      if (!snapshot.runtimes.some((item) => item.id === selectedId)) selectedId = snapshot.runtimes[0]?.id ?? '';
      for (const job of snapshot.jobs) if (job.status === 'cancelled') confirmedCancellations.add(job.id);
      if (pending && snapshot.jobs.some((job) => job.id === pending!.id)) pending = null;
      if (submission && snapshot.jobs.some((job) => job.requestId === submission!.requestId)) {
        submission = null; notice = 'Your previous request was received. Its status is shown below.';
      }
      const runtime = current();
      if (runtime?.providers.length && !runtime.providers.some((item) => item.provider === provider)) provider = runtime.providers[0].provider;
    } catch (error) {
      if (!live(version) || read !== readVersion) return;
      available = false;
      if (error instanceof AiRuntimeRequestError && error.status === 401) { invalidateSession(error.message); return; }
      if (!acceptedSession) lastAuthOwner = null;
      notice = error instanceof AiRuntimeRequestError ? error.message : runtimeErrorMessage('');
    }
    if (!live(version) || read !== readVersion) return;
    loading = false; render(); schedule();
  }

  async function mutate(body: Record<string, unknown>, method = 'POST') {
    if (busy || !available) return;
    const version = epoch; ++readVersion; clearTimeout(timer); busy = true; notice = '';
    if (body.operation === 'job') {
      const fingerprint = JSON.stringify(body);
      const requestId = submission?.retryable && submission.fingerprint === fingerprint ? submission.requestId : win.crypto.randomUUID();
      submission = { requestId, fingerprint, kind: body.kind as 'login' | 'prompt', retryable: false };
      body = { ...body, requestId };
    }
    if (method === 'DELETE' || body.operation === 'cancel') submission = null;
    if (method === 'DELETE') hiddenRuntime = String(body.runtimeId);
    if (body.operation === 'cancel') {
      const id = String(body.jobId); const job = activeJob();
      if (job?.id === id) cancelled.set(id, { ...job, status: 'cancelled', login: undefined, result: undefined });
      if (pending?.id === id) pending = null;
    }
    render();
    try {
      const data = await request(method, body);
      if (!live(version)) return;
      if (body.operation === 'invite') {
        if (typeof data.runtimeId !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(data.code) || !Number.isFinite(Date.parse(data.expiresAt))) throw new AiRuntimeRequestError(201, 'invalid-response');
        pairing = { runtimeId: data.runtimeId, code: data.code, expiresAt: data.expiresAt }; selectedId = data.runtimeId;
        q<HTMLDetailsElement>('[data-runtime-pair-details]').open = true;
        text('[data-runtime-copy]', 'Copy command');
        text('[data-runtime-copy-code]', 'Copy private code');
        notice = 'Pairing code created. Run the command, then paste the private code into the waiting terminal.';
      } else if (body.operation === 'job') {
        if (typeof data.jobId !== 'string' || !data.jobId) throw new AiRuntimeRequestError(201, 'invalid-response');
        submission = null;
        pending = { id: data.jobId, requestId: String(body.requestId), runtimeId: String(body.runtimeId), provider: body.provider as NativeProvider, kind: body.kind as 'login' | 'prompt', status: 'queued', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 600_000).toISOString() };
        notice = body.kind === 'login' ? 'Sign-in requested. Waiting for the native provider flow.' : 'Task submitted. Waiting for a real result from your AI.';
      } else if (body.operation === 'cancel') notice = 'Cancellation requested. The previous request will not be retried automatically.';
      else if (method === 'DELETE') {
        snapshot = { runtimes: (snapshot?.runtimes ?? []).filter((item) => item.id !== body.runtimeId), jobs: (snapshot?.jobs ?? []).filter((job) => job.runtimeId !== body.runtimeId) };
        pairing = null; pending = null; selectedId = ''; notice = 'Computer disconnected. Pair it again to start new tasks.';
      }
      hiddenRuntime = ''; await load();
    } catch (error) {
      if (!live(version)) return;
      hiddenRuntime = '';
      if (body.operation === 'job' && submission?.requestId === body.requestId) submission.retryable = true;
      if (body.operation === 'cancel') {
        const id = String(body.jobId); const previous = cancelled.get(id);
        cancelled.delete(id);
        if (previous && !snapshot?.jobs.some((job) => job.id === id)) pending = { ...previous, status: 'queued' };
      }
      if (error instanceof AiRuntimeRequestError && error.status === 401) { invalidateSession(error.message); return; }
      notice = error instanceof AiRuntimeRequestError ? error.message : runtimeErrorMessage('');
    } finally {
      if (live(version)) { busy = false; render(); schedule(); }
    }
  }

  q<HTMLFormElement>('[data-runtime-pair-form]').addEventListener('submit', (event) => {
    event.preventDefault(); const field = (event.currentTarget as HTMLFormElement).elements.namedItem('label') as HTMLInputElement;
    if (field.value.trim()) void mutate({ operation: 'invite', label: field.value.trim() });
  }, { signal: lifetime.signal });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (q<HTMLButtonElement>('[data-runtime-run]').disabled) return;
    void mutate(jobBody('prompt'));
  }, { signal: lifetime.signal });
  function inputsChanged() {
    if (submission && submission.fingerprint !== JSON.stringify(jobBody(submission.kind))) submission = null;
    render();
  }
  form.addEventListener('input', inputsChanged, { signal: lifetime.signal });
  form.addEventListener('change', inputsChanged, { signal: lifetime.signal });
  computer.addEventListener('change', () => { selectedId = computer.value; notice = ''; inputsChanged(); }, { signal: lifetime.signal });
  providerSelect.addEventListener('change', () => { provider = providerSelect.value as NativeProvider; notice = ''; inputsChanged(); }, { signal: lifetime.signal });
  q('[data-runtime-login]').addEventListener('click', () => void mutate(jobBody('login')), { signal: lifetime.signal });
  q('[data-runtime-refresh]').addEventListener('click', () => { notice = ''; void load(); }, { signal: lifetime.signal });
  q('[data-runtime-disconnect]').addEventListener('click', () => void mutate({ runtimeId: selectedId }, 'DELETE'), { signal: lifetime.signal });
  q('[data-runtime-cancel]').addEventListener('click', () => { const job = activeJob(); if (job) void mutate({ operation: 'cancel', jobId: job.id }); }, { signal: lifetime.signal });
  async function copyPairingValue(fieldSelector: string, buttonSelector: string, fallback: string) {
    const version = epoch; const field = q<HTMLTextAreaElement>(fieldSelector); const value = field.value;
    if (!value || !pairing || Date.parse(pairing.expiresAt) <= Date.now()) return;
    try { await win.navigator.clipboard.writeText(value); if (live(version) && field.value === value) text(buttonSelector, 'Copied'); }
    catch { if (!live(version) || field.value !== value) return; field.focus(); field.select(); text(buttonSelector, fallback); }
  }
  q('[data-runtime-copy]').addEventListener('click', () => void copyPairingValue('[data-runtime-command]', '[data-runtime-copy]', 'Select and copy command'), { signal: lifetime.signal });
  q('[data-runtime-copy-code]').addEventListener('click', () => void copyPairingValue('[data-runtime-code]', '[data-runtime-copy-code]', 'Select and copy private code'), { signal: lifetime.signal });
  // The wallet bridge also reports unchanged sessions during cross-tab storage sync.
  // Only duplicate bridge reports are inert; explicit auth actions always invalidate.
  function authChanged(event: Event) {
    const detail = (event as CustomEvent<{ user?: Partial<Pick<PointCastUser, 'userId'>> | null; source?: string }>).detail;
    const owner = typeof detail?.user?.userId === 'string' && detail.user.userId ? detail.user.userId : null;
    if (event.type === 'pc:auth-change' && detail?.source === 'tezos-session-bridge' && owner && owner === lastAuthOwner) return;
    lastAuthOwner = owner;
    ++epoch; ++readVersion; requests.abort(); requests = new win.AbortController(); clearTimeout(timer);
    busy = false; available = false; acceptedSession = false; loading = true; authMissing = false; notice = ''; clearSensitive(); render();
    if (event.type === 'pc:auth-change' && detail && detail.user === null) {
      loading = false; authMissing = true; notice = 'Sign in to PointCast to manage your AI.'; render(); return;
    }
    void load();
  }
  win.addEventListener('pc:auth-change', authChanged, { signal: lifetime.signal });
  win.addEventListener('pc:auth-refresh', authChanged, { signal: lifetime.signal });
  doc.addEventListener('visibilitychange', () => { clearTimeout(timer); if (doc.visibilityState === 'visible' && acceptedSession) void load(); }, { signal: lifetime.signal });
  render(); void load();
  return () => { ++epoch; ++readVersion; clearTimeout(timer); requests.abort(); clearSensitive(); lifetime.abort(); };
}
