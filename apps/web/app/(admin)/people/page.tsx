"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { Button } from "../../../components/ui/button";
import { buildJoinLink } from "../../../lib/format";
import { supabase } from "../../../lib/supabaseClient";
import { getCurrentContext, listProfilesByChurch } from "../../../lib/supabaseData";
import JoinInstructionsCard from "../../../components/people/JoinInstructionsCard";
import JoinQrCodeCard from "../../../components/people/JoinQrCodeCard";
import MemberFilters, { type MemberTab } from "../../../components/people/MemberFilters";
import InviteMembersDialog from "../../../components/people/InviteMembersDialog";
import MembersTable from "../../../components/people/MembersTable";
import MemberDetailsDrawer from "../../../components/people/MemberDetailsDrawer";
import {
  buildMemberEntries,
  getUpcomingAssignments,
  roleOptions,
  type InviteEntry,
  type MemberEntryWithFlags
} from "../../../components/people/memberUtils";
import type { Database, Role } from "@gather/lib";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ChurchRow = Database["public"]["Tables"]["churches"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
type ServiceTimeRow = Database["public"]["Tables"]["service_times"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "INVITED";
type RoleFilter = "ALL" | Role;
type SortBy = "NEWEST" | "NAME";

export default function PeoplePage() {
  const [members, setMembers] = useState<ProfileRow[]>([]);
  const [invites, setInvites] = useState<InviteEntry[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [serviceTimes, setServiceTimes] = useState<ServiceTimeRow[]>([]);
  const [volunteerRoles, setVolunteerRoles] = useState<RoleRow[]>([]);
  const [joinLink, setJoinLink] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [church, setChurch] = useState<ChurchRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
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

      const [profiles, assignmentsResult, rolesResult] = await Promise.all([
        listProfilesByChurch(context.profile.church_id),
        supabase
          .from("volunteer_assignments")
          .select("*")
          .eq("church_id", context.profile.church_id),
        supabase
          .from("volunteer_roles")
          .select("*")
          .eq("church_id", context.profile.church_id)
      ]);

      if (assignmentsResult.error) {
        throw new Error(assignmentsResult.error.message);
      }

      if (rolesResult.error) {
        throw new Error(rolesResult.error.message);
      }

      setMembers((profiles ?? []) as ProfileRow[]);
      setAssignments((assignmentsResult.data ?? []) as AssignmentRow[]);
      setVolunteerRoles((rolesResult.data ?? []) as RoleRow[]);

      if (typeof window !== "undefined") {
        const link = buildJoinLink(window.location.origin, context.church.slug);
        setJoinLink(link);
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`);
      }

      setLoading(false);
    } catch (err) {
      setError("Unable to load members. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

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
    const upcoming = getUpcomingAssignments(assignments, serviceTimes, selectedMember.profile.id);
    return upcoming.map((assignment) => ({
      id: assignment.id,
      role: volunteerRoles.find((role) => role.id === assignment.roleId)?.name ?? "Role",
      serviceLabel: assignment.serviceLabel
    }));
  }, [assignments, selectedMember, serviceTimes, volunteerRoles]);

  const handleCopyLink = async () => {
    if (!joinLink) return;
    try {
      await navigator.clipboard.writeText(joinLink);
    } catch {
      setError("Unable to copy link. Please copy manually.");
    }
  };

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

  const handleInviteCreate = (emails: string[], role: Role, message: string) => {
    const now = new Date().toISOString();
    const existingEmails = new Set(invites.map((invite) => invite.email.toLowerCase()));
    const newInvites: InviteEntry[] = emails
      .filter((email) => !existingEmails.has(email.toLowerCase()))
      .map((email) => ({
        id: `invite-${email.toLowerCase()}`,
        email,
        role,
        message,
        createdAt: now
      }));

    if (!newInvites.length) {
      setError("Invites already exist for those emails.");
      return;
    }

    setInvites((prev) => [...newInvites, ...prev]);
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
    return <p className="text-sm text-base-content/70">Loading people...</p>;
  }

  return (
    <>
      <AdminHeader
        title="People & Roles"
        subtitle="Manage members, roles, invites, and onboarding across the church."
        actions={
          <Button onClick={() => setInviteOpen(true)}>Invite members</Button>
        }
      />

      <InviteMembersDialog
        open={inviteOpen}
        churchName={church?.name ?? "Your church"}
        joinLink={joinLink}
        joinCode={church?.slug ?? ""}
        onClose={() => setInviteOpen(false)}
        onCreateInvites={handleInviteCreate}
      />

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
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
            onGenerateSchedule={() => router.push("/volunteers")}
            onCopyLast={() => router.push("/volunteers")}
            error={error}
          />
        </div>

        <div className="space-y-6">
          <JoinInstructionsCard
            churchSlug={church?.slug ?? ""}
            onOpenPrintable={() => window.open(`/join?code=${encodeURIComponent(church?.slug ?? "")}`, "_blank")}
            error={error}
          />
          <JoinQrCodeCard joinLink={joinLink} qrUrl={qrUrl} onCopyLink={handleCopyLink} />
        </div>
      </section>

      <MemberDetailsDrawer
        open={!!selectedMember}
        memberName={selectedMember?.name || "Member"}
        memberEmail={selectedMember?.email || ""}
        roleLabel={selectedMember?.role || ""}
        statusLabel={selectedMember?.status || ""}
        assignments={selectedAssignments}
        onClose={() => setSelectedMemberId(null)}
      />
    </>
  );
}

function findInviteDate(id: string, invites: InviteEntry[]) {
  return invites.find((invite) => invite.id === id)?.createdAt ?? "";
}
