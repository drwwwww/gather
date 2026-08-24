"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function FaqAccordion({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mk-rule">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="mk-rule border-t-0 border-b border-[var(--mk-line)]">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="group flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="text-base font-normal text-[var(--mk-ink)] sm:text-lg">
                {item.q}
              </span>
              <Plus
                className={`h-5 w-5 shrink-0 text-[var(--mk-ink-faint)] transition-transform duration-300 group-hover:text-[var(--mk-amber-deep)] ${
                  isOpen ? "rotate-45" : ""
                }`}
              />
            </button>
            {/* Height/opacity transition rather than display toggling, so it
                animates instead of snapping. */}
            <div
              className="grid transition-all duration-300 ease-out"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-6 pr-10 text-sm leading-relaxed text-[var(--mk-ink-soft)] sm:text-base">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
