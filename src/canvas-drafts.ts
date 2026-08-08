/**
 * In-progress drawings, kept safe across navigation.
 *
 * The Drawing Studio is remounted whenever the page, age world or profile
 * changes, which blanked the canvas with no warning — and the most prominent
 * control on the screen ("Next activity →") did exactly that. A child losing a
 * finished picture to one tap is the kind of thing that ends an app's welcome
 * in a household, so every stroke is now written back to the device.
 *
 * Drafts are separate from the artwork gallery: the gallery holds pictures a
 * child chose to keep, this holds whatever they were in the middle of.
 */

export type CanvasDraft = {
  /** `${profileId}:${activity}:${ageWorld}:${page}` */
  id: string;
  /** PNG data URL of the freehand ink layer only. */
  ink: string;
  /** Editable shapes, serialised. */
  shapes: unknown[];
  background: string;
  /** Region paint ids used by a coloring page. */
  coloring?: {
    fills: Record<number, string>;
    selectedPaint: string;
  };
  updatedAt: string;
};

const DATABASE = "colorquest-artwork-v1";
const STORE = "drafts";
const FALLBACK_KEY = "colorquest-draft-fallback";

/**
 * Bumped to 2 so the drafts store is added alongside the existing artworks
 * store. `onupgradeneeded` creates only what is missing, so galleries saved
 * under version 1 survive untouched.
 */
const VERSION = 2;
let databasePromise: Promise<IDBDatabase> | null = null;
const latestSave = new Map<string, CanvasDraft>();
const activeSave = new Map<string, Promise<void>>();
let lastUpdatedMs = 0;

export function draftKey(profileId: string, activity: string, ageWorld: number, page: number) {
  return `${profileId}:${activity}:${ageWorld}:${page}`;
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("artworks")) {
        const store = database.createObjectStore("artworks", { keyPath: "id" });
        store.createIndex("profileId", "profileId", { unique: false });
      }
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error);
    };
  });
  return databasePromise;
}

function fallbackMap(): Record<string, CanvasDraft> {
  try {
    return JSON.parse(window.localStorage.getItem(FALLBACK_KEY) || "{}") as Record<string, CanvasDraft>;
  } catch {
    return {};
  }
}

function profileIdFromDraft(id: string) {
  return id.split(":")[0] || id;
}

/**
 * The studio is a workbench, not a second gallery. Keep only the child's four
 * most recently edited canvases here. A picture deliberately saved to the
 * family gallery is stored separately and is never removed by this cleanup.
 */
async function pruneDatabaseDrafts(database: IDBDatabase, profileId: string, keep = 4) {
  const drafts = await new Promise<CanvasDraft[]>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as CanvasDraft[]) || []);
    request.onerror = () => reject(request.error);
  });
  const oldIds = drafts
    .filter((draft) => profileIdFromDraft(draft.id) === profileId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(keep)
    .map((draft) => draft.id);
  if (!oldIds.length) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    oldIds.forEach((id) => store.delete(id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function pruneFallbackDrafts(map: Record<string, CanvasDraft>, profileId: string, keep = 4) {
  Object.values(map)
    .filter((draft) => profileIdFromDraft(draft.id) === profileId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(keep)
    .forEach((draft) => delete map[draft.id]);
}

/**
 * Saving a draft must never interrupt drawing, so every failure here is
 * swallowed: a lost autosave is a far smaller problem than a thrown error
 * mid-stroke.
 */
export async function saveDraft(draft: Omit<CanvasDraft, "updatedAt">): Promise<void> {
  lastUpdatedMs = Math.max(Date.now(), lastUpdatedMs + 1);
  const record: CanvasDraft = { ...draft, updatedAt: new Date(lastUpdatedMs).toISOString() };
  latestSave.set(record.id, record);
  const existing = activeSave.get(record.id);
  if (existing) return existing;

  const operation = (async () => {
    let saved: CanvasDraft | undefined;
    do {
      saved = latestSave.get(record.id);
      if (!saved) return;
      try {
        if (typeof window === "undefined") return;
        if (typeof window.indexedDB === "undefined") {
          const map = fallbackMap();
          map[saved.id] = saved;
          pruneFallbackDrafts(map, profileIdFromDraft(saved.id));
          window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(map));
        } else {
          const database = await openDatabase();
          await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(STORE, "readwrite");
            transaction.objectStore(STORE).put(saved!);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
          await pruneDatabaseDrafts(database, profileIdFromDraft(saved.id));
        }
        window.dispatchEvent(new CustomEvent("colorquest:draft-saved", { detail: { profileId: profileIdFromDraft(saved.id) } }));
      } catch {
        /* storage unavailable or full — drawing continues normally */
      }
    } while (latestSave.get(record.id) !== saved);
    latestSave.delete(record.id);
  })().finally(() => activeSave.delete(record.id));

  activeSave.set(record.id, operation);
  return operation;
}

export async function loadRecentDrafts(profileId: string, limit = 4): Promise<CanvasDraft[]> {
  try {
    if (typeof window === "undefined") return [];
    const drafts = typeof window.indexedDB === "undefined"
      ? Object.values(fallbackMap())
      : await (async () => {
          const database = await openDatabase();
          return new Promise<CanvasDraft[]>((resolve, reject) => {
            const transaction = database.transaction(STORE, "readonly");
            const request = transaction.objectStore(STORE).getAll();
            request.onsuccess = () => resolve((request.result as CanvasDraft[]) || []);
            request.onerror = () => reject(request.error);
          });
        })();
    return drafts
      .filter((draft) => profileIdFromDraft(draft.id) === profileId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function loadDraft(id: string): Promise<CanvasDraft | null> {
  try {
    if (typeof window === "undefined") return null;
    if (typeof window.indexedDB === "undefined") return fallbackMap()[id] || null;
    const database = await openDatabase();
    const draft = await new Promise<CanvasDraft | null>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(id);
      request.onsuccess = () => resolve((request.result as CanvasDraft) || null);
      request.onerror = () => reject(request.error);
    });
    return draft;
  } catch {
    return null;
  }
}

export async function deleteDraft(id: string): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    latestSave.delete(id);
    await activeSave.get(id);
    if (typeof window.indexedDB === "undefined") {
      const map = fallbackMap();
      delete map[id];
      window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(map));
      return;
    }
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    /* nothing to clean up */
  }
}
