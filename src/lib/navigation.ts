import "server-only";
import { getSetting } from "./settings";
import { localize, type Locale, type Dictionary } from "./i18n";

export const NAV_ROUTES: Record<string, { href: string; labelKey: keyof Dictionary["nav"] }> = {
  home: { href: "/", labelKey: "home" },
  candidate: { href: "/le-candidat", labelKey: "candidate" },
  vision: { href: "/notre-vision", labelKey: "vision" },
  program: { href: "/programme", labelKey: "program" },
  news: { href: "/actualites", labelKey: "news" },
  agenda: { href: "/agenda", labelKey: "agenda" },
  gallery: { href: "/galerie", labelKey: "gallery" },
  contact: { href: "/contact", labelKey: "contact" },
};

export type NavLink = { href: string; label: string };

export async function getNavigation(locale: Locale, t: Dictionary): Promise<NavLink[]> {
  const nav = await getSetting("navigation");
  return nav.items
    .filter((i) => i.visible)
    .map((i) => {
      const route = NAV_ROUTES[i.key];
      const custom = localize(i.label, locale);
      if (i.key === "custom") return i.href && custom ? { href: i.href, label: custom } : null;
      if (!route) return null;
      return { href: route.href, label: custom || (t.nav[route.labelKey] as string) };
    })
    .filter((x): x is NavLink => x !== null);
}
