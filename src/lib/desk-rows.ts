/**
 * /desk row grammar — WHAT / NOW / AFTER / STATUS.
 *
 * PR #1053 shipped the desk with the rows built entirely in the page's
 * inline <script>. Two things bit us:
 *
 *   1. Every row node is created with document.createElement, so it never
 *      carries Astro's scoped `data-astro-cid-*` attribute. The scoped
 *      `.signature-row__button { … }` rules therefore matched nothing and
 *      the controls rendered as bare inline text — which is why the
 *      "Prepare" control read as dead on the live page. The page style
 *      block is `is:global` now (same fix as AgentLedger and drum-v2) and
 *      every class here is `desk-` prefixed so going global is safe.
 *
 *   2. The rows only ever printed one opaque `value` string
 *      ("tz2FjJ… → KT19Xcb…"), so the before/after of a signature was
 *      impossible to read. Rows now carry structured `now` and `after`
 *      values and render as a four-column grid.
 *
 * Everything here is DOM-library-free (the caller passes a Document) so
 * tests can drive it under jsdom.
 */
import type { DirectorOperation } from './director-operations';
import { DIRECTOR_ADMIN_ADDRESS } from './director-access';

export type DeskStage = 'idle' | 'confirm' | 'broadcast' | 'confirmed' | 'cleared' | 'failed';

export interface DeskRowValue {
  /** Storage field or plain noun this value belongs to, e.g. `treasury`. */
  label: string;
  /** The value itself. Addresses are shortened at render time. */
  value: string;
  /** Optional plain-English gloss, e.g. `your Kukai`. */
  note?: string;
}

export interface DeskRow {
  id: string;
  kind: 'signature' | 'setup' | 'manual' | 'check';
  what: string;
  why: string;
  href: string;
  done: boolean;
  state: 'open' | 'done' | 'unknown';
  now: DeskRowValue;
  after: DeskRowValue;
  buttonLabel: string;
  value?: string;
  operation?: DirectorOperation;
  toggleable?: boolean;
}

export interface DeskState {
  stage: DeskStage;
  opHash?: string;
  message?: string;
}

export const DESK_SIGN_LABEL = 'Sign with Kukai';
export const DESK_CLEARED_MS = 12_000;

/** The four columns, in the order the row prints them. */
export const DESK_LEGEND: ReadonlyArray<{ column: string; meaning: string }> = [
  { column: 'WHAT', meaning: 'the change, in one sentence' },
  { column: 'NOW', meaning: 'the value on chain right now' },
  { column: 'AFTER', meaning: 'the value your signature writes' },
  { column: 'STATUS', meaning: 'where that signature stands' },
];

