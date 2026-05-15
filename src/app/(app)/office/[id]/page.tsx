"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { ApiError, checkIn, getOffice } from "@/lib/api/client";
import type { Office } from "@/lib/api/types";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // metres
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!office) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-gray-500">Kantor tidak ditemukan.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm font-medium text-gray-900 underline"
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
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <button
          id="back-button"
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-900">Office Detail</h1>
        <div className="size-9" />
      </div>

      {/* Photo */}
      <div className="relative mx-4 h-48 overflow-hidden rounded-2xl bg-gray-100">
        {office.photo ? (
          <Image
            src={office.photo}
            alt={office.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="size-12 text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4">
        <h2
          id="office-name"
          className="text-lg font-semibold text-gray-900"
        >
          {office.name}
        </h2>

        {/* Location */}
        <div className="mt-2 flex items-start gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="mt-0.5 size-4 shrink-0 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-medium text-gray-500">Location</p>
            <p id="office-address" className="text-sm text-gray-700">
              {office.address}
            </p>
            {distance !== null && (
              <p className="mt-0.5 text-xs text-gray-400">
                {formatDistance(distance)} dari lokasi Anda
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <p
            id="office-description"
            className={`text-sm leading-relaxed text-gray-600 ${!isExpanded && shouldTruncate ? "line-clamp-3" : ""}`}
          >
            Radius absensi: {office.radius} meter dari titik kantor.
            {office.is_active ? " Kantor aktif." : " Kantor tidak aktif."}
          </p>
          {shouldTruncate && (
            <button
              id="expand-description"
              onClick={() => setIsExpanded((p) => !p)}
              className="mt-1 text-xs font-medium text-gray-500 underline"
            >
              {isExpanded ? "Lebih sedikit" : "Selengkapnya"}
            </button>
          )}
        </div>

        {/* Feedback message */}
        {message && (
          <div
            id="presence-message"
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              message.includes("berhasil")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-[72px] px-4 pb-4 pt-3">
        <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">Nearby</p>
            <p className="text-sm font-medium text-gray-900">
              {distance !== null ? formatDistance(distance) : "Memuat..."}
            </p>
          </div>
          <button
            id="presence-button"
            onClick={handlePresence}
            disabled={isChecking || !userLocation}
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          >
            {isChecking ? "Memproses..." : "Presence"}
          </button>
        </div>
        {!isWithinRadius && distance !== null && (
          <p className="mt-2 text-center text-xs text-gray-400">
            Anda harus berada dalam radius {office?.radius}m untuk absen
          </p>
        )}
      </div>
    </div>
  );
}
