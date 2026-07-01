"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useAttendances, useOffices } from "@/lib/api/hooks";
import type { Office } from "@/lib/api/types";
import {
  isManualAttendance,
  statusLabel,
  statusTextClass,
} from "@/lib/attendance-status";
import { Button, Card, SearchInput } from "@/components/ui";
import { DashboardMap } from "@/app/components/dashboard-map";
import {
  STATUS_KEYS,
  STATUS_META,
  WeeklyChart,
  type AttendanceStatusKey,
  type ReportStatusFilter,
} from "@/app/components/weekly-chart";
import { AutoHeight } from "@/app/components/auto-height";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { AppPage } from "@/app/components/responsive-layout";
import { MobileDatePicker } from "@/app/components/mobile-date-picker";
import { ChevronBackIcon, ChevronRightIcon, FilterIcon } from "@/components/icons/outline";

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

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const REPORT_FILTERS: { value: ReportStatusFilter; label: string; description: string }[] = [
  { value: "all", label: "Semua Status", description: "Tampilkan semua kategori" },
  ...STATUS_KEYS.map((status) => ({
    value: status,
    label: STATUS_META[status].label,
    description: "Tampilkan kategori ini saja",
  })),
];

type DateRangePreset = "today" | "last_7_days" | "last_30_days" | "custom";
type ReportFilterLevel = "root" | "category" | "date" | "custom";
type CustomDateField = "start" | "end";

