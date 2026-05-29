"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, deleteEmployee, getEmployee } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import {
  ChevronBackIcon,
  DotsIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnterpriseIcon,
  CommunityIcon,
  MailIcon,
} from "@/components/icons/outline";
import { BottomSheet, BottomSheetItem } from "@/app/components/bottom-sheet";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-taupe-100">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 break-words text-xs text-taupe-400">{value}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const isAdministrator = user?.role === "administrator";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user && !isAdministrator) {
      router.replace("/dashboard");
    }
  }, [isAdministrator, router, user]);

  useEffect(() => {
    if (!token || !isAdministrator) return;

    getEmployee(token, Number(id))
      .then(setEmployee)
      .catch((err) => {
        setErrorMessage(
          err instanceof ApiError ? err.message : "Gagal memuat data karyawan.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [id, isAdministrator, token]);

  if (!isAdministrator) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  async function handleDelete() {
    if (!token || !employee) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(token, employee.id);
      router.replace("/employee");
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Gagal menghapus karyawan.",
      );
      setConfirmDelete(false);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-taupe-400">
          {errorMessage || "Karyawan tidak ditemukan."}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm font-medium text-foreground underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  const joinedAt = new Date(employee.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Protect administrator accounts and the current user's own account from edit/delete
  const isProtected =
    employee.role === "administrator" || user?.id === employee.id;

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={() => router.back()}
          className="text-foreground"
          aria-label="Back"
        >
          <ChevronBackIcon className="size-6" />
        </button>
        {!isProtected && (
          <button
            onClick={() => setSheetOpen(true)}
            className="text-foreground"
            aria-label="Open actions"
          >
            <DotsIcon className="size-6" />
          </button>
        )}
      </div>

      {/* Actions bottom sheet */}
      {!isProtected && (
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <BottomSheetItem
            icon={<PencilIcon className="size-5" strokeWidth={2} />}
            label="Edit"
            onClick={() => {
              setSheetOpen(false);
              router.push(`/employee/${id}/edit`);
            }}
          />
          <BottomSheetItem
            icon={<TrashIcon className="size-5" strokeWidth={2} />}
            label="Delete"
            variant="danger"
            onClick={() => {
              setSheetOpen(false);
              setConfirmDelete(true);
            }}
          />
        </BottomSheet>
      )}

      {/* Delete confirmation bottom sheet */}
      <BottomSheet
        open={confirmDelete}
        onClose={() => !isDeleting && setConfirmDelete(false)}
        title="Hapus Karyawan?"
      >
        <div className="px-4 pt-1">
          <p className="text-sm text-taupe-400">
            Tindakan ini tidak dapat dibatalkan. Data karyawan akan dihapus secara permanen.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="flex-1 rounded-full border border-taupe-200 py-3 text-sm font-semibold text-foreground transition-opacity disabled:opacity-50 active:opacity-70"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 active:opacity-80"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center px-5 pt-4 pb-6"
      >
        <div className="flex size-20 items-center justify-center rounded-full bg-taupe-100">
          <UserIcon className="size-10 text-taupe-300" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground">{employee.name}</h2>
        <span className="mt-1 rounded-full bg-taupe-100 px-3 py-1 text-xs font-medium capitalize text-taupe-500">
          {employee.role}
        </span>
      </motion.div>

      {/* Info rows */}
      <div className="flex-1 space-y-4 px-5">
        <InfoRow
          icon={<UserIcon className="size-[18px] text-taupe-400" />}
          label="Username"
          value={`@${employee.username}`}
        />
        <InfoRow
          icon={<MailIcon className="size-[18px] text-taupe-400" strokeWidth={2} />}
          label="Email"
          value={employee.email}
        />
        {employee.phone && (
          <InfoRow
            icon={<CommunityIcon className="size-[18px] text-taupe-400" />}
            label="Phone"
            value={employee.phone}
          />
        )}
        <InfoRow
          icon={<EnterpriseIcon className="size-[18px] text-taupe-400" />}
          label="Bergabung"
          value={joinedAt}
        />
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            key="error-message"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mx-5 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA — hidden for protected accounts */}
      {!isProtected && (
        <div className="sticky bottom-4 mt-auto px-5 pb-4 pt-4">
          <button
            onClick={() => router.push(`/employee/${id}/edit`)}
            className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-white transition-opacity active:opacity-80"
          >
            Edit Karyawan
          </button>
        </div>
      )}
    </div>
  );
}
