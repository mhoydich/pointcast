import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import contracts from './contracts_B1zhgPPX.mjs';
import { m as market } from './market_tuD5rgVB.mjs';

const GET = async () => {
  const visitNounsKt1 = (contracts.visit_nouns?.mainnet).trim();
  const drumTokenKt1 = (contracts.drum_token?.mainnet).trim();
  const prizeCastKt1 = (contracts.prize_cast?.mainnet).trim();
  let visitNounsSupply = null;
  let visitNounsError = null;
  if (visitNounsKt1.startsWith("KT1")) {
    try {
      const r = await fetch(
        `https://api.tzkt.io/v1/tokens?contract=${visitNounsKt1}&limit=10000&select=totalSupply,holdersCount`,
        { headers: { Accept: "application/json" } }
      );
      if (r.ok) {
        const list = await r.json();
        visitNounsSupply = {
          totalMinted: list.reduce((sum, t) => sum + Number(t.totalSupply ?? 0), 0),
          distinctTokenIds: list.length,
          maxHolders: list.reduce((max, t) => Math.max(max, t.holdersCount ?? 0), 0)
        };
      } else {
        visitNounsError = `tzkt returned ${r.status}`;
      }
    } catch (e) {
      visitNounsError = e?.message || "tzkt fetch failed";
    }
  }
  const marketTokens = market.tokens || [];
  const listedTokens = marketTokens.filter((t) => t.listed);
  const faucetBlocks = (await getCollection("blocks", ({ data }) => !data.draft && data.type === "FAUCET")).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const mintBlocks = (await getCollection("blocks", ({ data }) => !data.draft && data.type === "MINT")).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const payload = {
    $schema: "https://pointcast.xyz/for-agents",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    summary: {
      liveMinted: visitNounsSupply?.totalMinted ?? 0,
      marketListed: listedTokens.length,
      faucetChannels: faucetBlocks.length,
      plannedIncoming: 2
    },
    lanes: {
      onChainLive: {
        status: visitNounsKt1 ? "live" : "pending",
        collections: [
          {
            name: "Visit Nouns FA2",
            contract: visitNounsKt1 || null,
            type: "FA2 · Open edition",
            totalMinted: visitNounsSupply?.totalMinted ?? null,
            distinctTokenIds: visitNounsSupply?.distinctTokenIds ?? null,
            maxHoldersPerToken: visitNounsSupply?.maxHolders ?? null,
            supplyCap: null,
            mintPriceMutez: 0,
            marketplace: visitNounsKt1 ? `https://objkt.com/collection/${visitNounsKt1}` : null,
            tzkt: visitNounsKt1 ? `https://tzkt.io/${visitNounsKt1}` : null,
            supplyError: visitNounsError
          }
        ]
      },
      listedMarket: {
        contract: market.contract,
        total: marketTokens.length,
        listedCount: listedTokens.length,
        updatedAt: market.updatedAt,
        tokens: listedTokens.map((t) => ({
          tokenId: t.tokenId,
          name: t.name,
          supply: t.supply,
          amountLeft: t.amountLeft,
          priceMutez: t.priceMutez ?? null,
          priceXtz: t.priceXtz ?? null,
          artist: t.artist,
          objktUrl: t.objktUrl,
          localUrl: `https://pointcast.xyz/collect/${t.tokenId}`
        }))
      },
      faucet: {
        status: "design-locked-pending-origination",
        blocks: faucetBlocks.map((b) => ({
          id: b.data.id,
          url: `https://pointcast.xyz/b/${b.data.id}`,
          channel: b.data.channel,
          title: b.data.title,
          dek: b.data.dek,
          timestamp: b.data.timestamp.toISOString(),
          noun: b.data.noun ?? null,
          edition: b.data.edition ?? null
        }))
      },
      planned: {
        DRUM: {
          contract: drumTokenKt1 || null,
          status: "contract-written-awaiting-compile",
          spec: "https://pointcast.xyz/docs/pm-briefs/2026-04-17-drum-token-integration.md",
          source: "contracts/v2/drum_token.py",
          type: "FA1.2 · signed-voucher claim"
        },
        PrizeCast: {
          contract: prizeCastKt1 || null,
          status: "contract-written-awaiting-compile",
          spec: "https://pointcast.xyz/docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md",
          source: "contracts/v2/prize_cast.py",
          type: "No-loss prize-linked savings (PoolTogether-flavored)",
          drawDay: "Sunday 18:00 UTC"
        }
      },
      mintBlocks: mintBlocks.map((b) => ({
        id: b.data.id,
        url: `https://pointcast.xyz/b/${b.data.id}`,
        title: b.data.title,
        edition: b.data.edition ?? null
      }))
    },
    agentSurfaces: {
      human: "https://pointcast.xyz/editions",
      forAgents: "https://pointcast.xyz/for-agents",
      blocksFlat: "https://pointcast.xyz/blocks.json",
      archive: "https://pointcast.xyz/archive.json"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
