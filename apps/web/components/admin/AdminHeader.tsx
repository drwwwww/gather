import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AdminHeader({
  title,
  subtitle,
  actions,
  className,
  size = "default",
  back,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  /** `large` — page hero title (e.g. volunteers scheduling). */
  size?: "default" | "large";
  /** Deep pages (a plan, a preset) link back to their list. */
  back?: { href: string; label: string };
}) {
  // Dashboard scale, not marketing scale — page titles sit near 20–24px so
  // more of the actual content is visible above the fold.
  const titleClass =
    size === "large"
      ? "text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl sm:tracking-tight"
      : "text-xl font-semibold tracking-tight text-[var(--text-primary)]";
  const subtitleClass =
    size === "large"
      ? "mt-1 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]"
      : "mt-0.5 text-xs text-[var(--text-muted)]";
  return (
    <header className={"mb-4 flex flex-wrap items-center justify-between gap-2 md:mb-5 md:gap-3 " + (className ?? "")}>
      <div>
        {back ? (
          <Link
            href={back.href}
            className="mb-1 inline-flex items-center gap-0.5 text-xs font-medium text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            {back.label}
          </Link>
        ) : null}
        <h1 className={titleClass}>{title}</h1>
        {subtitle ? <p className={subtitleClass}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 md:gap-3">{actions}</div> : null}
    </header>
  );
}
