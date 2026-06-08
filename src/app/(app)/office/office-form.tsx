"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  type OfficeInput,
} from "@/lib/api/client";
import { mutateCreateOffice, mutateUpdateOffice } from "@/lib/api/mutations";
import type { Office } from "@/lib/api/types";
import {
  ChevronBackIcon,
  MapPinIcon,
  UploadIcon,
  EnterpriseIcon,
  TrashIcon,
  ClockDownIcon,
  ClockUpIcon,
} from "@/components/icons/outline";
import { FormField, FormTextArea } from "@/app/components/form-field";
import { MapPicker } from "@/app/components/map-picker";

type Mode = { kind: "create" } | { kind: "edit"; office: Office };

export function OfficeForm({ mode }: { mode: Mode }) {
  const { token } = useAuth();
  const router = useRouter();
  const initial =
    mode.kind === "edit"
      ? mode.office
      : {
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        radius: 50,
        work_start_time: "08:00",
        work_end_time: "17:00",
        is_active: true,
      };

  const [name, setName] = useState(String(initial.name ?? ""));
  const [address, setAddress] = useState(String(initial.address ?? ""));
  const [latitude, setLatitude] = useState(String(initial.latitude ?? ""));
  const [longitude, setLongitude] = useState(String(initial.longitude ?? ""));
  const [radius, setRadius] = useState(String(initial.radius ?? 50));
  const [workStartTime, setWorkStartTime] = useState(
    String(initial.work_start_time ?? "08:00"),
  );
  const [workEndTime, setWorkEndTime] = useState(
    String(initial.work_end_time ?? "17:00"),
  );
  const [isActive, setIsActive] = useState<boolean>(initial.is_active ?? true);
  const [photo, setPhoto] = useState<string | null>(
    mode.kind === "edit" ? mode.office.photo ?? null : null,
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapFlyToRef = useRef<((lat: number, lng: number) => void) | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: "Ukuran foto maksimum 2MB.",
      }));
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(typeof reader.result === "string" ? reader.result : null);
      setFieldErrors((prev) => {
        const { photo: _omit, ...rest } = prev;
        void _omit;
        return rest;
      });
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(String(lat));
      setLongitude(String(lng));
      mapFlyToRef.current?.(lat, lng);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    const payload: OfficeInput = {
      name: name.trim(),
      address: address.trim() || null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius) || 50,
      work_start_time: workStartTime,
      work_end_time: workEndTime,
      is_active: isActive,
      photo: photo,
    };

    try {
      const result =
        mode.kind === "create"
          ? await mutateCreateOffice(token, payload)
          : await mutateUpdateOffice(token, mode.office.id, payload);
      router.replace(`/office/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        const data = err.data as { errors?: Record<string, string[]> } | null;
        if (data?.errors) {
          const flattened: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.errors)) {
            flattened[k] = v[0];
          }
          setFieldErrors(flattened);
        }
      } else {
        setErrorMessage("Terjadi kesalahan. Coba lagi.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-foreground"
          aria-label="Back"
        >
          <ChevronBackIcon className="size-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">
          {mode.kind === "create" ? "Tambah Kantor" : "Edit Kantor"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 space-y-4 px-5 pb-32 pt-2"
      >
        {/* Photo picker */}
        <div>
          <span className="block text-sm font-medium text-foreground">
            Foto Kantor
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            id="office-photo-input"
          />
          <motion.div
            initial={false}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.98 }}
            className="relative mt-1.5 h-44 overflow-hidden rounded-2xl bg-white ring-1 ring-taupe-200"
          >
            {photo ? (
              <>
                <Image
                  src={photo}
                  alt="Office preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow backdrop-blur-md transition-opacity active:opacity-70"
                  >
                    <UploadIcon className="size-3.5" strokeWidth={2} />
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="flex items-center justify-center rounded-full bg-white/90 p-1.5 text-red-500 shadow backdrop-blur-md transition-opacity active:opacity-70"
                    aria-label="Hapus foto"
                  >
                    <TrashIcon className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-taupe-400 transition-colors hover:bg-taupe-50"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-taupe-100">
                  <EnterpriseIcon className="size-6 text-taupe-300" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <UploadIcon className="size-3.5" strokeWidth={2} />
                  Pilih foto
                </div>
                <span className="text-[10px] text-taupe-400">PNG / JPG, maks 2MB</span>
              </button>
            )}
          </motion.div>
          {fieldErrors.photo && (
            <span className="mt-1 block text-xs text-red-500">
              {fieldErrors.photo}
            </span>
          )}
        </div>

        <FormField
          label="Nama Kantor"
          placeholder="Contoh: Kantor Pusat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={fieldErrors.name}
        />

        <FormTextArea
          label="Alamat"
          placeholder="Alamat lengkap kantor"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          error={fieldErrors.address}
        />

        {/* Map picker */}
        <div>
          <span className="block text-sm font-medium text-foreground mb-1.5">
            Lokasi Kantor
          </span>
          <MapPicker
            lat={latitude}
            lng={longitude}
            radius={Number(radius) || 50}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            flyToRef={mapFlyToRef}
          />
          <p className="mt-1 text-xs text-taupe-400">
            Ketuk peta atau seret penanda untuk memilih lokasi.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Latitude"
            placeholder="-2.987..."
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            inputMode="decimal"
            required
            error={fieldErrors.latitude}
          />
          <FormField
            label="Longitude"
            placeholder="104.756..."
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            inputMode="decimal"
            required
            error={fieldErrors.longitude}
          />
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          className="inline-flex items-center gap-2 rounded-full bg-taupe-100 px-4 py-2 text-xs font-semibold text-foreground transition-opacity active:opacity-70"
        >
          <MapPinIcon className="size-4" strokeWidth={2} />
          Gunakan lokasi saat ini
        </button>

        <FormField
          label="Radius (meter)"
          placeholder="50"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          inputMode="numeric"
          hint="Jarak maksimum dari titik kantor untuk dianggap hadir."
          error={fieldErrors.radius}
        />

        <section className="space-y-3" aria-label="Jam kerja kantor">
          <div>
            <p className="text-sm font-medium text-foreground">Jam Kerja Kantor</p>
            <p className="mt-0.5 text-xs text-taupe-400">
              Waktu masuk dipakai untuk menentukan status tepat waktu atau terlambat.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <div className="mt-7 flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                <ClockDownIcon className="size-[18px] text-taupe-400" />
              </div>
              <div className="min-w-0 flex-1">
                <FormField
                  label="Masuk"
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  required
                  error={fieldErrors.work_start_time}
                />
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <div className="mt-7 flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
                <ClockUpIcon className="size-[18px] text-taupe-400" />
              </div>
              <div className="min-w-0 flex-1">
                <FormField
                  label="Keluar"
                  type="time"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  required
                  error={fieldErrors.work_end_time}
                />
              </div>
            </div>
          </div>
        </section>

        <label className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-taupe-200">
          <div>
            <p className="text-sm font-medium text-foreground">Kantor aktif</p>
            <p className="text-xs text-taupe-400">
              Kantor non-aktif tidak muncul saat absensi.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-5 accent-foreground"
          />
        </label>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {errorMessage}
          </motion.div>
        )}
      </form>

      <div className="sticky bottom-4 z-10 mt-auto px-5 pb-3 pt-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:opacity-80"
        >
          {submitting
            ? "Menyimpan..."
            : mode.kind === "create"
              ? "Buat Kantor"
              : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}
