/**
 * Render an original Nouns portrait from the official CC0 trait bytes.
 *
 * Image data: public/images/nouns-money/source-100/sources/official-image-data.json
 * Provenance for that file cites nouns-monorepo packages/nouns-assets image-data.json
 * (CC0). Decode and rect placement match nouns-sdk svg-builder.ts:
 * https://github.com/nounsDAO/nouns-monorepo/blob/master/packages/nouns-sdk/src/image/svg-builder.ts
 *
 * Combinations and names are ours. These are not numbered on-chain Nouns.
 */
import { readFileSync } from 'node:fs';

const imageData = JSON.parse(
  readFileSync(
    new URL('../../public/images/nouns-money/source-100/sources/official-image-data.json', import.meta.url),
    'utf8',
  ),
);

export const NOUNS_ART = {
  license: 'CC0',
  credit: 'Nouns art is CC0',
  imageData: 'public/images/nouns-money/source-100/sources/official-image-data.json',
  upstream: 'https://github.com/nounsDAO/nouns-monorepo/blob/master/packages/nouns-assets/src/image-data.json',
  renderer: 'https://github.com/nounsDAO/nouns-monorepo/blob/master/packages/nouns-sdk/src/image/svg-builder.ts',
};

const BACKGROUNDS = {
  cool: 'd5d7e1',
  warm: 'e1d7d5',
};

function decodeImage(image) {
  const data = image.replace(/^0x/, '');
  const paletteIndex = parseInt(data.substring(0, 2), 16);
  const bounds = {
    top: parseInt(data.substring(2, 4), 16),
    right: parseInt(data.substring(4, 6), 16),
    bottom: parseInt(data.substring(6, 8), 16),
    left: parseInt(data.substring(8, 10), 16),
  };
  const rects = data.substring(10);
  return {
    paletteIndex,
    bounds,
    rects: rects.match(/.{1,4}/g)?.map((rect) => [
      parseInt(rect.substring(0, 2), 16),
      parseInt(rect.substring(2, 4), 16),
    ]) ?? [],
  };
}

function getRectLength(currentX, drawLength, rightBound) {
  const remainingPixelsInLine = rightBound - currentX;
  return drawLength <= remainingPixelsInLine ? drawLength : remainingPixelsInLine;
}

function buildSVG(parts, paletteColors, bgColor) {
  const svgWithoutEndTag = parts.reduce((result, part) => {
    const svgRects = [];
    const { bounds, rects } = decodeImage(part.data);
    let currentX = bounds.left;
    let currentY = bounds.top;
    rects.forEach((draw) => {
      let drawLength = draw[0];
      const colorIndex = draw[1];
      const hexColor = paletteColors[colorIndex];
      let length = getRectLength(currentX, drawLength, bounds.right);
      while (length > 0) {
        if (colorIndex !== 0) {
          svgRects.push(
            `<rect width="${length * 10}" height="10" x="${currentX * 10}" y="${currentY * 10}" fill="#${hexColor}" />`,
          );
        }
        currentX += length;
        if (currentX === bounds.right) {
          currentX = bounds.left;
          currentY += 1;
        }
        drawLength -= length;
        length = getRectLength(currentX, drawLength, bounds.right);
      }
    });
    return result + svgRects.join('');
  }, `<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${bgColor ? `#${bgColor}` : 'none'}" />`);
  return `${svgWithoutEndTag}</svg>`;
}

function findPart(list, filename) {
  const part = list.find((item) => item.filename === filename);
  if (!part) throw new Error(`missing official Nouns part: ${filename}`);
  return part;
}

export function traitLabel(filename) {
  return filename.replace(/^(body|accessory|head|glasses)-/, '').replace(/-/g, ' ');
}

export function renderPortrait(parts) {
  if (!parts?.body || !parts?.accessory || !parts?.head || !parts?.glasses || !parts?.background) {
    throw new Error('a portrait needs background, body, accessory, head, and glasses');
  }
  if (!parts.glasses.startsWith('glasses-')) {
    throw new Error(`noggles must be a glasses part, got ${parts.glasses}`);
  }
  const bg = BACKGROUNDS[parts.background];
  if (!bg) throw new Error(`background must be cool or warm, got ${parts.background}`);
  const body = findPart(imageData.images.bodies, parts.body);
  const accessory = findPart(imageData.images.accessories, parts.accessory);
  const head = findPart(imageData.images.heads, parts.head);
  const glasses = findPart(imageData.images.glasses, parts.glasses);
  return {
    svg: buildSVG([body, accessory, head, glasses], imageData.palette, bg),
    traits: {
      background: parts.background,
      body: traitLabel(parts.body),
      accessory: traitLabel(parts.accessory),
      head: traitLabel(parts.head),
      glasses: traitLabel(parts.glasses),
    },
  };
}
