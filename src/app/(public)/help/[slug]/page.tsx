import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { KB_CATEGORIES } from "@/lib/constants/communications";

interface Article {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly category: string;
  readonly updatedAt: string;
}

export const metadata: Metadata = {
  title: "Help Article | HUMI Training Center",
};

export default async function PublicHelpArticlePage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let article: Article | null = null;

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/knowledge-base/${slug}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) article = data.data;
  } catch { /* ignore */ }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Article not found</p>
        <Link
          href="/help"
          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
        >
          Back to Help Center
        </Link>
      </div>
    );
  }

  const categoryLabel =
    KB_CATEGORIES.find((c) => c.value === article.category)?.label ??
    article.category;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
      <Link
        href="/help"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Help Center
      </Link>

      <div className="bg-white rounded-xl shadow p-8">
        <div className="mb-6">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {article.title}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Updated{" "}
            {new Date(article.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {article.content}
        </div>
      </div>
    </div>
  );
}
