import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { getSession, isAdminEmail } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/orders-repo";
import { Container } from "@/components/ui/primitives";
import { OrderItemsList, OrderTotals, StatusSteps, fmtDate } from "@/components/orders/OrderParts";
import { statusInfo } from "@/lib/orders/types";
import { pickupLabel } from "@/config/pickup-points";

export const metadata: Metadata = { title: "פרטי הזמנה" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const session = await getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect(`/login?callbackUrl=/account/orders/${id}`);
  const order = getOrder(Number(id));
  // לקוח/ה רואה רק הזמנות שלו/ה
  if (!order || (order.userEmail !== email && !isAdminEmail(email))) notFound();

  const c = order.customer;
  return (
    <Container className="pb-10 pt-10 lg:pt-14">
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-[14px] text-mocha hover:text-choco">
        <ChevronRight className="h-4 w-4" /> ההזמנות שלי
      </Link>

      {sp.new && (
        <div className="mt-6 flex gap-4 rounded-[28px] bg-olive p-6 text-ivory sm:p-8">
          <CheckCircle2 className="h-9 w-9 shrink-0" strokeWidth={1.3} />
          <div>
            <h2 className="font-display text-3xl font-light">ההזמנה התקבלה. תודה!</h2>
            <p className="mt-2 leading-relaxed text-ivory/85">
              שלחנו אישור אל {order.userEmail}. נבדוק את העיצוב ונחזור אלייך לאישור סופי ולתיאום התשלום. לא בוצע חיוב.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-light">{order.code}</h1>
          <p className="mt-2 text-mocha">הוזמן ב-{fmtDate(order.createdAt)}</p>
        </div>
        <p className="font-display text-2xl text-olive">{statusInfo(order.status).label}</p>
      </div>
      <div className="mt-6 rounded-[24px] bg-cream p-5">
        <StatusSteps status={order.status} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="font-display text-2xl">העיצובים</h2>
          <OrderItemsList order={order} />
        </section>
        <aside className="space-y-6">
          <div className="rounded-[24px] bg-cream p-6">
            <OrderTotals order={order} />
            <p className="mt-4 text-[12.5px] text-mocha">התשלום מתואם אישית לאחר אישור העיצוב.</p>
          </div>
          <div className="rounded-[24px] border border-stone p-6 text-[14px] leading-relaxed text-cocoa">
            <p className="font-semibold text-choco">{c.fullName}</p>
            <p dir="ltr" className="text-right">
              {c.phone}
            </p>
            <p>{c.delivery === "pickup" ? `איסוף עצמי: ${pickupLabel(c.pickupPoint)}` :`${c.street}, ${c.city}`}</p>
            {c.notes && <p className="mt-2 rounded-xl bg-sand px-3 py-2">{c.notes}</p>}
          </div>
          {order.events.length > 1 && (
            <div className="rounded-[24px] border border-stone p-6">
              <p className="mb-3 font-semibold">היסטוריה</p>
              <ul className="space-y-3 text-[13px]">
                {[...order.events].reverse().map((e, i) => (
                  <li key={i}>
                    <span className="text-choco">{statusInfo(e.status).label}</span> <span className="text-mocha">· {fmtDate(e.at)}</span>
                    {e.note && <p className="mt-1 text-cocoa">{e.note}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