const ADDRESS = /^(tz[123]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;

export function shortAddress(value: string): string {
  if (!value) return 'unavailable';
  return ADDRESS.test(value) || value.length > 24 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value;
}

/** `treasury: tz2FjJ…xdFw` — the address half is shortened, plain values are not. */
export function formatDeskValue(entry: DeskRowValue | undefined): string {
  if (!entry) return '—';
  const value = ADDRESS.test(entry.value) ? shortAddress(entry.value) : entry.value;
  return entry.label ? `${entry.label}: ${value}` : value;
}

/** Legacy one-line mirror used by the home front-door desk. */
export function deskValueSummary(row: Pick<DeskRow, 'now' | 'after'>): string {
  return `${formatDeskValue(row.now)} → ${formatDeskValue(row.after)}`;
}

/**
 * The status pill. Chain rows walk the signature lifecycle; every other
 * row reads Open until it is closed, then Cleared.
 */
export function deskStatusLabel(row: DeskRow, state?: DeskState): string {
  switch (state?.stage) {
    case 'confirm': return 'Confirm in Kukai…';
    case 'broadcast': return 'Broadcast';
    case 'confirmed': return 'Confirmed';
    case 'cleared': return 'Cleared';
    default: break;
  }
  if (row.done) return 'Cleared';
  if (row.kind === 'signature') return 'Needs signature';
  return 'Open';
}

/** Turn any thrown thing into a sentence a director can act on. */
export function describeDeskError(error: unknown): string {
  const raw = String(
    (error as { message?: string })?.message
    ?? (error as { errorType?: string })?.errorType
    ?? error
    ?? '',
  ).trim();
  if (/not the PointCast contract admin|not the .* admin/i.test(raw)) {
    return `That wallet is not the contract admin (${shortAddress(DIRECTOR_ADMIN_ADDRESS)}). Connect the director account in Kukai and try again.`;
  }
  if (/reject|refus|declin|denied|cancel|abort|NOT_GRANTED|ABORTED/i.test(raw)) {
    return 'Kukai rejected the signature. Nothing was broadcast.';
  }
  if (/network|fetch|timeout|timed out|offline|ECONN|rpc|502|503|504/i.test(raw)) {
    return 'The network did not answer. Nothing was broadcast — try again.';
  }
  return raw ? raw.slice(0, 180) : 'The call did not go through. Nothing was broadcast.';
}

function element<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function cell(doc: Document, modifier: string, column: string, body: string, note?: string): HTMLElement {
  const wrap = element(doc, 'div', `desk-sig__cell desk-sig__cell--${modifier}`);
  wrap.append(element(doc, 'dt', 'desk-sig__col', column));
  const value = element(doc, 'dd', 'desk-sig__value', body);
  if (note) value.append(element(doc, 'em', 'desk-sig__note', note));
  wrap.append(value);
  return wrap;
}

function statusCell(doc: Document, row: DeskRow, state?: DeskState): HTMLElement {
  const wrap = element(doc, 'div', 'desk-sig__cell desk-sig__cell--status');
  wrap.append(element(doc, 'dt', 'desk-sig__col', 'STATUS'));
  const value = element(doc, 'dd', 'desk-sig__value');
  const pill = element(doc, 'span', 'desk-pill', deskStatusLabel(row, state));
  pill.dataset.deskStage = state?.stage ?? (row.done ? 'cleared' : 'idle');
  pill.setAttribute('role', 'status');
  pill.setAttribute('aria-live', 'polite');
  // Only Broadcast carries the operation link; Confirmed is a clean word.
  if (state?.opHash && state.stage === 'broadcast') {
    const link = element(doc, 'a', 'desk-pill__op', ` · ${shortAddress(state.opHash)} ↗`);
    link.href = `https://tzkt.io/${state.opHash}`;
    link.target = '_blank';
    link.rel = 'noopener';
    pill.append(link);
  }
  value.append(pill);
  wrap.append(value);
  return wrap;
}

function rowAction(doc: Document, row: DeskRow, state?: DeskState): HTMLElement {
  if (row.kind === 'signature' && row.operation) {
    const button = element(doc, 'button', 'desk-sig__go', DESK_SIGN_LABEL);
    button.type = 'button';
    button.dataset.deskAction = 'sign';
    button.disabled = state?.stage === 'confirm' || state?.stage === 'broadcast' || state?.stage === 'cleared';
    return button;
  }
  if (row.toggleable) {
    const button = element(doc, 'button', 'desk-sig__go desk-sig__go--quiet', row.done ? 'Undo' : 'Done');
    button.type = 'button';
    button.dataset.deskAction = 'toggle';
    button.disabled = state?.stage === 'confirm';
    return button;
  }
  const link = element(doc, 'a', 'desk-sig__go desk-sig__go--quiet', row.buttonLabel || 'Open');
  link.href = row.href || '#';
  if (/^https?:/.test(row.href)) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  return link;
}

const KIND_CODE: Record<DeskRow['kind'], string> = {
  signature: 'CHAIN CALL',
  check: 'CHAIN READ',
  setup: 'SETUP',
  manual: 'OPERATING',
};

/** Build one WHAT / NOW / AFTER / STATUS row. */
export function buildDeskRow(doc: Document, row: DeskRow, state?: DeskState): HTMLElement {
  const item = element(doc, 'li', `desk-sig desk-sig--${row.kind}`);
  item.dataset.queueId = row.id;
  item.dataset.deskStage = state?.stage ?? (row.done ? 'cleared' : 'idle');
  if (row.done) item.classList.add('is-done');
  if (state?.stage === 'cleared') item.classList.add('is-cleared');

  const head = element(doc, 'div', 'desk-sig__head');
  head.append(element(doc, 'span', 'desk-sig__code', KIND_CODE[row.kind]), rowAction(doc, row, state));

  const grid = element(doc, 'dl', 'desk-sig__grid');
  grid.append(
    cell(doc, 'what', 'WHAT', row.what),
    cell(doc, 'now', 'NOW', formatDeskValue(row.now), row.now?.note),
    cell(doc, 'after', 'AFTER', formatDeskValue(row.after), row.after?.note),
    statusCell(doc, row, state),
  );

  item.append(head, grid, element(doc, 'p', 'desk-sig__why', row.why));
  if (state?.stage === 'failed' && state.message) {
    const error = element(doc, 'p', 'desk-sig__error', state.message);
    error.setAttribute('role', 'alert');
    item.append(error);
  }
  return item;
}

export interface DeskSignResult {
  opHash: string;
  confirmation: Promise<unknown>;
}

/**
 * One click: connect (inside the wallet call), broadcast, confirm.
 * `submit` is expected to run `ensurePointCastPermissions` itself, so the
 * director never needs a separate connect step.
 */
export async function runDeskSignature(
  operation: DirectorOperation,
  deps: {
    submit(operation: DirectorOperation): Promise<DeskSignResult>;
    onState(state: DeskState): void;
  },
): Promise<boolean> {
  deps.onState({ stage: 'confirm' });
  try {
    const result = await deps.submit(operation);
    if (!result?.opHash) throw new Error('Wallet did not return an operation hash.');
    deps.onState({ stage: 'broadcast', opHash: result.opHash });
    await result.confirmation;
    deps.onState({ stage: 'confirmed', opHash: result.opHash });
    return true;
  } catch (error) {
    deps.onState({ stage: 'failed', message: describeDeskError(error) });
    return false;
  }
}

export interface DeskListDeps {
  doc: Document;
  submit(operation: DirectorOperation): Promise<DeskSignResult>;
  toggle(id: string, done: boolean): Promise<void>;
  refresh(): Promise<void>;
  clearedMs?: number;
  schedule?(fn: () => void, ms: number): void;
}

export interface DeskList {
  setRows(rows: DeskRow[]): void;
  handleClick(event: Event): Promise<void>;
  stageOf(id: string): DeskStage;
  render(): void;
}

/**
 * The signatures column. Owns the per-row lifecycle state, keeps a
 * confirmed row on screen as a faded "Cleared" ghost once the verified
 * queue stops returning it, and delegates every click from the list root.
 */
export function createDeskList(list: HTMLElement, deps: DeskListDeps): DeskList {
  const states = new Map<string, DeskState>();
  const ghosts = new Map<string, DeskRow>();
  const clearedMs = deps.clearedMs ?? DESK_CLEARED_MS;
  const schedule = deps.schedule ?? ((fn: () => void, ms: number) => { setTimeout(fn, ms); });
  let rows: DeskRow[] = [];

  const render = () => {
    const nodes = rows.map((row) => buildDeskRow(deps.doc, row, states.get(row.id)));
    for (const [id, row] of ghosts) nodes.push(buildDeskRow(deps.doc, row, states.get(id)));
    if (!nodes.length) {
      const clear = element(deps.doc, 'li', 'desk-sig desk-sig--clear');
      clear.append(
        element(deps.doc, 'strong', '', 'No signatures waiting.'),
        element(deps.doc, 'p', 'desk-sig__why', 'The verified queue is clear.'),
      );
      nodes.push(clear);
    }
    list.replaceChildren(...nodes);
  };

  const drop = (id: string) => {
    ghosts.delete(id);
    states.delete(id);
    render();
  };

  const setRows = (next: DeskRow[]) => {
    const live = new Set(next.map(({ id }) => id));
    for (const [id, state] of [...states]) {
      if (live.has(id)) {
        if (state.stage === 'cleared') states.delete(id);
        continue;
      }
      if (ghosts.has(id)) continue;
      if (state.stage === 'broadcast' || state.stage === 'confirmed') {
        const prior = rows.find((row) => row.id === id);
        if (prior) {
          ghosts.set(id, prior);
          states.set(id, { stage: 'cleared', opHash: state.opHash });
          schedule(() => drop(id), clearedMs);
          continue;
        }
      }
      states.delete(id);
    }
    rows = next;
    render();
  };

  const handleClick = async (event: Event) => {
    const target = event.target as Element | null;
    const control = target?.closest?.('[data-desk-action]') as HTMLButtonElement | null;
    if (!control || control.disabled) return;
    const item = control.closest('[data-queue-id]') as HTMLElement | null;
    const row = rows.find(({ id }) => id === item?.dataset.queueId);
    if (!row) return;
    event.preventDefault();

    if (control.dataset.deskAction === 'toggle') {
      states.set(row.id, { stage: 'confirm' });
      render();
      try {
        await deps.toggle(row.id, !row.done);
        states.delete(row.id);
        await deps.refresh();
      } catch (error) {
        states.set(row.id, { stage: 'failed', message: describeDeskError(error) });
        render();
      }
      return;
    }

    if (control.dataset.deskAction === 'sign' && row.operation) {
      const settled = await runDeskSignature(row.operation, {
        submit: deps.submit,
        onState: (state) => { states.set(row.id, state); render(); },
      });
      if (settled) await deps.refresh();
    }
  };

  return { setRows, handleClick, render, stageOf: (id) => states.get(id)?.stage ?? 'idle' };
}
