import clsx from "clsx";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange?.(false)}
        aria-label="Close dialog"
      />
      <div className="relative w-full max-w-lg">{children}</div>
    </div>
  );
}

export function DialogContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("space-y-1", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={clsx("text-lg font-semibold", className)}>{children}</h3>;
}

export function DialogDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={clsx("text-sm text-muted", className)}>{children}</p>;
}

export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("mt-6 flex flex-wrap justify-end gap-2", className)}>{children}</div>;
}
