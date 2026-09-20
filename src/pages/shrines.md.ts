import type { APIRoute } from 'astro';
import { absoluteUrl, SHRINE_SETS, UNFURL_SHRINES } from '../lib/unfurl-shrines';

export const GET: APIRoute = async () => {
  const shrinesBySlug = new Map(UNFURL_SHRINES.map((shrine) => [shrine.slug, shrine]));
  const lines = [
    '# PointCast URL shrine sets',
    '',
    'Portable share rituals for PointCast URLs. Each shrine names its audience, the moment to use it, and the routes that prove the link is healthy.',
    '',
    `- Human gallery: ${absoluteUrl('/shrines')}`,
    `- Structured sets: ${absoluteUrl('/shrines.json')}`,
    `- Full unfurl manifest: ${absoluteUrl('/unfurls.json')}`,
    `- Shrine builder: ${absoluteUrl('/unfurls#builder')}`,
    '',
  ];

  for (const set of SHRINE_SETS) {
    lines.push(`## ${set.title}`, '', set.description, '');

    for (const slug of set.slugs) {
      const shrine = shrinesBySlug.get(slug);
      if (!shrine) continue;

      lines.push(
        `### ${shrine.title}`,
        '',
        `- Route: ${absoluteUrl(shrine.path)}`,
        `- Kind: ${shrine.kind}`,
        `- Audience: ${shrine.audience}`,
        `- Ritual: ${shrine.ritual}`,
        `- Proof: ${shrine.proof.map(absoluteUrl).join(', ')}`,
        '',
      );
    }
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      Link: [
        `<${absoluteUrl('/shrines')}>; rel="canonical"; type="text/html"`,
        `<${absoluteUrl('/shrines.json')}>; rel="alternate"; type="application/json"`,
        `<${absoluteUrl('/unfurls.json')}>; rel="related"; type="application/json"`,
      ].join(', '),
    },
  });
};
