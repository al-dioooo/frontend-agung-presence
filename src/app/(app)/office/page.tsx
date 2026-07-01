"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useOffices } from "@/lib/api/hooks";
import { mutateDeleteOffice } from "@/lib/api/mutations";
import type { Office } from "@/lib/api/types";
import { Button, Card, SearchInput } from "@/components/ui";
import {
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons/outline";
import { BottomSheet } from "@/app/components/bottom-sheet";
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

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function OfficePage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const isAdministrator = user?.role === "administrator";
  const { data: offices = [], isLoading } = useOffices(
    undefined,
    !isAdministrator,
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [officeToDelete, setOfficeToDelete] = useState<Office | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Request geolocation once on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  const filtered = (() => {
    const searchTerm = search.toLowerCase();
    const list = offices.filter(
      (o) =>
        o.name.toLowerCase().includes(searchTerm) ||
        (o.address ?? "").toLowerCase().includes(searchTerm),
    );

    if (!userLocation) return list;

    return list
      .map((office) => ({
        ...office,
        _distance: haversineDistance(
          userLocation.lat,
          userLocation.lng,
          Number(office.latitude),
          Number(office.longitude),
        ),
      }))
      .sort((a, b) => a._distance - b._distance);
  })() as (Office & { _distance?: number })[];

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

      <div className="mb-5 lg:hidden">
        <SearchInput
          id="office-search"
          value={search}
          onChange={setSearch}
          placeholder="Search"
        />
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
        <span className="shrink-0 rounded-full bg-taupe-50 px-3 py-1 text-xs font-semibold text-taupe-500 ring-1 ring-taupe-200">
          {filtered.length} kantor
        </span>
      </DesktopToolbar>
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
              office._distance !== undefined ? formatDistance(office._distance) : "-",
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
        rows={filtered}
        getRowKey={(office) => office.id}
        emptyMessage={search ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        loading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-2 lg:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-taupe-400 lg:hidden">
          {search ? "Tidak ada kantor ditemukan" : "Belum ada data kantor"}
        </p>
      ) : (
        <div id="office-list" className="space-y-2 lg:hidden">
          {filtered.map((office) => {
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
                  {office._distance !== undefined && (
                    <span
                      className={`text-xs font-semibold ${
                        office._distance <= office.radius
                          ? "text-emerald-600"
                          : "text-taupe-400"
                      }`}
                    >
                      {formatDistance(office._distance)}
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
