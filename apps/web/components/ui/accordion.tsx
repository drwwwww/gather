import clsx from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Accordion({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("space-y-3", className)}>{children}</div>;
}

export function AccordionItem({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx("rounded-xl border", className)}
      style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)' }}
    >
      {children}
    </div>
  );
}

export function AccordionTrigger({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={clsx("flex w-full items-center justify-between gap-3 px-4 py-3 text-left", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function AccordionContent({
  className,
  children,
  isOpen
}: {
  className?: string;
  children: ReactNode;
  isOpen: boolean;
}) {
  if (!isOpen) return null;
  return <div className={clsx("px-4 pb-4", className)}>{children}</div>;
}
