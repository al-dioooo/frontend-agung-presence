"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getOffice } from "@/lib/api/client";
import type { Office } from "@/lib/api/types";
import { OfficeForm } from "../../office-form";

export default function OfficeEditPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [office, setOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getOffice(token, Number(id))
      .then(setOffice)
      .finally(() => setIsLoading(false));
  }, [id, token]);

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
