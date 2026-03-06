"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PrintablePlan from "../../../../../../components/servicePlans/PrintablePlan";
import { formatFriendlyDate, formatServiceTimeLabel } from "../../../../../../lib/format";
import { getCurrentContext } from "../../../../../../lib/supabaseData";
import { supabase } from "../../../../../../lib/supabaseClient";
import type { Database } from "@gather/lib";
import { Button } from "../../../../../../components/ui/button";

type ServicePlan = Database["public"]["Tables"]["service_plans"]["Row"];
type PlanItemRow = Database["public"]["Tables"]["service_plan_items"]["Row"];
type RoleRow = Database["public"]["Tables"]["volunteer_roles"]["Row"];

type PageState = "loading" | "ready" | "error";

export default function ServicePlanPrintPage() {
  const params = useParams<{ planId: string }>();
  const planId = params?.planId;
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [items, setItems] = useState<PlanItemRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
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

      setPlan(planData);
      setItems(itemData ?? []);
      setRoles(roleData ?? []);
      setChurchName(context.church.name);

      const service = context.serviceTimes.find((time) => time.id === planData.service_time_id);
      if (service) {
        setServiceLabel(formatServiceTimeLabel(service));
      }

      setState("ready");
    };

    load();
  }, [planId, router]);

  if (state === "loading") {
    return <p className="text-sm text-base-content/70">Loading plan...</p>;
  }

  if (state === "error" || !plan) {
    return <p className="text-sm text-base-content/70">Plan not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-sm text-base-content/60">Printable view</p>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
      <PrintablePlan
        churchName={churchName}
        serviceLabel={serviceLabel}
        serviceDate={serviceDateLabel}
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          duration_minutes: item.duration_minutes,
          notes: item.notes ?? "",
          owner_role_id: item.owner_role_id,
          status: item.status
        }))}
        roles={roles}
      />
    </div>
  );
}
