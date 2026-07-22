"use client";

import { deleteCatch, getCatch } from "@/lib/api";
import { Catch } from "@anglog/shared";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import MapView from "@/components/MapView";
import WeatherIcon from "@/components/WeatherIcon";
import { methodToLabel, methodChip } from "@/lib/catch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, Trash2, MapPin, Thermometer, Wind, Gauge } from "lucide-react";


export default function CatchDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Catch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCatch(params.id)
      .then(setItem)
      .catch((e) => setError(e instanceof Error ? e.message : "取得に失敗しました"));
  }, [params.id]);

  if (error) {
    return <main className="mx-auto max-w-md p-4">
      <p className="text-destructive">{error}</p>
    </main>;
  }

  if (!item) {
    return <main className="mx-auto max-w-md p-4 text-muted-foreground">
      読み込み中…
    </main>;
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm("この釣果を削除しますか？")) return;
    try {
      await deleteCatch(item.catchId);
      router.push("/catches");
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      {/* ナビ + 操作 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/catches"><ChevronLeft className="h-4 w-4" />一覧</Link>
        </Button>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/catches/${params.id}/edit`}><Pencil className="h-3.5 w-3.5" />編集</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}
            className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />削除
          </Button>
        </div>
      </div>

      {/* ヒーロー: チップ + 魚種 + サイズ主役 */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {item.method && (
            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${methodChip[item.method]}`}>
              {methodToLabel(item.method)}
            </span>
          )}
          <h1 className="mt-1.5 truncate text-2xl font-bold tracking-tight">{item.species}</h1>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
            {new Date(item.caughtAt).toLocaleString("ja-JP")}
          </p>
        </div>
        {(item.size != null || item.count != null) && (
          <div className="flex-none text-right font-mono leading-none text-primary">
            {item.size != null && (
              <>
                <b className="text-4xl font-semibold">{item.size}</b>
                <span className="ml-1 text-sm text-muted-foreground">cm</span>
              </>
            )}
            {item.count != null && <div className="mt-1 text-xs text-muted-foreground">{item.count}尾</div>}
          </div>
        )}
      </div>

      {/* 天気カード: 計器っぽくmonoで並べる */}
      {item.weather && (
        <Card size="sm">
          <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-2 text-primary">
              <WeatherIcon condition={item.weather.condition} className="h-5 w-5" />
              <span className="font-medium text-foreground">{item.weather.condition}</span>
            </span>
            <div className="ml-auto flex gap-4 font-mono text-sm tabular-nums text-muted-foreground">
              <span className="flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" />{item.weather.temperature}℃</span>
              <span className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" />{item.weather.windSpeed}<span className="text-xs">km/h</span></span>
              <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{item.weather.pressure}<span className="text-xs">hPa</span></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 詳細: 項目があるときだけ */}
      {(item.tackle || item.reel || item.areaName) && (
        <Card size="sm">
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
              {item.tackle && <><dt className="text-muted-foreground">タックル</dt><dd>{item.tackle}</dd></>}
              {item.reel && <><dt className="text-muted-foreground">リール</dt><dd>{item.reel}</dd></>}
              {item.areaName && <><dt className="text-muted-foreground">エリア</dt>
                <dd className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" />{item.areaName}</dd></>}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* メモ */}
      {item.memo && (
        <Card size="sm">
          <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{item.memo}</p></CardContent>
        </Card>
      )}

      {/* 地図 */}
      {item.location && (
        <div className="overflow-hidden rounded-2xl border">
          <MapView value={item.location} />
        </div>
      )}
    </main>
  );
}