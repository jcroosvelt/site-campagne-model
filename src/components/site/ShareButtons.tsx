"use client";

import { useState } from "react";

export function ShareButtons({ url, title, labels }: { url: string; title: string; labels: { share: string; copyLink: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const tt = encodeURIComponent(title);
  const links = [
    { key: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, name: "Facebook" },
    { key: "x", href: `https://x.com/intent/post?url=${u}&text=${tt}`, name: "X" },
    { key: "whatsapp", href: `https://wa.me/?text=${tt}%20${u}`, name: "WhatsApp" },
    { key: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, name: "LinkedIn" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-sm font-bold text-muted">{labels.share}</span>
      {links.map(({ key, href, name }) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full bg-navy-50 px-4 py-2 text-sm font-bold text-navy-900 transition-colors hover:bg-flag hover:text-white">
          {name}
        </a>
      ))}
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="rounded-full bg-navy-50 px-4 py-2 text-sm font-bold text-navy-900 transition-colors hover:bg-flag hover:text-white"
      >
        <span aria-live="polite">{copied ? labels.copied : labels.copyLink}</span>
      </button>
    </div>
  );
}
