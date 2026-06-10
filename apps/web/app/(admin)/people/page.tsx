"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import PageLoader from "../../../components/ui/PageLoader";
// DaisyUI migration: use className markup for all UI
import { supabase } from "../../../lib/supabaseClient";
import { readPendingInvites } from "../../../lib/pendingInvitesStorage";
import { getCurrentContext, listProfilesByChurch } from "../../../lib/supabaseData";
import MemberFilters, { type MemberTab } from "../../../components/people/MemberFilters";
import MembersTable from "../../../components/people/MembersTable";
import MemberDetailsDrawer from "../../../components/people/MemberDetailsDrawer";
import { PageGrid, PageGridFull } from "../../../components/layout/PageGrid";
import {
  buildMemberEntries,
  getUpcomingAssignments,
  roleOptions,
  type InviteEntry,
  type MemberEntryWithFlags
} from "../../../components/people/memberUtils";
import type { Database, Role } from "@gather/lib";

import type { PlanSlotRow } from "../../../components/people/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ChurchRow = Database["public"]["Tables"]["churches"]["Row"];
type ServiceTimeRow = Database["public"]["Tables"]["service_times"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "INVITED";
type RoleFilter = "ALL" | Role;
type SortBy = "NEWEST" | "NAME";

export default function PeoplePage() {
  const [members, setMembers] = useState<ProfileRow[]>([]);
  const [invites, setInvites] = useState<InviteEntry[]>([]);
  const [planSlots, setPlanSlots] = useState<PlanSlotRow[]>([]);
  const [serviceTimes, setServiceTimes] = useState<ServiceTimeRow[]>([]);
  const [volunteerRoles, setVolunteerRoles] = useState<RoleRow[]>([]);
  const [church, setChurch] = useState<ChurchRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MemberTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("NEWEST");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const router = useRouter();

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const context = await getCurrentContext();
      if (!context) {
        router.push("/login");
        return;
      }

      setChurch(context.church);
      setCurrentUserId(context.userId);
      setServiceTimes(context.serviceTimes);

      const todayStr = new Date().toISOString().slice(0, 10);
      const [profiles, rolesResult, plansResult] = await Promise.all([
        listProfilesByChurch(context.profile.church_id),
        supabase
          .from("volunteer_roles")
          .select("*")
          .eq("church_id", context.profile.church_id),
        supabase
          .from("service_plans")
          .select("id, service_date, service_time_id")
          .eq("church_id", context.profile.church_id)
          .gte("service_date", todayStr),
      ]);

      if (rolesResult.error) {
        throw new Error(rolesResult.error.message);
      }
      if (plansResult.error) {
        throw new Error(plansResult.error.message);
      }

      const planIds = (plansResult.data ?? []).map((p) => p.id);
      const planById = Object.fromEntries((plansResult.data ?? []).map((p) => [p.id, p]));

      let mergedSlots: PlanSlotRow[] = [];
      if (planIds.length > 0) {
        const slotsResult = await supabase
          .from("service_plan_role_slots")
          .select("id, plan_id, role_id, assigned_user_id, status")
          .in("plan_id", planIds);

        if (slotsResult.error) {
          throw new Error(slotsResult.error.message);
        }

        mergedSlots = (slotsResult.data ?? []).map((s) => ({
          id: s.id,
          plan_id: s.plan_id,
          role_id: s.role_id,
          assigned_user_id: s.assigned_user_id,
          status: s.status,
          service_date: planById[s.plan_id]?.service_date ?? "",
          service_time_id: planById[s.plan_id]?.service_time_id ?? "",
        }));
      }

      setMembers((profiles ?? []) as ProfileRow[]);
      setPlanSlots(mergedSlots);
      setVolunteerRoles((rolesResult.data ?? []) as RoleRow[]);
      setInvites(readPendingInvites(context.profile.church_id));

      setLoading(false);
    } catch (err) {
      setError("Unable to load members. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!church?.id) return;
    const syncInvites = () => setInvites(readPendingInvites(church.id));
    const onFocus = () => syncInvites();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [church?.id]);

  const memberEntries = useMemo<MemberEntryWithFlags[]>(
    () => buildMemberEntries(members, invites, currentUserId),
    [members, invites, currentUserId]
  );

  const activeAdminCount = useMemo(
    () => memberEntries.filter((member) => member.role === "ADMIN" && member.status === "ACTIVE").length,
    [memberEntries]
  );

  const counts = useMemo(
    () => ({
      all: memberEntries.length,
      service: memberEntries.filter((member) => member.role === "SERVICE").length,
      admins: memberEntries.filter((member) => member.role === "ADMIN").length
    }),
    [memberEntries]
  );

  const filteredMembers = useMemo(() => {
    return memberEntries
      .filter((member) => {
        if (activeTab === "SERVICE" && member.role !== "SERVICE") return false;
        if (activeTab === "ADMINS" && member.role !== "ADMIN") return false;
        if (roleFilter !== "ALL" && member.role !== roleFilter) return false;
        if (statusFilter !== "ALL" && member.status !== statusFilter) return false;
        if (!searchTerm.trim()) return true;
        const haystack = `${member.name} ${member.email}`.toLowerCase();
        return haystack.includes(searchTerm.trim().toLowerCase());
      })
      .sort((a, b) => {
        if (sortBy === "NAME") {
          return (a.name || a.email).localeCompare(b.name || b.email);
        }
        const aDate = a.source === "invite" ? findInviteDate(a.id, invites) : a.profile?.created_at;
        const bDate = b.source === "invite" ? findInviteDate(b.id, invites) : b.profile?.created_at;
        return (bDate || "").localeCompare(aDate || "");
      });
  }, [
    memberEntries,
    activeTab,
    roleFilter,
    statusFilter,
    searchTerm,
    sortBy,
    invites
  ]);

  const selectedMember = useMemo(() => {
    return memberEntries.find((member) => member.id === selectedMemberId) ?? null;
  }, [memberEntries, selectedMemberId]);

  const selectedAssignments = useMemo(() => {
    if (!selectedMember?.profile) return [];
    const upcoming = getUpcomingAssignments(planSlots, serviceTimes, selectedMember.profile.id);
    return upcoming.map((slot) => ({
      id: slot.id,
      role: volunteerRoles.find((role) => role.id === slot.roleId)?.name ?? "Role",
      serviceLabel: slot.serviceLabel
    }));
  }, [planSlots, selectedMember, serviceTimes, volunteerRoles]);

  const handleRoleChange = async (userId: string, role: Role) => {
    const member = memberEntries.find((entry) => entry.id === userId);
    if (!member || member.source === "invite") return;
    if (member.isCurrentUser) {
      setError("You cannot change your own role.");
      return;
    }
    if (member.role === "ADMIN" && role !== "ADMIN" && activeAdminCount <= 1) {
      setError("You cannot remove the last administrator.");
      return;
    }
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    refresh();
  };

  const handleStatusToggle = async (userId: string, disabled: boolean) => {
    const member = memberEntries.find((entry) => entry.id === userId);
    if (!member || member.source === "invite") return;
    if (member.isCurrentUser) {
      setError("You cannot deactivate yourself.");
      return;
    }
    if (member.role === "ADMIN" && disabled && activeAdminCount <= 1) {
      setError("You cannot deactivate the last administrator.");
      return;
    }
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ disabled })
      .eq("id", userId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    refresh();
  };

  const handleRemoveFromChurch = async (userId: string) => {
    const member = memberEntries.find((entry) => entry.id === userId);
    if (!member || member.source === "invite") return;
    if (member.isCurrentUser) {
      setError("You cannot remove yourself from the church.");
      return;
    }
    if (member.role === "ADMIN" && activeAdminCount <= 1) {
      setError("You cannot remove the last administrator from the church.");
      return;
    }
    if (!supabase) return;
    const { error: rpcError } = await supabase.rpc("admin_remove_member_from_church", {
      p_user_id: userId
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSelectedMemberId(null);
    setError(null);
    refresh();
  };

  const handleRemoveInvite = (inviteId: string) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
    setSelectedMemberId((current) => (current === inviteId ? null : current));
    setError(null);
  };

  const handleCopyInvite = async (memberId: string) => {
    const invite = invites.find((entry) => entry.id === memberId);
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.message);
    } catch {
      setError("Unable to copy invite message.");
    }
  };

  if (loading) {
    return (
      <PageGrid className="animate-pulse-subtle">
        <PageGridFull className="space-y-4">
          <div className="h-8 w-48 rounded-md bg-[var(--surface-2)]" />
          <div className="h-4 w-64 rounded-md bg-[var(--surface-2)]" />
        </PageGridFull>
        <PageGridFull>
          <div className="card card-elevated h-[600px] bg-[var(--surface)]" />
        </PageGridFull>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          title="People & Roles"
          subtitle="Manage members, roles, invites, and onboarding across the church."
          actions={
            <button
              type="button"
              className="btn btn-primary-gradient"
              onClick={() => {
                const slug = church?.slug ?? "";
                if (slug) router.push("/people/invite");
              }}
            >
              Invite members
            </button>
          }
        />
      </PageGridFull>

      <PageGridFull className="animate-fade-in-up [animation-delay:100ms] opacity-0">
        <div className="space-y-6">
          <MemberFilters
            activeTab={activeTab}
            counts={counts}
            searchTerm={searchTerm}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            sortBy={sortBy}
            onTabChange={setActiveTab}
            onSearchChange={setSearchTerm}
            onRoleFilterChange={setRoleFilter}
            onStatusFilterChange={setStatusFilter}
            onSortChange={setSortBy}
          />

          <MembersTable
            members={filteredMembers}
            roleOptions={roleOptions}
            onRoleChange={handleRoleChange}
            onToggleStatus={handleStatusToggle}
            onViewDetails={(memberId) => setSelectedMemberId(memberId)}
            onCopyInvite={handleCopyInvite}
            onRemoveFromChurch={handleRemoveFromChurch}
            onRemoveInvite={handleRemoveInvite}
            error={error}
          />
        </div>
      </PageGridFull>

      <PageGridFull>
        <MemberDetailsDrawer
          open={!!selectedMember}
          memberName={selectedMember?.name || "Member"}
          memberEmail={selectedMember?.email || ""}
          roleLabel={selectedMember?.role || ""}
          statusLabel={selectedMember?.status || ""}
          source={selectedMember?.source ?? "member"}
          assignments={selectedAssignments}
          onClose={() => setSelectedMemberId(null)}
          onRemoveFromChurch={
            selectedMember?.source === "member" && !selectedMember.isCurrentUser
              ? () => handleRemoveFromChurch(selectedMember.id)
              : undefined
          }
          onRemoveInvite={
            selectedMember?.source === "invite" ? () => handleRemoveInvite(selectedMember.id) : undefined
          }
          removeFromChurchDisabled={
            selectedMember?.source === "member" &&
            selectedMember.role === "ADMIN" &&
            activeAdminCount <= 1
          }
        />
      </PageGridFull>
    </PageGrid>
  );
}

function findInviteDate(id: string, invites: InviteEntry[]) {
  return invites.find((invite) => invite.id === id)?.createdAt ?? "";
}
