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
    <main className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">釣果一覧</h1>
        <Link href="/catches/new" className="text-primary">+ 記録</Link>
      </div>
      {error && <p className="text-destructive mb-3">{error}</p>}
      <ul className="flex flex-col gap-3">
        {catches.map((c) => (
          <li key={c.catchId}>
            <CatchCard item={c} />
          </li>
        ))}
      </ul>
    </main>
  )
}