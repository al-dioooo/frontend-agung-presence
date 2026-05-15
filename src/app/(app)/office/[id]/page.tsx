"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { ApiError, checkIn, getOffice } from "@/lib/api/client";
import type { Office } from "@/lib/api/types";
import { ChevronBackIcon, MapPinIcon, DotsIcon } from "@/components/icons/outline";
import { EnterpriseIcon } from "@/components/icons/outline";

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
  const { token } = useAuth();
  const router = useRouter();

  const [office, setOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!token) return;

    getOffice(token, Number(id))
      .then(setOffice)
      .finally(() => setIsLoading(false));

    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, [id, token]);

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

  async function handlePresence() {
    if (!token || !office || !userLocation) return;

    setIsChecking(true);
    setMessage("");

    try {
      await checkIn(token, {
        office_id: office.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
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
        <button className="text-foreground">
          <DotsIcon className="size-6" />
        </button>
      </div>

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
      <div className="flex-1 px-5 pt-5">
        <h2
          id="office-name"
          className="text-lg font-bold text-foreground"
        >
          {office.name}
        </h2>

        {/* Location row */}
        <div className="mt-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
            <MapPinIcon className="size-[18px] text-taupe-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Location</p>
            <p id="office-address" className="mt-0.5 text-xs text-taupe-400">
              {office.address}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <p
            id="office-description"
            className={`text-sm leading-relaxed text-taupe-500 ${!isExpanded ? "line-clamp-3" : ""}`}
          >
            Radius absensi: {office.radius} meter dari titik kantor.
            {office.is_active ? " Kantor aktif." : " Kantor tidak aktif."}
            {" "}Lokasi kantor berada di {office.address}.
          </p>
          <button
            id="expand-description"
            onClick={() => setIsExpanded((p) => !p)}
            className="mt-1 text-sm font-bold text-foreground"
          >
            {isExpanded ? "Less" : "More"}
          </button>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            id="presence-message"
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              message.includes("berhasil")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-[72px] mt-auto px-5 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Nearby</p>
            <p className="text-xs text-taupe-400">
              {distance !== null ? formatDistance(distance) : "Memuat..."}
            </p>
          </div>
          <button
            id="presence-button"
            onClick={handlePresence}
            disabled={isChecking || !userLocation}
            className="rounded-full bg-foreground px-8 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:opacity-80"
          >
            {isChecking ? "Memproses..." : "Presence"}
          </button>
        </div>
        {!isWithinRadius && distance !== null && (
          <p className="mt-2 text-center text-xs text-taupe-400">
            Anda harus berada dalam radius {office?.radius}m untuk absen
          </p>
        )}
      </div>
    </div>
  );
}
