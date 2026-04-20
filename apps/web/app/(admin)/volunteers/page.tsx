"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { getCurrentContext, indexProfilesById, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { formatShortWeekdayDateTime } from "../../../lib/format";
import NextServiceReadinessStrip from "../../../components/volunteers/NextServiceReadinessStrip";
import AssignmentsTable from "../../../components/volunteers/AssignmentsTable";
import type { BulletinSlotRow, BulletinItemRow } from "../../../components/volunteers/AssignmentsTable";
import PendingResponsesCard from "../../../components/volunteers/PendingResponsesCard";
import DeclinedCard from "../../../components/volunteers/DeclinedCard";
import RolesCard from "../../../components/volunteers/RolesCard";
import ScheduleBuilder from "../../../components/volunteers/ScheduleBuilder";
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../components/layout/PageGrid";
import { getNextServiceDateTime } from "../../../lib/nextServiceDatetime";
import type { Database, AssignmentStatus } from "@gather/lib";
type ServicePlanRoleSlotRow = Database["public"]["Tables"]["service_plan_role_slots"]["Row"];

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type MinistryRow = Database["public"]["Tables"]["ministries"]["Row"];
type ServiceTimeRow = Database["public"]["Tables"]["service_times"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type StoredScheduleSlot = {
  id: string;
  roleId: string;
  count: number;
};

type RoleView = RoleRow & { ministryName?: string | null };

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function VolunteersPage() {
  const getLocalDateInputValue = (value: Date = new Date()) => {
    const d = new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [roles, setRoles] = useState<RoleView[]>([]);
  const [ministries, setMinistries] = useState<MinistryRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [serviceTimes, setServiceTimes] = useState<ServiceTimeRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleMinistry, setNewRoleMinistry] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [serviceDate, setServiceDate] = useState(() => getLocalDateInputValue());
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
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  // Bulletin (service plan role slots + run-of-show items) for the selected date
  const [bulletinPlanId, setBulletinPlanId] = useState<string | null>(null);
  const [bulletinPlanTitle, setBulletinPlanTitle] = useState<string | null>(null);
  const [bulletinSlots, setBulletinSlots] = useState<BulletinSlotRow[]>([]);
  const [bulletinItems, setBulletinItems] = useState<BulletinItemRow[]>([]);
  const router = useRouter();

  const profilesById = useMemo(() => indexProfilesById(profiles), [profiles]);

  const churchId = useMemo(() => profiles[0]?.church_id ?? "", [profiles]);

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
    const counts = { total: 0, open: 0, pending: 0, confirmed: 0, declined: 0 };
    const tally = (status: string) => {
      counts.total += 1;
      if (status === "OPEN") counts.open += 1;
      else if (status === "ASSIGNED") counts.pending += 1;
      else if (status === "CONFIRMED") counts.confirmed += 1;
      else if (status === "DECLINED") counts.declined += 1;
    };
    for (const a of assignmentsForSelected) tally(a.status);
    for (const s of bulletinSlots) tally(s.status);
    for (const i of bulletinItems) tally(i.status);
    return counts;
  }, [assignmentsForSelected, bulletinSlots, bulletinItems]);

  const pendingItems = useMemo(() => {
    const items = assignmentsForSelected
      .filter((a) => a.status === "ASSIGNED")
      .map((a) => ({
        id: a.id,
        role: roles.find((r) => r.id === a.role_id)?.name ?? "Role",
        assignee: a.assigned_user_id && profilesById[a.assigned_user_id]
          ? profilesById[a.assigned_user_id]?.full_name || "Assigned"
          : "Unassigned",
        status: a.status
      }));
    const slotItems = bulletinSlots
      .filter((s) => s.status === "ASSIGNED")
      .map((s) => ({
        id: s.id,
        role: s.role_name,
        assignee: s.assigned_user_id && profilesById[s.assigned_user_id]
          ? profilesById[s.assigned_user_id]?.full_name || "Assigned"
          : "Unassigned",
        status: s.status
      }));
    const bulletinItemsPending = bulletinItems
      .filter((i) => i.status === "ASSIGNED")
      .map((i) => ({
        id: i.id,
        role: i.title,
        assignee: i.assigned_user_id && profilesById[i.assigned_user_id]
          ? profilesById[i.assigned_user_id]?.full_name || "Assigned"
          : "Unassigned",
        status: i.status
      }));
    return [...items, ...slotItems, ...bulletinItemsPending];
  }, [assignmentsForSelected, bulletinSlots, bulletinItems, roles, profilesById]);

  const declinedItems = useMemo(() => {
    const items = assignmentsForSelected
      .filter((a) => a.status === "DECLINED")
      .map((a) => ({
        id: a.id,
        role: roles.find((r) => r.id === a.role_id)?.name ?? "Role",
        detail: a.assigned_user_id
          ? profilesById[a.assigned_user_id]?.full_name || "Assigned"
          : "Unassigned"
      }));
    const slotItems = bulletinSlots
      .filter((s) => s.status === "DECLINED")
      .map((s) => ({
        id: s.id,
        role: s.role_name,
        detail: s.assigned_user_id && profilesById[s.assigned_user_id]
          ? profilesById[s.assigned_user_id]?.full_name || "Assigned"
          : "Unassigned"
      }));
    const bulletinItemsDeclined = bulletinItems
      .filter((i) => i.status === "DECLINED")
      .map((i) => ({
        id: i.id,
        role: i.title,
        detail: i.assigned_user_id && profilesById[i.assigned_user_id]
          ? profilesById[i.assigned_user_id]?.full_name || "Assigned"
          : "Unassigned"
      }));
    return [...items, ...slotItems, ...bulletinItemsDeclined];
  }, [assignmentsForSelected, bulletinSlots, bulletinItems, roles, profilesById]);

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

    if (rolesResult.error) { setError(rolesResult.error.message); return; }
    if (ministriesResult.error) { setError(ministriesResult.error.message); return; }
    if (assignmentsResult.error) { setError(assignmentsResult.error.message); return; }

    const ministriesData = (ministriesResult.data ?? []) as MinistryRow[];
    setMinistries(ministriesData);
    setRoles(
      ((rolesResult.data ?? []) as RoleRow[]).map((role) => ({
        ...role,
        ministryName: ministriesData.find((m) => m.id === role.ministry_id)?.name ?? null
      }))
    );
    setAssignments((assignmentsResult.data ?? []) as AssignmentRow[]);
    setProfiles(profilesResult ?? []);
  };

  const refreshBulletin = async () => {
    if (!supabase || !churchId || !serviceTimeId || !serviceDate) {
      setBulletinPlanId(null);
      setBulletinPlanTitle(null);
      setBulletinSlots([]);
      setBulletinItems([]);
      return;
    }

    // Find the service plan for this service time + date
    const { data: planData } = await supabase
      .from("service_plans")
      .select("id, title")
      .eq("church_id", churchId)
      .eq("service_time_id", serviceTimeId)
      .eq("service_date", serviceDate)
      .maybeSingle();

    if (!planData) {
      setBulletinPlanId(null);
      setBulletinPlanTitle(null);
      setBulletinSlots([]);
      setBulletinItems([]);
      return;
    }

    setBulletinPlanId(planData.id);
    setBulletinPlanTitle(planData.title ?? null);

    const [slotRes, itemRes, rolesRes] = await Promise.all([
      supabase
        .from("service_plan_role_slots")
        .select("*")
        .eq("plan_id", planData.id)
        .order("sort_order"),
      supabase
        .from("service_plan_items")
        .select("id, title, assigned_user_id, backup_user_id, assignment_status, notes, position")
        .eq("plan_id", planData.id)
        .not("assigned_user_id", "is", null)
        .order("position"),
      supabase
        .from("volunteer_roles")
        .select("id, name")
        .eq("church_id", churchId),
    ]);

    const roleNameById: Record<string, string> = {};
    for (const r of rolesRes.data ?? []) roleNameById[r.id] = r.name;

    setBulletinSlots(
      (slotRes.data ?? []).map((s: ServicePlanRoleSlotRow) => ({
        id: s.id,
        role_id: s.role_id,
        role_name: roleNameById[s.role_id] ?? "Role",
        assigned_user_id: s.assigned_user_id ?? null,
        backup_user_id: s.backup_user_id ?? null,
        status: (s.status ?? "OPEN") as AssignmentStatus,
        notes: s.notes ?? null
      }))
    );

    type PlanItemRow = { id: string; title: string | null; assigned_user_id: string | null; backup_user_id: string | null; assignment_status: AssignmentStatus | null; notes: string | null; position: number };
    setBulletinItems(
      (itemRes.data ?? [] as PlanItemRow[]).map((item: PlanItemRow) => ({
        id: item.id,
        title: item.title ?? "Untitled step",
        assigned_user_id: item.assigned_user_id ?? null,
        backup_user_id: item.backup_user_id ?? null,
        status: (item.assignment_status ?? "OPEN") as AssignmentStatus,
        notes: item.notes ?? null,
      }))
    );
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

  useEffect(() => {
    if (churchId && serviceTimeId && serviceDate) {
      refreshBulletin();
    }
  }, [churchId, serviceTimeId, serviceDate]);

  useEffect(() => {
    const msg = toastError ?? toastSuccess;
    if (!msg) return;
    setToastLeaving(false);
    let hideTimerId: ReturnType<typeof setTimeout> | null = null;
    const showTimerId = setTimeout(() => {
      setToastLeaving(true);
      hideTimerId = setTimeout(() => {
        setToastError(null);
        setToastSuccess(null);
        setToastLeaving(false);
      }, 250);
    }, 2500);
    return () => {
      clearTimeout(showTimerId);
      if (hideTimerId) clearTimeout(hideTimerId);
    };
  }, [toastError, toastSuccess]);

  const ensureMinistry = async (name: string, cid: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = ministries.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const { data, error: insertError } = await supabase!
      .from("ministries")
      .insert({ church_id: cid, name: trimmed })
      .select("id")
      .single();

    if (insertError) { setError(insertError.message); return null; }
    return data?.id ?? null;
  };

  const handleAddRole = async (presetName?: string) => {
    if (!supabase) return;
    const trimmed = (presetName ?? newRoleName).trim();
    if (!trimmed) return;

    const context = await getCurrentContext();
    if (!context) { router.push("/login"); return; }

    const ministryId = await ensureMinistry(newRoleMinistry, context.profile.church_id);

    const { error: insertError } = await supabase.from("volunteer_roles").insert({
      church_id: context.profile.church_id,
      name: trimmed,
      ministry_id: ministryId,
      description: presetName ? null : newRoleDescription.trim() || null
    });

    if (insertError) { setError(insertError.message); return; }

    setNewRoleName("");
    setNewRoleMinistry("");
    setNewRoleDescription("");
    refresh();
  };

  const handleEditRole = (role: { id: string; name: string; ministryName?: string | null; description?: string | null }) => {
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

    if (updateError) { setError(updateError.message); return; }

    setEditingRoleId(null);
    setEditRoleName("");
    setEditRoleMinistry("");
    setEditRoleDescription("");
    refresh();
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!supabase) return;
    const { error: deleteError } = await supabase.from("volunteer_roles").delete().eq("id", roleId);
    if (deleteError) { setError(deleteError.message); return; }
    refresh();
  };

  const handleAddSlot = () => {
    if (!slotRoleId || slotCount < 1) return;
    setSlots((prev) => [
      ...prev,
      { id: `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`, roleId: slotRoleId, count: slotCount }
    ]);
    setSlotCount(1);
  };

  const handleRemoveSlot = (slotId: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const handleGenerateSchedule = async () => {
    if (!supabase || !serviceTimeId || !slots.length) return;
    const context = await getCurrentContext();
    if (!context) return;

    const payload = slots.flatMap((slot) =>
      Array.from({ length: slot.count }, () => ({
        church_id: context.profile.church_id,
        service_time_id: serviceTimeId,
        role_id: slot.roleId,
        scheduled_date: serviceDate,
        status: "OPEN" as AssignmentStatus,
        notes: null
      }))
    );

    const { error: insertError } = await supabase.from("volunteer_assignments").insert(payload);
    if (insertError) { setError(insertError.message); return; }
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

    if (queryError) { setError(queryError.message); return; }

    const rows = (data ?? []) as AssignmentRow[];
    if (!rows.length) { setToastError("No prior service schedule found to copy."); return; }

    const lastDate = rows[0].scheduled_date;
    const rowsToCopy = rows.filter((row) => row.scheduled_date === lastDate);

    const payload = rowsToCopy.map((row) => ({
      church_id: context.profile.church_id,
      service_time_id: serviceTimeId,
      role_id: row.role_id,
      scheduled_date: serviceDate,
      status: (row.assigned_user_id ? "ASSIGNED" : "OPEN") as AssignmentStatus,
      notes: row.notes ?? null,
      assigned_user_id: row.assigned_user_id,
      backup_user_id: row.backup_user_id
    }));

    const { error: insertError } = await supabase.from("volunteer_assignments").insert(payload);
    if (insertError) { setError(insertError.message); return; }
    refresh();
  };

  const handleAssign = async (assignmentId: string, userId: string) => {
    if (!supabase) return;
    const nextStatus: AssignmentStatus = userId ? "ASSIGNED" : "OPEN";
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ assigned_user_id: userId || null, status: nextStatus })
      .eq("id", assignmentId);
    if (updateError) { setError(updateError.message); return; }
    refresh();
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ assigned_user_id: null, status: "OPEN" })
      .eq("id", assignmentId);
    if (updateError) { setError(updateError.message); return; }
    refresh();
  };

  const handleAssignBackup = async (assignmentId: string, userId: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ backup_user_id: userId || null })
      .eq("id", assignmentId);
    if (updateError) { setError(updateError.message); return; }
    refresh();
  };

  const handleStatusChange = async (assignmentId: string, status: AssignmentStatus) => {
    if (!supabase) return;
    // Auto-promote backup to primary when the primary is marked declined
    if (status === "DECLINED") {
      const a = assignmentsForSelected.find((r) => r.id === assignmentId);
      if (a?.backup_user_id) {
        const { error } = await supabase
          .from("volunteer_assignments")
          .update({ assigned_user_id: a.backup_user_id, backup_user_id: null, status: "ASSIGNED" })
          .eq("id", assignmentId);
        if (error) { setError(error.message); return; }
        refresh();
        return;
      }
    }
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ status })
      .eq("id", assignmentId);
    if (updateError) { setError(updateError.message); return; }
    refresh();
  };

  const handleNotesChange = async (assignmentId: string, notes: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("volunteer_assignments")
      .update({ notes: notes.trim() || null })
      .eq("id", assignmentId);
    if (updateError) { setError(updateError.message); return; }
    refresh();
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!supabase) return;
    const { error: deleteError } = await supabase
      .from("volunteer_assignments")
      .delete()
      .eq("id", assignmentId);
    if (deleteError) { setError(deleteError.message); return; }
    refresh();
  };

  const handleBulletinSlotUpdate = async (
    slotId: string,
    patch: { assigned_user_id?: string | null; backup_user_id?: string | null; status?: AssignmentStatus; notes?: string | null }
  ) => {
    if (!supabase) return;
    let finalPatch = { ...patch };
    // Auto-reset status when the assigned person changes
    if ("assigned_user_id" in patch && !("status" in patch)) {
      finalPatch.status = patch.assigned_user_id ? "ASSIGNED" : "OPEN";
    }
    // Auto-promote backup to primary when the primary is marked declined
    if (finalPatch.status === "DECLINED") {
      const slot = bulletinSlots.find((s) => s.id === slotId);
      if (slot?.backup_user_id) {
        finalPatch = { assigned_user_id: slot.backup_user_id, backup_user_id: null, status: "ASSIGNED" };
      }
    }
    const { error: updateError } = await supabase
      .from("service_plan_role_slots")
      .update(finalPatch)
      .eq("id", slotId);
    if (updateError) { setError(updateError.message); return; }
    refreshBulletin();
  };

  const handleBulletinSlotDelete = async (slotId: string) => {
    if (!supabase) return;
    const { error: deleteError } = await supabase
      .from("service_plan_role_slots")
      .delete()
      .eq("id", slotId);
    if (deleteError) { setError(deleteError.message); return; }
    refreshBulletin();
  };

  const handleBulletinItemUpdate = async (
    itemId: string,
    patch: { assigned_user_id?: string | null; backup_user_id?: string | null; status?: AssignmentStatus; notes?: string | null }
  ) => {
    if (!supabase) return;
    const { status, ...rest } = patch;
    let dbPatch: Record<string, unknown> = { ...rest };
    // service_plan_items.notes is NOT NULL — never persist null
    if ("notes" in dbPatch) {
      const n = dbPatch.notes;
      dbPatch.notes = n == null || typeof n !== "string" ? "" : n.trim();
    }
    if (status !== undefined) dbPatch.assignment_status = status;
    // Auto-reset assignment_status when the assigned person changes
    if ("assigned_user_id" in patch && status === undefined) {
      dbPatch.assignment_status = patch.assigned_user_id ? "ASSIGNED" : "OPEN";
    }
    // Auto-promote backup to primary when the primary is marked declined
    if (dbPatch.assignment_status === "DECLINED") {
      const item = bulletinItems.find((i) => i.id === itemId);
      if (item?.backup_user_id) {
        dbPatch = { assigned_user_id: item.backup_user_id, backup_user_id: null, assignment_status: "ASSIGNED" };
      }
    }
    const { error: updateError } = await supabase
      .from("service_plan_items")
      .update(dbPatch)
      .eq("id", itemId);
    if (updateError) { setError(updateError.message); return; }
    refreshBulletin();
  };

  const handleSendReminders = async () => {
    setError(null);
    try {
      const res = await fetch("/api/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookaheadHours: 168 })
      });
      const data = (await res.json().catch(() => ({}))) as { dispatched?: number; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to send reminders."); return; }
      const count = data.dispatched ?? 0;
      setToastSuccess(
        count > 0
          ? `${count} reminder${count === 1 ? "" : "s"} sent (schedule + bulletin).`
          : "No pending assignments or bulletin spots in the next 7 days."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reminders.");
    }
  };

  const serviceTimeLabel = (service: ServiceTimeRow) => {
    const weekday = weekdayNames[service.day_of_week] ?? "Service";
    const time = formatTimeString(service.start_time);
    return `${weekday} Service - ${time}`;
  };

  return (
    <>
      {typeof document !== "undefined" && (toastError ?? toastSuccess)
        ? createPortal(
            <div
              className={`fixed left-4 right-4 top-4 z-[9999] max-w-md mx-auto ${toastLeaving ? "toast-alert-leave" : "toast-alert-enter"}`}
              role="alert"
            >
              <div
                role="alert"
                className="flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
                style={
                  toastSuccess
                    ? { background: "var(--success)", color: "white", border: "1px solid var(--success-hover)" }
                    : { background: "var(--danger)", color: "white", border: "1px solid var(--danger-hover)" }
                }
              >
                {toastSuccess ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{toastSuccess ?? toastError}</span>
              </div>
            </div>,
            document.body
          )
        : null}
      <PageGrid>
        <PageGridFull className="animate-fade-in-up">
          <AdminHeader
            title="Volunteer Scheduling"
            subtitle="See who is serving, fill open roles, and follow up in one place."
          />
        </PageGridFull>

        {/* Date + service time selector — controls everything below */}
        <PageGridFull className="animate-fade-in-up [animation-delay:30ms] opacity-0">
          <div className="card shadow-sm p-4 flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Service date</label>
              <input
                type="date"
                className="input input-bordered"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Service time</label>
              <select
                className="select select-bordered"
                value={serviceTimeId}
                onChange={(e) => setServiceTimeId(e.target.value)}
              >
                {serviceTimes.length === 0 ? (
                  <option value="">No service times configured</option>
                ) : (
                  serviceTimes.map((s) => (
                    <option key={s.id} value={s.id}>{serviceTimeLabel(s)}</option>
                  ))
                )}
              </select>
            </div>
            {serviceLabel ? (
              <p className="text-sm pb-2" style={{ color: "var(--text-muted)" }}>{serviceLabel}</p>
            ) : null}
          </div>
        </PageGridFull>

        <PageGridFull className="animate-fade-in-up [animation-delay:50ms] opacity-0">
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
        </PageGridFull>

        {error ? (
          <PageGridFull>
            <p className="text-sm text-error">{error}</p>
          </PageGridFull>
        ) : null}

        <PageGridFull className="animate-fade-in-up [animation-delay:100ms] opacity-0">
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
            onAssignBackup={handleAssignBackup}
            onUnassignBackup={(id) => handleAssignBackup(id, "")}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onDelete={handleDeleteAssignment}
            onGenerateSchedule={handleGenerateSchedule}
            onCopyLast={handleCopyLastService}
            bulletinPlanTitle={bulletinPlanTitle}
            bulletinSlots={bulletinSlots}
            onBulletinSlotUpdate={handleBulletinSlotUpdate}
            onBulletinSlotDelete={handleBulletinSlotDelete}
            bulletinItems={bulletinItems}
            onBulletinItemUpdate={handleBulletinItemUpdate}
            onRefresh={() => { refresh(); refreshBulletin(); }}
          />
        </PageGridFull>

        <PageGridRowTwoOne
          className="animate-fade-in-up [animation-delay:200ms] opacity-0"
          main={
            <div className="space-y-8">
              <ScheduleBuilder
                roles={roles}
                slotRoleId={slotRoleId}
                slotCount={slotCount}
                slots={slots}
                onSlotRoleChange={setSlotRoleId}
                onSlotCountChange={setSlotCount}
                onAddSlot={handleAddSlot}
                onRemoveSlot={handleRemoveSlot}
                onGenerateSchedule={handleGenerateSchedule}
                onCopyLast={handleCopyLastService}
              />
            </div>
          }
          side={
            <div className="space-y-6">
              <RolesCard
                roles={roles}
                newRoleName={newRoleName}
                newRoleMinistry={newRoleMinistry}
                newRoleDescription={newRoleDescription}
                editingRoleId={editingRoleId}
                editRoleName={editRoleName}
                editRoleMinistry={editRoleMinistry}
                editRoleDescription={editRoleDescription}
                onNewRoleNameChange={setNewRoleName}
                onNewRoleMinistryChange={setNewRoleMinistry}
                onNewRoleDescriptionChange={setNewRoleDescription}
                onAddRole={handleAddRole}
                onEditRole={handleEditRole}
                onEditRoleNameChange={setEditRoleName}
                onEditRoleMinistryChange={setEditRoleMinistry}
                onEditRoleDescriptionChange={setEditRoleDescription}
                onSaveRole={handleSaveRole}
                onCancelEdit={() => setEditingRoleId(null)}
                onDeleteRole={handleDeleteRole}
              />
              <PendingResponsesCard items={pendingItems} onFollowUp={handleSendReminders} />
              <DeclinedCard items={declinedItems} />
            </div>
          }
        />
      </PageGrid>
    </>
  );
}

function formatTimeString(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function buildServiceDateTime(serviceDate: string, startTime: string) {
  if (!serviceDate || !startTime) return null;
  const [year, month, day] = serviceDate.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  if (!year || !month || !day) return null;
  // Use local-date constructor to avoid UTC-midnight-offset shifting the date back one day
  const date = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

