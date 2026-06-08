"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useOffice } from "@/lib/api/hooks";
import { OfficeForm } from "../../office-form";

export default function OfficeEditPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { data: office, isLoading } = useOffice(id);
  const isAdministrator = user?.role === "administrator";

  useEffect(() => {
    if (user && !isAdministrator) {
      router.replace("/office");
    }
  }, [isAdministrator, router, user]);

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

  if (!office) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-taupe-400">Kantor tidak ditemukan.</p>
      </div>
    );
  }

  return <OfficeForm mode={{ kind: "edit", office }} />;
}
