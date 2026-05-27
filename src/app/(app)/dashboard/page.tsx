"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAttendances, getOffices } from "@/lib/api/client";
import type { Attendance, Office } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import { DashboardMap } from "@/app/components/dashboard-map";
import { WeeklyChart } from "@/app/components/weekly-chart";
import Link from "next/link";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function statusLabel(status: string) {
  switch (status) {
    case "on_time": return "Tepat Waktu";
    case "late": return "Terlambat";
    case "absent": return "Tidak Hadir";
    case "sick": return "Sakit";
    case "leave": return "Cuti";
    default: return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "on_time": return "text-emerald-600";
    case "late": return "text-amber-500";
    case "absent": return "text-red-500";
    case "sick": return "text-sky-500";
    case "leave": return "text-violet-500";
    default: return "text-taupe-400";
  }
}

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!token) return;

    Promise.all([getAttendances(token), getOffices(token)])
      .then(([att, off]) => {
        setAttendances(att);
        setOffices(off);
      })
      .finally(() => setIsLoading(false));

    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, [token]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const today =
    attendances.find((a) => a.date === todayIso && a.in_at && !a.out_at) ??
    attendances.find((a) => a.date === todayIso);

  // Offices sorted by distance from user, max 5
  const sortedOffices = (() => {
    const filtered = offices.filter((o) =>
      o.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (!userLocation) return filtered.slice(0, 5);
    return [...filtered]
      .map((o) => ({
        office: o,
        distance: haversineDistance(
          userLocation.lat,
          userLocation.lng,
          Number(o.latitude),
          Number(o.longitude),
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
      .map(({ office, distance }) => ({ ...office, _distance: distance }));
  })() as (Office & { _distance?: number })[];

  return (
    <div className="px-5 pt-6 pb-6">
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-sm text-taupe-400">Selamat datang,</p>
        <h1 className="text-xl font-bold text-foreground">{user?.name ?? "—"}</h1>
      </div>

      {/* Search */}
      <div className="mb-5">
        <SearchBar
          id="dashboard-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {/* Report */}
      <section className="mb-6" aria-label="Laporan Absensi">
        <h2 className="mb-3 text-base font-bold text-foreground">Report</h2>

        {isLoading ? (
          <div className="h-[220px] animate-pulse rounded-2xl bg-taupe-100" />
        ) : (
          <div className="rounded-2xl bg-taupe-100 p-4">
            {/* Weekly bar chart */}
            <p className="mb-2 text-xs font-medium text-taupe-400">7 Hari Terakhir</p>
            <div className="h-[120px]">
              <WeeklyChart attendances={attendances} />
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-3">
              {[
                { color: "bg-emerald-500", label: "Hadir" },
                { color: "bg-amber-400", label: "Terlambat" },
                { color: "bg-red-400", label: "Tidak Hadir" },
                { color: "bg-sky-400", label: "Sakit" },
                { color: "bg-violet-500", label: "Cuti" },
                { color: "bg-taupe-200", label: "Tidak Ada Data" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`size-2.5 rounded-sm ${color}`} />
                  <span className="text-[10px] text-taupe-400">{label}</span>
                </div>
              ))}
            </div>

            {/* Today stats */}
            {today && (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-taupe-200 pt-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-taupe-400">Hari ini</p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {today.office?.name ?? `Office #${today.office_id}`}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-taupe-500">
                    <span>Masuk: {formatTime(today.in_at)}</span>
                    <span>
                      Keluar: {today.out_at ? formatTime(today.out_at) : "Belum absen keluar"}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-xs font-semibold ${statusColor(today.status)}`}>
                    {statusLabel(today.status)}
                  </span>
                  {!today.out_at && (
                    <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                      Sedang absen
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Nearby Office */}
      <section aria-label="Kantor Terdekat">
        <h2 className="mb-3 text-base font-bold text-foreground">Nearby Office</h2>

        {/* Map */}
        {isLoading ? (
          <div className="mb-4 h-48 animate-pulse rounded-2xl bg-taupe-100" />
        ) : (
          <div className="mb-4">
            <DashboardMap
              key={`map-${userLocation?.lat?.toFixed(4) ?? "x"}-${offices.map((o) => o.id).join(",")}`}
              offices={offices}
              userLocation={userLocation}
            />
          </div>
        )}

        {/* Office list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-taupe-100" />
            ))}
          </div>
        ) : sortedOffices.length === 0 ? (
          <p className="rounded-2xl bg-taupe-100 px-4 py-8 text-center text-sm text-taupe-400">
            Tidak ada kantor ditemukan
          </p>
        ) : (
          <div id="nearby-office-list" className="space-y-2">
            {sortedOffices.map((office) => {
              const dist = office._distance;
              const withinRadius = dist !== undefined && dist <= office.radius;
              return (
                <Link
                  key={office.id}
                  href={`/office/${office.id}`}
                  id={`office-${office.id}`}
                  className="flex items-center justify-between rounded-2xl bg-taupe-100 px-4 py-3.5 active:bg-taupe-200/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{office.name}</p>
                    {office.address && (
                      <p className="mt-0.5 truncate text-xs text-taupe-400">{office.address}</p>
                    )}
                  </div>
                  {dist !== undefined && (
                    <span
                      className={`ml-3 shrink-0 text-xs font-semibold ${
                        withinRadius ? "text-emerald-600" : "text-taupe-400"
                      }`}
                    >
                      {formatDistance(dist)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
