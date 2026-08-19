import type { ReactNode } from "react";

function cx(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Venus-style 12-column canvas for admin main content (sidebar is outside this tree).
 * Use Full for full-width bands; Row* helpers match common dashboard rows.
 */
export function PageGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("grid w-full grid-cols-12 gap-x-4 gap-y-5", className)}>{children}</div>;
}

export function PageGridFull({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("col-span-12 min-w-0", className)}>{children}</div>;
}

/** Row 1: four equal small widgets */
export function PageGridRowFour({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx("col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
    >
      {children}
    </div>
  );
}

/** Row 2: two-thirds + one-third (default), or wider main + narrower side for dense sidebars (e.g. People). */
export function PageGridRowTwoOne({
  main,
  side,
  className,
  split = "default"
}: {
  main: ReactNode;
  side: ReactNode;
  className?: string;
  /** `wideMain`: 9/12 + 3/12 on large screens so the main column fits wider tables. */
  split?: "default" | "wideMain";
}) {
  const isWide = split === "wideMain";
  return (
    <div
      className={cx(
        "col-span-12 grid grid-cols-1 gap-4 lg:items-start",
        isWide ? "lg:grid-cols-12" : "lg:grid-cols-3",
        className
      )}
    >
      <div className={cx("min-w-0 space-y-4", isWide ? "lg:col-span-9" : "lg:col-span-2")}>{main}</div>
      <div className={cx("min-w-0 space-y-4", isWide ? "lg:col-span-3" : "lg:col-span-1")}>{side}</div>
    </div>
  );
}

/** Row 3: three equal medium widgets */
export function PageGridRowThirds({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("col-span-12 grid grid-cols-1 gap-4 md:grid-cols-3 lg:items-start", className)}>
      {children}
    </div>
  );
}
