"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, LogOut, Package, UserRound } from "lucide-react";

export function UserMenu() {
  const { data, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (status === "loading") return <span className="h-11 w-11" />;

  if (!data?.user)
    return (
      <Link href="/login" className="grid h-11 w-11 place-items-center rounded-full text-choco transition hover:bg-sand" aria-label="התחברות" title="התחברות">
        <UserRound className="h-[22px] w-[22px]" strokeWidth={1.5} />
      </Link>
    );

  const u = data.user;
  const isAdmin = u.role === "admin";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="החשבון שלי" aria-expanded={open}>
        {u.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.image} alt="" className="h-8 w-8 rounded-full ring-2 ring-ivory" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-olive text-[13px] font-semibold text-ivory">{(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}</span>
        )}
        {isAdmin && <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-ivory bg-olive" title="מנהלת" />}
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-50 w-64 animate-fade-up overflow-hidden rounded-2xl border border-stone bg-ivory shadow-[0_20px_50px_-20px_rgba(38,27,21,0.4)]">
          <div className="border-b border-stone px-4 py-3">
            <p className="truncate text-[14px] font-semibold text-choco">{u.name}</p>
            <p className="truncate text-[12px] text-mocha" dir="ltr">
              {u.email}
            </p>
          </div>
          <nav className="p-1.5 text-[14px]">
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-olive-dark hover:bg-olive-soft">
                <LayoutDashboard className="h-4 w-4" /> ממשק ניהול
              </Link>
            )}
            <Link href="/account/orders" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-choco hover:bg-sand">
              <Package className="h-4 w-4" /> ההזמנות שלי
            </Link>
            <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-cocoa hover:bg-sand">
              <LogOut className="h-4 w-4" /> התנתקות
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
