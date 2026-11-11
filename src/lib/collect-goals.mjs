/**
 * Collect v1 keeps owner-entered notes in this browser. These records are
 * self-attestations, never independently verified income or account balances.
 * No helper here reads a network, account, wallet, or storage API.
 */
export const STORAGE_KEY = 'pointcast:collect:001:v1';
export const MAX_RESOURCES = 100;
const MAX_AMOUNT_CENTS = 100_000_000_000;
const MAX_JSON_LENGTH = 300_000;
const RESOURCE_KEYS = ['id', 'title', 'stage', 'amount', 'date', 'evidence', 'allocationConfirmed'];
const DRAFT_KEYS = ['version', 'itemId', 'wishlist', 'resources', 'notes', 'nextReviewDate'];

function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new Error(`${label} must be a plain object.`);
  }
  if (Reflect.ownKeys(value).some((key) => !keys.includes(key))) {
    throw new Error(`${label} contains unsupported fields.`);
  }
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get || descriptor.set) throw new Error(`${label} cannot contain accessors.`);
  }
}

function text(value, label, max, required = false) {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  const result = value.trim();
  if (value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  if (required && !result) throw new Error(`${label} is required.`);
  return result;
}

function date(value, label, optional = false) {
  if (optional && value === '') return '';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a real calendar date.`);
  }
  return value;
}

function money(value, required) {
  if (value === null || value === undefined || value === '') {
    if (required) throw new Error('A positive USD amount is required for realized or allocated resources.');
    return null;
  }
  if (typeof value !== 'number' && typeof value !== 'string') throw new Error('Amount must be a USD number.');
  if (typeof value === 'string' && !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value.trim())) {
    throw new Error('Enter a positive USD amount with at most two decimal places.');
  }
  const amount = Number(value);
  const rawCents = amount * 100;
  const cents = Math.round(rawCents);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(cents) ||
      cents <= 0 || cents > MAX_AMOUNT_CENTS || amount !== cents / 100) {
    throw new Error('Enter a positive USD amount with at most two decimal places (up to $1 billion).');
  }
  return cents / 100;
}

function resourceId(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) {
    throw new Error('Resource ID must contain 1–80 letters, numbers, underscores or hyphens.');
  }
  return value;
}

/** Create an empty local draft; absence of records does not prove zero funding. */
export function emptyDraft() {
  return { version: 1, itemId: '001', wishlist: false, resources: [], notes: '', nextReviewDate: '' };
}

/** Validate a form entry; a missing id is generated only for a new entry. */
export function validateResource(input) {
  object(input, RESOURCE_KEYS, 'Resource');
  const stage = input.stage;
  if (!['lead', 'realized', 'allocated'].includes(stage)) throw new Error('Choose a resource stage.');
  if (input.allocationConfirmed !== undefined && typeof input.allocationConfirmed !== 'boolean') {
    throw new Error('Allocation confirmation must be true or false.');
  }
  if (stage === 'allocated' && input.allocationConfirmed !== true) {
    throw new Error('Confirm that the realized resource is explicitly allocated to item 001.');
  }
  const evidence = text(input.evidence ?? '', 'Evidence reference', 600, stage !== 'lead');
  return {
    id: input.id === undefined ? crypto.randomUUID() : resourceId(input.id),
    title: text(input.title, 'Resource name', 120, true),
    stage,
    amount: money(input.amount, stage !== 'lead'),
    date: date(input.date, 'Resource date'),
    evidence,
    allocationConfirmed: stage === 'allocated',
  };
}

/** Strict validation protects storage/imports from becoming misleading totals. */
export function normalizeDraft(input) {
  object(input, DRAFT_KEYS, 'Draft');
  if (input.version !== 1) throw new Error('Unsupported Collect draft version.');
  if (input.itemId !== '001') throw new Error('This draft belongs to a different collection item.');
  if (typeof input.wishlist !== 'boolean') throw new Error('Wishlist must be true or false.');
  if (!Array.isArray(input.resources) || input.resources.length > MAX_RESOURCES) {
    throw new Error(`A draft can contain at most ${MAX_RESOURCES} resource entries.`);
  }
  const ids = new Set();
  const resources = input.resources.map((entry) => {
    if (!entry || !Object.hasOwn(entry, 'id')) throw new Error('A saved resource must have an ID.');
    const result = validateResource(entry);
    if (ids.has(result.id)) throw new Error('Duplicate resource IDs are not allowed.');
    ids.add(result.id);
    return result;
  });
  return {
    version: 1,
    itemId: '001',
    wishlist: input.wishlist,
    resources,
    notes: text(input.notes, 'Research notes', 2000),
    nextReviewDate: date(input.nextReviewDate, 'Next review date', true),
  };
}

export function addResource(state, input) {
  const draft = normalizeDraft(state);
  if (draft.resources.length === MAX_RESOURCES) throw new Error(`The local draft is full (${MAX_RESOURCES} entries). Export it before starting another.`);
  const resource = validateResource(input);
  if (draft.resources.some((entry) => entry.id === resource.id)) throw new Error('This resource ID is already recorded.');
  return { ...draft, resources: [...draft.resources, resource] };
}

export function removeResource(state, id) {
  const draft = normalizeDraft(state);
  resourceId(id);
  return { ...draft, resources: draft.resources.filter((entry) => entry.id !== id) };
}

/** Dollar totals are mutually exclusive; prospective amounts never count. */
export function totals(state) {
  const draft = normalizeDraft(state);
  let leadCount = 0;
  let realizedCents = 0;
  let allocatedCents = 0;
  for (const resource of draft.resources) {
    if (resource.stage === 'lead') leadCount += 1;
    else if (resource.stage === 'realized') realizedCents += Math.round(resource.amount * 100);
    else allocatedCents += Math.round(resource.amount * 100);
  }
  return { leadCount, realizedUnallocated: realizedCents / 100, ownerAttestedAllocated: allocatedCents / 100, currency: 'USD' };
}

export function exportDraft(state) {
  return JSON.stringify(normalizeDraft(state), null, 2);
}

export function parseDraft(json) {
  if (typeof json !== 'string' || json.length > MAX_JSON_LENGTH) throw new Error('Draft must be JSON text smaller than 300,000 characters.');
  let input;
  try { input = JSON.parse(json); } catch { throw new Error('The saved draft is not valid JSON.'); }
  return normalizeDraft(input);
}
