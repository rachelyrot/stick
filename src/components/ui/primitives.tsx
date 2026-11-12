import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "olive" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 ease-out-soft disabled:pointer-events-none disabled:opacity-40 select-none";
const variants: Record<Variant, string> = {
  primary: "bg-choco text-ivory hover:bg-ink shadow-[0_10px_30px_-12px_rgba(58,42,33,0.6)] hover:-translate-y-0.5",
  secondary: "border border-choco/25 text-choco hover:border-choco hover:bg-choco hover:text-ivory",
  ghost: "text-choco hover:bg-sand",
  olive: "bg-olive text-ivory hover:bg-olive-dark hover:-translate-y-0.5",
  light: "bg-ivory/90 text-choco backdrop-blur hover:bg-ivory",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export const btn = (variant: Variant = "primary", size: Size = "md", extra = "") => `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

export function Button({ variant = "primary", size = "md", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={btn(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={btn(variant, size, className)} {...props} />;
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.22em] text-olive ${className}`}>
      <span className="h-px w-8 bg-olive/60" />
      {children}
    </p>
  );
}

export function SectionTitle({ eyebrow, title, sub, center, className = "" }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; center?: boolean; className?: string }) {
  return (
    <div className={`${center ? "mx-auto text-center [&>p:first-child]:justify-center" : ""} max-w-2xl ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 font-display text-4xl font-light leading-[1.1] text-choco md:text-5xl">{title}</h2>
      {sub && <p className="mt-5 text-lg leading-relaxed text-cocoa">{sub}</p>}
    </div>
  );
}

export function Badge({ children, tone = "olive" }: { children: React.ReactNode; tone?: "olive" | "choco" | "clay" | "light" }) {
  const tones = {
    olive: "bg-olive text-ivory",
    choco: "bg-choco text-ivory",
    clay: "bg-clay text-ivory",
    light: "bg-ivory/90 text-choco",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider ${tones[tone]}`}>{children}</span>;
}

export function PlannedTag({ children = "בפיתוח" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-mocha/50 px-2.5 py-0.5 text-[11px] font-semibold text-mocha">
      <span className="h-1.5 w-1.5 rounded-full bg-mocha/60" />
      {children}
    </span>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}
