import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "input w-full",
        className
      )}
      style={{
        background: 'var(--gather-surface)',
        borderColor: 'var(--gather-border)',
        color: 'var(--gather-ink)',
        // Optionally, set placeholder color if needed
      }}
      {...props}
    />
  );
}
