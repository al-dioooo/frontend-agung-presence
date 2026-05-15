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
      return "bg-green-100 text-green-700";
    case "late":
      return "bg-yellow-100 text-yellow-700";
    case "absent":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
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
    <div className="px-4 pt-6">
      <h1 className="mb-5 text-xl font-semibold text-gray-900">
        Presence History
      </h1>

      <div className="mb-4">
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
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">
          {search ? "Tidak ada hasil ditemukan" : "Belum ada riwayat absensi"}
        </p>
      ) : (
        <div
          id="presence-list"
          className="overflow-hidden rounded-2xl border border-gray-100"
        >
          {filtered.map((attendance, index) => (
            <div
              key={attendance.id}
              id={`attendance-${attendance.id}`}
              className={`px-4 py-4 ${index < filtered.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {attendance.office?.name ?? `Office #${attendance.office_id}`}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDate(attendance.date)}
                  </p>
                  <div className="mt-1.5 flex gap-3 text-xs text-gray-500">
                    <span>Masuk: {formatTime(attendance.in_at)}</span>
                    <span>Keluar: {formatTime(attendance.out_at)}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(attendance.status)}`}
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
