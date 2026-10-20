"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      await supabase?.auth.signOut();
      router.replace("/login");
    };
    signOut();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[var(--text-muted)]">Signing out...</p>
    </main>
  );
}
