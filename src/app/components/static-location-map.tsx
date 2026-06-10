"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";

type StaticLocationMapProps = {
  latitude: string | number | null | undefined;
  longitude: string | number | null | undefined;
  label?: string;
  radius?: number | null;
  className?: string;
};

function makeCircle(
  lng: number,
  lat: number,
  radiusM: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const segments = 64;
  const coords: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(latRad);

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const dLng = (radiusM * Math.sin(angle)) / metersPerDegreeLng;
    const dLat = (radiusM * Math.cos(angle)) / metersPerDegreeLat;
    coords.push([lng + dLng, lat + dLat]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

export function StaticLocationMap({
  latitude,
  longitude,
  label = "Lokasi",
  radius,
  className = "",
}: StaticLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  const coords = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [latitude, longitude]);

  useEffect(() => {
    if (!coords || !containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    (async () => {
      try {
        const mapboxgl = await import("mapbox-gl");
        mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

        if (!containerRef.current) return;

        map = new mapboxgl.default.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [coords.lng, coords.lat],
          zoom: radius ? 16 : 17,
          attributionControl: false,
          interactive: false,
        });

        map.addControl(
          new mapboxgl.default.AttributionControl({ compact: true }),
          "bottom-left",
        );

        new mapboxgl.default.Marker({ color: "#2563eb" })
          .setLngLat([coords.lng, coords.lat])
          .setPopup(
            new mapboxgl.default.Popup({ offset: 24, closeButton: false }).setHTML(
              `<p style="font-size:12px;font-weight:600;margin:0;color:#0f172a">${label}</p>`,
            ),
          )
          .addTo(map);

        if (radius && radius > 0) {
          map.on("load", () => {
            map.addSource("radius", {
              type: "geojson",
              data: makeCircle(coords.lng, coords.lat, radius),
            });
            map.addLayer({
              id: "radius-fill",
              type: "fill",
              source: "radius",
              paint: { "fill-color": "#2563eb", "fill-opacity": 0.1 },
            });
            map.addLayer({
              id: "radius-line",
              type: "line",
              source: "radius",
              paint: { "line-color": "#2563eb", "line-width": 1.5 },
            });
          });
        }

        mapRef.current = map;
        setMapError(false);
      } catch {
        setMapError(true);
      }
    })();

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  }, [coords, label, radius]);

  if (!coords) {
    return (
      <div className={`flex h-52 w-full items-center justify-center rounded-2xl bg-taupe-100 text-xs text-taupe-400 ring-1 ring-taupe-200 ${className}`}>
        Koordinat tidak tersedia
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`flex h-52 w-full items-center justify-center rounded-2xl bg-taupe-100 text-xs text-taupe-400 ring-1 ring-taupe-200 ${className}`}>
        Peta tidak dapat dimuat
      </div>
    );
  }

  return (
    <div className={`relative h-52 w-full overflow-hidden rounded-2xl ring-1 ring-taupe-200 ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-2 left-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
        {label}
      </div>
    </div>
  );
}
