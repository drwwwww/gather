"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
// DaisyUI migration: use className markup for all UI
import { getCurrentContext, indexProfilesById, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { formatShortWeekdayDateTime } from "../../../lib/format";
import NextServiceReadinessStrip from "../../../components/volunteers/NextServiceReadinessStrip";
import AssignmentsTable from "../../../components/volunteers/AssignmentsTable";
import PendingResponsesCard from "../../../components/volunteers/PendingResponsesCard";
import DeclinedCard from "../../../components/volunteers/DeclinedCard";
import ScheduleBuilder from "../../../components/volunteers/ScheduleBuilder";
import QuickRolePresets from "../../../components/volunteers/QuickRolePresets";
import type { Database } from "@gather/lib";
// DaisyUI migration: all MotionContainer/MotionItem removed, using divs/fragments for layout

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type MinistryRow = Database["public"]["Tables"]["ministries"]["Row"];
type ServiceTimeRow = Database["public"]["Tables"]["service_times"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type AssignmentStatus = "OPEN" | "ASSIGNED" | "CONFIRMED" | "DECLINED";

type StoredScheduleSlot = {
  id: string;
  roleId: string;
  count: number;
};

type RoleView = RoleRow & { ministryName?: string | null };

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function VolunteersPage() {
  const [roles, setRoles] = useState<RoleView[]>([]);
  const [ministries, setMinistries] = useState<MinistryRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [serviceTimes, setServiceTimes] = useState<ServiceTimeRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleMinistry, setNewRoleMinistry] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotRoleId, setSlotRoleId] = useState("");
  const [slotCount, setSlotCount] = useState(1);
  const [slots, setSlots] = useState<StoredScheduleSlot[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleMinistry, setEditRoleMinistry] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [serviceTimeId, setServiceTimeId] = useState("");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showDeclinedOnly, setShowDeclinedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const profilesById = useMemo(() => indexProfilesById(profiles), [profiles]);

  const selectedServiceTime = useMemo(
    () => serviceTimes.find((service) => service.id === serviceTimeId) ?? null,
    [serviceTimes, serviceTimeId]
  );

  const assignmentsForSelected = useMemo(() => {
    if (!serviceTimeId || !serviceDate) return [];
    return assignments.filter(
      (assignment) =>
        assignment.service_time_id === serviceTimeId &&
        assignment.scheduled_date === serviceDate
    );
  }, [assignments, serviceTimeId, serviceDate]);

  const readinessCounts = useMemo(() => {
    return assignmentsForSelected.reduce(
      (acc, assignment) => {
        acc.total += 1;
        if (assignment.status === "OPEN") acc.open += 1;
        if (assignment.status === "ASSIGNED") acc.pending += 1;
        if (assignment.status === "CONFIRMED") acc.confirmed += 1;
        if (assignment.status === "DECLINED") acc.declined += 1;
        return acc;
      },
      { total: 0, open: 0, pending: 0, confirmed: 0, declined: 0 }
    );
  }, [assignmentsForSelected]);

  const pendingItems = useMemo(() => {
    return assignmentsForSelected
      .filter((assignment) => assignment.status === "ASSIGNED")
      .map((assignment) => ({
        id: assignment.id,
        role: roles.find((role) => role.id === assignment.role_id)?.name ?? "Role",
        assignee:
          assignment.assigned_user_id && profilesById[assignment.assigned_user_id]
            ? profilesById[assignment.assigned_user_id]?.full_name || "Assigned"
            : "Unassigned"
      }));
  }, [assignmentsForSelected, roles, profilesById]);

  const declinedItems = useMemo(() => {
    return assignmentsForSelected
      .filter((assignment) => assignment.status === "DECLINED")
      .map((assignment) => ({
        id: assignment.id,
        role: roles.find((role) => role.id === assignment.role_id)?.name ?? "Role",
        detail: assignment.assigned_user_id
          ? profilesById[assignment.assigned_user_id]?.full_name || "Assigned"
          : "Unassigned"
      }));
  }, [assignmentsForSelected, roles, profilesById]);

  const serviceLabel = useMemo(() => {
    if (selectedServiceTime && serviceDate) {
      const date = buildServiceDateTime(serviceDate, selectedServiceTime.start_time);
      if (date) {
        return formatShortWeekdayDateTime(date);
      }
    }
    const nextService = getNextServiceDateTime(serviceTimes);
    return nextService ? formatShortWeekdayDateTime(nextService) : "Not scheduled";
  }, [selectedServiceTime, serviceDate, serviceTimes]);

  const refresh = async () => {
    if (!supabase) return;
    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }

    setServiceTimes(context.serviceTimes);

    const [rolesResult, ministriesResult, assignmentsResult, profilesResult] = await Promise.all([
      supabase.from("volunteer_roles").select("*").eq("church_id", context.profile.church_id).order("name"),
      supabase.from("ministries").select("*").eq("church_id", context.profile.church_id).order("name"),
      supabase.from("volunteer_assignments").select("*").eq("church_id", context.profile.church_id).order("scheduled_date"),
      listProfilesByChurch(context.profile.church_id)
    ]);

    if (rolesResult.error) {
      setError(rolesResult.error.message);
      return;
    }
    if (ministriesResult.error) {
      setError(ministriesResult.error.message);
      return;
    }
    if (assignmentsResult.error) {
      setError(assignmentsResult.error.message);
      return;
    }

    const ministriesData = (ministriesResult.data ?? []) as MinistryRow[];
    setMinistries(ministriesData);
    setRoles(
      ((rolesResult.data ?? []) as RoleRow[]).map((role) => ({
        ...role,
        ministryName: ministriesData.find((ministry) => ministry.id === role.ministry_id)?.name ?? null
      }))
    );
    setAssignments((assignmentsResult.data ?? []) as AssignmentRow[]);
    setProfiles(profilesResult ?? []);
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!roles.length) return;
    if (roles.some((role) => role.id === slotRoleId)) return;
    setSlotRoleId(roles[0].id);
  }, [roles, slotRoleId]);

  useEffect(() => {
    if (!serviceTimes.length) return;
    if (serviceTimes.some((service) => service.id === serviceTimeId)) return;
    setServiceTimeId(serviceTimes[0].id);
  }, [serviceTimes, serviceTimeId]);

  const ensureMinistry = async (name: string, churchId: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = ministries.find((ministry) => ministry.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const { data, error: insertError } = await supabase!
      .from("ministries")
      .insert({ church_id: churchId, name: trimmed })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }

    return data?.id ?? null;
  };

  const handleAddRole = async (presetName?: string) => {
    if (!supabase) return;
    const trimmed = (presetName ?? newRoleName).trim();
    if (!trimmed) return;

    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }

    const ministryId = await ensureMinistry(newRoleMinistry, context.profile.church_id);

    const { error: insertError } = await supabase.from("volunteer_roles").insert({
      church_id: context.profile.church_id,
      name: trimmed,
      ministry_id: ministryId,
      description: presetName ? null : newRoleDescription.trim() || null
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewRoleName("");
    setNewRoleMinistry("");
    setNewRoleDescription("");
    refresh();
  };

  const handleEditRole = (role: RoleView) => {
    setEditingRoleId(role.id);
    setEditRoleName(role.name);
    setEditRoleMinistry(role.ministryName ?? "");
    setEditRoleDescription(role.description ?? "");
  };

  const handleSaveRole = async () => {
    if (!supabase || !editingRoleId) return;
    const trimmed = editRoleName.trim();
    if (!trimmed) return;

    const context = await getCurrentContext();
    if (!context) return;

    const ministryId = await ensureMinistry(editRoleMinistry, context.profile.church_id);

    const { error: updateError } = await supabase
      .from("volunteer_roles")
      .update({
        name: trimmed,
        ministry_id: ministryId,
        description: editRoleDescription.trim() || null
      })
      .eq("id", editingRoleId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditingRoleId(null);
    setEditRoleName("");
    setEditRoleMinistry("");
    setEditRoleDescription("");
    refresh();
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!supabase) return;
    const { error: deleteError } = await supabase
      .from("volunteer_roles")
      .delete()
      .eq("id", roleId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    refresh();
  };

  const handleAddSlot = () => {
    if (!slotRoleId || slotCount < 1) return;
    setSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roleId: slotRoleId,
        count: slotCount
      }
    ]);
    setSlotCount(1);
  };

  const handleRemoveSlot = (slotId: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const handleGenerateSchedule = async () => {
    if (!supabase || !serviceTimeId || !slots.length) return;
    const context = await getCurrentContext();
    if (!context) return;

    const payload = slots.flatMap((slot) => {
      return Array.from({ length: slot.count }, () => ({
        church_id: context.profile.church_id,
        service_time_id: serviceTimeId,
        role_id: slot.roleId,
        scheduled_date: serviceDate,
        status: "OPEN" as AssignmentStatus,
        notes: null
      }));
    });

    const { error: insertError } = await supabase.from("volunteer_assignments").insert(payload);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSlots([]);
    refresh();
  };

  const handleCopyLastService = async () => {
    if (!supabase || !serviceTimeId || !serviceDate) return;
    if (assignmentsForSelected.length > 0) {
      setError("Schedule already exists for this date.");
      return;
    }

    const context = await getCurrentContext();
    if (!context) return;

    const { data, error: queryError } = await supabase
      .from("volunteer_assignments")
      .select("*")
      .eq("church_id", context.profile.church_id)
      .eq("service_time_id", serviceTimeId)
      .lt("scheduled_date", serviceDate)
      .order("scheduled_date", { ascending: false })
      .limit(200);

    if (queryError) {
      setError(queryError.message);
      return;
    }

    const rows = (data ?? []) as AssignmentRow[];
    if (!rows.length) {
      setError("No prior service schedule found to copy.");
      return;
    }

    const lastDate = rows[0].scheduled_date;
    const rowsToCopy = rows.filter((row) => row.scheduled_date === lastDate);

    const payload = rowsToCopy.map((row) => ({
      church_id: context.profile.church_id,
      service_time_id: serviceTimeId,
      role_id: row.role_id,
      scheduled_date: serviceDate,
      status: "OPEN" as AssignmentStatus,
      notes: null,
      assigned_user_id: null
    }));

    const { error: insertError } = await supabase
      .from("volunteer_assignments")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    refresh();
  };

  const handleAssign = async (assignmentId: string, userId: string) => {
    if (!supabase) return;
    const nextStatus: AssignmentStatus = userId ? "ASSIGNED" : "OPEN";
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ assigned_user_id: userId || null, status: nextStatus })
      .eq("id", assignmentId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    refresh();
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ assigned_user_id: null, status: "OPEN" })
      .eq("id", assignmentId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    refresh();
  };

  const handleStatusChange = async (assignmentId: string, status: AssignmentStatus) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ status })
      .eq("id", assignmentId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    refresh();
  };

  const handleNotesChange = async (assignmentId: string, notes: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ notes: notes.trim() || null })
      .eq("id", assignmentId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    refresh();
  };

  const handleSendReminders = () => {
    setError("Reminders are not available yet.");
  };

  const serviceTimeLabel = (service: ServiceTimeRow) => {
    const weekday = weekdayNames[service.day_of_week] ?? "Service";
    const time = formatTimeString(service.start_time);
    return `${weekday} Service - ${time}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <AdminHeader
          title="Volunteer Scheduling"
          subtitle="See who is serving, fill open roles, and follow up in one place."
        />
      </div>

      <div>
        <NextServiceReadinessStrip
          serviceLabel={serviceLabel || "Not scheduled"}
          totalSlots={readinessCounts.total}
          openSlots={readinessCounts.open}
          pendingConfirmations={readinessCounts.pending}
          confirmedCount={readinessCounts.confirmed}
          declinedCount={readinessCounts.declined}
          onGenerate={handleGenerateSchedule}
          onCopyLast={handleCopyLastService}
          onSendReminders={handleSendReminders}
        />
      </div>

      {error ? (
        <div>
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : null}

      <div>
        <AssignmentsTable
          assignments={assignmentsForSelected}
          roles={roles}
          profiles={profiles}
          showOpenOnly={showOpenOnly}
          showPendingOnly={showPendingOnly}
          showDeclinedOnly={showDeclinedOnly}
          searchTerm={searchTerm}
          onToggleOpenOnly={setShowOpenOnly}
          onTogglePendingOnly={setShowPendingOnly}
          onToggleDeclinedOnly={setShowDeclinedOnly}
          onSearchChange={setSearchTerm}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          onGenerateSchedule={handleGenerateSchedule}
          onCopyLast={handleCopyLastService}
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <div>
            <AdminHeader
              title="Volunteer Scheduling"
              subtitle="See who is serving, fill open roles, and follow up in one place."
            />
          </div>

          <div>
            <NextServiceReadinessStrip
              serviceLabel={serviceLabel || "Not scheduled"}
              // ...existing props...
            />
          </div>

          <div>
            <AssignmentsTable
              // ...existing props...
            />
          </div>

          <div>
            <PendingResponsesCard
              // ...existing props...
            />
          </div>

          <div>
            <DeclinedCard
              // ...existing props...
            />
          </div>

          <div>
            <ScheduleBuilder
              // ...existing props...
            />
          </div>

          <div>
            <QuickRolePresets
              // ...existing props...
            />
          </div>
        </div>

        <div className="space-y-6">
          <PendingResponsesCard items={pendingItems} onFollowUp={handleSendReminders} />
          <DeclinedCard items={declinedItems} />
        </div>
      </section>
    </div>
  );
}

function formatTimeString(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function buildServiceDateTime(serviceDate: string, startTime: string) {
  if (!serviceDate || !startTime) return null;
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date(serviceDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function getNextServiceDateTime(serviceTimes: ServiceTimeRow[]) {
  if (!serviceTimes.length) return null;
  const now = new Date();
  const candidates = serviceTimes.map((service) => {
    const target = new Date(now);
    const currentDay = target.getDay();
    const dayOffset = (service.day_of_week + 7 - currentDay) % 7;
    target.setDate(target.getDate() + dayOffset);
    const [hours, minutes] = service.start_time.split(":").map(Number);
    target.setHours(hours || 0, minutes || 0, 0, 0);
    if (target < now) {
      target.setDate(target.getDate() + 7);
    }
    return target;
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? null;
}
