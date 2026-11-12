"use client";

/**
 * אחסון קבוע לתמונות החפצים שהלקוח/ה העלה/תה להדמיה — IndexedDB בדפדפן.
 * נשמר גם אחרי סגירת הדפדפן (בדפדפן ובמחשב שבהם הועלו). מתאים לתמונות גדולות, בניגוד ל-localStorage.
 */

export interface StoredPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  label: string;
  createdAt: number;
  calib?: { x1: number; y1: number; x2: number; y2: number; cm: number };
}

const DB_NAME = "stick-studio";
const STORE = "mockup-photos";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no-indexeddb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

export async function listPhotos(): Promise<StoredPhoto[]> {
  try {
    const all = await tx<StoredPhoto[]>("readonly", (s) => s.getAll() as IDBRequest<StoredPhoto[]>);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function savePhoto(p: StoredPhoto): Promise<boolean> {
  try {
    await tx("readwrite", (s) => s.put(p));
    return true;
  } catch {
    return false;
  }
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {
    /* ignore */
  }
}

/* ---------- חשבון: שמירה בשרת, זמין מכל מכשיר ---------- */

interface ServerPhoto {
  id: string;
  label: string;
  width: number;
  height: number;
  calib: StoredPhoto["calib"] | null;
  createdAt: number;
}

const fromServer = (p: ServerPhoto): StoredPhoto => ({
  id: p.id,
  src: `/api/mockup-photos/${p.id}`,
  width: p.width,
  height: p.height,
  label: p.label,
  createdAt: p.createdAt,
  calib: p.calib ?? undefined,
});

export const accountPhotos = {
  async list(): Promise<StoredPhoto[]> {
    const res = await fetch("/api/mockup-photos", { cache: "no-store" });
    if (!res.ok) return [];
    return ((await res.json()).photos as ServerPhoto[]).map(fromServer);
  },
  async save(p: Omit<StoredPhoto, "id" | "createdAt">): Promise<{ photo?: StoredPhoto; error?: string }> {
    const res = await fetch("/api/mockup-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src: p.src, width: Math.round(p.width), height: Math.round(p.height), label: p.label, calib: p.calib ?? null }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { photo: fromServer(data.photo) } : { error: data.error ?? "השמירה נכשלה." };
  },
  async remove(id: string) {
    await fetch(`/api/mockup-photos/${id}`, { method: "DELETE" });
  },
  async saveCalib(id: string, calib: StoredPhoto["calib"]) {
    await fetch(`/api/mockup-photos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ calib: calib ?? null }) });
  },
};

/** אחרי התחברות: מעביר תמונות ששמורות במכשיר לחשבון, ומוחק אותן מהמכשיר אחרי שנשמרו */
let moving: Promise<number> | null = null;
export function moveDevicePhotosToAccount(): Promise<number> {
  // ריצה אחת בכל פעם — קריאה כפולה הייתה מעלה את אותן תמונות פעמיים
  moving ??= doMove().finally(() => (moving = null));
  return moving;
}

async function doMove(): Promise<number> {
  const local = await listPhotos();
  let moved = 0;
  for (const p of [...local].reverse()) {
    const r = await accountPhotos.save({ src: p.src, width: p.width, height: p.height, label: p.label, calib: p.calib });
    if (r.photo) {
      await deletePhoto(p.id);
      moved++;
    }
  }
  return moved;
}

export async function saveCalib(id: string, calib: StoredPhoto["calib"]): Promise<void> {
  try {
    const p = await tx<StoredPhoto | undefined>("readonly", (s) => s.get(id) as IDBRequest<StoredPhoto | undefined>);
    if (p) await tx("readwrite", (s) => s.put({ ...p, calib }));
  } catch {
    /* ignore */
  }
}
