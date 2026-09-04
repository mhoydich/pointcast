import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://pointcast.xyz';

function functionServes(segments, functionsDir, directory = functionsDir, index = 0) {
  if (!existsSync(directory)) return false;
  if (index === segments.length) return existsSync(join(directory, 'index.ts'));

  const segment = segments[index];
  if (existsSync(join(directory, `${segment}.ts`)) && index === segments.length - 1) return true;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const dynamicDirectory = /^\[\.\.\..+\]$/.test(entry.name) || /^\[[^\]]+\]$/.test(entry.name);
    const dynamicFile = /^\[\.\.\..+\]\.ts$/.test(entry.name) || /^\[[^\]]+\]\.ts$/.test(entry.name);
    if (entry.isFile() && index === segments.length - 1 && dynamicFile) return true;
    if (entry.isDirectory() && (entry.name === segment || dynamicDirectory) && functionServes(segments, functionsDir, join(directory, entry.name), index + 1)) return true;
  }
  return false;
}

export function sameOriginPathExists(pathname, { distDir, publicDir, functionsDir }) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (existsSync(join(distDir, clean)) || existsSync(join(publicDir, clean))) return true;
  return functionServes(clean.split('/').filter(Boolean), functionsDir);
}

export function ogAssetExists(href, roots) {
  if (!href || href.startsWith('data:')) return Boolean(href);
  try {
    const url = new URL(href, ORIGIN);
    return url.origin !== ORIGIN || sameOriginPathExists(url.pathname, roots);
  } catch {
    return false;
  }
}

export function routeExists(href, roots) {
  try {
    const url = new URL(href, ORIGIN);
    if (url.origin !== ORIGIN) return true;
    const clean = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, '');
    if (!clean) return existsSync(join(roots.distDir, 'index.html')) || existsSync(join(roots.publicDir, 'index.html'));
    if (sameOriginPathExists(url.pathname, roots)) return true;
    return existsSync(join(roots.distDir, clean, 'index.html')) || existsSync(join(roots.publicDir, clean, 'index.html'));
  } catch {
    return false;
  }
}
