import contracts from '../data/contracts.json';

export const PROJECT_SAFE_ADDRESS = contracts.project_multisig.mainnet;
export const PROJECT_SAFE_TZKT = `https://tzkt.io/${PROJECT_SAFE_ADDRESS}`;
export const PROJECT_SAFE_THRESHOLD = contracts.project_multisig.threshold;
export const PROJECT_SAFE_OWNERS = contracts.project_multisig.owners;
