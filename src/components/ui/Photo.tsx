import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Image administrable. En l'absence de photo, affiche un visuel provisoire clairement identifié
 * (aucune photo de substitution trompeuse).
 */
export function Photo({
  src,
  alt,
  label,
  className,
  sizes = "100vw",
  priority,
  variant = "landscape",
}: {
  src?: string | null;
  alt: string;
  label?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  variant?: "portrait" | "landscape";
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-navy-100", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={cn("relative flex items-end overflow-hidden bg-navy-100", className)} role="img" aria-label={label ? `${alt} — ${label}` : alt}>
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
        {variant === "portrait" ? (
          <g fill="rgb(0 32 159 / 0.14)">
            <circle cx="200" cy="200" r="82" />
            <path d="M30 500c0-118 76-200 170-200s170 82 170 200Z" />
          </g>
        ) : (
          <g fill="rgb(0 32 159 / 0.1)">
            <path d="M0 500 130 320l80 95 75-130 115 215Z" />
            <circle cx="300" cy="150" r="42" />
          </g>
        )}
      </svg>
      {label && (
        <span className="relative m-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-crimson-600" />
          {label}
        </span>
      )}
    </div>
  );
}
