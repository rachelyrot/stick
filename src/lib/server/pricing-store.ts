import "server-only";
import { db } from "./db";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing/engine";
import { pricingSchema } from "@/lib/pricing/schema";

const KEY = "pricing";

/** המחירון הפעיל: מהמסד, ואם עוד לא נשמר — ברירת המחדל מהקובץ */
export function getPricing(): PricingConfig {
  try {
    const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(KEY) as { value: string } | undefined;
    if (!row) return DEFAULT_PRICING;
    const parsed = pricingSchema.safeParse({ ...DEFAULT_PRICING, ...JSON.parse(row.value) });
    return parsed.success ? (parsed.data as PricingConfig) : DEFAULT_PRICING;
  } catch {
    return DEFAULT_PRICING;
  }
}

export function getPricingMeta(): { updatedAt: number; updatedBy: string } | null {
  const row = db().prepare("SELECT updated_at, updated_by FROM settings WHERE key = ?").get(KEY) as { updated_at: number; updated_by: string } | undefined;
  return row ? { updatedAt: row.updated_at, updatedBy: row.updated_by } : null;
}

export function savePricing(cfg: PricingConfig, by: string): PricingConfig {
  const now = Date.now();
  const d = new Date(now);
  const version = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const value: PricingConfig = { ...cfg, version, quantityTiers: [...cfg.quantityTiers].sort((a, b) => a.min - b.min) };
  db()
    .prepare("INSERT INTO settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at")
    .run(KEY, JSON.stringify(value), by, now);
  return value;
}

export function resetPricing() {
  db().prepare("DELETE FROM settings WHERE key = ?").run(KEY);
  return DEFAULT_PRICING;
}
