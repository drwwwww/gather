"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { PLANS, priceFor, type BillingCycle } from "../../lib/marketing/plans";
import { PLAN_LABEL, trialDaysLeft, useChurchPlan } from "../../lib/plan";
import { AiBadge } from "../ai/AiBrand";

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700" },
  trialing: { label: "Trial", cls: "bg-amber-50 text-amber-800" },
  past_due: { label: "Payment due", cls: "bg-red-50 text-red-700" },
  canceled: { label: "Canceled", cls: "bg-[var(--surface-2)] text-[var(--text-secondary)]" },
  unpaid: { label: "Unpaid", cls: "bg-red-50 text-red-700" },
};

export default function PlanCard() {
  const { billing, access, loading } = useChurchPlan();
  // Yearly is the default: it is the better deal and most churches budget annually.
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [busy, setBusy] = useState<string | null>(null);
  // Card / bank account through Stripe Checkout, or an emailed invoice paid by ACH, bank transfer or check.
  const [payBy, setPayBy] = useState<"checkout" | "invoice">("checkout");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("billing");
    if (q === "success") setMessage({ tone: "ok", text: "Thank you. Your plan updates here within a minute." });
    if (q === "cancelled") setMessage({ tone: "error", text: "Checkout was cancelled — nothing changed." });
  }, []);

  const go = async (path: string, body?: object, key = path) => {
    setBusy(key);
    setMessage(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) {
      window.location.href = json.url;
      return;
    }
    if (res.ok && json.ok) {
      setBusy(null);
      setMessage({ tone: "ok", text: json.message ?? "Done. Your invoice is on its way by email." });
      return;
    }
    setBusy(null);
    setMessage({ tone: "error", text: json.error ?? "Billing isn't available right now." });
  };

  const status =
    access === "expired"
      ? { label: "Trial ended", cls: "bg-[var(--surface-2)] text-[var(--text-secondary)]" }
      : billing
        ? STATUS[billing.planStatus] ?? { label: billing.planStatus, cls: "bg-[var(--surface-2)] text-[var(--text-secondary)]" }
        : null;
  const daysLeft = trialDaysLeft(billing?.trialEndsAt ?? null);
  const subscribed = !!billing?.hasSubscription;

  return (
    <div id="plan" className="scroll-mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Subscription</h2>
          {loading ? (
            <div className="mt-2 h-6 w-40 animate-pulse rounded-md bg-[var(--surface-2)]" />
          ) : billing ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-[var(--text-primary)]">{PLAN_LABEL[billing.plan]}</span>
              {status && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}>{status.label}</span>}
              {billing.plan !== "parish" && <AiBadge label="AI included" />}
            </div>
          ) : null}
          {access === "trial" && billing?.trialEndsAt ? (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {daysLeft} {daysLeft === 1 ? "day" : "days"} left · trial ends{" "}
              {new Date(billing.trialEndsAt).toLocaleDateString([], { month: "long", day: "numeric" })}
            </p>
          ) : access === "expired" ? (
            <p className="mt-0.5 text-xs font-medium text-red-700">Gather is read-only until you choose a plan. Everything you set up is still here.</p>
          ) : null}
          {billing?.renewsAt && billing.hasSubscription && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {billing.planStatus === "trialing" ? "Trial ends" : "Renews"}{" "}
              {new Date(billing.renewsAt).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        {billing?.hasStripeCustomer && (
          <button
            type="button"
            onClick={() => go("/api/billing/portal")}
            disabled={!!busy}
            className="btn btn-secondary inline-flex h-9 items-center gap-1.5 px-3 text-sm"
          >
            {busy === "/api/billing/portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Manage billing
            <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
          </button>
        )}
      </div>

      {!subscribed && !loading && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">
              {access === "trial"
                ? "Pick a plan now and nothing is charged until your trial ends — and nothing goes read-only."
                : access === "paid"
                  ? "Set up billing for your plan. Change or cancel any time."
                  : "Pick a plan to unlock editing again. Change or cancel any time."}
            </p>
            <div role="tablist" aria-label="Billing cycle" className="flex rounded-lg bg-[var(--surface-2)] p-0.5 text-xs">
              {(["monthly", "annual"] as const).map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cycle === c}
                  onClick={() => setCycle(c)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${cycle === c ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                >
                  {c === "monthly" ? "Monthly" : "Yearly · 2 months free"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {PLANS.map((p) => {
              const current = billing?.plan === p.key;
              return (
                <div key={p.key} className={`flex flex-col rounded-xl border p-3 transition hover:-translate-y-0.5 ${current ? "border-amber-300 bg-amber-50/40" : "border-[var(--border)]"}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                    {p.key !== "parish" && <AiBadge />}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{p.memberCap}</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                    ${priceFor(p, cycle)}<span className="text-xs font-normal text-[var(--text-muted)]">/mo</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => go(payBy === "invoice" ? "/api/billing/invoice" : "/api/checkout", { plan: p.key, cycle }, p.key)}
                    disabled={!!busy}
                    className={`mt-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${p.featured ? "btn btn-primary btn-sm" : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"}`}
                  >
                    {busy === p.key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {payBy === "invoice" ? `Invoice me for ${p.name}` : current ? "Start subscription" : `Choose ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2">
            <p className="text-xs text-[var(--text-secondary)]">
              {payBy === "invoice"
                ? "We'll email an invoice due in 30 days. Pay it online by card or bank account, by bank transfer, or by check."
                : "Pay by card or US bank account (ACH). Prefer an invoice for your finance team?"}
            </p>
            <button
              type="button"
              onClick={() => setPayBy((v) => (v === "invoice" ? "checkout" : "invoice"))}
              className="text-xs font-semibold text-[var(--text-primary)] underline-offset-2 transition-colors hover:underline"
            >
              {payBy === "invoice" ? "Pay online now instead" : "Pay by invoice (ACH or check)"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className={`mt-3 text-xs ${message.tone === "ok" ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>
      )}
    </div>
  );
}
