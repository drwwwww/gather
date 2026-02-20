import clsx from "clsx";
import type { ReactNode } from "react";

export default function ArchCard({
  children,
  className,
  headerWash = false
}: {
  children: ReactNode;
  className?: string;
  headerWash?: boolean;
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden border shadow rounded-2xl",
        className
      )}
      style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-ink)' }}
    >
      {headerWash ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)]" />
      ) : null}
      <div className="relative p-6">{children}</div>
    </div>
  );
}
