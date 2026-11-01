import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["fr", "ht", "en"];

/**
 * - En-têtes de sécurité, dont une Content-Security-Policy avec nonce.
 * - Redirection vers la connexion pour /admin sans cookie de session (la vérification complète
 *   de la session et des rôles est faite côté serveur dans chaque page / action).
 * - ?lang=xx : change la langue (cookie) puis redirige vers l'URL propre.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const lang = searchParams.get("lang");
  if (lang && LOCALES.includes(lang)) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("lang");
    const res = NextResponse.redirect(url);
    res.cookies.set("locale", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !req.cookies.get("cmp_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const storage = process.env.SUPABASE_URL ? ` ${process.env.SUPABASE_URL}` : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://i.ytimg.com${storage}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
    "form-action 'self' https://checkout.stripe.com https://*.digicelgroup.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  if (pathname.startsWith("/admin")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: [{ source: "/((?!api|_next/static|_next/image|uploads|favicon.ico|robots.txt|sitemap.xml).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
