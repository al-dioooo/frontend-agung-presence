"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useOffice, useAttendances } from "@/lib/api/hooks";
import { mutateDeleteOffice, mutateCheckIn } from "@/lib/api/mutations";
import {
  ChevronBackIcon,
  MapPinIcon,
  DotsIcon,
  PencilIcon,
  TrashIcon,
  EnterpriseIcon,
  DatabaseIcon,
  CurrentLocationIcon,
  ClockDownIcon,
  ClockUpIcon,
} from "@/components/icons/outline";
import { BottomSheet, BottomSheetItem } from "@/app/components/bottom-sheet";
import { CameraCapture } from "@/app/components/camera-capture";
import { StaticLocationMap } from "@/app/components/static-location-map";
import { Button, Card } from "@/components/ui";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)}m Away`;
  }
  return `${(meters / 1000).toFixed(1)}km Away`;
}

function formatOfficeTime(time: string | null) {
  if (!time) return "--:--";
  return time.slice(0, 5);
}

export default function OfficeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const isAdministrator = user?.role === "administrator";

  const { data: office, isLoading } = useOffice(id);

  const { data: attendances = [], isLoading: loadingAttendances } = useAttendances();
  const activeAttendance =
    attendances.find((a) => a.user_id === user?.id && a.in_at && !a.out_at) ?? null;

  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selfieOpen, setSelfieOpen] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  async function handleDelete() {
    if (!token || !office) return;
    setIsDeleting(true);
    try {
      await mutateDeleteOffice(token, office.id);
      router.replace("/office");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Gagal menghapus kantor.");
      setConfirmDelete(false);
      setIsDeleting(false);
    }
  }

  const distance =
    office && userLocation
      ? haversineDistance(
        userLocation.lat,
        userLocation.lng,
        Number(office.latitude),
        Number(office.longitude),
      )
      : null;

  const isWithinRadius =
    office && distance !== null && distance <= office.radius;
  const canCheckIn = Boolean(office?.is_active && isWithinRadius);

  function handlePresence() {
    if (!token || !office || !userLocation || !canCheckIn) return;
    setSelfieOpen(true);
  }

  async function handleCameraCapture(base64: string) {
    if (!token || !office || !userLocation) return;

    setSelfieOpen(false);
    setIsChecking(true);
    setMessage("");

    try {
      await mutateCheckIn(token, {
        office_id: office.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        proof_photo: base64,
        ...(user?.role === "administrator" ? { user_id: user.id } : {}),
      });
      setMessage("Absensi berhasil dicatat!");
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Absensi gagal. Coba lagi.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  if (isLoading || loadingAttendances) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-taupe-400">Kantor tidak ditemukan.</p>
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

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      {/* Top bar — back chevron + dots */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Button
          id="back-button"
          variant="secondary"
          size="icon"
          onClick={() => router.back()}
          aria-label="Kembali"
        >
          <ChevronBackIcon className="size-6" />
        </Button>
        {isAdministrator && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setSheetOpen(true)}
            aria-label="Open actions"
          >
            <DotsIcon className="size-6" />
          </Button>
        )}
      </div>

      {/* Actions bottom sheet */}
      {isAdministrator && (
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <BottomSheetItem
            icon={<PencilIcon className="size-5" strokeWidth={2} />}
            label="Edit"
            onClick={() => {
              setSheetOpen(false);
              router.push(`/office/${id}/edit`);
            }}
          />
          <BottomSheetItem
            icon={<TrashIcon className="size-5" strokeWidth={2} />}
            label="Delete"
            variant="danger"
            onClick={() => {
              setSheetOpen(false);
              setConfirmDelete(true);
            }}
          />
        </BottomSheet>
      )}

      {/* Delete confirmation bottom sheet */}
      <BottomSheet
        open={confirmDelete}
        onClose={() => !isDeleting && setConfirmDelete(false)}
        title="Hapus Kantor?"
      >
        <div className="px-4 pt-1">
          <p className="text-sm text-taupe-400">
            Tindakan ini tidak dapat dibatalkan. Kantor akan dihapus secara permanen.
          </p>
          <div className="mt-5 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 py-3"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1 py-3"
              onClick={handleDelete}
              loading={isDeleting}
              loadingText="Menghapus..."
            >
              Hapus
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Photo area */}
      <div className="relative mx-5 h-48 overflow-hidden rounded-2xl bg-taupe-100">
        {office.photo ? (
          <Image
            src={office.photo}
            alt={office.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EnterpriseIcon className="size-14 text-taupe-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 px-5 pt-5 pb-2"
      >
        {/* Name + status badge */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id="office-name" className="text-lg font-bold text-foreground">
            {office.name}
          </h2>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${office.is_active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-taupe-100 text-taupe-400"
              }`}
          >
            {office.is_active ? "Aktif" : "Nonaktif"}
          </span>
        </div>

        {/* Info rows */}
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Informasi Kantor</h3>
          {office.address && (
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                <MapPinIcon className="size-[18px] text-taupe-400" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Alamat</p>
                <p id="office-address" className="mt-0.5 break-words text-xs text-taupe-400">
                  {office.address}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
              <CurrentLocationIcon className="size-[18px] text-taupe-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Koordinat</p>
              <p className="mt-0.5 text-xs text-taupe-400">
                {Number(office.latitude).toFixed(6)}, {Number(office.longitude).toFixed(6)}
              </p>
            </div>
          </div>

          <StaticLocationMap
            latitude={office.latitude}
            longitude={office.longitude}
            radius={office.radius}
            label="Koordinat Kantor"
          />

          {/* Radius — color-coded by whether user is within range */}
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
              <DatabaseIcon className="size-[18px] text-taupe-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Radius Absensi</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-xs text-taupe-400">{office.radius}m dari titik kantor</p>
                {distance !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isWithinRadius
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-taupe-100 text-taupe-500"
                      }`}
                  >
                    {formatDistance(distance)} {isWithinRadius ? "• Dalam jangkauan" : "• Di luar jangkauan"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-4 space-y-4" aria-label="Jam kerja kantor">
          <h3 className="text-sm font-bold text-foreground">Jam Kerja Kantor</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                <ClockDownIcon className="size-[18px] text-taupe-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Masuk</p>
                <p className="mt-0.5 text-xs text-taupe-400">
                  {formatOfficeTime(office.work_start_time)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                <ClockUpIcon className="size-[18px] text-taupe-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Keluar</p>
                <p className="mt-0.5 text-xs text-taupe-400">
                  {formatOfficeTime(office.work_end_time)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback message */}
        <AnimatePresence>
          {message && (
            <motion.div
              key="presence-message"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              id="presence-message"
              className={`mt-5 rounded-xl px-4 py-3 text-sm ${message.includes("berhasil")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
                }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CameraCapture
        open={selfieOpen}
        onClose={() => setSelfieOpen(false)}
        onCapture={handleCameraCapture}
        initialFacingMode="user"
        watermarkLines={[
          office.name,
          `${Number(office.latitude).toFixed(6)}, ${Number(office.longitude).toFixed(6)}`,
        ]}
      />

      {/* Bottom CTA */}
      <div className="sticky bg-white mx-8 rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm bottom-4 z-10 mt-auto px-4 pb-2 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Nearby</p>
            <p className="text-xs text-taupe-400">
              {distance !== null ? formatDistance(distance) : "Memuat..."}
            </p>
          </div>
          {activeAttendance ? (
            <Button
              id="active-attendance-link"
              href={`/presence/${activeAttendance.id}`}
              variant="secondary"
              className="px-8 py-3"
            >
              Lihat Absensi
            </Button>
          ) : (
            <Button
              id="presence-button"
              variant="primary"
              className="px-8 py-3"
              onClick={handlePresence}
              disabled={isChecking || !userLocation || !canCheckIn}
              loading={isChecking}
              loadingText="Memproses..."
            >
              Presence
            </Button>
          )}
        </div>
        {activeAttendance && (
          <p className="mt-2 text-center text-xs text-taupe-400">
            Selesaikan absen aktif di {activeAttendance.office?.name ?? `Office #${activeAttendance.office_id}`} terlebih dahulu.
          </p>
        )}
        {!activeAttendance && !isWithinRadius && distance !== null && (
          <p className="mt-2 text-center text-xs text-taupe-400">
            Anda harus berada dalam radius {office?.radius}m untuk absen
          </p>
        )}
        {!activeAttendance && !office.is_active && (
          <p className="mt-2 text-center text-xs text-taupe-400">
            Kantor nonaktif tidak dapat digunakan untuk absen
          </p>
        )}
      </div>
    </div>
  );
}
