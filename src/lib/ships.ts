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

export interface Ship { num: number; subject: string; iso: string }

/**
 * Ships for the homepage hero — today's merged PRs (PT), newest first.
 * Falls back to the most recent day that had ships (within 3 days) so the
 * hero never renders empty at 00:05 PT; returns null when git is missing
 * or nothing shipped recently, and the hero section hides itself.
 */
export function shipsForHero(): { day: string; ships: Ship[] } | null {
  let lines: string[] = [];
  try {
    lines = execSync('git log --since="3 days ago" --pretty="%cI|%s"', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).split('\n').filter(Boolean);
  } catch {
    return null;
  }
  const ptDay = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(iso));
  const byDay = new Map<string, Ship[]>();
  for (const line of lines) {
    const sep = line.indexOf('|');
    if (sep < 0) continue;
    const iso = line.slice(0, sep);
    const subject = line.slice(sep + 1);
    const m = subject.match(/\(#(\d+)\)\s*$/);
    if (!m) continue;
    const day = ptDay(iso);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push({ num: Number(m[1]), subject, iso });
  }
  if (byDay.size === 0) return null;
  const day = [...byDay.keys()].sort().pop()!;
  return { day, ships: byDay.get(day)! };
}

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
