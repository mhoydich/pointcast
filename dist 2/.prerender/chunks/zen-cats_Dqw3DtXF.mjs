import contracts from './contracts_B1zhgPPX.mjs';
import { b as buildZenCatsManifest } from './zen-cats_rLk34c8x.mjs';

const GET = async () => {
  const manifest = buildZenCatsManifest();
  const mainnetAddress = (contracts.zen_cats?.mainnet).trim();
  const shadownetAddress = (contracts.zen_cats?.shadownet).trim();
  const metadataBase = (contracts.zen_cats?.metadataBaseUrl).trim();
  const payload = {
    ...manifest,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    entrypoints: {
      html: "https://pointcast.xyz/zen-cats",
      json: "https://pointcast.xyz/zen-cats.json",
      todayMetadata: manifest.today.metadataUrl,
      todayImage: manifest.today.imageUrl,
      playLayer: "https://pointcast.xyz/play.json"
    },
    contract: {
      symbol: contracts.zen_cats?.symbol,
      mainnet: mainnetAddress,
      shadownet: shadownetAddress,
      live: mainnetAddress.startsWith("KT1"),
      mintPriceMutez: Number(contracts.zen_cats?.mintPriceMutez),
      metadataBaseUrl: metadataBase,
      note: "PCCAT should use a dedicated FA2 contract. Visit Nouns is mainnet-live but intentionally not reused because its metadata and mint entrypoint are Noun-specific."
    },
    agentProtocol: {
      dailyToken: "Use tokenId YYYYMMDD from the PT calendar date.",
      localState: "Collection state is browser-local under pc:zen-cats:collection; agents must not infer a visitor owns a cat unless the state is supplied by that visitor.",
      tezos: "When contract.live is false, describe the page as Tezos-ready rather than mint-live."
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
