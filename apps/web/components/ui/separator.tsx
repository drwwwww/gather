import clsx from "clsx";

export function Separator({
  className,
  orientation = "horizontal"
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={clsx(
        "bg-[var(--border)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  );
}
