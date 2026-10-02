/**
 * Local-only service-receipt example. This module makes no HTTP, payment,
 * wallet, x402, blockchain, or remote-artifact calls. Its approval value is a
 * demonstration input, not an authenticated or signed authorization.
 */
export class AgentServiceExampleError extends Error {
  readonly code: 'invalid_request' | 'approval_required' | 'request_expired';

  constructor(code: 'invalid_request' | 'approval_required' | 'request_expired', message: string) {
    super(message);
    this.name = 'AgentServiceExampleError';
    this.code = code;
  }
}

export interface LocalAgentServiceRequest {
  schema: 'pointcast.nouns-money.agent-service-request/v1';
  requestId: string;
  scope: string;
  constraints: { maxOutputBytes: number; mediaType: 'text/plain' | 'application/json' };
  acceptanceTest: string;
  createdAt: string;
  expiresAt: string;
}

export interface LocalAgentServiceApproval {
  requestId: string;
  decision: 'approved';
  approvedAt: string;
  mode: 'local-demo-unverified';
}

export interface LocalAgentServiceReceipt {
  schema: 'pointcast.nouns-money.agent-service-receipt/v1';
  version: 1;
  requestId: string;
  scope: string;
  createdAt: string;
  expiresAt: string;
  providerId: string;
  resultRef: string;
  digest: { algorithm: 'sha-256'; value: string };
  verification: {
    method: 'sha-256-content-bytes';
    outcome: 'digest_match' | 'digest_mismatch';
    expectedDigest: string;
    actualDigest: string;
    semanticTruth: 'not_evaluated';
  };
  serviceStatus: 'result_available';
  acceptanceStatus: 'pending';
  paymentStatus: 'not_requested';
  authenticity: 'unsigned_unverified';
}

const schema = 'pointcast.nouns-money.agent-service-request/v1';
const receiptSchema = 'pointcast.nouns-money.agent-service-receipt/v1';
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function exact(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (!object(value) || Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new AgentServiceExampleError('invalid_request', 'Provide exactly: ' + keys.join(', ') + '.');
  }
}
function validDate(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function fail(code: AgentServiceExampleError['code'], message: string): never { throw new AgentServiceExampleError(code, message); }

/** Build a bounded, local request for a named service task. */
export function createLocalAgentServiceRequest(input: {
  scope: string;
  constraints: { maxOutputBytes: number; mediaType: 'text/plain' | 'application/json' };
  acceptanceTest: string;
  ttlMs?: number;
}): LocalAgentServiceRequest {
  if (!object(input)) fail('invalid_request', 'A bounded local service request is required.');
  exact(input, ['scope', 'constraints', 'acceptanceTest', ...(Object.hasOwn(input, 'ttlMs') ? ['ttlMs'] : [])]);
  if (typeof input.scope !== 'string' || !/^[a-z][a-z0-9-]{0,47}$/.test(input.scope)) fail('invalid_request', 'scope must be a short lowercase service name.');
  exact(input.constraints, ['maxOutputBytes', 'mediaType']);
  if (!Number.isInteger(input.constraints.maxOutputBytes) || input.constraints.maxOutputBytes < 1 || input.constraints.maxOutputBytes > 262144) fail('invalid_request', 'maxOutputBytes must be from 1 through 262144.');
  if (!['text/plain', 'application/json'].includes(input.constraints.mediaType)) fail('invalid_request', 'Choose text/plain or application/json.');
  if (typeof input.acceptanceTest !== 'string' || input.acceptanceTest.trim().length < 1 || input.acceptanceTest.length > 240 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input.acceptanceTest)) fail('invalid_request', 'Describe one acceptance test in at most 240 plain-text characters.');
  const ttlMs = input.ttlMs ?? 5 * 60 * 1000;
  if (!Number.isInteger(ttlMs) || ttlMs < 1000 || ttlMs > 60 * 60 * 1000) fail('invalid_request', 'ttlMs must be from 1000 through 3600000.');
  const created = Date.now();
  return {
    schema, requestId: 'nmjob_' + crypto.randomUUID(), scope: input.scope,
    constraints: { maxOutputBytes: input.constraints.maxOutputBytes, mediaType: input.constraints.mediaType },
    acceptanceTest: input.acceptanceTest.trim(), createdAt: new Date(created).toISOString(),
    expiresAt: new Date(created + ttlMs).toISOString(),
  };
}

