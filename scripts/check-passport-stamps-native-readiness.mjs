#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contractsPath = path.join(root, 'src/data/contracts.json');
const contractSource = path.join(root, 'contracts/v2/passport_stamps_fa2.py');
const contracts = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
const configured = contracts?.passport_stamps ?? {};
const contract = String(configured.mainnet || configured.shadownet || '').trim();
const network = configured.mainnet ? 'mainnet' : configured.shadownet ? 'shadownet' : 'not-originated';
const apiBase = network === 'shadownet' ? 'https://api.shadownet.tzkt.io/v1' : 'https://api.tzkt.io/v1';
const tzktBase = network === 'shadownet' ? 'https://shadownet.tzkt.io' : 'https://tzkt.io';
const baseUrl = process.env.POINTCAST_BASE || 'http://127.0.0.1:4321';
const fallbackStampSlugs = [
  'el-segundo',
  'manhattan-beach',
  'hermosa',
  'redondo-beach',
  'venice',
  'santa-monica',
  'palos-verdes',
  'long-beach',
  'los-angeles',
  'malibu',
  'pasadena',
  'anaheim-oc',
  'newport-laguna',
  'santa-barbara',
  'north-san-diego',
  'palm-springs',
  'lax-westchester',
  'inglewood',
  'torrance',
  'culver-city',
  'san-pedro',
  'hollywood',
  'burbank-glendale',
  'ventura',
];

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function getStampSlugs() {
  try {
    const manifest = await fetchJson(`${baseUrl}/passport.json`);
    const slugs = (manifest.stamps || [])
      .map((stamp) => String(stamp?.slug || '').trim())
      .filter(Boolean);
    if (slugs.length > 0) return slugs;
  } catch {}
  return fallbackStampSlugs;
}

async function checkMetadata() {
  const stampSlugs = await getStampSlugs();
  const first = await fetchJson(`${baseUrl}/passport/stamps/${stampSlugs[0]}.json`);
  const last = await fetchJson(`${baseUrl}/passport/stamps/${stampSlugs.at(-1)}.json`);
  const lastTokenId = stampSlugs.length - 1;
  return {
    baseUrl,
    stampCount: stampSlugs.length,
    stampSlugs,
    first: {
      name: first.name,
      symbol: first.symbol,
      futureEntrypoint: first.minting?.future?.entrypoint,
      futureTokenId: first.minting?.future?.tokenId,
    },
    last: {
      name: last.name,
      symbol: last.symbol,
      futureEntrypoint: last.minting?.future?.entrypoint,
      futureTokenId: last.minting?.future?.tokenId,
    },
    ok:
      first.symbol === 'PCPASS' &&
      last.symbol === 'PCPASS' &&
      first.minting?.future?.entrypoint === 'mint_stamp' &&
      first.minting?.future?.tokenId === 0 &&
      last.minting?.future?.tokenId === lastTokenId,
  };
}

async function main() {
  const metadata = await checkMetadata();
  const sourceExists = fs.existsSync(contractSource);
  const source = sourceExists ? fs.readFileSync(contractSource, 'utf8') : '';
  const sourceOk =
    source.includes('class PassportStampsFA2') &&
    source.includes('def mint_stamp') &&
    source.includes('mint_stamp(stamp_id)');

  const result = {
    ok: Boolean(sourceOk && metadata.ok),
    checkedAt: new Date().toISOString(),
    contractSource: 'contracts/v2/passport_stamps_fa2.py',
    sourceOk,
    metadata,
    configuredNetwork: network,
    contract: contract || null,
    live: null,
    note:
      'Native stamp readiness. If contract is null, this verifies source + metadata only; origination still needs SmartPy compile and wallet-signed deployment.',
  };

  if (contract.startsWith('KT1')) {
    const [info, entrypoints, tokens] = await Promise.all([
      fetchJson(`${apiBase}/contracts/${contract}`),
      fetchJson(`${apiBase}/contracts/${contract}/entrypoints`),
      fetchJson(
        `${apiBase}/tokens?contract=${contract}&tokenId.in=${Array.from({ length: metadata.stampCount }, (_, index) => index).join(',')}&select=tokenId,totalSupply,holdersCount&limit=100`,
      ),
    ]);

    const mint = entrypoints.find((entrypoint) => entrypoint.name === 'mint_stamp');
    result.live = {
      ok: Boolean(info.address === contract && mint),
      tzkt: `${tzktBase}/${contract}`,
      contractKind: info.kind,
      tzips: info.tzips ?? [],
      mintEntrypoint: mint ? { name: mint.name, parameterSchema: mint.parameterSchema } : null,
      tokenSupplies: tokens,
    };
    result.ok = Boolean(result.ok && result.live.ok);
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    reason: 'passport-native-readiness-failed',
    message: error?.message || String(error),
  }, null, 2));
  process.exit(1);
});
