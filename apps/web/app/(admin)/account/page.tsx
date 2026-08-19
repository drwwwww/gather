"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { getCurrentContext, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import { coverForAuthTransition } from "../../../lib/authTransition";
import ProfileCard from "../../../components/account/ProfileCard";
import SecurityCard from "../../../components/account/SecurityCard";
import ChurchSettingsCard from "../../../components/account/ChurchSettingsCard";
import TeamOverviewCard from "../../../components/account/TeamOverviewCard";
import PlanCard from "../../../components/account/PlanCard";
import WorshipDaysCard from "../../../components/account/WorshipDaysCard";
import ServiceTimesCard, { type ServiceTimeItem } from "../../../components/account/ServiceTimesCard";
import { formatTimezoneLabel, getTimezoneOptions } from "../../../lib/format";
import { useToast } from "../../../lib/toast";
import { PageGrid, PageGridFull, PageGridRowTwoOne } from "../../../components/layout/PageGrid";
import type { Database } from "@gather/lib";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Church = Database["public"]["Tables"]["churches"]["Row"];

type TeamCounts = {
  members: number;
  service: number;
  admins: number;
};

export default function AccountPage() {
  const [profileName, setProfileName] = useState("");
  const [churchName, setChurchName] = useState("");
  const [churchSlug, setChurchSlug] = useState("");
  const [timezone, setTimezone] = useState("");
  const [initialTimezone, setInitialTimezone] = useState("");
  const [teamCounts, setTeamCounts] = useState<TeamCounts>({ members: 0, service: 0, admins: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [worshipDays, setWorshipDays] = useState<number[]>([0]);
  const [serviceTimes, setServiceTimes] = useState<ServiceTimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, pushToast } = useToast();
  const router = useRouter();
  const timezoneOptions = useMemo(() => {
    const options = getTimezoneOptions();
    if (!timezone) return options;
    if (options.some((option) => option.value === timezone)) return options;
    return [{ value: timezone, label: formatTimezoneLabel(timezone) }, ...options];
  }, [timezone]);

  const refresh = async () => {
    const showSkeleton = profile === null && church === null;
    if (showSkeleton) setLoading(true);
    try {
      const context = await getCurrentContext();
      if (!context) {
        router.push("/login");
        return;
      }

      setProfile(context.profile);
      setProfileName(context.profile.full_name ?? "");
      setChurch(context.church);
      setChurchName(context.church.name);
      setChurchSlug(context.church.slug);
      const resolvedTimezone = context.church.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(resolvedTimezone);
      setInitialTimezone(resolvedTimezone);

      const members: Profile[] = await listProfilesByChurch(context.profile.church_id);
      setTeamCounts({
        members: members.filter((member) => member.role === "MEMBER" && !member.disabled).length,
        service: members.filter((member) => member.role === "SERVICE" && !member.disabled).length,
        admins: members.filter((member) => member.role === "ADMIN" && !member.disabled).length
      });

      if (supabase) {
        const { data: churchData } = await supabase
          .from("churches")
          .select("worship_days")
          .eq("id", context.profile.church_id)
          .maybeSingle();
        setWorshipDays((churchData as any)?.worship_days ?? [0]);

        const { data: serviceTimesData } = await supabase
          .from("service_times")
          .select("id, name, day_of_week, start_time, timezone")
          .eq("church_id", context.profile.church_id)
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true });
        setServiceTimes((serviceTimesData as ServiceTimeItem[]) ?? []);
      }
    } catch (err) {
      pushToast("Unable to load account settings.", "error");
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const roleLabel = useMemo(() => {
    if (!profile) return "Member";
    if (profile.role === "ADMIN") return "Administrator";
    if (profile.role === "SERVICE") return "Service Team";
    return "Member";
  }, [profile]);

  const profileSaveDisabled = useMemo(() => {
    if (!profile) return true;
    return profileName.trim() === (profile.full_name ?? "").trim();
  }, [profile, profileName]);

  const churchSaveDisabled = useMemo(() => {
    if (!church) return true;
    const nameUnchanged = churchName.trim() === (church.name ?? "").trim();
    const timezoneUnchanged = timezone === initialTimezone;
    return nameUnchanged && timezoneUnchanged;
  }, [church, churchName, timezone, initialTimezone]);

  const handleSaveProfile = async () => {
    if (!supabase || !profile) return;
    const trimmedName = profileName.trim();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: trimmedName })
      .eq("id", profile.id);

    if (updateError) {
      pushToast("Couldn't update profile. Try again.", "error");
      return;
    }

    pushToast("Profile updated.", "success");
    refresh();
  };

  const handleSaveChurch = async () => {
    if (!supabase || !profile || !church) return;
    const trimmedName = churchName.trim();
    const nextTimezone = timezone.trim() || initialTimezone;
    const { error: updateError } = await supabase
      .from("churches")
      .update({ name: trimmedName, timezone: nextTimezone })
      .eq("id", profile.church_id);

    if (updateError) {
      pushToast("Couldn't update church settings. Try again.", "error");
      return;
    }

    pushToast("Church settings updated.", "success");
    refresh();
  };

  const handleChangePassword = async () => {
    if (!supabase || !profile?.email) return;
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      profile.email,
      redirectTo ? { redirectTo } : undefined
    );

    if (resetError) {
      pushToast("Couldn't send reset email. Try again.", "error");
      return;
    }

    pushToast("Password reset email sent.", "success");
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    await coverForAuthTransition();
    router.push("/login");
  };

  const handleSaveWorshipDays = async (days: number[]) => {
    if (!supabase || !profile) return;
    const { error } = await supabase
      .from("churches")
      .update({ worship_days: days } as any)
      .eq("id", profile.church_id);
    if (error) { pushToast("Couldn't save worship days.", "error"); return; }
    setWorshipDays(days);
    pushToast("Worship days saved.", "success");
  };

  const handleAddServiceTime = async (draft: { name: string; day_of_week: number; start_time: string }) => {
    if (!supabase || !profile || !church) return;
    const { error } = await supabase
      .from("service_times")
      .insert({
        church_id: profile.church_id,
        name: draft.name.trim() || "Main Service",
        day_of_week: draft.day_of_week,
        start_time: draft.start_time,
        timezone: church.timezone,
      });
    if (error) { pushToast("Couldn't add service time.", "error"); return; }
    pushToast("Service time added.", "success");
    refresh();
  };

  const handleUpdateServiceTime = async (id: string, patch: Partial<{ name: string; day_of_week: number; start_time: string }>) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("service_times")
      .update(patch)
      .eq("id", id);
    if (error) { pushToast("Couldn't update service time.", "error"); return; }
    pushToast("Service time updated.", "success");
    refresh();
  };

  const handleDeleteServiceTime = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("service_times")
      .delete()
      .eq("id", id);
    if (error) { pushToast("Couldn't remove service time.", "error"); return; }
    pushToast("Service time removed.", "success");
    refresh();
  };

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Account</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your profile, church settings, and service schedule.</p>
        </div>
      </PageGridFull>

      {loading ? (
        <PageGridFull>
          <div className="grid gap-6 lg:grid-cols-3">
            {[1,2,3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-[var(--surface)]" />)}
          </div>
        </PageGridFull>
      ) : (
        <>
          {/* Row 1: Profile · Security · Team */}
          <PageGridFull className="animate-fade-in-up [animation-delay:60ms]">
            <div className="grid gap-5 lg:grid-cols-3">
              <ProfileCard
                name={profileName}
                email={profile?.email ?? ""}
                roleLabel={roleLabel}
                onNameChange={setProfileName}
                onSave={handleSaveProfile}
                saveDisabled={profileSaveDisabled}
              />
              <SecurityCard onChangePassword={handleChangePassword} onSignOut={handleSignOut} />
              <TeamOverviewCard
                admins={teamCounts.admins}
                serviceTeam={teamCounts.service}
                members={teamCounts.members}
                onManageMembers={() => router.push("/people")}
                onInviteMembers={() => router.push("/people/invite")}
              />
            </div>
          </PageGridFull>

          {/* Row 2: Church settings · Service times */}
          <PageGridFull className="animate-fade-in-up [animation-delay:100ms]">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <ChurchSettingsCard
                churchName={churchName}
                joinCode={churchSlug}
                timezone={timezone}
                timezoneOptions={timezoneOptions}
                onChurchNameChange={setChurchName}
                onTimezoneChange={setTimezone}
                onSave={handleSaveChurch}
                saveDisabled={churchSaveDisabled}
              />
              <WorshipDaysCard
                worshipDays={worshipDays}
                onSave={handleSaveWorshipDays}
              />
            </div>
          </PageGridFull>

          {/* Row 3: Service times */}
          <PageGridFull className="animate-fade-in-up [animation-delay:140ms]">
            <ServiceTimesCard
              serviceTimes={serviceTimes}
              onAdd={handleAddServiceTime}
              onUpdate={handleUpdateServiceTime}
              onDelete={handleDeleteServiceTime}
            />
          </PageGridFull>
        </>
      )}

      {toast && (
        <PageGridFull>
          <div className={`fixed right-6 top-20 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.tone === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
            {toast.message}
          </div>
        </PageGridFull>
      )}
    </PageGrid>
  );
}
