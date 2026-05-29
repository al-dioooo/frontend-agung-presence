"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getOffices } from "@/lib/api/client";
import type { Office } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
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
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const isAdministrator = user?.role === "administrator";

  useEffect(() => {
    if (!token) return;

    getOffices(token)
      .then(setOffices)
      .finally(() => setIsLoading(false));

    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, [token]);

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
          <Link
            href="/office/create"
            className="flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white transition-opacity active:opacity-80"
          >
            + Create
          </Link>
        )}
      </div>

      <div className="mb-5">
        <SearchBar
          id="office-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-taupe-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400">
          {search ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        </p>
      ) : (
        <div id="office-list">
          {filtered.map((office, index) => (
            <Link
              key={office.id}
              href={`/office/${office.id}`}
              id={`office-item-${office.id}`}
              className={`flex items-center justify-between py-3.5 ${
                index < filtered.length - 1 ? "border-b border-taupe-200/60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {office.name}
                </p>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
