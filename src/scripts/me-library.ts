import { addKeep, loadKeeps, removeKeep, updateKeep, browserKeeps, importKeeps, importBrowserKeeps, keepsError, type Keep, type KeepDraft, type ShelfMode } from '../lib/keeps-client';
import { POCKET_KEY, SHOPPING_ITEMS } from '../lib/shopping';
import { legacyImportGroups, moveItem, safeKeepUrl } from '../lib/me-library-model.mjs';

type Member = { keepId: string; caption: string; itemId?: string; membershipId?: string };
type Collection = { id: string; title: string; description: string; items: Member[]; version: number; published: boolean; publishedVersion?: number; url?: string };
type Profile = { publicId: string; name: string; bio: string; noun: number; links: Array<{ label: string; url: string }>; featured: string[]; version: number; published: boolean; url?: string };
type Reply = { ok: boolean; reason?: string; message?: string; error?: string; collection?: Collection; collections?: Collection[]; profile?: Profile; preview?: any; previewToken?: string };
const el = <T extends keyof HTMLElementTagNameMap>(tag: T, text = '', className = '') => { const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node; };
const button = (text: string, run: () => unknown, className = '') => { const node = el('button', text, className); node.type = 'button'; node.addEventListener('click', () => { void run(); }); return node; };
const link = (text: string, href: string) => { const node = el('a', text); node.href = href; node.rel = 'noopener noreferrer'; return node; };
const message = (error: unknown) => error instanceof Error ? error.message : 'That did not finish. Please try again.';

