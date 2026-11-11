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
    <div className={cn("mb-10 flex flex-col gap-6 md:mb-14", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {kicker && <p className={cn("kicker mb-3", light && "kicker-light")}>{kicker}</p>}
        <h2 className={cn("h2", light && "text-white")}>{title}</h2>
        {intro && <p className={cn("lead mt-5", light && "text-white/70")}>{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ kicker, title, intro, children }: { kicker?: string; title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden bg-flag text-white">
      <div className="container-site relative pt-36 pb-14 md:pt-44 md:pb-20">
        {kicker && <p className="kicker kicker-light mb-4">{kicker}</p>}
        <h1 className="display max-w-5xl text-white">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">{intro}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
      <div className="h-5 bg-crimson-600" aria-hidden />
    </header>
  );
}
