"use client";

import { useState, type ReactNode } from "react";
import { Camera } from "lucide-react";
import type { RealPhoto } from "@/data/real-photos";

/**
 * עוטף הדמיה: במעבר עכבר (או הקשה בנייד) ההדמיה מתחלפת בתמונה האמיתית של המוצר.
 */
export function RealPhotoReveal({ photo, children, className = "" }: { photo: RealPhoto; children: ReactNode; className?: string }) {
  const [pinned, setPinned] = useState(false);

  return (
    <div
      className={`group relative ${className}`}
      data-on={pinned}
      role="button"
      tabIndex={0}
      aria-pressed={pinned}
      aria-label={pinned ? "חזרה להדמיה" : "הצגת המוצר האמיתי"}
      onClick={() => setPinned((p) => !p)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setPinned((p) => !p);
        }
      }}
      onMouseLeave={() => setPinned(false)}
    >
      {children}

      <figure
        className="pointer-events-none absolute inset-0 m-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[on=true]:opacity-100"
        style={{ background: photo.bg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} loading="lazy" className="h-full w-full scale-[1.03] object-contain transition-transform duration-700 ease-out group-hover:scale-100 group-data-[on=true]:scale-100" />
        <figcaption className="absolute bottom-5 right-5 rounded-full bg-choco/85 px-4 py-2 text-[13px] text-ivory backdrop-blur">{photo.caption}</figcaption>
      </figure>

      <span className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-ivory/90 px-3.5 py-1.5 text-[13px] text-choco shadow-sm backdrop-blur transition-opacity duration-300">
        <Camera className="h-4 w-4 text-olive" strokeWidth={1.7} />
        <span className="group-hover:hidden group-data-[on=true]:hidden">
          <span className="hidden sm:inline">רחפו כדי לראות את המוצר האמיתי</span>
          <span className="sm:hidden">הקישו לראות מוצר אמיתי</span>
        </span>
        <span className="hidden group-hover:inline group-data-[on=true]:inline">זה המוצר האמיתי</span>
      </span>
    </div>
  );
}
