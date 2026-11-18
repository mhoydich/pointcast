import type { APIRoute } from 'astro';
import { join } from 'node:path';
import sharp from 'sharp';
import { ads } from '../../../../lib/ad-department/registry';

export function getStaticPaths() {
  return ads.map(({ slug, title, art }) => ({ params: { slug }, props: { title, art } }));
}

const paper = '#f6f1e7';
const ink = '#211e19';
const fontfile = join(process.cwd(), 'src/assets/currency-builder/fonts/BodoniModa-opsz-wght.ttf');

function type(text: string, font: string, width: number, height?: number) {
  const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return sharp({ text: {
    text: `<span foreground="${ink}">${escaped}</span>`, font, fontfile, width, height,
    spacing: -18, wrap: 'word-char', rgba: true,
  } }).png().toBuffer({ resolveWithObject: true });
}

export const GET: APIRoute = async ({ props }) => {
  const { title, art } = props;
  let headline = await type(title, 'Bodoni Moda Medium 72 @opsz=11,wght=520', 525);
  if (headline.info.height > 396) headline = await type(title, 'Bodoni Moda Medium 72 @opsz=11,wght=520', 525, 396);
  const masthead = await type('PointCast Ad Department', 'Bodoni Moda Bold 26 @opsz=10,wght=650', 520);
  const picture = await sharp(join(process.cwd(), 'public', art), { density: 144 })
    .resize(520, 550, { fit: 'contain', background: '#0000' })
    .png().toBuffer();

  const sheet = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="${paper}"/>
    <rect x="624" width="576" height="630" fill="#d5d7e1"/>
    <rect x="44" y="88" width="532" height="2" fill="${ink}"/>
  </svg>`);
  const png = await sharp(sheet).composite([
    { input: masthead.data, left: 44, top: 40 },
    { input: headline.data, left: 44, top: Math.round(343 - headline.info.height / 2) },
    { input: picture, left: 652, top: 40 },
  ]).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
