"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPinIcon, CameraIcon } from "@/components/icons/outline";
import { Button } from "@/components/ui";

type Status = "checking" | "granted" | "needs-prompt" | "denied";

async function queryPermissions(): Promise<Status> {
  if (typeof navigator === "undefined") return "checking";

  try {
    const [cam, geo] = await Promise.all([
      navigator.permissions.query({ name: "camera" as PermissionName }),
      navigator.permissions.query({ name: "geolocation" as PermissionName }),
    ]);

    if (cam.state === "denied" || geo.state === "denied") return "denied";
    if (cam.state === "granted" && geo.state === "granted") return "granted";
    return "needs-prompt";
  } catch {
    // navigator.permissions not supported (some browsers)
    return "needs-prompt";
  }
}

async function requestPermissions(): Promise<"granted" | "denied"> {
  try {
    // Camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    stream.getTracks().forEach((t) => t.stop());

    // Geolocation
    await new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (err) => reject(err),
        { timeout: 10000 },
      );
    });

    return "granted";
  } catch {
    return "denied";
  }
}

export function PermissionGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    queryPermissions().then(setStatus);
  }, []);

  // Listen for permission changes (supported in Chrome/Edge)
  useEffect(() => {
    let camQuery: PermissionStatus | null = null;
    let geoQuery: PermissionStatus | null = null;

    (async () => {
      try {
        [camQuery, geoQuery] = await Promise.all([
          navigator.permissions.query({ name: "camera" as PermissionName }),
          navigator.permissions.query({ name: "geolocation" as PermissionName }),
        ]);
        const recheck = () => queryPermissions().then(setStatus);
        camQuery.onchange = recheck;
        geoQuery.onchange = recheck;
      } catch {
        // ignore
      }
    })();

    return () => {
      if (camQuery) camQuery.onchange = null;
      if (geoQuery) geoQuery.onchange = null;
    };
  }, []);

  async function handleRequest() {
    setRequesting(true);
    const result = await requestPermissions();
    setStatus(result);
    setRequesting(false);
  }

  if (status === "checking") {
    return (
      <div className="flex h-screen items-center justify-center bg-taupe-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  if (status === "granted") {
    return <>{children}</>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-screen flex-col items-center justify-center bg-taupe-50 px-8 text-center"
      >
        {/* Icon cluster */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-taupe-100">
            <MapPinIcon className="size-8 text-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex size-16 items-center justify-center rounded-full bg-taupe-100">
            <CameraIcon className="size-8 text-foreground" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground">Izin Diperlukan</h1>

        <p className="mt-3 text-sm leading-relaxed text-taupe-500">
          Untuk menggunakan aplikasi ini, Anda harus mengizinkan akses{" "}
          <strong className="text-foreground">kamera</strong> dan{" "}
          <strong className="text-foreground">lokasi</strong>.
        </p>

        <ul className="mt-5 w-full space-y-3 text-left">
          <li className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-taupe-200">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-taupe-400" strokeWidth={2} />
            <div>
              <p className="text-sm font-semibold text-foreground">Lokasi</p>
              <p className="text-xs text-taupe-400">
                Untuk mendeteksi kehadiran Anda di kantor.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-taupe-200">
            <CameraIcon className="mt-0.5 size-4 shrink-0 text-taupe-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">Kamera</p>
              <p className="text-xs text-taupe-400">
                Untuk mengambil foto selfie sebagai bukti kehadiran.
              </p>
            </div>
          </li>
        </ul>

        {status === "denied" ? (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-red-500">
              Akses ditolak. Buka Pengaturan perangkat Anda dan izinkan kamera
              serta lokasi untuk aplikasi ini.
            </p>
            {/* bespoke — tonal taupe button, not a standard Button variant */}
            <button
              onClick={() => queryPermissions().then(setStatus)}
              className="rounded-full bg-taupe-100 px-6 py-2.5 text-sm font-semibold text-foreground transition-opacity active:opacity-70"
            >
              Periksa Ulang
            </button>
          </div>
        ) : (
          <Button
            variant="primary"
            fullWidth
            className="mt-8 py-3.5"
            onClick={handleRequest}
            loading={requesting}
            loadingText="Meminta izin..."
          >
            Izinkan Akses
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
