"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAttendances } from "@/lib/api/client";
import type { Attendance } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

export default function PresencePage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    getAttendances(token)
      .then(setAttendances)
      .finally(() => setIsLoading(false));
  }, [token]);

  const filtered = attendances.filter(
    (a) =>
      a.date.includes(search) ||
      a.office?.name?.toLowerCase().includes(search.toLowerCase()) ||
      statusLabel(a.status).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-5 pt-7">
      <h1 className="mb-5 text-xl font-semibold text-foreground tracking-tight">
        Presence History
      </h1>

      <div className="mb-5">
        <SearchBar
          id="presence-search"
          value={search}
          onChange={setSearch}
          placeholder="Cari absensi..."
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-warm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          {search ? "Tidak ada hasil ditemukan" : "Belum ada riwayat absensi"}
        </p>
      ) : (
        <div id="presence-list" className="card-soft overflow-hidden">
          {filtered.map((attendance, index) => (
            <div
              key={attendance.id}
              id={`attendance-${attendance.id}`}
              className={`px-4 py-4 ${index < filtered.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {attendance.office?.name ?? `Office #${attendance.office_id}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(attendance.date)}
                  </p>
                  <div className="mt-1.5 flex gap-3 text-xs text-muted">
                    <span>Masuk: {formatTime(attendance.in_at)}</span>
                    <span>Keluar: {formatTime(attendance.out_at)}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(attendance.status)}`}
                >
                  {statusLabel(attendance.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
