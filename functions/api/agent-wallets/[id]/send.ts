import { handleWalletOperation, walletWriteOptions } from '../../../_lib/agent-wallet-ops';
import type { WalletSigningEnv } from '../../../_lib/agent-wallet-chain';

export const onRequestPost: PagesFunction<WalletSigningEnv, 'id'> = ({ request, env, params }) =>
  handleWalletOperation(request, env, params.id, 'send');

export const onRequestOptions: PagesFunction = walletWriteOptions;
