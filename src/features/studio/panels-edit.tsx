"use client";

import { useState } from "react";
import {
  AlertTriangle,
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  BringToFront,
  CheckCircle2,
  Copy,
  Eraser,
  Info,
  Link2,
  Link2Off,
  Loader2,
  Maximize,
  Minimize,
  RotateCcw,
  SearchCheck,
  SendToBack,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";
import { FONTS, getFont } from "@/config/fonts";
import { MACHINE, MATERIALS, getMaterial, materialForColor } from "@/config/production";
import type { DesignElement, ImageElement, ShapeElement, TextElement } from "@/lib/design/types";
import { clamp, fitContentToArtboard, scaleElement, shrinkArtboardToContent } from "@/lib/design/geometry";
import { formatPrice, materialFactor, type Quote } from "@/lib/pricing/engine";
import { usePricing } from "@/lib/pricing/pricing-context";
import type { PreflightCheck } from "@/lib/production/preflight";
import { removeLightBackground } from "@/lib/uploads/secure-upload";
import type { StudioApi } from "./api";
import { AllColorsPicker, ColorPicker, IconBtn, NumberField, PanelSection, Slider, Stepper } from "./controls";

/* ---------------- Inspector ---------------- */

export function Inspector({ api }: { api: StudioApi }) {
  const el = api.selected;
  if (!el) return null;
  return (
    <>
      <PanelSection
        title={el.type === "text" ? "עריכת טקסט" : el.type === "shape" ? "עריכת צורה" : "עריכת גרפיקה"}
        aside={
          <button type="button" className="text-[12px] text-mocha underline-offset-4 hover:text-choco hover:underline" onClick={() => api.select(null)}>
            להגדרות המדבקה
          </button>
        }
      >
        {el.type === "text" && <TextFields api={api} el={el} />}
        {el.type === "shape" && <ShapeFields api={api} el={el} />}
        {el.type === "image" && <ImageFields api={api} el={el} />}
      </PanelSection>

      {(el.type !== "image" || el.tint) && (
        <PanelSection title={api.design.sizeMode === "sheet" ? "צבע הכיתוב הזה" : "צבע ויניל"}>
          {api.design.sizeMode === "sheet" ? (
            <>
              {/* דף שלם: כל כיתוב בצבע ובחומר משלו — משנה רק את הכיתוב המסומן */}
              <AllColorsPicker value={el.colorId} onChange={(c) => api.updateEl(el.id, { colorId: c })} />
              <p className="mt-2 text-[12px] text-mocha">משנה רק את הכיתוב המסומן. בדף שלם כל כיתוב יכול להיות בצבע ובחומר אחר.</p>
            </>
          ) : (
            <ColorPicker materialId={api.design.materialId} value={el.colorId} onChange={(c) => api.updateEl(el.id, { colorId: c })} />
          )}
        </PanelSection>
      )}

      <PanelSection title="מיקום וסידור">
        <Slider
          label="סיבוב"
          value={el.rotation}
          min={-180}
          max={180}
          onStart={api.begin}
          onChange={(v) => api.updateEl(el.id, { rotation: v }, "preview")}
          format={(v) => `${Math.round(v)}°`}
        />
        <div className="mt-4 grid grid-cols-6 gap-1 rounded-2xl bg-cream p-1">
          <IconBtn label="מרכוז אופקי" onClick={() => api.align(el.id, "h-center")}>
            <AlignCenterVertical className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn label="מרכוז אנכי" onClick={() => api.align(el.id, "v-center")}>
            <AlignCenterHorizontal className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn label="יישור למעלה" onClick={() => api.align(el.id, "top")}>
            <ArrowUpToLine className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn label="יישור למטה" onClick={() => api.align(el.id, "bottom")}>
            <ArrowDownToLine className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn label="הבאה לחזית" onClick={() => api.reorder(el.id, "top")}>
            <BringToFront className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn label="שליחה לרקע" onClick={() => api.reorder(el.id, "bottom")}>
            <SendToBack className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </IconBtn>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => api.updateEl(el.id, { rotation: 0 })} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-stone text-[13px] text-choco hover:border-choco">
            <RotateCcw className="h-4 w-4" strokeWidth={1.5} /> ישר
          </button>
          <button type="button" onClick={() => api.duplicate(el.id)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-stone text-[13px] text-choco hover:border-choco">
            <Copy className="h-4 w-4" strokeWidth={1.5} /> שכפול
          </button>
          <button type="button" onClick={() => api.remove(el.id)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-stone text-[13px] text-clay hover:border-clay">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} /> מחיקה
          </button>
        </div>
      </PanelSection>
    </>
  );
}

function TextFields({ api, el }: { api: StudioApi; el: TextElement }) {
  const [hebOnly, setHebOnly] = useState(/[֐-׿]/.test(el.text));
  const sample = el.text.split("\n")[0].slice(0, 10) || "אבג";
  const fonts = FONTS.filter((f) => !hebOnly || f.hebrew);
  const multiline = el.text.includes("\n");
  return (
    <div className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-[12px] text-mocha">הטקסט · Enter לשורה חדשה</span>
        <textarea
          ref={api.focusTextRef}
          value={el.text}
          rows={Math.min(4, el.text.split("\n").length + 1)}
          onFocus={api.begin}
          onChange={(e) => api.updateEl(el.id, { text: e.target.value.slice(0, 120) }, "preview")}
          className="w-full resize-none rounded-xl border border-stone bg-ivory px-3 py-2.5 text-[17px] leading-snug text-choco outline-none focus:border-choco"
          style={{ fontFamily: `"${getFont(el.fontId).family}"` }}
          dir="auto"
          maxLength={120}
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] text-mocha">גופן</span>
          <div className="flex gap-1 text-[12px]">
            <button type="button" onClick={() => setHebOnly(true)} className={`rounded-full px-2.5 py-1 ${hebOnly ? "bg-choco text-ivory" : "text-cocoa hover:bg-sand"}`}>
              עברית
            </button>
            <button type="button" onClick={() => setHebOnly(false)} className={`rounded-full px-2.5 py-1 ${!hebOnly ? "bg-choco text-ivory" : "text-cocoa hover:bg-sand"}`}>
              הכל
            </button>
          </div>
        </div>
        <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto pe-1">
          {fonts.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => api.updateEl(el.id, { fontId: f.id })}
              className={`rounded-xl border px-2 py-2.5 text-center transition ${el.fontId === f.id ? "border-choco bg-cream" : "border-stone hover:border-taupe"}`}
            >
              <span className="block truncate text-[19px] leading-tight text-choco" style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}>
                {f.hebrew || !/[֐-׿]/.test(sample) ? sample : "Abc"}
              </span>
              <span className="mt-1 block text-[10.5px] text-mocha">
                {f.label}
                {f.thin && " · דק"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Slider
        label="גובה אות משוער"
        value={el.fontSize}
        min={4}
        max={300}
        step={0.5}
        onStart={api.begin}
        onChange={(v) => api.updateEl(el.id, { fontSize: v }, "preview")}
        format={(v) => `${((v * 0.7) / 10).toFixed(1)} ס״מ`}
      />
      <Slider
        label="ריווח בין אותיות"
        value={el.letterSpacing}
        min={-0.1}
        max={0.8}
        step={0.01}
        onStart={api.begin}
        onChange={(v) => api.updateEl(el.id, { letterSpacing: v }, "preview")}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      {multiline && (
        <Slider
          label="מרווח בין שורות"
          value={el.lineHeight}
          min={0.7}
          max={2}
          step={0.05}
          onStart={api.begin}
          onChange={(v) => api.updateEl(el.id, { lineHeight: v }, "preview")}
          format={(v) => v.toFixed(2)}
        />
      )}
    </div>
  );
}

function SizeFields({ api, el }: { api: StudioApi; el: ShapeElement | ImageElement }) {
  const [lock, setLock] = useState(true);
  const setW = (cm: number) => {
    const w = clamp(cm * 10, 2, 600);
    api.updateEl(el.id, lock ? { width: w, height: (el.height * w) / el.width } : { width: w });
  };
  const setH = (cm: number) => {
    const h = clamp(cm * 10, 2, 600);
    api.updateEl(el.id, lock ? { height: h, width: (el.width * h) / el.height } : { height: h });
  };
  return (
    <div className="flex items-end gap-2">
      <NumberField label="רוחב" suffix="ס״מ" value={el.width / 10} onChange={setW} />
      <button
        type="button"
        onClick={() => setLock(!lock)}
        className={`mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${lock ? "bg-choco text-ivory" : "border border-stone text-mocha"}`}
        title={lock ? "שמירת פרופורציות פעילה" : "שמירת פרופורציות כבויה"}
        aria-pressed={lock}
      >
        {lock ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
      </button>
      <NumberField label="גובה" suffix="ס״מ" value={el.height / 10} onChange={setH} />
    </div>
  );
}

function ShapeFields({ api, el }: { api: StudioApi; el: ShapeElement }) {
  return <SizeFields api={api} el={el} />;
}

function ImageFields({ api, el }: { api: StudioApi; el: ImageElement }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <div className="checker h-24 overflow-hidden rounded-xl border border-stone p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={el.src} alt={el.fileName} className="block h-full w-full object-contain" />
      </div>
      <p className="truncate text-[12px] text-mocha">
        {el.fileName} · {el.mime === "image/svg+xml" ? "וקטורי" : "תמונת פיקסלים"}
      </p>
      <SizeFields api={api} el={el} />
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone px-3 py-3">
        <span>
          <span className="block text-[14px] text-choco">תצוגת ויניל בצבע אחד</span>
          <span className="block text-[12px] text-mocha">המחשה של הלוגו כפי שייחתך</span>
        </span>
        <input type="checkbox" className="h-5 w-5 accent-[#3a2a21]" checked={el.tint} onChange={(e) => api.updateEl(el.id, { tint: e.target.checked })} />
      </label>
      {el.mime !== "image/svg+xml" && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const src = await removeLightBackground(el.src);
              api.updateEl(el.id, { src, mime: "image/png" });
            } finally {
              setBusy(false);
            }
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone text-[14px] text-choco hover:border-choco disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" strokeWidth={1.5} />}
          הסרת רקע בהיר (ניסיוני)
        </button>
      )}
      <p className="flex items-start gap-2 rounded-xl bg-olive-soft/60 px-3 py-2.5 text-[12.5px] leading-relaxed text-olive-dark">
        <SearchCheck className="mt-0.5 h-4 w-4 shrink-0" />
        קובץ זה יסומן &quot;לבדיקה לפני ייצור&quot;. נכין ממנו קווי חיתוך ונאשר איתכם לפני החיתוך.
      </p>
    </div>
  );
}

