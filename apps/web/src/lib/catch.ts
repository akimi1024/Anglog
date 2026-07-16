import { FishingMethod } from "@anglog/shared";

export const methodLabel: Record<FishingMethod, string> = {
  lure: "ルアー",
  bait: "エサ",
  fly: "フライ",
  other: "その他",
}

export function methodToLabel(m: FishingMethod | undefined): string{
  return m ? methodLabel[m] : "";
}