"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
        scrolled ? "bg-white shadow-[0_10px_30px_-20px_rgb(10_20_64/0.5)]" : "bg-transparent",
      )}
    >
      <div className="container-site flex h-20 items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3" aria-label={brand.name}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" className="h-10 w-auto" />
          ) : (
            <span className="flex h-9 w-9 flex-col overflow-hidden rounded-lg ring-2 ring-white" aria-hidden>
              <span className="flex-1 bg-flag" />
              <span className="flex-1 bg-crimson-600" />
            </span>
          )}
          <span className="flex flex-col leading-none">
            <span className={cn("text-[1.15rem] font-extrabold tracking-tight transition-colors semi-condensed", scrolled ? "text-navy-900" : "text-white")}>{brand.name}</span>
            <span className={cn("mt-1 text-[0.75rem] font-medium transition-colors", scrolled ? "text-muted" : "text-white/70")}>{brand.tagline}</span>
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
                    "rounded-full px-3 py-2 text-[0.9rem] font-semibold whitespace-nowrap transition-colors",
                    scrolled ? "text-navy-900/75 hover:bg-navy-50 hover:text-navy-900" : "text-white/80 hover:bg-white/10 hover:text-white",
                    isActive(l.href) && (scrolled ? "bg-navy-50 text-flag" : "bg-white/15 text-white"),
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
          <Link href="/faire-un-don" className="btn btn-donate btn-sm hidden whitespace-nowrap sm:inline-flex"> {labels.donate}
          </Link>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              className={cn("inline-flex h-11 items-center rounded-full px-4 text-sm font-bold ring-2 xl:hidden", scrolled ? "ring-navy-900/20" : "ring-white/40", scrolled ? "text-navy-900" : "text-white")}
              aria-label={labels.menu}
            >
              {labels.menu}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/70" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-flag text-white shadow-2xl focus:outline-none">
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                  <Dialog.Title className="text-lg font-extrabold text-white">{brand.name}</Dialog.Title>
                  <Dialog.Close className="inline-flex h-11 items-center rounded-full px-4 text-sm font-bold text-white ring-2 ring-white/40 hover:bg-white hover:text-flag">{labels.close}</Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">{labels.menu}</Dialog.Description>
                <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto px-6 py-6">
                  <ul className="space-y-1">
                    {links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          aria-current={isActive(l.href) ? "page" : undefined}
                          className="flex items-center justify-between border-b border-white/10 py-3 text-[2rem] leading-tight font-extrabold text-white/85 condensed hover:text-white aria-[current=page]:text-gold-300"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="space-y-5 bg-crimson-600 p-6">
                  <LocaleSwitcher locale={locale} label={labels.language} light />
                  <Link href="/faire-un-don" className="btn btn-donate w-full"> {labels.donate}
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
