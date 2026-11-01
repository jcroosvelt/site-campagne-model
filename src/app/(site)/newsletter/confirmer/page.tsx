import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/Section";
import Link from "next/link";

export const metadata = { robots: { index: false } };

export default async function ConfirmNewsletter({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { t } = await getDictionary();
  const { token } = await searchParams;
  let ok = false;
  if (token && token.length >= 20) {
    const res = await prisma.newsletterSubscriber.updateMany({ where: { token, status: "PENDING" }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
    ok = res.count === 1 || (await prisma.newsletterSubscriber.count({ where: { token, status: "CONFIRMED" } })) === 1;
  }
  return (
    <>
      <PageHeader title={t.home.newsletterKicker} intro={ok ? t.newsletter.confirmed : t.newsletter.invalidToken} />
      <div className="container-site py-16">
        <Link href="/" className="btn btn-primary mt-6">{t.notFound.home}</Link>
      </div>
    </>
  );
}
