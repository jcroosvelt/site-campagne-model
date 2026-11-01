import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getNavigation } from "@/lib/navigation";
import { getSetting } from "@/lib/settings";
import { SOCIAL_ICONS, type SocialKey } from "@/components/ui/icons";

export async function Footer() {
  const { t, l, locale } = await getDictionary();
  const [links, site, contact] = await Promise.all([getNavigation(locale, t), getSetting("site"), getSetting("contact")]);
  const socials = (["facebook", "instagram", "x", "youtube", "tiktok", "linkedin"] as SocialKey[]).filter((k) => (contact as Record<string, unknown>)[k]);
  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="h-1 bg-crimson-600"><div className="h-full w-24 bg-gold-500" /></div>
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="font-serif text-2xl font-semibold text-white">{site.campaignName}</p>
          <p className="mt-3 font-serif text-lg italic text-gold-300">{l(site.slogan)}</p>
          {socials.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer.follow}</p>
              <ul className="flex flex-wrap gap-2">
                {socials.map((k) => {
                  const Icon = SOCIAL_ICONS[k];
                  return (
                    <li key={k}>
                      <a
                        href={String((contact as Record<string, unknown>)[k])}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={k}
                        className="flex h-10 w-10 items-center justify-center border border-white/15 text-white/70 transition-colors hover:border-gold-500 hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <nav aria-label={t.footer.about} className="lg:col-span-2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer.about}</p>
          <ul className="space-y-2.5 text-sm">
            {links.map((x) => (
              <li key={x.href}><Link className="link-underline hover:text-white" href={x.href}>{x.label}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.footer.participate} className="lg:col-span-3">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer.participate}</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="link-underline hover:text-white" href="/rejoindre">{t.home.volunteer}</Link></li>
            <li><Link className="link-underline hover:text-white" href="/faire-un-don">{t.nav.donate}</Link></li>
            <li><Link className="link-underline hover:text-white" href="/transparence">{t.footer.transparency}</Link></li>
            <li><Link className="link-underline hover:text-white" href="/agenda">{t.nav.agenda}</Link></li>
          </ul>
          <p className="mb-4 mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer.legal}</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="link-underline hover:text-white" href="/mentions-legales">{t.footer.mentions}</Link></li>
            <li><Link className="link-underline hover:text-white" href="/confidentialite">{t.footer.privacy}</Link></li>
            <li><Link className="link-underline hover:text-white" href="/conditions-de-contribution">{t.footer.terms}</Link></li>
          </ul>
        </nav>
        <address className="not-italic lg:col-span-3">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.contact.officialInfo}</p>
          <ul className="space-y-3 text-sm">
            {contact.address && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden /><span className="whitespace-pre-line">{contact.address}</span></li>}
            {contact.email && <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden /><a className="hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
            {contact.phone && <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden /><a className="hover:text-white" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>}
          </ul>
        </address>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.legalEntity.replace("[À COMPLÉTER] ", "")}. {t.footer.rights} {t.footer.paidFor}</p>
          <Link href="/admin" className="hover:text-white/80" rel="nofollow">{t.footer.admin}</Link>
        </div>
      </div>
    </footer>
  );
}
