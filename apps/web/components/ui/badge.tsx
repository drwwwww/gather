import type { ReactNode } from "react";
import clsx from "clsx";

export type BadgeVariant = "default" | "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<
  BadgeVariant,
  { className: string; style?: React.CSSProperties }
> = {
  default: {
    className: "bg-[var(--surface-2)] text-[var(--text-muted)]",
  },
  neutral: {
    className: "bg-[var(--surface-2)] text-[var(--text-secondary)]",
  },
  success: {
    className: "text-[var(--success)]",
    style: {
      backgroundColor: "color-mix(in srgb, var(--success) 16%, transparent)",
    },
  },
  warning: {
    className: "text-[var(--warning)]",
    style: {
      backgroundColor: "color-mix(in srgb, var(--warning) 16%, transparent)",
    },
  },
  danger: {
    className: "text-[var(--danger)]",
    style: {
      backgroundColor: "color-mix(in srgb, var(--danger) 16%, transparent)",
    },
  },
  info: {
    className: "text-[var(--info)]",
    style: {
      backgroundColor: "color-mix(in srgb, var(--info) 16%, transparent)",
    },
  },
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const resolved = variantStyles[variant];
  const base =
    "inline-flex items-center justify-center h-6 px-3 text-xs font-semibold rounded-full whitespace-nowrap";

  return (
    <span
      className={clsx(base, resolved.className, className)}
      style={resolved.style}
    >
      {children}
    </span>
  );
}
