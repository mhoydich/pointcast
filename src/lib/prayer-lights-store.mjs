export const COLORS = ['honey', 'rose', 'sage', 'sky', 'lilac', 'ivory'];
export const BACKUP_FORMAT = 'pointcast.prayer-lights/v1';

export function validateLight(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !/^[\w-]{1,100}$/.test(value.id)
    || !COLORS.includes(value.color) || typeof value.intention !== 'string' || value.intention.length > 280
    || !Number.isSafeInteger(value.createdAt) || value.createdAt < 0 || value.createdAt > 8640000000000000) {
    throw new Error('This backup contains an invalid light. Your existing lights are safe.');
  }
  return { id: value.id, color: value.color, intention: value.intention, createdAt: value.createdAt };
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (data?.format !== BACKUP_FORMAT || !Array.isArray(data.lights)) throw new Error('Choose a Prayer Lights JSON backup.');
  return data.lights.map(validateLight);
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function finished(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error('The save did not finish.'));
    transaction.onerror = () => {}; // The abort event carries the final transaction result.
  });
}

export async function openLightStore(indexedDB, keyRange) {
  if (!indexedDB) throw new Error('Browser storage is unavailable.');
  const open = indexedDB.open('pointcast-prayer-lights', 1);
  open.onupgradeneeded = () => {
    const lights = open.result.createObjectStore('lights', { keyPath: 'seq', autoIncrement: true });
    lights.createIndex('id', 'id', { unique: true });
    lights.createIndex('createdAt', 'createdAt');
  };
  const db = await requestResult(open);
  db.onversionchange = () => db.close();

  return {
    async add(light) {
      const record = validateLight(light);
      const tx = db.transaction('lights', 'readwrite');
      const done = finished(tx);
      const request = tx.objectStore('lights').add(record);
      let seq;
      request.onsuccess = () => { seq = request.result; };
      await done;
      return { ...record, seq };
    },
    async page(before, limit = 48) {
      const tx = db.transaction('lights');
      const range = before === undefined ? undefined : keyRange.upperBound(before, true);
      const records = [];
      await new Promise((resolve, reject) => {
        const request = tx.objectStore('lights').openCursor(range, 'prev');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor || records.length >= limit) return resolve();
          records.push(cursor.value);
          cursor.continue();
        };
      });
      return records;
    },
    async stats(now = new Date()) {
      const tx = db.transaction('lights');
      const store = tx.objectStore('lights');
      const total = requestResult(store.count());
      const days = Array.from({ length: 7 }, (_, i) => {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
        return requestResult(store.index('createdAt').count(keyRange.bound(+start, +end, false, true)));
      });
      return { total: await total, days: await Promise.all(days) };
    },
    async export() {
      return requestResult(db.transaction('lights').objectStore('lights').getAll());
    },
    async import(records) {
      const valid = [...new Map(records.map(validateLight).map((light) => [light.id, light])).values()];
      const tx = db.transaction('lights', 'readwrite');
      const done = finished(tx);
      const store = tx.objectStore('lights');
      let added = 0;
      for (const light of valid) {
        const lookup = store.index('id').getKey(light.id);
        lookup.onsuccess = () => {
          if (lookup.result === undefined) {
            const add = store.add(light);
            add.onsuccess = () => { added++; };
          }
        };
      }
      await done;
      return added;
    },
    close() { db.close(); },
  };
}
