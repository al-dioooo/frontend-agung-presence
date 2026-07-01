"use client";

import { useEffect, useState } from "react";
import {
  getLayoutMode,
  type LayoutMode,
} from "@/app/components/responsive-mode";

function modeLabel(mode: LayoutMode) {
  if (mode === "desktop") return "desktop";
  if (mode === "tablet") return "tablet";
  return "mobile";
}

export function RefreshLayoutGuard() {
  const [layoutState, setLayoutState] = useState<{
    initialMode: LayoutMode;
    currentMode: LayoutMode;
    requiresRefresh: boolean;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const mode = getLayoutMode(window.innerWidth);
    return {
      initialMode: mode,
      currentMode: mode,
      requiresRefresh: false,
    };
  });

  const initialMode = layoutState?.initialMode ?? null;
  const currentMode = layoutState?.currentMode ?? null;
  const requiresRefresh = layoutState?.requiresRefresh ?? false;

  useEffect(() => {
    const startingMode = initialMode ?? getLayoutMode(window.innerWidth);
    const frameId =
      initialMode === null
        ? window.requestAnimationFrame(() => {
            setLayoutState({
              initialMode: startingMode,
              currentMode: startingMode,
              requiresRefresh: false,
            });
          })
        : null;

    function handleResize() {
      const nextMode = getLayoutMode(window.innerWidth);
      setLayoutState({
        initialMode: startingMode,
        currentMode: nextMode,
        requiresRefresh: nextMode !== startingMode,
      });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [initialMode]);

  if (!requiresRefresh || !initialMode || !currentMode) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="refresh-layout-title"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-background px-6 text-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 ring-1 ring-taupe-200 shadow-xl">
        <p className="text-xs font-semibold uppercase text-primary-600">
          Layout berubah
        </p>
        <h1
          id="refresh-layout-title"
          className="mt-2 text-xl font-bold text-foreground"
        >
          Refresh halaman untuk melanjutkan
        </h1>
        <p className="mt-3 text-sm leading-6 text-taupe-500">
          Tampilan berubah dari {modeLabel(initialMode)} ke{" "}
          {modeLabel(currentMode)}. Refresh halaman agar komponen dimuat dengan
          layout yang sesuai.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white active:bg-primary-600"
        >
          Refresh sekarang
        </button>
      </div>
    </div>
  );
}
