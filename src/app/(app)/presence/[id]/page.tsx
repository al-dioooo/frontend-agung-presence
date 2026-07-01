"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useAttendance } from "@/lib/api/hooks";
import { mutateCheckOut } from "@/lib/api/mutations";
import {
  isManualAttendance,
  statusBadgeClass,
  statusLabel,
} from "@/lib/attendance-status";
import {
  formatDateKey,
  formatRequestDateRange,
  formatRequestWorkdayTotal,
  getRequestWorkdayCount,
} from "@/lib/request-dates";
import {
  ChevronBackIcon,
  EnterpriseIcon,
  DatabaseIcon,
  ClockDownIcon,
  ClockUpIcon,
  CurrentLocationIcon,
  UserIcon,
  MailIcon,
} from "@/components/icons/outline";
import { Button, Card } from "@/components/ui";
import { StaticLocationMap } from "@/app/components/static-location-map";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 break-words text-xs text-taupe-400">{value}</p>
      </div>
    </div>
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PresenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();

  const { data: attendance, isLoading, error } = useAttendance(id);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-taupe-400">{error?.message || "Data tidak ditemukan."}</p>
        <Button
          variant="link"
          className="mt-4"
          onClick={() => router.back()}
        >
          Kembali
        </Button>
      </div>
    );
  }

  const hasCoords =
    attendance.in_latitude !== null && attendance.in_longitude !== null;
  const isAdministrator = user?.role === "administrator";
  const isManual = isManualAttendance(attendance);
  const canCheckOut = !isManual && attendance.in_at !== null && attendance.out_at === null;
  const officeLabel =
    attendance.office?.name ??
    (isManual ? "Input Manual" : `Office #${attendance.office_id}`);
  const request = attendance.attendance_request;
  const requestDateRange = request ? formatRequestDateRange(request) : "";

  async function handleCheckOut() {
    if (!token || !attendance || !canCheckOut) return;

    setIsCheckingOut(true);
    setCheckOutError("");
    try {
      await mutateCheckOut(token, attendance.id);
    } catch (err) {
      setCheckOutError(
        err instanceof ApiError ? err.message : "Gagal absen keluar.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col lg:px-10 lg:py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 lg:px-0 lg:pt-0">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronBackIcon className="size-6" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">Detail Absensi</h1>
        <div className="size-11" aria-hidden="true" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`flex-1 space-y-5 px-5 lg:grid lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0 lg:px-0 ${canCheckOut ? "pb-32 lg:pb-8" : "pb-8"}`}
      >
        {/* Proof photo */}
        <div className="space-y-5 lg:sticky lg:top-8">
          <div
            className={`relative h-64 overflow-hidden rounded-2xl bg-taupe-100 lg:h-[420px] ${attendance.proof_photo ? "cursor-zoom-in" : ""}`}
            onClick={() => attendance.proof_photo && setPhotoOpen(true)}
          >
            {attendance.proof_photo ? (
              <Image
                src={attendance.proof_photo}
                alt="Bukti absensi"
                fill
                unoptimized
                className="object-cover transition-opacity active:opacity-80"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <DatabaseIcon className="size-10 text-taupe-300" />
                <p className="text-xs text-taupe-400">Tidak ada foto bukti</p>
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-taupe-400">
              {formatDate(attendance.date)}
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(attendance.status)}`}
            >
              {statusLabel(attendance.status)}
            </span>
          </div>
        </div>

        {/* Full-image preview modal */}
        <AnimatePresence>
          {photoOpen && attendance.proof_photo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
              onClick={() => setPhotoOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.92 }}
                transition={{ duration: 0.2 }}
                className="relative max-h-[90dvh] max-w-[95vw]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attendance.proof_photo}
                  alt="Bukti absensi"
                  className="max-h-[90dvh] max-w-[95vw] rounded-xl object-contain"
                />
              </motion.div>

              {/* Close tap area hint */}
              <button
                type="button"
                onClick={() => setPhotoOpen(false)}
                className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-opacity active:opacity-70"
                aria-label="Tutup preview"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info rows */}
        <div className="space-y-4">
          {isAdministrator && attendance.user && (
            <Card className="p-4 space-y-4" aria-label="Informasi karyawan">
              <h3 className="text-sm font-bold text-foreground">Informasi Karyawan</h3>
              <InfoRow
                icon={<UserIcon className="size-[18px] text-taupe-400" />}
                label="Nama"
                value={attendance.user.name}
              />
              <InfoRow
                icon={<UserIcon className="size-[18px] text-taupe-400" />}
                label="Username"
                value={`@${attendance.user.username}`}
              />
              <InfoRow
                icon={<MailIcon className="size-[18px] text-taupe-400" />}
                label="Email"
                value={attendance.user.email}
              />
            </Card>
          )}

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Informasi Absensi</h3>
            <InfoRow
              icon={<EnterpriseIcon className="size-[18px] text-taupe-400" />}
              label="Kantor"
              value={officeLabel}
            />

            <InfoRow
              icon={<ClockDownIcon className="size-[18px] text-taupe-400" />}
              label="Waktu Masuk"
              value={isManual ? "Tidak diperlukan" : formatDateTime(attendance.in_at)}
            />

            <InfoRow
              icon={<ClockUpIcon className="size-[18px] text-taupe-400" />}
              label="Waktu Keluar"
              value={
                isManual
                  ? "Tidak diperlukan"
                  : attendance.out_at
                    ? formatDateTime(attendance.out_at)
                    : "Belum absen keluar"
              }
            />

            {request && (
              <>
                <InfoRow
                  icon={<DatabaseIcon className="size-[18px] text-taupe-400" />}
                  label="Pengajuan"
                  value={`${statusLabel(request.type)} · ${requestDateRange}`}
                />
                <InfoRow
                  icon={<DatabaseIcon className="size-[18px] text-taupe-400" />}
                  label="Tanggal Mulai"
                  value={formatDateKey(request.start_date)}
                />
                <InfoRow
                  icon={<DatabaseIcon className="size-[18px] text-taupe-400" />}
                  label="Tanggal Selesai"
                  value={formatDateKey(request.end_date)}
                />
                <InfoRow
                  icon={<DatabaseIcon className="size-[18px] text-taupe-400" />}
                  label="Total Hari"
                  value={formatRequestWorkdayTotal(getRequestWorkdayCount(request))}
                />
                <InfoRow
                  icon={<DatabaseIcon className="size-[18px] text-taupe-400" />}
                  label="Keterangan Pengajuan"
                  value={request.description}
                />
                <InfoRow
                  icon={<UserIcon className="size-[18px] text-taupe-400" />}
                  label="Reviewer"
                  value={request.reviewer?.name ?? "Administrator"}
                />
              </>
            )}

            {hasCoords && (
              <>
                <InfoRow
                  icon={<CurrentLocationIcon className="size-[18px] text-taupe-400" />}
                  label="Lokasi Absen"
                  value={`${Number(attendance.in_latitude).toFixed(6)}, ${Number(attendance.in_longitude).toFixed(6)}`}
                />
                <StaticLocationMap
                  latitude={attendance.in_latitude}
                  longitude={attendance.in_longitude}
                  label="Lokasi Absen"
                />
              </>
            )}
          </Card>
        </div>
      </motion.div>

      {canCheckOut && (
        <div className="sticky bottom-4 z-10 mx-8 mt-auto rounded-2xl bg-white px-4 pb-2 pt-2 ring-1 ring-taupe-200 shadow-sm lg:mx-0 lg:ml-auto lg:w-[380px]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Sedang Absen</p>
              <p className="truncate text-xs text-taupe-400">
                {officeLabel}
              </p>
            </div>
            <Button
              id="presence-detail-checkout"
              variant="primary"
              className="shrink-0 px-8 py-3"
              onClick={handleCheckOut}
              loading={isCheckingOut}
              loadingText="Memproses..."
            >
              Absen Keluar
            </Button>
          </div>
          {checkOutError && (
            <p className="mt-2 text-center text-xs font-medium text-red-500">
              {checkOutError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
