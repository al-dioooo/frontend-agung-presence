"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAttendances, useOffices } from "@/lib/api/hooks";
import type { Office } from "@/lib/api/types";
import { Button, Card, SearchInput } from "@/components/ui";
import { DashboardMap } from "@/app/components/dashboard-map";
import {
  STATUS_KEYS,
  STATUS_META,
  WeeklyChart,
  type AttendanceStatusKey,
  type ReportStatusFilter,
} from "@/app/components/weekly-chart";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { FilterIcon } from "@/components/icons/outline";

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

const REPORT_FILTERS: { value: ReportStatusFilter; label: string; description: string }[] = [
  { value: "all", label: "Semua Status", description: "Tampilkan semua kategori" },
  ...STATUS_KEYS.map((status) => ({
    value: status,
    label: STATUS_META[status].label,
    description: "Tampilkan kategori ini saja",
  })),
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: attendances = [], isLoading: loadingAttendances } = useAttendances();
  const isAdministrator = user?.role === "administrator";
  const { data: offices = [], isLoading: loadingOffices } = useOffices(
    undefined,
    !isAdministrator,
  );
  const isLoading = loadingAttendances || loadingOffices;
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reportFilterOpen, setReportFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatusFilter>("all");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const today =
    attendances.find((a) => a.date === todayIso && a.in_at && !a.out_at) ??
    attendances.find((a) => a.date === todayIso);

  const reportCounts = useMemo(() => {
    const counts: Record<AttendanceStatusKey, number> = {
      on_time: 0,
      late: 0,
      absent: 0,
      sick: 0,
      leave: 0,
    };

    attendances.forEach((attendance) => {
      if ((STATUS_KEYS as readonly string[]).includes(attendance.status)) {
        counts[attendance.status as AttendanceStatusKey] += 1;
      }
    });

    return counts;
  }, [attendances]);

  const selectedStatusLabel =
    selectedStatus === "all" ? "Semua Status" : STATUS_META[selectedStatus].label;

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
        <SearchInput
          id="dashboard-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {/* Report */}
      <section className="mb-6" aria-label="Laporan Absensi">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">Report</h2>
          <Button
            id="dashboard-report-filter"
            variant={selectedStatus === "all" ? "secondary" : "primary"}
            size="icon"
            onClick={() => setReportFilterOpen(true)}
            aria-label="Filter laporan"
          >
            <FilterIcon className="size-5" strokeWidth={2} />
          </Button>
        </div>

        {isLoading ? (
          <div className="h-[220px] animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
        ) : (
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-taupe-400">7 Hari Terakhir</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {selectedStatusLabel}
                </p>
              </div>
              <span className="rounded-full bg-taupe-50 px-3 py-1 text-[10px] font-semibold text-taupe-500 ring-1 ring-taupe-200">
                {attendances.length} data
              </span>
            </div>

            <div className="h-[170px]">
              <WeeklyChart attendances={attendances} selectedStatus={selectedStatus} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {STATUS_KEYS.map((status) => {
                const selected = selectedStatus === status;
                return (
                  <div
                    key={status}
                    className={`rounded-2xl bg-taupe-50 px-3 py-2 ring-1 transition-colors ${
                      selected ? "ring-primary" : "ring-taupe-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_META[status].color }}
                      />
                      <span className="min-w-0 truncate text-[10px] font-medium text-taupe-500">
                        {STATUS_META[status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-bold leading-none text-foreground">
                      {reportCounts[status]}
                    </p>
                  </div>
                );
              })}
            </div>

            <BottomSheet
              open={reportFilterOpen}
              onClose={() => setReportFilterOpen(false)}
              title="Filter Laporan"
            >
              <div className="px-2 pb-2">
                {REPORT_FILTERS.map((filter) => {
                  const selected = selectedStatus === filter.value;
                  const color =
                    filter.value === "all" ? "#0f172a" : STATUS_META[filter.value].color;
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(filter.value);
                        setReportFilterOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50"
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100"
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block font-medium text-foreground">
                          {filter.label}
                        </span>
                        <span className="block text-xs text-taupe-400">
                          {filter.description}
                        </span>
                      </span>
                      {selected && <span className="size-2 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>
            </BottomSheet>

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
          </Card>
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
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
            ))}
          </div>
        ) : sortedOffices.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-taupe-400 ring-1 ring-taupe-200 shadow-sm">
            Tidak ada kantor ditemukan
          </p>
        ) : (
          <div id="nearby-office-list" className="space-y-2">
            {sortedOffices.map((office) => {
              const dist = office._distance;
              const withinRadius = dist !== undefined && dist <= office.radius;
              return (
                <Card
                  key={office.id}
                  href={`/office/${office.id}`}
                  id={`office-${office.id}`}
                  className="flex items-center justify-between px-4 py-3.5"
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
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
