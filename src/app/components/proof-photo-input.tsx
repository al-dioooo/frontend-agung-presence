"use client";

import { useRef, useState } from "react";
import { CameraIcon, DatabaseIcon, UploadIcon } from "@/components/icons/outline";
import { Button } from "@/components/ui";
import { useToast } from "@/app/components/toast-provider";

type ProofPhotoInputProps = {
  value: string;
  onChange: (value: string) => void;
  onCameraClick: () => void;
  cameraLoading?: boolean;
  error?: string;
};

export function ProofPhotoInput({
  value,
  onChange,
  onCameraClick,
  cameraLoading,
  error,
}: ProofPhotoInputProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState("");
  const toast = useToast();

  function readFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      const message = "File harus berupa gambar.";
      setFileError(message);
      toast.error(message);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileError("");
      onChange(String(reader.result));
    };
    reader.onerror = () => {
      const message = "Gagal membaca file gambar.";
      setFileError(message);
      toast.error(message);
    };
    reader.readAsDataURL(file);
  }

  const message = error || fileError;

  return (
    <div>
      <p className="text-sm font-medium text-foreground">Foto Bukti</p>
      <div className="mt-2 overflow-hidden rounded-2xl bg-white ring-1 ring-taupe-200">
        <div className="relative flex h-48 items-center justify-center bg-taupe-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Bukti pengajuan"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <DatabaseIcon className="size-9 text-taupe-300" />
              <p className="text-xs text-taupe-400">Belum ada foto</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 p-3">
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<CameraIcon className="size-4" strokeWidth={2} />}
            loading={cameraLoading}
            loadingText="Membuka..."
            onClick={onCameraClick}
          >
            Kamera
          </Button>
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<UploadIcon className="size-4" strokeWidth={2} />}
            onClick={() => uploadInputRef.current?.click()}
          >
            Galeri
          </Button>
        </div>
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => readFile(event.target.files?.[0])}
      />

      {message && (
        <p className="mt-1 text-xs text-red-500">{message}</p>
      )}
    </div>
  );
}
