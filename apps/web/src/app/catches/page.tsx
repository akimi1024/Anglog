"use client";

import { listCatches } from "@/lib/api";
import { Catch } from "@anglog/shared";
import { useEffect, useState } from "react";
import Link from "next/link";

const methodLabel: Record<string, string> = {
  lure: "ルアー",
  bite: "エサ",
  fly: "フライ",
  other: "その他"
}

export default function CatchesPage() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCatches()
      .then((page) => setCatches(page.items))
      .catch((err) => setError(err instanceof Error ? err.message : "一覧取得に失敗しました"));
  }, []);

  return (
    <main className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center md-4">
        <h1 className="text-xl font bold">釣果一覧</h1>
        <Link href="/catches/new" className="text-blue-600 underline">+ 記録</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <ul className="flex flex-col gap-3">
        {catches.map((c) => (
          <li key={c.catchId} className="border p-3 rounded">
            <div className="font-bold">{c.species}</div>
            <div className="text-sm text-gray-600">
              {methodLabel[c.method]}
              {c.size ? `/${c.size}cm` : ""}
              {c.count ? `/${c.count}尾` : ""}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(c.caughtAt).toLocaleString("ja-JP")}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}