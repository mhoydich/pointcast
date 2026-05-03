import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { APIRoute } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import {
  getMiniShrineDescription,
  getShrineSet,
  UNFURL_SHRINES,
  type UnfurlShrine,
} from '../../../lib/unfurl-shrines';

export function getStaticPaths() {
  return UNFURL_SHRINES.map((shrine) => ({
    params: { slug: shrine.slug },
    props: { shrine },
  }));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function imageDataUri(publicPath: string) {
  const safePath = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  const fullPath = join(process.cwd(), 'public', safePath);
  if (!existsSync(fullPath)) return '';

  const ext = extname(fullPath).toLowerCase();
  const mime =
    ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.svg'
          ? 'image/svg+xml'
          : 'image/png';

  return `data:${mime};base64,${readFileSync(fullPath).toString('base64')}`;
}

function wrapText(value: string, maxChars: number, maxLines: number) {
  const words = value.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }

    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]$/, '')}...`;
  }

  return lines;
}

function textLines(lines: string[], x: number, y: number, lineHeight: number, className: string) {
  return lines
    .map((line, index) => `<text class="${className}" x="${x}" y="${y + index * lineHeight}">${escapeXml(line)}</text>`)
    .join('');
}

function shrineSvg(shrine: UnfurlShrine) {
  const shrineSet = getShrineSet(shrine.slug);
  const background = imageDataUri(shrineSet?.background ?? shrine.image);
  const titleLines = wrapText(shrine.title.replace('—', ''), 14, 3);
  const descriptionLines = wrapText(getMiniShrineDescription(shrine), 48, 2);
  const audienceLines = wrapText(shrine.audience, 58, 1);
  const ritualLines = wrapText(shrine.ritual, 64, 1);
  const setTitle = shrineSet?.title ?? 'URL shrine';
  const routeTitleLines = wrapText(shrine.title.replace('—', ''), 24, 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <clipPath id="route"><rect x="94" y="132" width="452" height="238" rx="10"/></clipPath>
    <clipPath id="grain"><rect width="1200" height="630" rx="0"/></clipPath>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000000" flood-opacity="0.34"/>
    </filter>
    <linearGradient id="wash" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#fff7e3" stop-opacity="0.18"/>
      <stop offset="0.47" stop-color="#8f5a38" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#11100c" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="#17140f"/>
  ${background ? `<image href="${background}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>` : ''}
  <rect width="1200" height="630" fill="#17140f" opacity="0.34"/>
  <rect width="1200" height="630" fill="url(#wash)"/>
  <g opacity="0.2" clip-path="url(#grain)">
    <path d="M76 524C162 467 222 476 315 498C424 524 492 513 560 454C638 385 724 371 807 408C903 451 981 428 1089 334" fill="none" stroke="#f6d08c" stroke-width="2"/>
    <path d="M24 121C116 82 204 101 285 148C376 200 438 196 512 158C599 113 687 123 760 174C849 236 940 239 1100 172" fill="none" stroke="#e58f61" stroke-width="2"/>
  </g>

  <g filter="url(#shadow)">
    <rect x="64" y="72" width="1072" height="486" rx="22" fill="#17140f" opacity="0.78"/>
    <rect x="64" y="72" width="1072" height="486" rx="22" fill="#fffaf0" opacity="0.1"/>
    <rect x="64" y="72" width="1072" height="486" rx="22" fill="none" stroke="#fff4d9" stroke-opacity="0.34" stroke-width="1.5"/>
  </g>

  <g>
    <text class="mono amber" x="94" y="108">POINTCAST MINI URL SHRINE</text>
    <rect x="94" y="132" width="452" height="238" rx="10" fill="#f7f1e4"/>
    <rect x="94" y="132" width="10" height="238" fill="#a14024" clip-path="url(#route)"/>
    <text class="route-mono" x="128" y="170">POINTCAST.XYZ${escapeXml(shrine.path)}</text>
    ${textLines(routeTitleLines, 128, 226, 45, 'route-title')}
    <text class="route-body" x="128" y="328">${escapeXml(shrine.kind)} unfurl card</text>
    <rect x="94" y="132" width="452" height="238" rx="10" fill="none" stroke="#fff8e8" stroke-opacity="0.45" stroke-width="1.5"/>

    <g transform="translate(94 408)">
      <circle cx="17" cy="17" r="10" fill="#f6b466"/>
      <circle cx="54" cy="17" r="10" fill="#b7c389"/>
      <circle cx="91" cy="17" r="10" fill="#d87652"/>
      <rect x="126" y="8" width="192" height="18" rx="9" fill="#fff8e8" opacity="0.2"/>
      <rect x="0" y="52" width="414" height="1" fill="#fff8e8" opacity="0.26"/>
      <text class="small" x="0" y="91">target ${escapeXml(shrine.path)}</text>
      <text class="small" x="0" y="126">kind ${escapeXml(shrine.kind)}</text>
    </g>
  </g>

  <g>
    <text class="mono amber" x="610" y="112">${escapeXml(setTitle)} / ${escapeXml(shrine.kind)}</text>
    ${textLines(titleLines, 610, 184, 76, 'title')}
    ${textLines(descriptionLines, 614, 356, 33, 'body')}

    <g transform="translate(614 454)">
      <text class="mono label" x="0" y="0">AUDIENCE</text>
      ${textLines(audienceLines, 0, 32, 24, 'note')}
      <text class="mono label" x="0" y="68">RITUAL</text>
      ${textLines(ritualLines, 0, 96, 24, 'note')}
    </g>
  </g>

  <style>
    text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #fff8e8; letter-spacing: 0; }
    .mono { font-family: "SF Mono", "IBM Plex Mono", ui-monospace, monospace; font-size: 17px; letter-spacing: 1.8px; font-weight: 700; }
    .amber { fill: #f6b466; }
    .title { font-size: 58px; font-weight: 540; line-height: 1; }
    .body { font-size: 25px; fill: rgba(255, 248, 232, 0.84); }
    .small { font-size: 21px; fill: rgba(255, 248, 232, 0.78); }
    .label { font-size: 14px; fill: #f6b466; }
    .note { font-size: 19px; fill: rgba(255, 248, 232, 0.9); }
    .route-mono { font-family: "SF Mono", ui-monospace, monospace; font-size: 17px; fill: #6b2d1e; letter-spacing: 1.7px; }
    .route-title { font-size: 39px; font-weight: 620; fill: #14120e; }
    .route-body { font-size: 22px; fill: #4c4943; }
  </style>
</svg>`;
}

export const GET: APIRoute = async ({ props }) => {
  const shrine = props.shrine as UnfurlShrine;
  const renderer = new Resvg(shrineSvg(shrine), {
    background: '#17140f',
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true },
  });
  const png = renderer.render().asPng();

  return new Response(png, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
