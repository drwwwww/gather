import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export function DropdownMenu({
  trigger,
  children,
  align = "left",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        className="focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        tabIndex={0}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={clsx(
            "absolute z-[100] min-w-[140px] card rounded-xl py-2 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
          style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx(
        "w-full px-4 py-2 text-left text-sm text-ink hover:bg-primary-soft hover:text-primary focus:bg-primary-soft focus:text-primary rounded-xl transition",
        disabled && "opacity-50 pointer-events-none"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
