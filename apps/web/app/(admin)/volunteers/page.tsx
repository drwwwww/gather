"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
import ScheduleBuilder from "../../../components/volunteers/ScheduleBuilder";
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../components/layout/PageGrid";
import type { Database, AssignmentStatus } from "@gather/lib";
type ServicePlanRoleSlotRow = Database["public"]["Tables"]["service_plan_role_slots"]["Row"];

type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type StoredScheduleSlot = {
  id: string;
  roleId: string;
  count: number;
};

type RoleView = RoleRow & { ministryName?: string | null };

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getLocalDateInputValue(value: Date = new Date()) {
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function addDaysYmd(ymd: string, delta: number): string {
  const d = parseYmdLocal(ymd);
  d.setDate(d.getDate() + delta);
  return getLocalDateInputValue(d);
}

export default function VolunteersPage() {

  const [roles, setRoles] = useState<RoleView[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  /** YYYY-MM-DD dates that have an active service plan (drives the strip dots). */
  const [planDates, setPlanDates] = useState<Set<string>>(new Set());
  const [serviceDate, setServiceDate] = useState(() => getLocalDateInputValue());
  /** First day (YYYY-MM-DD) of the 7-day strip; chevrons shift this without changing selection until a pill is chosen. */
  const [dateStripStart, setDateStripStart] = useState(() => addDaysYmd(getLocalDateInputValue(), -3));
  const [showCalendar, setShowCalendar] = useState(false);
  const [stripAnim, setStripAnim] = useState<"left" | "right" | null>(null);
  /** First day of the month shown in the calendar popover (YYYY-MM-01). */
  const [calendarMonth, setCalendarMonth] = useState(() => getLocalDateInputValue().slice(0, 7) + "-01");
  const [slotRoleId, setSlotRoleId] = useState("");
  const [slotCount, setSlotCount] = useState(1);
  const [slots, setSlots] = useState<StoredScheduleSlot[]>([]);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showDeclinedOnly, setShowDeclinedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  // Bulletin (service plan role slots + run-of-show items) for the selected date
  const [bulletinPlanId, setBulletinPlanId] = useState<string | null>(null);
  const [bulletinPlanTitle, setBulletinPlanTitle] = useState<string | null>(null);
  const [bulletinSlots, setBulletinSlots] = useState<BulletinSlotRow[]>([]);
  const [bulletinItems, setBulletinItems] = useState<BulletinItemRow[]>([]);
  const [bulletinLoading, setBulletinLoading] = useState(false);
  const router = useRouter();

  const profilesById = useMemo(() => indexProfilesById(profiles), [profiles]);

  const dateStripDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysYmd(dateStripStart, i)),
    [dateStripStart]
  );

  // Plans on a date determine if a "has service" dot shows on the strip
  const serviceDaysOfWeek = useMemo(() => new Set<number>(), []);

  const triggerStripAnim = (anim: "left" | "right") => {
    setStripAnim(null);
    requestAnimationFrame(() => setStripAnim(anim));
  };

  const selectServiceDateFromStrip = (ymd: string) => {
    const diff = dateDiffDays(serviceDate, ymd);
    if (diff === 0) return;
    const dir = diff > 0 ? "left" : "right";
    const absDiff = Math.abs(diff);

    // For large jumps (calendar picker), snap immediately
    if (absDiff > 7) {
      setServiceDate(ymd);
      setDateStripStart(addDaysYmd(ymd, -3));
      return;
    }

    // Step through each intermediate date, replaying the slide animation each tick
    const step = diff > 0 ? 1 : -1;
    Array.from({ length: absDiff }, (_, i) => addDaysYmd(serviceDate, step * (i + 1))).forEach((date, i) => {
      setTimeout(() => {
        triggerStripAnim(dir);
        setServiceDate(date);
        setDateStripStart(addDaysYmd(date, -3));
      }, i * 160);
    });
  };

  /** 6-week grid (42 cells) of YYYY-MM-DD covering the month in `calendarMonth`. */
  const calendarGridDays = useMemo(() => {
    const first = parseYmdLocal(calendarMonth);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay()); // back up to Sunday
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return getLocalDateInputValue(d);
    });
  }, [calendarMonth]);

  const openCalendar = () => {
    setCalendarMonth(serviceDate.slice(0, 7) + "-01");
    setShowCalendar((v) => !v);
  };

  useEffect(() => {
    if (!showCalendar) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCalendar(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showCalendar]);

  const churchId = useMemo(() => profiles[0]?.church_id ?? "", [profiles]);


  const readinessCounts = useMemo(() => {
    const counts = { total: 0, open: 0, pending: 0, confirmed: 0, declined: 0 };
    const tally = (status: string) => {
      counts.total += 1;
      if (status === "OPEN") counts.open += 1;
      else if (status === "ASSIGNED") counts.pending += 1;
      else if (status === "CONFIRMED") counts.confirmed += 1;
      else if (status === "DECLINED") counts.declined += 1;
    };
    for (const s of bulletinSlots) tally(s.status);
    for (const i of bulletinItems) tally(i.status);
    return counts;
  }, [bulletinSlots, bulletinItems]);

  const hasData = readinessCounts.total > 0;

  const pendingItems = useMemo(() => {
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
    return [...slotItems, ...bulletinItemsPending];
  }, [bulletinSlots, bulletinItems, profilesById]);

  const declinedItems = useMemo(() => {
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
    return [...slotItems, ...bulletinItemsDeclined];
  }, [bulletinSlots, bulletinItems, profilesById]);

  const serviceLabel = useMemo(() => {
    if (!serviceDate) return "Not scheduled";
    const [y, m, d] = serviceDate.split("-").map(Number);
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    return formatShortWeekdayDateTime(date);
  }, [serviceDate]);

  const refresh = async () => {
    if (!supabase) return;
    const context = await getCurrentContext();
    if (!context) {
      router.push("/login");
      return;
    }

    const [rolesResult, profilesResult, plansResult] = await Promise.all([
      supabase.from("volunteer_roles").select("*").eq("church_id", context.profile.church_id).order("name"),
      listProfilesByChurch(context.profile.church_id),
      supabase.from("service_plans").select("service_date").eq("church_id", context.profile.church_id)
    ]);

    if (rolesResult.error) { setError(rolesResult.error.message); return; }

    setRoles(
      ((rolesResult.data ?? []) as RoleRow[]).map((role) => ({
        ...role,
        ministryName: null
      }))
    );
    setProfiles(profilesResult ?? []);
    setPlanDates(
      new Set(((plansResult.data ?? []) as { service_date: string }[]).map((p) => p.service_date))
    );
  };

  const refreshBulletin = async () => {
    setBulletinLoading(true);
    if (!supabase || !churchId || !serviceDate) {
      setBulletinPlanId(null);
      setBulletinPlanTitle(null);
      setBulletinSlots([]);
      setBulletinItems([]);
      setBulletinLoading(false);
      return;
    }

    // Find the service plan for this service time + date
    const { data: planData } = await supabase
      .from("service_plans")
      .select("id, title")
      .eq("church_id", churchId)
      .eq("service_date", serviceDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!planData) {
      setBulletinPlanId(null);
      setBulletinPlanTitle(null);
      setBulletinSlots([]);
      setBulletinItems([]);
      setPlanDates((prev) => {
        if (!prev.has(serviceDate)) return prev;
        const next = new Set(prev);
        next.delete(serviceDate);
        return next;
      });
      setBulletinLoading(false);
      return;
    }

    setBulletinPlanId(planData.id);
    setBulletinPlanTitle(planData.title ?? null);
    setPlanDates((prev) => {
      if (prev.has(serviceDate)) return prev;
      const next = new Set(prev);
      next.add(serviceDate);
      return next;
    });

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
      (slotRes.data ?? []).map((s: ServicePlanRoleSlotRow) => {
        const rawStatus = (s.status ?? "OPEN") as AssignmentStatus;
        // If someone is assigned but status was never advanced past OPEN, treat as ASSIGNED (pending confirmation)
        const status: AssignmentStatus = s.assigned_user_id && rawStatus === "OPEN" ? "ASSIGNED" : rawStatus;
        return {
          id: s.id,
          role_id: s.role_id,
          role_name: roleNameById[s.role_id] ?? "Role",
          assigned_user_id: s.assigned_user_id ?? null,
          backup_user_id: s.backup_user_id ?? null,
          status,
          notes: s.notes ?? null
        };
      })
    );

    type PlanItemRow = { id: string; title: string | null; assigned_user_id: string | null; backup_user_id: string | null; assignment_status: AssignmentStatus | null; notes: string | null; position: number };
    setBulletinItems(
      (itemRes.data ?? [] as PlanItemRow[]).map((item: PlanItemRow) => {
        const rawStatus = (item.assignment_status ?? "OPEN") as AssignmentStatus;
        const status: AssignmentStatus = item.assigned_user_id && rawStatus === "OPEN" ? "ASSIGNED" : rawStatus;
        return {
          id: item.id,
          title: item.title ?? "Untitled step",
          assigned_user_id: item.assigned_user_id ?? null,
          backup_user_id: item.backup_user_id ?? null,
          status,
          notes: item.notes ?? null,
        };
      })
    );
    setBulletinLoading(false);
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
    if (churchId && serviceDate) {
      refreshBulletin();
    }
  }, [churchId, serviceDate]);

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
    if (!supabase || !slots.length || !churchId) return;
    const context = await getCurrentContext();
    if (!context) return;

    const { data: plan, error: planError } = await supabase
      .from("service_plans")
      .upsert(
        { church_id: context.profile.church_id, service_date: serviceDate, title: "Service Plan" } as any,
        { onConflict: "church_id,service_date", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (planError || !plan) { setError(planError?.message ?? "Failed to create plan"); return; }

    const payload = slots.flatMap((slot) =>
      Array.from({ length: slot.count }, (_, i) => ({
        plan_id: plan.id,
        role_id: slot.roleId,
        sort_order: i,
        status: "OPEN" as AssignmentStatus,
        notes: null,
      }))
    );

    const { error: insertError } = await supabase.from("service_plan_role_slots").insert(payload);
    if (insertError) { setError(insertError.message); return; }
    setSlots([]);
    refreshBulletin();
  };

  const handleCopyLastService = async () => {
    if (!supabase || !serviceDate || !churchId) return;
    if (bulletinSlots.length > 0 || bulletinItems.length > 0) {
      setError("A service plan already exists for this date.");
      return;
    }

    const context = await getCurrentContext();
    if (!context) return;

    // Find the most recent prior plan for this service time
    const { data: prevPlan, error: prevPlanError } = await supabase
      .from("service_plans")
      .select("id, service_date")
      .eq("church_id", context.profile.church_id)
      .lt("service_date", serviceDate)
      .order("service_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevPlanError) { setError(prevPlanError.message); return; }
    if (!prevPlan) { setToastError("No prior service plan found to copy."); return; }

    const { data: prevSlots, error: slotsError } = await supabase
      .from("service_plan_role_slots")
      .select("*")
      .eq("plan_id", prevPlan.id)
      .order("sort_order");

    if (slotsError) { setError(slotsError.message); return; }
    if (!prevSlots?.length) { setToastError("The prior plan has no role slots to copy."); return; }

    // Upsert a plan for the target date
    const { data: newPlan, error: newPlanError } = await supabase
      .from("service_plans")
      .upsert(
        { church_id: context.profile.church_id, service_date: serviceDate, title: "Service Plan" } as any,
        { onConflict: "church_id,service_date", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (newPlanError || !newPlan) { setError(newPlanError?.message ?? "Failed to create plan"); return; }

    const payload = (prevSlots as ServicePlanRoleSlotRow[]).map((slot, i) => ({
      plan_id: newPlan.id,
      role_id: slot.role_id,
      sort_order: i,
      assigned_user_id: slot.assigned_user_id,
      backup_user_id: slot.backup_user_id,
      status: (slot.assigned_user_id ? "ASSIGNED" : "OPEN") as AssignmentStatus,
      notes: slot.notes ?? null,
    }));

    const { error: insertError } = await supabase.from("service_plan_role_slots").insert(payload);
    if (insertError) { setError(insertError.message); return; }
    refreshBulletin();
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
    if (sendingReminders) return;
    setError(null);
    setSendingReminders(true);
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
          : "No new reminders to send — everyone pending was already notified in the last day."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reminders.");
    } finally {
      setSendingReminders(false);
    }
  };

  const handleNudgeOne = async (row: { id: string; assignee: string }) => {
    const slot = bulletinSlots.find((s) => s.id === row.id);
    const item = bulletinItems.find((i) => i.id === row.id);
    const userId = slot?.assigned_user_id ?? item?.assigned_user_id ?? null;
    if (!userId) return;
    setNudgingId(row.id);
    try {
      const res = await fetch("/api/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookaheadHours: 365, userId })
      });
      const data = (await res.json().catch(() => ({}))) as { dispatched?: number; error?: string };
      if (!res.ok) { setToastError(data.error ?? "Failed to send reminder."); }
      else { setToastSuccess(`Reminder sent to ${row.assignee}.`); }
    } catch (err) {
      setToastError(err instanceof Error ? err.message : "Failed to send reminder.");
    } finally {
      setNudgingId(null);
    }
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
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3 shadow-sm"
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <AdminHeader
              size="large"
              title="Volunteer scheduling"
              subtitle="Organize ministry teams and monitor service coverage for your upcoming gatherings."
            />
            {/* KPI chips */}
            {hasData && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "Confirmed", value: readinessCounts.confirmed, cls: "bg-green-50 text-green-700 ring-green-200" },
                  { label: "Pending",   value: readinessCounts.pending,   cls: "bg-slate-100 text-slate-600 ring-slate-200" },
                  { label: "Open",      value: readinessCounts.open,      cls: "bg-amber-50 text-amber-700 ring-amber-200" },
                  { label: "Declined",  value: readinessCounts.declined,  cls: "bg-red-50 text-red-600 ring-red-200" },
                ].filter(k => k.value > 0).map(({ label, value, cls }) => (
                  <span key={label} className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
                    {value} {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </PageGridFull>

        {/* Redesigned date strip — no outer pill container */}
        <PageGridFull className="relative z-50 flex justify-center">
          <div className="w-full max-w-4xl animate-volunteers-toolbar-reveal">

            {/* Section label + dot legend */}
            <div className="mb-3 flex items-center justify-center gap-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">Service Date</p>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                has a service plan
              </div>
            </div>

            {/* Arrow + day items */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] active:scale-95"
                aria-label="Show earlier dates"
                onClick={() => selectServiceDateFromStrip(addDaysYmd(serviceDate, -1))}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>

              <div
                className={[
                  "flex gap-0.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                  stripAnim === "left"  ? "animate-strip-slide-left"  :
                  stripAnim === "right" ? "animate-strip-slide-right" : ""
                ].join(" ")}
              >
                {dateStripDays.map((ymd, i) => {
                  const isSelected = ymd === serviceDate;
                  const hasPlan = planDates.has(ymd);
                  const d = parseYmdLocal(ymd);
                  const ariaDate = format(d, "EEEE, MMMM d, yyyy");
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => selectServiceDateFromStrip(ymd)}
                      aria-label={
                        isSelected
                          ? `Selected: ${ariaDate}`
                          : hasPlan
                          ? `${ariaDate} — has a service plan`
                          : `Set date to ${ariaDate}`
                      }
                      aria-pressed={isSelected}
                      style={{ animationDelay: `${i * 45}ms` }}
                      className={[
                        "flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-2 py-2",
                        "motion-safe:animate-volunteers-strip-reveal",
                        "transition-all duration-200 ease-out",
                        isSelected
                          ? "bg-[#EF9F27] cursor-default scale-[1.0]"
                          : "cursor-pointer hover:bg-[#FDF3E3] hover:scale-[1.04] hover:shadow-sm active:scale-[0.97]"
                      ].join(" ")}
                    >
                      <span className={[
                        "text-[10px] font-medium uppercase tracking-wide leading-none",
                        isSelected ? "text-white/80" : "text-[var(--text-muted)]"
                      ].join(" ")}>
                        {format(d, "EEE")}
                      </span>
                      <span className={[
                        "text-[15px] font-medium leading-none tabular-nums",
                        isSelected ? "text-white" : "text-[var(--text-primary)]"
                      ].join(" ")}>
                        {d.getDate()}
                      </span>
                      {/* Dot — marks days that have an active service plan */}
                      <span
                        aria-hidden
                        className={[
                          "h-1.5 w-1.5 rounded-full",
                          isSelected ? (hasPlan ? "bg-white/70" : "invisible") : hasPlan ? "bg-[#EF9F27]" : "invisible"
                        ].join(" ")}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] active:scale-95"
                aria-label="Show later dates"
                onClick={() => selectServiceDateFromStrip(addDaysYmd(serviceDate, 1))}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Service time info line — inline below strip */}
            <div className="mt-3 flex min-h-8 items-center justify-center gap-2 text-sm animate-volunteers-service-time-reveal">
              {planDates.has(serviceDate) || serviceDaysOfWeek.has(parseYmdLocal(serviceDate).getDay()) ? (
                <>
                  <CalendarDays className="h-4 w-4 shrink-0 text-[#EF9F27]" aria-hidden />
                  <span className="font-semibold text-[var(--text-primary)]">
                    {format(parseYmdLocal(serviceDate), "EEE, MMM d")}
                  </span>
                </>
              ) : (
                <span className="text-xs italic text-[var(--text-muted)]">No service scheduled on this date</span>
              )}

              {/* Calendar picker — opens a centered modal */}
              <button
                type="button"
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] transition-colors",
                  showCalendar
                    ? "bg-[#FDF3E3] text-[#EF9F27]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
                ].join(" ")}
                onClick={openCalendar}
                aria-label="Open calendar"
                aria-expanded={showCalendar}
              >
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              </button>

              {typeof document !== "undefined" && showCalendar
                ? createPortal(
                    <div
                      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Choose service date"
                      onClick={() => setShowCalendar(false)}
                    >
                      <div
                        className="w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface-container-lowest)] p-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Month header */}
                        <div className="mb-3 flex items-center justify-between">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                            aria-label="Previous month"
                            onClick={() => {
                              const d = parseYmdLocal(calendarMonth);
                              d.setMonth(d.getMonth() - 1);
                              setCalendarMonth(getLocalDateInputValue(d).slice(0, 7) + "-01");
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <span className="text-base font-semibold text-[var(--text-primary)]">
                            {format(parseYmdLocal(calendarMonth), "MMMM yyyy")}
                          </span>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                            aria-label="Next month"
                            onClick={() => {
                              const d = parseYmdLocal(calendarMonth);
                              d.setMonth(d.getMonth() + 1);
                              setCalendarMonth(getLocalDateInputValue(d).slice(0, 7) + "-01");
                            }}
                          >
                            <ChevronRight className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="mb-1 grid grid-cols-7 gap-1">
                          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
                            <span
                              key={i}
                              className="flex h-6 items-center justify-center text-[11px] font-semibold uppercase text-[var(--text-muted)]"
                            >
                              {w}
                            </span>
                          ))}
                        </div>

                        {/* Day grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {calendarGridDays.map((ymd) => {
                            const d = parseYmdLocal(ymd);
                            const inMonth = ymd.slice(0, 7) === calendarMonth.slice(0, 7);
                            const isSelected = ymd === serviceDate;
                            const isToday = ymd === getLocalDateInputValue();
                            const hasPlan = planDates.has(ymd);
                            return (
                              <button
                                key={ymd}
                                type="button"
                                onClick={() => {
                                  selectServiceDateFromStrip(ymd);
                                  setShowCalendar(false);
                                }}
                                aria-label={format(d, "EEEE, MMMM d, yyyy")}
                                aria-pressed={isSelected}
                                className={[
                                  "relative flex h-9 w-full items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
                                  isSelected
                                    ? "bg-[#EF9F27] font-semibold text-white"
                                    : inMonth
                                    ? "text-[var(--text-primary)] hover:bg-[#FDF3E3]"
                                    : "text-[var(--text-muted)] opacity-50 hover:bg-[var(--surface-2)]",
                                  !isSelected && isToday ? "ring-1 ring-inset ring-[#EF9F27]" : ""
                                ].join(" ")}
                              >
                                {d.getDate()}
                                {hasPlan && !isSelected ? (
                                  <span
                                    aria-hidden
                                    className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#EF9F27]"
                                  />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>,
                    document.body
                  )
                : null}
            </div>
          </div>
        </PageGridFull>

        {error ? (
          <PageGridFull>
            <p className="text-sm text-error">{error}</p>
          </PageGridFull>
        ) : null}

        <PageGridRowTwoOne
          split="wideMain"
          className="animate-fade-in-up [animation-delay:80ms]"
          main={
            <div className="space-y-10">
              {bulletinLoading ? (
                <BulletinSkeleton />
              ) : hasData ? (
                <AssignmentsTable
                  profiles={profiles}
                  showOpenOnly={showOpenOnly}
                  showPendingOnly={showPendingOnly}
                  showDeclinedOnly={showDeclinedOnly}
                  searchTerm={searchTerm}
                  onToggleOpenOnly={setShowOpenOnly}
                  onTogglePendingOnly={setShowPendingOnly}
                  onToggleDeclinedOnly={setShowDeclinedOnly}
                  onSearchChange={setSearchTerm}
                  onGenerateSchedule={handleGenerateSchedule}
                  onCopyLast={handleCopyLastService}
                  bulletinPlanTitle={bulletinPlanTitle}
                  bulletinPlanHref={bulletinPlanId ? `/admin/service-plans/${bulletinPlanId}` : null}
                  bulletinSlots={bulletinSlots}
                  onBulletinSlotUpdate={handleBulletinSlotUpdate}
                  onBulletinSlotDelete={handleBulletinSlotDelete}
                  bulletinItems={bulletinItems}
                  onBulletinItemUpdate={handleBulletinItemUpdate}
                  onRefresh={refreshBulletin}
                />
              ) : (
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
              )}
            </div>
          }
          side={
            <NextServiceReadinessStrip
              serviceLabel={serviceLabel || "Not scheduled"}
              totalSlots={readinessCounts.total}
              openSlots={readinessCounts.open}
              pendingConfirmations={readinessCounts.pending}
              confirmedCount={readinessCounts.confirmed}
              declinedCount={readinessCounts.declined}
              bulletinPlanHref={bulletinPlanId ? `/admin/service-plans/${bulletinPlanId}` : null}
              onGenerate={handleGenerateSchedule}
              onCopyLast={handleCopyLastService}
              onSendReminders={handleSendReminders}
              sendingReminders={sendingReminders}
            />
          }
        />

        {(pendingItems.length > 0 || declinedItems.length > 0) && (
          <PageGridFull>
            <div className={`grid gap-6 ${pendingItems.length > 0 && declinedItems.length > 0 ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {pendingItems.length > 0 && (
                <PendingResponsesCard items={pendingItems} onFollowUp={handleSendReminders} onNudge={handleNudgeOne} nudgingId={nudgingId} />
              )}
              {declinedItems.length > 0 && (
                <DeclinedCard items={declinedItems} />
              )}
            </div>
          </PageGridFull>
        )}
      </PageGrid>
    </>
  );
}

function dateDiffDays(from: string, to: string): number {
  return Math.round((parseYmdLocal(to).getTime() - parseYmdLocal(from).getTime()) / 86400000);
}

function BulletinSkeleton() {
  return (
    <div className="card card-elevated animate-pulse p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-40 rounded-full bg-[var(--surface-2)]" />
        <div className="h-8 w-28 rounded-lg bg-[var(--surface-2)]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl bg-[var(--surface)] p-4">
            <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-2)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded-full bg-[var(--surface-2)]" />
              <div className="h-3 w-20 rounded-full bg-[var(--surface-2)]" />
            </div>
            <div className="h-6 w-20 rounded-full bg-[var(--surface-2)]" />
          </div>
        ))}
      </div>
    </div>
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

