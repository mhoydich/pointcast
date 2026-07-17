import { connectKukai, tezosClient } from './tezos';

export const UES_FUND_WALLET = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
export const UES_FUND_NETWORK = 'Tezos Mainnet';

const MIN_CONTRIBUTION = 0.1;
const MAX_CONTRIBUTION = 10_000;

function validAmount(value: number) {
  return Number.isFinite(value) && value >= MIN_CONTRIBUTION && value <= MAX_CONTRIBUTION;
}

export async function connectUesWallet() {
  return connectKukai();
}

export async function contributeToUes(amount: number) {
  if (!validAmount(amount)) throw new Error('INVALID_CONTRIBUTION_AMOUNT');

  const owner = await connectKukai();
  const tezos = await tezosClient();
  const operation = await tezos.wallet.transfer({
    to: UES_FUND_WALLET,
    amount,
  }).send();

  return {
    owner,
    opHash: operation.opHash,
    confirmation: operation.confirmation(1),
  };
}
