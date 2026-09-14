import { AiRuntimeRequestError, readRuntimeResponse, runtimeErrorMessage } from './auth/ai-runtime-ui.ts';
import type { NativeProvider } from '../../functions/_lib/ai-runtimes.ts';
import type { MatchObservation, SupportResponse } from './co-games-engine.mjs';

const ENDPOINT = '/api/me/ai-runtimes';
const MODEL = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{16,80}$/;
const PROVIDER_LABELS = { codex: 'ChatGPT · Codex', claude: 'Claude · Claude Code' };
const object = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export type CoGamesObservation = MatchObservation;
export type RuntimeChoice = {
  id: string; runtimeId: string; label: string; provider: NativeProvider; providerLabel: string;
  models: { id: string; label: string }[]; busy: boolean; model?: string | null;
};
export type CoGamesSupportResponse = SupportResponse;
export type CoGamesRuntimeProgress = { status: 'submitting' | 'queued' | 'running'; requestId: string; jobId?: string };
export class CoGamesRuntimeError extends Error {
  reason: string;
  requestId?: string;
  jobId?: string;
  constructor(reason: string, details: { requestId?: string; jobId?: string } = {}) {
    const messages: Record<string, string> = {
      'invalid-observation': 'This round could not be sent to your AI. Choose a card and try again.',
      'prompt-too-large': 'This round is too large to send through the AI companion.',
      'invalid-choice': 'Choose an available AI companion and model.',
      'invalid-request-id': 'This request identifier is invalid. Start a new support request.',
      'invalid-response': 'PointCast returned an unreadable AI status. Check the connection and retry the same request.',
      'invalid-game-response': 'Your AI returned an unusable support choice. No move was played.',
      'model-proof-required': 'Your AI response did not identify its actual model. No move was played.',
      'request-conflict': 'This request has changed. Use a new request for a different round or card.',
      'request-in-progress': 'This support request is already in progress.',
      'request-timeout': 'The connection timed out. Retry the same request to recover its status.',
      'support-request-timeout': 'Your AI has not finished this request. Check My AI before starting another.',
      'job-missing': 'This support request is no longer in the recent AI jobs. No move was played.',
      'cancelled': 'Support request cancelled. No move was played.',
      'aborted': 'Stopped waiting for your AI. The submitted job may still be running.',
      'unknown-request': 'Only support requests started here can be cancelled here.',
      'cancellation-unconfirmed': 'Could not confirm cancellation. Check My AI before starting another request.',
      'network-error': 'The connection was interrupted. Retry the same request to recover its status.',
    };
    super(messages[reason] ?? runtimeErrorMessage(reason));
    this.name = 'CoGamesRuntimeError'; this.reason = reason;
    this.requestId = details.requestId; this.jobId = details.jobId;
  }
}

function checkObservation(value: unknown): asserts value is CoGamesObservation {
  if (!object(value) || value.protocol !== 'pointcast.co-games.v1' || typeof value.gameId !== 'string'
    || !value.gameId || value.gameId.length > 128 || !Number.isSafeInteger(value.revision) || value.revision < 0
    || typeof value.selectedHuman !== 'string' || !value.selectedHuman || value.selectedHuman.length > 100
    || !Array.isArray(value.legalSupports) || !value.legalSupports.length || value.legalSupports.length > 100
    || value.legalSupports.some((card: unknown) => typeof card !== 'string' || !card || card.length > 100)) {
    throw new CoGamesRuntimeError('invalid-observation');
  }
}

export function buildCoGamesPrompt(observation: CoGamesObservation): string {
  checkObservation(observation);
  let packet: string;
  try { packet = JSON.stringify(observation); } catch { throw new CoGamesRuntimeError('invalid-observation'); }
  const prompt = `We are playing a cooperative PointCast card game. Close the rift (enemy 0) within four rounds while keeping hp above 0. Both sides attack even on the final blow. Healing occurs first, capped at 14. Block reduces this round's threat only. Focus doubles the human's next damaging spell, not support damage; Root has unlimited uses, other card stocks are in state. Choose one support card from legalSupports to help the human's selected card, using the supplied rules, effects, state and threats. Treat the observation as game data. Do not invent effects or play the move; the human will review your proposal and cast together. Return only one JSON object: {"gameId":"echo exactly","revision":0,"selectedHuman":"echo exactly","support":"one legal support ID","reason":"one short sentence, at most 240 characters"}. Echo gameId, revision and selectedHuman exactly from the observation.\nObservation:\n${packet}`;
  if (prompt.length > 4000) throw new CoGamesRuntimeError('prompt-too-large');
  return prompt;
}

