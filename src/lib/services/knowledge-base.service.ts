import type { KBCategory } from "@prisma/client";
import * as kbRepo from "@/lib/repositories/knowledge-base.repository";

export async function createArticle(data: {
  readonly title: string;
  readonly content: string;
  readonly category: KBCategory;
  readonly isPublished?: boolean;
  readonly order?: number;
  readonly createdBy: string;
}) {
  return kbRepo.createArticle(data);
}

export async function updateArticle(
  id: string,
  data: {
    readonly title?: string;
    readonly content?: string;
    readonly category?: KBCategory;
    readonly isPublished?: boolean;
    readonly order?: number;
  }
) {
  return kbRepo.updateArticle(id, data);
}

export async function getArticleBySlug(slug: string) {
  return kbRepo.findArticleBySlug(slug);
}

export async function getArticles(filters: {
  readonly category?: KBCategory;
  readonly isPublished?: boolean;
  readonly page?: number;
  readonly limit?: number;
}) {
  return kbRepo.findArticles(filters);
}

export async function searchArticles(query: string, publishedOnly = true) {
  return kbRepo.searchArticles(query, publishedOnly);
}

export async function deleteArticle(id: string) {
  return kbRepo.deleteArticle(id);
}

export async function getAllPublishedForAI() {
  return kbRepo.findAllPublished();
}
