"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAttendances, getOffices } from "@/lib/api/client";
import type { Attendance, Office } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import Link from "next/link";

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "present":
      return "Hadir";
    case "on_time":
      return "Tepat Waktu";
    case "late":
      return "Terlambat";
    case "absent":
      return "Tidak Hadir";
    default:
      return status;
  }
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    Promise.all([getAttendances(token), getOffices(token)])
      .then(([att, off]) => {
        setAttendances(att);
        setOffices(off);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const today = attendances.find(
    (a) => a.date === new Date().toISOString().slice(0, 10),
  );

  const thisWeek = attendances.slice(0, 7);

  const filteredOffices = offices.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-5 pt-6">
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-sm text-taupe-400">Selamat datang,</p>
        <h1 className="text-xl font-bold text-foreground">
          {user?.name ?? "—"}
        </h1>
      </div>

      {/* Search */}
      <div className="mb-6">
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
        {/* Horizontally scrollable cards */}
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 snap-x">
          {/* Today's Presence */}
          <div
            id="report-today"
            className="min-w-[220px] flex-shrink-0 rounded-2xl bg-taupe-100 p-5 snap-start"
          >
            {isLoading ? (
              <div className="h-20 animate-pulse rounded-lg bg-taupe-200" />
            ) : today ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  {statusLabel(today.status)}
                </p>
                <div className="mt-3 space-y-0.5 text-xs text-taupe-500">
                  <p>Masuk: {formatTime(today.in_at)}</p>
                  <p>Keluar: {formatTime(today.out_at)}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-taupe-400">Belum ada absensi</p>
            )}
            <p className="mt-4 text-xs text-taupe-400">Today&apos;s Presence</p>
          </div>

          {/* Weekly Presence */}
          <div
            id="report-weekly"
            className="min-w-[220px] flex-shrink-0 rounded-2xl bg-taupe-100 p-5 snap-start"
          >
            {isLoading ? (
              <div className="h-20 animate-pulse rounded-lg bg-taupe-200" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {thisWeek.filter((a) => a.status === "present" || a.status === "on_time" || a.status === "late").length}
                </p>
                <p className="text-xs text-taupe-500">dari {thisWeek.length} hari</p>
              </>
            )}
            <p className="mt-4 text-xs text-taupe-400">Weekly Presence</p>
          </div>
        </div>
      </section>

      {/* Nearby Office */}
      <section aria-label="Kantor Terdekat">
        <h2 className="mb-3 text-base font-bold text-foreground">
          Nearby Office
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-taupe-100"
              />
            ))}
          </div>
        ) : filteredOffices.length === 0 ? (
          <p className="rounded-2xl bg-taupe-100 px-4 py-8 text-center text-sm text-taupe-400">
            Tidak ada kantor ditemukan
          </p>
        ) : (
          <div id="nearby-office-list" className="space-y-3">
            {filteredOffices.map((office) => (
              <Link
                key={office.id}
                href={`/office/${office.id}`}
                id={`office-${office.id}`}
                className="block rounded-2xl bg-taupe-100 p-5 active:bg-taupe-200/60 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">
                  {office.name}
                </p>
                <p className="mt-0.5 text-xs text-taupe-400">
                  {office.address}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
