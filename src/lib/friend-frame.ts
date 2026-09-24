/**
 * Friend Frame — shared rules for the page, the front-door module and the API.
 * A frame has seven seats, Monday..Sunday, one friend each. Days follow
 * El Segundo time (America/Los_Angeles). A friend's save is filed as the post
 * for their seat's next date (today, if today is their day).
 */
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const TOWN_FRAME_ID = 'town';
export const TZ = 'America/Los_Angeles';

export const INKS = ['#0F6E56', '#185FA5', '#9f5339', '#4b3621', '#254de5', '#c46f39', '#53736a', '#b0432e', '#7a3e8c', '#2f2a24'] as const;

export const LIMITS = {
  title: 60,
  friend: 40,
  poem: 600,
  poemLines: 14,
  note: 140,
  pictureUrl: 500,
  editsPerDate: 40,
  imagesPerDate: 8,
  imageBytes: 240_000,
  framesPerCreatorPerDay: 6,
  recordPage: 28,
} as const;

/** Stand-ins for the town frame until real friends take the seats. */
export const STARTERS = [
  { friend: 'Ada', color: '#0F6E56', poem: 'Monday comes in low and grey,\nthe kettle finds its note.\nI keep the window open\nfor whatever wants to float.', note: 'Coffee is on at the pot. Pour one.' },
  { friend: 'Bo', color: '#185FA5', poem: 'Two gulls on the substation fence\nare arguing about the tide.\nNeither one is right,\nand neither one will slide.', note: 'Walked to the dunes at seven. Fog until nine.' },
  { friend: 'Cleo', color: '#9f5339', poem: 'Midweek is a bridge\nwith the lights left on.\nHalf the town is crossing,\nhalf is already gone.', note: 'Bring a paddle Thursday. Court 3, 6pm.' },
  { friend: 'Dev', color: '#4b3621', poem: 'A drum in the hallway,\na hand on the door,\nsomeone counting four\nfor whoever wants more.', note: 'New track on the station. Tell me if it skips.' },
  { friend: 'Ezra', color: '#254de5', poem: 'Friday folds its sleeves\nand leaves them on the chair.\nThe week is finished with us.\nWe are finished being there.', note: 'Tacos, the place by the tracks, after six.' },
  { friend: 'Fern', color: '#c46f39', poem: 'The balcony tomatoes\nfinally went red.\nI ate one over the sink\nand did not make the bed.', note: 'Seeds are in the garden box if you want them.' },
  { friend: 'Gus', color: '#53736a', poem: 'Sunday is a long exhale\nthe ocean does for free.\nSit with it a minute.\nIt will sit with me.', note: 'Still Hour at sunset. No plan, just a bell.' },
] as const;

export class FrameInputError extends Error {}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDate = (value: unknown): value is string => typeof value === 'string' && DATE_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** Today's LA calendar date (YYYY-MM-DD) and weekday index (Mon=0). */
export function laToday(now: Date = new Date()): { date: string; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  return { date, day: dayOf(date) };
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function dayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** The date a seat's save is filed under: today if it is their day, else their next day. */
export function nextDateForDay(today: string, day: number): string {
  return addDays(today, (day - dayOf(today) + 7) % 7);
}

export function weekOf(today: string): string[] {
  const monday = addDays(today, -dayOf(today));
  return DAYS.map((_, i) => addDays(monday, i));
}

/** Deterministic noun.pics seed for a friend with no picture yet. */
export function nounSeed(name: string, day: number): number {
  let h = 0x811c9dc5;
  for (const ch of `${name.toLowerCase().trim()}|${day}`) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 0x01000193) >>> 0; }
  return h % 1200;
}

// Letters, numbers, punctuation, emoji and spaces; no control characters.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g;
const oneLine = (value: string) => value.replace(CONTROL, '').replace(/\s+/g, ' ').trim();
const count = (value: string) => Array.from(value).length;

export function cleanTitle(value: unknown): string {
  if (typeof value !== 'string') throw new FrameInputError('Give the frame a name.');
  const title = oneLine(value);
  if (!title) throw new FrameInputError('Give the frame a name.');
  if (count(title) > LIMITS.title) throw new FrameInputError(`Frame names stop at ${LIMITS.title} characters.`);
  return title;
}

export function cleanFriend(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'string') throw new FrameInputError('A name is text.');
  const friend = oneLine(value);
  if (count(friend) > LIMITS.friend) throw new FrameInputError(`Names stop at ${LIMITS.friend} characters.`);
  return friend;
}

export function cleanColor(value: unknown, fallback: string): string {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new FrameInputError('Pick one of the inks.');
  return value.toLowerCase();
}

export function cleanPicture(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new FrameInputError('A picture is an image link or an upload.');
  const v = value.trim();
  if (/^img:[a-z0-9]{16}$/.test(v)) return v;
  if (v.length > LIMITS.pictureUrl) throw new FrameInputError('That image link is too long.');
  let url: URL;
  try { url = new URL(v); } catch { throw new FrameInputError('That image link does not look like a link.'); }
  if (url.protocol !== 'https:') throw new FrameInputError('Image links have to start with https://');
  if (url.username || url.password) throw new FrameInputError('Image links cannot carry a login.');
  return url.toString();
}

export interface PostInput { friend: string; color: string; poem: string; note: string; picture: string | null }

export function cleanPost(raw: unknown, seat: { friend: string; color: string }): PostInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new FrameInputError('Nothing to hang.');
  const r = raw as Record<string, unknown>;
  const friend = cleanFriend(r.friend) || seat.friend;
  if (!friend) throw new FrameInputError('Sign your frame with a name.');
  if (r.poem != null && typeof r.poem !== 'string') throw new FrameInputError('A poem is text.');
  if (r.note != null && typeof r.note !== 'string') throw new FrameInputError('A note is text.');
  const poem = String(r.poem ?? '').replace(/\r\n?/g, '\n').replace(CONTROL, '').split('\n').map((l) => l.replace(/[ \t]+$/g, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (count(poem) > LIMITS.poem) throw new FrameInputError(`Poems stop at ${LIMITS.poem} characters.`);
  if (poem.split('\n').length > LIMITS.poemLines) throw new FrameInputError(`Poems stop at ${LIMITS.poemLines} lines.`);
  const note = oneLine(String(r.note ?? ''));
  if (count(note) > LIMITS.note) throw new FrameInputError(`Notes stop at ${LIMITS.note} characters.`);
  const picture = cleanPicture(r.picture);
  if (!picture && !poem && !note) throw new FrameInputError('Hang at least a picture, a poem or a note.');
  return { friend, color: cleanColor(r.color, seat.color), poem, note, picture };
}
