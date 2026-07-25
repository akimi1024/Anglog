"use client";

import { listCatches } from "@/lib/api";
import { Catch } from "@anglog/shared";
import { useEffect, useState } from "react";
import Link from "next/link";
import CatchCard from "@/components/CatchCard";


export default function CatchesPage() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCatches()
      .then((page) => setCatches(page.items))
      .catch((err) => setError(err instanceof Error ? err.message : "一覧取得に失敗しました"));
  }, []);

  return (
    <main className="px-12 sm:px-16 lg:px-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">釣果一覧</h1>
        <Link href="/catches/new" className="text-primary">+ 記録</Link>
      </div>
      {error && <p className="text-destructive mb-3">{error}</p>}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {catches.map((c) => (
          <li key={c.catchId}>
            <CatchCard item={c} />
          </li>
        ))}
      </ul>
    </main>
  )
}