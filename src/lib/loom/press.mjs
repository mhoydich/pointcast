import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function reportLink(sketchesDirectory, slug, draftUrl) {
  const published = existsSync(join(sketchesDirectory, slug, 'index.html'));
  return { href: published ? '/sketches/' + slug + '/' : draftUrl, published };
}
