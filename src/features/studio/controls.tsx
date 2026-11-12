"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { getColor, getMaterial, MATERIALS, swatchCss, VINYL_COLORS, type VinylColor } from "@/config/production";

export function PanelSection({ title, children, aside, className = "" }: { title?: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <section className={`border-b border-stone/70 px-5 py-5 last:border-0 ${className}`}>
      {title && (
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-mocha">{title}</h3>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onStart,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onStart?: () => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-[13px] text-cocoa">
        {label}
        <span className="tabular-nums text-choco" dir="ltr">
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onStart}
        onKeyDown={(e) => e.key.startsWith("Arrow") && onStart?.()}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        dir="ltr"
      />
    </label>
  );
}

function Swatch({ c, active, onClick, disabled, size = 30 }: { c: VinylColor; active: boolean; onClick: () => void; disabled?: boolean; size?: number }) {
  const bg = swatchCss(c);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${c.name}${disabled ? " · חסר במלאי" : ""}`}
      aria-label={c.name}
      aria-pressed={active}
      className={`relative grid shrink-0 place-items-center rounded-full transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100 ${active ? "ring-2 ring-choco ring-offset-2 ring-offset-ivory" : "ring-1 ring-black/10"}`}
      style={{ width: size, height: size, background: bg }}
    >
      {active && <Check className={`h-3.5 w-3.5 ${["white", "rosegold", "iri-gold", "iri-green"].includes(c.id) ? "text-choco" : "text-ivory"}`} strokeWidth={3} />}
      {disabled && <span className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,transparent_45%,#3a2a21_45%,#3a2a21_55%,transparent_55%)] opacity-60" />}
    </button>
  );
}

/** בחירת צבע ויניל — מציג רק צבעים שמוגדרים לחומר, וחוסם צבעים שאזלו */
export function ColorPicker({ materialId, value, onChange, size }: { materialId: string; value: string; onChange: (id: string) => void; size?: number }) {
  const mat = getMaterial(materialId);
  const colors = mat.colorIds.map(getColor);
  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((c) => (
          <Swatch key={c.id} c={c} active={value === c.id} disabled={!c.inStock} onClick={() => onChange(c.id)} size={size} />
        ))}
      </div>
      <p className="mt-2.5 text-[12px] text-mocha">
        {getColor(value).name}
        {!getColor(value).inStock && " · חסר במלאי"}
        {!mat.colorIds.includes(value) && " · לא זמין בחומר הנוכחי"}
      </p>
    </div>
  );
}

export const ALL_COLORS = VINYL_COLORS;

/** כל הצבעים שבמלאי, מקובצים לפי חומר. בחירת צבע מחומר אחר מחליפה גם את החומר. */
export function AllColorsPicker({ value, onChange, size }: { value: string; onChange: (id: string) => void; size?: number }) {
  return (
    <div className="space-y-3">
      {MATERIALS.filter((m) => m.active).map((m) => (
        <div key={m.id}>
          <p className="mb-1.5 text-[11.5px] text-mocha">{m.name}</p>
          <div className="flex flex-wrap gap-2.5">
            {m.colorIds.map(getColor).map((c) => (
              <Swatch key={c.id} c={c} active={value === c.id} disabled={!c.inStock} onClick={() => onChange(c.id)} size={size} />
            ))}
          </div>
        </div>
      ))}
      <p className="text-[12.5px] text-choco">{getColor(value).name}</p>
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex h-11 items-center rounded-full border border-stone bg-ivory">
      <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-choco hover:bg-sand disabled:opacity-30" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="הוספה">
        <Plus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="w-12 bg-transparent text-center text-[15px] font-semibold tabular-nums text-choco outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
        aria-label="כמות"
      />
      <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-choco hover:bg-sand disabled:opacity-30" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="הפחתה">
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function IconBtn({ label, onClick, children, disabled, active, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; active?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-xl text-choco transition hover:bg-sand disabled:pointer-events-none disabled:opacity-30 ${active ? "bg-sand" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, className = "" }: { value: T; options: { id: T; label: React.ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={`inline-flex rounded-full bg-sand p-1 ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-medium transition-all ${value === o.id ? "bg-ivory text-choco shadow-sm" : "text-cocoa hover:text-choco"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** שדה מספרי שמאשר את הערך ביציאה מהשדה / Enter — כדי שהקלדה חלקית לא תקפוץ למינימום */
export function NumberField({ label, value, onChange, suffix, min, max, step = 0.1 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number; step?: number }) {
  const shown = Number.isFinite(value) ? String(Math.round(value * 10) / 10) : "";
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const v = parseFloat(draft);
    setDraft(null);
    if (!Number.isFinite(v)) return;
    onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)));
  };
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-mocha">{label}</span>
      <span className="flex h-11 items-center rounded-xl border border-stone bg-ivory px-3 focus-within:border-choco">
        <input
          type="number"
          inputMode="decimal"
          className="w-full min-w-0 bg-transparent text-[15px] font-semibold tabular-nums text-choco outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          value={draft ?? shown}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            setDraft(e.target.value);
            // מתעדכן מיד כשהמספר תקין; מספר חלקי (למשל "1" בדרך ל-"15") מחכה
            const v = parseFloat(e.target.value);
            if (Number.isFinite(v) && v >= (min ?? -Infinity) && v <= (max ?? Infinity)) onChange(v);
          }}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          dir="ltr"
        />
        {suffix && <span className="text-[12px] text-mocha">{suffix}</span>}
      </span>
    </label>
  );
}
