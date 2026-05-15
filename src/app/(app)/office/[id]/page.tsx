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
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-muted">Kantor tidak ditemukan.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm font-medium text-foreground underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  const descText = office.address;
  const shouldTruncate = descText.length > 120;

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          id="back-button"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full bg-surface text-foreground shadow-sm"
        >
          <ChevronBackIcon className="size-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Detail</h1>
        <button className="flex size-10 items-center justify-center rounded-full bg-surface text-muted shadow-sm">
          <DotsIcon className="size-5" />
        </button>
      </div>

      {/* Photo */}
      <div className="relative mx-5 h-52 overflow-hidden rounded-2xl bg-surface-warm">
        {office.photo ? (
          <Image
            src={office.photo}
            alt={office.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EnterpriseIcon className="size-14 text-muted/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5">
        <h2
          id="office-name"
          className="text-lg font-semibold text-foreground tracking-tight"
        >
          {office.name}
        </h2>

        {/* Location */}
        <div className="mt-3 flex items-start gap-2.5">
          <MapPinIcon className="mt-0.5 size-[18px] shrink-0 text-muted" />
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Location</p>
            <p id="office-address" className="mt-0.5 text-sm text-foreground/80">
              {office.address}
            </p>
            {distance !== null && (
              <p className="mt-0.5 text-xs text-muted">
                {formatDistance(distance)} dari lokasi Anda
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground mb-2">Description</p>
          <p
            id="office-description"
            className={`text-sm leading-relaxed text-foreground/70 ${!isExpanded && shouldTruncate ? "line-clamp-3" : ""}`}
          >
            Radius absensi: {office.radius} meter dari titik kantor.
            {office.is_active ? " Kantor aktif." : " Kantor tidak aktif."}
          </p>
          {shouldTruncate && (
            <button
              id="expand-description"
              onClick={() => setIsExpanded((p) => !p)}
              className="mt-1 text-xs font-semibold text-foreground underline underline-offset-2"
            >
              {isExpanded ? "Lebih sedikit" : "Read More..."}
            </button>
          )}
        </div>

        {/* Feedback message */}
        {message && (
          <div
            id="presence-message"
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              message.includes("berhasil")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-600 border border-red-100"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-[72px] px-5 pb-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-accent px-5 py-3.5">
          <div>
            <p className="text-xs text-white/60">Nearby</p>
            <p className="text-sm font-semibold text-white">
              {distance !== null ? formatDistance(distance) : "Memuat..."}
            </p>
          </div>
          <button
            id="presence-button"
            onClick={handlePresence}
            disabled={isChecking || !userLocation}
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-accent disabled:opacity-50 transition-opacity"
          >
            {isChecking ? "Memproses..." : "Presence"}
          </button>
        </div>
        {!isWithinRadius && distance !== null && (
          <p className="mt-2 text-center text-xs text-muted">
            Anda harus berada dalam radius {office?.radius}m untuk absen
          </p>
        )}
      </div>
    </div>
  );
}
