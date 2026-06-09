"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { ExpandIcon, CollapseIcon } from "@/components/icons/outline";
import { Button } from "@/components/ui";

// Palembang (UKMC area) as default center
const DEFAULT_CENTER: [number, number] = [104.7597, -2.9862];

function makeCircle(
  lng: number,
  lat: number,
  radiusM: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const n = 64;
  const coords: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const mPerDegreeLat = 111320;
  const mPerDegreeLng = 111320 * Math.cos(latRad);
  for (let i = 0; i <= n; i++) {
    const angle = (i / n) * 2 * Math.PI;
    const dLng = (radiusM * Math.sin(angle)) / mPerDegreeLng;
    const dLat = (radiusM * Math.cos(angle)) / mPerDegreeLat;
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

interface Props {
  lat: string;
  lng: string;
  radius?: number;
  onChange: (lat: string, lng: string) => void;
  /** Assign a callback here; calling it will fly the map camera to that location */
  flyToRef?: React.MutableRefObject<((lat: number, lng: number) => void) | null>;
}

export function MapPicker({ lat, lng, radius = 50, onChange, flyToRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng);
  const center: [number, number] = hasCoords
    ? [parsedLng, parsedLat]
    : DEFAULT_CENTER;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let marker: any;

    (async () => {
      const mapboxgl = await import("mapbox-gl");
      mapboxgl.default.accessToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

      if (!containerRef.current) return;

      map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: 16,
        attributionControl: false,
      });

      map.addControl(
        new mapboxgl.default.AttributionControl({ compact: true }),
        "bottom-left",
      );

      marker = new mapboxgl.default.Marker({
        draggable: true,
        color: "#3b82f6",
      })
        .setLngLat(center)
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onChangeRef.current(
          lngLat.lat.toFixed(6),
          lngLat.lng.toFixed(6),
        );
      });

      map.on("click", (e: { lngLat: { lat: number; lng: number } }) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        onChangeRef.current(
          e.lngLat.lat.toFixed(6),
          e.lngLat.lng.toFixed(6),
        );
      });

      // Expose imperative flyTo
      if (flyToRef) {
        flyToRef.current = (flyLat: number, flyLng: number) => {
          map.flyTo({ center: [flyLng, flyLat], zoom: 16, duration: 800 });
        };
      }

      map.on("load", () => {
        map.addSource("radius", {
          type: "geojson",
          data: makeCircle(center[0], center[1], radius),
        });
        map.addLayer({
          id: "radius-fill",
          type: "fill",
          source: "radius",
          paint: { "fill-color": "#3b82f6", "fill-opacity": 0.1 },
        });
        map.addLayer({
          id: "radius-line",
          type: "line",
          source: "radius",
          paint: { "line-color": "#3b82f6", "line-width": 1.5 },
        });
        setLoaded(true);
      });

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
      if (flyToRef) flyToRef.current = null;
      setLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker & radius circle when props change
  useEffect(() => {
    if (!loaded || !mapRef.current || !markerRef.current) return;
    const validLat = !isNaN(parsedLat) ? parsedLat : DEFAULT_CENTER[1];
    const validLng = !isNaN(parsedLng) ? parsedLng : DEFAULT_CENTER[0];
    markerRef.current.setLngLat([validLng, validLat]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapRef.current.getSource("radius") as any)?.setData(
      makeCircle(validLng, validLat, radius),
    );
  }, [lat, lng, radius, loaded, parsedLat, parsedLng]);

  // Resize map after fullscreen transition
  useEffect(() => {
    const id = requestAnimationFrame(() => mapRef.current?.resize());
    return () => cancelAnimationFrame(id);
  }, [isFullscreen]);

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50" : "relative"}>
      <div
        ref={containerRef}
        className={
          isFullscreen
            ? "h-full w-full"
            : "h-52 w-full overflow-hidden rounded-2xl ring-1 ring-taupe-200"
        }
      />

      {/* Fullscreen toggle — bespoke floating map control, not a standard Button variant */}
      <button
        type="button"
        onClick={() => setIsFullscreen((f) => !f)}
        className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-md text-foreground transition-opacity active:opacity-70"
        aria-label={isFullscreen ? "Perkecil peta" : "Perbesar peta"}
      >
        {isFullscreen ? (
          <CollapseIcon className="size-4" strokeWidth={2} />
        ) : (
          <ExpandIcon className="size-4" strokeWidth={2} />
        )}
      </button>

      {/* Confirm button shown in fullscreen */}
      {isFullscreen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <Button
            variant="primary"
            className="px-8 py-3 shadow-lg"
            onClick={() => setIsFullscreen(false)}
          >
            Konfirmasi Lokasi
          </Button>
        </div>
      )}
    </div>
  );
}
