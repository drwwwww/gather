"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MemberShell from "../../components/member/MemberShell";
import { MemberPortalProvider, type MemberPortalValue } from "../../components/member/MemberPortalContext";
import { getCurrentContext } from "../../lib/supabaseData";
import PageLoader from "../../components/ui/PageLoader";

export default function MemberLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState<
    { kind: "ok"; churchName: string; displayName: string; portal: MemberPortalValue } | { kind: "loading" }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const context = await getCurrentContext();
      if (cancelled) return;
      if (!context) {
        router.replace("/login?next=/member");
        return;
      }
      if (!context.profile.church_id) {
        router.replace("/onboarding/rejoin-church");
        return;
      }
      if (context.profile.role === "ADMIN") {
        router.replace("/admin");
        return;
      }
      const displayName =
        context.profile.full_name?.trim() || context.profile.email?.trim() || "Member";
      setReady({
        kind: "ok",
        churchName: context.church.name,
        displayName,
        portal: {
          userId: context.userId,
          churchId: context.profile.church_id,
          role: context.profile.role,
          serviceTimes: context.serviceTimes
        }
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (ready.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]">
        <PageLoader />
      </div>
    );
  }

  if (ready.kind !== "ok") {
    return null;
  }

  return (
    <MemberPortalProvider value={ready.portal}>
      <MemberShell churchName={ready.churchName} displayName={ready.displayName}>
        {children}
      </MemberShell>
    </MemberPortalProvider>
  );
}
