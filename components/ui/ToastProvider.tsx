"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  description: string;
  title?: string;
  tone?: ToastTone;
};

type ToastRecord = ToastInput & {
  id: string;
  tone: ToastTone;
};

type ToastContextValue = {
  dismissToast: (id: string) => void;
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_EVENT = "taskflow:toast";
const pendingToasts: ToastInput[] = [];
let isToastListenerReady = false;

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-200/80 bg-white text-foreground",
  error: "border-danger/25 bg-white text-foreground",
  info: "border-primary/15 bg-white text-foreground",
};

const toneIcons = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
} as const;

export function showAppToast(toast: ToastInput) {
  if (typeof window === "undefined") {
    return;
  }

  if (!isToastListenerReady) {
    pendingToasts.push(toast);
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastInput>(TOAST_EVENT, {
      detail: toast,
    }),
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const enqueueToast = useCallback(
    ({ description, title, tone = "info" }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextToast: ToastRecord = {
        id,
        description,
        title,
        tone,
      };

      setToasts((current) => [...current, nextToast]);

      window.setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast],
  );

  useLayoutEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastInput>;
      enqueueToast(customEvent.detail);
    };

    isToastListenerReady = true;
    window.addEventListener(TOAST_EVENT, handleToast);
    pendingToasts.splice(0).forEach((toast) => {
      enqueueToast(toast);
    });

    return () => {
      isToastListenerReady = false;
      window.removeEventListener(TOAST_EVENT, handleToast);
    };
  }, [enqueueToast]);

  const showToast = useCallback(
    (toast: ToastInput) => {
      showAppToast(toast);
    },
    [],
  );

  const value = useMemo(
    () => ({
      dismissToast,
      showToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      >
        {toasts.map((toast) => {
          const Icon = toneIcons[toast.tone];

          return (
            <div
              className={cn(
                "pointer-events-auto rounded-[22px] border px-4 py-4 shadow-[0_26px_56px_-34px_rgba(15,23,42,0.3)] backdrop-blur-md",
                toneStyles[toast.tone],
              )}
              key={toast.id}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-surface-muted p-2 text-accent">
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  {toast.title ? <p className="text-sm font-semibold text-foreground">{toast.title}</p> : null}
                  <p className="text-sm leading-6 text-muted-foreground">{toast.description}</p>
                </div>

                <button
                  aria-label="Dismiss notification"
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
                  onClick={() => dismissToast(toast.id)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
