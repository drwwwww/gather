import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "neutral" | "error" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};



const baseClasses = "badge px-3 py-1 text-xs font-medium rounded-full";
const variantClasses: Record<BadgeVariant, string> = {
  default: "",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-danger",
  info: "badge-info",
  neutral: ""
};

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  let style = {};
  if (variant === "default") {
    style = { background: 'var(--gather-surface-2)', color: 'var(--gather-muted)' };
  } else if (variant === "neutral") {
    style = { background: 'var(--gather-surface-2)', color: 'var(--gather-ink)' };
  }
  return (
    <span className={clsx(baseClasses, variantClasses[variant], className)} style={style} {...props}>
      {children}
    </span>
  );
}
