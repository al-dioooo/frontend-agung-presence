"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronBackIcon,
  SwitchCameraIcon,
} from "@/components/icons/outline";

type CameraFacingMode = "user" | "environment";

type CameraCaptureProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (base64: string) => void;
  watermarkLines: string[];
  initialFacingMode?: CameraFacingMode;
};

function formatTimestamp() {
  return new Date().toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function cleanWatermarkLines(lines: string[], timestamp: string) {
  return [...lines.map((line) => line.trim()).filter(Boolean), timestamp];
}

export function CameraCapture({
  open,
  onClose,
  onCapture,
  watermarkLines,
  initialFacingMode = "user",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] =
    useState<CameraFacingMode>(initialFacingMode);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!open) {
      queueMicrotask(() => {
        if (!cancelled) {
          setFacingMode(initialFacingMode);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [initialFacingMode, open]);

  useEffect(() => {
    let cancelled = false;

    stopStream();
    queueMicrotask(() => {
      if (!cancelled) {
        setReady(false);
        setError("");
      }
    });

    if (!open) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          if (!cancelled) {
            setReady(true);
          }
        }
      } catch {
        if (!cancelled) {
          setError(
            "Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, open, stopStream]);

  const liveWatermarkLines = useMemo(
    () => cleanWatermarkLines(watermarkLines, formatTimestamp()),
    [watermarkLines],
  );

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    const capturedWatermarkLines = cleanWatermarkLines(
      watermarkLines,
      formatTimestamp(),
    );
    const baseFont = Math.max(Math.round(width * 0.036), 14);
    const smallFont = Math.max(Math.round(width * 0.028), 11);
    const lineHeight = Math.round(baseFont * 1.5);
    const pad = Math.round(width * 0.04);
    const barHeight = Math.max(
      Math.round(height * 0.08) + lineHeight * capturedWatermarkLines.length,
      80,
    );
    const startY = height - barHeight + lineHeight;

    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillRect(0, height - barHeight, width, barHeight);

    ctx.textAlign = "left";
    capturedWatermarkLines.forEach((line, index) => {
      ctx.font =
        index === 0
          ? `700 ${baseFont}px system-ui, -apple-system, sans-serif`
          : `${smallFont}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = index === 0 ? "#ffffff" : "rgba(255,255,255,0.80)";
      ctx.fillText(line, pad, startY + lineHeight * index);
    });

    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(base64);
  }

  function toggleFacingMode() {
    setFacingMode((current) =>
      current === "user" ? "environment" : "user",
    );
  }

  function closeCamera() {
    setFacingMode(initialFacingMode);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black"
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />

          <button
            type="button"
            onClick={closeCamera}
            className="absolute top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-opacity active:opacity-70"
            aria-label="Tutup kamera"
          >
            <ChevronBackIcon className="size-5" strokeWidth={2} />
          </button>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-white/80">{error}</p>
            </div>
          )}

          {!error && !ready && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-white/80">Menyiapkan kamera...</p>
            </div>
          )}

          <div className="absolute right-5 bottom-[max(env(safe-area-inset-bottom),2rem)] z-10">
            <button
              type="button"
              onClick={toggleFacingMode}
              disabled={!ready}
              className="flex size-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-opacity disabled:opacity-40 active:opacity-70"
              aria-label="Ganti kamera"
              title="Ganti kamera"
            >
              <SwitchCameraIcon className="size-5" strokeWidth={2} />
            </button>
          </div>

          <div className="absolute bottom-0 right-0 left-0">
            {ready && (
              <div className="bg-black/58 px-4 pt-3 pb-28">
                {liveWatermarkLines.map((line, index) => (
                  <p
                    key={`${line}-${index}`}
                    className={
                      index === 0
                        ? "text-sm leading-snug font-bold text-white"
                        : "mt-0.5 text-xs text-white/80"
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            <div className="absolute bottom-[max(env(safe-area-inset-bottom),2rem)] left-1/2 -translate-x-1/2">
              <button
                type="button"
                onClick={capture}
                disabled={!ready}
                aria-label="Ambil foto"
                className="flex size-[72px] items-center justify-center rounded-full border-4 border-white/80 bg-transparent transition-transform disabled:opacity-40 active:scale-95"
              >
                <div className="size-[52px] rounded-full bg-white" />
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
