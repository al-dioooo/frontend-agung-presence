"use client";

import { useState } from "react";
import type {
  AttendanceRequest,
  AttendanceRequestReviewInput,
} from "@/lib/api/types";
import { REQUEST_STATUS_META } from "@/lib/attendance-status";
import { Button, Textarea } from "@/components/ui";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { formatDateKey } from "@/app/components/date-range-fields";
import {
  AttendanceStatusBadge,
  RequestStatusBadge,
} from "@/app/components/attendance-status-badge";

type RequestReviewSheetProps = {
  request: AttendanceRequest | null;
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onReview: (data: AttendanceRequestReviewInput) => void;
};

function formatDateRange(request: AttendanceRequest) {
  if (request.start_date === request.end_date) {
    return formatDateKey(request.start_date);
  }

  return `${formatDateKey(request.start_date)} - ${formatDateKey(
    request.end_date,
  )}`;
}

export function RequestReviewSheet({
  request,
  open,
  loading = false,
  error,
  onClose,
  onReview,
}: RequestReviewSheetProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const pending = request?.approval_status === "pending";

  return (
    <BottomSheet
      open={open && request !== null}
      onClose={onClose}
      title="Review Pengajuan"
    >
      {request && (
        <div className="space-y-4 px-2 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {request.user?.name ?? `Karyawan #${request.user_id}`}
              </p>
              {request.user && (
                <p className="truncate text-xs text-taupe-400">
                  @{request.user.username} · {request.user.email}
                </p>
              )}
            </div>
            <RequestStatusBadge status={request.approval_status} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-taupe-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-taupe-400">
                Tipe
              </p>
              <div className="mt-1">
                <AttendanceStatusBadge status={request.type} />
              </div>
            </div>
            <div className="rounded-2xl bg-taupe-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase text-taupe-400">
                Tanggal
              </p>
              <p className="mt-1 text-xs font-medium text-foreground">
                {formatDateRange(request)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-taupe-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase text-taupe-400">
              Keterangan
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
              {request.description}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-taupe-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.proof_photo}
              alt="Bukti pengajuan"
              className="max-h-[45vh] w-full object-cover"
            />
          </div>

          {!pending && (
            <div className="rounded-2xl bg-taupe-50 px-4 py-3">
              <p className="text-xs font-semibold text-foreground">
                {REQUEST_STATUS_META[request.approval_status].label}
              </p>
              <p className="mt-1 text-xs text-taupe-500">
                Reviewer: {request.reviewer?.name ?? "Administrator"}
              </p>
              {request.rejection_reason && (
                <p className="mt-2 text-xs text-red-500">
                  {request.rejection_reason}
                </p>
              )}
            </div>
          )}

          {pending && (
            <>
              <Textarea
                label="Alasan Penolakan"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Wajib diisi jika menolak"
              />

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="danger"
                  fullWidth
                  className="h-12"
                  disabled={rejectionReason.trim().length === 0 || loading}
                  loading={loading}
                  loadingText="Memproses..."
                  onClick={() =>
                    onReview({
                      approval_status: "rejected",
                      rejection_reason: rejectionReason.trim(),
                    })
                  }
                >
                  Tolak
                </Button>
                <Button
                  variant="success"
                  fullWidth
                  className="h-12"
                  disabled={loading}
                  loading={loading}
                  loadingText="Memproses..."
                  onClick={() => onReview({ approval_status: "approved" })}
                >
                  Setujui
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
