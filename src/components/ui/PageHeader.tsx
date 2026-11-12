import { Container, Eyebrow } from "./primitives";

export function PageHeader({ eyebrow, title, sub, children }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden pb-14 pt-12 lg:pb-20 lg:pt-20">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-olive-soft/50 blur-3xl" />
      <Container className="relative">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-3xl animate-fade-up font-display text-5xl font-light leading-[1.05] tracking-tight text-choco md:text-6xl lg:text-7xl">{title}</h1>
        {sub && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cocoa">{sub}</p>}
        {children}
      </Container>
    </header>
  );
}
