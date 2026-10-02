/** Local demonstration only. No funds, chain operations, balances, or redemption. */
export {
  AgentServiceExampleError,
  approveLocalAgentServiceJob,
  createLocalAgentServiceReceipt,
  createLocalAgentServiceRequest,
  sha256Hex,
} from './agent-service.ts';
export type { LocalAgentServiceApproval, LocalAgentServiceReceipt, LocalAgentServiceRequest } from './agent-service.ts';

export type NoteId = `nm100-${string}`;
export type SandboxStatus = 'requires_notes' | 'succeeded' | 'canceled';
export type NounsMoneyErrorCode = 'invalid_request' | 'invalid_mode' | 'not_found' | 'invalid_state' | 'idempotency_conflict' | 'capacity_exceeded' | 'storage_unavailable' | 'corrupted_state' | 'api_error' | 'invalid_response';
export class NounsMoneyError extends Error {
  readonly code: NounsMoneyErrorCode;
  readonly status?: number;
  readonly reason?: string;
  constructor(code: NounsMoneyErrorCode, message: string, details?: { status?: number; reason?: string }) {
    super(message);
    this.name = 'NounsMoneyError';
    this.code = code;
    this.status = details?.status;
    this.reason = details?.reason;
  }
}
export interface SandboxReceipt {
  id: string;
  intentId: string;
  mode: 'test';
  label: string;
  noteCount: number;
  noteIds: NoteId[];
  issuedAt: string;
}
export interface PaymentIntent {
  schema: 'pointcast.nouns-money.intent/v1';
  id: string;
  mode: 'test';
  label: string;
  noteCount: number;
  status: SandboxStatus;
  noteIds: NoteId[];
  receipt: SandboxReceipt | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateIntentInput { label: string; noteCount: number; mode: 'test' }
export interface ConfirmIntentInput { noteIds: NoteId[]; mode: 'test' }
export interface IdempotencyOptions { idempotencyKey: string }
export interface StoredIntent extends PaymentIntent { createIdempotencyKey: string }
export interface SandboxOperation { operation: 'create' | 'confirm' | 'cancel'; fingerprint: string; result: PaymentIntent }
export interface SandboxState {
  schema: 'pointcast.nouns-money.sandbox-store/v1';
  intents: Record<string, StoredIntent>;
  operations: Record<string, SandboxOperation>;
}
/** change must execute synchronously; implementations commit all changes or none. */
export interface SandboxStore { transact<T>(change: (state: SandboxState) => T): Promise<T> }
export const SANDBOX_LIMITS = Object.freeze({ intents: 250, operations: 1000 });
const INTENT_SCHEMA = 'pointcast.nouns-money.intent/v1';
const STORE_SCHEMA = 'pointcast.nouns-money.sandbox-store/v1';
const NOTE_PATTERN = /^nm100-0[0-9]{2}$/;
const INTENT_PATTERN = /^nmpi_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;
const PUBLIC_KEYS = ['schema', 'id', 'mode', 'label', 'noteCount', 'status', 'noteIds', 'receipt', 'createdAt', 'updatedAt'];
const copy = <T>(value: T): T => structuredClone(value);
function fail(code: NounsMoneyErrorCode, message: string): never { throw new NounsMoneyError(code, message); }
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
function exact(value: unknown, keys: string[], code: NounsMoneyErrorCode = 'invalid_request'): asserts value is Record<string, unknown> {
  if (!object(value) || Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail(code, 'Expected exactly: ' + keys.join(', ') + '.');
}
export function isNoteId(value: unknown): value is NoteId { return typeof value === 'string' && NOTE_PATTERN.test(value); }
function note(value: unknown): NoteId { if (!isNoteId(value)) fail('invalid_request', 'Choose a catalog note ID from nm100-000 through nm100-099.'); return value; }
function key(value: unknown): string { if (typeof value !== 'string' || !KEY_PATTERN.test(value)) fail('invalid_request', 'Idempotency keys need 16–128 ASCII letters, digits, periods, underscores, colons, or hyphens.'); return value; }
function expectedAccountId(value: unknown): string {
  if (typeof value !== 'string' || value.length > 128 || !/^pcu_[A-Za-z0-9_-]+$/.test(value)) fail('invalid_request', 'Pass the exact userId of the displayed PointCast account.');
  return value;
}
function intentId(value: unknown): string { if (typeof value !== 'string' || !INTENT_PATTERN.test(value)) fail('invalid_request', 'Invalid sandbox intent ID.'); return value; }
function label(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 80 || /[\u0000-\u001f\u007f]/.test(value)) fail('invalid_request', 'Label needs 1–80 characters without control characters.');
  return value.trim();
}
function count(value: unknown): number { if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) fail('invalid_request', 'noteCount must be an integer from 1 through 5.'); return value; }
function mode(value: unknown): 'test' { if (value !== 'test') fail('invalid_mode', 'Only mode test is available. Live payments are disabled.'); return 'test'; }
function notes(value: unknown): NoteId[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) fail('invalid_request', 'Choose 1–5 unique catalog note IDs.');
  const ids = value.map(note);
  if (new Set(ids).size !== ids.length) fail('invalid_request', 'Each selected note must be unique.');
  return ids.sort();
}
function options(value: unknown): string { exact(value, ['idempotencyKey']); return key(value.idempotencyKey); }
function createInput(value: unknown): CreateIntentInput { exact(value, ['label', 'noteCount', 'mode']); return { label: label(value.label), noteCount: count(value.noteCount), mode: mode(value.mode) }; }
function confirmInput(value: unknown): ConfirmIntentInput { exact(value, ['noteIds', 'mode']); return { noteIds: notes(value.noteIds), mode: mode(value.mode) }; }
function date(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function publicIntent(value: StoredIntent): PaymentIntent { const { createIdempotencyKey: _key, ...result } = value; return copy(result); }
function emptyState(): SandboxState { return { schema: STORE_SCHEMA, intents: {}, operations: {} }; }
function validateIntent(value: unknown, stored: boolean): asserts value is StoredIntent {
  exact(value, stored ? [...PUBLIC_KEYS, 'createIdempotencyKey'] : PUBLIC_KEYS, 'corrupted_state');
  if (value.schema !== INTENT_SCHEMA || value.mode !== 'test' || typeof value.id !== 'string' || !INTENT_PATTERN.test(value.id) || label(value.label) !== value.label || count(value.noteCount) !== value.noteCount || !['requires_notes', 'succeeded', 'canceled'].includes(value.status as string) || !date(value.createdAt) || !date(value.updatedAt) || value.updatedAt < value.createdAt || !Array.isArray(value.noteIds)) fail('corrupted_state', 'Invalid stored intent.');
  if (stored) key(value.createIdempotencyKey);
  if (value.status !== 'succeeded') {
    if (value.noteIds.length || value.receipt !== null) fail('corrupted_state', 'An unfinished or canceled intent cannot have a receipt or selected notes.');
    return;
  }
  const ids = notes(value.noteIds);
  if (ids.length !== value.noteCount || JSON.stringify(ids) !== JSON.stringify(value.noteIds)) fail('corrupted_state', 'Stored selected notes do not match the intent.');
  exact(value.receipt, ['id', 'intentId', 'mode', 'label', 'noteCount', 'noteIds', 'issuedAt'], 'corrupted_state');
  const receipt = value.receipt;
  if (receipt.id !== 'nmr_' + value.id.slice(5) || receipt.intentId !== value.id || receipt.mode !== 'test' || receipt.label !== value.label || receipt.noteCount !== value.noteCount || JSON.stringify(receipt.noteIds) !== JSON.stringify(ids) || receipt.issuedAt !== value.updatedAt) fail('corrupted_state', 'Invalid stored receipt.');
}
/** Invalid storage is rejected; it is never silently reset or presented as payment success. */
export function validateSandboxState(value: unknown): asserts value is SandboxState {
  try {
    exact(value, ['schema', 'intents', 'operations'], 'corrupted_state');
    if (value.schema !== STORE_SCHEMA || !object(value.intents) || !object(value.operations)) fail('corrupted_state', 'Invalid sandbox store.');
    if (Object.keys(value.intents).length > SANDBOX_LIMITS.intents || Object.keys(value.operations).length > SANDBOX_LIMITS.operations) fail('corrupted_state', 'Sandbox store exceeds its capacity.');
    for (const [id, record] of Object.entries(value.intents)) { validateIntent(record, true); if (id !== record.id) fail('corrupted_state', 'Intent key does not match the record.'); }
    for (const [opKey, operation] of Object.entries(value.operations)) {
      key(opKey);
      exact(operation, ['operation', 'fingerprint', 'result'], 'corrupted_state');
      if (!['create', 'confirm', 'cancel'].includes(operation.operation as string) || typeof operation.fingerprint !== 'string') fail('corrupted_state', 'Invalid stored operation.');
      validateIntent(operation.result, false);
      const current = value.intents[operation.result.id] as StoredIntent | undefined;
      if (!current || current.label !== operation.result.label || current.noteCount !== operation.result.noteCount || current.createdAt !== operation.result.createdAt || operation.result.updatedAt > current.updatedAt) fail('corrupted_state', 'Operation does not match its intent.');
      const payload = JSON.parse(operation.fingerprint);
      let expected: string;
      if (operation.operation === 'create') {
        exact(payload, ['operation', 'label', 'noteCount', 'mode'], 'corrupted_state');
        expected = JSON.stringify({ operation: 'create', ...createInput({ label: payload.label, noteCount: payload.noteCount, mode: payload.mode }) });
        if (current.createIdempotencyKey !== opKey || operation.result.status !== 'requires_notes' || operation.result.updatedAt !== current.createdAt || payload.label !== current.label || payload.noteCount !== current.noteCount) fail('corrupted_state', 'Invalid original creation record.');
      } else if (operation.operation === 'confirm') {
        exact(payload, ['operation', 'id', 'noteIds', 'mode'], 'corrupted_state');
        expected = JSON.stringify({ operation: 'confirm', id: intentId(payload.id), ...confirmInput({ noteIds: payload.noteIds, mode: payload.mode }) });
        if (payload.id !== current.id || operation.result.status !== 'succeeded' || current.status !== 'succeeded' || JSON.stringify(payload.noteIds) !== JSON.stringify(current.noteIds) || JSON.stringify(operation.result.receipt) !== JSON.stringify(current.receipt)) fail('corrupted_state', 'Invalid confirmation record.');
      } else {
        exact(payload, ['operation', 'id'], 'corrupted_state');
        expected = JSON.stringify({ operation: 'cancel', id: intentId(payload.id) });
        if (payload.id !== current.id || operation.result.status !== 'canceled' || current.status !== 'canceled') fail('corrupted_state', 'Invalid cancellation record.');
      }
      if (payload.operation !== operation.operation || expected !== operation.fingerprint) fail('corrupted_state', 'Invalid idempotency fingerprint.');
    }
    for (const record of Object.values(value.intents) as StoredIntent[]) {
      const creation = value.operations[record.createIdempotencyKey] as SandboxOperation | undefined;
      if (!creation || creation.operation !== 'create' || creation.result.id !== record.id) fail('corrupted_state', 'Original create key is missing.');
      if (record.status === 'succeeded' && !Object.values(value.operations).some((op: unknown) => object(op) && op.operation === 'confirm' && object(op.result) && op.result.id === record.id)) fail('corrupted_state', 'Confirmation evidence is missing.');
      if (record.status === 'canceled' && !Object.values(value.operations).some((op: unknown) => object(op) && op.operation === 'cancel' && object(op.result) && op.result.id === record.id)) fail('corrupted_state', 'Cancellation evidence is missing.');
    }
  } catch (error) {
    if (error instanceof NounsMoneyError && error.code === 'corrupted_state') throw error;
    fail('corrupted_state', 'The local sandbox data is invalid. Export or clear the browser sandbox before restarting.');
  }
}
/** In-memory demonstration store. Share one instance for atomic operations within one process. */
export class MemorySandboxStore implements SandboxStore {
  private state: unknown;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(initialState: unknown = emptyState()) { this.state = copy(initialState); }
  transact<T>(change: (state: SandboxState) => T): Promise<T> {
    const result = this.queue.then(() => {
      const next: unknown = copy(this.state);
      validateSandboxState(next);
      const output = change(next);
      validateSandboxState(next);
      const safeOutput = copy(output);
      this.state = copy(next);
      return safeOutput;
    });
    this.queue = result.catch(() => undefined);
    return result;
  }
  /** Portable debugging/test snapshot. Contains local idempotency keys; do not publish it. */
  exportState(): Promise<SandboxState> { return this.transact(state => copy(state)); }
}
/** A single readwrite transaction serializes same-origin tabs using the same database name. */
export class IndexedDbSandboxStore implements SandboxStore {
  private databaseName: string;
  private database?: Promise<IDBDatabase>;
  constructor({ databaseName = 'pointcast-nouns-money-sandbox-v1' }: { databaseName?: string } = {}) { this.databaseName = databaseName; }
  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        if (!globalThis.indexedDB) return reject(new NounsMoneyError('storage_unavailable', 'IndexedDB is unavailable. Sandbox changes were not saved.'));
        let abandoned = false;
        const request = indexedDB.open(this.databaseName, 1);
        request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('state')) request.result.createObjectStore('state'); };
        request.onerror = () => { abandoned = true; reject(new NounsMoneyError('storage_unavailable', 'The browser could not open sandbox storage.')); };
        request.onblocked = () => { abandoned = true; reject(new NounsMoneyError('storage_unavailable', 'Sandbox storage is blocked by another tab. Close it and retry.')); };
        request.onsuccess = () => {
          const db = request.result;
          if (abandoned) { db.close(); return; }
          db.onversionchange = () => { db.close(); this.database = undefined; };
          resolve(db);
        };
      } catch { reject(new NounsMoneyError('storage_unavailable', 'The browser denied sandbox storage.')); }
    }).catch(error => { this.database = undefined; throw error; });
    return this.database;
  }
  async transact<T>(change: (state: SandboxState) => T): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      let failure: unknown;
      let output: T;
      try {
        const transaction = db.transaction('state', 'readwrite');
        transaction.oncomplete = () => resolve(copy(output));
        transaction.onabort = () => reject(failure ?? new NounsMoneyError('storage_unavailable', 'Sandbox changes were not saved. Browser storage may be full or unavailable.'));
        transaction.onerror = () => { failure ??= new NounsMoneyError('storage_unavailable', 'Sandbox changes were not saved.'); };
        const store = transaction.objectStore('state');
        const request = store.get('current');
        request.onsuccess = () => {
          try {
            const state: unknown = request.result === undefined ? emptyState() : request.result;
            validateSandboxState(state);
            output = copy(change(state));
            validateSandboxState(state);
            store.put(state, 'current');
          } catch (error) { failure = error instanceof NounsMoneyError ? error : new NounsMoneyError('storage_unavailable', 'Sandbox changes were not saved.'); transaction.abort(); }
        };
      } catch { reject(new NounsMoneyError('storage_unavailable', 'The browser could not start a sandbox transaction.')); }
    });
  }
  async close(): Promise<void> { if (this.database) (await this.database).close(); this.database = undefined; }
}
export class NounsMoneySandbox {
  private store: SandboxStore;
  constructor(store: SandboxStore = new IndexedDbSandboxStore()) { this.store = store; }
  private mutate(operation: SandboxOperation['operation'], opKey: string, fingerprint: string, change: (state: SandboxState) => PaymentIntent): Promise<PaymentIntent> {
    return this.store.transact(state => {
      const previous = Object.hasOwn(state.operations, opKey) ? state.operations[opKey] : undefined;
      if (previous) {
        if (previous.operation !== operation || previous.fingerprint !== fingerprint) fail('idempotency_conflict', 'This key was already used for a different operation or payload.');
        return copy(previous.result);
      }
      if (Object.keys(state.operations).length >= SANDBOX_LIMITS.operations) fail('capacity_exceeded', 'The local sandbox has reached 1,000 saved operations. Existing keys remain valid.');
      const result = change(state);
      state.operations[opKey] = { operation, fingerprint, result: copy(result) };
      return result;
    });
  }
  async createIntent(input: CreateIntentInput, opts: IdempotencyOptions): Promise<PaymentIntent> {
    const payload = createInput(input);
    const opKey = options(opts);
    return this.mutate('create', opKey, JSON.stringify({ operation: 'create', ...payload }), state => {
      if (Object.keys(state.intents).length >= SANDBOX_LIMITS.intents) fail('capacity_exceeded', 'The local sandbox has reached 250 demo intents. Existing intents and keys remain readable.');
      const id = 'nmpi_' + crypto.randomUUID();
      const now = new Date().toISOString();
      const record: StoredIntent = { schema: INTENT_SCHEMA, id, ...payload, status: 'requires_notes', noteIds: [], receipt: null, createdAt: now, updatedAt: now, createIdempotencyKey: opKey };
      state.intents[id] = record;
      return publicIntent(record);
    });
  }
  async confirmIntent(id: string, input: ConfirmIntentInput, opts: IdempotencyOptions): Promise<PaymentIntent> {
    id = intentId(id);
    const payload = confirmInput(input);
    const opKey = options(opts);
    return this.mutate('confirm', opKey, JSON.stringify({ operation: 'confirm', id, ...payload }), state => {
      const record = state.intents[id];
      if (!record) fail('not_found', 'Sandbox intent was not found on this device.');
      if (payload.noteIds.length !== record.noteCount) fail('invalid_request', 'Choose exactly ' + record.noteCount + ' unique demo notes.');
      if (record.status === 'canceled') fail('invalid_state', 'A canceled sandbox intent cannot be confirmed.');
      if (record.status === 'succeeded') {
        if (JSON.stringify(record.noteIds) !== JSON.stringify(payload.noteIds)) fail('invalid_state', 'This sandbox intent already succeeded with a different selection.');
        return publicIntent(record);
      }
      record.status = 'succeeded';
      record.noteIds = payload.noteIds;
      record.updatedAt = new Date().toISOString();
      record.receipt = { id: 'nmr_' + id.slice(5), intentId: id, ...payload, label: record.label, noteCount: record.noteCount, issuedAt: record.updatedAt };
      return publicIntent(record);
    });
  }
  async cancelIntent(id: string, opts: IdempotencyOptions): Promise<PaymentIntent> {
    id = intentId(id);
    const opKey = options(opts);
    return this.mutate('cancel', opKey, JSON.stringify({ operation: 'cancel', id }), state => {
      const record = state.intents[id];
      if (!record) fail('not_found', 'Sandbox intent was not found on this device.');
      if (record.status === 'succeeded') fail('invalid_state', 'A successful sandbox intent cannot be canceled.');
      if (record.status === 'requires_notes') { record.status = 'canceled'; record.updatedAt = new Date().toISOString(); }
      return publicIntent(record);
    });
  }
  async retrieveIntent(id: string): Promise<PaymentIntent> {
    id = intentId(id);
    return this.store.transact(state => { const result = state.intents[id]; if (!result) fail('not_found', 'Sandbox intent was not found on this device.'); return publicIntent(result); });
  }
  async listIntents(): Promise<PaymentIntent[]> {
    return this.store.transact(state => Object.values(state.intents).map(publicIntent).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)));
  }
}
export interface AccountCollection {
  ok: true;
  schema: 'pointcast.nouns-money.collection/v1';
  userId: string;
  storage: 'account';
  noteIds: NoteId[];
  collectedAt: Record<NoteId, string>;
  updatedAt: string | null;
  changed?: boolean;
}
export interface NounsMoneyCatalogNote { id: NoteId; name: string; nounId: number; image: string; svg: string; [key: string]: unknown }
export interface NounsMoneyCatalog { schema: string; mode: 'collectible-art'; count: 100; notes: NounsMoneyCatalogNote[]; provenance: unknown; [key: string]: unknown }
function collectionResponse(value: unknown): AccountCollection {
  if (!object(value) || value.ok !== true || value.schema !== 'pointcast.nouns-money.collection/v1' || value.storage !== 'account' || typeof value.userId !== 'string' || !value.userId || !Array.isArray(value.noteIds) || value.noteIds.some(id => !isNoteId(id)) || new Set(value.noteIds).size !== value.noteIds.length || !object(value.collectedAt) || Object.keys(value.collectedAt).length !== value.noteIds.length || value.noteIds.some(id => !date((value.collectedAt as Record<string, unknown>)[id])) || (value.updatedAt !== null && !date(value.updatedAt)) || (value.changed !== undefined && typeof value.changed !== 'boolean')) fail('invalid_response', 'The account collection response did not match the implemented contract.');
  return copy(value) as unknown as AccountCollection;
}
/** Only the implemented collection endpoint and public catalog use HTTP. Intents stay local. */
export class NounsMoneyClient {
  private baseUrl: string;
  private fetcher: typeof fetch;
  constructor({ baseUrl = '', fetch: fetcher = globalThis.fetch }: { baseUrl?: string; fetch?: typeof fetch } = {}) { this.baseUrl = baseUrl.replace(/\/$/, ''); this.fetcher = fetcher; }
  private async request(path: string, method = 'GET', body?: { noteId: NoteId }, expectedUserId?: string): Promise<unknown> {
    let response: Response;
    try { response = await this.fetcher(this.baseUrl + path, { method, credentials: 'same-origin', headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(expectedUserId ? { 'X-PointCast-User': expectedUserId } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
    catch { fail('api_error', 'The request did not reach PointCast.'); }
    let data: unknown;
    try { data = await response!.json(); } catch { fail('invalid_response', 'PointCast did not return JSON.'); }
    if (!response!.ok || (object(data) && data.ok === false)) { const reason = object(data) && typeof data.reason === 'string' ? data.reason : undefined; throw new NounsMoneyError('api_error', reason ?? 'PointCast rejected the request.', { status: response!.status, reason }); }
    return data;
  }
  async getCollection(): Promise<AccountCollection> { return collectionResponse(await this.request('/api/me/nouns-money')); }
  private async mutateCollection(noteId: NoteId, expectedUserId: string, method: 'POST' | 'DELETE'): Promise<AccountCollection> {
    const userId = expectedAccountId(expectedUserId);
    const result = collectionResponse(await this.request('/api/me/nouns-money', method, { noteId: note(noteId) }, userId));
    if (result.userId !== userId) fail('invalid_response', 'The collection response did not match the displayed account.');
    return result;
  }
  /** Pass the userId captured with the displayed shelf; do not silently refresh it before mutation. */
  async collectNote(noteId: NoteId, expectedUserId: string): Promise<AccountCollection> { return this.mutateCollection(noteId, expectedUserId, 'POST'); }
  async removeNote(noteId: NoteId, expectedUserId: string): Promise<AccountCollection> { return this.mutateCollection(noteId, expectedUserId, 'DELETE'); }
  async getCatalog(): Promise<NounsMoneyCatalog> {
    const data = await this.request('/nouns-money/catalog.json');
    if (!object(data) || typeof data.schema !== 'string' || data.mode !== 'collectible-art' || data.count !== 100 || !Array.isArray(data.notes) || data.notes.length !== 100 || new Set(data.notes.map(item => object(item) ? item.id : null)).size !== 100 || data.notes.some(item => !object(item) || !isNoteId(item.id) || typeof item.name !== 'string' || !Number.isInteger(item.nounId) || item.nounId !== Number((item.id as string).slice(6)) || typeof item.image !== 'string' || typeof item.svg !== 'string') || !Object.hasOwn(data, 'provenance')) fail('invalid_response', 'The catalog did not contain the 100 source notes.');
    return copy(data) as unknown as NounsMoneyCatalog;
  }
}
