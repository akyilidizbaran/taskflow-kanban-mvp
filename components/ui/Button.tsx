import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Spinner } from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[linear-gradient(135deg,#1d4ed8_0%,#0f766e_100%)] text-primary-foreground shadow-[0_22px_46px_-28px_rgba(29,78,216,0.58)] hover:brightness-[1.02]",
  secondary:
    "border border-border bg-white/82 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-primary/20 hover:bg-surface-muted/90",
  ghost: "bg-transparent text-foreground hover:bg-surface-muted/90",
  danger: "bg-danger text-danger-foreground shadow-[0_16px_34px_-24px_rgba(180,35,24,0.52)] hover:bg-[#9b1c13]",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  children,
  className,
  disabled,
  fullWidth,
  leadingIcon,
  loading,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
    </button>
  );
}
