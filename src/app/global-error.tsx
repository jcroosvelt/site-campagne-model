"use client";

/** Erreur dans la mise en page racine : page autonome, sans dépendance au reste du site. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b1f3a", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36 }}>Site momentanément indisponible</h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
            Le site n&apos;a pas pu démarrer. Si vous êtes administrateur : vérifiez que les variables d&apos;environnement
            DATABASE_URL et APP_SECRET sont définies sur l&apos;hébergement, puis redéployez.
          </p>
          {error.digest && <p style={{ opacity: 0.5, fontSize: 13 }}>Référence : {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
