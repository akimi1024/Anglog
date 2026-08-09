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

export async function getUploadUrl(
  id: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string }> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/catches/${id}/image-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ contentType }),
  });
  if (!res.ok)
    throw new Error(`アップロードURL取得に失敗しました (${res.status})`);
  return res.json();
}

export async function askAdvisor(question: string): Promise<{ jobId: string }> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/advisor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`相談の送信に失敗しました (${res.status})`);
  return res.json();
}

export async function getAdvisorResult(
  jobId: string,
): Promise<{ status: string; answer: string | null }> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/advisor/result?jobId=${jobId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`結果取得に失敗しました (${res.status})`);
  return res.json();
}
