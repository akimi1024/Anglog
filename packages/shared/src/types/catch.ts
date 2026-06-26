import type { GeoPoint, BoundingBox } from "./geo"

// 釣り方
export type FishingMethod = "lure" | "bait" | "fly" | "other";

// 天気スナップショット
export interface Weather {
  condition: string; // 天気
  temperature: number; // 気温
  windSpeed: number;
  pressure: number;
}

// 釣果エンティティ
export interface Catch {
  catchId: string;
  userId: string;
  caughtAt: string; //釣行日
  species: string; //魚種
  size?: number;
  count?: number;
  method: FishingMethod;
  tackle?: string;
  reel?: string;
  memo?: string;
  imageKeys: string[];
  location?: GeoPoint;
  geohash?: string;
  areaName?: string;
  weather?: Weather;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}


// 作成時の入力
export type CreateCatchInput = Omit<
  Catch,
  "catchId" | "userId" | "createdAt" | "updatedAt" | "weather" | "geohash"
>;

// 更新時の入力
export type UpdateCatchInput = Partial<CreateCatchInput>;

export interface CatchSearchQuery {
  species?: string;
  method?: FishingMethod;
  from?: string;
  to?: string;
  areaName?: string;
  bbox?: BoundingBox;
}
