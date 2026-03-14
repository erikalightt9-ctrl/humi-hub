import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";
import { KB_CATEGORIES } from "@/lib/constants/communications";

export const metadata: Metadata = {
  title: "Help Center | HUMI Training Center",
  description: "Find answers to common questions about HUMI Training Center.",
};

interface Article {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: string;
}

export default async function PublicHelpPage() {
  let articles: Article[] = [];
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/knowledge-base`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) {
      articles = Array.isArray(data.data) ? data.data : data.data?.data ?? [];
    }
  } catch { /* ignore */ }

  const grouped = KB_CATEGORIES.map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category === cat.value),
  })).filter((g) => g.articles.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mb-4">
          <HelpCircle className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-500 mt-2">
          Find answers to common questions about our training programs
        </p>
      </div>

      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No articles available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grouped.map((group) => (
            <div key={group.value} className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-4">{group.label}</h2>
              <ul className="space-y-2">
                {group.articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/help/${article.slug}`}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
