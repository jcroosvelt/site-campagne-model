"use client";

/** Erreur d'exécution d'une page (ex. base de données injoignable). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center bg-navy-900 text-white">
      <div className="container-site max-w-2xl">
        <p className="kicker kicker-light mb-6">Service momentanément indisponible</p>
        <h1 className="font-serif text-4xl font-semibold text-white">Une erreur est survenue</h1>
        <p className="mt-4 text-white/70">
          Le site rencontre un problème technique. Veuillez réessayer dans quelques instants.
        </p>
        <p className="mt-2 text-sm text-white/50">
          Administrateurs : vérifiez la configuration de la base de données (DATABASE_URL) et les journaux du serveur.
          {error.digest ? ` Référence : ${error.digest}` : ""}
        </p>
        <button type="button" onClick={reset} className="btn btn-light mt-10">Réessayer</button>
      </div>
    </main>
  );
}
