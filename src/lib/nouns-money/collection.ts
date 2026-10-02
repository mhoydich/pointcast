import { SOURCE_NOTES } from './catalog.ts';
const DEVICE_KEY = 'pointcast:nouns-money:source-100:device:v1';
const validIds = new Set(SOURCE_NOTES.map(note => note.id));
const normalize = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && validIds.has(id)))].sort() : [];
export type CollectionView = { noteIds: string[]; storage: 'loading' | 'account' | 'device' | 'memory' | 'unavailable'; userId: string | null; busy: boolean; message: string };
/** The account response is authoritative. No browser-global cache is uploaded. */
export class NounsMoneyCollection {
  view: CollectionView = { noteIds: [], storage: 'loading', userId: null, busy: true, message: 'Reading collection…' };
  private epoch = 0;
  private listeners = new Set<(view: CollectionView) => void>();
  private localIds: string[] = [];
  private durable = true;
  subscribe(callback: (view: CollectionView) => void) { this.listeners.add(callback); callback(this.view); return () => this.listeners.delete(callback); }
  private emit() { for (const listener of this.listeners) listener(this.view); }
  private readDevice() {
    try { this.localIds = normalize(JSON.parse(localStorage.getItem(DEVICE_KEY) || '[]')); }
    catch { try { localStorage.getItem(DEVICE_KEY); this.localIds = []; } catch { this.durable = false; } }
  }
  async refresh() {
    const epoch = ++this.epoch;
    this.view = { noteIds: [], storage: 'loading', userId: null, busy: true, message: 'Reading collection…' }; this.emit();
    try {
      const response = await fetch('/api/me/nouns-money', { credentials: 'same-origin', cache: 'no-store' });
      if (epoch !== this.epoch) return;
      if (response.status === 401) {
        if (this.durable) this.readDevice();
        this.view = { noteIds: [...this.localIds], storage: this.durable ? 'device' : 'memory', userId: null, busy: false,
          message: this.durable ? 'Collected on this device. Sign-in starts a separate account collection; device notes are never uploaded automatically.' : 'Storage unavailable. Collection lasts for this visit only.' };
      } else {
        const data = await response.json();
        if (epoch !== this.epoch) return;
        if (!response.ok || !data.ok || typeof data.userId !== 'string' || !Array.isArray(data.noteIds)) throw new Error(data.reason || 'Collection is unavailable.');
        this.view = { noteIds: normalize(data.noteIds), storage: 'account', userId: data.userId, busy: false, message: 'Saved to your PointCast account. Reload or sign in on another device to find these notes.' };
      }
    } catch {
      if (epoch !== this.epoch) return;
      this.view = { noteIds: [], storage: 'unavailable', userId: null, busy: false, message: 'Account collection could not be read. Retry to reconnect; no unsaved collection is shown as saved.' };
    }
    this.emit();
  }
  async toggle(noteId: string) {
    if (!validIds.has(noteId) || this.view.busy || !['device', 'memory', 'account'].includes(this.view.storage)) return;
    const epoch = this.epoch;
    const remove = this.view.noteIds.includes(noteId);
    if (this.view.storage !== 'account') {
      if (this.durable) this.readDevice();
      this.localIds = remove ? this.localIds.filter(id => id !== noteId) : normalize([...this.localIds, noteId]);
      try { localStorage.setItem(DEVICE_KEY, JSON.stringify(this.localIds)); } catch { this.durable = false; }
      this.view = { ...this.view, noteIds: [...this.localIds], storage: this.durable ? 'device' : 'memory', message: this.durable ? 'Collected on this device only. Clearing browser data removes this list. Sign-in starts a separate account collection.' : 'Storage unavailable. Collection lasts for this visit only.' }; this.emit(); return;
    }
    const userId = this.view.userId;
    this.view = { ...this.view, busy: true, message: remove ? 'Removing note…' : 'Saving note…' }; this.emit();
    try {
      const response = await fetch('/api/me/nouns-money', { method: remove ? 'DELETE' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-PointCast-User': userId! }, body: JSON.stringify({ noteId }) });
      const data = await response.json();
      if (epoch !== this.epoch) return;
      if (response.status === 401 || data.reason === 'account-changed' || data.userId && data.userId !== userId) { await this.refresh(); return; }
      if (!response.ok || !data.ok) throw new Error(data.reason || 'Save failed');
      this.view = { noteIds: normalize(data.noteIds), storage: 'account', userId, busy: false, message: remove ? 'Removed from your account collection. You can collect this note again.' : 'Saved to your PointCast account.' };
    } catch {
      if (epoch !== this.epoch) return;
      this.view = { ...this.view, busy: false, message: 'That change was not confirmed. Retry or reload before continuing.' };
    }
    this.emit();
  }
  deviceStorageChanged() { if (this.view.storage === 'device') { this.readDevice(); this.view = { ...this.view, noteIds: [...this.localIds] }; this.emit(); } }
  dispose() { ++this.epoch; this.listeners.clear(); }
}
export const DEVICE_COLLECTION_KEY = DEVICE_KEY;
