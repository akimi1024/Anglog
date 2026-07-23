"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmUser, registerUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">サインアップ</CardTitle>
        </CardHeader>
        <CardContent>


          {phase === "register" ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">パスワード</Label>
                <Input id="password" type="password" value={password} required onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="mt-1">サインアップ</Button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="flex flex-col gap-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p>{email} に届いた確認コードを入力してください</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">認証コード</Label>
                <Input id="code" type="text" value={code} required onChange={(e) => setCode(e.target.value)} />
              </div>
              <Button type="submit" className="mt-1">確認する</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}