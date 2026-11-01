import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { signTimestamp } from "@/lib/antispam";
import { PageHeader } from "@/components/ui/Section";
import { ContactForm } from "@/components/forms/ContactForm";
import { SOCIAL_ICONS, type SocialKey } from "@/components/ui/icons";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.contact.title };
}

export default async function ContactPage() {
  const { t, l } = await getDictionary();
  const c = await getSetting("contact");
  const socials = (["facebook", "instagram", "x", "youtube", "tiktok", "linkedin"] as SocialKey[]).filter((k) => (c as Record<string, unknown>)[k]);
  return (
    <>
      <PageHeader kicker={t.nav.contact} title={t.contact.title} intro={t.contact.intro} />
      <section className="py-16 md:py-24">
        <div className="container-site grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7"><ContactForm t={t} ts={signTimestamp()} /></div>
          <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
            <div>
              <h2 className="text-xl font-semibold">{t.contact.officialInfo}</h2>
              <ul className="mt-6 space-y-5 text-[0.95rem]">
                {c.address && <li className="flex gap-4"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden /><span className="whitespace-pre-line">{c.address}</span></li>}
                {c.email && <li className="flex gap-4"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden /><a href={`mailto:${c.email}`} className="text-navy-900 underline decoration-gold-500 underline-offset-4">{c.email}</a></li>}
                {c.phone && <li className="flex gap-4"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden /><a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></li>}
                {c.whatsapp && <li className="flex gap-4"><SOCIAL_ICONS.whatsapp className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" /><a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
                <li className="flex gap-4"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden /><span>{l(c.hours)}</span></li>
              </ul>
            </div>
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {socials.map((k) => {
                  const Icon = SOCIAL_ICONS[k];
                  return <li key={k}><a href={String((c as Record<string, unknown>)[k])} target="_blank" rel="noopener noreferrer" aria-label={k} className="flex h-11 w-11 items-center justify-center border border-line text-navy-900 hover:border-navy-900 hover:bg-navy-900 hover:text-white"><Icon className="h-4 w-4" /></a></li>;
                })}
              </ul>
            )}
            <div className="bg-navy-900 p-8 text-white">
              <h2 className="text-xl font-semibold text-white">{t.contact.volunteerTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{t.contact.volunteerIntro}</p>
              <Link href="/rejoindre" className="btn btn-light btn-sm mt-6">{t.home.volunteer} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
