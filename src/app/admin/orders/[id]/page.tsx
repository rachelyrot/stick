import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Mail, MessageCircle, Phone } from "lucide-react";
import { getOrder } from "@/lib/server/orders-repo";
import { OrderTotals, StatusBadge, fmtDate } from "@/components/orders/OrderParts";
import { statusInfo } from "@/lib/orders/types";
import { AdminOrderControls, AdminItemFiles } from "@/features/admin/AdminOrderControls";
import { pickupLabel } from "@/config/pickup-points";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = getOrder(Number((await params).id));
  if (!order) notFound();
  const c = order.customer;
  const intlPhone = c.phone.replace(/\D/g, "").replace(/^0/, "972");

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-[14px] text-mocha hover:text-choco">
        <ChevronRight className="h-4 w-4" /> כל ההזמנות
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-4xl">{order.code}</h2>
        <StatusBadge status={order.status} />
        <span className="text-[13px] text-mocha">{fmtDate(order.createdAt)}</span>
        {order.emailStatus && order.emailStatus !== "sent" && <span className="rounded-full bg-[#f8ecd4] px-3 py-1 text-[12px] text-[#7a5212]">אישור לא נשלח ללקוח/ה</span>}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="rounded-[24px] border border-stone bg-ivory p-5 sm:p-6">
            <h3 className="font-display text-2xl">עיצובים לייצור</h3>
            <AdminItemFiles order={order} />
          </section>
          <section className="rounded-[24px] border border-stone bg-ivory p-6">
            <h3 className="mb-4 font-display text-2xl">היסטוריה</h3>
            <ul className="space-y-3 text-[14px]">
              {[...order.events].reverse().map((e, i) => (
                <li key={i} className="border-r-2 border-olive-soft pr-3">
                  <b>{statusInfo(e.status).label}</b> <span className="text-mocha">· {fmtDate(e.at)} · {e.by}</span>
                  {e.note && <p className="mt-1 text-cocoa">{e.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <AdminOrderControls id={order.id} status={order.status} adminNote={order.adminNote} />
          <div className="rounded-[24px] bg-cream p-6 text-[14px] leading-relaxed">
            <p className="font-display text-xl">{c.fullName}</p>
            {c.businessName && <p className="text-cocoa">{c.businessName}</p>}
            <p className="mt-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-olive" />
              <a href={`mailto:${order.userEmail}?subject=${encodeURIComponent(`הזמנה ${order.code}`)}`} className="underline-offset-4 hover:underline" dir="ltr">
                {order.userEmail}
              </a>
            </p>
            <p className="mt-1.5 flex items-center gap-2">
              <Phone className="h-4 w-4 text-olive" />
              <a href={`tel:${c.phone}`} dir="ltr">
                {c.phone}
              </a>
              <a href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(`היי ${c.fullName.split(" ")[0]}, לגבי ההזמנה ${order.code}`)}`} target="_blank" rel="noopener noreferrer" className="mr-auto inline-flex items-center gap-1 rounded-full bg-olive px-3 py-1 text-[12px] text-ivory">
                <MessageCircle className="h-3.5 w-3.5" /> וואטסאפ
              </a>
            </p>
            <p className="mt-3">{c.delivery === "pickup" ? `איסוף עצמי: ${pickupLabel(c.pickupPoint)}` :`משלוח: ${c.street}, ${c.city}`}</p>
            {c.notes && <p className="mt-3 rounded-xl bg-ivory px-3 py-2">{c.notes}</p>}
          </div>
          <div className="rounded-[24px] border border-stone p-6">
            <OrderTotals order={order} />
          </div>
        </aside>
      </div>
    </div>
  );
}
