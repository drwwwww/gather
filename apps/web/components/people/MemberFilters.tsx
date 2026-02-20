"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

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
        <Button size="sm" variant={activeTab === "ALL" ? "default" : "outline"} onClick={() => onTabChange("ALL")}>
          All ({counts.all})
        </Button>
        <Button size="sm" variant={activeTab === "SERVICE" ? "default" : "outline"} onClick={() => onTabChange("SERVICE")}>
          Service Team ({counts.service})
        </Button>
        <Button size="sm" variant={activeTab === "ADMINS" ? "default" : "outline"} onClick={() => onTabChange("ADMINS")}>
          Admins ({counts.admins})
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_0.7fr]">
        <Input
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
