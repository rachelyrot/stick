"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Download, Images, Info, Loader2, RotateCcw, Ruler, Save, Sparkles, Trash2, UploadCloud, Wand2 } from "lucide-react";
import { MOCKUPS, fitWidthInArea, getMockup, mockupScale, objectNote, realScale } from "@/data/mockups";
import { useObjectSizes } from "@/lib/mockup/object-sizes";
import { accountPhotos, deletePhoto, listPhotos, moveDevicePhotosToAccount, saveCalib, savePhoto } from "@/lib/mockup/photo-store";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DesignSvg } from "@/components/design/DesignRender";
import type { Design } from "@/lib/design/types";
import { downloadDataUrl, renderMockupPng, type Placement } from "@/lib/render/canvas";
import { processPhoto, UploadError } from "@/lib/uploads/secure-upload";
import { AI_PROMPT_EXAMPLES, aiBackgroundProvider } from "@/lib/mockup/ai-background";
import { fileSlug } from "@/lib/production/export-svg";
import { AllColorsPicker, NumberField, PanelSection, Segmented, Slider } from "./controls";
import { CYLINDERS, Cylinder3D } from "./Cylinder3D";
import { PlannedTag } from "@/components/ui/primitives";

export interface MockupBackground {
  kind: "gallery" | "upload";
  id: string;
  src: string;
  width: number;
  height: number;
  label: string;
}

interface Saved {
  id: string;
  bg: MockupBackground;
  placement: Placement;
  design: Design;
  thumb: string;
}

const MOCKUP_KEY = "stick-studio:mockup:v1";

const galleryBg = (id: string): MockupBackground => {
  const m = getMockup(id);
  return { kind: "gallery", id: m.id, src: m.src, width: m.width, height: m.height, label: m.label };
};

function defaultPlacement(bg: MockupBackground, design: Design): Placement {
  const area = bg.kind === "gallery" ? getMockup(bg.id).area : { cx: 0.5, cy: 0.5, w: 0.35, h: 0.3 };
  return { cx: area.cx, cy: area.cy, width: fitWidthInArea(area, bg.width, bg.height, design.widthMm, design.heightMm), rotation: 0, realism: true };
}

type Drag = { kind: "move" | "scale" | "rotate"; sx: number; sy: number; orig: Placement; rect: DOMRect };

/** כיול קנה מידה לתמונה שהועלתה: קו בין שתי נקודות (יחסי 0..1) ואורכו האמיתי בס"מ */
interface Calib {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cm: number;
}

