"use client";

import { getColor } from "@/config/production";
import { BRAND } from "@/config/brand";
import { getFont } from "@/config/fonts";
import { getShape } from "@/lib/design/shapes";
import type { Design, DesignElement } from "@/lib/design/types";

/**
 * מנוע רינדור ל-Canvas — משמש לתמונות ממוזערות לסל ולייצוא תמונות הדמיה (PNG).
 * מקביל לרינדור ה-SVG שבממשק, כך שהתוצאה זהה ככל האפשר.
 */

const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imageCache.set(src, p);
    p.catch(() => imageCache.delete(src));
  }
  return p;
}

export const hasHebrew = (s: string) => /[֐-׿]/.test(s);

export async function ensureFonts(design: Design) {
  if (typeof document === "undefined" || !document.fonts) return;
  const loads = design.elements
    .filter((e) => e.type === "text")
    .map((e) => {
      const f = getFont((e as Extract<DesignElement, { type: "text" }>).fontId);
      return document.fonts.load(`${f.weight} 40px "${f.family}"`, (e as { text: string }).text || "א");
    });
  await Promise.allSettled(loads);
}

/** מרקמים שנטענו מראש (drawDesign טוען אותם לפני הציור) */
const textures = new Map<string, HTMLImageElement>();

function fillFor(ctx: CanvasRenderingContext2D, colorId: string, x: number, y: number, w: number, h: number) {
  const c = getColor(colorId);
  const tex = c.texture ? textures.get(c.texture) : undefined;
  if (tex) {
    // מרקם בגודל "cover" על תיבת הרכיב
    const p = ctx.createPattern(tex, "no-repeat");
    if (p) {
      const s = Math.max(w / tex.naturalWidth, h / tex.naturalHeight);
      p.setTransform(new DOMMatrix([s, 0, 0, s, x + (w - tex.naturalWidth * s) / 2, y + (h - tex.naturalHeight * s) / 2]));
      return p;
    }
  }
  if (!c.gradient) return c.hex;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  c.gradient.forEach((stop, i) => g.addColorStop(i / (c.gradient!.length - 1), stop));
  return g;
}

async function drawElement(ctx: CanvasRenderingContext2D, el: DesignElement, k: number, colorOverride?: string) {
  const colorId = colorOverride ?? el.colorId;
  ctx.save();
  ctx.translate(el.x * k, el.y * k);
  ctx.rotate((el.rotation * Math.PI) / 180);

  if (el.type === "text") {
    const f = getFont(el.fontId);
    const px = el.fontSize * k;
    ctx.font = `${f.weight} ${px}px "${f.family}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = hasHebrew(el.text) ? "rtl" : "ltr";
    if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${el.letterSpacing * px}px`;
    const lines = el.text.split("\n");
    const lh = px * el.lineHeight;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
    const totalH = lh * (lines.length - 1) + px;
    ctx.fillStyle = fillFor(ctx, colorId, -widest / 2, -totalH / 2, widest, totalH);
    lines.forEach((line, i) => ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lh));
  } else if (el.type === "shape") {
    const s = getShape(el.shapeId);
    ctx.scale((el.width * k) / 100, (el.height * k) / 100);
    ctx.translate(-50, -50);
    ctx.fillStyle = fillFor(ctx, colorId, 0, 0, 100, 100);
    ctx.fill(new Path2D(s.d), s.evenodd ? "evenodd" : "nonzero");
  } else {
    const img = await loadImage(el.src).catch(() => null);
    if (img) {
      const w = el.width * k;
      const h = el.height * k;
      if (el.tint) {
        const off = document.createElement("canvas");
        off.width = Math.max(1, Math.round(w));
        off.height = Math.max(1, Math.round(h));
        const o = off.getContext("2d")!;
        o.drawImage(img, 0, 0, off.width, off.height);
        o.globalCompositeOperation = "source-in";
        o.fillStyle = fillFor(o, colorId, 0, 0, off.width, off.height);
        o.fillRect(0, 0, off.width, off.height);
        ctx.drawImage(off, -w / 2, -h / 2, w, h);
      } else {
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
    }
  }
  ctx.restore();
}

/** מצייר את העיצוב כך ש-(0,0) של הלוח נמצא במקור הנוכחי של ה-context, ביחס של k פיקסלים למ"מ */
export async function drawDesign(ctx: CanvasRenderingContext2D, design: Design, k: number, colorOverride?: string) {
  await ensureFonts(design);
  const texUrls = [...new Set(design.elements.map((e) => getColor(colorOverride ?? e.colorId).texture).filter(Boolean))] as string[];
  await Promise.all(texUrls.map(async (u) => textures.set(u, await loadImage(u)).get(u)).map((p) => p.catch(() => null)));
  for (const el of design.elements) await drawElement(ctx, el, k, colorOverride);
}

/** תמונה ממוזערת שקופה של המדבקה — ללא רקע */
export async function renderDesignPng(design: Design, maxPx = 360, pad = 0.06): Promise<string> {
  const k = (maxPx * (1 - pad * 2)) / Math.max(design.widthMm, design.heightMm);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(design.widthMm * k + maxPx * pad * 2);
  canvas.height = Math.round(design.heightMm * k + maxPx * pad * 2);
  const ctx = canvas.getContext("2d")!;
  ctx.translate(maxPx * pad, maxPx * pad);
  await drawDesign(ctx, design, k);
  return canvas.toDataURL("image/png");
}

export interface Placement {
  /** מרכז המדבקה ביחס לרקע (0..1) */
  cx: number;
  cy: number;
  /** רוחב המדבקה ביחס לרוחב הרקע (0..1) */
  width: number;
  rotation: number;
  realism: boolean;
  /** כיווץ אופקי לחפץ עגול (1 = שטוח) */
  scaleX?: number;
}

/** ייצוא תמונת הדמיה: רקע + מדבקה כשכבה נפרדת */
export async function renderMockupPng(bgSrc: string, design: Design, p: Placement, maxPx = 1800): Promise<string> {
  const bg = await loadImage(bgSrc);
  const bw = bg.naturalWidth || 1200;
  const bh = bg.naturalHeight || 900;
  // מגדילים רקעים וקטוריים קטנים ומקטינים תמונות ענק — הרוחב הארוך = maxPx
  const s = maxPx / Math.max(bw, bh);
  const W = Math.round(bw * s);
  const H = Math.round(bh * s);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bg, 0, 0, W, H);

  const k = (p.width * W) / design.widthMm;
  ctx.save();
  ctx.translate(p.cx * W, p.cy * H);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(p.scaleX ?? 1, 1);
  ctx.translate((-design.widthMm * k) / 2, (-design.heightMm * k) / 2);
  if (p.realism) {
    ctx.shadowColor = "rgba(40,25,15,0.22)";
    ctx.shadowBlur = Math.max(1, W / 900);
    ctx.shadowOffsetY = Math.max(0.5, W / 1400);
  }
  await drawDesign(ctx, design, k);
  ctx.restore();

  ctx.font = `500 ${Math.round(W / 70)}px "Assistant", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`הדמיה להמחשה בלבד · ${BRAND.name}`, W / 60, H - W / 80);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