/** This flag models approval of the local service job only; it cannot authorize payment. */
export function approveLocalAgentServiceJob(request: LocalAgentServiceRequest, input: { approved: true }): LocalAgentServiceApproval {
  exact(input, ['approved']);
  if (input.approved !== true) fail('approval_required', 'Approve the service job explicitly before making its local receipt.');
  if (request?.schema !== schema || typeof request.requestId !== 'string' || !/^nmjob_[0-9a-f-]{36}$/.test(request.requestId)
      || typeof request.scope !== 'string' || !/^[a-z][a-z0-9-]{0,47}$/.test(request.scope)
      || !validDate(request.createdAt) || !validDate(request.expiresAt)
      || !request.constraints || !Number.isInteger(request.constraints.maxOutputBytes)
      || request.constraints.maxOutputBytes < 1 || request.constraints.maxOutputBytes > 262144
      || !['text/plain', 'application/json'].includes(request.constraints.mediaType)
      || typeof request.acceptanceTest !== 'string' || request.acceptanceTest.length < 1 || request.acceptanceTest.length > 240
      || Date.parse(request.expiresAt) <= Date.parse(request.createdAt)) fail('invalid_request', 'Invalid local service request.');
  const approvedAt = new Date().toISOString();
  if (Date.parse(approvedAt) >= Date.parse(request.expiresAt)) fail('request_expired', 'The local service request has expired.');
  return { requestId: request.requestId, decision: 'approved', approvedAt, mode: 'local-demo-unverified' };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  if (!(bytes instanceof Uint8Array)) fail('invalid_request', 'Expected artifact bytes as Uint8Array.');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Create an unsigned local record after a separately approved service job. */
export async function createLocalAgentServiceReceipt(input: {
  request: LocalAgentServiceRequest;
  approval: LocalAgentServiceApproval;
  providerId: string;
  resultRef: string;
  bytes: Uint8Array;
  expectedSha256: string;
}): Promise<LocalAgentServiceReceipt> {
  exact(input, ['request', 'approval', 'providerId', 'resultRef', 'bytes', 'expectedSha256']);
  const { request, approval, bytes } = input;
  if (request?.schema !== schema || typeof request.requestId !== 'string' || !validDate(request.createdAt) || !validDate(request.expiresAt)
      || typeof request.scope !== 'string' || !request.constraints || !Number.isInteger(request.constraints.maxOutputBytes)
      || request.constraints.maxOutputBytes < 1 || request.constraints.maxOutputBytes > 262144
      || !['text/plain', 'application/json'].includes(request.constraints.mediaType)
      || typeof approval?.requestId !== 'string' || approval.requestId !== request.requestId || approval.decision !== 'approved'
      || approval.mode !== 'local-demo-unverified' || !validDate(approval.approvedAt)
      || Date.parse(request.expiresAt) <= Date.parse(request.createdAt)
      || typeof request.acceptanceTest !== 'string' || request.acceptanceTest.length < 1 || request.acceptanceTest.length > 240
      || Date.parse(approval.approvedAt) < Date.parse(request.createdAt)) fail('approval_required', 'Create a separate local approval for this valid request before preparing a receipt.');
  const now = new Date().toISOString();
  if (Date.parse(now) >= Date.parse(request.expiresAt)) fail('request_expired', 'The local service request has expired.');
  if (Date.parse(now) < Date.parse(approval.approvedAt)) fail('invalid_request', 'The approval timestamp cannot be in the future.');
  if (typeof input.providerId !== 'string' || !/^[A-Za-z0-9._:-]{1,64}$/.test(input.providerId)) fail('invalid_request', 'providerId must be a short local identifier.');
  if (typeof input.resultRef !== 'string' || !/^local:\/\/[A-Za-z0-9._/-]{1,180}$/.test(input.resultRef)) fail('invalid_request', 'This example accepts local:// artifact references only.');
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > request.constraints.maxOutputBytes) fail('invalid_request', 'Output must be non-empty and within the requested byte limit.');
  if (typeof input.expectedSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.expectedSha256)) fail('invalid_request', 'expectedSha256 must be a lowercase SHA-256 digest.');
  const actualDigest = await sha256Hex(bytes);
  return {
    schema: receiptSchema, version: 1, requestId: request.requestId, scope: request.scope,
    createdAt: now, expiresAt: request.expiresAt, providerId: input.providerId, resultRef: input.resultRef,
    digest: { algorithm: 'sha-256', value: actualDigest },
    verification: {
      method: 'sha-256-content-bytes', outcome: actualDigest === input.expectedSha256 ? 'digest_match' : 'digest_mismatch',
      expectedDigest: input.expectedSha256, actualDigest, semanticTruth: 'not_evaluated',
    },
    serviceStatus: 'result_available', acceptanceStatus: 'pending', paymentStatus: 'not_requested',
    authenticity: 'unsigned_unverified',
  };
}
