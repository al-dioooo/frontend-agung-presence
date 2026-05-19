"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, checkIn, checkOut, deleteOffice, getAttendances, getOffice } from "@/lib/api/client";
import type { Attendance, Office } from "@/lib/api/types";
import {
  ChevronBackIcon,
  MapPinIcon,
  DotsIcon,
  PencilIcon,
  TrashIcon,
  EnterpriseIcon,
  DatabaseIcon,
  CurrentLocationIcon,
} from "@/components/icons/outline";
import { BottomSheet, BottomSheetItem } from "@/app/components/bottom-sheet";
import { SelfieCapture } from "@/app/components/selfie-capture";

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

export default function OfficeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();

  const [office, setOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [activeCheckIn, setActiveCheckIn] = useState<Attendance | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  function loadTodayAttendance(tok: string, officeId: number) {
    const today = new Date().toISOString().slice(0, 10);
    getAttendances(tok, { office_id: officeId, date: today }).then((list) => {
      setActiveCheckIn(list.find((a) => a.in_at && !a.out_at) ?? null);
    });
  }

  useEffect(() => {
    if (!token) return;

    getOffice(token, Number(id))
      .then((office) => { setOffice(office); loadTodayAttendance(token, office.id); })
      .finally(() => setIsLoading(false));

    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, [id, token]);

  async function handleDelete() {
    if (!token || !office) return;
    setIsDeleting(true);
    try {
      await deleteOffice(token, office.id);
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

  function handlePresence() {
    if (!token || !office || !userLocation) return;
    setSelfieOpen(true);
  }

  async function handleSelfieCapture(base64: string) {
    if (!token || !office || !userLocation) return;

    setSelfieOpen(false);
    setIsChecking(true);
    setMessage("");

    try {
      await checkIn(token, {
        office_id: office.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        proof_photo: base64,
        ...(user?.role === "administrator" ? { user_id: user.id } : {}),
      });
      setMessage("Absensi berhasil dicatat!");
      loadTodayAttendance(token, office.id);
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Absensi gagal. Coba lagi.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function handleCheckOut() {
    if (!token || !office || !activeCheckIn) return;
    setIsCheckingOut(true);
    setMessage("");
    try {
      await checkOut(token, activeCheckIn.id);
      setMessage("Absen keluar berhasil dicatat!");
      setActiveCheckIn(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Absen keluar gagal.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (isLoading) {
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
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm font-medium text-foreground underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      {/* Top bar — back chevron + dots */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          id="back-button"
          onClick={() => router.back()}
          className="text-foreground"
        >
          <ChevronBackIcon className="size-6" />
        </button>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-foreground"
          aria-label="Open actions"
        >
          <DotsIcon className="size-6" />
        </button>
      </div>

      {/* Actions bottom sheet */}
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
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="flex-1 rounded-full border border-taupe-200 py-3 text-sm font-semibold text-foreground transition-opacity disabled:opacity-50 active:opacity-70"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 active:opacity-80"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
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
        <div className="space-y-4">
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
        </div>

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

      {/* Selfie capture overlay */}
      <SelfieCapture
        open={selfieOpen}
        onClose={() => setSelfieOpen(false)}
        onCapture={handleSelfieCapture}
        officeName={office.name}
        latitude={Number(office.latitude)}
        longitude={Number(office.longitude)}
      />

      {/* Bottom CTA */}
      <div className="sticky bottom-4 z-10 mt-auto px-5 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Nearby</p>
            <p className="text-xs text-taupe-400">
              {distance !== null ? formatDistance(distance) : "Memuat..."}
            </p>
          </div>
          {activeCheckIn ? (
            <button
              id="checkout-button"
              onClick={handleCheckOut}
              disabled={isCheckingOut}
              className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:opacity-80"
            >
              {isCheckingOut ? "Memproses..." : "Absen Keluar"}
            </button>
          ) : (
            <button
              id="presence-button"
              onClick={handlePresence}
              disabled={isChecking || !userLocation}
              className="rounded-full bg-foreground px-8 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:opacity-80"
            >
              {isChecking ? "Memproses..." : "Presence"}
            </button>
          )}
        </div>
        {!activeCheckIn && !isWithinRadius && distance !== null && (
          <p className="mt-2 text-center text-xs text-taupe-400">
            Anda harus berada dalam radius {office?.radius}m untuk absen
          </p>
        )}
      </div>
    </div>
  );
}
