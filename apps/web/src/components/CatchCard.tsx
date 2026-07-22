import { Catch } from "@anglog/shared";
import { methodToLabel, methodChip } from "@/lib/catch";
import { MapPin } from "lucide-react";
import Link from "next/link";
import WeatherIcon from "@/components/WeatherIcon";

export default function CatchCard({ item }: { item: Catch }) {
  return (
    <Link href={`/catches/${item.catchId}`} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40">
      {/* 左: 情報 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.method && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${methodChip[item.method]}`}>
              {methodToLabel(item.method)}
            </span>
          )}
          <span className="truncate text-[17px] font-bold tracking-tight">{item.species}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.weather && (
            <span className="inline-flex items-center gap-1">
              <WeatherIcon condition={item.weather.condition} />
              {item.weather.condition} {Math.round(item.weather.temperature)}℃
            </span>
          )}
          <time className="font-mono tabular-nums text-muted-foreground/80">
            {new Date(item.caughtAt).toLocaleString("ja-JP", {
              month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </time>
          {item.areaName && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-3 w-3 text-primary" />{item.areaName}
            </span>
          )}
        </div>
      </div>

      {/* 右: サイズを主役に（size か count があれば表示） */}
      {(item.size != null || item.count != null) && (
        <div className="flex flex-none flex-col items-end justify-center border-l pl-3 text-right">
          {item.size != null && (
            <div className="font-mono leading-none text-primary">
              <b className="text-2xl font-semibold">{item.size}</b>
              <span className="ml-0.5 text-xs text-muted-foreground">cm</span>
            </div>
          )}
          {item.count != null && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              <b className="font-mono font-semibold text-foreground tabular-nums">{item.count}</b>尾
            </div>
          )}
        </div>
      )}
    </Link>
  );
}