"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAttendanceRequests } from "@/lib/api/hooks";
import {
  mutateCreateAttendanceRequest,
  mutateReviewAttendanceRequest,
} from "@/lib/api/mutations";
import { apiErrorMessage, apiSuccessMessage } from "@/lib/toast-messages";
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
import {
  countRequestWorkdays,
  formatRequestDateRange,
  formatRequestWorkdayTotal,
  INVALID_REQUEST_DATE_RANGE_MESSAGE,
  isInvalidRequestDateRange,
} from "@/lib/request-dates";
import { Button, Card, Textarea } from "@/components/ui";
import {
  ChevronBackIcon,
  ChevronRightIcon,
  EyeIcon,
} from "@/components/icons/outline";
import {
  DesktopToolbar,
  ResponsiveDataTable,
} from "@/app/components/responsive-data-table";
import { DesktopFormPanel } from "@/app/components/desktop-form-panel";
import { AppPage } from "@/app/components/responsive-layout";
import {
  TableActionButton,
  TableActionGroup,
} from "@/app/components/table-row-actions";
import {
  AttendanceStatusBadge,
  RequestStatusBadge,
} from "@/app/components/attendance-status-badge";
import { DateRangeFields } from "@/app/components/date-range-fields";
import { CameraCapture } from "@/app/components/camera-capture";
import { ProofPhotoInput } from "@/app/components/proof-photo-input";
import { RequestReviewSheet } from "@/app/components/request-review-sheet";
import { useToast } from "@/app/components/toast-provider";

type RequestFilter = AttendanceRequestApprovalStatus | "all";
type RequestLocation = { latitude: number; longitude: number };
type LocationFailureReason = "denied" | "unsupported" | "unavailable";
const GEO_PERMISSION_DENIED = 1;

