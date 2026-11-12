"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, RotateCcw, Save, X } from "lucide-react";
import { swatchCss, type Catalog, type Material, type VinylColor } from "@/config/production";
import { catalogSchema } from "@/lib/catalog/catalog-schema";
import { processPhoto, UploadError } from "@/lib/uploads/secure-upload";

const newId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

/** מקטין תמונת מרקם ל-600 פיקסלים לכל היותר (JPEG) */
async function toTexture(file: File): Promise<string> {
  const p = await processPhoto(file);
  const img = new Image();
  img.src = p.src;
  await img.decode();
  const k = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.86);
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-olive" : "bg-stone"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory shadow transition-all ${on ? "right-0.5" : "right-[22px]"}`} />
    </button>
  );
}

function AddColorForm({ onAdd }: { onAdd: (c: VinylColor) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [hex, setHex] = useState("#C08A78");
  const [texture, setTexture] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const src = await toTexture(file);
      const res = await fetch("/api/admin/textures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTexture(data.url);
    } catch (e) {
      setErr(e instanceof UploadError || e instanceof Error ? e.message : "ההעלאה נכשלה.");
    } finally {
      setBusy(false);
    }
  };

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-taupe px-4 py-2 text-[13px] text-cocoa hover:border-choco hover:text-choco">
        <Plus className="h-4 w-4" /> הוספת צבע
      </button>
    );

  return (
    <div className="mt-3 rounded-2xl bg-cream p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-mocha">שם הצבע באתר</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: זהב נוצץ" className="h-10 w-full rounded-xl border border-stone bg-ivory px-3 text-[14px] outline-none focus:border-choco" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-mocha">שם אצל הספק (לא חובה)</span>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Glitter Gold" dir="ltr" className="h-10 w-full rounded-xl border border-stone bg-ivory px-3 text-[14px] outline-none focus:border-choco" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[13px] text-cocoa">
          צבע
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value.toUpperCase())} className="h-9 w-12 cursor-pointer rounded-lg border border-stone bg-ivory" />
        </label>
        <span className="text-[12px] text-mocha">או</span>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-stone bg-ivory px-3 py-2 text-[13px] text-choco hover:border-choco">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} תמונה של הויניל (לנצנצים וקשת)
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <span className="h-9 w-9 rounded-full ring-1 ring-black/10" style={{ background: texture ? `url(${texture}) center/cover` : hex }} title="תצוגה" />
        {texture && (
          <button type="button" onClick={() => setTexture(null)} className="text-[12px] text-mocha underline">
            הסרת התמונה
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-[12.5px] text-clay">{err}</p>}
      <p className="mt-2 text-[12px] text-mocha">טיפ: בתמונה כדאי שיופיע רק הויניל עצמו, בלי רקע לבן — היא תמלא את האותיות בהדמיה.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!name.trim() || busy}
          onClick={() => {
            onAdd({ id: newId("c"), name: name.trim(), supplierName: supplier.trim() || undefined, hex, finish: texture ? "holographic" : "gloss", inStock: true, texture: texture ?? undefined });
            setOpen(false);
            setName("");
            setSupplier("");
            setTexture(null);
          }}
          className="h-10 rounded-full bg-choco px-5 text-[13.5px] text-ivory disabled:opacity-40"
        >
          הוספה
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full px-4 text-[13.5px] text-mocha">
          ביטול
        </button>
      </div>
    </div>
  );
}

