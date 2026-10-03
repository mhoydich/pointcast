import practice from './practice.json' with { type: 'json' };

export const SCORECARD_KEY = 'pointcast:pickleball-scorecard:v2';
export const SCORECARD_SCHEMA = 2;
export const SCORECARD_MAX = 100;
export const PRACTICE_OPTIONS = Object.freeze({
  goals: Object.freeze([{ id: 'backhand', label: 'Cleaner backhands' }, { id: 'reset', label: 'Softer resets' }, { id: 'doubles', label: 'Better doubles decisions' }]),
  durations: Object.freeze([10, 20, 30, 45]),
  spaces: Object.freeze([{ id: 'compact', label: 'Compact / portable net' }, { id: 'halfcourt', label: 'Shared half-court lane' }, { id: 'fullcourt', label: 'Full court' }]),
  partners: Object.freeze([{ id: 'solo', label: 'Solo' }, { id: 'partner', label: 'With a partner' }]),
});
export const PRACTICE_PRESETS = Object.freeze([
  { id: 'compact-solo', title: '10-minute solo touch practice', options: { goal: 'backhand', duration: 10, space: 'compact', partner: 'solo' } },
  { id: 'compact-partner', title: '20-minute portable-net partner practice', options: { goal: 'reset', duration: 20, space: 'compact', partner: 'partner' } },
  { id: 'court-partner', title: '30-minute doubles court practice', options: { goal: 'doubles', duration: 30, space: 'fullcourt', partner: 'partner' } },
]);
const allowed = (type, value) => PRACTICE_OPTIONS[type].some((option) => option.id === value);

export function normalizePracticeOptions(input = {}) {
  const options = input && typeof input === 'object' ? input : {};
  const duration = typeof options.duration === 'number' ? options.duration : /^\d+$/.test(String(options.duration ?? '')) ? Number(options.duration) : NaN;
  return {
    goal: allowed('goals', options.goal) ? options.goal : 'backhand',
    duration: PRACTICE_OPTIONS.durations.includes(duration) ? duration : 10,
    space: allowed('spaces', options.space) ? options.space : 'compact',
    partner: allowed('partners', options.partner) ? options.partner : 'solo',
  };
}

export function buildPracticePlan(input = {}) {
  const options = normalizePracticeOptions(input);
  const { goal, duration, space, partner } = options;
  const allocation = practice.allocations[String(duration)];
  const templates = [practice.warmups[`${space}-${partner}`], ...practice.variants[`${goal}-${space}-${partner}`], practice.finishes[partner]];
  const goalLabel = PRACTICE_OPTIONS.goals.find((option) => option.id === goal).label;
  const spaceLabel = PRACTICE_OPTIONS.spaces.find((option) => option.id === space).label;
  const partnerLabel = PRACTICE_OPTIONS.partners.find((option) => option.id === partner).label;
  const constraintNote = space === 'compact'
    ? 'Compact practice trains contact, control, and decisions in clear space. Keep the ball within a comfortable reach and stay clear of the portable net frame and feet. Compact geometry does not test regulation-court depth or team coverage.'
    : space === 'halfcourt'
      ? 'Use only the agreed shared lane. Stop for loose balls and neighboring play; this plan does not assume access to a whole court.'
      : 'Use a permitted court with clear space. Begin cooperatively and add variety before pace.';
  return {
    id: `${goal}-${duration}-${space}-${partner}`,
    title: `${duration} minutes · ${goalLabel.toLowerCase()}`,
    options,
    totalMinutes: duration,
    description: `${spaceLabel} · ${partnerLabel}. One focus, two progressions, and time to reflect.`,
    constraintNote,
    editorialNote: practice.editorialNote,
    articleUrl: practice.articleUrls[goal],
    blocks: templates.map((template, index) => ({ ...template, minutes: allocation[index] })),
  };
}

/** The browser's own calendar date, without interpreting an HTML date as UTC. */
export function localDate(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError('A valid Date is required.');
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidLocalDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

function integer(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : NaN;
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return NaN;
  return Number(value.trim());
}

/** Validate only the scorecard's explicit fields; notes remain literal plain text. */
export function validateScorecardEntry(input, { today = localDate(), id } = {}) {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const errors = {};
  if (!allowed('goals', value.goal)) errors.goal = 'Choose a practice goal.';
  if (!allowed('spaces', value.space)) errors.space = 'Choose the space you used.';
  if (!allowed('partners', value.partner)) errors.partner = 'Choose solo or partner practice.';
  if (!isValidLocalDate(value.date)) errors.date = 'Use a valid local calendar date.';
  else if (!isValidLocalDate(today) || value.date > today) errors.date = 'The practice date cannot be in the future.';
  const attempts = integer(value.attempts);
  const successes = integer(value.successes);
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 100) errors.attempts = 'Attempts must be a whole number from 1 to 100.';
  if (!Number.isSafeInteger(successes) || successes < 0 || successes > attempts) errors.successes = 'Made must be a whole number from 0 to the attempted count.';
  if (typeof value.notes !== 'string' && value.notes !== undefined) errors.notes = 'Notes must be plain text.';
  const notes = typeof value.notes === 'string' ? value.notes.replace(/\r\n?/g, '\n').trim() : '';
  if (notes.length > 280 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(notes)) errors.notes = 'Use at most 280 plain-text characters without control characters.';
  const entryId = id ?? value.id;
  if (typeof entryId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(entryId)) errors.id = 'A valid entry ID is required.';
  if (Object.keys(errors).length) return { ok: false, errors, entry: null };
  return { ok: true, errors: {}, entry: { id: entryId, goal: value.goal, space: value.space, partner: value.partner, date: value.date, attempts, successes, notes } };
}

export function parseScorecard(raw, { today = localDate() } = {}) {
  if (raw === null || raw === undefined) return { ok: true, entries: [], reason: null };
  try {
    if (typeof raw !== 'string') throw new Error('Not a string');
    const value = JSON.parse(raw);
    if (!value || value.schema !== SCORECARD_SCHEMA || !Array.isArray(value.entries) || value.entries.length > SCORECARD_MAX) throw new Error('Invalid schema');
    const ids = new Set();
    const entries = value.entries.map((input) => {
      const result = validateScorecardEntry(input, { today });
      if (!result.ok || ids.has(result.entry.id)) throw new Error('Invalid entry');
      ids.add(result.entry.id);
      return result.entry;
    });
    return { ok: true, entries, reason: null };
  } catch {
    return { ok: false, entries: [], reason: 'corrupt' };
  }
}

export function appendScorecardEntry(entries, entry) {
  return [entry, ...entries.filter((existing) => existing.id !== entry.id)].slice(0, SCORECARD_MAX);
}

export function summarizeScorecard(entries = []) {
  return PRACTICE_OPTIONS.goals.map(({ id: goal, label }) => {
    const records = entries.filter((entry) => entry.goal === goal);
    return { goal, label, successes: records.reduce((sum, entry) => sum + entry.successes, 0), attempts: records.reduce((sum, entry) => sum + entry.attempts, 0), entries: records.length };
  });
}

export function serializeScorecard(entries) {
  return JSON.stringify({ schema: SCORECARD_SCHEMA, entries: entries.slice(0, SCORECARD_MAX) });
}

export function exportScorecard(entries, exportedAt = new Date()) {
  return JSON.stringify({ schema: SCORECARD_SCHEMA, exportedAt: exportedAt.toISOString(), description: 'Self-reported practice counts only. These are not verified skills, ratings, or match results.', entries: entries.slice(0, SCORECARD_MAX) }, null, 2);
}
