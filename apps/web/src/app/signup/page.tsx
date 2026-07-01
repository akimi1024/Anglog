"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmUser, registerUser } from "@/lib/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"register" | "confirm">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await registerUser(email, password);
      setPhase("confirm"); // 登録成功 → コード入力
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    }
  }

  async function handleConfirm(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await confirmUser(email, code);
      router.push("/login"); // 確認できたらログイン画面
    } catch (err) {
      setError(err instanceof Error ? err.message : "確認に失敗しました");
    }
  }

  return (
    <main className="max-w-sm mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">新規登録</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}

      {phase === "register" ? (
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <input type="email" placeholder="メールアドレス" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="border p-2 rounded" />
          <input type="password" placeholder="パスワード" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded">
            登録する
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="flex flex-col gap-3">
          <p>{email} に届いた確認コードを入力してください</p>
          <input type="text" placeholder="確認コード" value={code}
            onChange={(e) => setCode(e.target.value)} required
            className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded">
            確認する
          </button>
        </form>
      )}
    </main>
  )
}