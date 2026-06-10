import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "primaryGradient" | "outlineAmber" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  primaryGradient: "btn-primary-gradient",
  outlineAmber: "btn-outline-amber",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled ? "true" : undefined}
      className={clsx(
        "btn",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && "pointer-events-none",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="icon inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon ? <span className="icon shrink-0 [&>svg]:size-4">{leftIcon}</span> : null}
          <span>{children}</span>
          {rightIcon ? <span className="icon shrink-0 [&>svg]:size-4">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
}

export default Button;
export { Button };
