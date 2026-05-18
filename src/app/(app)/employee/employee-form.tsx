"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  createEmployee,
  updateEmployee,
} from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import { ChevronBackIcon } from "@/components/icons/outline";
import { FormField, FormSelect } from "@/app/components/form-field";

type Mode = { kind: "create" } | { kind: "edit"; employee: Employee };

const roleOptions = [
  { value: "employee", label: "Karyawan" },
  { value: "administrator", label: "Administrator" },
];

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

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      if (mode.kind === "create") {
        const user = await createEmployee(token, {
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          role,
        });
        router.replace(`/employee/${user.id}`);
      } else {
        const updated = await updateEmployee(token, mode.employee.id, {
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
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-foreground"
          aria-label="Back"
        >
          <ChevronBackIcon className="size-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">
          {mode.kind === "create" ? "Tambah Karyawan" : "Edit Karyawan"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 space-y-4 px-5 pb-32 pt-2"
      >
        <FormField
          label="Nama Lengkap"
          placeholder="Contoh: Budi Santoso"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={fieldErrors.name}
        />

        <FormField
          label="Username"
          placeholder="budi.santoso"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          required
          error={fieldErrors.username}
        />

        <FormField
          label="Email"
          type="email"
          placeholder="budi@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          required
          error={fieldErrors.email}
        />

        <FormField
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

        <FormSelect
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as "administrator" | "employee")}
          options={roleOptions}
          error={fieldErrors.role}
        />

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {errorMessage}
          </motion.div>
        )}
      </form>

      <div className="sticky bottom-[92px] mt-auto px-5 pb-3 pt-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:opacity-80"
        >
          {submitting
            ? "Menyimpan..."
            : mode.kind === "create"
              ? "Buat Karyawan"
              : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}
