"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css"
import type { GeoPoint } from "@anglog/shared";

type Props = {
  onPick?: (point: GeoPoint) => void;
  value?: GeoPoint | null;
}

export default function MapView({ onPick, value }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current, style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: value ? [value.lon, value.lat] : [139.767, 35.681],
      zoom: value ? 12 : 10,
    });

    mapRef.current = map;

    map.on("click", (e) => {
      if (!onPickRef.current) return;
      const { lng, lat } = e.lngLat;
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
      }
      onPickRef.current?.({ lat, lon: lng })
    })

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (value) {
      if (markerRef.current) {
        markerRef.current.setLngLat([value.lon, value.lat]);
      } else {
        markerRef.current = new maplibregl.Marker().setLngLat([value.lon, value.lat]).addTo(map);
      }
    }else{
      markerRef.current?.remove();
      markerRef.current = null;
    }
  }, [value]);
  return <div ref={containerRef} style={{ width: "100%", height: "70vh" }} className="rounded" />;
}