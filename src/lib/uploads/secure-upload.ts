/**
 * טיפול מאובטח בקבצים שהלקוח מעלה (בצד הלקוח).
 * - אימות סוג לפי "חתימת קובץ" (magic bytes) ולא רק לפי סיומת
 * - הגבלת גודל
 * - ניקוי SVG מסקריפטים, אירועים והפניות חיצוניות
 * - הקטנת תמונות גדולות
 * חשוב: בעת חיבור ל-Backend יש לחזור על כל הבדיקות בצד השרת.
 */

export const LIMITS = {
  designFileMaxBytes: 8 * 1024 * 1024,
  photoMaxBytes: 15 * 1024 * 1024,
  maxDesignPx: 1600,
  maxPhotoPx: 2200,
};

export type AcceptedMime = "image/png" | "image/jpeg" | "image/svg+xml";

export class UploadError extends Error {}

async function sniff(file: File): Promise<AcceptedMime | null> {
  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  const text = new TextDecoder().decode(head).replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[\s\S]*?\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(text)) return "image/svg+xml";
  return null;
}

const FORBIDDEN_TAGS = ["script", "foreignObject", "iframe", "embed", "object", "audio", "video", "animate", "set", "animateMotion", "animateTransform", "handler", "listener"];

export function sanitizeSvg(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  if (doc.getElementsByTagName("parsererror").length) throw new UploadError("קובץ ה-SVG אינו תקין.");
  const svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== "svg") throw new UploadError("קובץ ה-SVG אינו תקין.");

  FORBIDDEN_TAGS.forEach((tag) => Array.from(doc.getElementsByTagName(tag)).forEach((n) => n.remove()));

  const walk = (node: Element) => {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) node.removeAttribute(attr.name);
      else if ((name === "href" || name === "xlink:href") && !value.startsWith("#") && !value.startsWith("data:image/png") && !value.startsWith("data:image/jpeg"))
        node.removeAttribute(attr.name);
      else if (value.includes("javascript:")) node.removeAttribute(attr.name);
      else if (name === "style" && /url\(\s*['"]?(?!#)/i.test(attr.value)) node.removeAttribute(attr.name);
    }
    Array.from(node.children).forEach(walk);
  };
  walk(svg);
  Array.from(doc.getElementsByTagName("style")).forEach((s) => {
    s.textContent = (s.textContent ?? "").replace(/@import[^;]+;?/gi, "").replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, "none");
  });

  // ודא מידות פנימיות כדי שהתמונה תוצג נכון
  if (!svg.getAttribute("viewBox")) {
    const w = parseFloat(svg.getAttribute("width") ?? "") || 100;
    const h = parseFloat(svg.getAttribute("height") ?? "") || 100;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  return new XMLSerializer().serializeToString(svg);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new UploadError("לא הצלחנו לקרוא את התמונה."));
    img.src = src;
  });
}

function toBase64Utf8(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export interface ProcessedImage {
  src: string;
  mime: AcceptedMime;
  width: number;
  height: number;
  fileName: string;
}

function safeName(name: string) {
  return name.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 60) || "file";
}

async function rasterize(src: string, maxPx: number, mime: "image/png" | "image/jpeg") {
  const img = await loadImage(src);
  const k = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k);
  const h = Math.round(img.naturalHeight * k);
  if (k === 1) return { src, width: w, height: h };
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return { src: canvas.toDataURL(mime, 0.88), width: w, height: h };
}

const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new UploadError("קריאת הקובץ נכשלה."));
    r.readAsDataURL(file);
  });

/** קובץ עיצוב (לוגו/גרפיקה) — PNG / JPG / SVG */
export async function processDesignFile(file: File): Promise<ProcessedImage> {
  if (file.size > LIMITS.designFileMaxBytes) throw new UploadError("הקובץ גדול מדי (עד 8MB).");
  const mime = await sniff(file);
  if (!mime) throw new UploadError("ניתן להעלות קבצי PNG, JPG או SVG בלבד.");
  const fileName = safeName(file.name);

  if (mime === "image/svg+xml") {
    const clean = sanitizeSvg(await file.text());
    const src = `data:image/svg+xml;base64,${toBase64Utf8(clean)}`;
    const img = await loadImage(src);
    return { src, mime, width: img.naturalWidth || 100, height: img.naturalHeight || 100, fileName };
  }
  const r = await rasterize(await readAsDataURL(file), LIMITS.maxDesignPx, mime);
  return { ...r, mime, fileName };
}

/** תמונת רקע להדמיה (תמונה של חפץ) — PNG / JPG בלבד */
export async function processPhoto(file: File): Promise<ProcessedImage> {
  if (file.size > LIMITS.photoMaxBytes) throw new UploadError("התמונה גדולה מדי (עד 15MB).");
  const mime = await sniff(file);
  if (mime !== "image/png" && mime !== "image/jpeg") throw new UploadError("להדמיה ניתן להעלות תמונות JPG או PNG.");
  const r = await rasterize(await readAsDataURL(file), LIMITS.maxPhotoPx, "image/jpeg");
  return { ...r, mime: "image/jpeg", fileName: safeName(file.name) };
}

/**
 * הסרת רקע בהיר (ניסיוני): הופך פיקסלים בהירים לשקופים.
 * מתאים ללוגו כהה על רקע לבן. אינו תחליף להכנת קובץ וקטורי.
 */
export async function removeLightBackground(src: string, threshold = 225): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    const lum = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    if (lum >= threshold) p[i + 3] = 0;
    else if (lum > threshold - 30) p[i + 3] = Math.round(p[i + 3] * ((threshold - lum) / 30));
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}
