"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { SOCIAL_ICONS } from "@/components/ui/icons";

export function ShareButtons({ url, title, labels }: { url: string; title: string; labels: { share: string; copyLink: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const tt = encodeURIComponent(title);
  const links = [
    { key: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: SOCIAL_ICONS.facebook },
    { key: "x", href: `https://x.com/intent/post?url=${u}&text=${tt}`, Icon: SOCIAL_ICONS.x },
    { key: "whatsapp", href: `https://wa.me/?text=${tt}%20${u}`, Icon: SOCIAL_ICONS.whatsapp },
    { key: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: SOCIAL_ICONS.linkedin },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{labels.share}</span>
      {links.map(({ key, href, Icon }) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${labels.share} — ${key}`} className="flex h-10 w-10 items-center justify-center border border-line text-navy-900 transition-colors hover:border-navy-900 hover:bg-navy-900 hover:text-white">
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex h-10 items-center gap-2 border border-line px-3 text-sm text-navy-900 transition-colors hover:border-navy-900"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <LinkIcon className="h-4 w-4" aria-hidden />}
        <span aria-live="polite">{copied ? labels.copied : labels.copyLink}</span>
      </button>
    </div>
  );
}
