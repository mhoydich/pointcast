import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  prepareProfileOrigination,
  printOriginationUsage,
  printPreparation,
} from './profile-contract-origination.mjs';

export const SEAL_V2_ADMIN = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
export const SEAL_V2_ISSUERS = [
  SEAL_V2_ADMIN,
  'tz1PTUzbDzkddTh2uXMuxrGtRL6ty8aoeysY',
  'tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG',
];

function assertSeededIssuers(storage) {
  const encoded = JSON.stringify(storage);
  for (const issuer of SEAL_V2_ISSUERS) {
    if (!encoded.includes(`"${issuer}"`)) {
      throw new Error(`Compiled v2 storage is missing seeded issuer ${issuer}.`);
    }
  }
}

export async function main(argv = process.argv.slice(2)) {
  const result = await prepareProfileOrigination({
    label: 'PointCast Soulbound Seals V2',
    buildDirectory: 'seal_soulbound_v2',
    argv,
    // Validated against the compiled storage before any preparation output or
    // mainnet broadcast — never against the returned result, whose shape differs
    // between the prepared-only and executed paths (see profile-contract-origination.mjs).
    validateStorage: assertSeededIssuers,
  });
  if (result.help) {
    printOriginationUsage('seal-v2-originate.mjs', 'PointCast Soulbound Seals V2');
    return result;
  }
  if (result.prepared.admin !== SEAL_V2_ADMIN) {
    throw new Error(`Seal v2 administrator must remain Mike (${SEAL_V2_ADMIN}).`);
  }
  if (!result.prepared.paused) {
    throw new Error('Seal v2 must originate paused.');
  }
  printPreparation(result);
  console.log(`Seeded issuers: ${SEAL_V2_ISSUERS.join(', ')}`);
  return result;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((error) => {
    console.error(`[seal-v2-originate] ${error.message}`);
    process.exitCode = 1;
  });
}
