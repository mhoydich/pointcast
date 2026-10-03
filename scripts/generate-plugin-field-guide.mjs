import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { guideMarkdown } from '../src/lib/plugin-field-guide.mjs';

const guide = JSON.parse(await readFile(new URL('../src/data/plugin-field-guide.json', import.meta.url), 'utf8'));
const destination = new URL('../docs/field-guides/2026-10-03-plugin-field-guide.md', import.meta.url);
await mkdir(fileURLToPath(new URL('.', destination)), { recursive: true });
await writeFile(destination, guideMarkdown(guide));
console.log('Generated docs/field-guides/2026-10-03-plugin-field-guide.md');
