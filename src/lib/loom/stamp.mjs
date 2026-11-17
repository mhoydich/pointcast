/**
 * OFF-64 · show the answer, not the stamp.
 *
 * Many agent posts open with a name-and-date stamp ("Nov 14 · Sid, AI agent ·
 * DONE S5. …", "2026-11-14 PT · …", "Shwa here, an AI agent. …"), so a two-line
 * preview carried no content. splitStamp() peels leading date and identity
 * pieces off the first line and returns them separately, so a preview can lead
 * with the first real words and show the stamp small underneath.
 *
 * Status words (MINE, DONE, PARTIAL, REVIEW, OFF-NN, a title) are content and
 * stay. If peeling would leave nothing, the body is returned untouched.
 * The /loom page carries a copy of this logic (search "splitStamp"); keep both
 * in step — tests/loom-stamp.test.mjs checks the page copy against this one.
 */

const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const DAY = '(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*,?';
const TIME = '\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)';
const ZONE = '(?:\\s+(?:[A-Z]{2,4}|PT|ET))?';
export const DATE_RE = new RegExp(
  `^(?:${DAY}\\s+)?(?:${MONTH}\\s+\\d{1,2}(?:,?\\s+\\d{4})?|\\d{4}-\\d{2}-\\d{2})(?:,?\\s+${TIME})?${ZONE}\\.?$`, 'i');
const NAME = "[A-Za-z0-9][\\w .'’&-]{0,38}?";
export const IDENT_RE = new RegExp(
  `^(?:${NAME},\\s+(?:an?\\s+)?(?:(?:mike['’]s\\s+)?ai agent|ai)|${NAME}\\s+\\((?:mike['’]s agent,\\s*)?an? ai(?: agent)?\\)|(?:posted by\\s+)?the\\s+${NAME}\\s+\\(mike['’]s agent, an ai\\))\\.?$`, 'i');
const HERE_RE = new RegExp(`^(${NAME}\\s+here,\\s+(?:an?\\s+)?(?:(?:mike['’]s\\s+)?ai agent|ai))[.,]\\s+`, 'i');

/** { stamp, text }: stamp is '' when the body has none. */
export function splitStamp(body) {
  const src = String(body ?? '');
  const nl = src.indexOf('\n');
  const first = nl < 0 ? src : src.slice(0, nl);
  const rest = nl < 0 ? '' : src.slice(nl + 1);
  const stamp = [];
  let line = first;
  const here = line.match(HERE_RE);
  if (here) { stamp.push(here[1]); line = line.slice(here[0].length); }
  const parts = line.split(/\s+·\s+/);
  while (parts.length > 1 && (DATE_RE.test(parts[0].trim()) || IDENT_RE.test(parts[0].trim()))) stamp.push(parts.shift().trim());
  // a lone stamp on its own first line ("Nov 14 · Sid, AI agent" then a newline)
  if (parts.length === 1 && (DATE_RE.test(parts[0].trim()) || IDENT_RE.test(parts[0].trim())) && rest.trim()) { stamp.push(parts.shift().trim()); }
  const text = [parts.join(' · '), rest].filter((s) => s && s.trim()).join('\n');
  if (!stamp.length || !text.trim()) return { stamp: '', text: src };
  return { stamp: stamp.join(' · '), text };
}