/* ---------------- Sticker settings ---------------- */

export function StickerSettings({ api }: { api: StudioApi }) {
  const d = api.design;
  const mat = getMaterial(d.materialId);
  const pricing = usePricing();

  return (
    <>
      <PanelSection title="המדבקה">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-mocha">שם העיצוב</span>
          <input
            value={d.name}
            onFocus={api.begin}
            onChange={(e) => {
              const name = e.target.value.slice(0, 40);
              api.preview((p) => ({ ...p, name }));
            }}
            className="h-11 w-full rounded-xl border border-stone bg-ivory px-3 text-[15px] text-choco outline-none focus:border-choco"
          />
        </label>
      </PanelSection>

      {d.sizeMode === "sheet" ? (
        d.elements.length > 0 && (
          <PanelSection title="צבע לכל הדף">
            <AllColorsPicker
              value={d.elements[0].colorId}
              onChange={(c) =>
                api.commit((p) => ({ ...p, materialId: materialForColor(c)?.id ?? p.materialId, elements: p.elements.map((e) => ({ ...e, colorId: c })) }))
              }
            />
            <p className="mt-2 text-[12px] text-mocha">משנה את כל הכיתובים בדף. לצבוע כיתוב אחד — לוחצים עליו על המשטח ובוחרים לו צבע.</p>
          </PanelSection>
        )
      ) : (
      <>
      <PanelSection title="חומר">
        <div className="space-y-2">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={!m.active}
              onClick={() =>
                api.commit((p) => ({
                  ...p,
                  materialId: m.id,
                  elements: p.elements.map((e) => (m.colorIds.includes(e.colorId) ? e : { ...e, colorId: m.colorIds[0] })),
                }))
              }
              className={`w-full rounded-2xl border px-4 py-3 text-right transition disabled:cursor-not-allowed disabled:opacity-50 ${d.materialId === m.id ? "border-choco bg-cream" : "border-stone hover:border-taupe"}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[14.5px] font-medium text-choco">{m.name}</span>
                <span className="text-[11px] text-mocha">{(() => {
                  const f = materialFactor(m.id, pricing);
                  return !m.active ? "בקרוב" : f === 1 ? "בסיס" : f > 1 ? `+${Math.round((f - 1) * 100)}%` : `${Math.round((f - 1) * 100)}%`;
                })()}</span>
              </span>
              <span className="mt-1 block text-[12px] leading-snug text-mocha">{m.description}</span>
            </button>
          ))}
        </div>
      </PanelSection>

      {d.elements.length > 0 && (
        <PanelSection title="צבע לכל העיצוב">
          <ColorPicker
            materialId={d.materialId}
            value={d.elements[0].colorId}
            onChange={(c) => api.commit((p) => ({ ...p, elements: p.elements.map((e) => ({ ...e, colorId: c })) }))}
          />
          <p className="mt-2 text-[12px] text-mocha">אפשר גם לצבוע כל רכיב בנפרד — כל צבע הוא שכבת ויניל נוספת ({mat.short}).</p>
        </PanelSection>
      )}
      </>
      )}
    </>
  );
}

/* ---------------- Order panel ---------------- */

const LEVEL_UI: Record<PreflightCheck["level"], { icon: typeof Info; cls: string }> = {
  ok: { icon: CheckCircle2, cls: "text-olive" },
  info: { icon: Info, cls: "text-mocha" },
  review: { icon: SearchCheck, cls: "text-olive-dark" },
  warn: { icon: AlertTriangle, cls: "text-[#a8741a]" },
  error: { icon: XCircle, cls: "text-clay" },
};

export function OrderPanel({
  quantity,
  setQuantity,
  q,
  checks,
  onAdd,
  adding,
  blocked,
  editing,
  onSelectElement,
}: {
  quantity: number;
  setQuantity: (n: number) => void;
  q: Quote;
  checks: PreflightCheck[];
  onAdd: () => void;
  adding: boolean;
  blocked: boolean;
  editing: boolean;
  onSelectElement: (id: string) => void;
}) {
  return (
    <>
      <PanelSection title="כמות">
        <div className="flex flex-wrap items-center gap-3">
          <Stepper value={quantity} onChange={setQuantity} />
          <div className="flex flex-wrap gap-1.5">
            {[1, 5, 10, 25, 50, 100].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuantity(n)}
                className={`h-8 rounded-full px-3 text-[12.5px] transition ${quantity === n ? "bg-choco text-ivory" : "bg-sand text-cocoa hover:text-choco"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </PanelSection>

      <PanelSection title="בדיקת התאמה לייצור">
        <ul className="space-y-2">
          {checks.map((c, i) => {
            const { icon: I, cls } = LEVEL_UI[c.level];
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!c.elementId}
                  onClick={() => c.elementId && onSelectElement(c.elementId)}
                  className="flex w-full items-start gap-2 text-right text-[12.5px] leading-snug text-cocoa enabled:hover:text-choco"
                >
                  <I className={`mt-0.5 h-4 w-4 shrink-0 ${cls}`} strokeWidth={1.8} />
                  {c.message}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11.5px] text-mocha">בדיקה מקדימה אוטומטית. כל עיצוב נבדק גם ידנית לפני חיתוך.</p>
      </PanelSection>

      <PanelSection title="מחיר">
        <ul className="space-y-1.5 text-[13px]">
          {q.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 text-cocoa">
              <span>{l.label}</span>
              <span className={`tabular-nums ${l.amount < 0 ? "text-olive" : ""}`}>{l.amount < 0 ? `−${formatPrice(-l.amount)}` : formatPrice(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-end justify-between border-t border-stone pt-4">
          <div>
            <p className="text-[12px] text-mocha">סה״כ · {quantity > 1 ? `${formatPrice(q.subtotal / quantity)} ליחידה` : "יחידה אחת"}</p>
            <p className="font-display text-3xl text-choco">{formatPrice(q.total)}</p>
          </div>
          <p className="text-[11px] text-mocha">מחיר לדוגמה</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={blocked || adding}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-choco text-[15px] font-medium text-ivory shadow-[0_12px_30px_-12px_rgba(58,42,33,0.7)] transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />}
          {editing ? "עדכון הפריט בסל" : "הוספה לסל"}
        </button>
        {blocked && <p className="mt-2 text-center text-[12px] text-clay">יש לתקן את הסעיפים המסומנים באדום</p>}
      </PanelSection>
    </>
  );
}
