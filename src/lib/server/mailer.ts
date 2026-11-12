import "server-only";
import nodemailer from "nodemailer";
import { BRAND } from "@/config/brand";
import { getColor, getMaterial } from "@/config/production";
import { statusInfo, type OrderRecord } from "@/lib/orders/types";
import { adminEmails } from "./auth";
import { pickupLabel } from "@/config/pickup-points";

/**
 * שליחת מיילים דרך חשבון Gmail של העסק (SMTP + סיסמת אפליקציה).
 * אם לא הוגדרו GMAIL_USER / GMAIL_APP_PASSWORD — המייל לא נשלח, נרשם ביומן, וההזמנה נשמרת כרגיל.
 */
export const mailConfigured = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

let transport: nodemailer.Transporter | null = null;
function getTransport() {
  transport ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  return transport;
}

interface Mail {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; path: string; cid: string }[];
  replyTo?: string;
}

export async function send(mail: Mail): Promise<{ sent: boolean; error?: string }> {
  if (!mailConfigured()) {
    console.info(`[mail] לא נשלח (Gmail לא מוגדר): "${mail.subject}" → ${[mail.to].flat().join(", ")}`);
    return { sent: false, error: "not-configured" };
  }
  try {
    await getTransport().sendMail({ from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`, ...mail });
    return { sent: true };
  } catch (e) {
    console.error("[mail] שליחה נכשלה", e);
    return { sent: false, error: e instanceof Error ? e.message : "send-failed" };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const money = (v: number) => `₪${v.toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;
const siteUrl = () => process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function layout(title: string, body: string) {
  return `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#f5efe6;font-family:Arial,Helvetica,sans-serif;color:#3a2a21">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe6;padding:24px 0"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fbf8f3;border-radius:16px;overflow:hidden" dir="rtl">
    <tr><td style="background:#3a2a21;color:#fbf8f3;padding:22px 28px;font-size:22px;letter-spacing:1px">${esc(BRAND.name)}</td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:normal">${title}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#ede4d6;font-size:12px;color:#6b5242">${esc(BRAND.tagline)}</td></tr>
  </table></td></tr></table></body></html>`;
}

function itemsTable(o: OrderRecord) {
  const rows = o.items
    .map((it, i) => {
      const d = it.design;
      const colors = [...new Set(d.elements.map((e) => e.colorId))].map((c) => getColor(c).name).join(", ");
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #ddd2c2;width:84px"><img src="cid:item${i}" width="72" alt="" style="display:block;background:#fff;border-radius:8px"/></td>
        <td style="padding:10px 12px;border-bottom:1px solid #ddd2c2;font-size:14px">
          <b>${esc(d.name)}</b><br/>
          <span style="color:#6b5242">${(d.widthMm / 10).toFixed(1)}×${(d.heightMm / 10).toFixed(1)} ס"מ · ${esc(getMaterial(d.materialId).name)} · ${esc(colors)}</span><br/>
          <span style="color:#6b5242">כמות: ${it.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #ddd2c2;font-size:14px;text-align:left;white-space:nowrap">${money(it.quote.total)}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
    <tr><td></td><td style="padding:8px 12px;font-size:14px;color:#6b5242">משלוח</td><td style="text-align:left;font-size:14px">${o.shipping ? money(o.shipping) : "ללא עלות"}</td></tr>
    <tr><td></td><td style="padding:8px 12px;font-size:16px"><b>סה"כ</b></td><td style="text-align:left;font-size:18px"><b>${money(o.total)}</b></td></tr>
  </table>`;
}

const thumbs = (o: OrderRecord) => o.items.map((it, i) => ({ filename: `item${i}.png`, path: it.thumbnail, cid: `item${i}` }));

/** אישור הזמנה ללקוח/ה + התראה למנהלת */
export async function sendOrderEmails(o: OrderRecord) {
  const c = o.customer;
  const customer = await send({
    to: o.userEmail,
    subject: `קיבלנו את ההזמנה שלך ${o.code} · ${BRAND.name}`,
    replyTo: adminEmails()[0],
    attachments: thumbs(o),
    html: layout(
      `תודה, ${esc(c.fullName.split(" ")[0])}! ההזמנה התקבלה`,
      `<p style="font-size:15px;line-height:1.7">מספר הזמנה: <b>${o.code}</b></p>
       <p style="font-size:15px;line-height:1.7">נבדוק את העיצוב ונחזור אלייך לאישור סופי ולתיאום התשלום לפני שנתחיל לחתוך. לא בוצע חיוב.</p>
       ${itemsTable(o)}
       <p style="font-size:14px;line-height:1.7;margin-top:20px">${c.delivery === "pickup" ? `איסוף עצמי: ${esc(pickupLabel(c.pickupPoint))}` : `משלוח אל: ${esc(c.street)}, ${esc(c.city)}`}</p>
       <p style="margin-top:24px"><a href="${siteUrl()}/account/orders/${o.id}" style="background:#3a2a21;color:#fbf8f3;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px">צפייה בהזמנה</a></p>`
    ),
  });

  const admins = adminEmails();
  const admin = admins.length
    ? await send({
        to: admins,
        subject: `🛍 הזמנה חדשה ${o.code} · ${c.fullName} · ${money(o.total)}`,
        replyTo: o.userEmail,
        attachments: thumbs(o),
        html: layout(
          `הזמנה חדשה ${o.code}`,
          `<p style="font-size:15px;line-height:1.8">${esc(c.fullName)}${c.businessName ? ` · ${esc(c.businessName)}` : ""}<br/>
           ${esc(o.userEmail)} · ${esc(c.phone)}<br/>
           ${c.delivery === "pickup" ? `איסוף עצמי: ${esc(pickupLabel(c.pickupPoint))}` :`${esc(c.street)}, ${esc(c.city)}`}</p>
           ${c.notes ? `<p style="background:#ede4d6;padding:10px 14px;border-radius:8px;font-size:14px">${esc(c.notes)}</p>` : ""}
           ${itemsTable(o)}
           <p style="margin-top:24px"><a href="${siteUrl()}/admin/orders/${o.id}" style="background:#6b7049;color:#fbf8f3;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px">פתיחה בממשק הניהול</a></p>`
        ),
      })
    : { sent: false, error: "no-admin" };

  return { customer, admin };
}

/** עדכון סטטוס ללקוח/ה */
export async function sendStatusEmail(o: OrderRecord, note?: string) {
  const s = statusInfo(o.status);
  return send({
    to: o.userEmail,
    subject: `עדכון להזמנה ${o.code}: ${s.label}`,
    replyTo: adminEmails()[0],
    html: layout(
      `ההזמנה שלך: ${s.label}`,
      `<p style="font-size:15px;line-height:1.7">מספר הזמנה: <b>${o.code}</b></p>
       ${note ? `<p style="font-size:15px;line-height:1.7;background:#ede4d6;padding:12px 16px;border-radius:10px">${esc(note).replace(/\n/g, "<br/>")}</p>` : ""}
       <p style="margin-top:24px"><a href="${siteUrl()}/account/orders/${o.id}" style="background:#3a2a21;color:#fbf8f3;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px">צפייה בהזמנה</a></p>`
    ),
  });
}
