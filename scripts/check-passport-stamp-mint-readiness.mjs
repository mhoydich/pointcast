#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contractsPath = path.join(root, 'src/data/contracts.json');
const contracts = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
const contract = String(contracts?.visit_nouns?.mainnet ?? '').trim();
const baseUrl = process.env.POINTCAST_BASE || 'http://127.0.0.1:4321';

function fail(reason, extra = {}) {
  console.log(JSON.stringify({ ok: false, reason, ...extra }, null, 2));
  process.exitCode = 1;
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function getPassportTokenIds() {
  try {
    const manifest = await getJson(`${baseUrl}/passport.json`);
    const ids = (manifest.stamps || [])
      .map((stamp) => Number(stamp?.mint?.current?.tokenId ?? stamp?.mint?.companion?.tokenId))
      .filter((tokenId) => Number.isFinite(tokenId));
    if (ids.length > 0) return ids;
  } catch {}

  const count = Number(process.env.PASSPORT_STAMP_COUNT || 24);
  return Array.from({ length: count }, (_, index) => 900 + index);
}

if (!contract.startsWith('KT1')) {
  fail('visit-nouns-contract-not-configured', { contract: contract || null });
} else {
  try {
    const tokenIds = await getPassportTokenIds();
    const [info, entrypoints, tokens] = await Promise.all([
      getJson(`https://api.tzkt.io/v1/contracts/${contract}`),
      getJson(`https://api.tzkt.io/v1/contracts/${contract}/entrypoints`),
      getJson(
        `https://api.tzkt.io/v1/tokens?contract=${contract}&tokenId.in=${tokenIds.join(',')}&select=tokenId,totalSupply,holdersCount&limit=100`,
      ),
    ]);

    const mintEntrypoint = entrypoints.find((entrypoint) => entrypoint.name === 'mint_noun');
    const supplies = Object.fromEntries(
      tokens.map((token) => [
        Number(token.tokenId),
        {
          totalSupply: Number(token.totalSupply ?? 0),
          holdersCount: Number(token.holdersCount ?? 0),
        },
      ]),
    );

    const missing = tokenIds.filter((tokenId) => !Object.hasOwn(supplies, tokenId));
    const minted = tokenIds.filter((tokenId) => (supplies[tokenId]?.totalSupply ?? 0) > 0);

    console.log(
      JSON.stringify(
        {
          ok: Boolean(info.address === contract && mintEntrypoint),
          checkedAt: new Date().toISOString(),
          network: 'tezos-mainnet',
          contract,
          tzkt: `https://tzkt.io/${contract}`,
          contractKind: info.kind,
          tzips: info.tzips ?? [],
          entrypoint: mintEntrypoint
            ? { name: mintEntrypoint.name, parameterSchema: mintEntrypoint.parameterSchema }
            : null,
          manifestBaseUrl: baseUrl,
          passportStampCount: tokenIds.length,
          passportCompanionTokenIds: tokenIds,
          alreadyMintedTokenIds: minted,
          notYetMintedTokenIds: missing,
          supplies,
          note:
            'Read-only readiness only. A new mint still requires the user to approve a Kukai/Beacon transaction in the browser.',
        },
        null,
        2,
      ),
    );

    if (!mintEntrypoint) process.exitCode = 1;
  } catch (error) {
    fail('tzkt-readiness-check-failed', {
      contract,
      message: error?.message || String(error),
    });
  }
}
