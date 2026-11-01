"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";

export type GalleryItem = { id: string; type: "PHOTO" | "VIDEO"; title: string; image: string | null; embed: string | null; category: string };

export function GalleryGrid({ items, labels }: { items: GalleryItem[]; labels: { close: string; previous: string; next: string; open: string } }) {
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : items[index];
  const go = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((it, i) => (
          <li key={it.id} className="mb-4 break-inside-avoid">
            <button type="button" onClick={() => setIndex(i)} className="group relative block w-full overflow-hidden bg-navy-100 text-left" aria-label={`${labels.open} : ${it.title}`}>
              {it.image ? (
                <Image src={it.image} alt={it.title} width={800} height={600} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="h-auto w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]" />
              ) : (
                <div className="aspect-video w-full bg-navy-800" />
              )}
              {it.type === "VIDEO" && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-lg transition-transform group-hover:scale-110"><Play className="ml-1 h-5 w-5" fill="currentColor" aria-hidden /></span>
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent p-4 pt-12">
                <span className="block text-sm font-bold text-gold-300">{it.category}</span>
                <span className="mt-1 block text-sm font-medium text-white">{it.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={index !== null} onOpenChange={(o) => !o && setIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/95" />
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col focus:outline-none" aria-describedby={undefined}>
            <div className="flex items-center justify-between p-4 text-white">
              <Dialog.Title className="truncate pr-4 text-sm font-medium">{current?.title}</Dialog.Title>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/50">{index !== null ? `${index + 1} / ${items.length}` : ""}</span>
                <Dialog.Close className="flex h-11 w-11 items-center justify-center text-white/80 hover:text-white" aria-label={labels.close}><X className="h-6 w-6" /></Dialog.Close>
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-8 sm:px-20">
              {current?.type === "VIDEO" && current.embed ? (
                <div className="relative aspect-video w-full max-w-5xl">
                  <iframe key={current.id} src={`${current.embed}?autoplay=1`} title={current.title} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" />
                </div>
              ) : current?.image ? (
                <div className="relative h-full max-h-[80vh] w-full max-w-6xl">
                  <Image key={current.id} src={current.image} alt={current.title} fill sizes="100vw" className="object-contain" />
                </div>
              ) : null}
              {items.length > 1 && (
                <>
                  <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white sm:left-6" aria-label={labels.previous}><ChevronLeft className="h-8 w-8" /></button>
                  <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white sm:right-6" aria-label={labels.next}><ChevronRight className="h-8 w-8" /></button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
