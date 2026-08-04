import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = new URL('../public/beach-commons/v18/shrines/og.svg', import.meta.url);
const target = new URL('../public/beach-commons/v18/shrines/og.png', import.meta.url);
const svg = await readFile(source);
await sharp(svg, { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 }).toFile(fileURLToPath(target));
console.log('Generated public/beach-commons/v18/shrines/og.png');
