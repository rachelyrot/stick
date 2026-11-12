"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { BRAND } from "@/config/brand";
import { btn } from "@/components/ui/primitives";

/**
 * טופס יצירת קשר. אין עדיין שרת דואר — הטופס מכין הודעה ופותח את תוכנת הדואר / וואטסאפ של הפונה.
 */
export function ContactForm() {
  const params = useSearchParams();
  const business = params.get("topic") === "business";
  const [name, setName] = useState("");
  const [topic, setTopic] = useState(business ? "הצעת מחיר לעסק" : "שאלה כללית");
  const [msg, setMsg] = useState(business ? "שלום, אשמח להצעת מחיר למדבקות לוגו.\nכמות משוערת: \nגודל משוער: " : "");

  const body = `${msg}\n\n— ${name}`;
  const mailto = `mailto:${BRAND.contact.email}?subject=${encodeURIComponent(`${topic} · ${BRAND.name}`)}&body=${encodeURIComponent(body)}`;
  const wa = BRAND.contact.whatsappNumber ? `https://wa.me/${BRAND.contact.whatsappNumber}?text=${encodeURIComponent(`${topic}\n${body}`)}` : null;
  const ready = name.trim().length > 1 && msg.trim().length > 3;

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-cocoa">שם</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border border-stone bg-ivory px-4 outline-none focus:border-choco" autoComplete="name" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-cocoa">נושא</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="h-12 w-full rounded-xl border border-stone bg-ivory px-4 outline-none focus:border-choco">
          {["שאלה כללית", "הצעת מחיר לעסק", "עיצוב מיוחד / גודל חריג", "הזמנה קיימת"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-cocoa">הודעה</span>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 1500))} rows={5} className="w-full rounded-xl border border-stone bg-ivory px-4 py-3 outline-none focus:border-choco" />
      </label>
      <div className="flex flex-wrap gap-3 pt-2">
        <a href={ready ? mailto : undefined} aria-disabled={!ready} className={btn("primary", "lg", ready ? "" : "pointer-events-none opacity-40")}>
          <Mail className="h-5 w-5" strokeWidth={1.5} /> שליחה במייל
        </a>
        {wa && (
          <a href={ready ? wa : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!ready} className={btn("olive", "lg", ready ? "" : "pointer-events-none opacity-40")}>
            <MessageCircle className="h-5 w-5" strokeWidth={1.5} /> וואטסאפ
          </a>
        )}
      </div>
      <p className="text-[12px] text-mocha">הכפתור פותח את תוכנת הדואר שלכם עם ההודעה מוכנה לשליחה.</p>
    </form>
  );
}
