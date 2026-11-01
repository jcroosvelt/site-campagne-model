import "server-only";
import type { MediaCategory, MediaType, Prisma } from "@prisma/client";
import { hasDatabase, prisma } from "./db";
import { demoArticles, demoCategories, demoEvents, demoThemes } from "./demo-content";

/** Articles visibles publiquement : publiés ET date de publication atteinte (publication programmée). */
export function publishedArticleWhere(extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...extra };
}

export async function listArticles({ category, page = 1, take = 9 }: { category?: string; page?: number; take?: number }) {
  if (!hasDatabase()) {
    const all = demoArticles().filter((a) => !category || a.category?.slug === category);
    return { items: all.slice((page - 1) * take, page * take), total: all.length, pages: Math.max(1, Math.ceil(all.length / take)) };
  }
  const where = publishedArticleWhere(category ? { category: { slug: category } } : {});
  const [items, total] = await Promise.all([
    prisma.article.findMany({ where, include: { category: true }, orderBy: { publishedAt: "desc" }, skip: (page - 1) * take, take }),
    prisma.article.count({ where }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / take)) };
}

export async function getArticle(slug: string) {
  if (!hasDatabase()) return demoArticles().find((a) => a.slug === slug) ?? null;
  return prisma.article.findFirst({ where: publishedArticleWhere({ slug }), include: { category: true } });
}

export async function relatedArticles(id: string, categoryId: string | null) {
  if (!hasDatabase()) return demoArticles().filter((a) => a.id !== id).slice(0, 3);
  return prisma.article.findMany({
    where: publishedArticleWhere({ id: { not: id }, ...(categoryId ? { categoryId } : {}) }),
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}

export async function listCategories() {
  if (!hasDatabase()) return demoCategories();
  return prisma.articleCategory.findMany({ orderBy: { order: "asc" } });
}

export async function upcomingEvents(take = 4) {
  if (!hasDatabase()) return demoEvents().slice(0, take);
  return prisma.event.findMany({
    where: { published: true, OR: [{ endsAt: { gte: new Date() } }, { endsAt: null, startsAt: { gte: new Date(Date.now() - 6 * 3600 * 1000) } }] },
    orderBy: { startsAt: "asc" },
    take,
  });
}

export async function pastEvents(take = 12) {
  if (!hasDatabase()) return [];
  return prisma.event.findMany({ where: { published: true, startsAt: { lt: new Date() } }, orderBy: { startsAt: "desc" }, take });
}

export async function eventsBetween(from: Date, to: Date) {
  if (!hasDatabase()) return demoEvents().filter((e) => e.startsAt >= from && e.startsAt < to);
  return prisma.event.findMany({ where: { published: true, startsAt: { gte: from, lt: to } }, orderBy: { startsAt: "asc" } });
}

export async function getEvent(slug: string) {
  if (!hasDatabase()) return demoEvents().find((e) => e.slug === slug) ?? null;
  return prisma.event.findFirst({ where: { slug, published: true } });
}

/** Places déjà réservées (inscrits + accompagnants). */
export async function seatsTaken(eventId: string) {
  if (!hasDatabase()) return 0;
  const agg = await prisma.eventRegistration.aggregate({ where: { eventId }, _count: true, _sum: { guests: true } });
  return agg._count + (agg._sum.guests ?? 0);
}

export async function publishedThemes() {
  if (!hasDatabase()) return demoThemes();
  return prisma.programTheme.findMany({ where: { published: true }, orderBy: { order: "asc" } });
}

export async function getTheme(slug: string) {
  if (!hasDatabase()) return demoThemes().find((t) => t.slug === slug) ?? null;
  return prisma.programTheme.findFirst({ where: { slug, published: true } });
}

export async function galleryItems(filter: { type?: MediaType; category?: MediaCategory; take?: number } = {}) {
  if (!hasDatabase()) return [];
  return prisma.mediaItem.findMany({
    where: { published: true, type: filter.type, category: filter.category },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take: filter.take,
  });
}

export async function publishedReports() {
  if (!hasDatabase()) return [];
  return prisma.financialReport.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
}
