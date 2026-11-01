import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { LegalPage } from "@/components/site/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.legal.terms };
}

export default async function Page() {
  const { t } = await getDictionary();
  return <LegalPage field="terms" title={t.legal.terms} />;
}
