import { MACHINE } from "@/config/production";
import { getPricing, getPricingMeta } from "@/lib/server/pricing-store";
import { getCatalog, getCatalogMeta } from "@/lib/server/catalog-store";
import { PricingEditor } from "@/features/admin/PricingEditor";
import { CatalogEditor } from "@/features/admin/CatalogEditor";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-16">
      <section>
        <h2 className="font-display text-3xl">מחירון</h2>
        <p className="mt-1 text-[14px] text-cocoa">כל שינוי שנשמר חל מיד על המחירים באתר: בסטודיו, בסל ובהזמנות חדשות.</p>
        <div className="mt-6">
          <PricingEditor initial={getPricing()} meta={getPricingMeta()} />
        </div>
      </section>

      <section id="catalog">
        <h2 className="font-display text-3xl">חומרים וצבעים</h2>
        <p className="mt-1 text-[14px] text-cocoa">
          מה במלאי, מה אזל, וצבעים חדשים. {MACHINE.model} · מדבקה עד {MACHINE.maxWidthCm}×{MACHINE.maxHeightCm} ס״מ.
        </p>
        <div className="mt-6">
          <CatalogEditor initial={getCatalog()} meta={getCatalogMeta()} />
        </div>
      </section>
    </div>
  );
}
