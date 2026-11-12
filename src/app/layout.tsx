import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/config/brand";
import { googleFontsHref } from "@/config/fonts";
import { CartProvider } from "@/lib/cart/cart-store";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PricingProvider } from "@/lib/pricing/pricing-context";
import { getPricing } from "@/lib/server/pricing-store";
import { loadCatalog } from "@/lib/server/catalog-store";
import { CatalogProvider } from "@/lib/catalog/catalog-context";

// המחירון נקרא מהמסד בכל בקשה — שינוי בממשק הניהול חל מיד
export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FooterGate } from "@/components/layout/FooterGate";
import { CartToast } from "@/components/layout/CartToast";

export const metadata: Metadata = {
  title: { default: `${BRAND.name} · מדבקות ויניל בעיצוב אישי`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
};

export const viewport: Viewport = {
  themeColor: "#FBF8F3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // המלאי (חומרים וצבעים) והמחירון נטענים מהמסד בכל בקשה
  const catalog = loadCatalog();
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={googleFontsHref()} />
      </head>
      <body className="min-h-screen">
        <CatalogProvider value={catalog}>
        <AuthProvider>
        <PricingProvider value={getPricing()}>
        <CartProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-choco focus:px-4 focus:py-2 focus:text-ivory">
            דילוג לתוכן
          </a>
          <Header />
          <main id="main">{children}</main>
          <FooterGate>
            <Footer />
          </FooterGate>
          <CartToast />
        </CartProvider>
        </PricingProvider>
        </AuthProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
