import {
  Catch,
  CreateCatchInput,
  Page,
  UpdateCatchInput,
} from "@anglog/shared";
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

export async function getCatch(id: string): Promise<Catch> {
  const res = await fetch(`${API_URL}/catches/${id}`);
  if (res.status === 404) {
    throw new Error("記録が見つかりませんでした");
  }
  if (!res.ok) {
    throw new Error(`取得に失敗しました (${res.status})`);
  }
  return res.json();
}

export async function listMyCatches(): Promise<Page<Catch>> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/catches/me`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    throw new Error("ログインが必要です");
  }
  if (!res.ok) {
    throw new Error(`一覧取得に失敗しました (${res.status})`);
  }
  return res.json();
}

export async function updateCatch(
  id: string,
  input: UpdateCatchInput,
): Promise<Catch> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/catches/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`更新に失敗しました (${res.status})`);
  }
  return res.json();
}

export async function deleteCatch(id: string): Promise<void> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/catches/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`削除に失敗しました (${res.status})`);
  }
}
