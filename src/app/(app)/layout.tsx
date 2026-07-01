"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/app/components/bottom-nav";
import { DesktopSidebar } from "@/app/components/desktop-sidebar";
import { PermissionGate } from "@/app/components/permission-gate";
import { PageTransition } from "@/app/components/page-transition";
import { RefreshLayoutGuard } from "@/app/components/refresh-layout-guard";

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
      <div className="flex h-dvh w-full overflow-hidden">
        <RefreshLayoutGuard />
        <DesktopSidebar />
        <main className="page-content mx-auto flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pb-28 lg:mx-0 lg:pb-0">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-4xl lg:max-w-none">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <BottomNav />
      </div>
    </PermissionGate>
  );
}
