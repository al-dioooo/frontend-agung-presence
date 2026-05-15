"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAttendances, getOffices } from "@/lib/api/client";
import type { Attendance, Office } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import Link from "next/link";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
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
      return "bg-gray-100 text-gray-700";
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
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="mb-5">
        <p className="text-sm text-gray-500">Selamat datang,</p>
        <h1 className="text-xl font-semibold text-gray-900">
          {user?.name ?? "—"}
        </h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          id="dashboard-search"
          value={search}
          onChange={setSearch}
          placeholder="Cari kantor..."
        />
      </div>

      {/* Report Section */}
      <section className="mb-6" aria-label="Laporan Absensi">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Report</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Today */}
          <div
            id="report-today"
            className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
          >
            <p className="mb-2 text-xs font-medium text-gray-500">
              Today&apos;s Presence
            </p>
            {isLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
            ) : today ? (
              <>
                <p
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(today.status)}`}
                >
                  {statusLabel(today.status)}
                </p>
                <div className="mt-2 space-y-0.5 text-xs text-gray-600">
                  <p>Masuk: {formatTime(today.in_at)}</p>
                  <p>Keluar: {formatTime(today.out_at)}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Belum ada absensi</p>
            )}
          </div>

          {/* Weekly */}
          <div
            id="report-weekly"
            className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
          >
            <p className="mb-2 text-xs font-medium text-gray-500">
              Weekly Presence
            </p>
            {isLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">
                  {thisWeek.filter((a) => a.status === "present" || a.status === "late").length}
                </p>
                <p className="text-xs text-gray-500">dari {thisWeek.length} hari</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Nearby Office */}
      <section aria-label="Kantor Terdekat">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Nearby Office
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : filteredOffices.length === 0 ? (
          <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
            Tidak ada kantor ditemukan
          </p>
        ) : (
          <div
            id="nearby-office-list"
            className="overflow-hidden rounded-2xl border border-gray-100"
          >
            {filteredOffices.map((office) => (
              <Link
                key={office.id}
                href={`/office/${office.id}`}
                id={`office-${office.id}`}
                className="flex items-center justify-between border-b border-gray-100 px-4 py-4 last:border-b-0 active:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {office.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {office.address}
                  </p>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="size-4 shrink-0 text-gray-300"
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
