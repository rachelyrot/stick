import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "./db";

/**
 * תמונות חפצים להדמיה, שמורות לחשבון הלקוח/ה.
 * הקובץ עצמו נשמר בתיקייה data/mockup-photos, והפרטים במסד הנתונים.
 */
export interface Calib {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cm: number;
}

export interface PhotoMeta {
  id: string;
  label: string;
  width: number;
  height: number;
  calib: Calib | null;
  createdAt: number;
}

export const PHOTO_LIMITS = { maxBytes: 8 * 1024 * 1024, maxPerUser: 80 };

const dir = () => {
  const d = path.join(path.dirname(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "stick.db")), "mockup-photos");
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const fileFor = (id: string, mime: string) => path.join(dir(), `${id}.${mime === "image/png" ? "png" : "jpg"}`);

interface Row {
  id: string;
  user_email: string;
  label: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  calib_json: string | null;
  created_at: number;
}

const toMeta = (r: Row): PhotoMeta => ({
  id: r.id,
  label: r.label,
  width: r.width,
  height: r.height,
  calib: r.calib_json ? (JSON.parse(r.calib_json) as Calib) : null,
  createdAt: r.created_at,
});

export function listPhotos(userEmail: string): PhotoMeta[] {
  return (db().prepare("SELECT * FROM mockup_photos WHERE user_email = ? ORDER BY created_at DESC").all(userEmail) as Row[]).map(toMeta);
}

export function countPhotos(userEmail: string): number {
  return (db().prepare("SELECT COUNT(*) AS n FROM mockup_photos WHERE user_email = ?").get(userEmail) as { n: number }).n;
}

/** בדיקת סוג הקובץ לפי התוכן (לא לפי מה שהדפדפן הצהיר) */
export function sniffImage(buf: Buffer): "image/jpeg" | "image/png" | null {
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  return null;
}

export function createPhoto(userEmail: string, data: { buf: Buffer; mime: "image/jpeg" | "image/png"; width: number; height: number; label: string; calib?: Calib | null }): PhotoMeta {
  const id = crypto.randomUUID();
  fs.writeFileSync(fileFor(id, data.mime), data.buf);
  const now = Date.now();
  db()
    .prepare("INSERT INTO mockup_photos (id, user_email, label, mime, width, height, bytes, calib_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, userEmail, data.label, data.mime, data.width, data.height, data.buf.length, data.calib ? JSON.stringify(data.calib) : null, now);
  return { id, label: data.label, width: data.width, height: data.height, calib: data.calib ?? null, createdAt: now };
}

export function getPhotoFile(userEmail: string, id: string): { buf: Buffer; mime: string } | null {
  const r = db().prepare("SELECT * FROM mockup_photos WHERE id = ? AND user_email = ?").get(id, userEmail) as Row | undefined;
  if (!r) return null;
  try {
    return { buf: fs.readFileSync(fileFor(r.id, r.mime)), mime: r.mime };
  } catch {
    return null;
  }
}

export function updateCalib(userEmail: string, id: string, calib: Calib | null): boolean {
  const res = db().prepare("UPDATE mockup_photos SET calib_json = ? WHERE id = ? AND user_email = ?").run(calib ? JSON.stringify(calib) : null, id, userEmail);
  return res.changes > 0;
}

export function deletePhoto(userEmail: string, id: string): boolean {
  const r = db().prepare("SELECT * FROM mockup_photos WHERE id = ? AND user_email = ?").get(id, userEmail) as Row | undefined;
  if (!r) return false;
  db().prepare("DELETE FROM mockup_photos WHERE id = ?").run(id);
  try {
    fs.unlinkSync(fileFor(r.id, r.mime));
  } catch {
    /* הקובץ כבר לא קיים */
  }
  return true;
}
