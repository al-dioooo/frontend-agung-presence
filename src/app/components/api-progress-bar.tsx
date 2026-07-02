"use client";

import { useSyncExternalStore } from "react";
import {
  getActiveApiRequestCount,
  subscribeApiRequestActivity,
} from "@/lib/api/request-activity";

export function ApiProgressBar() {
  const activeCount = useSyncExternalStore(
    subscribeApiRequestActivity,
    getActiveApiRequestCount,
    () => 0,
  );

  return (
    <div
      aria-hidden={activeCount === 0}
      data-api-progress={activeCount > 0 ? "active" : "idle"}
      className={`fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden bg-transparent transition-opacity duration-150 ${
        activeCount > 0 ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        role="progressbar"
        aria-label="Memuat permintaan API"
        aria-valuetext={activeCount > 0 ? "Memproses" : "Selesai"}
        className="h-full w-full origin-left bg-primary"
      >
        <div className="h-full w-1/2 animate-[api-progress_1.05s_ease-in-out_infinite] rounded-r-full bg-primary-300 shadow-[0_0_16px_rgba(59,130,246,0.45)]" />
      </div>
    </div>
  );
}
