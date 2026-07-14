"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);

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

    return () => map.remove();
  }, []);

  return <div ref={containerRef} className="w-full h-96 rounded" />;
}