"use client";

import CatchesMap from "@/components/CatchesMap";
import { listCatches } from "@/lib/api";
import { Catch } from "@anglog/shared";
import { useEffect, useState } from "react";

export default function CatchesMapPage() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listCatches()
      .then((page) => setCatches(page.items))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <h1 className="text-xl font-bold tracking-tight">釣果マップ</h1>
      {loaded ? (
        <div className="overflow-hidden rounded-2xl border">
          <CatchesMap catches={catches} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">読み込み中…</p>
      )}
    </main>
  )
}