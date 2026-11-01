"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Heart, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/lib/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type { Locale } from "@/lib/i18n-shared";

type Props = {
  links: NavLink[];
  brand: { name: string; tagline: string; logoUrl?: string };
  labels: { donate: string; menu: string; close: string; language: string };
  locale: Locale;
};

export function HeaderShell({ links, brand, labels, locale }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out-soft",
        scrolled ? "bg-white/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="container-site flex h-20 items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3" aria-label={brand.name}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" className="h-10 w-auto" />
          ) : (
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center border font-serif text-lg font-semibold transition-colors",
                scrolled ? "border-navy-900 text-navy-900" : "border-white/70 text-white",
              )}
              aria-hidden
            >
              {brand.name.split(/\s+/).filter((w) => w.length > 3).map((w) => w[0]).slice(0, 2).join("") || brand.name[0]}
            </span>
          )}
          <span className="flex flex-col leading-tight">
            <span className={cn("font-serif text-[1.05rem] font-semibold transition-colors", scrolled ? "text-navy-900" : "text-white")}>{brand.name}</span>
            <span className={cn("text-[0.68rem] uppercase tracking-[0.18em] transition-colors", scrolled ? "text-muted" : "text-white/60")}>{brand.tagline}</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden xl:block">
          <ul className="flex items-center">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cn(
                    "relative px-2.5 py-2 text-[0.84rem] font-medium whitespace-nowrap transition-colors",
                    scrolled ? "text-navy-900/80 hover:text-navy-900" : "text-white/80 hover:text-white",
                    "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold-500 after:transition-transform after:duration-300 aria-[current=page]:after:scale-x-100",
                    isActive(l.href) && (scrolled ? "text-navy-900" : "text-white"),
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LocaleSwitcher locale={locale} label={labels.language} light={!scrolled} />
          </div>
          <Link href="/faire-un-don" className="btn btn-donate btn-sm hidden whitespace-nowrap sm:inline-flex">
            <Heart className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
            {labels.donate}
          </Link>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              className={cn("inline-flex h-11 w-11 items-center justify-center xl:hidden", scrolled ? "text-navy-900" : "text-white")}
              aria-label={labels.menu}
            >
              <Menu className="h-6 w-6" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm data-[state=open]:animate-[rise_.3s_ease-out]" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-navy-900 text-white shadow-2xl focus:outline-none">
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                  <Dialog.Title className="font-serif text-lg text-white">{brand.name}</Dialog.Title>
                  <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center text-white/80 hover:text-white" aria-label={labels.close}>
                    <X className="h-6 w-6" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">{labels.menu}</Dialog.Description>
                <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto px-6 py-6">
                  <ul className="space-y-1">
                    {links.map((l, i) => (
                      <li key={l.href} className="animate-rise" style={{ animationDelay: `${i * 35}ms` }}>
                        <Link
                          href={l.href}
                          aria-current={isActive(l.href) ? "page" : undefined}
                          className="flex items-center justify-between border-b border-white/5 py-3.5 font-serif text-2xl text-white/85 hover:text-white aria-[current=page]:text-gold-300"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="space-y-5 border-t border-white/10 p-6">
                  <LocaleSwitcher locale={locale} label={labels.language} light />
                  <Link href="/faire-un-don" className="btn btn-donate w-full">
                    <Heart className="h-4 w-4" fill="currentColor" aria-hidden />
                    {labels.donate}
                  </Link>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
