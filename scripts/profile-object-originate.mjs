import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  prepareProfileOrigination,
  printOriginationUsage,
  printPreparation,
} from './profile-contract-origination.mjs';

export async function main(argv = process.argv.slice(2)) {
  const result = await prepareProfileOrigination({
    label: 'PointCast Profile Objects',
    buildDirectory: 'profile_object',
    argv,
  });
  if (result.help) printOriginationUsage('profile-object-originate.mjs', 'PointCast Profile Objects');
  else printPreparation(result);
  return result;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  main().catch((error) => {
    console.error(`[profile-object-originate] ${error.message}`);
    process.exitCode = 1;
  });
}
