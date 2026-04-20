"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemberPortal } from "../../../components/member/MemberPortalContext";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../lib/toast";
import ProfileCard from "../../../components/account/ProfileCard";
import SecurityCard from "../../../components/account/SecurityCard";
import type { Database } from "@gather/lib";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function MemberAccountPage() {
  const { userId } = useMemberPortal();
  const router = useRouter();
  const { toast, pushToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error || !data) {
        pushToast("Unable to load your profile.", "error");
        return;
      }
      setProfile(data as Profile);
      setProfileName(data.full_name ?? "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  const roleLabel = useMemo(() => {
    if (!profile) return "Member";
    if (profile.role === "SERVICE") return "Service Team";
    return "Member";
  }, [profile]);

  const profileSaveDisabled = useMemo(() => {
    if (!profile) return true;
    return profileName.trim() === (profile.full_name ?? "").trim();
  }, [profile, profileName]);

  const handleSaveProfile = async () => {
    if (!supabase || !profile) return;
    const trimmedName = profileName.trim();
    const { error: updateError } = await supabase.from("profiles").update({ full_name: trimmedName }).eq("id", profile.id);
    if (updateError) {
      pushToast("Couldn't update profile. Try again.", "error");
      return;
    }
    pushToast("Profile updated.", "success");
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
    router.push("/login");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Account</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Update how you appear and manage sign-in.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card h-[280px] animate-pulse-subtle bg-[var(--surface-2)]" />
          <div className="card h-[220px] animate-pulse-subtle bg-[var(--surface-2)]" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <ProfileCard
            name={profileName}
            email={profile?.email ?? ""}
            roleLabel={roleLabel}
            onNameChange={setProfileName}
            onSave={handleSaveProfile}
            saveDisabled={profileSaveDisabled}
          />
          <SecurityCard onChangePassword={handleChangePassword} onSignOut={handleSignOut} />
        </div>
      )}

      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm shadow">
          <p className={toast.tone === "error" ? "text-error" : "text-base-content"}>{toast.message}</p>
        </div>
      ) : null}
    </div>
  );
}
