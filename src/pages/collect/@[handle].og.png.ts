import type { APIRoute } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import { listPublicCollectors, type PublicCollector } from '../../lib/collect-public';

export async function getStaticPaths() {
  const collectors = await listPublicCollectors();
  return collectors.map((collector) => ({ params: { handle: collector.handle }, props: { collector } }));
}

function xml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export const GET: APIRoute = ({ props }) => {
  const collector = props.collector as PublicCollector;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f6efe5"/><rect x="42" y="42" width="1116" height="546" fill="#fff" stroke="#185fa5" stroke-width="4"/><text x="78" y="100" fill="#185fa5" font-family="monospace" font-size="18" letter-spacing="4">POINTCAST · PUBLIC COLLECTOR</text><text x="72" y="278" fill="#171717" font-family="Arial,sans-serif" font-size="106" font-weight="600" letter-spacing="-6">@${xml(collector.handle)}</text><line x1="76" y1="334" x2="1124" y2="334" stroke="#171717" stroke-width="3"/><text x="78" y="392" fill="#171717" font-family="monospace" font-size="24">DOGS ${collector.counts.dogs} / 30</text><text x="430" y="392" fill="#171717" font-family="monospace" font-size="24">STREAK ${collector.streak}</text><text x="730" y="392" fill="#171717" font-family="monospace" font-size="24">SEALS ${collector.counts.seals}</text><g transform="translate(78 448)">${Array.from({length:30},(_,index)=>`<rect x="${index*34}" y="0" width="24" height="64" fill="${collector.claimedDays.includes(index+1)?'#8a2432':'#e3ddd4'}"/>`).join('')}</g><text x="78" y="558" fill="#185fa5" font-family="monospace" font-size="17" letter-spacing="3">COLLECT A DOG A DAY · FREE</text></svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } }).render().asPng();
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } });
};

