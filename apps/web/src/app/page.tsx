import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Fish, Map, Plus } from "lucide-react";


export default function Home() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 p-6 pt-16">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Fish className="h-3.5 w-3.5" />釣果ログ
        </span>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          釣りの記録を、<br />ひとつに。
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          魚種・サイズ・釣り方・場所・当時の天気まで。あなたの釣果をまとめて残して、みんなと共有できます。
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href="/catches/new"><Plus className="h-4 w-4" />釣果を記録する</Link>
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline">
            <Link href="/catches">みんなの記録</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catches/map"><Map className="h-4 w-4" />地図で見る</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}