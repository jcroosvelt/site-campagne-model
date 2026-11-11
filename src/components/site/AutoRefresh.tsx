"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Rafraîchit la page de suivi tant que le paiement est en attente de confirmation par le prestataire. */
export function AutoRefresh({ label, intervalMs = 6000 }: { label: string; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      if (++n > 20) return clearInterval(id);
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return (
    <button type="button" onClick={() => router.refresh()} className="btn btn-outline"> {label}
    </button>
  );
}
