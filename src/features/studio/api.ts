import type { BoxMap, Design, DesignElement } from "@/lib/design/types";

/** ממשק הפעולות שהסטודיו חושף לפאנלים */
export interface StudioApi {
  design: Design;
  selected: DesignElement | null;
  boxes: BoxMap;
  commit: (fn: (d: Design) => Design) => void;
  begin: () => void;
  preview: (fn: (d: Design) => Design) => void;
  updateEl: (id: string, patch: Partial<DesignElement>, mode?: "commit" | "preview") => void;
  addElement: (el: DesignElement) => void;
  select: (id: string | null) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  reorder: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  align: (id: string, how: "h-center" | "v-center" | "left" | "right" | "top" | "bottom") => void;
  focusTextRef: React.RefObject<HTMLTextAreaElement | null>;
}
