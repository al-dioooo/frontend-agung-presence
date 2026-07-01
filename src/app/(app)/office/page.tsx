"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useOffices } from "@/lib/api/hooks";
import { mutateDeleteOffice } from "@/lib/api/mutations";
import type {
  Office,
  OfficeActiveStatusFilter,
  OfficeSort,
} from "@/lib/api/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Button, Card, SearchInput } from "@/components/ui";
import {
  ChevronRightIcon,
  CurrentLocationIcon,
  EyeIcon,
  FilterIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons/outline";
import { BottomSheet } from "@/app/components/bottom-sheet";
import {
  SearchableSelectionDialog,
  type FilterSelectionOption,
} from "@/app/components/filter-controls";
import {
  DesktopToolbar,
  ResponsiveDataTable,
} from "@/app/components/responsive-data-table";
import { AppPage } from "@/app/components/responsive-layout";
import {
  TableActionButton,
  TableActionGroup,
  TableActionLink,
} from "@/app/components/table-row-actions";

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function OfficePage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] =
    useState<OfficeActiveStatusFilter>("all");
  const [sortMode, setSortMode] = useState<OfficeSort>("name");
  const [activeStatusOpen, setActiveStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [nearestLocation, setNearestLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const isAdministrator = user?.role === "administrator";
  const debouncedSearch = useDebouncedValue(search);
  const nearestActive = sortMode === "nearest" && nearestLocation !== null;
  const { data: offices = [], isLoading } = useOffices({
    search: debouncedSearch,
    active_only: !isAdministrator,
    active_status: isAdministrator ? activeStatus : undefined,
    sort: nearestActive ? "nearest" : "name",
    latitude: nearestLocation?.lat,
    longitude: nearestLocation?.lng,
  });
  const [officeToDelete, setOfficeToDelete] = useState<Office | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const activeStatusOptions: FilterSelectionOption[] = [
    { value: "all", title: "Semua status", subtitle: "Aktif dan nonaktif" },
    { value: "active", title: "Aktif", subtitle: "Kantor aktif saja" },
    { value: "inactive", title: "Nonaktif", subtitle: "Kantor nonaktif saja" },
  ];
  const sortOptions: FilterSelectionOption[] = [
    { value: "name", title: "Nama", subtitle: "Urut berdasarkan nama" },
    {
      value: "nearest",
      title: "Terdekat",
      subtitle: "Gunakan lokasi perangkat saat ini",
    },
  ];
  const activeStatusLabel =
    activeStatusOptions.find((option) => option.value === activeStatus)?.title ??
    "Semua status";
  const sortLabel =
    sortOptions.find((option) => option.value === sortMode)?.title ?? "Nama";
  const hasOfficeFilters =
    search.trim() !== "" ||
    (isAdministrator && activeStatus !== "all") ||
    nearestActive;

  function resolveCurrentLocation() {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation unsupported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        },
      );
    });
  }

  async function enableNearestSorting() {
    setIsResolvingLocation(true);
    setLocationError("");
    try {
      const location = await resolveCurrentLocation();
      setNearestLocation(location);
      setSortMode("nearest");
    } catch {
      setNearestLocation(null);
      setSortMode("name");
      setLocationError(
        "Lokasi saat ini belum tersedia. Izinkan akses lokasi untuk mengurutkan kantor terdekat.",
      );
    } finally {
      setIsResolvingLocation(false);
    }
  }

  function handleSortSelect(option: FilterSelectionOption) {
    if (option.value === "nearest") {
      void enableNearestSorting();
      return;
    }

    setSortMode("name");
    setNearestLocation(null);
    setLocationError("");
  }

  async function handleDeleteOffice() {
    if (!token || !officeToDelete) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      await mutateDeleteOffice(token, officeToDelete.id, { currentList: offices });
      setOfficeToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Gagal menghapus kantor.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function closeDeleteConfirmation() {
    if (isDeleting) return;
    setDeleteError("");
    setOfficeToDelete(null);
  }

  return (
    <AppPage size="wide">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground md:text-2xl">Office</h1>
        {isAdministrator && (
          <Button href="/office/create" variant="primary" size="sm">
            + Create
          </Button>
        )}
      </div>

      <div className="mb-5 space-y-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput
              id="office-search"
              value={search}
              onChange={setSearch}
              placeholder="Search"
            />
          </div>
          {isAdministrator && (
            <Button
              variant={activeStatus !== "all" ? "primary" : "secondary"}
              size="icon"
              onClick={() => setActiveStatusOpen(true)}
              aria-label="Filter status kantor"
            >
              <FilterIcon className="size-5" />
            </Button>
          )}
          <Button
            variant={nearestActive ? "primary" : "secondary"}
            size="icon"
            onClick={() => setSortOpen(true)}
            loading={isResolvingLocation}
            aria-label="Urutkan kantor"
          >
            <CurrentLocationIcon className="size-5" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-taupe-50 px-3 py-1 text-xs font-semibold text-taupe-500 ring-1 ring-taupe-200">
            {offices.length} kantor
          </span>
          {hasOfficeFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveStatus("all");
                setSortMode("name");
                setNearestLocation(null);
                setLocationError("");
              }}
              className="rounded-full px-2 py-1 text-xs font-semibold text-taupe-500 active:opacity-70"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      <DesktopToolbar className="mb-5">
        <div className="w-full max-w-xl">
          <SearchInput
            id="office-search-desktop"
            value={search}
            onChange={setSearch}
            placeholder="Search"
          />
        </div>
        {isAdministrator && (
          <Button
            variant={activeStatus !== "all" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveStatusOpen(true)}
            leftIcon={<FilterIcon className="size-4" />}
          >
            {activeStatusLabel}
          </Button>
        )}
        <Button
          variant={nearestActive ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSortOpen(true)}
          leftIcon={<CurrentLocationIcon className="size-4" />}
          loading={isResolvingLocation}
          loadingText="Lokasi..."
        >
          {sortLabel}
        </Button>
        <span className="shrink-0 rounded-full bg-taupe-50 px-3 py-1 text-xs font-semibold text-taupe-500 ring-1 ring-taupe-200">
          {offices.length} kantor
        </span>
      </DesktopToolbar>
      {locationError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {locationError}
        </p>
      )}
      {deleteError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {deleteError}
        </p>
      )}

      <ResponsiveDataTable
        aria-label="Daftar kantor"
        columns={[
          {
            key: "name",
            header: "Kantor",
            cell: (office) => (
              <div className="min-w-0">
                <p className="truncate font-semibold">{office.name}</p>
                {office.address && (
                  <p className="truncate text-xs text-taupe-400">
                    {office.address}
                  </p>
                )}
              </div>
            ),
            className: "w-[34%]",
          },
          {
            key: "radius",
            header: "Radius",
            cell: (office) => `${office.radius}m`,
            className: "w-[12%] text-taupe-500",
          },
          {
            key: "distance",
            header: "Jarak",
            cell: (office) =>
              office.distance_meters !== undefined
                ? formatDistance(office.distance_meters)
                : "-",
            className: "w-[14%] text-taupe-500",
          },
          {
            key: "status",
            header: "Status",
            cell: (office) => (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  office.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-taupe-100 text-taupe-500"
                }`}
              >
                {office.is_active ? "Aktif" : "Nonaktif"}
              </span>
            ),
            className: "w-[14%]",
          },
          {
            key: "action",
            header: "Aksi",
            cell: (office) => (
              <TableActionGroup>
                <TableActionLink
                  href={`/office/${office.id}`}
                  label={`Lihat detail kantor ${office.name}`}
                >
                  <EyeIcon className="size-4" />
                </TableActionLink>
                {isAdministrator && (
                  <>
                    <TableActionLink
                      href={`/office/${office.id}/edit`}
                      label={`Edit kantor ${office.name}`}
                    >
                      <PencilIcon className="size-4" />
                    </TableActionLink>
                    <TableActionButton
                      label={`Hapus kantor ${office.name}`}
                      tone="danger"
                      onClick={() => {
                        setDeleteError("");
                        setOfficeToDelete(office);
                      }}
                    >
                      <TrashIcon className="size-4" />
                    </TableActionButton>
                  </>
                )}
              </TableActionGroup>
            ),
            align: "right",
            className: "w-[18%]",
          },
        ]}
        rows={offices}
        getRowKey={(office) => office.id}
        emptyMessage={hasOfficeFilters ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        loading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-2 lg:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
          ))}
        </div>
      ) : offices.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400 lg:hidden">
          {hasOfficeFilters ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        </p>
      ) : (
        <div id="office-list" className="space-y-2 lg:hidden">
          {offices.map((office) => {
            const inactive = !office.is_active;

            return (
              <Card
                key={office.id}
                href={`/office/${office.id}`}
                id={`office-item-${office.id}`}
                className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
                  inactive ? "opacity-55" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {office.name}
                    </p>
                    {inactive && (
                      <span className="shrink-0 rounded-full bg-taupe-100 px-2 py-0.5 text-[10px] font-semibold text-taupe-500">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  {office.address && (
                    <p className="mt-0.5 truncate text-xs text-taupe-400">
                      {office.address}
                    </p>
                  )}
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  {office.distance_meters !== undefined && (
                    <span
                      className={`text-xs font-semibold ${
                        office.distance_meters <= office.radius
                          ? "text-emerald-600"
                          : "text-taupe-400"
                      }`}
                    >
                      {formatDistance(office.distance_meters)}
                    </span>
                  )}
                  <ChevronRightIcon
                    strokeWidth={2.5}
                    className="size-4 shrink-0 text-taupe-300"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {isAdministrator && (
        <SearchableSelectionDialog
          open={activeStatusOpen}
          onClose={() => setActiveStatusOpen(false)}
          title="Filter Status Kantor"
          options={activeStatusOptions}
          selectedValue={activeStatus}
          onSelect={(option) =>
            setActiveStatus(option.value as OfficeActiveStatusFilter)
          }
          searchable={false}
        />
      )}
      <SearchableSelectionDialog
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Urutkan Kantor"
        options={sortOptions}
        selectedValue={sortMode}
        onSelect={handleSortSelect}
        searchable={false}
      />
      <BottomSheet
        open={officeToDelete !== null}
        onClose={closeDeleteConfirmation}
        title="Hapus Kantor?"
      >
        <div className="px-4 pt-1">
          <p className="text-sm text-taupe-400">
            Tindakan ini tidak dapat dibatalkan. Kantor{" "}
            {officeToDelete ? `"${officeToDelete.name}" ` : ""}
            akan dihapus secara permanen.
          </p>
          {deleteError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {deleteError}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 py-3"
              onClick={closeDeleteConfirmation}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1 py-3"
              onClick={handleDeleteOffice}
              loading={isDeleting}
              loadingText="Menghapus..."
            >
              Hapus
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AppPage>
  );
}
