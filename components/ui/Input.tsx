import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border/85 bg-white/88 px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10",
        className,
      )}
      {...props}
    />
  );
}
