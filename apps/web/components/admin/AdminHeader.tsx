import type { ReactNode } from "react";

export default function AdminHeader({
  title,
  subtitle,
  actions,
  className
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={"flex flex-wrap items-center justify-between gap-4 " + (className ?? "mb-8")}>
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gather-ink)]">{title}</h1>
        {subtitle ? <p className="text-[var(--gather-muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
