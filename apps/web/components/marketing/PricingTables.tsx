"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Minus } from "lucide-react";
import {
  ANNUAL_MONTHS_CHARGED,
  COMPARISON,
  PLANS,
  priceFor,
  type BillingCycle,
  type PlanKey,
} from "../../lib/marketing/plans";

export default function PricingTables() {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [pending, setPending] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (plan: PlanKey) => {
    setPending(plan);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "We couldn't start checkout. Please try again.");
        setPending(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("We couldn't reach the payment service. Please try again.");
      setPending(null);
    }
  };

  return (
    <>
      {/* Billing toggle */}
      <div className="flex flex-col items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Billing cycle"
          className="inline-flex rounded-xl border border-[var(--mk-line)] bg-white p-1"
        >
          {(["monthly", "annual"] as BillingCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150 ${
                cycle === c
                  ? "bg-[var(--mk-ink)] text-white"
                  : "text-[var(--mk-ink-soft)] hover:text-[var(--mk-ink)]"
              }`}
            >
              {c === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--mk-ink-faint)]">
          {cycle === "annual"
            ? "Billed yearly — two months free"
            : "Billed monthly — switch to yearly any time"}
        </p>
      </div>

      {/* Plan cards */}
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const price = priceFor(p, cycle);
          const isPending = pending === p.key;
          return (
            <div
              key={p.key}
              className={`flex h-full flex-col rounded-2xl border p-7 transition-all duration-200 ${
                p.featured
                  ? "border-[var(--mk-amber)] bg-white shadow-[0_16px_40px_-12px_rgba(180,83,9,0.18)]"
                  : "border-[var(--mk-line)] bg-white"
              }`}
            >
              {p.featured && (
                <span className="mb-4 w-fit rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--mk-amber-deep)]">
                  Most churches
                </span>
              )}
              <h3 className="text-lg font-medium text-[var(--mk-ink)]">{p.name}</h3>
              <p className="mt-1.5 text-sm text-[var(--mk-ink-faint)]">{p.memberCap}</p>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-light tracking-tight text-[var(--mk-ink)]">
                  ${price}
                </span>
                <span className="text-sm text-[var(--mk-ink-faint)]">/month</span>
              </p>
              <p className="mt-1.5 h-4 text-xs text-[var(--mk-ink-faint)]">
                {cycle === "annual"
                  ? `$${p.monthly * ANNUAL_MONTHS_CHARGED} billed yearly`
                  : " "}
              </p>

              <p className="mt-5 text-sm leading-relaxed text-[var(--mk-ink-soft)]">
                {p.tagline}
              </p>

              <button
                type="button"
                onClick={() => checkout(p.key)}
                disabled={isPending}
                className={`mt-7 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 disabled:opacity-60 ${
                  p.featured
                    ? "bg-[var(--mk-amber)] text-white hover:bg-[var(--mk-amber-deep)]"
                    : "border border-[var(--mk-line)] text-[var(--mk-ink)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Starting checkout…" : `Get ${p.name}`}
              </button>

              <Link
                href="/demo"
                className="mt-3 text-center text-xs text-[var(--mk-ink-faint)] transition-colors hover:text-[var(--mk-amber-deep)]"
              >
                or schedule a demo first
              </Link>

              <ul className="mt-8 list-none space-y-3 p-0">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mk-amber-deep)]" />
                    <span className="text-sm leading-relaxed text-[var(--mk-ink-soft)]">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="mx-auto mt-6 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Comparison table */}
      <div className="mt-28">
        <h2 className="mk-h3 text-center text-[var(--mk-ink)]">Compare every plan</h2>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr>
                <th className="w-[40%] pb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mk-ink-faint)]">
                  Feature
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.key}
                    className="pb-4 text-center text-sm font-medium text-[var(--mk-ink)]"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((group) => (
                <Fragment key={group.group}>
                  <tr>
                    <td
                      colSpan={4}
                      className="border-t border-[var(--mk-line)] pb-3 pt-8 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mk-amber-deep)]"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-[var(--mk-line)]">
                      <td className="py-3.5 text-sm text-[var(--mk-ink-soft)]">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="py-3.5 text-center">
                          {v === "Included" ? (
                            <Check className="mx-auto h-4 w-4 text-[var(--mk-amber-deep)]" />
                          ) : v === "—" ? (
                            <Minus className="mx-auto h-4 w-4 text-[var(--mk-ink-faint)] opacity-50" />
                          ) : (
                            <span className="text-sm text-[var(--mk-ink)]">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
