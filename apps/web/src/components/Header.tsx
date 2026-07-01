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
    <header className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="font-bold">anglog</Link>
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
    </header>
  )
}