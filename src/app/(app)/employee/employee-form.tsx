"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
} from "@/lib/api/client";
import { mutateCreateEmployee, mutateUpdateEmployee } from "@/lib/api/mutations";
import type { Employee } from "@/lib/api/types";
import { ChevronBackIcon, ChevronDownIcon } from "@/components/icons/outline";
import { Button, Card, Input } from "@/components/ui";
import { BottomSheet } from "@/app/components/bottom-sheet";
import { DesktopFormPanel } from "@/app/components/desktop-form-panel";

type Mode = { kind: "create" } | { kind: "edit"; employee: Employee };

const ROLE_OPTIONS: { value: "employee" | "administrator"; label: string }[] = [
  { value: "employee", label: "Karyawan" },
  { value: "administrator", label: "Administrator" },
];

const USERNAME_RULE =
  "Gunakan huruf, angka, tanda hubung (-), atau underscore (_), maksimal 100 karakter.";

export function EmployeeForm({ mode }: { mode: Mode }) {
  const { token } = useAuth();
  const router = useRouter();
  const initial =
    mode.kind === "edit"
      ? mode.employee
      : { name: "", username: "", email: "", role: "employee" as const };

  const [name, setName] = useState(initial.name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"administrator" | "employee">(
    (initial.role as "administrator" | "employee") ?? "employee",
  );

  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      if (mode.kind === "create") {
        const user = await mutateCreateEmployee(token, {
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          role,
        });
        router.replace(`/employee/${user.id}`);
      } else {
        const updated = await mutateUpdateEmployee(token, mode.employee.id, {
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          role,
          ...(password ? { password } : {}),
        });
        router.replace(`/employee/${updated.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        const data = err.data as { errors?: Record<string, string[]> } | null;
        if (data?.errors) {
          const flattened: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.errors)) {
            flattened[k] = v[0];
          }
          setFieldErrors(flattened);
        }
      } else {
        setErrorMessage("Terjadi kesalahan. Coba lagi.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col lg:px-10 lg:py-8">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3 lg:px-0 lg:pt-0">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronBackIcon className="size-6" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">
          {mode.kind === "create" ? "Tambah Karyawan" : "Edit Karyawan"}
        </h1>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex-1 px-5 pb-32 pt-2 lg:px-0 lg:pb-8"
      >
        <DesktopFormPanel
          title={mode.kind === "create" ? "Tambah Karyawan" : "Edit Karyawan"}
          description="Atur identitas akun, kredensial masuk, dan peran akses karyawan."
          actions={
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="py-3"
              loading={submitting}
              loadingText="Menyimpan..."
            >
              {mode.kind === "create" ? "Buat Karyawan" : "Simpan Perubahan"}
            </Button>
          }
        >
        <Card className="p-4 space-y-4 lg:p-5">
        <h3 className="text-sm font-bold text-foreground">Informasi Karyawan</h3>
        <Input
          label="Nama Lengkap"
          placeholder="Contoh: Budi Santoso"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={fieldErrors.name}
        />

        <Input
          label="Username"
          placeholder="contoh: budi_santoso"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          required
          hint={USERNAME_RULE}
          error={fieldErrors.username}
        />

        <Input
          label="Email"
          type="email"
          placeholder="budi@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          required
          error={fieldErrors.email}
        />

        <Input
          label={mode.kind === "create" ? "Password" : "Password baru"}
          type="password"
          placeholder={
            mode.kind === "create" ? "Minimum 8 karakter" : "Kosongkan jika tidak diubah"
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required={mode.kind === "create"}
          error={fieldErrors.password}
        />

        {/* Role picker */}
        <div>
          <span className="block text-sm font-medium text-foreground">Role</span>
          <button
            type="button"
            onClick={() => setRoleSheetOpen(true)}
            className={`mt-1.5 flex h-11 w-full items-center justify-between rounded-2xl bg-white px-4 text-sm ring-1 transition-shadow ${fieldErrors.role ? "ring-red-300" : "ring-taupe-200"}`}
          >
            <span className="text-foreground">
              {ROLE_OPTIONS.find((o) => o.value === role)?.label}
            </span>
            <ChevronDownIcon strokeWidth={2} className="size-4 text-taupe-400" />
          </button>
          {fieldErrors.role && (
            <span className="mt-1 block text-xs text-red-500">{fieldErrors.role}</span>
          )}
        </div>
        </Card>

        <BottomSheet
          open={roleSheetOpen}
          onClose={() => setRoleSheetOpen(false)}
          title="Pilih Role"
        >
          {ROLE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { setRole(o.value); setRoleSheetOpen(false); }}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium text-foreground transition-colors active:bg-taupe-50"
            >
              <span>{o.label}</span>
              {o.value === role && (
                <svg viewBox="0 0 24 24" className="size-4 text-foreground" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </BottomSheet>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {errorMessage}
          </motion.div>
        )}
        </DesktopFormPanel>
      </form>

      <div className="sticky bottom-4 z-10 mt-auto px-5 pb-3 pt-3 lg:hidden">
        <Button
          variant="primary"
          fullWidth
          className="py-3"
          onClick={() => formRef.current?.requestSubmit()}
          loading={submitting}
          loadingText="Menyimpan..."
        >
          {mode.kind === "create" ? "Buat Karyawan" : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
