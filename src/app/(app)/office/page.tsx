"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOffices } from "@/lib/api/hooks";
import type { Office } from "@/lib/api/types";
import { Button, Card, SearchInput } from "@/components/ui";
import { ChevronRightIcon } from "@/components/icons/outline";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function OfficePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const isAdministrator = user?.role === "administrator";
  const { data: offices = [], isLoading } = useOffices(
    undefined,
    !isAdministrator,
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // Request geolocation once on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  const filtered = (() => {
    const searchTerm = search.toLowerCase();
    const list = offices.filter(
      (o) =>
        o.name.toLowerCase().includes(searchTerm) ||
        (o.address ?? "").toLowerCase().includes(searchTerm),
    );

    if (!userLocation) return list;

    return list
      .map((office) => ({
        ...office,
        _distance: haversineDistance(
          userLocation.lat,
          userLocation.lng,
          Number(office.latitude),
          Number(office.longitude),
        ),
      }))
      .sort((a, b) => a._distance - b._distance);
  })() as (Office & { _distance?: number })[];

  return (
    <div className="px-5 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Office</h1>
        {isAdministrator && (
          <Button href="/office/create" variant="primary" size="sm">
            + Create
          </Button>
        )}
      </div>

      <div className="mb-5">
        <SearchInput
          id="office-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400">
          {search ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        </p>
      ) : (
        <div id="office-list" className="space-y-2">
          {filtered.map((office) => {
            const inactive = !office.is_active;

            return (
              <Card
                key={office.id}
                href={`/office/${office.id}`}
                id={`office-item-${office.id}`}
                className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
                  inactive ? "opacity-55" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {office.name}
                    </p>
                    {inactive && (
                      <span className="shrink-0 rounded-full bg-taupe-100 px-2 py-0.5 text-[10px] font-semibold text-taupe-500">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  {office.address && (
                    <p className="mt-0.5 truncate text-xs text-taupe-400">
                      {office.address}
                    </p>
                  )}
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  {office._distance !== undefined && (
                    <span
                      className={`text-xs font-semibold ${
                        office._distance <= office.radius
                          ? "text-emerald-600"
                          : "text-taupe-400"
                      }`}
                    >
                      {formatDistance(office._distance)}
                    </span>
                  )}
                  <ChevronRightIcon
                    strokeWidth={2.5}
                    className="size-4 shrink-0 text-taupe-300"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
