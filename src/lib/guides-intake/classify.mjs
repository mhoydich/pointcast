/**
 * Classify a guide's "wanted" ask for the bot task feed (/guides/intake.json):
 * which intake kinds fit, and whether an agent can honestly do it.
 *
 * Agents can find and cite public sources. They cannot supply photos, get
 * consent, contact people, or report first-hand experience they never had.
 */

/** @param {string} ask */
export function suggestKinds(ask) {
  const t = ask.toLowerCase();
  const out = [];
  if (/\bcorrection|out of date|wrong\b/.test(t)) out.push('correction');
  if (/schedule|calendar|agenda|hours|recurring/.test(t)) out.push('schedule');
  if (/result|score|standings|recap/.test(t)) out.push('result');
  if (/list of|ledger|template|directory|roster|table|spreadsheet/.test(t)) out.push('dataset');
  if (/link|page|resource|sample|template|format/.test(t)) out.push('resource');
  if (/tip|idea|advice|ways to/.test(t)) out.push('tip');
  return out.length ? [...new Set(out)] : ['tip', 'resource'];
}

const RULES = [
  [/photo|picture|image/, 'Involves photos; needs a human who took them and consent from anyone pictured.'],
  [/interview|consent|permission|approved|agreed/, "Involves interviews or people's consent; a human must ask and confirm."],
  [/reach out|\bcontact(ing)? (the|them|someone|people|organizers?|captains?|coaches)\b|\bcall (the|a|an|your)\b|\bask (the|your) (organizer|captain|coach|league)/, 'Involves contacting someone; agents never contact people.'],
  [/^your (?!city|county|area|state|town|local|school district)|\byour (own |first )?(team|group|club|league|block|street|neighborhood|season|event|newsletter|kids?|family)\b|\byou(?:'ve| have)? (used|tried|run|kept|found|learned)\b|\bstories\b|\b(what|that) (has )?worked\b|\bworked (for|well)\b|\blessons?\b|\bfirst-hand\b|\bhow you (have )?(handle|handled|run|keep|kept)\b|\byou (organized|ran|took|keep|are willing to share)\b|\bfrom people who\b|\bnewcomer's\b/,
    'Asks for first-hand experience; a person who lived it should send it.'],
];

/** @param {string} ask @returns {{agentFriendly: boolean, reason?: string}} */
export function agentCheck(ask) {
  const t = ask.toLowerCase();
  for (const [re, reason] of RULES) if (re.test(t)) return { agentFriendly: false, reason };
  return { agentFriendly: true };
}
