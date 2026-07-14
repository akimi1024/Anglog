"use client";

import MapView from "@/components/MapView";
import { createCatch } from "@/lib/api";
import { CreateCatchInput, FishingMethod, GeoPoint } from "@anglog/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCatchPage() {
  const router = useRouter();
  const [species, setSpecies] = useState("");
  const [method, setMethod] = useState<FishingMethod>("lure");
  const [caughtAt, setCaughtAt] = useState("");
  const [size, setSize] = useState("");
  const [count, setCount] = useState("");
  const [tackle, setTackle] = useState("");
  const [reel, setReel] = useState("");
  const [areaName, setAreaName] = useState("");
  const [memo, setMemo] = useState("");
  const [location, setLocation] = useState<GeoPoint | null>(null)
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    try {
      const input: CreateCatchInput = {
        species,
        method,
        caughtAt: new Date(caughtAt).toISOString(),
        size: size ? Number(size) : undefined,
        count: count ? Number(count) : undefined,
        tackle: tackle || undefined,
        reel: reel || undefined,
        areaName: areaName || undefined,
        memo: memo || undefined,
        imageKeys: [],
        isPublic: true,
        location: location ?? undefined,
      };
      await createCatch(input);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    }
  }

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">釣果を記録</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input placeholder="魚種" value={species} required
          onChange={(e) => setSpecies(e.target.value)} className="border p-2 rounded" />

        <select value={method} onChange={(e) => setMethod(e.target.value as FishingMethod)} className="border p-2 rounded">
          <option value="lure">ルアー</option>
          <option value="bait">エサ</option>
          <option value="fly">フライ</option>
          <option value="other">その他</option>
        </select>

        <label className="text-sm text-gray-600">釣行日時
          <input type="datetime-local" value={caughtAt} required
            onChange={(e) => setCaughtAt(e.target.value)} className="border p-2 rounded w-full" />
        </label>

        <input type="number" min="0" placeholder="サイズ(cm)" value={size}
          onChange={(e) => setSize(e.target.value)} className="border p-2 rounded" />
        <input type="number" min="1" step="1" placeholder="数(尾)" value={count}
          onChange={(e) => setCount(e.target.value)} className="border p-2 rounded" />
        <input placeholder="タックル" value={tackle}
          onChange={(e) => setTackle(e.target.value)} className="border p-2 rounded" />
        <input placeholder="リール" value={reel}
          onChange={(e) => setReel(e.target.value)} className="border p-2 rounded" />
        <input placeholder="エリア" value={areaName}
          onChange={(e) => setAreaName(e.target.value)} className="border p-2 rounded" />
        <input placeholder="メモ" value={memo}
          onChange={(e) => setMemo(e.target.value)} className="border p-2 rounded" />
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">釣り場（地図をタップ）</span>
          <MapView onPick={setLocation} />
          {location && (
            <span className="text-xs text-gray-500">
              緯度{location.lat.toFixed(5)} / 経度{location.lon.toFixed(5)}
            </span>
          )}
        </div>

        <button type="submit" className="bg-blue-600 text-white p-2 rounded">記録する</button>
      </form>
    </main>
  )
}