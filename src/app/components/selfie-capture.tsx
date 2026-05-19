"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronBackIcon } from "@/components/icons/outline";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (base64: string) => void;
  officeName: string;
  latitude: number;
  longitude: number;
}

export function SelfieCapture({
  open,
  onClose,
  onCapture,
  officeName,
  latitude,
  longitude,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
      setError("");
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError(
          "Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.",
        );
      }
    })();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const W = video.videoWidth;
    const H = video.videoHeight;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d")!;

    // Mirror the front-facing camera so the selfie looks natural
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();

    // Watermark: semi-transparent bar at the bottom
    const barH = Math.max(Math.round(H * 0.18), 80);
    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillRect(0, H - barH, W, barH);

    const pad = Math.round(W * 0.04);
    const baseFont = Math.max(Math.round(W * 0.036), 14);
    const smallFont = Math.max(Math.round(W * 0.028), 11);
    const lineH = baseFont * 1.5;
    const startY = H - barH + lineH;

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${baseFont}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(officeName, pad, startY);

    ctx.font = `${smallFont}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.fillText(
      `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      pad,
      startY + lineH,
    );

    const timestamp = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    ctx.fillText(timestamp, pad, startY + lineH * 2);

    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(base64);
  }

  const nowStr = new Date().toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

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
          {/* Video fills the entire screen */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Back button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-opacity active:opacity-70"
            aria-label="Tutup kamera"
          >
            <ChevronBackIcon className="size-5" strokeWidth={2} />
          </button>

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-white/80">{error}</p>
            </div>
          )}

          {/* Bottom overlay: watermark info + capture button */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* Watermark info bar */}
            {ready && (
              <div className="bg-black/58 px-4 pt-3 pb-24">
                <p className="text-sm font-bold text-white leading-snug">
                  {officeName}
                </p>
                <p className="mt-0.5 text-xs text-white/80">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
                <p className="text-xs text-white/80">{nowStr}</p>
              </div>
            )}

            {/* Capture button — centered, above safe area */}
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

          {/* Hidden canvas for rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
