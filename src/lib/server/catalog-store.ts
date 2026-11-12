import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "./db";
import { applyCatalog, DEFAULT_CATALOG, type Catalog } from "@/config/production";
import { catalogSchema } from "@/lib/catalog/catalog-schema";

const KEY = "catalog";

/** המלאי הפעיל: מהמסד, ואם עוד לא נערך — ברירת המחדל מהקוד */
export function getCatalog(): Catalog {
  try {
    const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(KEY) as { value: string } | undefined;
    if (!row) return DEFAULT_CATALOG;
    const parsed = catalogSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? (parsed.data as Catalog) : DEFAULT_CATALOG;
  } catch {
    return DEFAULT_CATALOG;
  }
}

/** טוען את המלאי הפעיל לרישום המשותף (getColor / getMaterial) ומחזיר אותו */
export function loadCatalog(): Catalog {
  const c = getCatalog();
  applyCatalog(c);
  return c;
}

export function getCatalogMeta() {
  return (db().prepare("SELECT updated_at AS updatedAt, updated_by AS updatedBy FROM settings WHERE key = ?").get(KEY) as { updatedAt: number; updatedBy: string } | undefined) ?? null;
}

export function saveCatalog(c: Catalog, by: string): Catalog {
  db()
    .prepare("INSERT INTO settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at")
    .run(KEY, JSON.stringify(c), by, Date.now());
  applyCatalog(c);
  return c;
}

export function resetCatalog(): Catalog {
  db().prepare("DELETE FROM settings WHERE key = ?").run(KEY);
  applyCatalog(DEFAULT_CATALOG);
  return DEFAULT_CATALOG;
}

/* ---------- תמונות מרקם לויניל ---------- */

const texDir = () => {
  const d = path.join(path.dirname(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "stick.db")), "vinyl-textures");
  fs.mkdirSync(d, { recursive: true });
  return d;
};

export function saveTexture(buf: Buffer): string {
  const id = crypto.randomUUID();
  fs.writeFileSync(path.join(texDir(), `${id}.jpg`), buf);
  return `/api/textures/${id}`;
}

export function readTexture(id: string): Buffer | null {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    return fs.readFileSync(path.join(texDir(), `${id}.jpg`));
  } catch {
    return null;
  }
}
