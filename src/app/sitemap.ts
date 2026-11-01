import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listArticles, publishedThemes, upcomingEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl();
  const [articles, events, themes] = await Promise.all([
    listArticles({ take: 5000 }).then((r) => r.items),
    upcomingEvents(5000),
    publishedThemes(),
  ]);
  const statics = ["", "/le-candidat", "/notre-vision", "/programme", "/actualites", "/agenda", "/galerie", "/contact", "/rejoindre", "/faire-un-don", "/transparence"];
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...themes.map((t) => ({ url: `${base}/programme/${t.slug}`, lastModified: t.updatedAt })),
    ...articles.map((a) => ({ url: `${base}/actualites/${a.slug}`, lastModified: a.updatedAt })),
    ...events.map((e) => ({ url: `${base}/agenda/${e.slug}`, lastModified: e.updatedAt })),
  ];
}
