import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * מסד נתונים SQLite מקומי (קובץ אחד: data/stick.db).
 * לעלייה לאוויר באחסון ענן יש להחליף ל-Postgres — כל הגישה עוברת דרך orders-repo.ts בלבד.
 */
const globalForDb = globalThis as unknown as { __stickDb?: Database.Database };

function open(): Database.Database {
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "stick.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email    TEXT NOT NULL,
      user_name     TEXT NOT NULL DEFAULT '',
      status        TEXT NOT NULL,
      customer_json TEXT NOT NULL,
      items_json    TEXT NOT NULL,
      subtotal      REAL NOT NULL,
      shipping      REAL NOT NULL,
      total         REAL NOT NULL,
      admin_note    TEXT NOT NULL DEFAULT '',
      email_status  TEXT NOT NULL DEFAULT '',
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_email);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE TABLE IF NOT EXISTS order_events (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id  INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status    TEXT NOT NULL,
      note      TEXT,
      by_email  TEXT NOT NULL,
      at        INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id);
    CREATE TABLE IF NOT EXISTS mockup_photos (
      id          TEXT PRIMARY KEY,
      user_email  TEXT NOT NULL,
      label       TEXT NOT NULL DEFAULT '',
      mime        TEXT NOT NULL,
      width       INTEGER NOT NULL,
      height      INTEGER NOT NULL,
      bytes       INTEGER NOT NULL,
      calib_json  TEXT,
      created_at  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_photos_user ON mockup_photos(user_email);
    CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_by  TEXT NOT NULL DEFAULT '',
      updated_at  INTEGER NOT NULL
    );
  `);
  return db;
}

export function db(): Database.Database {
  globalForDb.__stickDb ??= open();
  return globalForDb.__stickDb;
}
