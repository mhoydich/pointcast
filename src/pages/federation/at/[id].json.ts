/**
 * /federation/at/{block_id}.json — Phase 1 toe-in.
 *
 * For any published block id, return the AT Protocol Lexicon
 * record that block would publish under `xyz.pointcast.block`,
 * plus the at:// URI it would inhabit on a notional PointCast PDS.
 *
 * No DID issuance yet. No signing. No firehose. The DID is a
 * deterministic placeholder (`did:plc:pointcast-el-segundo-spike`)
 * so the URIs are stable across builds and a future Phase 1
 * commit can swap one constant.
 *
 * Companion to:
 *   - /federation/preview (visible page using same logic)
 *   - scripts/roundtrip-blocks.mjs (CLI mirror)
 *   - RFC 0004 (Lexicon definition)
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  blockToLexiconRecord,
  blockAtUri,
  roundTrip,
  type Block,
} from '../../../lib/lexicon/block-to-lexicon';

const PHASE_0_PLACEHOLDER_DID = 'did:plc:pointcast-el-segundo-spike';

export async function getStaticPaths() {
  const all = await getCollection('blocks', ({ data }) => !data.draft);
  return all.map((entry) => ({
    params: { id: entry.data.id },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const id = String(params.id ?? '');
  if (!id) return new Response('not found', { status: 404 });

  const all = await getCollection('blocks', ({ data }) => !data.draft);
  const entry = all.find((e) => e.data.id === id);
  if (!entry) {
    return new Response(JSON.stringify({ error: 'block not found', id }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const block: Block = {
    ...(entry.data as unknown as Block),
    timestamp:
      entry.data.timestamp instanceof Date
        ? entry.data.timestamp.toISOString()
        : String(entry.data.timestamp),
  };

  const record = blockToLexiconRecord(block);
  const rt = roundTrip(block);
  const uri = blockAtUri(PHASE_0_PLACEHOLDER_DID, block.id);

  const body = {
    surface: '/federation/at/{block_id}',
    note: 'Phase 0 spike. The DID is a stable placeholder; no signing, no DID-PLC operation, no firehose. A Phase 1 commit swaps one constant.',
    block: { id: block.id, title: block.title, channel: block.channel, type: block.type, source: 'https://pointcast.xyz/b/' + block.id },
    atProto: {
      did: PHASE_0_PLACEHOLDER_DID,
      collection: 'xyz.pointcast.block',
      rkey: block.id,
      uri: uri,
    },
    record,
    roundTrip: {
      lossless: rt.lossless,
      driftPaths: rt.drift,
      note: rt.lossless
        ? 'Block round-trips losslessly through the converter.'
        : 'Block has drift on fields the Lexicon does not yet carry. See docs/notes/2026-04-29-roundtrip-drift-findings.md.',
    },
    related: {
      '/federation/preview': 'visible Block ↔ Lexicon page with full-corpus stats',
      'docs/rfcs/0004-pointcast-block-lexicon.md': 'the Lexicon RFC',
      'docs/rfcs/0005-pointcast-talk-lexicon.md': 'companion Talk Lexicon RFC',
      'scripts/roundtrip-blocks.mjs': 'CLI mirror — npm run audit:lexicon',
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
