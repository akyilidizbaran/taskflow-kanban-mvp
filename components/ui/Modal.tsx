"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ children, className, description, onClose, open, title }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/34 px-4 py-8 backdrop-blur-md"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={cn(
          "surface-panel relative w-full max-w-xl rounded-[30px] border border-white/60 p-6 shadow-[0_34px_72px_-40px_rgba(15,23,42,0.42)] md:p-7",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>

        <div className="pr-8">
          <h2 className="font-heading text-2xl font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