class LocationLookupError extends Error {
  constructor(readonly reason: LocationFailureReason) {
    super(reason);
  }
}

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
          {formatRequestDateRange(request)}
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
  const toast = useToast();
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isPreparingCamera, setIsPreparingCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [requestLocation, setRequestLocation] =
    useState<RequestLocation | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<AttendanceRequest | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const sortedRequests = useMemo(() => sortRequests(requests), [requests]);
  const invalidDateRange = isInvalidRequestDateRange(startDate, endDate);
  const workdayCount = countRequestWorkdays(startDate, endDate);
  const canSubmit =
    !invalidDateRange &&
    description.trim().length > 0 &&
    proofPhoto.trim().length > 0;

  async function handleSubmitRequest() {
    if (!token || !canSubmit) return;

    setIsSubmitting(true);
    setSubmitError("");
    setCameraError("");
    setSubmitSuccess("");
    try {
      const result = await mutateCreateAttendanceRequest(token, {
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
      const message = apiSuccessMessage(result, "Pengajuan berhasil dikirim.");
      setSubmitSuccess(message);
      toast.success(message);
    } catch (err) {
      const message = apiErrorMessage(err, "Gagal mengirim pengajuan.");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resolveRequestLocation() {
    if (!navigator.geolocation) {
      throw new LocationLookupError("unsupported");
    }

    try {
      const permission = await navigator.permissions?.query({
        name: "geolocation" as PermissionName,
      });

      if (permission?.state === "denied") {
        throw new LocationLookupError("denied");
      }
    } catch (error) {
      if (error instanceof LocationLookupError) {
        throw error;
      }
    }

    function getPosition(options: PositionOptions) {
      return new Promise<RequestLocation>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          reject,
          options,
        );
      });
    }

    function watchPositionOnce(options: PositionOptions) {
      return new Promise<RequestLocation>((resolve, reject) => {
        let watchId: number | null = null;
        const timerId = window.setTimeout(() => {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          reject(new LocationLookupError("unavailable"));
        }, options.timeout ?? 15000);

        watchId = navigator.geolocation.watchPosition(
          (position) => {
            window.clearTimeout(timerId);
            if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
            }
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            window.clearTimeout(timerId);
            if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
            }
            reject(error);
          },
          options,
        );
      });
    }

    try {
      return await getPosition({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120000,
      });
    } catch (error) {
      const positionError = error as GeolocationPositionError;

      if (positionError?.code === GEO_PERMISSION_DENIED) {
        throw new LocationLookupError("denied");
      }
    }

    try {
      return await getPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      });
    } catch (error) {
      const positionError = error as GeolocationPositionError;

      if (positionError?.code === GEO_PERMISSION_DENIED) {
        throw new LocationLookupError("denied");
      }
    }

    try {
      return await watchPositionOnce({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });
    } catch (error) {
      const positionError = error as GeolocationPositionError;

      if (positionError?.code === GEO_PERMISSION_DENIED) {
        throw new LocationLookupError("denied");
      }

      throw new LocationLookupError("unavailable");
    }
  }

  function locationErrorMessage(error: unknown) {
    if (
      error instanceof LocationLookupError &&
      (error.reason === "denied" || error.reason === "unsupported")
    ) {
      return "Lokasi saat ini diperlukan untuk mengambil foto bukti. Izinkan akses lokasi lalu coba lagi.";
    }

    return "Lokasi belum terbaca. Pastikan GPS atau layanan lokasi aktif, tunggu sebentar, lalu coba lagi.";
  }

  async function handleOpenCamera() {
    if (isPreparingCamera) return;

    setIsPreparingCamera(true);
    setSubmitError("");
    setSubmitSuccess("");
    setCameraError("");

    try {
      const location = await resolveRequestLocation();
      setRequestLocation(location);
      setCameraOpen(true);
    } catch (error) {
      const message = locationErrorMessage(error);
      setCameraError(message);
      toast.error(message);
    } finally {
      setIsPreparingCamera(false);
    }
  }

  function handleRequestCameraCapture(base64: string) {
    setProofPhoto(base64);
    setCameraOpen(false);
    setCameraError("");
  }

  async function handleReview(data: AttendanceRequestReviewInput) {
    if (!token || !selectedRequest) return;

    setIsReviewing(true);
    setReviewError("");
    try {
      const result = await mutateReviewAttendanceRequest(token, selectedRequest.id, data);
      toast.success(apiSuccessMessage(result, "Review pengajuan berhasil disimpan."));
      setSelectedRequest(null);
    } catch (err) {
      const message = apiErrorMessage(err, "Gagal mereview pengajuan.");
      setReviewError(message);
      toast.error(message);
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <AppPage size="wide" className="pb-6">
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
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
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

          <DesktopToolbar className="mb-5">
            <div className="flex flex-wrap gap-2">
              {ADMIN_FILTERS.map((filter) => {
                const selected = requestFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setRequestFilter(filter.value)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors active:opacity-80 ${
                      selected
                        ? "bg-primary text-white"
                        : "bg-taupe-100 text-taupe-500"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <span className="shrink-0 rounded-full bg-taupe-50 px-3 py-1 text-xs font-semibold text-taupe-500 ring-1 ring-taupe-200">
              {sortedRequests.length} pengajuan
            </span>
          </DesktopToolbar>

          <ResponsiveDataTable
            aria-label="Daftar pengajuan absensi"
            columns={[
              {
                key: "employee",
                header: "Karyawan",
                cell: (request) => (
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {request.user?.name ?? `Karyawan #${request.user_id}`}
                    </p>
                    {request.user?.email && (
                      <p className="truncate text-xs text-taupe-400">
                        {request.user.email}
                      </p>
                    )}
                  </div>
                ),
                className: "w-[24%]",
              },
              {
                key: "type",
                header: "Tipe",
                cell: (request) => (
                  <AttendanceStatusBadge status={request.type} />
                ),
                className: "w-[14%]",
              },
              {
                key: "date",
                header: "Tanggal",
                cell: (request) => formatRequestDateRange(request),
                className: "w-[20%] text-taupe-500",
              },
              {
                key: "status",
                header: "Status",
                cell: (request) => (
                  <RequestStatusBadge status={request.approval_status} />
                ),
                className: "w-[14%]",
              },
              {
                key: "description",
                header: "Keterangan",
                cell: (request) => (
                  <span className="block truncate text-taupe-500">
                    {request.description}
                  </span>
                ),
                className: "w-[18%]",
              },
              {
                key: "action",
                header: "Aksi",
                cell: (request) => (
                  <TableActionGroup>
                    <TableActionButton
                      label={`Review pengajuan #${request.id}`}
                      onClick={() => {
                        setReviewError("");
                        setSelectedRequest(request);
                      }}
                    >
                      <EyeIcon className="size-4" />
                    </TableActionButton>
                  </TableActionGroup>
                ),
                align: "right",
                className: "w-[10%]",
              },
            ]}
            rows={sortedRequests}
            getRowKey={(request) => request.id}
            emptyMessage={`Tidak ada pengajuan ${
              requestFilter === "all"
                ? ""
                : REQUEST_STATUS_META[requestFilter].label.toLowerCase()
            }`}
            loading={isLoading}
          />

          {isLoading ? (
            <div className="space-y-2 lg:hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm"
                />
              ))}
            </div>
          ) : sortedRequests.length === 0 ? (
            <p className="mt-10 text-center text-sm text-taupe-400 lg:hidden">
              Tidak ada pengajuan {requestFilter === "all" ? "" : REQUEST_STATUS_META[requestFilter].label.toLowerCase()}
            </p>
          ) : (
            <div className="space-y-2 lg:hidden">
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
        <div className="space-y-6">
          <DesktopFormPanel
            title="Pengajuan Absensi"
            description="Ajukan sakit, izin, atau cuti dengan rentang tanggal, keterangan, dan foto bukti."
            actions={
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
            }
          >
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
              showInvalidRangeError={false}
            />

            <p
              className={`rounded-xl px-3 py-2 text-xs font-medium ${
                invalidDateRange
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-primary"
              }`}
            >
              {invalidDateRange
                ? INVALID_REQUEST_DATE_RANGE_MESSAGE
                : `Total: ${formatRequestWorkdayTotal(workdayCount)}`}
            </p>

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
              onChange={(value) => {
                setProofPhoto(value);
                setCameraError("");
              }}
              onCameraClick={handleOpenCamera}
              cameraLoading={isPreparingCamera}
              error={
                proofPhoto.trim().length === 0 && submitError
                  ? "Foto bukti wajib diisi."
                  : undefined
              }
            />

            {(submitError || cameraError) && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {submitError || cameraError}
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
              className="h-12 lg:hidden"
              disabled={!canSubmit}
              loading={isSubmitting}
              loadingText="Mengirim..."
              onClick={handleSubmitRequest}
            >
              Kirim Pengajuan
            </Button>
          </DesktopFormPanel>

          <section>
            <h2 className="mb-3 text-base font-bold text-foreground">
              Riwayat Pengajuan
            </h2>
            <ResponsiveDataTable
              aria-label="Riwayat pengajuan"
              columns={[
                {
                  key: "type",
                  header: "Tipe",
                  cell: (request) => (
                    <AttendanceStatusBadge status={request.type} />
                  ),
                  className: "w-[18%]",
                },
                {
                  key: "date",
                  header: "Tanggal",
                  cell: (request) => formatRequestDateRange(request),
                  className: "w-[26%] text-taupe-500",
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (request) => (
                    <RequestStatusBadge status={request.approval_status} />
                  ),
                  className: "w-[20%]",
                },
                {
                  key: "description",
                  header: "Keterangan",
                  cell: (request) => (
                    <span className="block truncate text-taupe-500">
                      {request.description}
                    </span>
                  ),
                  className: "w-[24%]",
                },
                {
                  key: "action",
                  header: "Aksi",
                  cell: (request) => (
                    <TableActionGroup>
                      <TableActionButton
                        label={`Lihat detail pengajuan #${request.id}`}
                        onClick={() => {
                          setReviewError("");
                          setSelectedRequest(request);
                        }}
                      >
                        <EyeIcon className="size-4" />
                      </TableActionButton>
                    </TableActionGroup>
                  ),
                  align: "right",
                  className: "w-[12%]",
                },
              ]}
              rows={sortedRequests}
              getRowKey={(request) => request.id}
              emptyMessage="Belum ada pengajuan"
              loading={isLoading}
            />
            {isLoading ? (
              <div className="space-y-2 lg:hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm"
                  />
                ))}
              </div>
            ) : sortedRequests.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-taupe-400 ring-1 ring-taupe-200 shadow-sm lg:hidden">
                Belum ada pengajuan
              </p>
            ) : (
              <div className="space-y-2 lg:hidden">
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
        readOnly={!isAdministrator}
      />

      {!isAdministrator && requestLocation && (
        <CameraCapture
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleRequestCameraCapture}
          initialFacingMode="environment"
          watermarkLines={[
            `${requestLocation.latitude.toFixed(6)}, ${requestLocation.longitude.toFixed(6)}`,
          ]}
        />
      )}
    </AppPage>
  );
}
