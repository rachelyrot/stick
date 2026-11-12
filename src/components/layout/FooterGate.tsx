"use client";

import { usePathname } from "next/navigation";

/** מסתיר את הפוטר בסטודיו — סביבת עבודה במסך מלא */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/studio")) return null;
  return <>{children}</>;
}
