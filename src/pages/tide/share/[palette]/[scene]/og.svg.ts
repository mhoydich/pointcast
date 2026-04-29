/**
 * /tide/share/[palette]/[scene]/og.svg — bare SVG used as the
 * og:image and twitter:image for the matching share card.
 *
 * SVG og:image is fine on Twitter/X, Discord, Slack. Facebook
 * does not render SVG — accepted cost for a static SSR build
 * (no canvas rasterizer needed).
 */
import type { APIRoute } from 'astro';

type Palette = {
  id: string; name: string;
  sky: string; water: string; foam: string; orb: string;
  wave1: string; wave2: string; wave3: string;
  dark: boolean; dek: string;
};

const PALETTES: Palette[] = [
  { id:'daybreak',  name:'DAYBREAK',  sky:'#FFD4C2', water:'#F4A78D', foam:'#FFE9D8', orb:'#FFB496', wave1:'#E08F73', wave2:'#C4715A', wave3:'#AA5443', dark:false, dek:'pearl pink' },
  { id:'crystal',   name:'CRYSTAL',   sky:'#BFEFEC', water:'#7FE5DC', foam:'#F4FBFA', orb:'#FFFFFF', wave1:'#5DCBC0', wave2:'#3FA89C', wave3:'#1F8579', dark:false, dek:'aquamarine' },
  { id:'kelp',      name:'KELP',      sky:'#9FB28A', water:'#5C7A4E', foam:'#E0D4B8', orb:'#D9C46E', wave1:'#3F5E33', wave2:'#2A4424', wave3:'#1A2E18', dark:false, dek:'sage' },
  { id:'coral',     name:'CORAL',     sky:'#FFC4B0', water:'#FF8675', foam:'#FFE0D6', orb:'#FFEEC2', wave1:'#E76B5C', wave2:'#C4493D', wave3:'#9B2D24', dark:false, dek:'coral pink' },
  { id:'abyss',     name:'ABYSS',     sky:'#1E2D5C', water:'#0A1F3A', foam:'#2EC4B6', orb:'#88E0D4', wave1:'#0E2548', wave2:'#06162D', wave3:'#020912', dark:true,  dek:'midnight indigo' },
  { id:'storm',     name:'STORM',     sky:'#5A6470', water:'#2C2E33', foam:'#FFE15D', orb:'#FFE15D', wave1:'#1E2025', wave2:'#16181C', wave3:'#0C0E12', dark:true,  dek:'slate' },
  { id:'lagoon',    name:'LAGOON',    sky:'#A0E6DC', water:'#2EC4B6', foam:'#F5DEA8', orb:'#F5DEA8', wave1:'#26A89C', wave2:'#188076', wave3:'#0F5C55', dark:false, dek:'turquoise' },
  { id:'nighttide', name:'NIGHTTIDE', sky:'#3A0E5C', water:'#0E1845', foam:'#FF1493', orb:'#FF69B4', wave1:'#3D1276', wave2:'#1F1054', wave3:'#0A0830', dark:true,  dek:'electric magenta' },
];

const SCENES = ['waves', 'starfield', 'mystify', 'bounce', 'pipes', 'tessellate'];

export function getStaticPaths() {
  const PIDS = ['daybreak', 'crystal', 'kelp', 'coral', 'abyss', 'storm', 'lagoon', 'nighttide'];
  const SIDS = ['waves', 'starfield', 'mystify', 'bounce', 'pipes', 'tessellate'];
  const out: Array<{ params: { palette: string; scene: string } }> = [];
  for (const p of PIDS) for (const s of SIDS) {
    out.push({ params: { palette: p, scene: s } });
  }
  return out;
}

