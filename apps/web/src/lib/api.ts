import { Catch, CreateCatchInput, Page } from "@anglog/shared";
import { getIdToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function createCatch(input: CreateCatchInput): Promise<Catch> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/catches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`作成に失敗しました (${res.status})`);
  }

  return res.json();
}

export async function listCatches(): Promise<Page<Catch>> {
  const res = await fetch(`${API_URL}/catches`);
  if (!res.ok) {
    throw new Error(`一覧取得に失敗しました(${res.status})`);
  }
  return res.json();
}
