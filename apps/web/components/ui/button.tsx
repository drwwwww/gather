import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "outline" | "neutral" | "warning" | "error" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "outline"
      ? "btn-outline"
      : variant === "neutral"
      ? "btn-neutral"
      : variant === "warning"
      ? "btn-warning"
      : variant === "error"
      ? "btn-error"
      : "btn-ghost";

  const sizeClass =
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : undefined;

  return (
    <button
      type={type}
      className={clsx("btn", variantClass, sizeClass, className)}
      {...props}
    />
  );
}

