"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AdminOnly({
  children,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdministrator = user?.role === "administrator";

  useEffect(() => {
    if (user && !isAdministrator) {
      router.replace(redirectTo);
    }
  }, [isAdministrator, redirectTo, router, user]);

  if (!isAdministrator) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
