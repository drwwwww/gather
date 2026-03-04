"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../components/admin/AdminHeader";
import { getCurrentContext, listProfilesByChurch } from "../../../lib/supabaseData";
import { supabase } from "../../../lib/supabaseClient";
import ProfileCard from "../../../components/account/ProfileCard";
import SecurityCard from "../../../components/account/SecurityCard";
import ChurchSettingsCard from "../../../components/account/ChurchSettingsCard";
import TeamOverviewCard from "../../../components/account/TeamOverviewCard";
import PlanCard from "../../../components/account/PlanCard";
import { formatTimezoneLabel, getTimezoneOptions } from "../../../lib/format";
import { useToast } from "../../../lib/toast";
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
  const { toast, pushToast } = useToast();
  const router = useRouter();
  const timezoneOptions = useMemo(() => {
    const options = getTimezoneOptions();
    if (!timezone) return options;
    if (options.some((option) => option.value === timezone)) return options;
    return [{ value: timezone, label: formatTimezoneLabel(timezone) }, ...options];
  }, [timezone]);

  const refresh = async () => {
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
    } catch (err) {
      pushToast("Unable to load account settings.", "error");
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
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/sign-in` : undefined;
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
    router.push("/login");
  };

  return (
    <div className="space-y-8">
      <div>
        <AdminHeader title="Account" subtitle="Church settings and account management." />
      </div>
      <div>
        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <ProfileCard
            name={profileName}
            email={profile?.email ?? ""}
            roleLabel={roleLabel}
            onNameChange={setProfileName}
            onSave={handleSaveProfile}
            saveDisabled={profileSaveDisabled}
          />
          <div className="space-y-6">
            <SecurityCard
              onChangePassword={handleChangePassword}
              onSignOut={handleSignOut}
            />
          </div>
        </section>
      </div>

      <div>
        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
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
          <div className="space-y-6">
            <TeamOverviewCard
              admins={teamCounts.admins}
              serviceTeam={teamCounts.service}
              members={teamCounts.members}
              onManageMembers={() => router.push("/people")}
              onInviteMembers={() => router.push("/people")}
            />
            <PlanCard />
          </div>
        </section>
      </div>

      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-base-200 px-4 py-3 text-sm shadow">
          <p className={toast.tone === "error" ? "text-error" : "text-base-content"}>{toast.message}</p>
        </div>
      ) : null}
    </div>
  );
}
