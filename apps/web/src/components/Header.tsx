"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUserEmail, logout } from "@/lib/auth";
import { Hub } from "aws-amplify/utils";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);

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
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="font-bold text-lg">anglog</Link>
        <nav className="flex items-center gap-3 text-sm">
          {email ? (
            <>
              <span className="text-gray-600">{email}</span>
              <button onClick={handleLogout} className="test-blue-600 underline">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-blue-600 underline">ログイン</Link>
              <Link href="/signup" className="text-blue-600 underline">新規登録</Link>
            </>
          )}
        </nav>
      </div>

      {/* 2段目: 主要導線（狭幅は横スクロール） */}
      <nav className="flex gap-4 px-4 pb-2 text-sm text-gray-700 overflow-x-auto whitespace-nowrap">
        <Link href="/catches">みんなの記録</Link>
        <Link href="/catches/me">自分の記録</Link>
        <Link href="/catches/map">地図</Link>
        <Link href="/catches/new">+ 記録</Link>
      </nav>
    </header>
  )
}