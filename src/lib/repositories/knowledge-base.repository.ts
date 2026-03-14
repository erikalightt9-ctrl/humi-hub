import type { KBCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Interfaces                                                         */
/* ------------------------------------------------------------------ */

interface CreateArticleData {
  readonly title: string;
  readonly content: string;
  readonly category: KBCategory;
  readonly isPublished?: boolean;
  readonly order?: number;
  readonly createdBy: string;
}

interface UpdateArticleData {
  readonly title?: string;
  readonly content?: string;
  readonly category?: KBCategory;
  readonly isPublished?: boolean;
  readonly order?: number;
}

/* ------------------------------------------------------------------ */
/*  Slug Generation                                                    */
/* ------------------------------------------------------------------ */

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const existing = await prisma.knowledgeBaseArticle.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });
  if (!existing) return baseSlug;

  const suffix = crypto.randomUUID().slice(0, 6);
  return `${baseSlug}-${suffix}`;
}

/* ------------------------------------------------------------------ */
/*  CRUD                                                               */
/* ------------------------------------------------------------------ */

export async function createArticle(data: CreateArticleData) {
  const slug = await ensureUniqueSlug(generateSlug(data.title));

  return prisma.knowledgeBaseArticle.create({
    data: {
      slug,
      title: data.title,
      content: data.content,
      category: data.category,
      isPublished: data.isPublished ?? false,
      order: data.order ?? 0,
      createdBy: data.createdBy,
    },
  });
}

export async function updateArticle(id: string, data: UpdateArticleData) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
  if (data.order !== undefined) updateData.order = data.order;

  return prisma.knowledgeBaseArticle.update({
    where: { id },
    data: updateData,
  });
}

export async function findArticleBySlug(slug: string) {
  return prisma.knowledgeBaseArticle.findUnique({
    where: { slug },
  });
}

export async function findArticles(
  filters: {
    readonly category?: KBCategory;
    readonly isPublished?: boolean;
    readonly page?: number;
    readonly limit?: number;
  } = {}
) {
  const { category, isPublished, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (isPublished !== undefined) where.isPublished = isPublished;

  const [articles, total] = await Promise.all([
    prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }, { title: "asc" }],
      skip,
      take: limit,
    }),
    prisma.knowledgeBaseArticle.count({ where }),
  ]);

  return {
    data: articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function searchArticles(query: string, publishedOnly = true) {
  const where: Record<string, unknown> = {
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ],
  };
  if (publishedOnly) where.isPublished = true;

  return prisma.knowledgeBaseArticle.findMany({
    where,
    orderBy: { title: "asc" },
    take: 20,
  });
}

export async function deleteArticle(id: string) {
  return prisma.knowledgeBaseArticle.delete({ where: { id } });
}

export async function findAllPublished() {
  return prisma.knowledgeBaseArticle.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      category: true,
    },
  });
}