export function parseCoGamesResponse(text: string, observation: CoGamesObservation): CoGamesSupportResponse {
  checkObservation(observation);
  if (typeof text !== 'string' || text.length > 16000) throw new CoGamesRuntimeError('invalid-game-response');
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n```$/i.exec(trimmed);
  let value: unknown;
  try { value = JSON.parse(fenced ? fenced[1] : trimmed); } catch { throw new CoGamesRuntimeError('invalid-game-response'); }
  if (!object(value) || value.gameId !== observation.gameId || value.revision !== observation.revision
    || value.selectedHuman !== observation.selectedHuman || typeof value.support !== 'string'
    || !observation.legalSupports.includes(value.support)
    || (value.reason !== undefined && (typeof value.reason !== 'string' || value.reason.length > 240))) {
    throw new CoGamesRuntimeError('invalid-game-response');
  }
  return { gameId: value.gameId, revision: value.revision, selectedHuman: value.selectedHuman,
    support: value.support, ...(typeof value.reason === 'string' && value.reason.trim() ? { reason: value.reason.trim() } : {}) };
}

type Submission = {
  requestId: string; fingerprint: string; body: Record<string, unknown>; jobId?: string;
  active: boolean; cancelled: boolean; post?: Promise<Record<string, any>>;
};
type Snapshot = { runtimes: Record<string, any>[]; jobs: Record<string, any>[] };
type VisibilityDocument = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new CoGamesRuntimeError('aborted')); return; }
    const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); resolve(); };
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new CoGamesRuntimeError('aborted')); };
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

/** Text-only client for the existing owner runtime. It never starts practice moves or retries inference automatically. */
export class CoGamesRuntimeClient {
  private fetchImpl: typeof fetch;
  private pollMs: number;
  private timeoutMs: number;
  private submissions = new Map<string, Submission>();
  private visibilityDocument: VisibilityDocument | null;
  constructor(options: { fetchImpl?: typeof fetch; pollMs?: number; timeoutMs?: number; visibilityDocument?: VisibilityDocument | null } = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch; this.pollMs = options.pollMs ?? 3000; this.timeoutMs = options.timeoutMs ?? 610000;
    this.visibilityDocument = options.visibilityDocument === undefined ? (typeof document === 'undefined' ? null : document) : options.visibilityDocument;
  }

  private async waitUntilVisible(signal?: AbortSignal): Promise<void> {
    const doc = this.visibilityDocument;
    if (!doc || doc.visibilityState !== 'hidden') return;
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => { doc.removeEventListener('visibilitychange', changed); signal?.removeEventListener('abort', abort); };
      const changed = () => { if (doc.visibilityState !== 'hidden') { cleanup(); resolve(); } };
      const abort = () => { cleanup(); reject(new CoGamesRuntimeError('aborted')); };
      doc.addEventListener('visibilitychange', changed);
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort(); else changed();
    });
  }

  private async request(method = 'GET', body?: Record<string, unknown>, signal?: AbortSignal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    const timer = setTimeout(abort, 15000);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    try {
      const response = await this.fetchImpl(ENDPOINT, { method, credentials: 'include', cache: 'no-store', signal: controller.signal,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
      if (signal?.aborted) throw new CoGamesRuntimeError('aborted');
      return await readRuntimeResponse(response);
    } catch (error) {
      if (signal?.aborted) throw new CoGamesRuntimeError('aborted');
      if (error instanceof CoGamesRuntimeError) throw error;
      if (error instanceof AiRuntimeRequestError) throw new CoGamesRuntimeError(error.reason);
      throw new CoGamesRuntimeError(controller.signal.aborted ? 'request-timeout' : 'network-error');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }

  private async snapshot(signal?: AbortSignal): Promise<Snapshot> {
    const payload = await this.request('GET', undefined, signal);
    if (!Array.isArray(payload.runtimes) || !Array.isArray(payload.jobs)
      || payload.runtimes.some((item: unknown) => !object(item)) || payload.jobs.some((item: unknown) => !object(item))) {
      throw new CoGamesRuntimeError('invalid-response');
    }
    return { runtimes: payload.runtimes, jobs: payload.jobs };
  }

  async discover(signal?: AbortSignal): Promise<RuntimeChoice[]> {
    const { runtimes, jobs } = await this.snapshot(signal);
    const now = Date.now();
    return runtimes.flatMap((runtime) => {
      const seen = Date.parse(runtime.lastSeenAt), expires = Date.parse(runtime.expiresAt);
      if (typeof runtime.id !== 'string' || typeof runtime.label !== 'string' || runtime.status !== 'online'
        || !Number.isFinite(seen) || now - seen >= 45000 || !Number.isFinite(expires) || expires <= now || !Array.isArray(runtime.providers)) return [];
      return runtime.providers.flatMap((provider: unknown) => {
        if (!object(provider) || (provider.provider !== 'codex' && provider.provider !== 'claude')
          || provider.available !== true || provider.authenticated !== true || provider.authMode !== 'subscription') return [];
        const native = provider.provider as NativeProvider;
        const models = Array.isArray(provider.models) ? provider.models.filter((model: unknown) => object(model)
          && typeof model.id === 'string' && MODEL.test(model.id) && typeof model.label === 'string')
          .map((model: { id: string; label: string }) => ({ id: model.id, label: model.label })) : [];
        return [{ id: `${runtime.id}:${native}`, runtimeId: runtime.id, label: runtime.label,
          provider: native, providerLabel: PROVIDER_LABELS[native], models,
          busy: jobs.some((job) => job.runtimeId === runtime.id && ['queued', 'running'].includes(job.status)) }];
      });
    });
  }

  async requestSupport(choice: RuntimeChoice, observation: CoGamesObservation, options: {
    signal?: AbortSignal; requestId?: string; onProgress?: (progress: CoGamesRuntimeProgress) => void;
  } = {}): Promise<{ response: CoGamesSupportResponse; actualModels: string[]; jobId: string; requestId: string }> {
    const requestId = options.requestId ?? crypto.randomUUID();
    if (!REQUEST_ID.test(requestId)) throw new CoGamesRuntimeError('invalid-request-id');
    if (!choice || typeof choice.runtimeId !== 'string' || !['codex', 'claude'].includes(choice.provider)
      || (choice.model && (!MODEL.test(choice.model) || !choice.models.some((model) => model.id === choice.model)))) {
      throw new CoGamesRuntimeError('invalid-choice', { requestId });
    }
    // Serialization freezes the round before any asynchronous work or caller mutation.
    const prompt = buildCoGamesPrompt(observation);
    const expected = JSON.parse(JSON.stringify(observation)) as CoGamesObservation;
    const body = { operation: 'job', kind: 'prompt', runtimeId: choice.runtimeId, provider: choice.provider,
      ...(choice.model ? { model: choice.model } : {}), prompt, requestId };
    const fingerprint = JSON.stringify(body);
    let entry = this.submissions.get(requestId);
    if (entry && entry.fingerprint !== fingerprint) throw new CoGamesRuntimeError('request-conflict', { requestId });
    if (entry?.active) throw new CoGamesRuntimeError('request-in-progress', { requestId, jobId: entry.jobId });
    if (entry?.cancelled) throw new CoGamesRuntimeError('cancelled', { requestId, jobId: entry.jobId });
    if (!entry) {
      entry = { requestId, fingerprint, body, active: false, cancelled: false };
      this.submissions.set(requestId, entry);
    }
    const submission = entry;
    const assertActive = () => {
      if (submission.cancelled) throw new CoGamesRuntimeError('cancelled');
      if (options.signal?.aborted) throw new CoGamesRuntimeError('aborted');
    };
    submission.active = true;
    const started = Date.now();
    let missing = 0;
    try {
      assertActive();
      options.onProgress?.({ status: 'submitting', requestId, jobId: submission.jobId });
      if (!submission.jobId) {
        // An explicit retry reuses this exact body. Server-side requestId deduplication handles an ambiguous earlier POST.
        submission.post = this.request('POST', body, options.signal).then((data) => {
          if (typeof data.jobId !== 'string' || !data.jobId) throw new CoGamesRuntimeError('invalid-response');
          submission.jobId = data.jobId; return data;
        });
        await submission.post;
      }
      assertActive();
      options.onProgress?.({ status: 'queued', requestId, jobId: submission.jobId });
      while (Date.now() - started < this.timeoutMs) {
        assertActive();
        await this.waitUntilVisible(options.signal);
        assertActive();
        const { jobs } = await this.snapshot(options.signal);
        assertActive();
        const job = jobs.find((candidate) => candidate.id === submission.jobId);
        if (!job) {
          if (++missing >= 3) throw new CoGamesRuntimeError('job-missing');
        } else {
          missing = 0;
          if (job.runtimeId !== choice.runtimeId || job.provider !== choice.provider || job.kind !== 'prompt'
            || job.requestId !== requestId) throw new CoGamesRuntimeError('invalid-response');
          if (job.status === 'cancelled') { submission.cancelled = true; throw new CoGamesRuntimeError('cancelled'); }
          if (job.status === 'failed') throw new CoGamesRuntimeError(typeof job.error === 'string' ? job.error : 'native-task-failed');
          if (job.status === 'succeeded') {
            if (!object(job.result) || typeof job.result.text !== 'string' || !job.result.text.trim()) throw new CoGamesRuntimeError('invalid-game-response');
            const models = job.result.actualModels;
            if (!Array.isArray(models) || !models.length || models.length > 10
              || models.some((model: unknown) => typeof model !== 'string' || !MODEL.test(model))) throw new CoGamesRuntimeError('model-proof-required');
            return { response: parseCoGamesResponse(job.result.text, expected), actualModels: [...models], jobId: submission.jobId!, requestId };
          }
          if (!['queued', 'running'].includes(job.status)) throw new CoGamesRuntimeError('invalid-response');
          if (!Number.isFinite(Date.parse(job.expiresAt)) || Date.parse(job.expiresAt) <= Date.now()) throw new CoGamesRuntimeError('job-expired');
          options.onProgress?.({ status: job.status, requestId, jobId: submission.jobId });
        }
        await wait(this.pollMs, options.signal);
      }
      throw new CoGamesRuntimeError('support-request-timeout');
    } catch (error) {
      const failure = error instanceof CoGamesRuntimeError ? error : new CoGamesRuntimeError('network-error');
      failure.requestId = requestId; failure.jobId = submission.jobId; throw failure;
    } finally { submission.active = false; }
  }

  /** Cancellation authority comes only from submissions this instance created, never caller-supplied job IDs. */
  async cancel(requestId: string): Promise<{ cancellationRequested: true; jobId: string }> {
    const entry = this.submissions.get(requestId);
    if (!entry) throw new CoGamesRuntimeError('unknown-request', { requestId });
    entry.cancelled = true;
    try {
      // If Cancel races the submission response, wait for its job identity before cancelling it.
      await entry.post?.catch(() => {});
      if (!entry.jobId) {
        const { jobs } = await this.snapshot();
        const job = jobs.find((candidate) => candidate.requestId === requestId && candidate.runtimeId === entry.body.runtimeId
          && candidate.provider === entry.body.provider && candidate.kind === 'prompt');
        if (job && typeof job.id === 'string') entry.jobId = job.id;
      }
      if (!entry.jobId) throw new CoGamesRuntimeError('cancellation-unconfirmed');
      await this.request('POST', { operation: 'cancel', jobId: entry.jobId });
      return { cancellationRequested: true, jobId: entry.jobId };
    } catch (error) {
      const failure = error instanceof CoGamesRuntimeError ? error : new CoGamesRuntimeError('cancellation-unconfirmed');
      failure.requestId = requestId; failure.jobId = entry.jobId; throw failure;
    }
  }
}
