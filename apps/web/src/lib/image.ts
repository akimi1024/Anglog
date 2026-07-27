const BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export function imageUrl(key: string | undefined | null): string | undefined {
  return key && BASE ? `${BASE}/${key}` : undefined;
}