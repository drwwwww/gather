import clsx from "clsx";
import type { ReactNode } from "react";

export default function Rail({
  active = false,
  soft = false,
  className,
  children
}: {
  active?: boolean;
  soft?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "relative",
        active && "gather-rail",
        active && soft && "gather-rail-soft",
        className
      )}
    >
      {children}
    </div>
  );
}
