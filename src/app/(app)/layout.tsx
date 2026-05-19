"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/app/components/bottom-nav";
import { PermissionGate } from "@/app/components/permission-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-taupe-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-taupe-200 border-t-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PermissionGate>
      <div className="mx-auto flex h-full max-w-md flex-col bg-taupe-50">
        <main className="flex-1 overflow-y-auto page-content pb-28">{children}</main>
        <BottomNav />
      </div>
    </PermissionGate>
  );
}
