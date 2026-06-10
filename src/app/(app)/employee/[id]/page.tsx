"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { useEmployee } from "@/lib/api/hooks";
import { mutateDeleteEmployee } from "@/lib/api/mutations";
import {
  ChevronBackIcon,
  DotsIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnterpriseIcon,
  MailIcon,
} from "@/components/icons/outline";
import { BottomSheet, BottomSheetItem } from "@/app/components/bottom-sheet";
import { Button, Card } from "@/components/ui";

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

  const { data: employee, isLoading, error: fetchError } = useEmployee(id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user && !isAdministrator) {
      router.replace("/dashboard");
    }
  }, [isAdministrator, router, user]);

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
      await mutateDeleteEmployee(token, employee.id);
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
          {fetchError?.message || errorMessage || "Karyawan tidak ditemukan."}
        </p>
        <Button
          variant="link"
          className="mt-4"
          onClick={() => router.back()}
        >
          Kembali
        </Button>
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
        <Button
          variant="secondary"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronBackIcon className="size-6" />
        </Button>
        {!isProtected && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setSheetOpen(true)}
            aria-label="Open actions"
          >
            <DotsIcon className="size-6" />
          </Button>
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
            <Button
              variant="secondary"
              className="flex-1 py-3"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1 py-3"
              onClick={handleDelete}
              loading={isDeleting}
              loadingText="Menghapus..."
            >
              Hapus
            </Button>
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
      <div className="flex-1 px-5">
        <Card className="p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Informasi Karyawan</h3>
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
        <InfoRow
          icon={<EnterpriseIcon className="size-[18px] text-taupe-400" />}
          label="Bergabung"
          value={joinedAt}
        />
        </Card>
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
          <Button
            variant="primary"
            fullWidth
            className="py-3"
            onClick={() => router.push(`/employee/${id}/edit`)}
          >
            Edit Karyawan
          </Button>
        </div>
      )}
    </div>
  );
}
