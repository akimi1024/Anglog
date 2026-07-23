"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    }
  }

  return (
    <main className="max-w-sm mx-auto p-4">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" value={password} required onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button type="submit" className="mt-1">ログイン</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}