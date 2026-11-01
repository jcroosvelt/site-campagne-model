import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import { SECTIONS } from "@/lib/settings-schema";
import { AdminHeader } from "@/components/admin/ui";

export const metadata = { title: "Contenus du site" };
const EDITABLE = ["site", "home", "candidate", "contact", "navigation", "seo", "legal"] as const;
const DESCRIPTIONS: Record<string, string> = {
  site: "Nom du candidat, slogan, message principal, photo officielle.",
  home: "Message du candidat, vision, participation, soutien, newsletter.",
  candidate: "Biographie, parcours, engagements, réalisations, message personnel.",
  contact: "Coordonnées officielles et liens vers les réseaux sociaux.",
  navigation: "Ordre, libellés et visibilité des liens du menu.",
  seo: "Titre, description, image de partage, indexation.",
  legal: "Mentions légales, confidentialité, conditions de contribution.",
};

export default async function ContentIndex() {
  const user = await requireUser("content.manage");
  return (
    <>
      <AdminHeader title="Contenus du site" description="Tous les textes sont modifiables en français, créole haïtien et anglais." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {EDITABLE.filter((k) => can(user.role, SECTIONS[k].permission as Permission)).map((k) => (
          <li key={k}>
            <Link href={`/admin/contenus/${k}`} className="block h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-navy-700">
              <p className="font-semibold text-navy-900">{SECTIONS[k].title}</p>
              <p className="mt-1 text-sm text-slate-500">{DESCRIPTIONS[k]}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
