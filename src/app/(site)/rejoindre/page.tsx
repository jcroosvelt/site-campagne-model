import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSetting } from "@/lib/settings";
import { signTimestamp } from "@/lib/antispam";
import { PageHeader } from "@/components/ui/Section";
import { VolunteerForm } from "@/components/forms/VolunteerForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.contact.volunteerTitle };
}

export default async function JoinPage() {
  const { t, l } = await getDictionary();
  const home = await getSetting("home");
  return (
    <>
      <PageHeader kicker={t.home.participationKicker} title={t.contact.volunteerTitle} intro={l(home.participationBody)} />
      <section className="py-16 md:py-24">
        <div className="container-site grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-semibold">{l(home.participationTitle)}</h2>
            <p className="mt-4 leading-relaxed text-muted">{t.contact.volunteerIntro}</p>
            <ul className="mt-8 space-y-3 border-l-2 border-gold-500 pl-6 text-sm text-navy-900">
              {Object.values(t.volunteer.interestOptions).map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          <div className="lg:col-span-7 lg:col-start-6"><VolunteerForm t={t} ts={signTimestamp()} /></div>
        </div>
      </section>
    </>
  );
}
