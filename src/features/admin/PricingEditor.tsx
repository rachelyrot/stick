"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { MATERIALS } from "@/config/production";
import { formatPrice, materialFactor, quote, shippingFor, type PricingConfig } from "@/lib/pricing/engine";
import { pricingSchema } from "@/lib/pricing/schema";
import { NumberField } from "@/features/studio/controls";

const pct = (f: number) => Math.round(f * 1000) / 10;

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-stone bg-ivory p-5 sm:p-6">
      <h3 className="font-display text-xl text-choco">{title}</h3>
      {sub && <p className="mt-1 text-[13px] leading-relaxed text-cocoa">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PricingEditor({ initial, meta }: { initial: PricingConfig; meta: { updatedAt: number; updatedBy: string } | null }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [cfg, setCfg] = useState<PricingConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);
  const valid = pricingSchema.safeParse(cfg);
  const set = (patch: Partial<PricingConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(data.pricing);
      setCfg(data.pricing);
      setMsg({ ok: true, text: "המחירון נשמר ומעודכן עכשיו בכל האתר." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && e.message ? e.message : "השמירה נכשלה." });
    } finally {
      setBusy(false);
    }
  };

  const resetDefaults = async () => {
    if (!confirm("להחזיר את כל המחירון לערכי ברירת המחדל?")) return;
    setBusy(true);
    const res = await fetch("/api/admin/pricing", { method: "DELETE" });
    const data = await res.json();
    setSaved(data.pricing);
    setCfg(data.pricing);
    setMsg({ ok: true, text: "המחירון חזר לברירת המחדל." });
    setBusy(false);
    router.refresh();
  };

  // דוגמאות מחיר חיות לפי הטיוטה
  const samples = useMemo(() => {
    const sizes = [
      { label: "מדבקה 10×4", w: 10, h: 4 },
      { label: "מדבקה 17×6", w: 17, h: 6 },
      { label: "מדבקה 29×12", w: 29, h: 12 },
    ];
    return sizes.map((s) => ({
      ...s,
      prices: MATERIALS.filter((m) => m.active).map((m) => ({
        material: m.short,
        one: quote({ widthCm: s.w, heightCm: s.h, materialId: m.id, quantity: 1, colorCount: 1, elementCount: 1, hasThinFont: false, hasUpload: false }, cfg).total,
        ten: quote({ widthCm: s.w, heightCm: s.h, materialId: m.id, quantity: 10, colorCount: 1, elementCount: 1, hasThinFont: false, hasUpload: false }, cfg),
      })),
    }));
  }, [cfg]);

  const tiers = [...cfg.quantityTiers].sort((a, b) => a.min - b.min);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <Card title="מחיר לפי אורך" sub="האורך הוא הצלע הארוכה של המדבקה. כל ס״מ שהתחיל נספר כס״מ שלם.">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="מחיר בסיס (₪)" value={cfg.basePrice} min={0} max={10000} onChange={(v) => set({ basePrice: v })} />
            <NumberField label="עד אורך (ס״מ)" value={cfg.baseLengthCm} min={0} max={100} step={1} onChange={(v) => set({ baseLengthCm: v })} />
            <NumberField label="כל ס״מ נוסף (₪)" value={cfg.perExtraCm} min={0} max={10000} step={0.5} onChange={(v) => set({ perExtraCm: v })} />
          </div>
          <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-[13px] leading-relaxed text-cocoa">
            מדבקה עד {cfg.baseLengthCm} ס״מ = {formatPrice(cfg.basePrice)} · מדבקה של {cfg.baseLengthCm + 2} ס״מ = {formatPrice(cfg.basePrice + 2 * cfg.perExtraCm)} · מדבקה של 29 ס״מ ={" "}
            {formatPrice(cfg.basePrice + Math.max(0, 29 - cfg.baseLengthCm) * cfg.perExtraCm)}
          </p>
        </Card>

        <Card title="דף שלם" sub="דף 29×29 ס״מ עם כמה כיתובים שרוצים. מחיר קבוע — בלי תוספת חומר.">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="מחיר לדף (₪)" value={cfg.sheetPrice} min={0} max={10000} onChange={(v) => set({ sheetPrice: v })} />
          </div>
        </Card>

        <Card title="תוספת לפי סוג ויניל" sub="באחוזים מעל המחיר הבסיסי. 0% = כמו ויניל קבוע.">
          <div className="grid gap-4 sm:grid-cols-2">
            {MATERIALS.filter((m) => m.active).map((m) => (
              <NumberField
                key={m.id}
                label={m.name}
                suffix="%"
                value={pct(materialFactor(m.id, cfg) - 1)}
                min={-90}
                max={900}
                step={1}
                onChange={(v) => set({ materialFactors: { ...cfg.materialFactors, [m.id]: Math.round((1 + v / 100) * 1000) / 1000 } })}
              />
            ))}
          </div>
        </Card>

        <Card title="הכנת לוגו" sub="תשלום חד פעמי כשהלקוח מעלה לוגו או תמונה שצריך להכין ממנה קובץ חיתוך. 0 = בלי תוספת.">
          <div className="max-w-xs">
            <NumberField label="הכנת לוגו שהועלה (₪)" value={cfg.uploadReviewFee} min={0} max={10000} onChange={(v) => set({ uploadReviewFee: v })} />
          </div>
        </Card>

        <Card title="הנחות כמות" sub="ההנחה חלה על כל היחידות כשמזמינים לפחות את הכמות שבשורה.">
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex items-end gap-3">
                <NumberField
                  label={i === 0 ? "מכמות" : ""}
                  suffix="יח׳"
                  value={t.min}
                  min={1}
                  max={100000}
                  step={1}
                  onChange={(v) => set({ quantityTiers: tiers.map((x, j) => (j === i ? { ...x, min: Math.round(v) } : x)) })}
                />
                <NumberField
                  label={i === 0 ? "הנחה" : ""}
                  suffix="%"
                  value={pct(t.discount)}
                  min={0}
                  max={90}
                  step={1}
                  onChange={(v) => set({ quantityTiers: tiers.map((x, j) => (j === i ? { ...x, discount: v / 100 } : x)) })}
                />
                <button
                  type="button"
                  disabled={t.min === 1 && tiers.filter((x) => x.min === 1).length === 1}
                  onClick={() => set({ quantityTiers: tiers.filter((_, j) => j !== i) })}
                  className="mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-mocha hover:bg-clay/10 hover:text-clay disabled:opacity-20"
                  aria-label="מחיקת מדרגה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set({ quantityTiers: [...tiers, { min: (tiers.at(-1)?.min ?? 1) * 2, discount: Math.min(0.9, (tiers.at(-1)?.discount ?? 0) + 0.05) }] })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-stone px-4 py-2 text-[13px] text-choco hover:border-choco"
          >
            <Plus className="h-4 w-4" /> מדרגה נוספת
          </button>
        </Card>

        <Card title="משלוח">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="דמי משלוח (₪)" value={cfg.shipping.flat} min={0} max={10000} onChange={(v) => set({ shipping: { ...cfg.shipping, flat: v } })} />
            <NumberField label="משלוח חינם מ־ (₪, 0 = אין)" value={cfg.shipping.freeFrom} min={0} max={100000} onChange={(v) => set({ shipping: { ...cfg.shipping, freeFrom: v } })} />
            <NumberField label="איסוף עצמי (₪)" value={cfg.shipping.pickup} min={0} max={10000} onChange={(v) => set({ shipping: { ...cfg.shipping, pickup: v } })} />
          </div>
        </Card>

        <section className="rounded-[22px] border border-stone bg-ivory">
          <button type="button" onClick={() => setAdvanced(!advanced)} className="flex w-full items-center justify-between p-5 text-right sm:p-6" aria-expanded={advanced}>
            <span>
              <span className="block font-display text-xl text-choco">מורכבות (מתקדם)</span>
              <span className="block text-[13px] text-cocoa">תוספת לעיצובים עם הרבה רכיבים, גופנים דקים או לוגו שהועלה</span>
            </span>
            <ChevronDown className={`h-5 w-5 text-mocha transition-transform ${advanced ? "rotate-180" : ""}`} />
          </button>
          {advanced && (
            <div className="grid gap-4 px-5 pb-6 sm:grid-cols-2 sm:px-6">
              <NumberField label="רכיבים בלי תוספת" value={cfg.complexity.freeElements} min={0} max={100} step={1} onChange={(v) => set({ complexity: { ...cfg.complexity, freeElements: Math.round(v) } })} />
              <NumberField label="תוספת לכל רכיב נוסף" suffix="%" value={pct(cfg.complexity.perExtraElement)} min={0} max={500} step={1} onChange={(v) => set({ complexity: { ...cfg.complexity, perExtraElement: v / 100 } })} />
              <NumberField label="תוספת לגופן דק / כתב יד" suffix="%" value={pct(cfg.complexity.thinFont)} min={0} max={500} step={1} onChange={(v) => set({ complexity: { ...cfg.complexity, thinFont: v / 100 } })} />
              <NumberField label="תוספת ללוגו שהועלה" suffix="%" value={pct(cfg.complexity.uploadedGraphic)} min={0} max={500} step={1} onChange={(v) => set({ complexity: { ...cfg.complexity, uploadedGraphic: v / 100 } })} />
              <NumberField label="תקרת תוספת המורכבות" suffix="%" value={pct(cfg.complexity.max - 1)} min={0} max={900} step={1} onChange={(v) => set({ complexity: { ...cfg.complexity, max: 1 + v / 100 } })} />
            </div>
          )}
        </section>
      </div>

      {/* תצוגה מקדימה + שמירה */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[22px] bg-cream p-5">
          <h3 className="font-display text-xl">איך זה ייראה ללקוח</h3>
          <p className="text-[12px] text-mocha">מתעדכן תוך כדי עריכה · מדבקה בצבע אחד</p>
          <div className="mt-4 space-y-4">
            {samples.map((s) => (
              <div key={s.label}>
                <p className="text-[13px] font-semibold text-choco">{s.label} ס״מ</p>
                <table className="mt-1 w-full text-[12.5px]">
                  <tbody>
                    {s.prices.map((p) => (
                      <tr key={p.material} className="border-b border-stone/60 last:border-0">
                        <td className="py-1 text-cocoa">{p.material}</td>
                        <td className="py-1 text-left">{formatPrice(p.one)}</td>
                        <td className="py-1 text-left text-mocha">10 יח׳: {formatPrice(p.ten.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p className="text-[12.5px] text-cocoa">
              משלוח להזמנה של ₪100: {formatPrice(shippingFor(100, "delivery", cfg))}
              {cfg.shipping.freeFrom > 0 && <> · של ₪{cfg.shipping.freeFrom}: {formatPrice(shippingFor(cfg.shipping.freeFrom, "delivery", cfg))}</>}
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-choco/20 bg-ivory p-5">
          {!valid.success && <p className="mb-3 rounded-xl bg-clay/10 px-3 py-2 text-[13px] text-clay">{valid.error.issues[0]?.message ?? "יש ערך לא תקין"}</p>}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || busy || !valid.success}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-choco text-[15px] text-ivory transition hover:bg-ink disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} שמירת המחירון
          </button>
          {dirty && (
            <button type="button" onClick={() => setCfg(saved)} className="mt-2 w-full text-center text-[13px] text-mocha hover:text-choco">
              ביטול השינויים
            </button>
          )}
          {msg && <p className={`mt-3 text-center text-[13px] ${msg.ok ? "text-olive-dark" : "text-clay"}`}>{msg.text}</p>}
          <p className="mt-4 border-t border-stone pt-3 text-[12px] text-mocha">
            {meta ? `עודכן לאחרונה: ${new Date(meta.updatedAt).toLocaleString("he-IL")} · ${meta.updatedBy}` : "כרגע בשימוש: ערכי ברירת המחדל"}
          </p>
          <button type="button" onClick={resetDefaults} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-mocha hover:text-clay">
            <RotateCcw className="h-3.5 w-3.5" /> חזרה לברירת המחדל
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-mocha">הזמנות שכבר נשלחו שומרות על המחיר שבו הוזמנו.</p>
        </div>
      </aside>
    </div>
  );
}
