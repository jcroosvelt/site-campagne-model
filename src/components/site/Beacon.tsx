"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Mesure d'audience anonyme (sans cookie). Respecte Do Not Track / Global Privacy Control. */
export function Beacon() {
  const pathname = usePathname();
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    fetch("/api/track", { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ p: pathname }) }).catch(() => {});
  }, [pathname]);
  return null;
}
