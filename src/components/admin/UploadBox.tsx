"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageInput } from "./JsonForm";

export function UploadBox() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  return (
    <div>
      <p className="mb-3 text-sm font-medium">Téléverser un fichier</p>
      <ImageInput value={url} onChange={(v) => { setUrl(v); router.refresh(); }} accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" />
    </div>
  );
}
