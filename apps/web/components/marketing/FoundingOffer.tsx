import { unstable_cache } from "next/cache";
import { Sparkles } from "lucide-react";
import { createSupabaseAdminClient } from "../../lib/supabaseAdmin";

/**
 * Founding-church offer: the first FOUNDING_SPOTS churches to start a paid plan
 * keep today's price for as long as their subscription stays active, plus a
 * free 1-on-1 setup session. The spots-left count is real (churches with a
 * Stripe subscription), refreshed every 10 minutes, and the strip disappears
 * once they're gone. Terms → Paid plans says the same.
 */
export const FOUNDING_SPOTS = 10;

const paidChurches = unstable_cache(
  async () => {
    try {
      const db = createSupabaseAdminClient() as any;
      const { count } = await db
        .from("churches")
        .select("id", { count: "exact", head: true })
        .not("stripe_subscription_id", "is", null);
      return count ?? 0;
    } catch {
      return null;
    }
  },
  ["founding-paid-churches"],
  { revalidate: 600 }
);

export default async function FoundingOffer({ className = "" }: { className?: string }) {
  const paid = await paidChurches();
  if (paid === null) return null;
  const left = FOUNDING_SPOTS - paid;
  if (left <= 0) return null;

  return (
    <div
      className={`flex flex-col items-start gap-3 rounded-2xl border border-[var(--mk-amber)] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mk-amber-deep)]" aria-hidden />
        <div>
          <p className="text-base font-semibold text-[var(--mk-ink)]">
            Founding churches keep today&apos;s price for life
          </p>
          <p className="mt-1 text-sm text-[var(--mk-ink-soft)]">
            The first {FOUNDING_SPOTS} churches to choose a plan never pay more than today&apos;s price for as long as
            they stay, and get a free 1-on-1 setup session with us.
          </p>
        </div>
      </div>
      <p className="shrink-0 rounded-full bg-[var(--primary-soft)] px-3.5 py-1.5 text-sm font-semibold tabular-nums text-[var(--mk-amber-deep)]">
        {left} of {FOUNDING_SPOTS} spots left
      </p>
    </div>
  );
}
