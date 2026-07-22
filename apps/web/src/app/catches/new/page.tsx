"use client";

import MapView from "@/components/MapView";
import { createCatch } from "@/lib/api";
import { toHalfWidthNumber } from "@/lib/number";
import { CreateCatchInput, FishingMethod, GeoPoint } from "@anglog/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
      const input: CreateCatchInput = {
        species,
        method,
        caughtAt: new Date(caughtAt).toISOString(),
        size: sizeNum,
        count: countNum,
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
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-xl font-bold tracking-tight">釣果を記録</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="species">魚種 <span className="text-destructive">*</span></Label>
          <Input id="species" value={species} required placeholder="例: アジ"
            onChange={(e) => setSpecies(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>釣り方</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as FishingMethod)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lure">ルアー</SelectItem>
              <SelectItem value="bait">エサ</SelectItem>
              <SelectItem value="fly">フライ</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="caughtAt">釣行日時 <span className="text-destructive">*</span></Label>
          <Input id="caughtAt" type="datetime-local" value={caughtAt} required
            onChange={(e) => setCaughtAt(e.target.value)} />
        </div>

        {/* 数値系は2カラムでコンパクトに */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="size">サイズ (cm)</Label>
            <Input id="size" type="text" inputMode="numeric" value={size}
              onChange={(e) => setSize(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="count">数 (尾)</Label>
            <Input id="count" type="text" inputMode="numeric" value={count}
              onChange={(e) => setCount(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tackle">タックル</Label>
            <Input id="tackle" value={tackle} onChange={(e) => setTackle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reel">リール</Label>
            <Input id="reel" value={reel} onChange={(e) => setReel(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="areaName">エリア</Label>
          <Input id="areaName" value={areaName} placeholder="例: 三浦半島"
            onChange={(e) => setAreaName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="memo">メモ</Label>
          <Textarea id="memo" value={memo} rows={3}
            onChange={(e) => setMemo(e.target.value)} />
        </div>

        {/* 位置 */}
        <div className="flex flex-col gap-1.5">
          <Label>釣り場（地図をタップ）</Label>
          <div className="overflow-hidden rounded-2xl border">
            <MapView value={location} onPick={setLocation} />
          </div>
          {location && (
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
              </span>
              <Button type="button" variant="ghost" size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setLocation(null)}>
                位置を削除
              </Button>
            </div>
          )}
        </div>

        <Button type="submit" className="mt-1">記録する</Button>
      </form>
    </main>
  )
}