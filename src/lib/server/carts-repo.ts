import "server-only";
import { db } from "./db";

/**
 * סל קניות של משתמשת מחוברת — שורה אחת לכל כתובת מייל.
 * הפריטים נשמרים כ-JSON (כמו ב-orders); המחירים מחושבים מחדש בדפדפן ובשרת בעת ההזמנה.
 */
let ready = false;
function ensureTable() {
  if (ready) return;
  db().exec(`
    CREATE TABLE IF NOT EXISTS carts (
      user_email  TEXT PRIMARY KEY,
      items_json  TEXT NOT NULL,
      updated_at  INTEGER NOT NULL
    );
  `);
  ready = true;
}

export function getCart(email: string): unknown[] {
  ensureTable();
  const row = db().prepare("SELECT items_json FROM carts WHERE user_email = ?").get(email) as { items_json: string } | undefined;
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.items_json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(email: string, items: unknown[]) {
  ensureTable();
  if (!items.length) {
    db().prepare("DELETE FROM carts WHERE user_email = ?").run(email);
    return;
  }
  db()
    .prepare(
      `INSERT INTO carts (user_email, items_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_email) DO UPDATE SET items_json = excluded.items_json, updated_at = excluded.updated_at`
    )
    .run(email, JSON.stringify(items), Date.now());
}
