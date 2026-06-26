import type { GeoPoint } from "./geo"

export interface Parking {
  parkingId: string;
  location: GeoPoint;
  geohash: string;
  fee?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string;
}

export type CreateParkingInput = Omit<
  Parking,
  "parkingId" | "geohash" | "createdAt" | "updatedAt" | "lastEditedBy"
>;

export type UpdateParkingInput = Partial<Pick< Parking, "fee" | "memo" >>;

