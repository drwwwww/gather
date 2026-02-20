import clsx from "clsx";
import type { ReactNode } from "react";

export function Tooltip({
  content,
  children,
  className
}: {
  content: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("relative group", className)}>
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100"
        style={{ background: 'var(--gather-tooltip-bg, #222)', color: 'var(--gather-tooltip-ink, #fff)' }}
      >
        {content}
      </div>
    </div>
  );
}
