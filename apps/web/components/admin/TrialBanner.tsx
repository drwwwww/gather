"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { trialDaysLeft, useChurchPlan } from "../../lib/plan";

const SEEN_KEY = "gather:trial-ended-seen";

/**
 * Trial pressure, on purpose (owner: be aggressive at launch). During the trial
 * an amber countdown sits above every admin page and says what will be lost —
 * Gather goes read-only when it ends (migration 0054). Once it has ended, a red
 * bar stays put and a dialog opens once per session. Hidden on Account, where
 * the plan card is the next step.
 */
export default function TrialBanner() {
  const { billing, access } = useChurchPlan();
  const pathname = usePathname() ?? "";
  const [dialog, setDialog] = useState(false);
  const locked = access === "expired" || access === "lapsed";

  useEffect(() => {
    if (!locked || pathname.startsWith("/account")) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: show it anyway */
    }
    setDialog(true);
  }, [locked, pathname]);

  if (!billing || pathname.startsWith("/account")) return null;
  if (access !== "trial" && !locked) return null;

  const days = trialDaysLeft(billing.trialEndsAt);

  if (access === "trial") {
    return (
      <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
        <span>
          <strong className="font-semibold">
            {days <= 1 ? "Your trial ends today." : `${days} days left in your trial.`}
          </strong>{" "}
          When it ends, Gather goes read-only — no new plans, posts or schedules until you choose a plan.
        </span>
        <Link href="/account#plan" className="rounded-lg bg-amber-500 px-2.5 py-1 font-semibold text-white transition-colors hover:bg-amber-600">
          Keep everything running
        </Link>
      </div>
    );
  }

  return (
    <>
      <div role="alert" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-800">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        <span>
          <strong className="font-semibold">{access === "expired" ? "Your trial has ended." : "Your subscription isn't active."}</strong> Gather is
          read-only: you can look, but nothing can be added or changed.
        </span>
        <Link href="/account#plan" className="rounded-lg bg-red-600 px-2.5 py-1 font-semibold text-white transition-colors hover:bg-red-700">
          Choose a plan
        </Link>
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="trial-ended-title">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <Lock className="h-5 w-5 text-red-600" aria-hidden />
            </span>
            <h2 id="trial-ended-title" className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
              {access === "expired" ? "Your free trial has ended" : "Your subscription isn't active"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Your schedules, plans, people and posts are all still here, but Gather is now read-only. Your volunteers
              can still answer, and your members can still see everything — you just can&apos;t add or change anything
              until you choose a plan. It takes about a minute.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <Link href="/account#plan" onClick={() => setDialog(false)} className="btn btn-primary h-10 flex-1 justify-center">
                Choose a plan
              </Link>
              <button type="button" onClick={() => setDialog(false)} className="btn btn-ghost h-10 flex-1 justify-center">
                Look around read-only
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
