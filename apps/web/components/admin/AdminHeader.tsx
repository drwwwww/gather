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
    <header className={"flex flex-wrap items-center justify-between gap-2 md:gap-4 mb-8 " + (className ?? "")}> 
      <div>
        <h1 className="text-2xl font-semibold text-base-content">{title}</h1>
        {subtitle ? <p className="text-base-content/60 mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 md:gap-3">{actions}</div> : null}
    </header>
  );
}
