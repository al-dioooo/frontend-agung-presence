"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center lg:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 lg:bg-black/35"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:max-h-[calc(100dvh-4rem)] lg:max-w-2xl lg:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Menu tindakan"}
          >
            <div className="shrink-0">
              <div className="flex justify-center pt-3 pb-1 lg:hidden">
                <div className="h-1 w-10 rounded-full bg-taupe-200" />
              </div>
              {title && (
                <div className="flex items-start justify-between gap-3 px-6 pt-3 lg:border-b lg:border-taupe-200 lg:py-4">
                  <h3 className="text-base font-bold text-foreground">
                    {title}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-taupe-100 text-taupe-500 transition-opacity active:opacity-70 lg:flex"
                    aria-label="Tutup"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-2 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type BottomSheetItemProps = {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
};

export function BottomSheetItem({
  icon,
  label,
  onClick,
  variant = "default",
}: BottomSheetItemProps) {
  const tone =
    variant === "danger"
      ? "text-red-500 active:bg-red-50"
      : "text-foreground active:bg-taupe-100";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors ${tone}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
