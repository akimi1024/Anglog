// 緯度経度
export interface GeoPoint {
  lat: number;
  lon: number;
}

// 検索クエリ
export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}