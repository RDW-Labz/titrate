/**
 * Progress photos live in IndexedDB, not localStorage: a phone photo is megabytes
 * and localStorage caps out around 5 MB for the whole app.
 */
export type Photo = { id: string; at: string; data: string };

const DB = "titrate-photos";
const STORE = "photos";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** shrink to at most `max` px on the long edge and re-encode, so ten photos stay small */
export function shrink(file: File, max = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image didn't load"));
    };
    img.src = url;
  });
}

export async function listPhotos(): Promise<Photo[]> {
  const all = await tx<Photo[]>("readonly", (store) => store.getAll() as IDBRequest<Photo[]>);
  return all.sort((a, b) => b.at.localeCompare(a.at));
}

export async function addPhoto(data: string, at = new Date()): Promise<string> {
  const id = Math.round(Math.random() * 1e9).toString(36) + Date.now().toString(36).slice(-4);
  await tx("readwrite", (store) => store.put({ id, at: at.toISOString(), data }));
  return id;
}

export function deletePhoto(id: string): Promise<undefined> {
  return tx("readwrite", (store) => store.delete(id) as IDBRequest<undefined>);
}