export function CatalogEditor({ initial, meta }: { initial: Catalog; meta: { updatedAt: number; updatedBy: string } | null }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [cat, setCat] = useState<Catalog>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(cat) !== JSON.stringify(saved);
  const valid = catalogSchema.safeParse(cat);

  const setColor = (id: string, patch: Partial<VinylColor>) => setCat((c) => ({ ...c, colors: c.colors.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const setMaterial = (id: string, patch: Partial<Material>) => setCat((c) => ({ ...c, materials: c.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/catalog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cat) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(data.catalog);
      setCat(data.catalog);
      setMsg({ ok: true, text: "המלאי נשמר ומעודכן עכשיו בכל האתר." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && e.message ? e.message : "השמירה נכשלה." });
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!confirm("להחזיר את כל החומרים והצבעים לברירת המחדל? צבעים שהוספת יוסרו.")) return;
    setBusy(true);
    const data = await (await fetch("/api/admin/catalog", { method: "DELETE" })).json();
    setSaved(data.catalog);
    setCat(data.catalog);
    setBusy(false);
    setMsg({ ok: true, text: "המלאי חזר לברירת המחדל." });
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {cat.materials.map((m) => (
          <section key={m.id} className={`rounded-[22px] border bg-ivory p-5 sm:p-6 ${m.active ? "border-stone" : "border-dashed border-taupe opacity-80"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <input value={m.name} onChange={(e) => setMaterial(m.id, { name: e.target.value, short: e.target.value.replace(/^ויניל\s*/, "").slice(0, 20) || e.target.value.slice(0, 20) })} className="w-full bg-transparent font-display text-xl text-choco outline-none focus:underline" aria-label="שם החומר" />
                <textarea value={m.description} onChange={(e) => setMaterial(m.id, { description: e.target.value.slice(0, 400) })} rows={2} className="mt-1 w-full resize-none rounded-lg bg-transparent text-[13px] leading-relaxed text-cocoa outline-none focus:bg-cream" aria-label="תיאור החומר" />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-cocoa">
                {m.active ? "מוצג באתר" : "מוסתר"}
                <Toggle on={m.active} onChange={(v) => setMaterial(m.id, { active: v })} label="חומר פעיל" />
              </label>
            </div>

            <ul className="mt-4 divide-y divide-stone/70">
              {m.colorIds.map((cid) => {
                const c = cat.colors.find((x) => x.id === cid);
                if (!c) return null;
                return (
                  <li key={cid} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="h-8 w-8 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: swatchCss(c) }} />
                    <input value={c.name} onChange={(e) => setColor(c.id, { name: e.target.value })} className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[14px] text-choco outline-none hover:border-stone focus:border-choco" aria-label="שם הצבע" />
                    {c.supplierName && <span className="text-[12px] text-mocha" dir="ltr">{c.supplierName}</span>}
                    {!c.texture && (
                      <input type="color" value={c.hex} onChange={(e) => setColor(c.id, { hex: e.target.value.toUpperCase(), gradient: undefined })} className="h-8 w-10 cursor-pointer rounded-md border border-stone" aria-label="גוון" title="גוון" />
                    )}
                    <label className="flex items-center gap-2 text-[12.5px] text-cocoa">
                      <span className={c.inStock ? "text-olive-dark" : "text-clay"}>{c.inStock ? "במלאי" : "אזל"}</span>
                      <Toggle on={c.inStock} onChange={(v) => setColor(c.id, { inStock: v })} label={`${c.name} במלאי`} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setMaterial(m.id, { colorIds: m.colorIds.filter((x) => x !== cid) })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-mocha hover:bg-clay/10 hover:text-clay"
                      aria-label={`הסרת ${c.name}`}
                      title="הסרה מהאתר"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
              {!m.colorIds.length && <li className="py-3 text-[13px] text-mocha">אין צבעים בחומר הזה.</li>}
            </ul>
            <AddColorForm onAdd={(c) => setCat((prev) => ({ colors: [...prev.colors, c], materials: prev.materials.map((x) => (x.id === m.id ? { ...x, colorIds: [...x.colorIds, c.id] } : x)) }))} />
          </section>
        ))}

        <button
          type="button"
          onClick={() =>
            setCat((c) => ({
              ...c,
              materials: [...c.materials, { id: newId("m"), name: "ויניל חדש", short: "חדש", description: "", finish: "gloss", priceFactor: 1, active: false, colorIds: [], care: "שטיפת ידיים מומלצת.", surfaces: ["זכוכית", "פלסטיק קשיח", "קרמיקה"] }],
            }))
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-taupe px-5 py-2.5 text-[14px] text-cocoa hover:border-choco hover:text-choco"
        >
          <Plus className="h-4 w-4" /> סוג ויניל חדש
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[22px] border border-choco/20 bg-ivory p-5">
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-cocoa">
            <li>· <b>אזל</b> — הצבע מופיע אבל לא ניתן להזמין אותו.</li>
            <li>· <b>X</b> — מסיר את הצבע מהאתר. הזמנות קודמות לא נפגעות.</li>
            <li>· <b>מוסתר</b> — כל סוג הויניל לא מוצג ללקוחות.</li>
            <li>· התוספת במחיר לכל סוג נקבעת במחירון למעלה.</li>
          </ul>
          {!valid.success && <p className="mt-3 rounded-xl bg-clay/10 px-3 py-2 text-[13px] text-clay">{valid.error.issues[0]?.message}</p>}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || busy || !valid.success}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-choco text-[15px] text-ivory transition hover:bg-ink disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} שמירת המלאי
          </button>
          {dirty && (
            <button type="button" onClick={() => setCat(saved)} className="mt-2 w-full text-center text-[13px] text-mocha hover:text-choco">
              ביטול השינויים
            </button>
          )}
          {msg && <p className={`mt-3 text-center text-[13px] ${msg.ok ? "text-olive-dark" : "text-clay"}`}>{msg.text}</p>}
          <p className="mt-4 border-t border-stone pt-3 text-[12px] text-mocha">
            {meta ? `עודכן לאחרונה: ${new Date(meta.updatedAt).toLocaleString("he-IL")}` : "כרגע בשימוש: ברירת המחדל"}
          </p>
          <button type="button" onClick={reset} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-mocha hover:text-clay">
            <RotateCcw className="h-3.5 w-3.5" /> חזרה לברירת המחדל
          </button>
        </div>
      </aside>
    </div>
  );
}
