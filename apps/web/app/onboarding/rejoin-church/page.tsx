"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Shown when a signed-in user has a profile but no church (e.g. removed by an admin).
 * Members can rejoin using the public join link or code from their leader, or the Gather mobile app.
 */
export default function RejoinChurchPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!supabase) {
        setChecking(false);
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profile?.church_id) {
        router.replace("/admin");
        return;
      }
      if (!profile) {
        router.replace("/onboarding/create-church");
        return;
      }
      setChecking(false);
    };
    run();
  }, [router]);

  if (checking) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <p className="text-sm text-base-content/60">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-base-content">You are not in a church yet</h1>
        <p className="mt-3 text-sm leading-relaxed text-base-content/70">
          Your account is no longer linked to a congregation (for example, an admin may have removed you from the
          church list). If your leader sent you a join link or QR code, open it in your browser to join on the web. You
          can also open the <Link href="/join" className="link link-primary font-medium">join page</Link> and use your
          church code (for example <span className="font-mono">your-church-slug</span>) in the address bar as{" "}
          <span className="font-mono">/join?code=your-church-slug</span>.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-base-content/70">
          Alternatively, open the <strong>Gather</strong> mobile app, tap <strong>Join church</strong>, and enter your
          church&apos;s join code from your leader.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-base-content/70">
          If you are starting a new church on the web, you can create one instead.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/onboarding/create-church" className="btn btn-outline btn-sm">
          Create a church
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await supabase?.auth.signOut();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
