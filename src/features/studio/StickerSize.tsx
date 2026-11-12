"use client";

import { useState } from "react";
import { Link2, Link2Off, Ruler } from "lucide-react";
import { MACHINE } from "@/config/production";
import { clamp, contentBounds, fitContentToArtboard } from "@/lib/design/geometry";
import { formatPrice } from "@/lib/pricing/engine";
import { usePricing } from "@/lib/pricing/pricing-context";
import type { Design } from "@/lib/design/types";

const MAT = MACHINE.maxWidthCm * 10;

/** מעבר לדף שלם: המדבקה = כל המשטח, והכיתובים נשארים בדיוק במקומם על המשטח */
export function toSheet(p: Design): Design {
  const ox = Math.min(Math.max(0, MAT - p.widthMm), Math.max(0, (p.matCx ?? MAT / 2) - p.widthMm / 2));
  const oy = Math.min(Math.max(0, MAT - p.heightMm), Math.max(0, (p.matCy ?? MAT / 2) - p.heightMm / 2));
  return {
    ...p,
    sizeMode: "sheet",
    widthMm: MAT,
    heightMm: MAT,
    matCx: MAT / 2,
    matCy: MAT / 2,
    elements: p.elements.map((el) => ({ ...el, x: el.x + ox, y: el.y + oy })),
  };
}
import type { StudioApi } from "./api";
import { NumberField, PanelSection, Segmented } from "./controls";

/**
 * מידות המדבקה — תמיד גלוי בראש הפאנל.
 * "לפי אורך": בוחרים אורך, והעיצוב תמיד בדיוק באורך הזה (הגובה מחושב).
 * "מידות קבועות": רוחב × גובה, והעיצוב ממורכז בתוכן בלי עיוות.
 */
export function StickerSize({ api }: { api: StudioApi }) {
  const d = api.design;
  const pricing = usePricing();
  const mode = d.sizeMode ?? "fit";
  const length = d.lengthMm || Math.max(d.widthMm, d.heightMm);
  const maxMm = MACHINE.maxWidthCm * 10;
  const minMm = MACHINE.minSizeCm * 10;

  const maxHMm = MACHINE.maxHeightCm * 10;
  /** שמירת פרופורציות: הגובה/הרוחב מחושבים לפי יחס העיצוב, כך שהעיצוב ממלא את המדבקה בדיוק */
  const [lock, setLock] = useState(true);
  const b = contentBounds(d, api.boxes);
  const ratio = b && b.w > 0 && b.h > 0 ? b.h / b.w : null;

  const setBox = (wMm: number, hMm: number) =>
    api.commit((p) => fitContentToArtboard({ ...p, sizeMode: "box", widthMm: clamp(wMm, minMm, maxMm), heightMm: clamp(hMm, minMm, maxHMm) }, api.boxes, 0.04));

  const setWidth = (wMm: number) => {
    if (!lock || !ratio) return setBox(wMm, d.heightMm);
    let w = clamp(wMm, minMm, maxMm);
    let h = w * ratio;
    if (h > maxHMm) [h, w] = [maxHMm, maxHMm / ratio];
    if (h < minMm) [h, w] = [minMm, minMm / ratio];
    setBox(w, h);
  };
  const setHeight = (hMm: number) => {
    if (!lock || !ratio) return setBox(d.widthMm, hMm);
    let h = clamp(hMm, minMm, maxHMm);
    let w = h / ratio;
    if (w > maxMm) [w, h] = [maxMm, maxMm * ratio];
    if (w < minMm) [w, h] = [minMm, minMm * ratio];
    setBox(w, h);
  };

  return (
    <PanelSection title={<span className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" /> מידות המדבקה</span>}>
      <Segmented
        value={mode}
        onChange={(m) =>
          api.commit((p) => {
            if (m === "sheet") return toSheet(p);
            // יציאה מדף שלם — המדבקה עוטפת מחדש את העיצוב (lengthMm=0)
            if (p.sizeMode === "sheet") return { ...p, sizeMode: m, lengthMm: 0 };
            return m === "fit" ? { ...p, sizeMode: "fit", lengthMm: Math.max(p.widthMm, p.heightMm) } : { ...p, sizeMode: "box" };
          })
        }
        className="w-full [&>button]:flex-1"
        options={[
          { id: "fit", label: "לפי אורך" },
          { id: "box", label: "מידות קבועות" },
          { id: "sheet", label: "דף שלם" },
        ]}
      />

      {mode === "sheet" ? (
        <div className="mt-4 rounded-xl bg-cream px-3 py-3 text-[13px] leading-relaxed text-cocoa">
          <p>
            <b className="text-choco">דף שלם {MACHINE.maxWidthCm}×{MACHINE.maxHeightCm} ס״מ</b> — מוסיפים כמה כיתובים שרוצים ומפזרים אותם על כל המשטח.
          </p>
          <p className="mt-1">
            מחיר קבוע לדף: <b className="text-choco">{formatPrice(pricing.sheetPrice)}</b>
          </p>
        </div>
      ) : mode === "fit" ? (
        <div className="mt-4">
          <div className="flex items-end gap-3">
            <div className="w-40">
              <NumberField
                label="אורך המדבקה"
                suffix="ס״מ"
                value={length / 10}
                min={MACHINE.minSizeCm}
                max={MACHINE.maxWidthCm}
                onChange={(cm) => api.commit((p) => ({ ...p, sizeMode: "fit", lengthMm: clamp(cm * 10, minMm, maxMm) }))}
              />
            </div>
            <p className="mb-2.5 text-[13px] text-cocoa">
              גובה: <b className="text-choco">{(d.heightMm / 10).toFixed(1)}</b> ס״מ
            </p>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-mocha">
            העיצוב תמיד יהיה בדיוק באורך הזה. כותבים טקסט ארוך יותר? האותיות קטנות בהתאם. הגובה מחושב לבד.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-end gap-2">
            <NumberField label="רוחב" suffix="ס״מ" value={d.widthMm / 10} min={MACHINE.minSizeCm} max={MACHINE.maxWidthCm} onChange={(cm) => setWidth(cm * 10)} />
            <button
              type="button"
              onClick={() => {
                const next = !lock;
                setLock(next);
                // נעילה מחדש — מתאימים מיד את הגובה לעיצוב
                if (next && ratio) setWidth(d.widthMm);
              }}
              className={`mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${lock ? "bg-choco text-ivory" : "border border-stone text-mocha"}`}
              title={lock ? "שמירת פרופורציות פעילה" : "שמירת פרופורציות כבויה"}
              aria-pressed={lock}
            >
              {lock ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
            </button>
            <NumberField label="גובה" suffix="ס״מ" value={d.heightMm / 10} min={MACHINE.minSizeCm} max={MACHINE.maxHeightCm} onChange={(cm) => setHeight(cm * 10)} />
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-mocha">
            {lock
              ? "משנים רוחב — הגובה מתעדכן לבד לפי העיצוב, והעיצוב ממלא את המדבקה בדיוק."
              : "פרופורציות חופשיות: העיצוב ממורכז בתוך המידות וגדל עד הקצה, בלי להימתח (נשאר שטח ריק בצדדים)."}
          </p>
        </div>
      )}
      <p className="mt-2 text-[11.5px] text-mocha">
        עד {MACHINE.maxWidthCm}×{MACHINE.maxHeightCm} ס״מ — בדיוק כמו המשטח שרואים בסטודיו. כל משבצת ברשת = 1 ס״מ.
      </p>
    </PanelSection>
  );
}
