import { handleMoneyReceipts } from '../../../src/lib/money-api.mjs';

interface Env {
  PC_MONEY_KV?: KVNamespace;
  MONEY_ADMIN_TOKEN?: string;
}

export const onRequest: PagesFunction<Env> = (ctx) => handleMoneyReceipts(ctx);
