"use client";

import { deleteCatch, getCatch } from "@/lib/api";
import { Catch } from "@anglog/shared";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import MapView from "@/components/MapView";
import { methodToLabel } from "@/lib/catch";


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
    return <main className="max-w-md mx-auto p-4">
      <p className="text-red-600">{error}</p>
    </main>
  }

  if (!item) {
    return <main className="max-w-md mx-auto p-4">
      読み込み中・・・
    </main>
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
    <main className="max-w-md mx-auto p-4">
      <Link href="/catches" className="text-blue-600 underline text-sm">一覧へ</Link>
      <Link href={`/catches/${params.id}/edit`} className="text-blue-600 underline text-sm">編集</Link>
      <button onClick={handleDelete} className="text-red-600 underline text-sm">削除</button>
      <h1 className="text-2xl font-bold mt-2">{item.species}</h1>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        {item.method ?
          <div>
            <dt className="text-gray-500 inline">釣り方</dt>
            <dd className="inline">{methodToLabel(item.method)}</dd>
          </div> : null
        }
        {item.size ? <div>
          <dt className="text-gray-500 inline">サイズ</dt>
          <dd className="inline">{item.size}cm</dd></div> : null
        }
        {item.count ? <div>
          <dt className="text-gray-500 inline">数</dt>
          <dd className="inline">{item.count}尾</dd></div> : null
        }
        {item.tackle ? <div>
          <dt className="text-gray-500 inline">タックル</dt>
          <dd className="inline">{item.tackle}</dd></div> : null
        }
        {item.reel ? <div>
          <dt className="text-gray-500 inline">リール</dt>
          <dd className="inline">{item.reel}</dd></div> : null
        }
        {item.areaName ? <div>
          <dt className="text-gray-500 inline">エリア</dt>
          <dd className="inline">{item.areaName}</dd></div> : null
        }
        <div>
          <dt className="text-gray-500 inline">釣行日時</dt>
          <dd className="inline">{new Date(item.caughtAt).toLocaleString("ja-JP")}</dd>
        </div>
        {item.memo ? <div className="mt-2">
          <dt className="text-gray-500 inline">メモ</dt>
          <dd className="whitespace-pre-wrap">{item.memo}</dd></div> : null
        }
        {item.location && <MapView value={item.location} />}
      </dl>
    </main>
  )
}