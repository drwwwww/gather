"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type MemberTab = "ALL" | "SERVICE" | "ADMINS";

export type MemberFiltersProps = {
  activeTab: MemberTab;
  counts: { all: number; service: number; admins: number };
  searchTerm: string;
  roleFilter: "ALL" | "ADMIN" | "SERVICE" | "MEMBER";
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE" | "INVITED";
  sortBy: "NEWEST" | "NAME";
  onTabChange: (tab: MemberTab) => void;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: MemberFiltersProps["roleFilter"]) => void;
  onStatusFilterChange: (value: MemberFiltersProps["statusFilter"]) => void;
  onSortChange: (value: MemberFiltersProps["sortBy"]) => void;
};

type FilterOption<T extends string> = { value: T; label: string };

function FilterSelect<T extends string>({
  value,
  options,
  onChange,
  isDefault,
}: {
  value: T;
  options: FilterOption<T>[];
  onChange: (v: T) => void;
  isDefault?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = options.find((o) => o.value === value)?.label ?? value;
  const active = !isDefault;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
          active
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--outline-variant)] hover:bg-[var(--surface)]"
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={selected} className="list-none">
                <button
                  type="button"
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "bg-amber-50 font-semibold text-amber-800"
                      : "text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const ROLE_OPTIONS: FilterOption<MemberFiltersProps["roleFilter"]>[] = [
  { value: "ALL", label: "All roles" },
  { value: "ADMIN", label: "Admins" },
  { value: "SERVICE", label: "Service team" },
  { value: "MEMBER", label: "Members" },
];

const STATUS_OPTIONS: FilterOption<MemberFiltersProps["statusFilter"]>[] = [
  { value: "ALL", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "INVITED", label: "Invited" },
];

const SORT_OPTIONS: FilterOption<MemberFiltersProps["sortBy"]>[] = [
  { value: "NEWEST", label: "Newest" },
  { value: "NAME", label: "Name" },
];

export default function MemberFilters({
  activeTab,
  counts,
  searchTerm,
  roleFilter,
  statusFilter,
  sortBy,
  onTabChange,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onSortChange,
}: MemberFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "ALL" ? "btn-primary-gradient" : "btn-secondary"}`}
          onClick={() => onTabChange("ALL")}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "SERVICE" ? "btn-primary-gradient" : "btn-secondary"}`}
          onClick={() => onTabChange("SERVICE")}
        >
          Service Team ({counts.service})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "ADMINS" ? "btn-primary-gradient" : "btn-secondary"}`}
          onClick={() => onTabChange("ADMINS")}
        >
          Admins ({counts.admins})
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_0.7fr]">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Search name or email"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <FilterSelect value={roleFilter} options={ROLE_OPTIONS} onChange={onRoleFilterChange} isDefault={roleFilter === "ALL"} />
        <FilterSelect value={statusFilter} options={STATUS_OPTIONS} onChange={onStatusFilterChange} isDefault={statusFilter === "ALL"} />
        <FilterSelect value={sortBy} options={SORT_OPTIONS} onChange={onSortChange} isDefault={sortBy === "NEWEST"} />
      </div>
    </div>
  );
}
