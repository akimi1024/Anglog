"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askAdvisor, getAdvisorResult } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { useState } from "react";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AdvisorPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.SubmitEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    setError(null);

    try {
      const { jobId } = await askAdvisor(question.trim());
      // 2秒×60＝最大2分ポーリング
      for (let i = 0; i < 60; i++) {
        await sleep(2000);
        const res = await getAdvisorResult(jobId);
        if (res.status === "done") { setAnswer(res.answer ?? ""); return }
        if (res.status === "error") { setError(res.answer || "AI処理でエラーが発生しました"); return }
        // runningは継続
      }
      setError("時間がかかっています。少し待って再度お試しください");
    } catch (err) {
      setError(err instanceof Error ? err.message : "相談に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />AIに相談
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          みんなの釣果と最新の外部情報から、AIが釣り場を提案します。
        </p>
      </div>

      <form onSubmit={handleAsk} className="flex flex-col gap-2">
        <Textarea value={question} rows={3} disabled={loading}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例: 週末に息子と行ける、駐車場あり・アジが釣れる近場ある？" />
        <Button type="submit" disabled={loading || !question.trim()} className="self-end">
          {loading ? "考え中…" : "相談する"}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && !answer && (
        <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          AIが釣果データと最新情報を調べています…（最大1〜2分）
        </div>
      )}

      {answer && (
        <div className="prose prose-sm dark:prose-invert max-w-none rounded-2xl border bg-card p-4">
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}
    </main>
  );
}