import { handleMoneyWebhook } from '../../../src/lib/money-api.mjs';

interface Env {
  PC_MONEY_KV?: KVNamespace;
  LINK_WEBHOOK_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

export const onRequest: PagesFunction<Env> = (ctx) => handleMoneyWebhook(ctx);
