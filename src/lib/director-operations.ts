import { DIRECTOR_ADMIN_ADDRESS } from './director-access';

export const DIRECTOR_ENTRYPOINTS = [
  'set_issuer',
  'set_paused',
  'set_price',
  'set_treasury',
  'set_window',
] as const;

export type DirectorEntrypoint = (typeof DIRECTOR_ENTRYPOINTS)[number];

export interface DirectorOperation {
  contract: string;
  entrypoint: DirectorEntrypoint;
  args?: unknown;
}

interface WalletOperation {
  opHash: string;
  confirmation(confirmations?: number): Promise<unknown>;
}

interface WalletMethod {
  send(): Promise<WalletOperation>;
}

interface WalletContract {
  methodsObject: Record<string, (...args: unknown[]) => WalletMethod>;
}

export interface DirectorOperationDependencies {
  connect(): Promise<string>;
  at(address: string): Promise<WalletContract>;
  adminAddress?: string;
}

const CONTRACT_ADDRESS = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;

export function isDirectorEntrypoint(value: unknown): value is DirectorEntrypoint {
  return typeof value === 'string' && DIRECTOR_ENTRYPOINTS.includes(value as DirectorEntrypoint);
}

export function validateDirectorOperation(value: unknown): DirectorOperation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Director operation is missing.');
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.contract !== 'string' || !CONTRACT_ADDRESS.test(candidate.contract)) {
    throw new Error('Director operation has an invalid contract address.');
  }
  if (!isDirectorEntrypoint(candidate.entrypoint)) {
    throw new Error('Director operation uses an unsupported entrypoint.');
  }
  return {
    contract: candidate.contract,
    entrypoint: candidate.entrypoint,
    ...(candidate.args === undefined ? {} : { args: candidate.args }),
  };
}

export async function sendDirectorOperationWith(
  input: unknown,
  dependencies: DirectorOperationDependencies,
): Promise<{ address: string; opHash: string; confirmation: Promise<unknown> }> {
  const operation = validateDirectorOperation(input);
  const address = await dependencies.connect();
  if (address !== (dependencies.adminAddress ?? DIRECTOR_ADMIN_ADDRESS)) {
    throw new Error('Connected wallet is not the PointCast contract admin.');
  }

  const contract = await dependencies.at(operation.contract);
  const method = contract.methodsObject?.[operation.entrypoint];
  if (typeof method !== 'function') {
    throw new Error(`Contract does not expose ${operation.entrypoint}.`);
  }
  const args = operation.args === undefined
    ? []
    : Array.isArray(operation.args) ? operation.args : [operation.args];
  const pending = await method(...args).send();
  if (!pending?.opHash) throw new Error('Wallet did not return an operation hash.');
  return {
    address,
    opHash: pending.opHash,
    confirmation: pending.confirmation(1),
  };
}
