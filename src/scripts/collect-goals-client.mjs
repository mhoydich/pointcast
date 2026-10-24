import { STORAGE_KEY, emptyDraft, normalizeDraft, addResource, removeResource, totals, exportDraft, parseDraft } from '../lib/collect-goals.mjs';

export function mountCollect(root) {
  if (!root || root.dataset.collectMounted) return;
  root.dataset.collectMounted = 'true';
  const $ = (selector) => root.querySelector(selector);
  const status = $('[data-tracker-status]');
  const resourceForm = $('[data-resource-form]');
  const notesForm = $('[data-notes-form]');
  const errorBox = $('[data-resource-error]');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  let state = emptyDraft();
  let undo = null;
  let persist = true;
  let storage = null;
  let lastSavedRaw = null;
  let storageConflict = false;
  const say = (text) => { status.textContent = text; };
  try {
    storage = window.localStorage;
    const raw = storage.getItem(STORAGE_KEY);
    lastSavedRaw = raw;
    if (raw) state = parseDraft(raw);
    say(raw ? 'Your browser-local draft is loaded. It is not independently verified.' : 'No local records yet. Public funding remains unverified.');
  } catch {
    persist = false;
    say('Browser storage is unavailable or the saved draft cannot be read. Existing data is untouched. New edits last only for this visit; export a copy before leaving.');
  }

  function commit(next, message) {
    state = normalizeDraft(next);
    if (persist) {
      try {
        if (storage.getItem(STORAGE_KEY) !== lastSavedRaw) {
          persist = false;
          storageConflict = true;
        } else {
          const serialized = exportDraft(state);
          storage.setItem(STORAGE_KEY, serialized);
          lastSavedRaw = serialized;
        }
      } catch { persist = false; }
    }
    say(storageConflict ? message + ' Another tab saved a newer notebook. Its version is preserved. These edits are for this visit only; export before reloading.' : persist ? message + ' Saved in this browser only.' : message + ' Not saved to browser storage. Export before leaving.');
    render();
  }

  function render() {
    const total = totals(state);
    $('[data-total-leads]').textContent = String(total.leadCount);
    $('[data-total-realized]').textContent = state.resources.some(r => r.stage === 'realized') ? money.format(total.realizedUnallocated) : '—';
    $('[data-total-allocated]').textContent = state.resources.some(r => r.stage === 'allocated') ? money.format(total.ownerAttestedAllocated) : '—';
    const wishlist = $('[data-wishlist]');
    wishlist.setAttribute('aria-pressed', String(state.wishlist));
    wishlist.textContent = state.wishlist ? '✓ Saved to my wishlist' : '☆ Save to my wishlist';
    $('[data-wishlist-status]').textContent = state.wishlist ? (persist ? 'Saved in this browser. Public status is unchanged.' : 'Saved for this visit only. Export to keep a copy.') : 'Wishlist saves stay in this browser.';
    $('[data-empty-records]').hidden = state.resources.length > 0;
    $('[data-undo]').hidden = !undo;
    const list = $('[data-resource-list]');
    list.replaceChildren();
    for (const record of state.resources) {
      const row = document.createElement('li');
      row.className = 'resource-row';
      const header = document.createElement('header');
      const heading = document.createElement('div');
      const stage = document.createElement('span');
      stage.className = 'resource-stage';
      stage.textContent = { lead: 'Prospective lead · not realized', realized: 'Realized · unallocated', allocated: 'Allocated · owner-attested' }[record.stage];
      const name = document.createElement('h4');
      name.textContent = record.title;
      heading.append(stage, name);
      const amount = document.createElement('span');
      amount.className = 'resource-amount';
      amount.textContent = record.amount === null ? 'Unknown' : money.format(record.amount) + (record.stage === 'lead' ? ' est.' : '');
      header.append(heading, amount);
      const evidence = document.createElement('p');
      evidence.className = 'resource-evidence';
      evidence.textContent = record.evidence ? 'Evidence reference: ' + record.evidence : 'Evidence not recorded.';
      const footer = document.createElement('footer');
      const date = document.createElement('time');
      date.dateTime = record.date;
      date.textContent = record.date;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + record.title);
      remove.addEventListener('click', () => {
        undo = record;
        commit(removeResource(state, record.id), 'Resource removed. Undo is available.');
        $('[data-undo]').focus();
      });
      footer.append(date, remove);
      row.append(header, evidence, footer);
      list.append(row);
    }
  }

  function syncNotes() {
    notesForm.elements.namedItem('notes').value = state.notes;
    notesForm.elements.namedItem('nextReviewDate').value = state.nextReviewDate;
  }
  function stageFields() {
    const stage = resourceForm.elements.namedItem('stage').value;
    resourceForm.elements.namedItem('amount').required = stage !== 'lead';
    resourceForm.elements.namedItem('evidence').required = stage !== 'lead';
    resourceForm.elements.namedItem('allocationConfirmed').required = stage === 'allocated';
    $('[data-allocation-row]').hidden = stage !== 'allocated';
    $('[data-amount-hint]').textContent = stage === 'lead' ? '(optional estimate for a lead)' : '(amount actually realized)';
    $('[data-evidence-hint]').textContent = stage === 'lead' ? '(optional for a lead)' : '(required for realized resources)';
    if (stage !== 'allocated') resourceForm.elements.namedItem('allocationConfirmed').checked = false;
  }
  function today() { return new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()); }
  resourceForm.elements.namedItem('date').value = today();
  resourceForm.elements.namedItem('stage').addEventListener('change', stageFields);
  resourceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    const data = new FormData(resourceForm);
    try {
      const next = addResource(state, { title:data.get('title'), stage:data.get('stage'), amount:data.get('amount'), date:data.get('date'), evidence:data.get('evidence'), allocationConfirmed:data.get('allocationConfirmed') === 'on' });
      commit(next, 'Resource record added.');
      resourceForm.reset();
      resourceForm.elements.namedItem('date').value = today();
      stageFields();
      resourceForm.elements.namedItem('title').focus();
    } catch (error) { errorBox.textContent = error.message || 'Could not add that record.'; }
  });
  notesForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      commit({ ...state, notes:notesForm.elements.namedItem('notes').value, nextReviewDate:notesForm.elements.namedItem('nextReviewDate').value }, 'Research notes updated.');
    } catch (error) { say(error.message || 'Could not save notes.'); }
  });
  $('[data-wishlist]').addEventListener('click', () => commit({ ...state, wishlist:!state.wishlist }, state.wishlist ? 'Removed from your wishlist.' : 'Added to your wishlist.'));
  $('[data-undo]').addEventListener('click', () => {
    if (!undo) return;
    try { const next = addResource(state, undo); undo = null; commit(next, 'Resource restored.'); $('[data-resource-list] button:last-child')?.focus(); }
    catch (error) { say(error.message); }
  });
  root.querySelectorAll('[data-open-notebook]').forEach(link => link.addEventListener('click', () => { $('[data-notebook]').open = true; }));
  if (location.hash === '#notebook') $('[data-notebook]').open = true;
  $('[data-export]').addEventListener('click', () => {
    const blob = new Blob([exportDraft(state)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pointcast-collect-001-' + today() + '.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('Export prepared. The file contains your local draft; check your browser downloads.');
  });
  $('[data-import]').addEventListener('change', async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 300000) throw new Error('This file is too large. Import a Collect notebook under 300 KB.');
      const next = parseDraft(await file.text());
      if (!window.confirm('Replace this browser’s notebook with ' + next.resources.length + ' imported resource record(s)? Export your current draft first if you want to keep it.')) return;
      undo = null;
      commit(next, 'Notebook imported.');
      syncNotes();
    } catch (error) { say('Import not applied. ' + (error.message || 'The file could not be read.')); }
    finally { input.value = ''; }
  });
  root.querySelectorAll('[data-wishlist], [data-add-resource], [data-save-notes], [data-export], [data-import]').forEach(control => { control.disabled = false; });
  stageFields();
  syncNotes();
  render();
}

if (typeof document !== 'undefined') {
  const init = () => mountCollect(document.querySelector('[data-collect-goals]'));
  document.addEventListener('astro:page-load', init);
  init();
}
