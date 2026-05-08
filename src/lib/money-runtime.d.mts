export const MONEY_LIVE_CAP_CENTS: number;
export const MONEY_RECEIPT_PREFIX: string;
export const MONEY_EVENT_PREFIX: string;
export const MONEY_EVENT_TTL_SECONDS: number;

export function formatUsd(cents: number): string;
export function moneyReceiptKey(id: string): string;
export function moneyEventKey(id: string): string;
export function centsFromAmount(value: unknown, fallbackUsd?: unknown): number;
export function normalizeMoneyMode(value: unknown, isTest?: unknown): 'test' | 'live';
export function normalizeMoneyStatus(value: unknown): 'pending' | 'approved' | 'denied' | 'settled' | 'refunded' | 'expired';
export function cleanString(value: unknown, max?: number): string;
export function redactSecretValue(value: unknown): string;
export function sanitizeCredentialLabel(value: unknown): string;
export function assertNoMoneySecrets(value: unknown, path?: string): string[];
export function normalizeMoneyReceiptDraft(input?: unknown, options?: Record<string, unknown>): Record<string, any>;
export function publicMoneyReceiptDraft(draft: Record<string, any>): Record<string, any>;
export function buildAllowanceSummary(ledger: unknown, drafts?: Array<Record<string, any>>, capCents?: number): Record<string, any>;
export function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
  toleranceSeconds?: number,
  nowMs?: number,
): Promise<boolean>;
