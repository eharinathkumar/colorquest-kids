export type SavedArtwork = {
  id: string;
  profileId: string;
  title: string;
  createdAt: string;
  dataUrl: string;
};

const DATABASE = "colorquest-artwork-v1";
const STORE = "artworks";
const FALLBACK_KEY = "colorquest-artwork-fallback";
const VERSION = 2;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("profileId", "profileId", { unique: false });
      }
      // Drawing drafts share this database. Creating both stores from either
      // opener prevents a VersionError when the gallery is used after a draft.
      if (!database.objectStoreNames.contains("drafts")) {
        database.createObjectStore("drafts", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function fallbackList() {
  try {
    return JSON.parse(window.localStorage.getItem(FALLBACK_KEY) || "[]") as SavedArtwork[];
  } catch {
    return [];
  }
}

export async function listArtworks(profileId?: string): Promise<SavedArtwork[]> {
  if (typeof window.indexedDB === "undefined") {
    return fallbackList().filter((item) => !profileId || item.profileId === profileId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(
      (request.result as SavedArtwork[])
        .filter((item) => !profileId || item.profileId === profileId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function addArtwork(artwork: Omit<SavedArtwork, "id" | "createdAt">): Promise<SavedArtwork> {
  const saved: SavedArtwork = {
    ...artwork,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `art-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  if (typeof window.indexedDB === "undefined") {
    const items = [saved, ...fallbackList()].slice(0, 20);
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
    return saved;
  }
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(saved);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return saved;
}

export async function deleteArtwork(id: string) {
  if (typeof window.indexedDB === "undefined") {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(fallbackList().filter((item) => item.id !== id)));
    return;
  }
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
