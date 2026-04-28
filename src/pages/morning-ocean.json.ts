import type { APIRoute } from 'astro';
import contracts from '../data/contracts.json';
import { buildMorningOceanManifest } from '../lib/morning-ocean';

export const GET: APIRoute = async () => {
  const manifest = buildMorningOceanManifest();
  const config = (contracts as any).morning_ocean ?? {};
  const mainnetAddress = String(config.mainnet ?? '').trim();
  const shadownetAddress = String(config.shadownet ?? '').trim();
  const metadataBase =
    String(config.metadataBaseUrl ?? config.metadata_base_uri ?? manifest.tezos.metadataBase).trim();

  const payload = {
    ...manifest,
    generatedAt: new Date().toISOString(),
    entrypoints: {
      html: 'https://pointcast.xyz/morning-ocean',
      json: 'https://pointcast.xyz/morning-ocean.json',
      metadataBase,
      coverImage: manifest.coverImage,
    },
    contract: {
      symbol: config.symbol ?? manifest.symbol,
      mainnet: mainnetAddress,
      shadownet: shadownetAddress,
      live: mainnetAddress.startsWith('KT1'),
      mintEntrypoint: config.mintEntrypoint ?? manifest.tezos.mintEntrypoint,
      mintPriceMutez: Number(config.mintPriceMutez ?? 0),
      royaltyBps: Number(config.royalty_bps ?? 750),
      note:
        'Morning Ocean is metadata-ready. Minting becomes live after a dedicated PCOCEAN FA2 contract is originated and its KT1 is pasted into contracts.json.',
    },
    agentProtocol: {
      localState:
        'Local collection state lives under pc:morning-ocean:collection. Do not infer ownership unless the visitor supplies local or on-chain state.',
      tezos:
        'When contract.live is false, describe the series as Tezos-ready rather than mint-live.',
      metadata:
        'Token metadata is available at /api/morning-ocean-metadata/{tokenId}.json for token IDs 1..24.',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
};
