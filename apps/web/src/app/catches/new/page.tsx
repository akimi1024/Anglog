"use client";

import MapView from "@/components/MapView";
import { createCatch, getUploadUrl, updateCatch } from "@/lib/api";
import { toHalfWidthNumber } from "@/lib/number";
import { CreateCatchInput, FishingMethod, GeoPoint } from "@anglog/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";
import { resizeImage } from "@/lib/resizeImage";


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
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

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

    setSubmitting(true);

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
      const created = await createCatch(input);
      try {
        const keys: string[] = [];
        for (const file of files) {
          const resized = await resizeImage(file);
          const { uploadUrl, key } = await getUploadUrl(created.catchId, resized.type);
          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": resized.type },
            body: resized
          });
          keys.push(key);
        }
        if (keys.length > 0) {
          await updateCatch(created.catchId, { imageKeys: keys });
        }
      } catch {
        // 画像だけ失敗：釣果は作成済みなので無視して進む
      }
      router.push(`/catches/${created.catchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setSubmitting(false);
      return;
    }
  }

  async function handleRemoveImage(target: File) {
    setFiles((prev) => prev.filter((f) => f !== target));
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

        <div className="flex flex-col gap-1.5">
          <Label>写真</Label>
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={`${f.name}-${f.size}-${f.lastModified}`} className="relative aspect-square">
                  <img src={previews[i]} alt="" className="absolute inset-0 h-full w-full rounded-lg border object-cover" />
                  <button type="button" onClick={() => handleRemoveImage(f)} aria-label="写真を削除"
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-destructive backdrop-blur hover:bg-background">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input id="photo" type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => {
              setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
              e.target.value = "";
            }} />
          <label htmlFor="photo" className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-accent">
            <ImagePlus className="h-4 w-4" />
            写真を選択
          </label>
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

        <Button type="submit" disabled={submitting} className="mt-1">
          {submitting ? "記録中・・・" : "記録する"}
        </Button>
      </form>
    </main>
  )
}