"use client";

import { deleteAction } from "@/app/admin/actions";

export function DeleteButton({ kind, id, label = "Supprimer", confirmText = "Confirmer la suppression définitive ?" }: { kind: string; id: string; label?: string; confirmText?: string }) {
  return (
    <form action={deleteAction} onSubmit={(e) => { if (!confirm(confirmText)) e.preventDefault(); }}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"> {label}
      </button>
    </form>
  );
}
