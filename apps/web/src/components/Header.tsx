"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUserEmail, logout } from "@/lib/auth";
import { Hub } from "aws-amplify/utils";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button"

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    // 初回マウント時に現在ログイン状態を取得
    getCurrentUserEmail().then(setEmail);

    // ログイン/ログアウトのイベントを自動登録
    const usesubribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        getCurrentUserEmail().then(setEmail);
      } else if (payload.event === "signedOut") {
        setEmail(null);
      }
    });

    // 後片付け
    return () => usesubribe();
  }, []);

  async function handleLogout() {
    await logout();
    setEmail(null);
  }

  return (
    <header className="border-b">
      {/* 1段目: ロゴ + 認証 */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-lg tracking-tight">anglog</Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="テーマ切替"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 hidden dark:block" />
            <Moon className="h-4 w-4 block dark:hidden" />
          </Button>
          {email ? (
            <>
              <span className="text-sm text-muted-foreground max-sm:hidden">{email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>ログアウト</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">新規登録</Link>
              </Button>
            </>
          )}
        </nav>
      </div>

      {/* 2段目: 主要導線（狭幅は横スクロール） */}
      <nav className="flex gap-1 px-2 pb-2 overflow-x-auto whitespace-nowrap">
        {[
          ["/catches", "みんなの記録"],
          ["/catches/me", "自分の記録"],
          ["/catches/map", "地図"],
          ["/catches/new", "+ 記録"],
        ].map(([href, label]) => (
          <Button key={href} variant="ghost" size="sm" asChild>
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </nav>
    </header>
  )
}