import type { APIRoute } from 'astro';
import { BLOCK_ID, PAGE_PATH, receipt, ruleCount, slides } from '../../data/publish-audit-2026-10-19.mjs';

export const GET: APIRoute = () => {
  const body = {
    id: 'publish-audit-2026-10-19',
    title: 'Oct 19: every merge is live',
    block: BLOCK_ID,
    path: PAGE_PATH,
    url: `https://pointcast.xyz${PAGE_PATH}`,
    blockUrl: `https://pointcast.xyz/b/${BLOCK_ID}`,
    receipt,
    ruleCount,
    slides: slides.map((slide, index) => ({
      n: index + 1,
      id: slide.id,
      kind: slide.kind,
      kicker: slide.kicker,
      title: slide.title,
      lede: slide.lede ?? null,
      lines: slide.lines ?? [],
      chips: slide.chips ?? [],
    })),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
