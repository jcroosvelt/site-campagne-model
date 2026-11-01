import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { publishedArticleWhere } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl();
  const [articles, events, themes] = await Promise.all([
    prisma.article.findMany({ where: publishedArticleWhere(), select: { slug: true, updatedAt: true } }),
    prisma.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.programTheme.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const statics = ["", "/le-candidat", "/notre-vision", "/programme", "/actualites", "/agenda", "/galerie", "/contact", "/rejoindre", "/faire-un-don", "/transparence"];
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...themes.map((t) => ({ url: `${base}/programme/${t.slug}`, lastModified: t.updatedAt })),
    ...articles.map((a) => ({ url: `${base}/actualites/${a.slug}`, lastModified: a.updatedAt })),
    ...events.map((e) => ({ url: `${base}/agenda/${e.slug}`, lastModified: e.updatedAt })),
  ];
}
