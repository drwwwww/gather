import type { ReactNode } from "react";

export default function AdminHeader({
  title,
  subtitle,
  actions,
  className,
  size = "default",
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  /** `large` — page hero title (e.g. volunteers scheduling). */
  size?: "default" | "large";
}) {
  const titleClass =
    size === "large"
      ? "text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl sm:tracking-tight"
      : "text-2xl font-semibold tracking-tight text-[var(--text-primary)]";
  const subtitleClass =
    size === "large"
      ? "mt-2 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
      : "mt-1 text-sm text-[var(--text-muted)]";
  return (
    <header className={"mb-6 flex flex-wrap items-center justify-between gap-2 md:mb-8 md:gap-4 " + (className ?? "")}>
      <div>
        <h1 className={titleClass}>{title}</h1>
        {subtitle ? <p className={subtitleClass}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 md:gap-3">{actions}</div> : null}
    </header>
  );
}
