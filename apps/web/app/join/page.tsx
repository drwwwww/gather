"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { destinationAfterSignIn } from "../../lib/postLoginDestination";

type ChurchRow = { id: string; name: string; slug: string };

export default function PublicJoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawCode = (searchParams.get("code") ?? "").trim();
  const codeNorm = rawCode.toLowerCase();

  const [church, setChurch] = useState<ChurchRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingChurch, setLoadingChurch] = useState(true);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    church_id: string | null;
    role: string | null;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  const joinNext = useMemo(() => {
    if (!codeNorm) return "/join";
    return `/join?code=${encodeURIComponent(rawCode)}`;
  }, [codeNorm, rawCode]);

  const loginHref = `/login?next=${encodeURIComponent(joinNext)}`;
  const signupHref = `/login?tab=signup&next=${encodeURIComponent(joinNext)}`;

  useEffect(() => {
    let cancelled = false;
    const loadChurch = async () => {
      setLoadingChurch(true);
      setLoadError(null);
      setChurch(null);
      if (!codeNorm) {
        setLoadingChurch(false);
        return;
      }
      if (!supabase) {
        setLoadError("Gather is not configured.");
        setLoadingChurch(false);
        return;
      }
      const { data, error } = await supabase.from("churches").select("id, name, slug").eq("slug", codeNorm).maybeSingle();
      if (cancelled) return;
      if (error) {
        setLoadError("Could not look up that church code.");
        setLoadingChurch(false);
        return;
      }
      if (!data) {
        setLoadError(null);
        setChurch(null);
        setLoadingChurch(false);
        return;
      }
      setChurch(data as ChurchRow);
      setLoadingChurch(false);
    };
    void loadChurch();
    return () => {
      cancelled = true;
    };
  }, [codeNorm]);

  const refreshSession = useCallback(async () => {
    setSessionLoading(true);
    if (!supabase) {
      setSessionUserId(null);
      setProfile(null);
      setSessionLoading(false);
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setSessionUserId(uid);
    if (!uid) {
      setProfile(null);
      setSessionLoading(false);
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("church_id, role").eq("id", uid).maybeSingle();
    setProfile(prof ? { church_id: prof.church_id ?? null, role: prof.role ?? null } : null);
    setSessionLoading(false);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const handleJoin = async () => {
    if (!supabase || !church || !sessionUserId) return;
    setJoining(true);
    setJoinError(null);
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) {
      setJoinError("You are not signed in.");
      setJoining(false);
      return;
    }
    const fullName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      null;
    const email = user.email ?? null;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        church_id: church.id,
        full_name: fullName,
        email,
        role: "MEMBER",
        disabled: false,
      },
      { onConflict: "id" }
    );

    if (error) {
      setJoinError(error.message || "Could not join this church.");
      setJoining(false);
      return;
    }

    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = prof?.role ?? "MEMBER";
    const dest = destinationAfterSignIn({ role, nextPath: null });
    router.replace(dest);
  };

  const alreadyInThisChurch = !!(church && profile?.church_id === church.id);
  const needsSwitchConfirm = !!(church && profile?.church_id && profile.church_id !== church.id);

  if (!codeNorm) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Join a church</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          This page needs a link from your church. It should look like{" "}
          <code className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-xs">…/join?code=your-church-code</code>.
          Ask your leader for the invite link or QR code.
        </p>
        <Link href={loginHref} className="btn btn-outline-amber btn-sm mt-6 inline-flex">
          Sign in
        </Link>
      </main>
    );
  }

  if (loadingChurch || sessionLoading) {
    return (
      <main className="mx-auto flex min-h-[40vh] max-w-lg flex-col justify-center px-6 py-16">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-sm text-[var(--danger)]">{loadError}</p>
        <Link href={loginHref} className="btn btn-ghost btn-sm mt-4 inline-flex">
          Sign in
        </Link>
      </main>
    );
  }

  if (!church) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Church not found</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          We couldn&apos;t find a church with the code <strong>{rawCode}</strong>. Check the link for typos, or ask
          your leader for a new invite.
        </p>
        <Link href={loginHref} className="btn btn-outline-amber btn-sm mt-6 inline-flex">
          Sign in anyway
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">Gather</p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Join {church.name}</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Church code: <span className="font-mono font-medium text-[var(--text-primary)]">{church.slug}</span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        Create an account or sign in. Then confirm below to join this congregation on Gather.
      </p>

      {!sessionUserId ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={loginHref} className="btn btn-primary-gradient">
            Sign in
          </Link>
          <Link href={signupHref} className="btn btn-outline-amber">
            Create account
          </Link>
        </div>
      ) : alreadyInThisChurch ? (
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm text-[var(--text-secondary)]">You&apos;re already part of this church.</p>
          <Link
            href={destinationAfterSignIn({ role: profile?.role ?? "MEMBER", nextPath: null })}
            className="btn btn-primary-gradient mt-4 inline-flex"
          >
            Go to Gather
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {needsSwitchConfirm && !showSwitchConfirm ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-sm text-[var(--text-secondary)]">
                Your account is linked to another congregation. Joining here will move you to{" "}
                <strong>{church.name}</strong> as a member (you may lose admin access to your previous church).
              </p>
              <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => setShowSwitchConfirm(true)}>
                Continue
              </button>
            </div>
          ) : (
            <>
              {joinError ? <p className="text-sm text-[var(--danger)]">{joinError}</p> : null}
              <button type="button" className="btn btn-primary-gradient w-full sm:w-auto" disabled={joining} onClick={() => void handleJoin()}>
                {joining ? "Joining…" : "Join this church"}
              </button>
            </>
          )}
        </div>
      )}

    </main>
  );
}
