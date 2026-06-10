"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useAttendance } from "@/lib/api/hooks";
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

function statusLabel(status: string) {
  switch (status) {
    case "on_time": return "Tepat Waktu";
    case "late": return "Terlambat";
    case "absent": return "Tidak Hadir";
    case "sick": return "Sakit";
    case "leave": return "Cuti";
    default: return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "on_time": return "bg-emerald-50 text-emerald-700";
    case "late": return "bg-amber-50 text-amber-600";
    case "absent": return "bg-red-50 text-red-600";
    case "sick": return "bg-sky-50 text-sky-600";
    case "leave": return "bg-violet-50 text-violet-600";
    default: return "bg-taupe-100 text-taupe-500";
  }
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
  const { user } = useAuth();
  const router = useRouter();

  const { data: attendance, isLoading, error } = useAttendance(id);
  const [photoOpen, setPhotoOpen] = useState(false);

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

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
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
        className="flex-1 space-y-5 px-5 pb-8"
      >
        {/* Proof photo */}
        <div
          className={`relative h-64 overflow-hidden rounded-2xl bg-taupe-100 ${attendance.proof_photo ? "cursor-zoom-in" : ""}`}
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

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-taupe-400">
            {formatDate(attendance.date)}
          </p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor(attendance.status)}`}
          >
            {statusLabel(attendance.status)}
          </span>
        </div>

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
              value={
                attendance.office?.name ??
                `Office #${attendance.office_id}`
              }
            />

            <InfoRow
              icon={<ClockDownIcon className="size-[18px] text-taupe-400" />}
              label="Waktu Masuk"
              value={formatDateTime(attendance.in_at)}
            />

            <InfoRow
              icon={<ClockUpIcon className="size-[18px] text-taupe-400" />}
              label="Waktu Keluar"
              value={attendance.out_at ? formatDateTime(attendance.out_at) : "Belum absen keluar"}
            />

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
    </div>
  );
}
