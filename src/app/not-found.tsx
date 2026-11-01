import Link from "next/link";
import { getDictionary } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <main className="flex min-h-screen items-center bg-navy-900 text-white">
      <div className="container-site">
        <p className="font-serif text-8xl font-semibold text-gold-500/50">404</p>
        <h1 className="mt-6 font-serif text-4xl font-semibold text-white">{t.notFound.title}</h1>
        <p className="mt-4 text-white/70">{t.notFound.text}</p>
        <Link href="/" className="btn btn-light mt-10">{t.notFound.home}</Link>
      </div>
    </main>
  );
}
