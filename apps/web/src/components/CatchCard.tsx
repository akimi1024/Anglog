import { methodToLabel } from "@/lib/catch";
import { Catch } from "@anglog/shared";
import { Span } from "next/dist/trace";
import Link from "next/link";

export default function CatchCard({ item }: { item: Catch }) {
  // method/size/count を「ある項目だけ」/ 区切りで連結
  const specs = [
    methodToLabel(item.method),
    item.size ? `${item.size}cm` : "",
    item.count ? `${item.count}尾` : "",
  ].filter(Boolean).join(" / ");

  return (
    <Link href={`/catches/${item.catchId}`} className="block bg-white border p-3 rounded hover:bg-gray-50">
      {/* 上段: 魚種 + 天気（右肩） */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-gray-900">{item.species}</span>
        {item.weather && (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {item.weather.condition} {Math.round(item.weather.temperature)}℃
          </span>
        )}
      </div>
      {specs && <div className="text-sm text-gray-600">{specs}</div>}
      {/* 下段: 日時 + エリア（右） */}
      <div className="mt-1 flex gap-3 text-xs text-gray-400">
        <span>{new Date(item.caughtAt).toLocaleString("ja-JP")}</span>
        {item.areaName && <span className="whitespace-nowrap">📍{item.areaName}</span>}
      </div>
    </Link>
  )
}