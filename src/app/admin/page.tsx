import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listOrders, orderStats } from "@/lib/server/orders-repo";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { StatusBadge, fmtDate } from "@/components/orders/OrderParts";
import { formatPrice } from "@/lib/pricing/engine";
import { pickupLabel } from "@/config/pickup-points";

export const dynamic = "force-dynamic";

const OPEN = ["received", "awaiting-approval", "preparing", "cutting", "ready"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const validStatus = ORDER_STATUSES.some((s) => s.id === status) ? status : undefined;
  const orders = listOrders({ status: validStatus });
  const stats = orderStats();
  const openCount = OPEN.reduce((s, k) => s + (stats.byStatus[k] ?? 0), 0);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["הזמנות פתוחות", String(openCount), "ממתינות לטיפול"],
          ["חדשות", String(stats.byStatus["received"] ?? 0), "התקבלו ולא טופלו"],
          ["החודש", formatPrice(stats.month.revenue), `${stats.month.n} הזמנות`],
          ["סה״כ", formatPrice(stats.totals.revenue), `${stats.totals.n} הזמנות (ללא מבוטלות)`],
        ].map(([t, v, d]) => (
          <div key={t} className="rounded-[22px] bg-cream p-5">
            <p className="text-[13px] text-mocha">{t}</p>
            <p className="mt-1 font-display text-3xl text-choco">{v}</p>
            <p className="text-[12px] text-mocha">{d}</p>
          </div>
        ))}
      </div>

      <div>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="סינון לפי סטטוס">
          <Link href="/admin" className={`shrink-0 rounded-full px-4 py-2 text-[13.5px] ${!validStatus ? "bg-choco text-ivory" : "bg-sand text-cocoa hover:text-choco"}`}>
            הכל
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s.id}
              href={`/admin?status=${s.id}`}
              className={`shrink-0 rounded-full px-4 py-2 text-[13.5px] ${validStatus === s.id ? "bg-choco text-ivory" : "bg-sand text-cocoa hover:text-choco"}`}
            >
              {s.label} {stats.byStatus[s.id] ? `(${stats.byStatus[s.id]})` : ""}
            </Link>
          ))}
        </nav>

        {orders.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-taupe p-12 text-center text-mocha">אין הזמנות{validStatus ? " בסטטוס הזה" : " עדיין"}.</p>
        ) : (
          <ul className="mt-6 divide-y divide-stone overflow-hidden rounded-[22px] border border-stone bg-ivory">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-4 px-4 py-4 transition hover:bg-cream sm:px-5">
                  <div className="flex -space-x-3 space-x-reverse">
                    {o.items.slice(0, 3).map((it) => (
                      <div key={it.id} className="checker grid h-12 w-12 place-items-center rounded-xl border-2 border-ivory p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.thumbnail} alt="" className="max-h-full max-w-full" />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <p className="font-semibold text-choco">
                      {o.code} · {o.customer.fullName}
                      {o.customer.businessName ? <span className="font-normal text-mocha"> · {o.customer.businessName}</span> : null}
                    </p>
                    <p className="text-[12.5px] text-mocha">
                      {fmtDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} יח׳ · {o.customer.delivery === "pickup" ? `איסוף · ${pickupLabel(o.customer.pickupPoint)}` :o.customer.city}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                  <span className="w-24 text-left font-display text-lg">{formatPrice(o.total)}</span>
                  <ChevronLeft className="h-5 w-5 text-mocha" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
