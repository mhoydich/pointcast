/**
 * /reviews/paddles/[id].json — one published take, machine-readable.
 * Schema: pointcast.paddle-reviews/v1 (same schema as /reviews/paddles.json).
 */
import type { APIRoute } from 'astro';
import { AFFILIATE_PROGRAMS } from '../../../data/affiliate-programs';
import { PADDLE_REVIEWS } from '../../../data/paddle-reviews';
import { PADDLES, paddleById, paddleUrl } from '../../../lib/paddle-register';
import { AFFILIATE_PROGRAM_IDS, PAID_LINK_DISCLOSURE, publicAffiliate } from '../../../lib/commerce';
import { publishableTakes, VERDICT_WORDS, type PaddleTake } from '../../../lib/paddle-takes';

const METHOD_URL = 'https://pointcast.xyz/reviews/paddles/method';

function publicTake(take: PaddleTake) {
  const paddle = paddleById(take.paddleId);
  return {
    id: take.id,
    url: `https://pointcast.xyz/reviews/paddles/${take.id}`,
    paddleId: take.paddleId,
    paddleUrl: paddle ? `https://pointcast.xyz${paddleUrl(paddle)}` : null,
    reviewer: take.reviewer,
    thesis: take.thesis,
    wouldChange: take.wouldChange,
    hoursPlayed: take.hoursPlayed,
    tested: { from: take.testedFrom, to: take.testedTo },
    verdict: take.verdict,
    verdictLabel: VERDICT_WORDS[take.verdict],
    record: take.record,
    // Same lock as <PaidLink>: null unless the program is approved and the
    // link resolves paid, and then it carries the disclosure with it.
    affiliate: publicAffiliate(take.affiliate),
    disclosure: take.disclosure,
    publishedAt: take.publishedAt,
  };
}

export function getStaticPaths() {
  const knownIds = PADDLES.map((p) => p.id);
  return publishableTakes(PADDLE_REVIEWS, knownIds, AFFILIATE_PROGRAM_IDS).map((take) => ({ params: { id: take.id }, props: { take } }));
}

export const GET: APIRoute = ({ props }) => {
  const { take } = props as { take: PaddleTake };
  const body = {
    schema: 'pointcast.paddle-reviews/v1',
    review: publicTake(take),
    programs: AFFILIATE_PROGRAMS.map((p) => ({ id: p.id, brand: p.brand, approved: p.approved })),
    disclosure: PAID_LINK_DISCLOSURE,
    method: METHOD_URL,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
