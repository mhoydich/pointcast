import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  prepareProfileOrigination,
  printOriginationUsage,
  printPreparation,
} from './profile-contract-origination.mjs';

export async function main(argv = process.argv.slice(2)) {
  const result = await prepareProfileOrigination({
    label: 'PointCast Soulbound Seals',
    buildDirectory: 'seal_soulbound',
    argv,
  });
  if (result.help) printOriginationUsage('seal-soulbound-originate.mjs', 'PointCast Soulbound Seals');
  else printPreparation(result);
  return result;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((error) => {
    console.error(`[seal-soulbound-originate] ${error.message}`);
    process.exitCode = 1;
  });
}
