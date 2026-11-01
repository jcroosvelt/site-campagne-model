import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/Section";
import { FinancialReports, UsageCategories } from "@/components/site/TransparencyBlocks";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.transparency.title };
}

export default async function TransparencyPage() {
  const { t } = await getDictionary();
  return (
    <>
      <PageHeader kicker={t.footer.transparency} title={t.transparency.title} intro={t.transparency.intro}>
        <Link href="/faire-un-don" className="btn btn-donate"><Heart className="h-4 w-4" fill="currentColor" aria-hidden /> {t.nav.donate}</Link>
      </PageHeader>
      <section className="py-20"><div className="container-site"><UsageCategories /></div></section>
      <section className="bg-ivory py-20"><div className="container-site max-w-4xl"><FinancialReports /></div></section>
    </>
  );
}
