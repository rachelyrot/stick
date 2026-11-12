import { Suspense } from "react";
import type { Metadata } from "next";
import { StudioApp } from "@/features/studio/StudioApp";

export const metadata: Metadata = {
  title: "סטודיו העיצוב",
  description: "עצבו מדבקת ויניל משלכם: טקסט, גופנים, צבעים, צורות ולוגו — וראו אותה על כל חפץ.",
};

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="grid h-[70vh] place-items-center text-mocha">טוענים את הסטודיו…</div>}>
      <StudioApp />
    </Suspense>
  );
}
