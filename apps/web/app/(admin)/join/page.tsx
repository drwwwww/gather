"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@gather/lib";
import PageLoader from "../../../components/ui/PageLoader";
import { supabase } from "../../../lib/supabaseClient";

type ChurchRow = Database["public"]["Tables"]["churches"]["Row"];

type JoinInfo = {
  church: ChurchRow | null;
  qrUrl: string;
};

export default function JoinInstructionsPage() {
  const [info, setInfo] = useState<JoinInfo>({ church: null, qrUrl: "" });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        router.push("/login?next=/join");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id, role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.church_id || profile.role !== "ADMIN") {
        router.push("/admin");
        return;
      }

      const { data: church } = await supabase
        .from("churches")
        .select("id, name, slug")
        .eq("id", profile.church_id)
        .maybeSingle();

      const slug = church?.slug ?? "";
      const qrUrl = slug
        ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(slug)}`
        : "";

      setInfo({ church: church ?? null, qrUrl });
      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return <PageLoader message="Preparing print view..." />;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-primary/20 bg-[var(--surface)] p-8 shadow-sm print:border-none print:shadow-none">
        <h1 className="text-2xl font-semibold text-base-content">Join {info.church?.name ?? "Our Church"}</h1>
        <p className="mt-2 text-sm text-base-content/60">
          Open the Gather app, tap Join Church, and enter the code below.
        </p>

        <div className="mt-6 rounded-xl bg-[var(--surface-2)]/60 p-4 text-center text-2xl font-semibold tracking-wide">
          {info.church?.slug ?? ""}
        </div>

        {info.qrUrl ? (
          <div className="mt-6 flex items-center justify-center">
            <img src={info.qrUrl} alt="Join code QR" className="h-56 w-56" />
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between text-xs text-base-content/60 print:hidden">
          <span>Share this code with your members.</span>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>
    </main>
  );
}
