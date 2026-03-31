import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { KB_CATEGORIES } from "@/lib/constants/communications";

export const metadata: Metadata = { title: "Help Center | Humi Hub Student" };

interface Article {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: string;
}

export default async function StudentHelpPage() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-500 text-sm mt-1">
          Find answers to common questions
        </p>
      </div>

      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No articles available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grouped.map((group) => (
            <div key={group.value} className="bg-white rounded-xl shadow p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                {group.label}
              </h2>
              <ul className="space-y-2">
                {group.articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/student/help/${article.slug}`}
                      className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
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
