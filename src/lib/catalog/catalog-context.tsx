"use client";

import { applyCatalog, type Catalog } from "@/config/production";

/**
 * טוען את המלאי הפעיל (מהשרת) לרישום המשותף לפני שהעמוד מוצג,
 * כך שכל בורר צבעים, הדמיה וחישוב בדפדפן משתמשים במלאי העדכני.
 */
export function CatalogProvider({ value, children }: { value: Catalog; children: React.ReactNode }) {
  applyCatalog(value);
  return <>{children}</>;
}
