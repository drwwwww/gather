import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import * as React from "react";

const buttonVariants = cva(
  [
    "btn inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight transition-all duration-150 ease-out focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "btn-primary",
        soft: "btn-secondary",
        ghost: "btn-ghost",
        link: "btn-link",
        danger: "btn-error",
        icon: "btn-square"
      },
      size: {
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg"
      },
      loading: {
        true: "loading"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  "aria-label"?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          buttonVariants({ variant, size, loading: loading || undefined }),
          className
        )}
        disabled={loading || props.disabled}
        aria-label={props["aria-label"]}
        {...props}
      >
        {loading && (
          <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-t-2 border-t-amber-500 border-amber-200 rounded-full align-middle" />
        )}
        {leftIcon && <span className="inline-flex items-center mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="inline-flex items-center ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";
