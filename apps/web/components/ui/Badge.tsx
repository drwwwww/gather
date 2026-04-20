import type { ReactNode } from "react";
import clsx from "clsx";

export type BadgeVariant = "default" | "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const BASE =
  "inline-flex items-center justify-center h-6 px-[10px] text-[11px] font-semibold tracking-wide rounded-full whitespace-nowrap";

const VARIANTS: Record<BadgeVariant, React.CSSProperties> = {
  default:  { color: "#374151", background: "#F3F4F6", border: "1px solid #E5E7EB" },
  neutral:  { color: "#374151", background: "#F3F4F6", border: "1px solid #E5E7EB" },
  success:  { color: "#15803d", background: "#dcfce7", border: "1px solid #bbf7d0" },
  warning:  { color: "#c2410c", background: "#fff7ed", border: "1px solid #fed7aa" },
  danger:   { color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" },
  info:     { color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe" },
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={clsx(BASE, className)} style={VARIANTS[variant]}>
      {children}
    </span>
  );
}
