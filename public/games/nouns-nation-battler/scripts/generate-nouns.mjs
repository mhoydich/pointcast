import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import imageData from "../../package/dist/image-data.json" with { type: "json" };
import { buildSVG } from "../../nouns-sdk-package/package/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../assets");
const { bodies, accessories, heads, glasses } = imageData.images;
const manifest = {
  source: "Generated from local nouns-assets image-data with official bodies/accessories/heads/glasses and buildSVG().",
  count: 60,
  nouns: [],
};

await fs.mkdir(outDir, { recursive: true });

function getOfficialNounData(seed) {
  return {
    parts: [
      bodies[seed.body],
      accessories[seed.accessory],
      heads[seed.head],
      glasses[seed.glasses],
    ],
    background: imageData.bgcolors[seed.background],
  };
}

for (let i = 0; i < 60; i += 1) {
  const n = i * 37 + 11;
  const seed = {
    background: i % imageData.bgcolors.length,
    body: n % bodies.length,
    accessory: (n * 3 + 17) % accessories.length,
    head: (n * 5 + 23) % heads.length,
    glasses: (n * 7 + 3) % glasses.length,
  };
  const { parts, background } = getOfficialNounData(seed);
  const svg = buildSVG(parts, imageData.palette, background);
  await fs.writeFile(path.join(outDir, `noun-${i}.svg`), svg);
  manifest.nouns.push({ file: `assets/noun-${i}.svg`, seed });
}

await fs.writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
