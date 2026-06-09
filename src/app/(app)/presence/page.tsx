"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useAttendances } from "@/lib/api/hooks";
import { mutateCheckOut } from "@/lib/api/mutations";
import type { Attendance } from "@/lib/api/types";
import { Button, Card, SearchInput } from "@/components/ui";
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
  const { data: attendances = [], isLoading } = useAttendances();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState("");
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const isAdministrator = user?.role === "administrator";

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
      await mutateCheckOut(token, activeCheckIn.id, {
        currentList: attendances,
      });
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
            <Button
              variant="success"
              className="shrink-0"
              onClick={handleCheckOut}
              loading={isCheckingOut}
              loadingText="Memproses..."
            >
              Absen Keluar
            </Button>
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
          <SearchInput
            id="presence-search"
            value={search}
            onChange={setSearch}
            placeholder="Search"
          />
        </div>
        {isAdministrator && (
          <Button
            variant={selectedUserId ? "primary" : "secondary"}
            size="icon"
            onClick={() => setUserFilterOpen(true)}
            aria-label="Filter karyawan"
          >
            <UserIcon className="size-5" />
          </Button>
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
              <span className="size-2 rounded-full bg-primary" />
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
                <span className="size-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400">
          {search ? "Tidak ada hasil ditemukan" : "Belum ada riwayat absensi"}
        </p>
      ) : (
        <div id="presence-list" className="space-y-2">
          {filtered.map((attendance) => (
            <Card
              key={attendance.id}
              href={`/presence/${attendance.id}`}
              id={`attendance-${attendance.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
