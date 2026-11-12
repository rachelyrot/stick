import { getColor, getMaterial } from "@/config/production";
import { BRAND } from "@/config/brand";
import { getFont } from "@/config/fonts";
import { getShape } from "@/lib/design/shapes";
import type { Design } from "@/lib/design/types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * קובץ עבודה לייצור (טיוטה):
 * - מידות פיזיות אמיתיות במ"מ (width/height), viewBox ביחידות מ"מ
 * - כל צבע ויניל בקבוצה נפרדת → Cricut Design Space מייבא כשכבות
 * - ללא רקע — רק קווי המתאר של הרכיבים
 *
 * מגבלה ידועה: טקסט נשמר כ-<text> עם שם גופן. בשלב הבא — המרה לקווי מתאר (opentype.js)
 * כדי שהקובץ ייפתח זהה גם במחשב ללא הגופנים. יש לבדוק ייבוא ב-Design Space בפועל.
 */
export function exportProductionSvg(design: Design): string {
  const W = design.widthMm;
  const H = design.heightMm;
  const byColor = new Map<string, string[]>();

  for (const el of design.elements) {
    const t = `translate(${el.x.toFixed(3)} ${el.y.toFixed(3)}) rotate(${el.rotation.toFixed(2)})`;
    let node = "";
    if (el.type === "text") {
      const f = getFont(el.fontId);
      const lines = el.text.split("\n");
      const tspans = lines
        .map((l, i) => `<tspan x="0" y="${((i - (lines.length - 1) / 2) * el.fontSize * el.lineHeight).toFixed(3)}">${esc(l)}</tspan>`)
        .join("");
      node = `<text transform="${t}" font-family="${esc(f.family)}" font-weight="${f.weight}" font-size="${el.fontSize.toFixed(3)}" letter-spacing="${(el.letterSpacing * el.fontSize).toFixed(3)}" text-anchor="middle" dominant-baseline="central">${tspans}</text>`;
    } else if (el.type === "shape") {
      const s = getShape(el.shapeId);
      node = `<path transform="${t} scale(${(el.width / 100).toFixed(5)} ${(el.height / 100).toFixed(5)}) translate(-50 -50)" d="${s.d}"${s.evenodd ? ' fill-rule="evenodd"' : ""}/>`;
    } else {
      node = `<!-- דורש המרה לקווי חיתוך: ${esc(el.fileName)} --><image transform="${t}" x="${(-el.width / 2).toFixed(3)}" y="${(-el.height / 2).toFixed(3)}" width="${el.width.toFixed(3)}" height="${el.height.toFixed(3)}" href="${el.src}"/>`;
    }
    const list = byColor.get(el.colorId) ?? [];
    list.push(node);
    byColor.set(el.colorId, list);
  }

  const groups = [...byColor.entries()]
    .map(([colorId, nodes]) => {
      const c = getColor(colorId);
      return `  <g id="layer-${colorId}" data-vinyl="${esc(c.name)}" fill="${c.hex}">\n    ${nodes.join("\n    ")}\n  </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${esc(BRAND.name)} · קובץ עבודה (טיוטה) · ${esc(design.name)} · ${(W / 10).toFixed(1)}×${(H / 10).toFixed(1)} ס"מ · ${esc(getMaterial(design.materialId).name)} -->
<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(2)}mm" height="${H.toFixed(2)}mm" viewBox="0 0 ${W.toFixed(3)} ${H.toFixed(3)}">
${groups}
</svg>`;
}

export function downloadText(content: string, filename: string, type = "image/svg+xml") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const fileSlug = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "design";
