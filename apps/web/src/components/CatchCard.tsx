import { Catch } from "@anglog/shared";
import { methodToLabel, methodChip } from "@/lib/catch";
import { MapPin } from "lucide-react";
import Link from "next/link";
import WeatherIcon from "@/components/WeatherIcon";
import { Fish } from "lucide-react";
import { imageUrl } from "@/lib/image";

export default function CatchCard({ item }: { item: Catch }) {
  const src = imageUrl(item.imageKeys?.[0]);

  return (
    <Link href={`/catches/detail?id=${item.catchId}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40">
      {/* 画像 or NO IMAGE（正方形で高さ統一） */}
      <div className="relative aspect-square bg-muted">
        {src ? (
          <img src={src} alt={item.species} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/40">
            <Fish className="h-8 w-8" />
            <span className="text-xs font-medium">NO IMAGE</span>
          </div>
        )}
        {/* サイズを画像右下にオーバーレイ */}
        {item.size != null && (
          <span className="absolute bottom-2 right-2 rounded-md bg-background/85 px-1.5 py-0.5 font-mono text-sm font-semibold text-primary backdrop-blur">
            {item.size}<span className="text-xs text-muted-foreground">cm</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2">
          {item.method && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${methodChip[item.method]}`}>
              {methodToLabel(item.method)}
            </span>
          )}
          <span className="truncate font-bold tracking-tight">{item.species}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {item.weather && (
            <span className="inline-flex items-center gap-1">
              <WeatherIcon condition={item.weather.condition} />
              {Math.round(item.weather.temperature)}℃
            </span>
          )}
          {item.areaName && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-3 w-3 text-primary" />
              {item.areaName}
            </span>
          )}
        </div>
        <time className="font-mono mt-auto text-[11px] tabular-nums text-muted-foreground/70">
          {new Date(item.caughtAt).toLocaleDateString("ja-JP")}
        </time>
      </div>
    </Link>
  );
}