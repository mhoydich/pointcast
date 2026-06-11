/**
 * Ships counter for the homepage status bar.
 *
 * "A ship" = a PR merged to main, recognized by the squash-merge subject
 * suffix "(#123)". Derived from git history at build time so the number is
 * true on every deploy with zero hand-curation — src/data/recent-ships.json
 * went stale within days of every manual update (last touch 2026-05-09).
 * The JSON stays as the fallback when git isn't available (e.g. a shallow
 * CI clone) and as the curated story list for any surface that wants prose.
 */
import { execSync } from 'node:child_process';
import shipsData from '../data/recent-ships.json';

export function shipsLastDays(days = 7): number {
  try {
    const out = execSync(`git log --since="${days} days ago" --pretty=%s`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\n').filter((s) => /\(#\d+\)\s*$/.test(s)).length;
  } catch {
    const ships = (shipsData as { ships: { at: string }[] }).ships;
    const cutoff = Date.now() - days * 86_400_000;
    return ships.filter((s) => +new Date(s.at) >= cutoff).length;
  }
}
