"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, FileImage, Lock, LockOpen, Loader2, Shapes as ShapesIcon, Trash2, Type, UploadCloud } from "lucide-react";
import { getColor, swatchCss } from "@/config/production";
import { getFont } from "@/config/fonts";
import { SHAPES, SHAPE_GROUPS } from "@/lib/design/shapes";
import { createImage, createShape, createText, elementLabel } from "@/lib/design/factory";
import { processDesignFile, UploadError } from "@/lib/uploads/secure-upload";
import type { StudioApi } from "./api";
import { PanelSection } from "./controls";

const TEXT_PRESETS = [
  { label: "שם בעברית", text: "השם שלכם", fontId: "frank", sample: "אבג" },
  { label: "שם בכתב יד", text: "Your Name", fontId: "dancing", sample: "Abc" },
  { label: "עגול וחמוד", text: "שם", fontId: "rubik", sample: "אבג" },
  { label: "משפט בשתי שורות", text: "שורה ראשונה\nשורה שנייה", fontId: "suez", sample: "אב" },
  { label: "מונוגרמה", text: "M & D", fontId: "cormorant", sample: "M&D" },
  { label: "תצוגה צרה", text: "KITCHEN", fontId: "karantina", sample: "אבג" },
];

export function TextPanel({ api }: { api: StudioApi }) {
  const add = (p: (typeof TEXT_PRESETS)[number]) => {
    const lines = p.text.split("\n").length;
    const el = createText(api.design, { text: p.text, fontId: p.fontId });
    el.fontSize = Math.min(el.fontSize, (api.design.heightMm * 0.7) / lines, (api.design.widthMm * 1.4) / Math.max(...p.text.split("\n").map((l) => l.length)));
    api.addElement(el);
    setTimeout(() => api.focusTextRef.current?.select(), 60);
  };
  return (
    <>
      <PanelSection title="טקסט">
        <button
          type="button"
          onClick={() => add(TEXT_PRESETS[0])}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-choco py-4 text-[15px] font-medium text-ivory transition hover:bg-ink"
        >
          <Type className="h-5 w-5" strokeWidth={1.6} /> הוספת טקסט
        </button>
        <p className="mt-3 text-[12.5px] leading-relaxed text-mocha">שם, מילה או משפט. אפשר כמה שורות (Enter) וכמה רכיבי טקסט בעיצוב אחד.</p>
      </PanelSection>
      <PanelSection title="נקודות פתיחה">
        <div className="grid grid-cols-2 gap-2.5">
          {TEXT_PRESETS.map((p) => {
            const f = getFont(p.fontId);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => add(p)}
                className="group flex flex-col items-center gap-1 rounded-2xl border border-stone bg-ivory px-2 py-4 transition hover:border-choco"
              >
                <span className="text-[26px] leading-none text-choco" style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}>
                  {p.sample}
                </span>
                <span className="text-[12px] text-mocha group-hover:text-choco">{p.label}</span>
              </button>
            );
          })}
        </div>
      </PanelSection>
    </>
  );
}

export function ShapesPanel({ api }: { api: StudioApi }) {
  return (
    <>
      {SHAPE_GROUPS.map((g) => (
        <PanelSection key={g.id} title={g.label}>
          <div className="grid grid-cols-4 gap-2">
            {SHAPES.filter((s) => s.group === g.id).map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.label}
                aria-label={`הוספת ${s.label}`}
                onClick={() => api.addElement(createShape(api.design, s.id))}
                className="grid aspect-square place-items-center rounded-xl border border-stone bg-ivory p-3 transition hover:border-choco hover:bg-cream"
              >
                <svg viewBox="-4 -4 108 108" className="h-full w-full">
                  <path d={s.d} fill="#3a2a21" fillRule={s.evenodd ? "evenodd" : "nonzero"} />
                </svg>
              </button>
            ))}
          </div>
        </PanelSection>
      ))}
      <PanelSection>
        <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-mocha">
          <ShapesIcon className="mt-0.5 h-4 w-4 shrink-0" />
          כל הצורות וקטוריות ונחתכות בדיוק. ספריית אייקונים מורחבת — בפיתוח.
        </p>
      </PanelSection>
    </>
  );
}

