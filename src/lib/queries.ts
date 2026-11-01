import "server-only";
import type { MediaCategory, MediaType, Prisma } from "@prisma/client";
import { prisma } from "./db";

/** Articles visibles publiquement : publiés ET date de publication atteinte (publication programmée). */
export function publishedArticleWhere(extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...extra };
}

export async function listArticles({ category, page = 1, take = 9 }: { category?: string; page?: number; take?: number }) {
  const where = publishedArticleWhere(category ? { category: { slug: category } } : {});
  const [items, total] = await Promise.all([
    prisma.article.findMany({ where, include: { category: true }, orderBy: { publishedAt: "desc" }, skip: (page - 1) * take, take }),
    prisma.article.count({ where }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / take)) };
}

export function upcomingEvents(take = 4) {
  return prisma.event.findMany({
    where: { published: true, OR: [{ endsAt: { gte: new Date() } }, { endsAt: null, startsAt: { gte: new Date(Date.now() - 6 * 3600 * 1000) } }] },
    orderBy: { startsAt: "asc" },
    take,
  });
}

export function pastEvents(take = 12) {
  return prisma.event.findMany({ where: { published: true, startsAt: { lt: new Date() } }, orderBy: { startsAt: "desc" }, take });
}

export function eventsBetween(from: Date, to: Date) {
  return prisma.event.findMany({ where: { published: true, startsAt: { gte: from, lt: to } }, orderBy: { startsAt: "asc" } });
}

export function publishedThemes() {
  return prisma.programTheme.findMany({ where: { published: true }, orderBy: { order: "asc" } });
}

export function galleryItems(filter: { type?: MediaType; category?: MediaCategory; take?: number } = {}) {
  return prisma.mediaItem.findMany({
    where: { published: true, type: filter.type, category: filter.category },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take: filter.take,
  });
}
