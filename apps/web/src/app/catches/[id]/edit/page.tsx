"use client";

import MapView from "@/components/MapView";
import { getCatch, getUploadUrl, updateCatch } from "@/lib/api";
import { toHalfWidthNumber } from "@/lib/number";
import { FishingMethod, GeoPoint, UpdateCatchInput } from "@anglog/shared";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { imageUrl } from "@/lib/image";
import { X } from "lucide-react";
import { ImagePlus } from "lucide-react";

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
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setImageKeys(c.imageKeys ?? []);
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
        location: location,
      };
      await updateCatch(params.id, input);
      router.push(`/catches/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleAddFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const added: string[] = [];
      for (const file of files) {
        const { uploadUrl, key } = await getUploadUrl(params.id, file.type);
        await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "content-Type": file.type
          },
          body: file
        })
        added.push(key);
      }
      const next = [...imageKeys, ...added];
      await updateCatch(params.id, { imageKeys: next });
      setImageKeys(next);
    } catch {
      setError("画像アップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemoveImage(key: string) {
    const next = imageKeys.filter((k) => k !== key);
    try {
      await updateCatch(params.id, { imageKeys: next });
      setImageKeys(next);
    } catch {
      setError("画像の削除に失敗しました");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-xl font-bold tracking-tight">釣果を編集</h1>
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
          {imageKeys.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imageKeys.map((key) => (
                <div key={key} className="relative aspect-square">
                  <img src={imageUrl(key)} alt="" className="absolute inset-0 h-full w-full rounded-lg border object-cover" />
                  <button type="button" onClick={() => handleRemoveImage(key)} aria-label="写真を削除"
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-destructive backdrop-blur hover:bg-background" >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input id="photo" type="file" accept="image/*" multiple onChange={handleAddFiles} disabled={uploading} className="hidden" />
          <label htmlFor="photo" className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-accent ${uploading ? "pointer-events-none opacity-50" : ""}`}>
            <ImagePlus className="h-4 w-4" />
            {uploading ? "アップロード中…" : "写真を追加"}
          </label>
        </div>

        {/* 位置 */}
        <div className="flex flex-col gap-1.5">
          <Label>釣り場（地図をタップ）</Label>
          {loaded && (
            <div className="overflow-hidden rounded-2xl border">
              <MapView value={location} onPick={setLocation} />
            </div>
          )}
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

        <Button type="submit" className="mt-1">更新する</Button>
      </form>
    </main>
  )
}