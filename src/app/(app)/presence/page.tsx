"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, checkOut, getAttendances } from "@/lib/api/client";
import type { Attendance } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons/outline";

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

function statusColor(status: string) {
  switch (status) {
    case "present":
    case "on_time":
      return "text-emerald-600";
    case "late":
      return "text-amber-600";
    case "absent":
      return "text-red-500";
    default:
      return "text-taupe-400";
  }
}

export default function PresencePage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState("");

  function loadAttendances() {
    if (!token) return;
    getAttendances(token)
      .then(setAttendances)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const today = new Date().toISOString().slice(0, 10);
  const activeCheckIn = attendances.find(
    (a) => a.date === today && a.in_at && !a.out_at,
  ) ?? null;

  async function handleCheckOut() {
    if (!token || !activeCheckIn) return;
    setIsCheckingOut(true);
    setCheckOutError("");
    try {
      await checkOut(token, activeCheckIn.id);
      setIsLoading(true);
      loadAttendances();
    } catch (err) {
      setCheckOutError(err instanceof ApiError ? err.message : "Gagal absen keluar.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  const filtered = attendances.filter(
    (a) =>
      a.date.includes(search) ||
      a.office?.name?.toLowerCase().includes(search.toLowerCase()) ||
      statusLabel(a.status).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-5 pt-6">
      <h1 className="mb-5 text-xl font-bold text-foreground">
        Presence History
      </h1>

      {/* Active check-in banner */}
      {activeCheckIn && (
        <div className="mb-5 overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Sedang Absen
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {activeCheckIn.office?.name ?? `Office #${activeCheckIn.office_id}`}
              </p>
              <p className="text-xs text-emerald-600">
                Masuk: {formatTime(activeCheckIn.in_at)}
              </p>
            </div>
            <button
              onClick={handleCheckOut}
              disabled={isCheckingOut}
              className="shrink-0 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 active:opacity-80"
            >
              {isCheckingOut ? "Memproses..." : "Absen Keluar"}
            </button>
          </div>
          {checkOutError && (
            <p className="border-t border-emerald-100 px-4 py-2 text-xs text-red-500">
              {checkOutError}
            </p>
          )}
        </div>
      )}

      <div className="mb-5">
        <SearchBar
          id="presence-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-taupe-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400">
          {search ? "Tidak ada hasil ditemukan" : "Belum ada riwayat absensi"}
        </p>
      ) : (
        <div id="presence-list">
          {filtered.map((attendance, index) => (
            <Link
              key={attendance.id}
              href={`/presence/${attendance.id}`}
              id={`attendance-${attendance.id}`}
              className={`flex items-center justify-between gap-3 py-3.5 active:opacity-70 transition-opacity ${
                index < filtered.length - 1 ? "border-b border-taupe-200/60" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {attendance.office?.name ?? `Office #${attendance.office_id}`}
                </p>
                <p className="mt-0.5 text-xs text-taupe-400">
                  {formatDate(attendance.date)}
                </p>
                <div className="mt-1 flex gap-3 text-xs text-taupe-400">
                  <span>Masuk: {formatTime(attendance.in_at)}</span>
                  <span>Keluar: {formatTime(attendance.out_at)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-xs font-semibold ${statusColor(attendance.status)}`}>
                  {statusLabel(attendance.status)}
                </span>
                <ChevronRightIcon strokeWidth={2.5} className="size-4 text-taupe-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
