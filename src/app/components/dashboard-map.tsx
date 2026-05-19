"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Office } from "@/lib/api/types";

interface Props {
  offices: Office[];
  userLocation: { lat: number; lng: number } | null;
}

interface EdgeIndicator {
  id: number;
  name: string;
  x: number;
  y: number;
  angle: number; // degrees, for pointing arrow
}

const DEFAULT_CENTER: [number, number] = [104.7597, -2.9862];
const EDGE_PAD = 14; // px from map border

function getEdgePosition(
  px: number,
  py: number,
  W: number,
  H: number,
): { x: number; y: number; angle: number } | null {
  // If on-screen, no indicator needed
  if (px >= 0 && px <= W && py >= 0 && py <= H) return null;

  const cx = W / 2;
  const cy = H / 2;
  const dx = px - cx;
  const dy = py - cy;

  // Find t such that the point on the edge is cx+dx*t, cy+dy*t
  const tRight = dx > 0 ? (W - EDGE_PAD - cx) / dx : Infinity;
  const tLeft = dx < 0 ? (EDGE_PAD - cx) / dx : Infinity;
  const tBottom = dy > 0 ? (H - EDGE_PAD - cy) / dy : Infinity;
  const tTop = dy < 0 ? (EDGE_PAD - cy) / dy : Infinity;
  const t = Math.min(
    tRight > 0 ? tRight : Infinity,
    tLeft > 0 ? tLeft : Infinity,
    tBottom > 0 ? tBottom : Infinity,
    tTop > 0 ? tTop : Infinity,
  );

  if (!isFinite(t)) return null;

  return {
    x: Math.round(Math.max(EDGE_PAD, Math.min(W - EDGE_PAD, cx + dx * t))),
    y: Math.round(Math.max(EDGE_PAD, Math.min(H - EDGE_PAD, cy + dy * t))),
    angle: Math.atan2(dy, dx) * (180 / Math.PI),
  };
}

export function DashboardMap({ offices, userLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [indicators, setIndicators] = useState<EdgeIndicator[]>([]);

  // Recalculate which office markers are off-screen
  const updateIndicators = useCallback(() => {
    const map = mapRef.current;
    if (!map || !containerRef.current) return;
    const W = containerRef.current.offsetWidth;
    const H = containerRef.current.offsetHeight;

    const next: EdgeIndicator[] = [];
    for (const office of offices) {
      const lat = Number(office.latitude);
      const lng = Number(office.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      const point = map.project([lng, lat]);
      const edge = getEdgePosition(point.x, point.y, W, H);
      if (edge) {
        next.push({ id: office.id, name: office.name, ...edge });
      }
    }
    setIndicators(next);
  }, [offices]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    (async () => {
      const mapboxgl = await import("mapbox-gl");
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

      if (!containerRef.current) return;

      const center: [number, number] = userLocation
        ? [userLocation.lng, userLocation.lat]
        : offices.length > 0
          ? [Number(offices[0].longitude), Number(offices[0].latitude)]
          : DEFAULT_CENTER;

      map = new mapboxgl.default.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: userLocation ? 15 : 13,
        attributionControl: false,
      });

      map.addControl(
        new mapboxgl.default.AttributionControl({ compact: true }),
        "bottom-left",
      );

      // Office markers
      for (const office of offices) {
        const lat = Number(office.latitude);
        const lng = Number(office.longitude);
        if (isNaN(lat) || isNaN(lng)) continue;

        new mapboxgl.default.Marker({ color: "#2b2d42" })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25, closeButton: false }).setHTML(
              `<p style="font-size:12px;font-weight:600;margin:0;color:#2b2d42">${office.name}</p>`,
            ),
          )
          .addTo(map);
      }

      // User location dot
      if (userLocation) {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.25);
        `;
        new mapboxgl.default.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }

      // Update edge indicators after every move
      map.on("moveend", () => updateIndicators());
      map.on("load", () => updateIndicators());

      mapRef.current = map;
    })();

    return () => {
      map?.remove();
      mapRef.current = null;
      setIndicators([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rerun indicator calc when offices change
  useEffect(() => {
    updateIndicators();
  }, [offices, updateIndicators]);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl ring-1 ring-taupe-200">
      <div ref={containerRef} className="h-full w-full" />

      {/* Edge indicators for off-screen offices */}
      {indicators.map((ind) => (
        <div
          key={ind.id}
          title={ind.name}
          style={{
            position: "absolute",
            left: ind.x,
            top: ind.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        >
          {/* Outer ring */}
          <div className="flex size-6 items-center justify-center rounded-full bg-foreground/80 shadow-md">
            {/* Arrow pointing toward the off-screen office */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              style={{ transform: `rotate(${ind.angle}deg)` }}
            >
              <path
                d="M6 1 L10 10 L6 8 L2 10 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
