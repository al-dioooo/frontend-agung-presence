"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useAttendanceRequests } from "@/lib/api/hooks";
import {
  mutateCreateAttendanceRequest,
  mutateReviewAttendanceRequest,
} from "@/lib/api/mutations";
import type {
  AttendanceRequest,
  AttendanceRequestApprovalStatus,
  AttendanceRequestReviewInput,
  AttendanceRequestType,
} from "@/lib/api/types";
import {
  REQUEST_STATUS_META,
  REQUEST_TYPE_OPTIONS,
  statusLabel,
} from "@/lib/attendance-status";
import { Button, Card, Textarea } from "@/components/ui";
import { ChevronBackIcon, ChevronRightIcon } from "@/components/icons/outline";
import {
  AttendanceStatusBadge,
  RequestStatusBadge,
} from "@/app/components/attendance-status-badge";
import {
  DateRangeFields,
  formatDateKey,
} from "@/app/components/date-range-fields";
import { ProofPhotoInput } from "@/app/components/proof-photo-input";
import { RequestReviewSheet } from "@/app/components/request-review-sheet";

type RequestFilter = AttendanceRequestApprovalStatus | "all";

const ADMIN_FILTERS: { value: RequestFilter; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "all", label: "Semua" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateRange(request: AttendanceRequest) {
  if (request.start_date === request.end_date) {
    return formatDateKey(request.start_date);
  }

  return `${formatDateKey(request.start_date)} - ${formatDateKey(
    request.end_date,
  )}`;
}

function sortRequests(requests: AttendanceRequest[]) {
  return [...requests].sort(
    (left, right) =>
      new Date(right.created_at).getTime() -
      new Date(left.created_at).getTime(),
  );
}

function RequestCard({
  request,
  showUser,
  onClick,
}: {
  request: AttendanceRequest;
  showUser: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);

  const content = (
    <>
      <div className="min-w-0 flex-1">
        {showUser && (
          <p className="mb-0.5 truncate text-xs font-semibold text-foreground">
            {request.user?.name ?? `Karyawan #${request.user_id}`}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <AttendanceStatusBadge status={request.type} />
          <RequestStatusBadge status={request.approval_status} />
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">
          {formatDateRange(request)}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-taupe-400">
          {request.description}
        </p>
        {request.approval_status === "rejected" && request.rejection_reason && (
          <p className="mt-1 line-clamp-2 text-xs font-medium text-red-500">
            {request.rejection_reason}
          </p>
        )}
      </div>
      {interactive && (
        <ChevronRightIcon
          strokeWidth={2.5}
          className="size-4 shrink-0 text-taupe-300"
        />
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-taupe-200 shadow-sm transition-opacity active:opacity-80"
      >
        {content}
      </button>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3 px-4 py-3.5">
      {content}
    </Card>
  );
}

export default function PresenceRequestsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const isAdministrator = user?.role === "administrator";
  const today = toDateKey(new Date());
  const maxRequestDate = toDateKey(addDays(new Date(), 365));
  const [requestFilter, setRequestFilter] = useState<RequestFilter>(
    isAdministrator ? "pending" : "all",
  );
  const {
    data: requests = [],
    isLoading,
  } = useAttendanceRequests({ approval_status: requestFilter });

  const [selectedType, setSelectedType] =
    useState<AttendanceRequestType>("sick");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [description, setDescription] = useState("");
  const [proofPhoto, setProofPhoto] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState<AttendanceRequest | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const sortedRequests = useMemo(() => sortRequests(requests), [requests]);
  const canSubmit =
    startDate <= endDate &&
    description.trim().length > 0 &&
    proofPhoto.trim().length > 0;

  async function handleSubmitRequest() {
    if (!token || !canSubmit) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      await mutateCreateAttendanceRequest(token, {
        type: selectedType,
        start_date: startDate,
        end_date: endDate,
        description: description.trim(),
        proof_photo: proofPhoto,
      });
      setDescription("");
      setProofPhoto("");
      setStartDate(today);
      setEndDate(today);
      setSubmitSuccess("Pengajuan berhasil dikirim.");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Gagal mengirim pengajuan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReview(data: AttendanceRequestReviewInput) {
    if (!token || !selectedRequest) return;

    setIsReviewing(true);
    setReviewError("");
    try {
      await mutateReviewAttendanceRequest(token, selectedRequest.id, data);
      setSelectedRequest(null);
    } catch (err) {
      setReviewError(
        err instanceof ApiError ? err.message : "Gagal mereview pengajuan.",
      );
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="mb-5 flex items-center justify-between">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronBackIcon className="size-6" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">
          Pengajuan Absensi
        </h1>
        <div className="size-11" aria-hidden="true" />
      </div>

      {isAdministrator ? (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {ADMIN_FILTERS.map((filter) => {
              const selected = requestFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setRequestFilter(filter.value)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors active:opacity-80 ${
                    selected
                      ? "bg-primary text-white"
                      : "bg-white text-taupe-500 ring-1 ring-taupe-200"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm"
                />
              ))}
            </div>
          ) : sortedRequests.length === 0 ? (
            <p className="mt-10 text-center text-sm text-taupe-400">
              Tidak ada pengajuan {requestFilter === "all" ? "" : REQUEST_STATUS_META[requestFilter].label.toLowerCase()}
            </p>
          ) : (
            <div className="space-y-2">
              {sortedRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  showUser
                  onClick={() => {
                    setReviewError("");
                    setSelectedRequest(request);
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5">
          <section className="space-y-4">
            <div>
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-taupe-400">
                Tipe
              </p>
              <div className="grid grid-cols-1 gap-2">
                {REQUEST_TYPE_OPTIONS.map((option) => {
                  const selected = selectedType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedType(option.value)}
                      className={`rounded-2xl px-4 py-3 text-left ring-1 transition-colors active:bg-taupe-50 ${
                        selected
                          ? "bg-emerald-50 ring-primary"
                          : "bg-white ring-taupe-200"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-foreground">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-taupe-400">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <DateRangeFields
              startDate={startDate}
              endDate={endDate}
              maxDate={maxRequestDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            <Textarea
              label="Keterangan"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={`Keterangan ${statusLabel(selectedType).toLowerCase()}`}
              error={
                description.trim().length === 0 && submitError
                  ? "Keterangan wajib diisi."
                  : undefined
              }
            />

            <ProofPhotoInput
              value={proofPhoto}
              onChange={setProofPhoto}
              error={
                proofPhoto.trim().length === 0 && submitError
                  ? "Foto bukti wajib diisi."
                  : undefined
              }
            />

            {submitError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {submitError}
              </p>
            )}
            {submitSuccess && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {submitSuccess}
              </p>
            )}

            <Button
              variant="primary"
              fullWidth
              className="h-12"
              disabled={!canSubmit}
              loading={isSubmitting}
              loadingText="Mengirim..."
              onClick={handleSubmitRequest}
            >
              Kirim Pengajuan
            </Button>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-foreground">
              Riwayat Pengajuan
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm"
                  />
                ))}
              </div>
            ) : sortedRequests.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-taupe-400 ring-1 ring-taupe-200 shadow-sm">
                Belum ada pengajuan
              </p>
            ) : (
              <div className="space-y-2">
                {sortedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    showUser={false}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <RequestReviewSheet
        key={selectedRequest?.id ?? "closed"}
        request={selectedRequest}
        open={selectedRequest !== null}
        loading={isReviewing}
        error={reviewError}
        onClose={() => !isReviewing && setSelectedRequest(null)}
        onReview={handleReview}
      />
    </div>
  );
}
