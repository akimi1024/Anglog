"use client";

import MapView from "@/components/MapView";
import { getCatch, updateCatch } from "@/lib/api";
import { toHalfWidthNumber } from "@/lib/number";
import { FishingMethod, GeoPoint, UpdateCatchInput } from "@anglog/shared";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// ISO(保存値) → datetime-local の "YYYY-MM-DDTHH:mm"（ローカル時刻）へ
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function EditCatchPage() {
  const params = useParams<{ id: string }>();
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
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCatch(params.id)
      .then((c) => {
        setSpecies(c.species);
        if (c.method) setMethod(c.method);
        setCaughtAt(toLocalInput(c.caughtAt));
        setSize(String(c.size ?? ""));
        setCount(String(c.count ?? ""));
        if (c.tackle) setTackle(c.tackle);
        if (c.reel) setReel(c.reel);
        if (c.areaName) setAreaName(c.areaName);
        if (c.memo) setMemo(c.memo);
        setLocation(c.location ?? null);
        setLoaded(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "読み込み失敗"));
  }, [params.id]);

  // send
  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    const sizeNum = size ? Number(toHalfWidthNumber(size)) : undefined;
    const countNum = count ? Number(toHalfWidthNumber(count)) : undefined;

    if (sizeNum !== undefined && (!Number.isFinite(sizeNum) || sizeNum < 0)) {
      setError("サイズは0以上の数値で入力してください");
      return;
    }

    if (countNum !== undefined && (!Number.isFinite(countNum) || countNum < 0)) {
      setError("釣果数は0以上の数値で入力してください");
      return;
    }

    try {
      const input: UpdateCatchInput = {
        species,
        method,
        caughtAt: new Date(caughtAt).toISOString(),
        size: sizeNum,
        count: countNum,
        tackle: tackle || undefined,
        reel: reel || undefined,
        areaName: areaName || undefined,
        memo: memo || undefined,
        location: location ?? undefined,
      };
      await updateCatch(params.id, input);
      router.push(`/catches/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">釣果を編集</h1>
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

        <input type="text" placeholder="サイズ(cm)" value={size}
          onChange={(e) => setSize(e.target.value)} className="border p-2 rounded" />
        <input type="text" placeholder="数(尾)" value={count}
          onChange={(e) => setCount(e.target.value)} className="border p-2 rounded" />
        <input placeholder="タックル" value={tackle}
          onChange={(e) => setTackle(e.target.value)} className="border p-2 rounded" />
        <input placeholder="リール" value={reel}
          onChange={(e) => setReel(e.target.value)} className="border p-2 rounded" />
        <input placeholder="エリア" value={areaName}
          onChange={(e) => setAreaName(e.target.value)} className="border p-2 rounded" />
        <input placeholder="メモ" value={memo}
          onChange={(e) => setMemo(e.target.value)} className="border p-2 rounded" />
        {loaded && <MapView value={location} onPick={setLocation} />}

        <button type="submit" className="bg-blue-600 text-white p-2 rounded">更新する</button>
      </form>
    </main>
  )
}