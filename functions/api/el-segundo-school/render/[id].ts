interface Env {
  PC_STUDIO_KV?: KVNamespace;
}

type Composition = {
  id: string;
  kind: 'postcard' | 'stamp';
  workId: string;
  title: string;
  message: string;
  credit: string;
  accent: string;
  crop: number;
  shape: 'rectangle' | 'rounded' | 'circle';
};

const PALETTES: Record<string, { ink: string; paper: string; accent: string }> = {
  acid: { ink: '#11120f', paper: '#f1efe5', accent: '#caff24' },
  blue: { ink: '#f1efe5', paper: '#0826d6', accent: '#caff24' },
  red: { ink: '#11120f', paper: '#fa4428', accent: '#f1efe5' },
  paper: { ink: '#11120f', paper: '#f1efe5', accent: '#0826d6' },
  black: { ink: '#f1efe5', paper: '#11120f', accent: '#fa4428' },
};

function escape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character] || character);
}

function error(status: number) {
  return new Response(status === 404 ? 'Not found' : 'Composition storage unavailable', {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  if (!env.PC_STUDIO_KV) return error(503);
  const id = String(params.id || '').replace(/\.svg$/i, '');
  if (!/^[0-9a-f]{24}$/.test(id)) return error(404);
  const composition = await env.PC_STUDIO_KV.get(`ess:composition:${id}`, 'json') as Composition | null;
  if (!composition) return error(404);

  const palette = PALETTES[composition.accent] || PALETTES.acid;
  const image = `https://el-segundo-school-archive.pages.dev/display/${composition.workId}.webp`;
  const stamp = composition.kind === 'stamp';
  const width = stamp ? 1200 : 1800;
  const height = 1200;
  const radius = composition.shape === 'circle' ? 600 : composition.shape === 'rounded' ? 76 : 0;
  const clip = composition.shape === 'circle'
    ? '<circle cx="600" cy="600" r="570"/>'
    : `<rect x="30" y="30" width="${width - 60}" height="1140" rx="${radius}"/>`;
  const x = stamp ? 90 : 82;
  const textWidth = stamp ? 1020 : 580;
  const imageX = stamp ? 70 : 720;
  const imageWidth = stamp ? 1060 : 1020;
  const imageHeight = stamp ? 820 : 1036;
  const imageY = stamp ? 70 : 82;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(composition.title)}">
  <defs><clipPath id="shape">${clip}</clipPath></defs>
  <g clip-path="url(#shape)">
    <rect width="100%" height="100%" fill="${palette.paper}"/>
    <image href="${image}" x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}" preserveAspectRatio="xMidY${composition.crop < 34 ? 'Min' : composition.crop > 66 ? 'Max' : 'Mid'} slice"/>
    <rect x="${x}" y="${stamp ? 920 : 82}" width="${textWidth}" height="${stamp ? 190 : 1036}" fill="${stamp ? palette.paper : palette.accent}"/>
    <text x="${x + 30}" y="${stamp ? 986 : 158}" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="${stamp ? 42 : 34}" font-weight="700" letter-spacing="3">${escape(composition.title.toUpperCase())}</text>
    <foreignObject x="${x + 30}" y="${stamp ? 1015 : 215}" width="${textWidth - 60}" height="${stamp ? 65 : 650}"><div xmlns="http://www.w3.org/1999/xhtml" style="font: ${stamp ? 28 : 58}px/1.08 Georgia,serif;color:${palette.ink};overflow-wrap:anywhere">${escape(composition.message)}</div></foreignObject>
    <text x="${x + 30}" y="${stamp ? 1080 : 1060}" fill="${palette.ink}" font-family="monospace" font-size="20" letter-spacing="2">${escape(composition.credit.toUpperCase())}</text>
    <text x="${width - 60}" y="${height - 44}" text-anchor="end" fill="${palette.ink}" font-family="monospace" font-size="18">POINTCAST · TEZOS MAINNET · ${id}</text>
  </g>
  <path d="M30 30H${width - 30}V1170H30Z" fill="none" stroke="${palette.accent}" stroke-width="12" stroke-dasharray="8 14"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
      'content-security-policy': "default-src 'none'; img-src https://el-segundo-school-archive.pages.dev; style-src 'unsafe-inline'",
      'x-content-type-options': 'nosniff',
    },
  });
};
