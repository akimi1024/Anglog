"use client";

import CatchCard from "@/components/CatchCard";
import { listMyCatches } from "@/lib/api";
import { methodToLabel } from "@/lib/catch";
import { Catch } from "@anglog/shared";
import Link from "next/link";
import { useEffect, useState } from "react";


export default function MyPage() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyCatches()
      .then((page) => setCatches(page.items))
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"));
  }, []);

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">自分の釣果</h1>
      {error && (<p className="text-red-600 mb-3">{error} (<Link href="/login" className="underline">ログイン</Link>)</p>)}
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