const DATE_RANGE_FILTERS: {
  value: DateRangePreset;
  label: string;
  description: string;
}[] = [
  { value: "today", label: "Hari Ini", description: "Data tanggal hari ini saja" },
  { value: "last_7_days", label: "7 Hari Terakhir", description: "Termasuk hari ini" },
  { value: "last_30_days", label: "30 Hari Terakhir", description: "Termasuk hari ini" },
  { value: "custom", label: "Rentang Custom", description: "Pilih tanggal mulai dan akhir" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const isAdministrator = user?.role === "administrator";
  const { data: offices = [], isLoading: loadingOffices } = useOffices({
    active_only: !isAdministrator,
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reportFilterOpen, setReportFilterOpen] = useState(false);
  const [reportFilterLevel, setReportFilterLevel] = useState<ReportFilterLevel>("root");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatusFilter>("all");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last_7_days");
  const [activeCustomDateField, setActiveCustomDateField] = useState<CustomDateField | null>(null);

  const todayIso = toDateKey(new Date());
  const [customStartDate, setCustomStartDate] = useState(todayIso);
  const [customEndDate, setCustomEndDate] = useState(todayIso);

  const reportDateRange = useMemo(() => {
    const today = new Date();
    if (dateRangePreset === "today") {
      return { start_date: todayIso, end_date: todayIso };
    }
    if (dateRangePreset === "last_30_days") {
      return { start_date: toDateKey(addDays(today, -29)), end_date: todayIso };
    }
    if (dateRangePreset === "custom") {
      return { start_date: customStartDate, end_date: customEndDate };
    }
    return { start_date: toDateKey(addDays(today, -6)), end_date: todayIso };
  }, [customEndDate, customStartDate, dateRangePreset, todayIso]);

  const { data: attendances = [], isLoading: loadingAttendances } = useAttendances(reportDateRange);
  const { data: todayAttendances = [], isLoading: loadingTodayAttendances } = useAttendances({
    date: todayIso,
  });
  const isLoading = loadingAttendances || loadingTodayAttendances || loadingOffices;
  const isSearching = search.trim().length > 0;

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const today =
    todayAttendances.find((a) => a.date === todayIso && a.in_at && !a.out_at) ??
    todayAttendances.find((a) => a.date === todayIso);
  const isTodayManual = today ? isManualAttendance(today) : false;

  const reportCounts = useMemo(() => {
    const counts = STATUS_KEYS.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<AttendanceStatusKey, number>,
    );

    attendances.forEach((attendance) => {
      if ((STATUS_KEYS as readonly string[]).includes(attendance.status)) {
        counts[attendance.status as AttendanceStatusKey] += 1;
      }
    });

    return counts;
  }, [attendances]);

  const selectedStatusLabel =
    selectedStatus === "all" ? "Semua Status" : STATUS_META[selectedStatus].label;
  const selectedRangeLabel =
    DATE_RANGE_FILTERS.find((filter) => filter.value === dateRangePreset)?.label ??
    "7 Hari Terakhir";
  const chartAttendances =
    selectedStatus === "all"
      ? attendances
      : attendances.filter((attendance) => attendance.status === selectedStatus);
  const reportFilterActive =
    selectedStatus !== "all" || dateRangePreset !== "last_7_days";

  function closeReportFilter() {
    setReportFilterOpen(false);
    setReportFilterLevel("root");
    setActiveCustomDateField(null);
  }

  function handleCustomDateConfirm(date: string) {
    if (activeCustomDateField === "start") {
      setCustomStartDate(date);
    }
    if (activeCustomDateField === "end") {
      setCustomEndDate(date);
    }
    setActiveCustomDateField(null);
  }

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
    <AppPage size="wide" className="pb-6">
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

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:items-start lg:gap-6">
        <div className="min-w-0">
          {/* Report */}
          {!isSearching && (
            <section className="mb-6" aria-label="Laporan Absensi">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">Report</h2>
            <Button
              id="dashboard-report-filter"
              variant={reportFilterActive ? "primary" : "secondary"}
              size="icon"
              onClick={() => {
                setReportFilterLevel("root");
                setReportFilterOpen(true);
              }}
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
                  <p className="text-xs font-medium text-taupe-400">{selectedRangeLabel}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {selectedStatusLabel}
                  </p>
                </div>
                <span className="rounded-full bg-taupe-50 px-3 py-1 text-[10px] font-semibold text-taupe-500 ring-1 ring-taupe-200">
                  {chartAttendances.length} data
                </span>
              </div>

              <div className="h-[170px]">
                <WeeklyChart
                  attendances={attendances}
                  selectedStatus={selectedStatus}
                  startDate={reportDateRange.start_date}
                  endDate={reportDateRange.end_date}
                />
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

              {/* Today stats */}
              {today && (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-taupe-200 pt-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs text-taupe-400">Hari ini</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {today.office?.name ??
                        (isTodayManual ? "Input Manual" : `Office #${today.office_id}`)}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-taupe-500">
                      {isTodayManual ? (
                        <span>Tidak memerlukan waktu absen</span>
                      ) : (
                        <>
                          <span>Masuk: {formatTime(today.in_at)}</span>
                          <span>
                            Keluar: {today.out_at ? formatTime(today.out_at) : "Belum absen keluar"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-xs font-semibold ${statusTextClass(today.status)}`}>
                      {statusLabel(today.status)}
                    </span>
                    {!isTodayManual && !today.out_at && (
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
          )}

          <BottomSheet
        open={reportFilterOpen}
        onClose={closeReportFilter}
        title={
          reportFilterLevel === "category"
            ? "Kategori"
            : reportFilterLevel === "date"
              ? "Rentang Tanggal"
              : reportFilterLevel === "custom"
                ? "Rentang Custom"
                : "Filter Laporan"
        }
      >
        <AutoHeight
          className="px-2 pb-2"
          deps={[
            reportFilterLevel,
            customStartDate,
            customEndDate,
            customStartDate > customEndDate,
          ]}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={reportFilterLevel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              {reportFilterLevel !== "root" && (
                <button
                  type="button"
                  onClick={() => setReportFilterLevel("root")}
                  className="mb-2 flex h-11 items-center gap-2 rounded-2xl px-3 text-sm font-medium text-taupe-500 transition-colors active:bg-taupe-50"
                >
                  <ChevronBackIcon className="size-5" strokeWidth={2} />
                  Kembali
                </button>
              )}

              {reportFilterLevel === "root" && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setReportFilterLevel("category")}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition-colors active:bg-taupe-50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                      <span className="size-2.5 rounded-full bg-primary" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block font-medium text-foreground">Kategori</span>
                      <span className="block text-xs text-taupe-400">{selectedStatusLabel}</span>
                    </span>
                    <ChevronRightIcon className="size-5 text-taupe-400" strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportFilterLevel("date")}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition-colors active:bg-taupe-50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                      <span className="size-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block font-medium text-foreground">Rentang Tanggal</span>
                      <span className="block text-xs text-taupe-400">{selectedRangeLabel}</span>
                    </span>
                    <ChevronRightIcon className="size-5 text-taupe-400" strokeWidth={2} />
                  </button>
                </div>
              )}

              {reportFilterLevel === "category" && (
                <div className="space-y-1">
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
                          setReportFilterLevel("root");
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
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
              )}

              {reportFilterLevel === "date" && (
                <div className="space-y-1">
                  {DATE_RANGE_FILTERS.map((filter) => {
                    const selected = dateRangePreset === filter.value;
                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => {
                          if (filter.value === "custom") {
                            setReportFilterLevel("custom");
                            return;
                          }
                          setDateRangePreset(filter.value);
                          setReportFilterLevel("root");
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                          <span className="size-2.5 rounded-full bg-emerald-500" />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block font-medium text-foreground">
                            {filter.label}
                          </span>
                          <span className="block text-xs text-taupe-400">
                            {filter.description}
                          </span>
                        </span>
                        {filter.value === "custom" ? (
                          <ChevronRightIcon className="size-5 text-taupe-400" strokeWidth={2} />
                        ) : selected ? (
                          <span className="size-2 rounded-full bg-primary" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {reportFilterLevel === "custom" && (
                <div className="space-y-4 px-2 pb-1">
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveCustomDateField("start")}
                      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-taupe-200 transition-shadow active:bg-taupe-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">Tanggal Mulai</span>
                        <span className="mt-0.5 block truncate text-xs text-taupe-400">
                          {formatDisplayDate(customStartDate)}
                        </span>
                      </span>
                      <ChevronRightIcon className="size-5 shrink-0 text-taupe-400" strokeWidth={2} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCustomDateField("end")}
                      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-taupe-200 transition-shadow active:bg-taupe-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">Tanggal Akhir</span>
                        <span className="mt-0.5 block truncate text-xs text-taupe-400">
                          {formatDisplayDate(customEndDate)}
                        </span>
                      </span>
                      <ChevronRightIcon className="size-5 shrink-0 text-taupe-400" strokeWidth={2} />
                    </button>
                  </div>
                  {customStartDate > customEndDate && (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                      Tanggal mulai tidak boleh lebih besar dari tanggal akhir.
                    </p>
                  )}
                  <Button
                    variant="primary"
                    fullWidth
                    className="h-12"
                    disabled={customStartDate > customEndDate}
                    onClick={() => {
                      setDateRangePreset("custom");
                      setReportFilterLevel("root");
                    }}
                  >
                    Terapkan
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </AutoHeight>
      </BottomSheet>

      <MobileDatePicker
        open={activeCustomDateField !== null}
        value={activeCustomDateField === "end" ? customEndDate : customStartDate}
        maxDate={todayIso}
        title={activeCustomDateField === "end" ? "Pilih Tanggal Akhir" : "Pilih Tanggal Mulai"}
        onClose={() => setActiveCustomDateField(null)}
        onConfirm={handleCustomDateConfirm}
          />

          {/* Nearby Office */}
        </div>
        <section className="min-w-0" aria-label="Kantor Terdekat">
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
    </AppPage>
  );
}