export function UploadPanel({ api }: { api: StudioApi }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const img = await processDesignFile(file);
      api.addElement(createImage(api.design, { src: img.src, mime: img.mime, fileName: img.fileName }, img.width, img.height));
    } catch (e) {
      setError(e instanceof UploadError ? e.message : "לא הצלחנו לעבד את הקובץ.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <PanelSection title="העלאת לוגו או גרפיקה">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            handle(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${over ? "border-olive bg-olive-soft/50" : "border-taupe/70 bg-ivory hover:border-choco"}`}
        >
          {busy ? <Loader2 className="h-8 w-8 animate-spin text-olive" /> : <UploadCloud className="h-8 w-8 text-olive" strokeWidth={1.3} />}
          <span className="text-[15px] font-medium text-choco">{busy ? "מעבדים את הקובץ…" : "גררו לכאן או לחצו לבחירה"}</span>
          <span className="text-[12px] text-mocha">SVG (מומלץ) · PNG · JPG · עד 8MB</span>
        </button>
        <input ref={inputRef} type="file" accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
        {error && <p className="mt-3 rounded-xl bg-clay/10 px-3 py-2 text-[13px] text-clay">{error}</p>}
      </PanelSection>
      <PanelSection title="חשוב לדעת">
        <ol className="space-y-3 text-[12.5px] leading-relaxed text-cocoa">
          <li className="flex gap-3">
            <FileImage className="mt-0.5 h-4 w-4 shrink-0 text-mocha" />
            <span>
              <b className="text-choco">תמונת מקור</b> (PNG/JPG) עשויה מפיקסלים. היא מוצגת כאן כתצוגה מקדימה בלבד.
            </span>
          </li>
          <li className="flex gap-3">
            <Eye className="mt-0.5 h-4 w-4 shrink-0 text-mocha" />
            <span>
              <b className="text-choco">קווי מתאר</b> — המכונה חותכת רק קווים סגורים. &quot;תצוגת ויניל&quot; מדגימה איך הלוגו ייראה בצבע אחד.
            </span>
          </li>
          <li className="flex gap-3">
            <ShapesIcon className="mt-0.5 h-4 w-4 shrink-0 text-mocha" />
            <span>
              <b className="text-choco">קובץ וקטורי לחיתוך</b> — אנחנו מכינים ובודקים אותו ידנית לפני כל ייצור. עיצובים מורכבים מסומנים לבדיקה.
            </span>
          </li>
        </ol>
        <p className="mt-4 text-[12px] text-mocha">המרה אוטומטית לקווי חיתוך — בפיתוח.</p>
      </PanelSection>
    </>
  );
}

export function LayersPanel({ api }: { api: StudioApi }) {
  const els = [...api.design.elements].reverse();
  if (!els.length) return <PanelSection title="שכבות"><p className="text-sm text-mocha">עדיין אין רכיבים בעיצוב.</p></PanelSection>;
  return (
    <PanelSection title={`שכבות · ${els.length}`}>
      <ul className="space-y-1.5">
        {els.map((el, i) => {
          const active = api.selected?.id === el.id;
          const c = getColor(el.colorId);
          return (
            <li key={el.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => api.select(el.id)}
                onKeyDown={(e) => e.key === "Enter" && api.select(el.id)}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${active ? "border-choco bg-cream" : "border-transparent hover:bg-cream"}`}
              >
                <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: swatchCss(c) }} />
                <span className="text-[11px] text-mocha">{el.type === "text" ? "טקסט" : el.type === "shape" ? "צורה" : "גרפיקה"}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-choco" style={el.type === "text" ? { fontFamily: `"${getFont(el.fontId).family}"` } : undefined}>
                  {elementLabel(el)}
                </span>
                <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-lg text-mocha hover:bg-sand hover:text-choco disabled:opacity-25" disabled={i === 0} onClick={() => api.reorder(el.id, "up")} aria-label="קדימה">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-lg text-mocha hover:bg-sand hover:text-choco disabled:opacity-25" disabled={i === els.length - 1} onClick={() => api.reorder(el.id, "down")} aria-label="אחורה">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-lg text-mocha hover:bg-sand hover:text-choco" onClick={() => api.updateEl(el.id, { locked: !el.locked })} aria-label={el.locked ? "שחרור נעילה" : "נעילה"}>
                    {el.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-lg text-mocha hover:bg-clay/10 hover:text-clay" onClick={() => api.remove(el.id)} aria-label="מחיקה">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[12px] text-mocha">השכבה העליונה ברשימה מוצגת מעל כולן.</p>
    </PanelSection>
  );
}
