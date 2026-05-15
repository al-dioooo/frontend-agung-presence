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
    case "late":
      return "Terlambat";
    case "absent":
      return "Tidak Hadir";
    default:
      return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "present":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "late":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    case "absent":
      return "bg-red-50 text-red-600 border border-red-100";
    default:
      return "bg-surface-warm text-muted border border-border";
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
    <div className="px-5 pt-7">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted">Selamat datang,</p>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {user?.name ?? "—"}
        </h1>
      </div>

      {/* Search */}
      <div className="mb-7">
        <SearchBar
          id="dashboard-search"
          value={search}
          onChange={setSearch}
          placeholder="Cari kantor..."
        />
      </div>

      {/* Report Section */}
      <section className="mb-7" aria-label="Laporan Absensi">
        <h2 className="mb-3.5 text-base font-semibold text-foreground">Report</h2>
        <div className="grid grid-cols-2 gap-3.5">
          {/* Today */}
          <div id="report-today" className="card-soft p-4">
            <p className="mb-2.5 text-xs font-medium text-muted uppercase tracking-wider">
              Today&apos;s Presence
            </p>
            {isLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-surface-warm" />
            ) : today ? (
              <>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(today.status)}`}
                >
                  {statusLabel(today.status)}
                </span>
                <div className="mt-2.5 space-y-0.5 text-xs text-muted">
                  <p>Masuk: {formatTime(today.in_at)}</p>
                  <p>Keluar: {formatTime(today.out_at)}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Belum ada absensi</p>
            )}
          </div>

          {/* Weekly */}
          <div id="report-weekly" className="card-soft p-4">
            <p className="mb-2.5 text-xs font-medium text-muted uppercase tracking-wider">
              Weekly Presence
            </p>
            {isLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-surface-warm" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {thisWeek.filter((a) => a.status === "present" || a.status === "late").length}
                </p>
                <p className="text-xs text-muted">dari {thisWeek.length} hari</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Nearby Office */}
      <section aria-label="Kantor Terdekat">
        <h2 className="mb-3.5 text-base font-semibold text-foreground">
          Nearby Office
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-surface-warm"
              />
            ))}
          </div>
        ) : filteredOffices.length === 0 ? (
          <p className="card-soft px-4 py-8 text-center text-sm text-muted">
            Tidak ada kantor ditemukan
          </p>
        ) : (
          <div id="nearby-office-list" className="card-soft overflow-hidden">
            {filteredOffices.map((office, index) => (
              <Link
                key={office.id}
                href={`/office/${office.id}`}
                id={`office-${office.id}`}
                className={`flex items-center justify-between px-4 py-4 transition-colors active:bg-surface-warm ${
                  index < filteredOffices.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {office.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted truncate">
                    {office.address}
                  </p>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="size-4 shrink-0 text-muted/50 ml-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
