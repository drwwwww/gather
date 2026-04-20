"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Database } from "@gather/lib";
import PrintablePlan from "../../../../../../components/servicePlans/PrintablePlan";
import { fetchPlanRoleSlots, type ServicePlanRoleSlot } from "../../../../../../lib/db/servicePlans";
import { formatFriendlyDate, formatServiceTimeLabel } from "../../../../../../lib/format";
import { getCurrentContext, listProfilesByChurch } from "../../../../../../lib/supabaseData";
import { supabase } from "../../../../../../lib/supabaseClient";
import { Button } from "../../../../../../components/ui/button";
import { PageGrid, PageGridFull } from "../../../../../../components/layout/PageGrid";

type ServicePlan = Database["public"]["Tables"]["service_plans"]["Row"];
type PlanItemRow = Database["public"]["Tables"]["service_plan_items"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type PageState = "loading" | "ready" | "error";

function displayName(p: Pick<ProfileRow, "full_name" | "email"> | undefined): string | null {
  if (!p) return null;
  const v = p.full_name?.trim() || p.email?.trim();
  return v || null;
}

export default function ServicePlanPrintPage() {
  const params = useParams<{ planId: string }>();
  const planId = params?.planId;
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [items, setItems] = useState<PlanItemRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roleSlots, setRoleSlots] = useState<ServicePlanRoleSlot[]>([]);
  const [churchName, setChurchName] = useState("Gather");
  const [serviceLabel, setServiceLabel] = useState("Service");
  const [state, setState] = useState<PageState>("loading");
  const router = useRouter();

  const serviceDateLabel = useMemo(() => {
    return formatFriendlyDate(plan?.service_date) || plan?.service_date || "";
  }, [plan?.service_date]);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !planId) return;
      const context = await getCurrentContext();
      if (!context) {
        router.push("/login");
        return;
      }

      const { data: planData, error: planError } = await supabase
        .from("service_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError || !planData) {
        setState("error");
        return;
      }

      if (planData.church_id !== context.profile.church_id) {
        setState("error");
        return;
      }

      const { data: itemData, error: itemError } = await supabase
        .from("service_plan_items")
        .select("*")
        .eq("plan_id", planId)
        .order("position", { ascending: true });

      if (itemError) {
        setState("error");
        return;
      }

      const { data: roleData } = await supabase
        .from("volunteer_roles")
        .select("*")
        .eq("church_id", context.profile.church_id)
        .order("name", { ascending: true });

      const [slots, profileRows] = await Promise.all([
        fetchPlanRoleSlots(planId),
        listProfilesByChurch(context.profile.church_id)
      ]);

      setPlan(planData);
      setItems(itemData ?? []);
      setRoleSlots(slots);
      setRoles(roleData ?? []);
      setProfiles(profileRows ?? []);
      setChurchName(context.church.name);

      const service = context.serviceTimes.find((time) => time.id === planData.service_time_id);
      if (service) {
        setServiceLabel(formatServiceTimeLabel(service));
      }

      setState("ready");
    };

    load();
  }, [planId, router]);

  const profileById = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);

  const printableItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.title,
        duration_minutes: item.duration_minutes,
        notes: item.notes ?? "",
        status: item.status,
        assigned_person_name: item.assigned_user_id
          ? displayName(profileById.get(item.assigned_user_id))
          : null,
        backup_person_name: item.backup_user_id
          ? displayName(profileById.get(item.backup_user_id))
          : null
      })),
    [items, profileById]
  );

  const printableSlots = useMemo(
    () =>
      roleSlots.map((slot) => ({
        id: slot.id,
        role_name: roleNameById.get(slot.role_id) ?? "Role",
        assignee_name: slot.assigned_user_id ? displayName(profileById.get(slot.assigned_user_id)) : null,
        backup_name: slot.backup_user_id ? displayName(profileById.get(slot.backup_user_id)) : null,
        status: slot.status
      })),
    [roleSlots, roleNameById, profileById]
  );

  if (state === "loading") {
    return (
      <PageGrid className="animate-pulse-subtle">
        <PageGridFull>
          <div className="card h-[800px] bg-[var(--surface)]" />
        </PageGridFull>
      </PageGrid>
    );
  }

  if (state === "error" || !plan) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6">
        <div className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Plan not found</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>This plan may have been deleted or you don&apos;t have access.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <div className="space-y-6">
          <div className="flex items-center justify-between py-4 print:hidden">
            <p className="text-sm text-base-content/60">Printable view</p>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
          </div>
          <PrintablePlan
            churchName={churchName}
            serviceLabel={serviceLabel}
            serviceDate={serviceDateLabel}
            items={printableItems}
            roleSlots={printableSlots}
          />
        </div>
      </PageGridFull>
    </PageGrid>
  );
}
