import { randomUrlSafeString } from '../auth/_oauth.ts';
import { sha256Hex } from '../auth/email/_shared.ts';
import type { AuthEnv } from '../auth/session.ts';
import {
  COLLECT_CONFIRM_PREFIX,
} from '../../../src/lib/collect-email.ts';
import type { MailEnv } from '../../../src/lib/mail.ts';

export interface CollectEnv extends AuthEnv, MailEnv {
  PC_RATES_KV?: KVNamespace;
}

export interface SubscriberRow {
  email: string;
  user_id: string | null;
  status: 'pending' | 'confirmed' | 'unsubscribed';
  token: string;
  created_at: string;
  confirmed_at: string | null;
  last_sent_day: string | null;
  tz: string;
}

export interface CollectConfirmState {
  email: string;
  currentUserId: string | null;
  issuedAt: string;
}

export function createSubscriberToken(): string {
  return randomUrlSafeString(32);
}

export async function collectConfirmKey(token: string): Promise<string> {
  return `${COLLECT_CONFIRM_PREFIX}${await sha256Hex(token)}`;
}

export function validBearerToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{40,128}$/u.test(value);
}

export function requireCollectDb(env: CollectEnv): D1Database | null {
  return env.AUTH_DB ?? null;
}

export async function findSubscriberByToken(
  db: D1Database,
  token: string,
): Promise<SubscriberRow | null> {
  return db.prepare(`
    SELECT email, user_id, status, token, created_at, confirmed_at, last_sent_day, tz
    FROM subscribers
    WHERE token = ?
  `).bind(token).first<SubscriberRow>();
}
