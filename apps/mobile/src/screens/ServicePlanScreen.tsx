import { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { ui } from "../ui";
import { supabase } from "../supabase";

type ServicePlan = {
  id: string;
  title: string;
  service_date: string;
};

type ServicePlanItem = {
  id: string;
  title: string;
  duration_minutes: number | null;
  notes: string;
  owner_role_id: string | null;
  status: string;
};

type RoleRow = {
  id: string;
  name: string;
};

export default function ServicePlanScreen() {
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [items, setItems] = useState<ServicePlanItem[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleLookup = useMemo(() => {
    return roles.reduce<Record<string, string>>((acc, role) => {
      acc[role.id] = role.name;
      return acc;
    }, {});
  }, [roles]);

  useEffect(() => {
    const loadPlan = async () => {
      if (!supabase) return;
      setLoading(true);
      setError(null);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("Sign in to view the service plan.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, church_id, role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile?.church_id) {
        setError("Unable to load profile.");
        setLoading(false);
        return;
      }

      if (profile.role !== "SERVICE") {
        setError("Service plans are available for service team members.");
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const { data: planData, error: planError } = await supabase
        .from("service_plans")
        .select("id, title, service_date")
        .eq("church_id", profile.church_id)
        .gte("service_date", today)
        .order("service_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (planError) {
        setError(planError.message);
        setLoading(false);
        return;
      }

      if (!planData) {
        setPlan(null);
        setItems([]);
        setLoading(false);
        return;
      }

      setPlan(planData as ServicePlan);

      const { data: itemData, error: itemError } = await supabase
        .from("service_plan_items")
        .select("*")
        .eq("plan_id", planData.id)
        .order("position");

      if (itemError) {
        setError(itemError.message);
        setLoading(false);
        return;
      }

      setItems((itemData ?? []) as ServicePlanItem[]);

      const { data: roleData, error: roleError } = await supabase
        .from("volunteer_roles")
        .select("id, name")
        .eq("church_id", profile.church_id);
      if (!roleError) {
        setRoles((roleData ?? []) as RoleRow[]);
      }

      setLoading(false);
    };

    loadPlan();
  }, []);

  if (loading) {
    return (
      <View style={ui.screen}>
        <Text style={ui.subtitle}>Loading service plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={ui.screen}>
        <Text style={ui.subtitle}>{error}</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={ui.screen}>
        <View style={ui.header}>
          <Text style={ui.title}>Service Plan</Text>
          <Text style={ui.subtitle}>No upcoming plan found.</Text>
        </View>
        <View style={ui.cardAlt}>
          <Text style={ui.subtitle}>Check back after your admin publishes a plan.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ui.screen}>
      <View style={ui.header}>
        <Text style={ui.title}>Service Plan</Text>
        <Text style={ui.subtitle}>{plan.title || "Upcoming Service"}</Text>
        <Text style={ui.subtitle}>Date: {plan.service_date}</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={ui.card}>
          <View style={ui.row}>
            <Text style={ui.cardTitle}>{item.title}</Text>
            {item.duration_minutes ? (
              <View style={ui.badge}>
                <Text style={ui.badgeText}>{item.duration_minutes} min</Text>
              </View>
            ) : null}
          </View>
          {item.owner_role_id ? (
            <Text style={ui.subtitle}>
              Owner: {roleLookup[item.owner_role_id] ?? "Assigned role"}
            </Text>
          ) : (
            <Text style={ui.subtitle}>Owner: Unassigned</Text>
          )}
          {item.notes ? <Text style={ui.subtitle}>Notes: {item.notes}</Text> : null}
          <View style={ui.badge}>
            <Text style={ui.badgeText}>{item.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
