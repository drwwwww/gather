"use client";

// DaisyUI migration: use className markup for all UI
// DaisyUI migration: use className markup for all UI

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
  onSortChange
}: MemberFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`btn btn-sm rounded-full ${activeTab === "ALL" ? "btn-primary-gradient" : "btn-secondary"}`}
          onClick={() => onTabChange("ALL")}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-full ${activeTab === "SERVICE" ? "btn-primary-gradient" : "btn-secondary"}`}
          onClick={() => onTabChange("SERVICE")}
        >
          Service Team ({counts.service})
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-full ${activeTab === "ADMINS" ? "btn-primary-gradient" : "btn-secondary"}`}
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
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <select
          className="select select-bordered w-full"
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as MemberFiltersProps["roleFilter"])}
        >
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admins</option>
          <option value="SERVICE">Service team</option>
          <option value="MEMBER">Members</option>
        </select>
        <select
          className="select select-bordered w-full"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as MemberFiltersProps["statusFilter"])}
        >
          <option value="ALL">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="INVITED">Invited</option>
        </select>
        <select
          className="select select-bordered w-full"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as MemberFiltersProps["sortBy"])}
        >
          <option value="NEWEST">Newest</option>
          <option value="NAME">Name</option>
        </select>
      </div>
    </div>
  );
}