function det(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const W = 1200, H = 630;

function renderScene(p: Palette, sceneId: string): string {
  const lineColors = [p.foam, p.orb, p.wave1, p.wave2];
  const seed = (PALETTES.indexOf(p) * 7 + SCENES.indexOf(sceneId) * 13) + 1;

  if (sceneId === 'waves') {
    return `
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${p.sky}"/><stop offset="100%" stop-color="${p.water}"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>
      <circle cx="940" cy="170" r="86" fill="${p.orb}" opacity="0.85"/>
      <path d="M 0 400 C 300 340, 600 480, 900 400 S 1200 360, 1200 400 L 1200 ${H} L 0 ${H} Z" fill="${p.wave1}" opacity="0.55"/>
      <path d="M 0 480 C 300 420, 600 540, 900 480 S 1200 440, 1200 480 L 1200 ${H} L 0 ${H} Z" fill="${p.wave2}" opacity="0.78"/>
      <path d="M 0 560 C 300 500, 600 600, 900 560 S 1200 520, 1200 560 L 1200 ${H} L 0 ${H} Z" fill="${p.wave3}"/>
    `;
  }
  if (sceneId === 'starfield') {
    let dots = '';
    for (let i = 0; i < 60; i++) {
      const x = det(i + 1) * W;
      const y = det(i + 100) * H;
      const r = 1 + det(i + 200) * 3.0;
      const c = det(i + 300);
      const fill = c < 0.34 ? p.foam : c < 0.67 ? p.orb : p.wave1;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${fill}" opacity="${(0.55 + r * 0.06).toFixed(2)}"/>`;
    }
    return `
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${p.sky}"/><stop offset="100%" stop-color="${p.water}"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>${dots}
    `;
  }
  if (sceneId === 'mystify') {
    const lines = [
      '120,200 280,440 480,220 760,540 980,320',
      '60,420 320,100 540,580 780,200 1140,480',
      '220,540 480,180 660,420 880,100 1100,540',
      '120,240 320,480 560,100 800,400 1080,140',
    ];
    let polys = '';
    lines.forEach((pts, li) => {
      polys += `<polyline points="${pts}" stroke="${lineColors[li % lineColors.length]}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"/>`;
    });
    return `<rect width="${W}" height="${H}" fill="${p.dark ? '#04060a' : p.wave3}"/>${polys}`;
  }
  if (sceneId === 'bounce') {
    return `
      <rect width="${W}" height="${H}" fill="${p.dark ? '#04060a' : p.wave3}"/>
      <rect x="380" y="240" width="440" height="160" rx="14" fill="${p.foam}" opacity="0.94"/>
      <text x="600" y="350" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="86" letter-spacing="14" fill="#0c0e12">TIDE</text>
    `;
  }
  if (sceneId === 'pipes') {
    const cell = 56, cols = 22, rows = 12;
    let x = Math.floor(det(seed) * cols);
    let y = Math.floor(det(seed + 1) * rows);
    let d = Math.floor(det(seed + 2) * 4);
    let ci = 0;
    let segs = '';
    for (let i = 0; i < 38; i++) {
      let nx = x, ny = y;
      if (d === 0) ny--; else if (d === 1) nx++; else if (d === 2) ny++; else nx--;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
        d = (d + 2) % 4; ci = (ci + 1) % 4; continue;
      }
      const x0 = x*cell+cell/2, y0 = y*cell+cell/2;
      const x1 = nx*cell+cell/2, y1 = ny*cell+cell/2;
      segs += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${lineColors[ci]}" stroke-width="14" stroke-linecap="round"/>`;
      x = nx; y = ny;
      if (det(seed + 10 + i) < 0.18) {
        d = (d + (det(seed + 20 + i) < 0.5 ? 1 : 3)) % 4;
        ci = (ci + 1) % 4;
      }
    }
    return `<rect width="${W}" height="${H}" fill="#04060a"/>${segs}`;
  }
  if (sceneId === 'tessellate') {
    const size = 38;
    const hexW = size * 2;
    const hexH = size * Math.sqrt(3);
    const dx = hexW * 0.75;
    const cols = Math.ceil(W / dx) + 1;
    const rows = Math.ceil(H / hexH) + 1;
    const swatch = [p.foam, p.orb, p.wave1, p.wave2];
    let tiles = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * dx;
        const cy = r * hexH + (c % 2 === 0 ? 0 : hexH / 2);
        const slot = Math.floor(det(seed + c * 17 + r * 31) * 4);
        const points: string[] = [];
        for (let v = 0; v < 6; v++) {
          const ang = (Math.PI / 3) * v;
          points.push(`${(cx + size * Math.cos(ang)).toFixed(1)},${(cy + size * Math.sin(ang)).toFixed(1)}`);
        }
        tiles += `<polygon points="${points.join(' ')}" fill="${swatch[slot]}" fill-opacity="0.7" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>`;
      }
    }
    return `<rect width="${W}" height="${H}" fill="${p.dark ? '#04060a' : p.wave3}"/>${tiles}`;
  }
  return `<rect width="${W}" height="${H}" fill="${p.water}"/>`;
}

export const GET: APIRoute = async ({ params }) => {
  const paletteId = String(params.palette ?? '');
  const sceneId = String(params.scene ?? '');
  const p = PALETTES.find((x) => x.id === paletteId);
  if (!p || !SCENES.includes(sceneId)) return new Response('not found', { status: 404 });
  const labelColor = p.dark ? '#ffffff' : '#0c0e12';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  ${renderScene(p, sceneId)}
  <text x="48" y="62" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="700" font-size="22" letter-spacing="3" fill="${labelColor}" opacity="0.88">/TIDE</text>
  <text x="${W - 48}" y="62" text-anchor="end" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="700" font-size="22" letter-spacing="3" fill="${labelColor}" opacity="0.88">${p.name} · ${sceneId.toUpperCase()}</text>
  <text x="${W - 48}" y="${H - 36}" text-anchor="end" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="500" font-size="14" letter-spacing="2" fill="${labelColor}" opacity="0.65">pointcast.xyz/tide</text>
</svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
};
