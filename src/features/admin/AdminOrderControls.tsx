"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Loader2, Save } from "lucide-react";
import { ORDER_STATUSES, type OrderRecord, type OrderStatus } from "@/lib/orders/types";
import { downloadText, exportProductionSvg, fileSlug } from "@/lib/production/export-svg";
import { getColor, getMaterial } from "@/config/production";
import { formatPrice } from "@/lib/pricing/engine";
import { DesignSvg } from "@/components/design/DesignRender";

export function AdminOrderControls({ id, status, adminNote }: { id: number; status: OrderStatus; adminNote: string }) {
  const router = useRouter();
  const [next, setNext] = useState<OrderStatus>(status);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [internal, setInternal] = useState(adminNote);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(next !== status || note ? { status: next, note: note || undefined, notify } : {}), adminNote: internal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(data.emailSent === true ? "נשמר, ועדכון נשלח במייל ללקוח/ה." : data.emailSent === false ? "נשמר. המייל לא נשלח (בדקי את הגדרות Gmail)." : "נשמר.");
      setNote("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error && e.message ? e.message : "השמירה נכשלה.");
    } finally {
      setBusy(false);
    }
  };

  const changed = next !== status || !!note;
  return (
    <div className="rounded-[24px] border border-choco/20 bg-ivory p-6">
      <h3 className="font-display text-xl">עדכון הזמנה</h3>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] text-cocoa">סטטוס</span>
        <select value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} className="h-11 w-full rounded-xl border border-stone bg-ivory px-3 text-[15px] outline-none focus:border-choco">
          {ORDER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] text-cocoa">הודעה ללקוח/ה (לא חובה)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} rows={3} placeholder="למשל: מצורפת הדמיה לאישור, הסכום לתשלום הוא…" className="w-full rounded-xl border border-stone bg-ivory px-3 py-2 text-[14px] outline-none focus:border-choco" />
      </label>
      <label className="mt-3 flex items-center gap-2 text-[13.5px] text-cocoa">
        <input type="checkbox" className="h-4 w-4 accent-[#3a2a21]" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        לשלוח עדכון במייל ללקוח/ה
      </label>
      <label className="mt-5 block border-t border-stone pt-5">
        <span className="mb-1.5 block text-[13px] text-cocoa">הערה פנימית (רק את רואה)</span>
        <textarea value={internal} onChange={(e) => setInternal(e.target.value.slice(0, 2000))} rows={2} className="w-full rounded-xl border border-stone bg-cream/60 px-3 py-2 text-[14px] outline-none focus:border-choco" />
      </label>
      <button type="button" onClick={save} disabled={busy || (!changed && internal === adminNote)} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-choco text-[15px] text-ivory transition hover:bg-ink disabled:opacity-40">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} שמירה
      </button>
      {msg && <p className="mt-3 text-center text-[13px] text-olive-dark">{msg}</p>}
    </div>
  );
}

export function AdminItemFiles({ order }: { order: OrderRecord }) {
  return (
    <ul className="mt-4 space-y-4">
      {order.items.map((it, i) => {
        const d = it.design;
        const colors = [...new Set(d.elements.map((e) => e.colorId))].map(getColor);
        const uploads = d.elements.filter((e) => e.type === "image");
        return (
          <li key={it.id} className="grid gap-4 rounded-2xl bg-cream/60 p-4 sm:grid-cols-[180px_1fr]">
            <div className="checker grid aspect-[4/3] place-items-center rounded-xl border border-stone p-3">
              <DesignSvg design={d} className="max-h-full w-[90%]" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl">{d.name}</p>
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13.5px] text-cocoa">
                <dt className="text-mocha">מידות</dt>
                <dd dir="ltr" className="text-right">
                  {(d.widthMm / 10).toFixed(1)} × {(d.heightMm / 10).toFixed(1)} cm
                </dd>
                <dt className="text-mocha">חומר</dt>
                <dd>{getMaterial(d.materialId).name}</dd>
                <dt className="text-mocha">צבעים</dt>
                <dd>{colors.map((c) => c.name).join(", ")} ({colors.length} שכבות)</dd>
                <dt className="text-mocha">כמות</dt>
                <dd>
                  {it.quantity} · {formatPrice(it.quote.total)}
                </dd>
              </dl>
              {uploads.length > 0 && <p className="mt-2 inline-block rounded-full bg-olive-soft px-3 py-0.5 text-[12px] text-olive-dark">כולל {uploads.length} קובץ גרפי — דורש הכנת קווי חיתוך</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadText(exportProductionSvg(d), `${order.code}-${i + 1}-${fileSlug(d.name)}.svg`)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-choco px-4 text-[13px] text-ivory hover:bg-ink"
                >
                  <FileDown className="h-4 w-4" /> קובץ חיתוך SVG
                </button>
                <button
                  type="button"
                  onClick={() => downloadText(JSON.stringify(d, null, 2), `${order.code}-${i + 1}-design.json`, "application/json")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone px-4 text-[13px] text-choco hover:border-choco"
                >
                  נתוני עיצוב (JSON)
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
