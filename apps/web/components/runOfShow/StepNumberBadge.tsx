import clsx from "clsx";

export default function StepNumberBadge({
  index,
  format = "twoDigit",
  className
}: {
  index: number;
  format?: "twoDigit" | "plain";
  className?: string;
}) {
  const value = format === "twoDigit" ? String(index + 1).padStart(2, "0") : String(index + 1);
  return (
    <div
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded-full border border-[var(--gather-border)] text-xs font-semibold text-[var(--gather-ink)]",
        className
      )}
    >
      {value}
    </div>
  );
}
