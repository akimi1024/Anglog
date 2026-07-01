"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/");
      setError(null);
    } catch(err) {
      setError(err instanceof Error ? err.message: "ログインに失敗しました");
    }
  }

  return (
    <main className="max-w-sm mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">ログイン</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input type="email" placeholder="メールアドレス" value={email}
          onChange={(e) => setEmail(e.target.value)} required
          className="border p-2 rounded" />
        <input type="password" placeholder="パスワード" value={password}
          onChange={(e) => setPassword(e.target.value)} required
          className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          ログイン
        </button>
        <p className="mt-4 text-sm text-center text-gray-600">
          アカウントをお持ちでない方{" "}
          <Link href="/signup" className="text-blue-600 underline">
            新規登録
          </Link>
        </p>
      </form>
    </main>
  );
}