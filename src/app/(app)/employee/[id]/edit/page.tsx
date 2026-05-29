"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getEmployee } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import { EmployeeForm } from "../../employee-form";

export default function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAdministrator = user?.role === "administrator";

  useEffect(() => {
    if (user && !isAdministrator) {
      router.replace("/dashboard");
    }
  }, [isAdministrator, router, user]);

  useEffect(() => {
    if (!token || !isAdministrator) return;
    getEmployee(token, Number(id))
      .then(setEmployee)
      .finally(() => setIsLoading(false));
  }, [id, isAdministrator, token]);

  if (!isAdministrator) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
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
        <p className="text-sm text-taupe-400">Karyawan tidak ditemukan.</p>
      </div>
    );
  }

  return <EmployeeForm mode={{ kind: "edit", employee }} />;
}