export function MockupStudio({
  design,
  initialMockup,
  onRecolorAll,
}: {
  design: Design;
  initialMockup?: string;
  onRecolorAll: (colorId: string) => void;
}) {
  // החפץ האחרון שנבחר נשמר בדפדפן. תמונות שהועלו נשמרות באחסון קבוע (IndexedDB) ונטענות מחדש.
  const [remembered] = useState<{ bgId: string; placement: Placement } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(MOCKUP_KEY) ?? "null");
    } catch {
      return null;
    }
  });
  const rememberedGallery = remembered && MOCKUPS.some((m) => m.id === remembered.bgId) ? remembered : null;
  const startId = initialMockup ?? rememberedGallery?.bgId ?? "bottle";
  const [bg, setBg] = useState<MockupBackground>(() => galleryBg(startId));
  const [placement, setPlacement] = useState<Placement>(() =>
    !initialMockup && rememberedGallery ? rememberedGallery.placement : defaultPlacement(galleryBg(startId), design)
  );
  useEffect(() => {
    try {
      localStorage.setItem(MOCKUP_KEY, JSON.stringify({ bgId: bg.id, placement }));
    } catch {
      /* ignore */
    }
  }, [bg, placement]);
  const [source, setSource] = useState<"gallery" | "upload" | "ai">("gallery");
  const [uploads, setUploads] = useState<MockupBackground[]>([]);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [realMode, setRealMode] = useState(true);
  const { sizes: objectSizes, setSize: setObjectSize } = useObjectSizes();
  const [calibs, setCalibs] = useState<Record<string, Calib>>({});
  const [calibrating, setCalibrating] = useState(false);
  const rulerDrag = useRef<{ end: 1 | 2; rect: DOMRect } | null>(null);
  const [storageNote, setStorageNote] = useState<string | null>(null);

  // מחובר/ת → התמונות נשמרות בחשבון (בכל מכשיר). לא מחובר/ת → בדפדפן הזה.
  const { status: authStatus, data: session } = useSession();
  const inAccount = authStatus === "authenticated";
  const loadedFor = useRef<string | null>(null);
  const savedCalib = useRef<Record<string, string>>({});

  useEffect(() => {
    if (authStatus === "loading" || loadedFor.current === authStatus) return;
    loadedFor.current = authStatus;
    let alive = true;
    (async () => {
      let moved = 0;
      if (authStatus === "authenticated") moved = await moveDevicePhotosToAccount().catch(() => 0);
      const photos = authStatus === "authenticated" ? await accountPhotos.list().catch(() => []) : await listPhotos();
      if (!alive) return;
      if (moved) setStorageNote(`${moved} תמונות מהמכשיר הועברו לחשבון שלך — עכשיו הן זמינות בכל מכשיר.`);
      setUploads(photos.map((p) => ({ kind: "upload", id: p.id, src: p.src, width: p.width, height: p.height, label: p.label })));
      photos.forEach((p) => p.calib && (savedCalib.current[p.id] = JSON.stringify(p.calib)));
      setCalibs((c) => ({ ...Object.fromEntries(photos.filter((p) => p.calib).map((p) => [p.id, p.calib!])), ...c }));
      // יש חפצים שמורים → פותחים ישר על "החפץ שלי" כדי שיראו אותם
      if (photos.length && !initialMockup) setSource("upload");
      const last = !initialMockup && remembered ? photos.find((p) => p.id === remembered.bgId) : undefined;
      if (last) {
        setBg({ kind: "upload", id: last.id, src: last.src, width: last.width, height: last.height, label: last.label });
        setPlacement(remembered!.placement);
        setSource("upload");
      }
    })();
    return () => {
      alive = false;
      // הטעינה בוטלה לפני שהסתיימה — מאפשרים לטעון שוב (אחרת הרשימה נשארת ריקה)
      loadedFor.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  // שמירת הכיול של תמונה שהועלתה, בסיום הכיול (רק אם השתנה)
  useEffect(() => {
    const c = calibs[bg.id];
    if (bg.kind !== "upload" || calibrating || !c || !(c.cm > 0)) return;
    const json = JSON.stringify(c);
    if (savedCalib.current[bg.id] === json) return;
    savedCalib.current[bg.id] = json;
    if (inAccount) accountPhotos.saveCalib(bg.id, c);
    else saveCalib(bg.id, c);
  }, [bg, calibrating, calibs, inAccount]);

  const removeUpload = async (id: string) => {
    if (inAccount) await accountPhotos.remove(id);
    else await deletePhoto(id);
    setUploads((u) => u.filter((x) => x.id !== id));
    if (bg.id === id) chooseBg(galleryBg("bottle"));
  };

  // קנה מידה: לגלריה — ידוע מראש. לתמונה שהועלתה — לפי כיול.
  const calib = calibs[bg.id];
  const pxPerCm =
    bg.kind === "gallery"
      ? getMockup(bg.id).objectPx / (objectSizes[bg.id] || getMockup(bg.id).objectWidthCm)
      : calib && !calibrating && calib.cm > 0
        ? Math.hypot((calib.x2 - calib.x1) * bg.width, (calib.y2 - calib.y1) * bg.height) / Math.max(0.1, calib.cm)
        : null;
  const isReal = realMode && !!pxPerCm;
  // תמונה שהועלתה ועוד לא הוזן לה רוחב אמיתי
  const needsCalib = bg.kind === "upload" && realMode && !calibrating && !(calib && calib.cm > 0);
  const setCalibCm = (cm: number) => setCalibs((c) => ({ ...c, [bg.id]: { ...c[bg.id], cm } }));
  const eff: Placement = isReal
    ? { ...placement, ...(bg.kind === "gallery" ? mockupScale(getMockup(bg.id), design.widthMm, objectSizes[bg.id]) : realScale(pxPerCm!, bg.width, design.widthMm)) }
    : { ...placement, scaleX: 1 };

  const startCalibration = () => {
    setCalibs((c) => ({ ...c, [bg.id]: c[bg.id] ?? { x1: 0.3, y1: 0.55, x2: 0.7, y2: 0.55, cm: 0 } }));
    setCalibrating(true);
  };
  const moveRuler = (e: React.PointerEvent) => {
    const r = rulerDrag.current;
    if (!r) return;
    const x = Math.min(1, Math.max(0, (e.clientX - r.rect.left) / r.rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.rect.top) / r.rect.height));
    setCalibs((c) => ({ ...c, [bg.id]: { ...c[bg.id], ...(r.end === 1 ? { x1: x, y1: y } : { x2: x, y2: y }) } }));
  };

  // גלריה: חלון "מה הגודל של החפץ שלך?" קופץ בכל בחירת חפץ (וגם בכניסה להדמיה)
  const [askSize, setAskSize] = useState(true);
  const [sizeDraft, setSizeDraft] = useState("");
  useEffect(() => {
    if (bg.kind === "gallery") setSizeDraft(String(objectSizes[bg.id] ?? getMockup(bg.id).objectWidthCm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg.id]);
  const confirmSize = () => {
    const v = parseFloat(sizeDraft);
    if (!(v > 0 && v <= 500) || bg.kind !== "gallery") return;
    setObjectSize(bg.id, v);
    setAskSize(false);
  };

  // תצוגת 360° לחפצים גליליים מהגלריה
  const [view3d, setView3d] = useState(false);
  const cyl = bg.kind === "gallery" ? CYLINDERS[bg.id] : undefined;

  const chooseBg = (b: MockupBackground) => {
    setAskSize(b.kind === "gallery");
    setBg(b);
    setPlacement(defaultPlacement(b, design));
    setSelected(true);
    setCalibrating(false);
  };

  // אם מידות העיצוב משתנות — שומרים על גובה/רוחב סבירים
  const aspectKey = `${design.widthMm}x${design.heightMm}`;
  const prevAspect = useRef(aspectKey);
  useEffect(() => {
    if (prevAspect.current !== aspectKey) {
      prevAspect.current = aspectKey;
      setPlacement((p) => ({ ...p, width: Math.min(p.width, defaultPlacement(bg, design).width * 1.6) }));
    }
  }, [aspectKey, bg, design]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setError(null);
    setBusy("upload");
    try {
      const p = await processPhoto(file);
      let b: MockupBackground = { kind: "upload", id: `u${Date.now()}`, src: p.src, width: p.width, height: p.height, label: p.fileName };
      if (inAccount) {
        // שמירה בחשבון; התמונה מוצגת מהמחשב בינתיים כדי שלא יהיה עיכוב
        const r = await accountPhotos.save({ src: p.src, width: p.width, height: p.height, label: p.fileName });
        if (r.photo) b = { ...b, id: r.photo.id };
        setStorageNote(r.photo ? null : `${r.error} התמונה זמינה עד סגירת הלשונית.`);
      } else {
        const ok = await savePhoto({ id: b.id, src: b.src, width: b.width, height: b.height, label: b.label, createdAt: Date.now() });
        setStorageNote(ok ? null : "לא הצלחנו לשמור את התמונה לפעם הבאה (אחסון הדפדפן מלא או חסום). היא זמינה עד סגירת הלשונית.");
      }
      setUploads((u) => [b, ...u]);
      chooseBg(b);
      if (realMode) {
        setCalibs((c) => ({ ...c, [b.id]: { x1: 0.3, y1: 0.55, x2: 0.7, y2: 0.55, cm: 0 } }));
        setCalibrating(true);
      }
    } catch (e) {
      setError(e instanceof UploadError ? e.message : "לא הצלחנו לטעון את התמונה.");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const start = (kind: Drag["kind"]) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(true);
    const rect = stageRef.current!.getBoundingClientRect();
    dragRef.current = { kind, sx: e.clientX, sy: e.clientY, orig: placement, rect };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const { rect, orig } = d;
    if (d.kind === "move") {
      setPlacement({
        ...orig,
        cx: Math.min(1, Math.max(0, orig.cx + (e.clientX - d.sx) / rect.width)),
        cy: Math.min(1, Math.max(0, orig.cy + (e.clientY - d.sy) / rect.height)),
      });
    } else {
      const cx = rect.left + orig.cx * rect.width;
      const cy = rect.top + orig.cy * rect.height;
      if (d.kind === "scale") {
        const k = Math.hypot(e.clientX - cx, e.clientY - cy) / Math.max(4, Math.hypot(d.sx - cx, d.sy - cy));
        setPlacement({ ...orig, width: Math.min(1.2, Math.max(0.02, orig.width * k)) });
      } else {
        const a0 = Math.atan2(d.sy - cy, d.sx - cx);
        const a1 = Math.atan2(e.clientY - cy, e.clientX - cx);
        let r = orig.rotation + ((a1 - a0) * 180) / Math.PI;
        r = ((((r + 180) % 360) + 360) % 360) - 180;
        if (Math.abs(r - Math.round(r / 45) * 45) < 3) r = Math.round(r / 45) * 45;
        setPlacement({ ...orig, rotation: Math.round(r) });
      }
    }
  };
  const end = () => (dragRef.current = null);

  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.02 : 0.005;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const v = map[e.key];
    if (v) {
      e.preventDefault();
      setPlacement((p) => ({ ...p, cx: p.cx + v[0], cy: p.cy + v[1] }));
    }
  };

  const save = async () => {
    setBusy("save");
    try {
      const thumb = await renderMockupPng(bg.src, design, eff, 640);
      setSaved((s) => [{ id: `m${Date.now()}`, bg, placement: eff, design: structuredClone(design), thumb }, ...s].slice(0, 8));
    } finally {
      setBusy(null);
    }
  };

  const exportPng = async (b = bg, p: Placement = eff, d = design) => {
    setBusy("export");
    try {
      const url = await renderMockupPng(b.src, d, p, 2000);
      downloadDataUrl(url, `הדמיה-${fileSlug(d.name)}-${b.label}.jpg`);
    } finally {
      setBusy(null);
    }
  };

  const ratio = bg.width / bg.height;
  const singleColor = new Set(design.elements.map((e) => e.colorId)).size <= 1;

  return (
    <div className="grid h-full lg:grid-cols-[320px_minmax(0,1fr)_320px]">
      {/* מקור הרקע */}
      <aside className="order-2 overflow-y-auto border-stone/70 bg-ivory lg:order-1 lg:border-l">
        <div className="px-5 pt-5">
          <Segmented
            value={source}
            onChange={setSource}
            className="w-full [&>button]:flex-1"
            options={[
              { id: "gallery", label: <><Images className="h-4 w-4" /> גלריה</> },
              { id: "upload", label: <><Camera className="h-4 w-4" /> החפץ שלי</> },
              { id: "ai", label: <><Wand2 className="h-4 w-4" /> AI</> },
            ]}
          />
        </div>

        {source === "gallery" && (
          <PanelSection>
            {uploads.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-choco">החפצים שלי · {uploads.length}</p>
                  <button type="button" onClick={() => setSource("upload")} className="text-[12px] text-mocha underline-offset-4 hover:text-choco hover:underline">
                    לניהול
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {uploads.slice(0, 8).map((u) => (
                    <button key={u.id} type="button" onClick={() => chooseBg(u)} className={`block overflow-hidden rounded-xl border ${bg.id === u.id ? "border-choco ring-1 ring-choco" : "border-stone"}`} title={u.label}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.src} alt={u.label} className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-[12px] font-semibold text-choco">גלריה</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              {MOCKUPS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => chooseBg(galleryBg(m.id))}
                  className={`group overflow-hidden rounded-2xl border text-right transition ${bg.id === m.id ? "border-choco ring-1 ring-choco" : "border-stone hover:border-taupe"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.src} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <span className="block px-2.5 py-2 text-[12.5px] text-choco">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-mocha">הגלריה היא רק נקודת התחלה — אפשר להעלות תמונה של כל חפץ.</p>
          </PanelSection>
        )}

        {source === "upload" && (
          <PanelSection>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onUpload(e.dataTransfer.files?.[0]);
              }}
              className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-taupe/70 bg-cream/60 px-4 py-9 text-center transition hover:border-choco"
            >
              {busy === "upload" ? <Loader2 className="h-8 w-8 animate-spin text-olive" /> : <UploadCloud className="h-8 w-8 text-olive" strokeWidth={1.3} />}
              <span className="text-[15px] font-medium text-choco">צלמו את החפץ שלכם והעלו</span>
              <span className="text-[12px] text-mocha">בקבוק, אריזה, קיר, מחשב — כל דבר · JPG / PNG</span>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
            {error && <p className="mt-3 rounded-xl bg-clay/10 px-3 py-2 text-[13px] text-clay">{error}</p>}
            {storageNote && <p className="mt-3 rounded-xl bg-[#f8ecd4] px-3 py-2 text-[12.5px] text-[#7a5212]">{storageNote}</p>}
            {uploads.length > 0 && (
              <>
                <p className="mt-5 text-[12px] font-semibold text-choco">התמונות שלי · {uploads.length}</p>
                <div className="mt-2 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pe-1">
                  {uploads.map((u) => (
                    <div key={u.id} className="group relative">
                      <button type="button" onClick={() => chooseBg(u)} className={`block w-full overflow-hidden rounded-xl border ${bg.id === u.id ? "border-choco ring-1 ring-choco" : "border-stone"}`} title={u.label}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.src} alt={u.label} className="aspect-square w-full object-cover" />
                      </button>
                      {calibs[u.id]?.cm > 0 && <span className="pointer-events-none absolute bottom-1 right-1 rounded-full bg-ivory/90 px-1.5 text-[10px] text-olive-dark">מכויל</span>}
                      <button
                        type="button"
                        onClick={() => removeUpload(u.id)}
                        className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ivory/90 text-mocha opacity-0 shadow transition hover:text-clay group-hover:opacity-100 focus:opacity-100"
                        aria-label={`מחיקת ${u.label}`}
                        title="מחיקת התמונה"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <ul className="mt-5 space-y-2 text-[12.5px] leading-relaxed text-cocoa">
              <li>· צלמו מול החפץ, באור יום ובלי זווית חדה.</li>
              {inAccount ? (
                <li>
                  · התמונות נשמרות בחשבון <b dir="ltr">{session?.user?.email}</b> ומופיעות בכל מכשיר שתתחברי ממנו עם החשבון הזה. רק את רואה אותן.
                </li>
              ) : (
                <li>
                  · התמונות נשמרות בדפדפן הזה בלבד.{" "}
                  <Link href={`/login?callbackUrl=${encodeURIComponent("/studio?step=mockup")}`} className="font-semibold text-olive underline-offset-4 hover:underline">
                    התחברי
                  </Link>{" "}
                  כדי לשמור אותן בחשבון ולראות אותן בכל מכשיר.
                </li>
              )}
              <li>· קנה המידה בהדמיה משוער — המדבקה תיוצר במידות שבחרתם.</li>
            </ul>
          </PanelSection>
        )}

        {source === "ai" && (
          <PanelSection>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-olive" />
              <span className="text-[14px] font-medium text-choco">יצירת רקע מתיאור</span>
              <PlannedTag>בקרוב</PlannedTag>
            </div>
            <textarea
              rows={3}
              placeholder={AI_PROMPT_EXAMPLES[0]}
              className="w-full resize-none rounded-xl border border-stone bg-cream/50 px-3 py-2.5 text-[14px] text-choco outline-none"
              disabled={!aiBackgroundProvider.available}
              aria-describedby="ai-note"
            />
            <button type="button" disabled className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-choco text-[14px] text-ivory opacity-35">
              <Wand2 className="h-4 w-4" /> יצירת רקע
            </button>
            <p id="ai-note" className="mt-4 text-[12.5px] leading-relaxed text-cocoa">
              בקרוב תוכלו לתאר במילים חפץ או סביבה — למשל &quot;{AI_PROMPT_EXAMPLES[1]}&quot; — והמערכת תיצור תמונת רקע. המדבקה עצמה תישאר שכבה נפרדת ומדויקת, ולא תעבור דרך מודל התמונה.
            </p>
            <p className="mt-3 text-[12px] text-mocha">התכונה אינה פעילה עדיין, ולכן הכפתור מושבת.</p>
          </PanelSection>
        )}
      </aside>

      {/* הבמה */}
      <div className="order-1 flex min-h-[420px] flex-col bg-sand/60 lg:order-2">
        <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8" onPointerDown={() => setSelected(false)}>
          {cyl && (
            <div className="absolute right-4 top-4 z-30 flex gap-1 rounded-full border border-stone bg-ivory/95 p-1 shadow-sm" onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setView3d(false)} className={`h-8 rounded-full px-3 text-[12.5px] ${!view3d ? "bg-choco text-ivory" : "text-cocoa hover:bg-sand"}`}>
                תמונה
              </button>
              <button type="button" onClick={() => setView3d(true)} className={`h-8 rounded-full px-3 text-[12.5px] ${view3d ? "bg-choco text-ivory" : "text-cocoa hover:bg-sand"}`}>
                תלת מימד 360°
              </button>
            </div>
          )}
          {view3d && cyl ? (
            <Cylinder3D
              design={design}
              spec={{ ...cyl, diameterCm: objectSizes[bg.id] ?? getMockup(bg.id).objectWidthCm }}
              place={(() => {
                // אותו מיקום וסיבוב כמו בתצוגת "תמונה", מתורגם לס"מ על החפץ
                const m = getMockup(bg.id);
                const imgPxPerCm = m.objectPx / (objectSizes[bg.id] ?? m.objectWidthCm);
                return {
                  rotation: placement.rotation,
                  offsetXCm: ((placement.cx - m.area.cx) * m.width) / imgPxPerCm,
                  offsetYCm: ((placement.cy - m.area.cy) * m.height) / imgPxPerCm,
                };
              })()}
            />
          ) : (
          <>
          <div
            ref={stageRef}
            className="relative w-full overflow-hidden rounded-[20px] shadow-[0_30px_70px_-35px_rgba(38,27,21,0.55)]"
            style={{ aspectRatio: `${ratio}`, maxWidth: `min(100%, calc((100vh - 230px) * ${ratio}))` }}
            onPointerMove={(e) => {
              move(e);
              moveRuler(e);
            }}
            onPointerUp={() => {
              end();
              rulerDrag.current = null;
            }}
            onPointerCancel={end}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bg.src} alt={`רקע: ${bg.label}`} className="absolute inset-0 h-full w-full select-none" draggable={false} />
            <div
              className={`absolute touch-none transition-opacity ${placement.realism ? "vinyl-layer" : ""} ${calibrating ? "pointer-events-none opacity-25" : ""}`}
              style={{
                left: `${eff.cx * 100}%`,
                top: `${eff.cy * 100}%`,
                width: `${eff.width * 100}%`,
                transform: `translate(-50%, -50%) rotate(${eff.rotation}deg) scaleX(${eff.scaleX ?? 1})`,
              }}
              onPointerDown={start("move")}
              onKeyDown={nudge}
              tabIndex={0}
              role="application"
              aria-label="המדבקה על ההדמיה. גררו להזזה, חצים להזזה עדינה."
            >
              <DesignSvg design={design} className={`block h-auto w-full cursor-move ${placement.realism ? "opacity-[0.97]" : ""}`} />
              {selected && (
                <>
                  <div className="pointer-events-none absolute -inset-2 rounded-md border border-dashed border-ivory/90 shadow-[0_0_0_1px_rgba(38,27,21,0.35)]" />
                  {!isReal && [
                    "-left-3.5 -top-3.5",
                    "-right-3.5 -top-3.5",
                    "-left-3.5 -bottom-3.5",
                    "-right-3.5 -bottom-3.5",
                  ].map((pos) => (
                    <span key={pos} onPointerDown={start("scale")} className={`absolute ${pos} h-4 w-4 cursor-nwse-resize rounded-full border-2 border-choco bg-ivory shadow`} title="שינוי גודל" />
                  ))}
                  <span onPointerDown={start("rotate")} className="absolute -top-10 left-1/2 grid h-7 w-7 -translate-x-1/2 cursor-grab place-items-center rounded-full border-2 border-choco bg-ivory shadow" title="סיבוב">
                    <RotateCcw className="h-3.5 w-3.5 text-choco" />
                  </span>
                </>
              )}
            </div>

            {/* סרגל כיול לתמונה שהועלתה */}
            {calibrating && calib && (
              <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${bg.width} ${bg.height}`} preserveAspectRatio="none" aria-label="סרגל כיול">
                <line x1={calib.x1 * bg.width} y1={calib.y1 * bg.height} x2={calib.x2 * bg.width} y2={calib.y2 * bg.height} stroke="#fff" strokeWidth={bg.width / 160} strokeLinecap="round" />
                <line x1={calib.x1 * bg.width} y1={calib.y1 * bg.height} x2={calib.x2 * bg.width} y2={calib.y2 * bg.height} stroke="#b5624a" strokeWidth={bg.width / 400} strokeDasharray={`${bg.width / 80} ${bg.width / 160}`} />
                <text x={((calib.x1 + calib.x2) / 2) * bg.width} y={((calib.y1 + calib.y2) / 2) * bg.height - bg.width / 50} textAnchor="middle" fontSize={bg.width / 32} fill="#fff" stroke="#3a2a21" strokeWidth={bg.width / 500} paintOrder="stroke" fontFamily="Assistant, sans-serif">
                  {calib.cm > 0 ? `${calib.cm} ס״מ` : "? ס״מ"}
                </text>
                {([1, 2] as const).map((end) => (
                  <circle
                    key={end}
                    cx={(end === 1 ? calib.x1 : calib.x2) * bg.width}
                    cy={(end === 1 ? calib.y1 : calib.y2) * bg.height}
                    r={bg.width / 70}
                    fill="#fbf8f3"
                    stroke="#b5624a"
                    strokeWidth={bg.width / 300}
                    className="cursor-grab touch-none"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      rulerDrag.current = { end, rect: stageRef.current!.getBoundingClientRect() };
                      (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    }}
                  />
                ))}
              </svg>
            )}

          </div>
            {/* שלב חובה: רוחב אמיתי של החפץ שבתמונה */}
            {calibrating && calib && (
              <div className="absolute bottom-4 left-1/2 z-20 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-ivory p-4 shadow-xl ring-1 ring-stone/60" onPointerDown={(e) => e.stopPropagation()}>
                <p className="flex items-center gap-2 font-display text-lg text-choco">
                  <Ruler className="h-5 w-5 text-clay" /> כמה רחב החפץ שלך במציאות?
                </p>
                <ol className="mt-2 space-y-1 text-[13px] leading-relaxed text-cocoa">
                  <li>
                    <b>1.</b> גררי את <b className="text-clay">שתי הנקודות</b> לשני הצדדים של החפץ בתמונה.
                  </li>
                  <li>
                    <b>2.</b> מדדי את החפץ בסרגל וכתבי כאן את הרוחב:
                  </li>
                </ol>
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex h-12 flex-1 items-center rounded-xl border-2 border-clay/60 bg-ivory px-3 focus-within:border-choco">
                    <input
                      type="number"
                      inputMode="decimal"
                      autoFocus
                      min={0.5}
                      max={500}
                      step={0.1}
                      placeholder="למשל 7.5"
                      value={calib.cm > 0 ? calib.cm : ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setCalibCm(Number.isFinite(v) && v > 0 && v <= 500 ? v : 0);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && calib.cm > 0 && setCalibrating(false)}
                      className="w-full min-w-0 bg-transparent text-lg font-semibold text-choco outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      dir="ltr"
                      aria-label="רוחב החפץ בס״מ"
                    />
                    <span className="text-[13px] text-mocha">ס״מ</span>
                  </label>
                  <button type="button" disabled={!(calib.cm > 0)} onClick={() => setCalibrating(false)} className="h-12 rounded-xl bg-choco px-5 text-[15px] text-ivory disabled:opacity-35">
                    אישור
                  </button>
                </div>
                <button type="button" onClick={() => setCalibrating(false)} className="mt-2 text-[12px] text-mocha underline-offset-4 hover:underline">
                  דלגי — ההדמיה לא תהיה בגודל אמיתי
                </button>
              </div>
            )}

            {needsCalib && (
              <div className="absolute left-1/2 top-4 z-20 flex w-[min(460px,calc(100%-2rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f8ecd4] px-3 py-2 text-[13px] text-[#7a5212] shadow" onPointerDown={(e) => e.stopPropagation()}>
                <span>הגודל של המדבקה על התמונה הזו עדיין לא אמיתי.</span>
                <button type="button" onClick={startCalibration} className="rounded-full bg-choco px-3 py-1 text-[12.5px] text-ivory">
                  הזנת רוחב החפץ
                </button>
              </div>
            )}
            {/* גלריה: בכל בחירת חפץ — שואלים מה הגודל של החפץ שלך */}
            {askSize && bg.kind === "gallery" && realMode && (
              <div className="absolute bottom-4 left-1/2 z-20 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-ivory p-4 shadow-xl ring-1 ring-stone/60" onPointerDown={(e) => e.stopPropagation()}>
                <p className="flex items-center gap-2 font-display text-lg text-choco">
                  <Ruler className="h-5 w-5 text-clay" /> מה הגודל של החפץ שלך?
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-cocoa">
                  מדדי בסרגל — וההדמיה תציג את המדבקה בגודל האמיתי ביחס אליו. ({getMockup(bg.id).dimLabel})
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex h-12 flex-1 items-center rounded-xl border-2 border-clay/60 bg-ivory px-3 focus-within:border-choco">
                    <input
                      type="number"
                      inputMode="decimal"
                      autoFocus
                      min={1}
                      max={500}
                      step={0.1}
                      placeholder={`למשל ${getMockup(bg.id).objectWidthCm}`}
                      value={sizeDraft}
                      onChange={(e) => setSizeDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmSize()}
                      className="w-full min-w-0 bg-transparent text-lg font-semibold text-choco outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      dir="ltr"
                      aria-label="גודל החפץ בס״מ"
                    />
                    <span className="text-[13px] text-mocha">ס״מ</span>
                  </label>
                  <button type="button" disabled={!(parseFloat(sizeDraft) > 0)} onClick={confirmSize} className="h-12 rounded-xl bg-choco px-5 text-[15px] text-ivory disabled:opacity-35">
                    אישור
                  </button>
                </div>
                <button type="button" onClick={() => setAskSize(false)} className="mt-2 text-[12px] text-mocha underline-offset-4 hover:underline">
                  דלגי — להשתמש בגודל {objectSizes[bg.id] ?? getMockup(bg.id).objectWidthCm} ס״מ
                </button>
              </div>
            )}
          </>
          )}
        </div>
        <p className="flex items-center justify-center gap-2 px-4 pb-4 text-center text-[12px] text-cocoa">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {isReal
            ? `קנה מידה אמיתי: מדבקה ${(design.widthMm / 10).toFixed(1)}×${(design.heightMm / 10).toFixed(1)} ס״מ${bg.kind === "gallery" ? ` על ${objectNote(getMockup(bg.id), objectSizes[bg.id])}` : " לפי הכיול שלך"} · הדמיה להמחשה`
            : `הדמיה להמחשה בלבד · מידות הייצור: ${(design.widthMm / 10).toFixed(1)}×${(design.heightMm / 10).toFixed(1)} ס״מ`}
        </p>
      </div>

      {/* בקרות */}
      <aside className="order-3 overflow-y-auto border-stone/70 bg-ivory lg:border-r">
        <PanelSection title="מיקום המדבקה" aside={
          <button type="button" onClick={() => setPlacement(defaultPlacement(bg, design))} className="flex items-center gap-1 text-[12px] text-mocha hover:text-choco">
            <RotateCcw className="h-3.5 w-3.5" /> איפוס
          </button>
        }>
          <div className="space-y-5">
            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl bg-olive-soft/50 p-3">
              <span>
                <span className="block text-[13.5px] font-medium text-choco">קנה מידה אמיתי</span>
                <span className="block text-[12px] text-cocoa">המדבקה מוצגת בגודל שבחרת ({(design.widthMm / 10).toFixed(1)}×{(design.heightMm / 10).toFixed(1)} ס״מ) ביחס לחפץ</span>
              </span>
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#3a2a21]" checked={realMode} onChange={(e) => setRealMode(e.target.checked)} />
            </label>
            {isReal ? (
              <p className="text-[12px] text-mocha">לשינוי הגודל — חזרו לשלב העיצוב ושנו את מידות המדבקה.</p>
            ) : (
              <Slider label="גודל בתצוגה" value={Math.round(placement.width * 100)} min={2} max={100} onChange={(v) => setPlacement((p) => ({ ...p, width: v / 100 }))} format={(v) => `${v}%`} />
            )}
            <Slider label="סיבוב" value={placement.rotation} min={-180} max={180} onChange={(v) => setPlacement((p) => ({ ...p, rotation: v }))} format={(v) => `${v}°`} />
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-[13px] text-cocoa">מראה ריאליסטי (צל מגע עדין)</span>
              <input type="checkbox" className="h-5 w-5 accent-[#3a2a21]" checked={placement.realism} onChange={(e) => setPlacement((p) => ({ ...p, realism: e.target.checked }))} />
            </label>
          </div>
          <p className="mt-4 text-[12px] text-mocha">גוררים את המדבקה ומסובבים מהידית העליונה{isReal ? "" : ", מגדילים מהפינות"}.</p>
        </PanelSection>

        {bg.kind === "gallery" && realMode && (
          <PanelSection title="החפץ שלך במידות אמיתיות">
            <p className="mb-3 text-[12.5px] leading-relaxed text-cocoa">מדדי את החפץ שלך בסרגל — וההדמיה תציג את המדבקה בדיוק ביחס אליו.</p>
            <NumberField
              label={getMockup(bg.id).dimLabel}
              suffix="ס״מ"
              value={objectSizes[bg.id] ?? getMockup(bg.id).objectWidthCm}
              min={1}
              max={500}
              onChange={(cm) => setObjectSize(bg.id, cm)}
            />
            {objectSizes[bg.id] && objectSizes[bg.id] !== getMockup(bg.id).objectWidthCm && (
              <button type="button" onClick={() => setObjectSize(bg.id, null)} className="mt-2 text-[12px] text-mocha underline-offset-4 hover:text-choco hover:underline">
                חזרה לברירת המחדל ({getMockup(bg.id).objectWidthCm} ס״מ)
              </button>
            )}
          </PanelSection>
        )}

        {bg.kind === "upload" && realMode && (
          <PanelSection title="רוחב החפץ שבתמונה">
            {calibrating ? (
              <p className="text-[12.5px] leading-relaxed text-cocoa">ממלאים את הרוחב בחלון שעל התמונה.</p>
            ) : calib && calib.cm > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] text-choco">
                  <b>{calib.cm}</b> ס״מ <span className="text-[12px] text-olive-dark">· ההדמיה בגודל אמיתי</span>
                </p>
                <button type="button" onClick={startCalibration} className="inline-flex items-center gap-1 rounded-xl border border-stone px-3 py-1.5 text-[12.5px] text-choco hover:border-choco">
                  <Ruler className="h-3.5 w-3.5" /> שינוי
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-[12.5px] leading-relaxed text-cocoa">כדי שהמדבקה תוצג בגודל האמיתי על התמונה, צריך להזין כמה רחב החפץ במציאות.</p>
                <button type="button" onClick={startCalibration} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-choco text-[14px] text-ivory">
                  <Ruler className="h-4 w-4" /> הזנת רוחב החפץ
                </button>
              </>
            )}
          </PanelSection>
        )}

        <PanelSection title="צבע ויניל">
          <AllColorsPicker value={design.elements[0]?.colorId ?? "black"} onChange={onRecolorAll} size={28} />
          {!singleColor && <p className="mt-2 text-[12px] text-mocha">בחירה כאן תצבע את כל העיצוב בצבע אחד.</p>}
        </PanelSection>

        <PanelSection title="שמירה והשוואה">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={save} disabled={!!busy} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-choco text-[13.5px] text-choco hover:bg-choco hover:text-ivory disabled:opacity-50">
              {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={1.5} />} שמירת הדמיה
            </button>
            <button type="button" onClick={() => exportPng()} disabled={!!busy} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-choco text-[13.5px] text-ivory hover:bg-ink disabled:opacity-50">
              {busy === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={1.5} />} ייצוא תמונה
            </button>
          </div>
          {saved.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {saved.map((s, i) => (
                <figure key={s.id} className="group relative overflow-hidden rounded-xl border border-stone">
                  <button type="button" onClick={() => { setBg(s.bg); setPlacement(s.placement); }} className="block w-full" title="שחזור הדמיה זו">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.thumb} alt={`הדמיה ${i + 1}`} className="w-full" />
                  </button>
                  <figcaption className="flex items-center justify-between px-2 py-1.5 text-[11px] text-cocoa">
                    <span className="truncate">{s.bg.label}</span>
                    <span className="flex gap-1">
                      <button type="button" onClick={() => exportPng(s.bg, s.placement, s.design)} aria-label="הורדה" className="text-mocha hover:text-choco">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setSaved((all) => all.filter((x) => x.id !== s.id))} aria-label="מחיקה" className="text-mocha hover:text-clay">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[12px] leading-relaxed text-mocha">שמרו כמה הדמיות — על חפצים שונים או בצבעים שונים — והשוו ביניהן כאן.</p>
          )}
        </PanelSection>

        <PanelSection>
          <p className="text-[12px] font-semibold text-choco">בהמשך הפיתוח</p>
          <ul className="mt-2 space-y-1.5 text-[12px] text-mocha">
            <li>· התאמת פרספקטיבה ועיוות למשטחים מעוגלים</li>
            <li>· התאמת תאורה וברק לפי החומר</li>
          </ul>
        </PanelSection>
      </aside>
    </div>
  );
}
