import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  intro,
  light,
  align = "left",
  action,
}: {
  kicker?: string;
  title: string;
  intro?: string;
  light?: boolean;
  align?: "left" | "center";
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-12 flex flex-col gap-6 md:mb-16", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {kicker && <p className={cn("kicker mb-4", light && "kicker-light")}>{kicker}</p>}
        <h2 className={cn("h2", light && "text-white")}>{title}</h2>
        {intro && <p className={cn("lead mt-5", light && "text-white/70")}>{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ kicker, title, intro, children }: { kicker?: string; title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden bg-navy-900 text-white">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 border-l border-white/5 lg:block" aria-hidden />
      <div className="container-site relative pt-36 pb-16 md:pt-44 md:pb-20">
        {kicker && <p className="kicker kicker-light mb-5 animate-rise">{kicker}</p>}
        <h1 className="display max-w-3xl text-white animate-rise delay-1">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 animate-rise delay-2">{intro}</p>}
        {children && <div className="mt-8 animate-rise delay-3">{children}</div>}
      </div>
      <div className="h-1 bg-crimson-600" aria-hidden>
        <div className="h-full w-24 bg-gold-500" />
      </div>
    </header>
  );
}

export function Placeholder({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return <span className="placeholder-tag">{text}</span>;
}

export function isPlaceholder(s: string) {
  return s.includes("[À COMPLÉTER]");
}
