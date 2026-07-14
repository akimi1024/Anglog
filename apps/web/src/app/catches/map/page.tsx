"use client";

import CatchesMap from "@/components/CatchesMap";
import { listCatches } from "@/lib/api";
import { Catch } from "@anglog/shared";
import { useEffect, useState } from "react";

export default function CatchesMapPage(){
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listCatches()
     .then((page) => setCatches(page.items))
     .finally(() => setLoaded(true));
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <h1 className="text-xl font-bold mb-4">釣果マップ</h1>
      {loaded && <CatchesMap catches={catches}/>}
    </main>
  )
}