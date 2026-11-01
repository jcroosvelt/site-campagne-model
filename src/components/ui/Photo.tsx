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
    <div
      className={cn("relative flex items-end overflow-hidden bg-navy-800", className)}
      role="img"
      aria-label={label ? `${alt} — ${label}` : alt}
    >
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.035)" strokeWidth="4" />
          </pattern>
        </defs>
        <rect width="400" height="500" fill="url(#hatch)" />
        {variant === "portrait" ? (
          <g fill="rgba(255,255,255,0.07)">
            <circle cx="200" cy="190" r="78" />
            <path d="M40 500c0-110 72-190 160-190s160 80 160 190Z" />
          </g>
        ) : (
          <g fill="rgba(255,255,255,0.06)">
            <path d="M0 500 120 330l80 90 70-120 130 200Z" />
            <circle cx="300" cy="150" r="40" />
          </g>
        )}
      </svg>
      {label && (
        <span className="relative m-4 inline-flex items-center gap-2 rounded-sm border border-white/15 bg-navy-950/60 px-2.5 py-1.5 text-[0.7rem] font-medium tracking-wide text-white/80 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
          {label}
        </span>
      )}
    </div>
  );
}
