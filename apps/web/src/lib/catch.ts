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

export const methodChip: Record<FishingMethod, string> = {
  lure:  "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  bait:  "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  fly:   "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}