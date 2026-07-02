"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, XIcon } from "@/components/icons/outline";

type ToastVariant = "success" | "error";

type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string) => {
      const normalized = message.trim();
      if (!normalized) return;

      const id = nextIdRef.current;
      nextIdRef.current += 1;
      setToasts((current) => [
        ...current.slice(-3),
        { id, variant, message: normalized },
      ]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-4 z-[130] flex flex-col items-center gap-2 px-4 sm:items-end lg:top-5 lg:right-5 lg:left-auto lg:w-[min(24rem,calc(100vw-2rem))] lg:px-0"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const success = toast.variant === "success";
            const Icon = success ? CheckIcon : XIcon;

            return (
              <motion.div
                key={toast.id}
                role="status"
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-foreground ring-1 ring-taupe-200 shadow-xl"
              >
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                    success
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-taupe-400 transition-colors hover:bg-taupe-100 hover:text-foreground"
                  aria-label="Tutup toast"
                >
                  <XIcon className="size-3.5" strokeWidth={2.3} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }

  return context;
}
