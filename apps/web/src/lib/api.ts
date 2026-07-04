import { Catch, CreateCatchInput } from "@anglog/shared";
import { getIdToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function createCatch(input: CreateCatchInput): Promise<Catch> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/catches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`}: {}),
    },
    body: JSON.stringify(input),
  });
  if(!res.ok){
    throw new Error(`作成に失敗しました (${res.status})`);
  }

  return res.json();
}