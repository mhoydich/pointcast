export const UES_PROGRESS_VERSION = 1;
export const UES_MODULE_COUNT = 6;
export const UES_COMPLETION_MODULES = 4;
export const UES_PROGRESS_MAX = UES_COMPLETION_MODULES + 1;

const COURSE_CODE_PATTERN = /^[A-Z][A-Z0-9]{1,7}-[A-Z0-9]{1,8}$/;

const courseCodeOrThrow = (value) => {
  if (typeof value !== 'string') {
    throw new TypeError('A public course code is required.');
  }

  const courseCode = value.trim().toUpperCase();
  if (!COURSE_CODE_PATTERN.test(courseCode)) {
    throw new TypeError('Course code must be a short public catalog code.');
  }

  return courseCode;
};

const toIsoTimestamp = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const nowIso = (value) => toIsoTimestamp(value) ?? new Date().toISOString();

const normalizeWeeks = (value) => {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.filter(
    (week) => Number.isInteger(week) && week >= 1 && week <= UES_MODULE_COUNT,
  ))].sort((left, right) => left - right);
};

const completionReached = (progress) => (
  progress.completedWeeks.length >= UES_COMPLETION_MODULES
  && progress.finalOutcome === true
);

export const createProgress = (courseCode) => ({
  v: UES_PROGRESS_VERSION,
  courseCode: courseCodeOrThrow(courseCode),
  startedAt: null,
  completedWeeks: [],
  finalOutcome: false,
  completedAt: null,
});

/**
 * Convert unknown storage input into the exact privacy-safe persisted shape.
 * Unknown fields are discarded. Old versions and other course codes reset.
 */
export const normalizeProgress = (input, expectedCourseCode) => {
  const courseCode = courseCodeOrThrow(expectedCourseCode);
  if (
    !input
    || typeof input !== 'object'
    || Array.isArray(input)
    || input.v !== UES_PROGRESS_VERSION
    || input.courseCode !== courseCode
  ) {
    return createProgress(courseCode);
  }

  const progress = {
    v: UES_PROGRESS_VERSION,
    courseCode,
    startedAt: toIsoTimestamp(input.startedAt),
    completedWeeks: normalizeWeeks(input.completedWeeks),
    finalOutcome: input.finalOutcome === true,
    completedAt: toIsoTimestamp(input.completedAt),
  };

  if (!completionReached(progress)) progress.completedAt = null;
  return progress;
};

export const parseProgress = (raw, expectedCourseCode) => {
  if (typeof raw !== 'string') return normalizeProgress(raw, expectedCourseCode);

  try {
    return normalizeProgress(JSON.parse(raw), expectedCourseCode);
  } catch {
    return createProgress(expectedCourseCode);
  }
};

export const serializeProgress = (progress) => {
  const courseCode = courseCodeOrThrow(progress?.courseCode);
  return JSON.stringify(normalizeProgress(progress, courseCode));
};

const normalizedForUpdate = (progress) => {
  const courseCode = courseCodeOrThrow(progress?.courseCode);
  return normalizeProgress(progress, courseCode);
};

const withCompletionTimestamp = (progress, timestamp) => {
  const complete = completionReached(progress);
  return {
    ...progress,
    completedAt: complete ? (progress.completedAt ?? timestamp) : null,
  };
};

export const startProgress = (progress, at = new Date()) => {
  const normalized = normalizedForUpdate(progress);
  return {
    ...normalized,
    startedAt: normalized.startedAt ?? nowIso(at),
  };
};

export const setWeekComplete = (progress, week, complete = true, at = new Date()) => {
  const normalized = normalizedForUpdate(progress);
  if (!Number.isInteger(week) || week < 1 || week > UES_MODULE_COUNT) return normalized;

  const timestamp = nowIso(at);
  const completedWeeks = complete
    ? normalizeWeeks([...normalized.completedWeeks, week])
    : normalized.completedWeeks.filter((completedWeek) => completedWeek !== week);

  return withCompletionTimestamp({
    ...normalized,
    startedAt: normalized.startedAt ?? timestamp,
    completedWeeks,
  }, timestamp);
};

export const toggleWeek = (progress, week, at = new Date()) => {
  const normalized = normalizedForUpdate(progress);
  if (!Number.isInteger(week) || week < 1 || week > UES_MODULE_COUNT) return normalized;
  return setWeekComplete(normalized, week, !normalized.completedWeeks.includes(week), at);
};

export const setFinalOutcome = (progress, complete = true, at = new Date()) => {
  const normalized = normalizedForUpdate(progress);
  const timestamp = nowIso(at);

  return withCompletionTimestamp({
    ...normalized,
    startedAt: normalized.startedAt ?? timestamp,
    finalOutcome: complete === true,
  }, timestamp);
};

export const nextIncompleteModule = (progress) => {
  const normalized = normalizedForUpdate(progress);
  for (let week = 1; week <= UES_MODULE_COUNT; week += 1) {
    if (!normalized.completedWeeks.includes(week)) return week;
  }
  return null;
};

export const isComplete = (progress) => completionReached(normalizedForUpdate(progress));

export const progressValue = (progress) => {
  const normalized = normalizedForUpdate(progress);
  return Math.min(normalized.completedWeeks.length, UES_COMPLETION_MODULES)
    + (normalized.finalOutcome ? 1 : 0);
};

export const progressSummary = (progress) => ({
  value: progressValue(progress),
  max: UES_PROGRESS_MAX,
  complete: isComplete(progress),
  nextModule: nextIncompleteModule(progress),
});

export const createCompletionReceipt = (progress, at = new Date()) => {
  const normalized = normalizedForUpdate(progress);
  if (!completionReached(normalized)) return null;

  return {
    schema: 'https://pointcast.xyz/ues/completion-receipt/v1',
    kind: 'self-attested-course-completion',
    program: 'University of El Segundo',
    courseCode: normalized.courseCode,
    completedModules: [...normalized.completedWeeks],
    completedModuleCount: normalized.completedWeeks.length,
    finalOutcome: true,
    startedAt: normalized.startedAt,
    completedAt: normalized.completedAt ?? nowIso(at),
    attestation: 'Self-attested by the learner; no identity was collected or verified.',
    disclaimer: 'Not academic credit, accreditation, verified identity, an on-chain record, or a financial credential.',
  };
};
