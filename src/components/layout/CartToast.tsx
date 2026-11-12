"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice } from "@/lib/pricing/engine";
import { btn } from "@/components/ui/primitives";

export function CartToast() {
  const { lastAdded, dismissLastAdded, storageError } = useCart();
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(dismissLastAdded, 6500);
    return () => clearTimeout(t);
  }, [lastAdded, dismissLastAdded]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end" aria-live="polite">
      {storageError && <p className="pointer-events-auto max-w-sm rounded-2xl bg-clay px-4 py-3 text-sm text-ivory shadow-xl">{storageError}</p>}
      {lastAdded && (
        <div className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-4 rounded-3xl border border-stone bg-ivory p-3 pe-4 shadow-[0_25px_60px_-20px_rgba(38,27,21,0.45)]">
          <div className="checker grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lastAdded.thumbnail} alt="" className="max-h-14 max-w-14 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-olive">
              <Check className="h-4 w-4" /> נוסף לסל
            </p>
            <p className="truncate text-[15px] text-choco">{lastAdded.design.name}</p>
            <p className="text-xs text-mocha">
              {lastAdded.quantity} יח׳ · {formatPrice(lastAdded.quote.total)}
            </p>
          </div>
          <Link href="/cart" onClick={dismissLastAdded} className={btn("primary", "sm")}>
            לסל
          </Link>
          <button type="button" onClick={dismissLastAdded} className="text-mocha hover:text-choco" aria-label="סגירה">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
