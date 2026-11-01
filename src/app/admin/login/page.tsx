import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <p className="font-serif text-xl font-semibold">Espace administration</p>
        <div>
          <div className="mb-6 h-px w-16 bg-gold-500" />
          <p className="max-w-sm font-serif text-3xl leading-snug">Gestion sécurisée des contenus, de l&apos;agenda et des contributions de la campagne.</p>
        </div>
        <p className="text-xs text-white/50">Accès réservé aux personnes habilitées. Toutes les opérations sont journalisées.</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl font-semibold text-navy-900">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">Identifiez-vous pour accéder au tableau de bord.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
