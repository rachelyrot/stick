import { getColor, getMaterial } from "@/config/production";
import { ORDER_STATUSES, statusInfo, type OrderRecord } from "@/lib/orders/types";
import { formatPrice } from "@/lib/pricing/engine";

export function StatusBadge({ status }: { status: string }) {
  const s = statusInfo(status);
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${s.tone}`}>{s.label}</span>;
}

export const fmtDate = (t: number) => new Date(t).toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" });

/** ציר התקדמות לפי הסדר הקבוע של הסטטוסים */
export function StatusSteps({ status }: { status: string }) {
  const flow = ORDER_STATUSES.filter((s) => s.id !== "cancelled");
  if (status === "cancelled") return <StatusBadge status="cancelled" />;
  const idx = flow.findIndex((s) => s.id === status);
  return (
    <ol className="flex flex-wrap gap-y-3">
      {flow.map((s, i) => (
        <li key={s.id} className="flex items-center">
          <span className={`flex items-center gap-2 text-[12.5px] ${i <= idx ? "text-choco" : "text-taupe"}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${i < idx ? "bg-olive text-ivory" : i === idx ? "bg-choco text-ivory ring-4 ring-olive-soft" : "bg-sand text-mocha"}`}>{i + 1}</span>
            {s.label}
          </span>
          {i < flow.length - 1 && <span className={`mx-2 h-px w-5 ${i < idx ? "bg-olive" : "bg-stone"}`} />}
        </li>
      ))}
    </ol>
  );
}

export function OrderItemsList({ order }: { order: OrderRecord }) {
  return (
    <ul className="divide-y divide-stone">
      {order.items.map((it) => {
        const d = it.design;
        const colors = [...new Set(d.elements.map((e) => e.colorId))].map(getColor);
        return (
          <li key={it.id} className="flex items-center gap-4 py-4">
            <div className="checker grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-stone p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.thumbnail} alt={d.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg text-choco">{d.name}</p>
              <p className="text-[13px] text-mocha">
                {(d.widthMm / 10).toFixed(1)}×{(d.heightMm / 10).toFixed(1)} ס״מ · {getMaterial(d.materialId).name} · {colors.map((c) => c.name).join(", ")}
              </p>
              <p className="text-[13px] text-mocha">כמות: {it.quantity}</p>
            </div>
            <span className="font-display text-lg">{formatPrice(it.quote.total)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function OrderTotals({ order }: { order: OrderRecord }) {
  return (
    <dl className="space-y-2 text-[15px]">
      <div className="flex justify-between">
        <dt className="text-cocoa">מדבקות</dt>
        <dd>{formatPrice(order.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-cocoa">משלוח</dt>
        <dd>{order.shipping ? formatPrice(order.shipping) : order.customer.delivery === "pickup" ? "איסוף עצמי" : "חינם"}</dd>
      </div>
      <div className="flex items-end justify-between border-t border-stone pt-3">
        <dt className="text-cocoa">סה״כ</dt>
        <dd className="font-display text-3xl text-choco">{formatPrice(order.total)}</dd>
      </div>
    </dl>
  );
}
