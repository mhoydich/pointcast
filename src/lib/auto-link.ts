/**
 * auto-link.ts — render-time internal linking for block bodies.
 *
 * Walks a block body and wraps the FIRST mention of each pillar concept
 * in a link to the corresponding pillar page. Drives internal-link juice
 * from the long tail (150+ blocks) into the 3 keyword-targeted SEO
 * pillars + the /blocks reference + the core concept pages.
 *
 * Called from BlockCard on detail-READ bodies. Other types (NOTE, VISIT)
 * keep plain text.
 *
 * Behavior:
 * - Each keyword is matched case-insensitively, whole-word only.
 * - Only the FIRST occurrence per keyword is linked (avoids link spam).
 * - Text inside backticks (inline code) is skipped entirely.
 * - Text inside square-brackets (already part of a markdown link) is skipped.
 * - Output is an array of paragraphs; each paragraph is either a plain
 *   string or an array of (string | { href, text }) chunks.
 *
 * Note: body is plain text in PointCast's block schema (not markdown).
 * If a block ever authors real markdown links the naive `[` skip heuristic
 * lets them fall through as-is; we're not trying to parse markdown here.
 */

export interface AutoLinkRule {
  /** Keyword regex — whole-word matched, case-insensitive. */
  pattern: RegExp;
  /** Target URL the matched phrase should link to. */
  href: string;
  /** Optional title attribute for the link (hover / aria). */
  title?: string;
}

/**
 * Chunk of rendered output. String → plain text. Object → link to wrap.
 */
export type AutoLinkChunk = string | { href: string; text: string; title?: string };

/**
 * Pillar keyword → URL mapping. Order matters: more-specific phrases first
 * so "Visit Nouns" wins over "Nouns", "agent-native web" wins over "agent".
 *
 * Each rule uses a noncapturing lookaround-free whole-word match so it
 * works with the `g` flag in regex replace.
 */
export const PILLAR_RULES: AutoLinkRule[] = [
  { pattern: /\bVisit\s+Nouns\b/i,       href: '/collection/visit-nouns', title: 'Visit Nouns FA2 on Tezos' },
  { pattern: /\bNouns\s+Battler\b/i,     href: '/battle',                 title: 'Nouns Battler — deterministic fighter' },
  { pattern: /\bNouns\s+on\s+Tezos\b/i,  href: '/nouns',                  title: 'Nouns on Tezos — hub' },
  { pattern: /\bagent[- ]native\b/i,     href: '/agent-native',           title: 'The agent-native web' },
  { pattern: /\bllms\.txt\b/i,           href: '/agent-native#llms-txt',  title: 'llms.txt on pointcast.xyz' },
  { pattern: /\bagents\.json\b/i,        href: '/agent-native#agents-json', title: 'agents.json on pointcast.xyz' },
  { pattern: /\bCard\s+of\s+the\s+Day\b/i, href: '/battle',               title: 'Card of the Day' },
  { pattern: /\bEl\s+Segundo\b/i,        href: '/el-segundo',             title: 'El Segundo, California' },
  { pattern: /\bSouth\s+Bay\b/i,         href: '/el-segundo#overview',    title: 'South Bay, Los Angeles' },
  { pattern: /\bGood\s+Feels\b/i,        href: '/c/good-feels',           title: 'Good Feels — cannabis beverage' },
  // "Nouns" by itself — goes last so "Visit Nouns" / "Nouns Battler" /
  // "Nouns on Tezos" get to match first.
  { pattern: /\bNouns\b/i,               href: '/nouns',                  title: 'Nouns on Tezos' },
  // "Tezos" standalone — last of the crypto cluster.
  { pattern: /\bTezos\b/i,               href: '/nouns#why-tezos',        title: 'Why Tezos on PointCast' },
];

/**
 * Walk a single paragraph and apply each rule at most once. Returns a
 * list of chunks the template can render as either text or <a> tags.
 *
 * "Already linked" detection: if the paragraph contains backtick-delimited
 * code, those regions are skipped entirely. Square-bracketed segments
 * (markdown link text) are also skipped.
 */
export function autoLinkParagraph(
  text: string,
  rules: AutoLinkRule[] = PILLAR_RULES,
): AutoLinkChunk[] {
  if (!text) return [text];

  // Collect protected ranges — positions where we must NOT inject links.
  // Covers inline `code`, [link text], (parenthesized urls with /b/ paths),
  // and anything already inside an explicit markdown link structure.
  const protectedRanges: Array<[number, number]> = [];
  let m: RegExpExecArray | null;

  const codeRe = /`[^`\n]+`/g;
  while ((m = codeRe.exec(text)) !== null) {
    protectedRanges.push([m.index, m.index + m[0].length]);
  }
  const bracketRe = /\[[^\]]+\]/g;
  while ((m = bracketRe.exec(text)) !== null) {
    protectedRanges.push([m.index, m.index + m[0].length]);
  }

  function isProtected(start: number, end: number): boolean {
    return protectedRanges.some(([ps, pe]) => start < pe && end > ps);
  }

  // Track which rules have already fired in this paragraph.
  const used = new Set<RegExp>();

  // Collect all matches across all unused rules, take the earliest.
  // Repeat until no more rules can fire.
  const chunks: AutoLinkChunk[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let best: { rule: AutoLinkRule; index: number; length: number; matchText: string } | null = null;

    for (const rule of rules) {
      if (used.has(rule.pattern)) continue;
      // Search from `cursor` in the remaining text.
      const slice = text.slice(cursor);
      const match = slice.match(rule.pattern);
      if (!match || match.index === undefined) continue;
      const absoluteIndex = cursor + match.index;
      const absoluteEnd = absoluteIndex + match[0].length;
      if (isProtected(absoluteIndex, absoluteEnd)) continue;
      if (!best || absoluteIndex < best.index) {
        best = {
          rule,
          index: absoluteIndex,
          length: match[0].length,
          matchText: match[0],
        };
      }
    }

    if (!best) {
      chunks.push(text.slice(cursor));
      break;
    }

    if (best.index > cursor) {
      chunks.push(text.slice(cursor, best.index));
    }
    chunks.push({
      href: best.rule.href,
      text: best.matchText,
      title: best.rule.title,
    });
    used.add(best.rule.pattern);
    cursor = best.index + best.length;
  }

  return chunks;
}

/**
 * Whole-body convenience — split a body into paragraphs (preserving the
 * double-newline delimiter as the paragraph break) and auto-link each
 * paragraph independently. Each paragraph gets its own "first-mention"
 * budget per rule so a long body can surface a pillar link more than
 * once if the concept recurs across sections.
 */
export function autoLinkBody(body: string, rules: AutoLinkRule[] = PILLAR_RULES): AutoLinkChunk[][] {
  return body.split(/\n\n+/).map((para) => autoLinkParagraph(para, rules));
}
