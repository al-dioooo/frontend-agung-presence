"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, checkOut, getAttendances } from "@/lib/api/client";
import type { Attendance } from "@/lib/api/types";
import { SearchBar } from "@/app/components/search-bar";
import Link from "next/link";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { ChevronRightIcon, UserIcon } from "@/components/icons/outline";

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
    case "on_time":
      return "Tepat Waktu";
    case "late":
      return "Terlambat";
    case "absent":
      return "Tidak Hadir";
    case "sick":
      return "Sakit";
    case "leave":
      return "Cuti";
    default:
      return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "on_time":
      return "text-emerald-600";
    case "late":
      return "text-amber-600";
    case "absent":
      return "text-red-500";
    case "sick":
      return "text-sky-500";
    case "leave":
      return "text-violet-500";
    default:
      return "text-taupe-400";
  }
}

export default function PresencePage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState("");
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const isAdministrator = user?.role === "administrator";

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
    (a) => !isAdministrator && a.date === today && a.in_at && !a.out_at,
  ) ?? null;

  const userOptions = Array.from(
    attendances.reduce((map, attendance) => {
      if (attendance.user) {
        map.set(attendance.user.id, attendance.user);
      }
      return map;
    }, new Map<number, NonNullable<Attendance["user"]>>()).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const selectedUser = userOptions.find((option) => option.id === selectedUserId);

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

  const filtered = attendances.filter((a) => {
    if (isAdministrator && selectedUserId !== null && a.user_id !== selectedUserId) {
      return false;
    }

    const searchTerm = search.toLowerCase();
    return (
      a.date.includes(searchTerm) ||
      a.office?.name?.toLowerCase().includes(searchTerm) ||
      a.user?.name.toLowerCase().includes(searchTerm) ||
      a.user?.username.toLowerCase().includes(searchTerm) ||
      a.user?.email.toLowerCase().includes(searchTerm) ||
      statusLabel(a.status).toLowerCase().includes(searchTerm)
    );
  });

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

      <div className="mb-5 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchBar
            id="presence-search"
            value={search}
            onChange={setSearch}
            placeholder="Search"
          />
        </div>
        {isAdministrator && (
          <button
            type="button"
            onClick={() => setUserFilterOpen(true)}
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ring-1 transition-colors active:opacity-70 ${
              selectedUserId
                ? "bg-foreground text-white ring-foreground"
                : "bg-white text-foreground ring-taupe-200"
            }`}
            aria-label="Filter karyawan"
          >
            <UserIcon className="size-5" />
          </button>
        )}
      </div>

      {isAdministrator && selectedUser && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-taupe-100 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {selectedUser.name}
            </p>
            <p className="truncate text-[10px] text-taupe-400">
              @{selectedUser.username}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className="ml-3 text-xs font-semibold text-taupe-500 active:opacity-70"
          >
            Reset
          </button>
        </div>
      )}

      <BottomSheet
        open={userFilterOpen}
        onClose={() => setUserFilterOpen(false)}
        title="Filter Karyawan"
      >
        <div className="max-h-[55vh] overflow-y-auto px-2 pb-2">
          <button
            type="button"
            onClick={() => {
              setSelectedUserId(null);
              setUserFilterOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
              <UserIcon className="size-4 text-taupe-400" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-medium text-foreground">Semua karyawan</p>
              <p className="text-xs text-taupe-400">Tampilkan semua riwayat</p>
            </div>
            {selectedUserId === null && (
              <span className="size-2 rounded-full bg-foreground" />
            )}
          </button>
          {userOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSelectedUserId(option.id);
                setUserFilterOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                <UserIcon className="size-4 text-taupe-400" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-foreground">{option.name}</p>
                <p className="truncate text-xs text-taupe-400">
                  @{option.username} · {option.email}
                </p>
              </div>
              {selectedUserId === option.id && (
                <span className="size-2 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

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
                {isAdministrator && attendance.user && (
                  <p className="mb-0.5 truncate text-xs font-semibold text-foreground">
                    {attendance.user.name}
                  </p>
                )}
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
