/**
 * /editions.json — machine-readable editions dashboard.
 *
 * Same data as /editions, structured for agents to consume. Pairs with
 * /for-agents to answer "what can an agent mint, claim, or collect on
 * PointCast right now?"
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  PASSPORT_COMPANION_COLLECTION,
  PASSPORT_STAMP_COLLECTION,
  PASSPORT_STAMP_PRD_PATH,
} from '../lib/passport-mint';
import contracts from '../data/contracts.json';
import market from '../data/market.json';

export const GET: APIRoute = async () => {
  const visitNounsKt1 = ((contracts as any).visit_nouns?.mainnet ?? '').trim();
  const drumTokenKt1 = ((contracts as any).drum_token?.mainnet ?? '').trim();
  const prizeCastKt1 = ((contracts as any).prize_cast?.mainnet ?? '').trim();

  // Live Visit Nouns supply
  let visitNounsSupply: { totalMinted: number; distinctTokenIds: number; maxHolders: number } | null = null;
  let visitNounsError: string | null = null;
  if (visitNounsKt1.startsWith('KT1')) {
    try {
      const r = await fetch(
        `https://api.tzkt.io/v1/tokens?contract=${visitNounsKt1}&limit=10000&select=totalSupply,holdersCount`,
        { headers: { Accept: 'application/json' } },
      );
      if (r.ok) {
        const list: Array<{ totalSupply: string; holdersCount: number }> = await r.json();
        visitNounsSupply = {
          totalMinted: list.reduce((sum, t) => sum + Number(t.totalSupply ?? 0), 0),
          distinctTokenIds: list.length,
          maxHolders: list.reduce((max, t) => Math.max(max, t.holdersCount ?? 0), 0),
        };
      } else {
        visitNounsError = `tzkt returned ${r.status}`;
      }
    } catch (e: any) {
      visitNounsError = e?.message || 'tzkt fetch failed';
    }
  }

  const marketTokens = (market as any).tokens || [];
  const listedTokens = marketTokens.filter((t: any) => t.listed);

  const faucetBlocks = (await getCollection('blocks', ({ data }) => !data.draft && data.type === 'FAUCET'))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const mintBlocks = (await getCollection('blocks', ({ data }) => !data.draft && data.type === 'MINT'))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    updatedAt: new Date().toISOString(),
    summary: {
      liveMinted: visitNounsSupply?.totalMinted ?? 0,
      marketListed: listedTokens.length,
      faucetChannels: faucetBlocks.length,
      plannedIncoming: 3,
    },
    lanes: {
      onChainLive: {
        status: visitNounsKt1 ? 'live' : 'pending',
        collections: [
          {
            name: 'Visit Nouns FA2',
            contract: visitNounsKt1 || null,
            type: 'FA2 · Open edition',
            totalMinted: visitNounsSupply?.totalMinted ?? null,
            distinctTokenIds: visitNounsSupply?.distinctTokenIds ?? null,
            maxHoldersPerToken: visitNounsSupply?.maxHolders ?? null,
            supplyCap: null,
            mintPriceMutez: 0,
            marketplace: visitNounsKt1 ? `https://objkt.com/collection/${visitNounsKt1}` : null,
            tzkt: visitNounsKt1 ? `https://tzkt.io/${visitNounsKt1}` : null,
            supplyError: visitNounsError,
          },
        ],
      },
      listedMarket: {
        contract: (market as any).contract,
        total: marketTokens.length,
        listedCount: listedTokens.length,
        updatedAt: (market as any).updatedAt,
        tokens: listedTokens.map((t: any) => ({
          tokenId: t.tokenId,
          name: t.name,
          supply: t.supply,
          amountLeft: t.amountLeft,
          priceMutez: t.priceMutez ?? null,
          priceXtz: t.priceXtz ?? null,
          artist: t.artist,
          objktUrl: t.objktUrl,
          localUrl: `https://pointcast.xyz/collect/${t.tokenId}`,
        })),
      },
      faucet: {
        status: 'design-locked-pending-origination',
        blocks: faucetBlocks.map((b) => ({
          id: b.data.id,
          url: `https://pointcast.xyz/b/${b.data.id}`,
          channel: b.data.channel,
          title: b.data.title,
          dek: b.data.dek,
          timestamp: b.data.timestamp.toISOString(),
          noun: (b.data as any).noun ?? null,
          edition: b.data.edition ?? null,
        })),
      },
      planned: {
        DRUM: {
          contract: drumTokenKt1 || null,
          status: 'contract-written-awaiting-compile',
          spec: 'https://pointcast.xyz/docs/pm-briefs/2026-04-17-drum-token-integration.md',
          source: 'contracts/v2/drum_token.py',
          type: 'FA1.2 · signed-voucher claim',
        },
        PrizeCast: {
          contract: prizeCastKt1 || null,
          status: 'contract-written-awaiting-compile',
          spec: 'https://pointcast.xyz/docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md',
          source: 'contracts/v2/prize_cast.py',
          type: 'No-loss prize-linked savings (PoolTogether-flavored)',
          drawDay: 'Sunday 18:00 UTC',
        },
        PassportStamps: {
          ...PASSPORT_STAMP_COLLECTION,
          currentCompanion: PASSPORT_COMPANION_COLLECTION,
          spec: `https://pointcast.xyz${PASSPORT_STAMP_PRD_PATH}`,
          metadataPattern: 'https://pointcast.xyz/passport/stamps/{slug}.json',
          artPattern: 'https://pointcast.xyz/passport/art/{slug}.svg',
          type: 'FA2 · Station passport stamps',
        },
      },
      mintBlocks: mintBlocks.map((b) => ({
        id: b.data.id,
        url: `https://pointcast.xyz/b/${b.data.id}`,
        title: b.data.title,
        edition: b.data.edition ?? null,
      })),
    },
    agentSurfaces: {
      human: 'https://pointcast.xyz/editions',
      forAgents: 'https://pointcast.xyz/for-agents',
      blocksFlat: 'https://pointcast.xyz/blocks.json',
      archive: 'https://pointcast.xyz/archive.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
