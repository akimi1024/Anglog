"use client";

import { Catch } from "@anglog/shared";
import maplibregl from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export default function CatchesMap({ catches }: { catches: Catch[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const mapRef = useRef<maplibregl.Map | null>(null);

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
      center: [139.767, 35.681],
      zoom: 10,
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const withLoc = catches.filter((c) => c.location);
    const markers = withLoc.map((c) => {
      const m = new maplibregl.Marker().setLngLat([c.location!.lon, c.location!.lat]).addTo(map);
      m.getElement().style.cursor = "pointer";
      m.getElement().addEventListener("click", () => router.push(`/catches/${c.catchId}`));
      return m;
    })

    if (withLoc.length > 0) {
      const b = new maplibregl.LngLatBounds();
      withLoc.forEach((c) => b.extend([c.location!.lon, c.location!.lat]));
      map.fitBounds(b, { padding: 40, maxZoom: 12 });
    }
    return () => markers.forEach((m) => m.remove());
  }, [catches, router]);

  return <div ref={containerRef} style={{ width: "100%", height: "70vh" }} className="rounded" />
}