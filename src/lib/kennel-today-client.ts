/**
 * Repaint a prerendered page with today's Kennel Club sitting.
 *
 * Every Kennel Club surface is built ahead of time, and PointCast deploys by
 * hand, so the markup that ships is only ever a fallback: correct on the day
 * it was built, stale every day after. On load these helpers read
 * /api/kennel-club/today — decided at request time by a Pages Function — and
 * write the real sitting over the baked one.
 *
 * DOM contract (BLOCKS.md rules):
 *   · no element ids, no `for=` — everything is a data-* hook
 *   · listeners are document-level so ClientRouter view transitions are safe
 *   · applyKennelToday() is pure DOM work with no network and no globals, so
 *     it can be unit-tested against a fake document
 *
 * Hooks. `data-kennel-today` names one or more fields, space separated:
 *   text   — textContent from data-kennel-text  ("Sitting {day} · {name}")
 *   href   — href attribute from data-kennel-href ("/kennel-club/{slug}")
 *   image  — src (+ alt) from the sitting's plate; data-kennel-image=png|webp
 *   token  — data-token-id (and data-sitting, when the node already has one)
 *   attr   — data-kennel-attr names the attribute, data-kennel-value the value
 *   cell   — a calendar cell; data-kennel-day is its own day, and the node
 *            gets data-sitting-status="past|today|future"
 *   badge  — a "today" ring; hidden unless data-kennel-day is today
 *
 * Every hydrated node also gets data-sitting-day, so a page can be inspected
 * (and asserted on) without guessing whether hydration ran.
 */
import { KENNEL_TODAY_URL, type KennelTodayPayload } from './kennel-today';

export { KENNEL_TODAY_URL };
export type KennelToday = KennelTodayPayload;

/** The event a surface listens for when it has to re-read a hydrated node. */
export const KENNEL_TODAY_EVENT = 'pc:kennel-today';

const PLACEHOLDER = /\{(\w+)\}/g;

/** Minimal shapes so the applier can run against a fake document in tests. */
export interface KennelTodayNode {
  dataset: Record<string, string | undefined>;
  textContent?: string | null;
  hidden?: boolean;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}
export interface KennelTodayRoot {
  querySelectorAll(selector: string): ArrayLike<KennelTodayNode>;
}

export function kennelTodayTokens(today: KennelToday): Record<string, string> {
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    name: today.name ?? '',
    breed: today.breed ?? '',
    title: today.title ?? '',
    wardrobe: today.wardrobe ?? '',
    slug: today.slug ?? '',
    date: today.date ?? '',
    day: pad(today.day),
    dayNumber: String(today.day),
    sitting: pad(today.day),
    tokenId: String(today.tokenId),
    minted: today.minted == null ? '—' : String(today.minted),
    remaining: today.claimsRemaining == null ? '—' : String(today.claimsRemaining),
    claimed: today.claimsClaimed == null ? '—' : String(today.claimsClaimed),
    png: today.image?.png ?? '',
    webp: today.image?.webp ?? '',
    alt: today.alt ?? '',
  };
}

/** "Sitting {day} · {name}" → "Sitting 03 · Marguerite". Unknown keys stay put. */
export function fillKennelTemplate(template: string, today: KennelToday): string {
  const tokens = kennelTodayTokens(today);
  return template.replace(PLACEHOLDER, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : match
  ));
}

function applyToNode(node: KennelTodayNode, today: KennelToday): void {
  const fields = String(node.dataset.kennelToday ?? '').trim().split(/\s+/).filter(Boolean);
  for (const field of fields) {
    if (field === 'text') {
      node.textContent = fillKennelTemplate(node.dataset.kennelText ?? '{name}', today);
    } else if (field === 'href') {
      node.setAttribute('href', fillKennelTemplate(node.dataset.kennelHref ?? '/kennel-club/{slug}', today));
    } else if (field === 'image') {
      const format = node.dataset.kennelImage === 'png' ? 'png' : 'webp';
      node.setAttribute('src', today.image?.[format] ?? '');
      if (node.getAttribute('alt') !== null) node.setAttribute('alt', today.alt ?? '');
    } else if (field === 'token') {
      node.setAttribute('data-token-id', String(today.tokenId));
      if (node.getAttribute('data-sitting') !== null) node.setAttribute('data-sitting', today.name);
    } else if (field === 'attr') {
      const name = node.dataset.kennelAttr;
      if (name) node.setAttribute(name, fillKennelTemplate(node.dataset.kennelValue ?? '{tokenId}', today));
    } else if (field === 'cell') {
      const day = Number(node.dataset.kennelDay);
      node.setAttribute(
        'data-sitting-status',
        !Number.isFinite(day) || day === today.day ? 'today' : day < today.day ? 'past' : 'future',
      );
    } else if (field === 'badge') {
      node.hidden = Number(node.dataset.kennelDay) !== today.day;
    }
  }
  node.setAttribute('data-sitting-day', String(today.day));
}

/**
 * Write today's sitting over every hooked node under `root`.
 * Returns the number of nodes touched, so a caller can tell a no-op apart
 * from a page that has no hooks at all.
 */
export function applyKennelToday(root: KennelTodayRoot, today: KennelToday): number {
  const nodes = Array.from(root.querySelectorAll('[data-kennel-today]'));
  for (const node of nodes) applyToNode(node, today);
  return nodes.length;
}

type FetchLike = (input: string, init?: { cache?: RequestCache }) => Promise<{
  ok: boolean;
  json(): Promise<unknown>;
}>;

export async function readKennelToday(fetcher: FetchLike): Promise<KennelToday> {
  const response = await fetcher(KENNEL_TODAY_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('kennel-today-unavailable');
  return await response.json() as KennelToday;
}

/**
 * Fetch today once and paint the document, then tell the room's own scripts
 * (the claim desk, the mint button) that their token id just changed.
 */
let inFlight: Promise<void> | null = null;

export async function hydrateKennelToday(fetcher: FetchLike = fetch as unknown as FetchLike): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('[data-kennel-today]')) return;
  // First load fires the mount call and astro:page-load back to back; share
  // the read rather than asking the edge the same question twice.
  if (inFlight) return inFlight;
  inFlight = paint(fetcher).finally(() => { inFlight = null; });
  return inFlight;
}

async function paint(fetcher: FetchLike): Promise<void> {
  let today: KennelToday;
  try {
    today = await readKennelToday(fetcher);
  } catch {
    // The prerendered markup stays exactly as built: wrong on a stale deploy,
    // but never blank, and the live JSON doors still hold the truth.
    return;
  }
  applyKennelToday(document as unknown as KennelTodayRoot, today);
  document.documentElement.setAttribute('data-sitting-day', String(today.day));
  window.dispatchEvent(new CustomEvent(KENNEL_TODAY_EVENT, { detail: today }));
}

/**
 * Mount on first load and on every ClientRouter navigation. Components mount
 * more than once, so the work is idempotent by construction: the applier only
 * ever overwrites, never appends.
 */
export function mountKennelToday(): void {
  void hydrateKennelToday();
  document.addEventListener('astro:page-load', () => void hydrateKennelToday());
}
