import Link from "next/link";
import { hasDatabase, prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/Section";

export const metadata = { robots: { index: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { t } = await getDictionary();
  const { token } = await searchParams;
  const res = hasDatabase() && token && token.length >= 20 ? await prisma.newsletterSubscriber.updateMany({ where: { token }, data: { status: "UNSUBSCRIBED" } }) : { count: 0 };
  return (
    <>
      <PageHeader title={t.home.newsletterKicker} intro={res.count ? t.newsletter.unsubscribed : t.newsletter.invalidToken} />
      <div className="container-site py-16"><Link href="/" className="btn btn-primary">{t.notFound.home}</Link></div>
    </>
  );
}
