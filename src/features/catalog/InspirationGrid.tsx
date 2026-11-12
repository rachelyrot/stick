"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { INSPIRATION } from "@/data/inspiration";
import { getProduct } from "@/data/products";
import { personalize } from "@/lib/catalog/personalize";
import { MockupPreview } from "@/components/design/MockupPreview";
import { Segmented } from "@/features/studio/controls";

export function InspirationGrid() {
  const [tag, setTag] = useState<"all" | "פרטי" | "עסקי">("all");
  const items = INSPIRATION.filter((i) => tag === "all" || i.tag === tag);

  return (
    <>
      <Segmented
        value={tag}
        onChange={setTag}
        options={[
          { id: "all", label: "הכל" },
          { id: "פרטי", label: "לבית ולמתנה" },
          { id: "עסקי", label: "לעסקים" },
        ]}
      />
      <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3">
        {items.map((it) => {
          const p = getProduct(it.product)!;
          const d = personalize(p, { text: it.text, colorId: it.color });
          const base = `/studio?template=${it.product}${it.text ? `&text=${encodeURIComponent(it.text)}` : ""}${it.color ? `&color=${it.color}` : ""}`;
          return (
            <article key={it.id} className="group mb-8 break-inside-avoid">
              <div className="relative overflow-hidden rounded-[26px]">
                <MockupPreview mockupId={it.mockup} design={d} className="transition-transform duration-[1.2s] ease-out-soft group-hover:scale-[1.04]" />
                <span className="absolute right-4 top-4 rounded-full bg-ivory/85 px-3 py-1 text-[11px] font-semibold text-choco backdrop-blur">{it.tag}</span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-choco">{it.title}</h2>
                  <p className="text-[14px] text-mocha">{it.caption}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`${base}&mockup=${it.mockup}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-choco px-4 text-[13.5px] text-ivory transition hover:bg-ink">
                  לעצב בהשראה זו <ArrowLeft className="h-4 w-4" />
                </Link>
                <Link href={`${base}&step=mockup`} className="inline-flex h-10 items-center gap-2 rounded-full border border-stone px-4 text-[13.5px] text-choco transition hover:border-choco">
                  <Camera className="h-4 w-4" strokeWidth={1.5} /> על החפץ שלי
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