export function mountMeLibrary(root: HTMLElement): () => void {
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const lifetime = new AbortController();
  const { signal } = lifetime;
  let epoch = 0;
  let activeUser: string | undefined;
  let keeps: Keep[] = [];
  let visibleLimit = 30;
  let mode: ShelfMode | null = null;
  let collections: Collection[] = [];
  let profile: Profile | null = null;
  let privateLoaded = false;
  let privateLoading: Promise<void> | null = null;
  let editing: Collection | null = null;
  let members: Member[] = [];
  const notice = q('[data-ml-notice]');
  const dialog = q<HTMLDialogElement>('[data-ml-dialog]');
  const collectionForm = q<HTMLFormElement>('[data-ml-collection-editor]');
  const profileForm = q<HTMLFormElement>('[data-ml-profile-form]');
  const field = (form: HTMLFormElement, name: string) => form.elements.namedItem(name) as HTMLInputElement;
  const status = (text: string) => { notice.textContent = text; };

  async function api(path: 'collections' | 'profile', body?: unknown): Promise<Reply> {
    const ticket = epoch;
    const requestAccount = activeUser;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timer = window.setTimeout(abort, 15000);
    try {
      const response = await fetch(`/api/me/${path}`, { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { ...(body ? { 'Content-Type': 'application/json' } : { accept: 'application/json' }), ...(requestAccount ? { 'X-PointCast-Account': requestAccount } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await response.json().catch(() => null) as Reply | null;
      if (ticket !== epoch || signal.aborted) throw new Error('Your account changed. Open this view again.');
      if (response.status === 401 || data?.reason === 'account-changed') { resetPrivate(); keeps = []; mode = 'unavailable'; paintKeeps(); paintCollections(); q('[data-ml-mode]').textContent = 'Your account changed or expired. Reconnect to continue.'; q('[data-ml-retry]').hidden = false; throw new Error('Please sign in again. Your edits have not been published.'); }
      if (response.status === 409) throw new Error('This changed in another window. Close the editor and reopen it to load the latest version before applying your changes.');
      if (!response.ok || !data?.ok) throw new Error(data?.message || data?.error || data?.reason || 'This part of your space is unavailable. Please try again.');
      return data;
    } catch (error) {
      if (controller.signal.aborted && !signal.aborted) throw new Error('The connection took too long. Please try again.');
      throw error;
    } finally { window.clearTimeout(timer); signal.removeEventListener('abort', abort); }
  }

  function resetPrivate() {
    epoch++; visibleLimit = 30; collections = []; profile = null; privateLoaded = false; privateLoading = null; editing = null; members = [];
    collectionForm.reset(); collectionForm.hidden = true;
    q('[data-ml-members]').replaceChildren(); q('[data-ml-collection-status]').textContent = '';
    q('[data-ml-profile-status]').textContent = ''; q('#ml-dialog-title').textContent = '';
    profileForm.reset(); profileForm.hidden = true;
    q('[data-ml-profile-links]').replaceChildren(); q('[data-ml-featured]').replaceChildren();
    q('[data-ml-collections]').replaceChildren();
    if (dialog.open) dialog.close();
    q('[data-ml-dialog-content]').replaceChildren(); q('[data-ml-dialog-actions]').replaceChildren();
  }

  function empty(title: string, text: string, withExplore = false) {
    const box = el('div', '', 'ml-empty'); box.append(el('h3', title), el('p', text));
    if (withExplore) box.append(link('Explore PointCast →', '/'), link('Visit Shortwave →', '/shortwave'));
    return box;
  }
  function paintKeeps() {
    q('[data-ml-count]').textContent = String(keeps.length);
    const rows = q('[data-ml-keeps]');
    q('[data-ml-load-more]').hidden = true; q('[data-ml-showing]').textContent = '';
    if (mode === 'unavailable') { rows.replaceChildren(empty('Your shelf is resting for a moment.', keepsError() || 'We could not reach your account. Try again to load your things.')); return; }
    const term = q<HTMLInputElement>('[data-ml-search]').value.toLocaleLowerCase().trim();
    const filter = q<HTMLSelectElement>('[data-ml-filter]').value;
    const visible = keeps.filter(k => (filter === 'all' || k.kind === filter) && (!term || [k.title, k.url, k.site, k.note, k.text].some(value => value?.toLocaleLowerCase().includes(term))));
    if (!visible.length) { rows.replaceChildren(empty(keeps.length ? 'No matches, yet.' : 'A little space for your discoveries.', keeps.length ? 'Try another word or show everything.' : 'Paste a link above, or tap Keep as you explore. Your saved things will be waiting here.', !keeps.length)); return; }
    q('[data-ml-showing]').textContent = `Showing ${Math.min(visibleLimit, visible.length)} of ${visible.length} ${term || filter !== 'all' ? 'matching' : 'saved'} things`;
    q('[data-ml-load-more]').hidden = visible.length <= visibleLimit;
    rows.replaceChildren(...visible.slice(0, visibleLimit).map(k => {
      const card = el('article', '', 'ml-card');
      const url = safeKeepUrl(k.url);
      let domain = k.kind === 'post' ? 'Shortwave post' : k.site || 'Saved link';
      if (url) { try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { /* safe validator owns URL */ } }
      card.append(el('p', domain, 'ml-card-meta'));
      const title = el('h3');
      const titleText = k.title || (k.kind === 'post' ? k.text || 'Shortwave post' : url || 'Saved thing');
      if (url) title.append(link(titleText, url)); else title.textContent = titleText;
      card.append(title);
      if (k.note) card.append(el('p', `Private note · ${k.note}`, 'ml-note'));
      const actions = el('div', '', 'ml-card-actions');
      actions.append(button('Edit', () => editKeep(k)), button('Remove', () => confirmRemoveKeep(k)));
      if (mode === 'account') actions.append(button('Collect', () => { selectTab('collections'); openCollection(null, k.id); }));
      card.append(actions); return card;
    }));
  }

  function openDialog(title: string, eyebrow = 'VISITOR PREVIEW') {
    q('#ml-dialog-title').textContent = title;
    q('[data-ml-dialog-eyebrow]').textContent = eyebrow;
    q('[data-ml-dialog-content]').replaceChildren(); q('[data-ml-dialog-actions]').replaceChildren(); q('[data-ml-dialog-status]').textContent = '';
    if (!dialog.open) dialog.showModal();
    return { content: q('[data-ml-dialog-content]'), actions: q('[data-ml-dialog-actions]'), status: q('[data-ml-dialog-status]') };
  }
  async function busy(node: HTMLButtonElement, run: () => Promise<void>, output = notice) {
    node.disabled = true;
    try { await run(); } catch (error) { output.textContent = message(error); }
    finally { node.disabled = false; }
  }
  function editKeep(keep: Keep) {
    const box = openDialog('A name, a thought.', 'EDIT SAVED THING');
    const form = el('form');
    const fields = el('div', '', 'ml-fields');
    const nameLabel = el('label', 'Title'); const name = el('input'); name.maxLength = 160; name.value = keep.title; nameLabel.append(name);
    const noteLabel = el('label', 'Private note'); const note = el('textarea'); note.maxLength = 140; note.value = keep.note; noteLabel.append(note);
    fields.append(nameLabel, noteLabel); form.append(fields);
    const save = el('button', 'Save changes', 'ml-primary'); save.type = 'submit'; form.append(save);
    form.addEventListener('submit', event => { event.preventDefault(); void busy(save, async () => {
      if (!await updateKeep(keep.id, { title: name.value.trim(), note: note.value.trim() }, keep.version || 1, keep.itemId)) throw new Error(keepsError() || 'Could not save these changes.');
      dialog.close(); status('Saved. Your note stays private.');
    }, box.status); });
    box.content.append(form);
  }
  function confirmRemoveKeep(keep: Keep) {
    const box = openDialog('Remove this saved thing?', 'YOUR LIBRARY');
    box.content.append(el('p', 'This removes it from Saved and every collection, including public displays. Other saved things stay in place.'));
    const remove = button('Remove from Saved', () => busy(remove, async () => {
      if (!await removeKeep(keep.id, keep.version, keep.itemId)) throw new Error(keepsError() || 'Could not remove this saved thing.');
      dialog.close(); privateLoaded = false; void loadPrivate();
      status('Removed from Saved and public displays.');
      const undo = button('Undo removal', () => busy(undo, async () => { if (!await addKeep(keep)) throw new Error(keepsError() || 'Could not restore this item.'); status('Restored privately to Saved. Add it to collections and publish again when ready.'); }));
      notice.append(' ', undo); window.setTimeout(() => undo.remove(), 15000);
    }, box.status), 'ml-danger');
    box.actions.append(button('Cancel', () => dialog.close()), remove);
  }

  function paintImports() {
    const sources = q('[data-ml-import-sources]'); sources.className = 'ml-import-sources'; sources.replaceChildren();
    let groups = legacyImportGroups((key: string) => { try { return localStorage.getItem(key); } catch { return null; } }, SHOPPING_ITEMS) as Array<{ label: string; items: KeepDraft[] }>;
    if (mode === 'account' && browserKeeps().length) groups = [{ label: 'Browser Keeps', items: browserKeeps() }, ...groups];
    for (const group of groups) {
      if (!group.items.length) continue;
      sources.append(button(`${group.label} · ${group.items.length} to review`, () => reviewImport(group.label, group.items)));
    }
    if (!sources.childElementCount) sources.append(el('p', 'No older saves found in these sources on this browser.', 'ml-muted'));
  }
  function reviewImport(source: string, items: KeepDraft[]) {
    const box = openDialog(`Bring ${source} into Saved`, 'REVIEW IMPORT');
    const accountRoot = root.closest<HTMLElement>('[data-me-root]');
    const destinationName = accountRoot?.dataset.meAccountId === activeUser ? accountRoot?.querySelector<HTMLElement>('[data-me-name]')?.textContent?.trim() : '';
    box.content.append(el('p', mode === 'account' ? `Selected things will be copied to ${destinationName ? `${destinationName}’s PointCast account` : 'your signed-in PointCast account'}. Unacknowledged items remain in their original browser list.` : 'Sign in to import these things to an account. Your original browser lists will stay here.'));
    const selected = new Set(items.map((_, i) => i));
    items.forEach((item, i) => { const label = el('label', '', 'ml-feature'); const check = el('input'); check.type = 'checkbox'; check.checked = true; check.addEventListener('change', () => check.checked ? selected.add(i) : selected.delete(i)); label.append(check, el('span', item.title || item.url || item.text || 'Saved thing')); box.content.append(label); });
    const importButton = button('Import selected', () => busy(importButton, async () => {
      if (!selected.size) throw new Error('Choose at least one thing to import.');
      const chosen = items.filter((_, i) => selected.has(i));
      // The special all-browser operation clears only acknowledged items. Other sources stay intact.
      const result = source === 'Browser Keeps' && selected.size === items.length ? await importBrowserKeeps() : await importKeeps(chosen);
      box.status.textContent = result.complete ? `Imported ${chosen.length} selected things. Existing saves were preserved.` : `${result.acceptedIds.length} accepted. ${result.remaining.length} still need importing. ${keepsError() || 'You can safely try again.'}`;
      if (result.complete) { importButton.remove(); box.actions.append(button('Done', () => dialog.close())); }
      paintImports();
    }, box.status), 'ml-primary');
    importButton.disabled = mode !== 'account';
    box.actions.append(importButton);
    if (mode !== 'account') box.actions.append(link('Sign in to import →', '/auth?returnTo=%2Fme%23saved'));
  }

  function selectTab(tab: string) {
    const selected = ['saved', 'collections', 'profile'].includes(tab) ? tab : 'saved';
    root.querySelectorAll<HTMLElement>('[data-ml-panel]').forEach(panel => { panel.hidden = panel.dataset.mlPanel !== selected; });
    root.querySelectorAll<HTMLAnchorElement>('[data-ml-tab]').forEach(item => { if (item.dataset.mlTab === selected) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current'); });
    if (selected !== 'saved') void loadPrivate();
  }
  function paintCollections() {
    const rows = q('[data-ml-collections]');
    q<HTMLButtonElement>('[data-ml-new-collection]').disabled = mode !== 'account';
    if (mode !== 'account') { rows.replaceChildren(empty('Make room for a collection.', mode === 'unavailable' ? 'Your account is unavailable. Try again to open your collections.' : 'Sign in to arrange your saved things into collections. Your browser saves will stay here until you choose to import them.')); return; }
    if (!collections.length) { rows.replaceChildren(empty('A collection starts with one good thing.', 'Gather songs for a slow morning, useful pages, or ideas to come back to.')); return; }
    rows.replaceChildren(...collections.map(collection => {
      const card = el('article', '', 'ml-card');
      card.append(el('p', collection.published ? 'Public · changes stay draft until published' : 'Private draft', 'ml-card-meta'), el('h3', collection.title), el('p', collection.description), el('p', `${collection.items.length} saved thing${collection.items.length === 1 ? '' : 's'}`));
      const actions = el('div', '', 'ml-card-actions');
      actions.append(button('Arrange', () => openCollection(collection)), button('Preview', () => choosePublication(collection)));
      if (collection.published) {
        if (collection.url) actions.append(link('View public ↗', collection.url));
        actions.append(button('Unpublish', () => unpublishCollection(collection)));
      }
      card.append(actions); return card;
    }));
  }
  async function loadPrivate() {
    if (mode !== 'account') { paintCollections(); q('[data-ml-profile-gate]').textContent = mode === 'unavailable' ? 'Your account is unavailable. Try again to open your profile.' : 'Sign in to make a profile. Publishing is always your choice.'; profileForm.hidden = true; return; }
    if (privateLoaded) return;
    if (privateLoading) return privateLoading;
    const ticket = epoch;
    privateLoading = (async () => {
      q('[data-ml-collections]').replaceChildren(empty('Opening your collections…', 'Your saved things remain available.'));
      q('[data-ml-profile-gate]').textContent = 'Opening your profile…';
      const results = await Promise.allSettled([api('collections'), api('profile')]);
      if (ticket !== epoch || signal.aborted) return;
      const [collectionResult, profileResult] = results;
      if (collectionResult.status === 'fulfilled') { collections = collectionResult.value.collections || []; paintCollections(); }
      else { q('[data-ml-collections]').replaceChildren(empty('Collections could not load.', message(collectionResult.reason)), button('Try collections again', () => loadPrivate())); }
      if (profileResult.status === 'fulfilled') { profile = profileResult.value.profile || null; paintProfile(); }
      else { q('[data-ml-profile-gate]').replaceChildren(el('span', message(profileResult.reason)), button('Try profile again', () => loadPrivate())); }
      privateLoaded = results.every(result => result.status === 'fulfilled');
    })().finally(() => { if (ticket === epoch) privateLoading = null; });
    return privateLoading;
  }
  function openCollection(collection: Collection | null, initialKeep?: string) {
    editing = collection; members = collection ? collection.items.map(item => ({ ...item })) : initialKeep ? [{ keepId: initialKeep, caption: '' }] : [];
    collectionForm.hidden = false; collectionForm.reset();
    field(collectionForm, 'title').value = collection?.title || '';
    field(collectionForm, 'description').value = collection?.description || '';
    q('[data-ml-collection-heading]').textContent = collection ? 'Arrange your collection' : 'New collection';
    q('[data-ml-delete-collection]').hidden = !collection;
    q('[data-ml-collection-status]').textContent = '';
    paintMembers(); field(collectionForm, 'title').focus();
  }
  function paintMembers() {
    const list = q('[data-ml-members]');
    const candidates = [...members.map(member => keeps.find(keep => keep.id === member.keepId)).filter(Boolean), ...keeps.filter(keep => !members.some(member => member.keepId === keep.id))] as Keep[];
    if (!candidates.length) { list.replaceChildren(el('p', 'Keep a link in Saved, then add it here.', 'ml-muted')); return; }
    list.replaceChildren(...candidates.map(keep => {
      const row = el('div', '', 'ml-member'); const index = members.findIndex(member => member.keepId === keep.id);
      const label = el('label'); const check = el('input'); check.type = 'checkbox'; check.checked = index >= 0;
      check.addEventListener('change', () => { if (check.checked) members.push({ keepId: keep.id, caption: '' }); else members = members.filter(member => member.keepId !== keep.id); paintMembers(); });
      label.append(check, el('span', keep.title || keep.text || keep.url)); row.append(label);
      if (index >= 0) {
        const controls = el('div', '', 'ml-member-actions');
        const reorder = (direction: number) => { members = moveItem(members, index, direction); paintMembers(); const moved = list.querySelectorAll<HTMLElement>('.ml-member')[index + direction]; moved?.querySelector<HTMLButtonElement>(`button[data-direction="${direction}"]`)?.focus(); };
        const up = button('↑', () => reorder(-1)); up.disabled = index === 0; up.dataset.direction = '-1'; up.setAttribute('aria-label', `Move ${keep.title || 'item'} up`);
        const down = button('↓', () => reorder(1)); down.disabled = index === members.length - 1; down.dataset.direction = '1'; down.setAttribute('aria-label', `Move ${keep.title || 'item'} down`);
        controls.append(up, down); row.append(controls);
        const caption = el('input'); caption.value = members[index].caption || ''; caption.maxLength = 280; caption.placeholder = 'Public caption (optional)'; caption.setAttribute('aria-label', `Public caption for ${keep.title || 'saved item'}`); caption.addEventListener('input', () => { const member = members.find(m => m.keepId === keep.id); if (member) member.caption = caption.value; }); row.append(caption);
      }
      return row;
    }));
  }
  async function saveCollection(): Promise<Collection> {
    if (!collectionForm.reportValidity()) throw new Error('Give your collection a title.');
    const body = { action: editing ? 'update' : 'create', ...(editing ? { id: editing.id, version: editing.version } : {}), title: field(collectionForm, 'title').value.trim(), description: field(collectionForm, 'description').value.trim(), items: members.map(({ keepId, caption }) => ({ keepId, caption })) };
    const result = await api('collections', body);
    if (!result.collection) throw new Error('The collection was not returned. Reload before continuing.');
    editing = result.collection; members = editing.items.map(item => ({ ...item }));
    collections = [editing, ...collections.filter(c => c.id !== editing!.id)];
    q('[data-ml-delete-collection]').hidden = false; q('[data-ml-collection-status]').textContent = 'Draft saved. New changes are private until you publish them. Removed cards are withdrawn from public displays.';
    paintCollections(); paintFeatured(); return editing;
  }
  function choosePublication(collection: Collection) {
    const box = openDialog('Choose what to display', 'COLLECTION PUBLICATION');
    box.content.append(el('p', 'Choose the links visitors should see. The next step shows the exact public page. Private notes and Shortwave excerpts stay in your library.'));
    const selected = new Set(collection.items.filter(item => keeps.find(keep => keep.id === item.keepId)?.kind === 'link').map(item => item.keepId));
    collection.items.forEach(item => {
      const keep = keeps.find(k => k.id === item.keepId); if (!keep) return;
      const privateOnly = keep.kind === 'post';
      const label = el('label', '', 'ml-feature'); const check = el('input'); check.type = 'checkbox'; check.checked = selected.has(item.keepId); check.disabled = privateOnly;
      check.addEventListener('change', () => check.checked ? selected.add(item.keepId) : selected.delete(item.keepId));
      label.append(check, el('span', `${keep.title || keep.text || keep.url}${privateOnly ? ' · Private only · Shortwave excerpt' : ''}`)); box.content.append(label);
    });
    const preview = button('Preview selected cards →', () => busy(preview, async () => {
      const selectedKeepIds = collection.items.map(item => item.keepId).filter(id => selected.has(id));
      const result = await api('collections', { action: 'preview', id: collection.id, version: collection.version, selectedKeepIds });
      showCollectionPreview(collection, selectedKeepIds, result);
    }, box.status), 'ml-primary');
    box.actions.append(preview);
  }
  function appendPreviewCard(target: HTMLElement, card: any) {
    const view = el('article', '', 'ml-card'); const title = el('h3');
    const url = safeKeepUrl(typeof card.url === 'string' && card.url.startsWith('/') && !card.url.startsWith('//') ? `https://pointcast.xyz${card.url}` : card.url);
    if (url) title.append(link(String(card.title || url), url)); else title.textContent = String(card.title || 'Saved thing');
    view.append(title); if (card.caption) view.append(el('p', String(card.caption))); target.append(view);
  }
  function showCollectionPreview(collection: Collection, selectedKeepIds: string[], result: Reply) {
    if (!result.preview || !result.previewToken) throw new Error('The visitor preview could not be verified.');
    const box = openDialog(String(result.preview.title));
    box.content.append(el('p', String(result.preview.description || '')));
    (result.preview.items || []).forEach((card: unknown) => appendPreviewCard(box.content, card));
    box.content.append(el('p', `${selectedKeepIds.length} selected cards · shared by a PointCast member`, 'ml-muted'));
    const publish = button(collection.published ? 'Publish changes' : 'Publish collection', () => busy(publish, async () => {
      const published = await api('collections', { action: 'publish', id: collection.id, version: collection.version, selectedKeepIds, previewToken: result.previewToken });
      const updated = published.collection;
      if (updated) { collections = collections.map(c => c.id === updated.id ? updated : c); if (editing?.id === updated.id) editing = updated; }
      box.status.textContent = 'Published. Visitors can now see exactly these selected cards.';
      box.actions.replaceChildren(button('Done', () => dialog.close()));
      if (updated?.url) addShare(box.actions, updated.url);
      paintCollections(); paintFeatured();
    }, box.status), 'ml-primary');
    box.actions.append(button('Back to selection', () => choosePublication(collection)), publish);
  }
  function addShare(target: HTMLElement, url: string) {
    const absolute = new URL(url, window.location.origin).href;
    target.append(link('Open public page ↗', absolute), button('Copy link', async () => { try { await navigator.clipboard.writeText(absolute); q('[data-ml-dialog-status]').textContent = 'Link copied.'; } catch { q('[data-ml-dialog-status]').replaceChildren(el('span', 'Copy this link: '), link(absolute, absolute)); } }));
  }
  function unpublishCollection(collection: Collection) {
    const box = openDialog('Take this collection off display?', 'UNPUBLISH COLLECTION');
    box.content.append(el('p', 'Its public URL will stop showing the collection. Your draft and saved things stay in your account.'));
    const unpublish = button('Unpublish collection', () => busy(unpublish, async () => {
      const result = await api('collections', { action: 'unpublish', id: collection.id, version: collection.version });
      if (result.collection) collections = collections.map(c => c.id === collection.id ? result.collection! : c);
      dialog.close(); paintCollections(); paintFeatured(); status('Collection unpublished. Your draft is still here.');
    }, box.status)); box.actions.append(button('Cancel', () => dialog.close()), unpublish);
  }
  function deleteCollection() {
    const collection = editing; if (!collection) return;
    const box = openDialog('Delete this collection?', 'YOUR COLLECTIONS');
    box.content.append(el('p', 'The collection and its public page will be removed. Every saved thing stays in Saved and in any other collections.'));
    const remove = button('Delete collection', () => busy(remove, async () => {
      await api('collections', { action: 'delete', id: collection.id, version: collection.version });
      collections = collections.filter(c => c.id !== collection.id); editing = null; collectionForm.hidden = true; dialog.close(); paintCollections(); paintFeatured(); status('Collection deleted. Your saved things are still here.');
      const undo = button('Undo deletion', () => busy(undo, async () => {
        const restored = await api('collections', { action: 'create', title: collection.title, description: collection.description, items: collection.items.map(({ keepId, caption }) => ({ keepId, caption })) });
        if (restored.collection) collections = [restored.collection, ...collections];
        paintCollections(); status('Collection restored as a private draft with a new URL. Publish again when ready.');
      })); notice.append(' ', undo); window.setTimeout(() => undo.remove(), 15000);
    }, box.status), 'ml-danger'); box.actions.append(button('Cancel', () => dialog.close()), remove);
  }

  function addProfileLink(value = { label: '', url: '' }) {
    const rows = q('[data-ml-profile-links]'); if (rows.children.length >= 8) return;
    const row = el('div', '', 'ml-profile-link'); const label = el('input'); label.name = 'linkLabel'; label.maxLength = 60; label.value = value.label; label.placeholder = 'Label'; label.setAttribute('aria-label', 'Link label');
    const url = el('input'); url.name = 'linkUrl'; url.type = 'url'; url.maxLength = 600; url.value = value.url; url.placeholder = 'https://'; url.setAttribute('aria-label', 'Link URL');
    row.append(label, url, button('×', () => row.remove())); row.querySelector('button')!.setAttribute('aria-label', 'Remove profile link'); rows.append(row);
  }
  function paintFeatured() {
    const list = q('[data-ml-featured]'); const published = collections.filter(c => c.published);
    list.replaceChildren(...published.map(collection => { const row = el('label', '', 'ml-feature'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.name = 'featured'; checkbox.value = collection.id; checkbox.checked = profile?.featured?.includes(collection.id) || false; row.append(checkbox, el('span', collection.title)); return row; }));
    if (!published.length) list.append(el('p', 'Publish a collection to feature it here.', 'ml-muted'));
  }
  function paintProfile() {
    q('[data-ml-profile-gate]').textContent = profile ? '' : 'Profile could not load. Try again.';
    profileForm.hidden = !profile; if (!profile) return;
    field(profileForm, 'name').value = profile.name || '';
    field(profileForm, 'bio').value = profile.bio || '';
    field(profileForm, 'noun').value = String(profile.noun ?? 404);
    q('[data-ml-profile-links]').replaceChildren(); profile.links.forEach(addProfileLink);
    q('[data-ml-profile-state]').textContent = profile.published ? 'Public · edits stay private' : 'Private draft';
    q('[data-ml-unpublish-profile]').hidden = !profile.published;
    const publicLink = q<HTMLAnchorElement>('[data-ml-profile-url]'); publicLink.hidden = !profile.published || !profile.url; publicLink.href = profile.url || '#';
    paintFeatured();
  }
  async function saveProfile() {
    if (!profile || !profileForm.reportValidity()) throw new Error('Check your profile fields before saving.');
    const links = Array.from(q('[data-ml-profile-links]').children).map(row => { const inputs = row.querySelectorAll('input'); return { label: inputs[0].value.trim(), url: inputs[1].value.trim() }; }).filter(item => item.label || item.url);
    if (links.some(item => !item.label || !safeKeepUrl(item.url))) throw new Error('Each profile link needs a label and a full https:// URL.');
    const featured = Array.from(profileForm.querySelectorAll<HTMLInputElement>('input[name="featured"]:checked')).map(item => item.value);
    if (featured.length > 6) throw new Error('Choose up to six featured collections.');
    const result = await api('profile', { action: 'update', version: profile.version, name: field(profileForm, 'name').value.trim(), bio: field(profileForm, 'bio').value.trim(), noun: Number(field(profileForm, 'noun').value), links, featured });
    if (!result.profile) throw new Error('Your profile was not returned. Reload before continuing.');
    profile = result.profile; q('[data-ml-profile-status]').textContent = 'Draft saved. Publish when you are ready.'; return profile;
  }
  async function previewProfile() {
    const saved = await saveProfile();
    const result = await api('profile', { action: 'preview', version: saved.version });
    if (!result.preview || !result.previewToken) throw new Error('The visitor preview could not be verified.');
    const box = openDialog(String(result.preview.name || 'Your profile'));
    const noun = el('img'); noun.src = `https://noun.pics/${Number(result.preview.noun) || 0}.svg`; noun.width = 72; noun.height = 72; noun.alt = 'Profile Noun'; box.content.append(noun, el('p', String(result.preview.bio || '')));
    for (const item of result.preview.links || []) { const url = safeKeepUrl(item.url); if (url) { const p = el('p'); p.append(link(String(item.label), url)); box.content.append(p); } }
    for (const item of result.preview.featured || []) {
      if (typeof item === 'object') appendPreviewCard(box.content, item);
      else { const collection = collections.find(c => c.id === item); if (collection?.published) appendPreviewCard(box.content, { title: collection.title, url: collection.url }); }
    }
    const publish = button(saved.published ? 'Publish changes' : 'Publish profile', () => busy(publish, async () => {
      const published = await api('profile', { action: 'publish', version: saved.version, previewToken: result.previewToken });
      profile = published.profile || saved; paintProfile(); box.status.textContent = 'Your profile is published.'; box.actions.replaceChildren(button('Done', () => dialog.close())); if (profile.url) addShare(box.actions, profile.url);
    }, box.status), 'ml-primary'); box.actions.append(publish);
  }
  function unpublishProfile() {
    if (!profile) return;
    const box = openDialog('Take your profile off display?', 'UNPUBLISH PROFILE');
    const publicCollections = collections.filter(c => c.published);
    box.content.append(el('p', 'Your profile URL will stop showing this page. Its private draft stays in your account.'));
    if (publicCollections.length) { box.content.append(el('p', 'These collections are independently public:')); publicCollections.forEach(c => box.content.append(el('p', c.title))); }
    const takeDown = async (all: boolean) => { if (all) { for (const c of publicCollections) await api('collections', { action: 'unpublish', id: c.id, version: c.version }); } const result = await api('profile', { action: 'unpublish', version: profile!.version }); profile = result.profile || null; dialog.close(); privateLoaded = false; await loadPrivate(); status(all ? 'Profile and collections unpublished.' : 'Profile unpublished. Independently public collections remain available.'); };
    const only = button('Unpublish profile', () => busy(only, () => takeDown(false), box.status)); box.actions.append(only);
    if (publicCollections.length) { const all = button('Unpublish profile & all collections', () => busy(all, () => takeDown(true), box.status)); box.actions.append(all); }
  }

  async function refresh() {
    const result = await loadKeeps(true);
    if (signal.aborted) return;
    acceptShelf(result);
  }
  function acceptShelf(result: { keeps: Keep[]; mode: ShelfMode; userId?: string }) {
    if (result.userId !== activeUser || mode !== result.mode) { resetPrivate(); activeUser = result.userId; }
    mode = result.mode; keeps = result.keeps;
    q('[data-ml-mode]').textContent = mode === 'account' ? 'Private to your account · your saved things travel with you' : mode === 'browser' ? 'Saved in this browser · only on this device' : keepsError() || 'Your account could not be reached.';
    q('[data-ml-signin]').hidden = mode !== 'browser'; q('[data-ml-retry]').hidden = mode !== 'unavailable';
    q<HTMLButtonElement>('[data-ml-save] button[type="submit"]').disabled = mode === 'unavailable';
    paintKeeps(); paintImports(); paintCollections();
    if (mode === 'account') void loadPrivate();
    else { profileForm.hidden = true; q('[data-ml-profile-gate]').textContent = mode === 'browser' ? 'Sign in to make a profile. Publishing is always your choice.' : 'Reconnect to open your profile.'; }
  }

  q<HTMLFormElement>('[data-ml-save]').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!; void busy(submit, async () => {
    const url = safeKeepUrl(field(form, 'url').value);
    if (!url) throw new Error('Use a full https:// link or a PointCast path such as /b/0001, without a username or password.');
    const saved = await addKeep({ kind: 'link', url, title: field(form, 'title').value.trim() || new URL(url).hostname, note: field(form, 'note').value.trim(), site: new URL(url).hostname });
    if (!saved) throw new Error(keepsError() || 'Could not keep this link. Please try again.');
    form.reset(); status(mode === 'account' ? 'Kept privately in your account.' : 'Kept in this browser.');
  }); }, { signal });
  const resetFilter = () => { visibleLimit = 30; paintKeeps(); };
  q('[data-ml-search]').addEventListener('input', resetFilter, { signal }); q('[data-ml-filter]').addEventListener('change', resetFilter, { signal });
  q('[data-ml-load-more]').addEventListener('click', () => { const previous = visibleLimit; visibleLimit += 30; paintKeeps(); q('[data-ml-keeps]').children[previous]?.querySelector<HTMLElement>('a,button')?.focus(); }, { signal });
  q('[data-ml-retry]').addEventListener('click', () => { void refresh(); }, { signal });
  q('[data-ml-dialog-close]').addEventListener('click', () => dialog.close(), { signal });
  q('[data-ml-new-collection]').addEventListener('click', () => openCollection(null), { signal });
  q('[data-ml-close-collection]').addEventListener('click', () => { collectionForm.hidden = true; editing = null; privateLoaded = false; void loadPrivate(); }, { signal });
  q('[data-ml-delete-collection]').addEventListener('click', deleteCollection, { signal });
  collectionForm.addEventListener('submit', event => { event.preventDefault(); void busy(collectionForm.querySelector<HTMLButtonElement>('[type="submit"]')!, async () => { await saveCollection(); }, q('[data-ml-collection-status]')); }, { signal });
  q('[data-ml-preview-collection]').addEventListener('click', event => { const target = event.currentTarget as HTMLButtonElement; void busy(target, async () => choosePublication(await saveCollection()), q('[data-ml-collection-status]')); }, { signal });
  q('[data-ml-add-profile-link]').addEventListener('click', () => addProfileLink(), { signal });
  profileForm.addEventListener('submit', event => { event.preventDefault(); void busy(profileForm.querySelector<HTMLButtonElement>('[type="submit"]')!, async () => { await saveProfile(); }, q('[data-ml-profile-status]')); }, { signal });
  q('[data-ml-preview-profile]').addEventListener('click', event => { void busy(event.currentTarget as HTMLButtonElement, previewProfile, q('[data-ml-profile-status]')); }, { signal });
  q('[data-ml-unpublish-profile]').addEventListener('click', unpublishProfile, { signal });
  q('[data-ml-export]').addEventListener('click', event => { void busy(event.currentTarget as HTMLButtonElement, async () => {
    if (mode === 'unavailable') throw new Error('Reconnect before exporting your account library.');
    const ticket = epoch;
    const requestAccount = activeUser;
    let blob: Blob;
    if (mode === 'account') {
      if (!requestAccount) throw new Error('Reconnect before exporting your account library.');
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      const timer = window.setTimeout(abort, 15000);
      try {
        const response = await fetch('/api/me/export', { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json', 'X-PointCast-Account': requestAccount }, signal: controller.signal });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || (response.status === 401 || response.status === 409 ? 'Your account changed or expired. Reconnect before exporting.' : 'Could not export your account library. Please try again.'));
        }
        blob = await response.blob();
      } finally { window.clearTimeout(timer); signal.removeEventListener('abort', abort); }
    } else {
      blob = new Blob([JSON.stringify({ format: 'pointcast-me-v1', exportedAt: new Date().toISOString(), storage: 'browser', keeps, collections: [], profile: null }, null, 2)], { type: 'application/json' });
    }
    if (ticket !== epoch || signal.aborted || requestAccount !== activeUser) throw new Error('Your account changed. Export again from the current account.');
    const url = URL.createObjectURL(blob); const anchor = link('Export', url); anchor.download = 'pointcast-me.json'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); status(mode === 'account' ? 'Exported your saved things, drafts and published snapshots.' : 'Exported your browser saves.');
  }); }, { signal });
  root.querySelectorAll<HTMLAnchorElement>('[data-ml-tab]').forEach(item => item.addEventListener('click', () => selectTab(item.dataset.mlTab || 'saved'), { signal }));
  window.addEventListener('hashchange', () => selectTab(window.location.hash.slice(1)), { signal });
  window.addEventListener('pc:keeps:change', event => { const detail = (event as CustomEvent).detail; if (detail?.mode) acceptShelf(detail); }, { signal });
  window.addEventListener('pc:auth-change', () => { resetPrivate(); keeps = []; mode = 'unavailable'; paintKeeps(); paintCollections(); q('[data-ml-mode]').textContent = 'Checking your account…'; void refresh(); }, { signal });
  window.addEventListener('storage', event => { if ([POCKET_KEY, 'sparrow:saved', 'pc:dock:saved:v1', 'pc:keeps'].includes(event.key || '')) paintImports(); }, { signal });
  const suggestedUrl = safeKeepUrl(new URLSearchParams(window.location.search).get('keep') || '');
  if (suggestedUrl) field(q<HTMLFormElement>('[data-ml-save]'), 'url').value = suggestedUrl;
  selectTab(window.location.hash === '#kept' ? 'saved' : window.location.hash.slice(1));
  void refresh().catch(error => status(message(error)));
  return () => { epoch++; lifetime.abort(); if (dialog.open) dialog.close(); };
}

let cleanup: (() => void) | undefined;
function initMeLibrary() { cleanup?.(); const root = document.querySelector<HTMLElement>('[data-me-library]'); cleanup = root ? mountMeLibrary(root) : undefined; }
if (typeof document !== 'undefined') { document.addEventListener('astro:page-load', initMeLibrary); initMeLibrary(); }
