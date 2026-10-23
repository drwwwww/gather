"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Minus, ShieldCheck } from "lucide-react";
import {
  ANNUAL_MONTHS_CHARGED,
  COMPARISON,
  PLANS,
  priceFor,
  type BillingCycle,
  type PlanKey,
} from "../../lib/marketing/plans";
import { TESTIMONIALS } from "../../lib/marketing/testimonials";

/** "about 30¢ per member a month" — the same price, counted the way churches think about it. */
function perMember(p: (typeof PLANS)[number], price: number) {
  const cap = Number(p.memberCap.replace(/[^0-9]/g, ""));
  if (!cap) return null;
  const cents = Math.round((price / cap) * 100);
  return `About ${cents}¢ per member a month at ${cap} members`;
}

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
          className="inline-flex rounded-2xl border border-[var(--mk-line)] bg-white p-1.5 shadow-sm"
        >
          {(["monthly", "annual"] as BillingCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-150 ${
                cycle === c
                  ? "bg-[var(--mk-ink)] text-white"
                  : "text-[var(--mk-ink-soft)] hover:text-[var(--mk-ink)]"
              }`}
            >
              {c === "monthly" ? "Monthly" : "Yearly"}
              {c === "annual" ? (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cycle === c ? "bg-[var(--area-teal-mark)] text-white" : "bg-[var(--area-teal-tint)] text-[var(--area-teal-ink)]"}`}>
                  2 months free
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {cycle === "annual" ? (
          <p className="text-sm text-[var(--mk-ink-soft)]">
            Billed yearly · <span className="font-semibold text-[var(--area-teal-ink)]">save up to ${(PLANS[PLANS.length - 1].monthly * (12 - ANNUAL_MONTHS_CHARGED)).toLocaleString("en-US")} a year</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className="rounded-full bg-[var(--area-teal-tint)] px-4 py-1.5 text-sm font-semibold text-[var(--area-teal-ink)] transition-colors hover:bg-[var(--area-teal-mark)] hover:text-white"
          >
            Switch to yearly and save up to ${(PLANS[PLANS.length - 1].monthly * (12 - ANNUAL_MONTHS_CHARGED)).toLocaleString("en-US")} a year →
          </button>
        )}
        <p className="text-xs text-[var(--mk-ink-faint)]">Under 150 people? Parish. Growing, with several ministry teams? Congregation.</p>
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
                  Recommended
                </span>
              )}
              <h3 className="text-lg font-medium text-[var(--mk-ink)]">{p.name}</h3>
              <p className="mt-1.5 text-sm text-[var(--mk-ink-faint)]">{p.memberCap}</p>

              <p className="mt-6 flex items-baseline gap-2">
                {cycle === "annual" ? (
                  <span className="text-lg font-light text-[var(--mk-ink-faint)] line-through" aria-label={`was $${p.monthly}`}>
                    ${p.monthly}
                  </span>
                ) : null}
                <span className="text-4xl font-light tracking-tight text-[var(--mk-ink)]">
                  ${price}
                </span>
                <span className="text-sm text-[var(--mk-ink-faint)]">/month</span>
              </p>
              <p className="mt-1.5 min-h-4 text-xs text-[var(--mk-ink-faint)]">
                {cycle === "annual" ? (
                  <>
                    ${(p.monthly * ANNUAL_MONTHS_CHARGED).toLocaleString("en-US")} billed yearly ·{" "}
                    <span className="font-semibold text-[var(--area-teal-ink)]">save ${p.monthly * (12 - ANNUAL_MONTHS_CHARGED)} a year</span>
                  </>
                ) : (
                  `$${(p.monthly * 12).toLocaleString("en-US")} a year billed monthly`
                )}
              </p>
              {perMember(p, price) ? (
                <p className="mt-1 text-xs text-[var(--mk-ink-faint)]">{perMember(p, price)}</p>
              ) : null}

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
                {isPending ? "Starting checkout…" : "Start 14-day free trial"}
              </button>
              <p className="mt-2.5 text-center text-xs text-[var(--mk-ink-faint)]">
                No card needed · then ${price}/mo · 14-day money-back guarantee
              </p>

              <ul className="mt-8 list-none space-y-3 p-0">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--area-teal-mark)]" />
                    <span className="text-sm leading-relaxed text-[var(--mk-ink-soft)]">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Cheaper is possible: right under the plans, where the price objection happens. */}
      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-[var(--area-teal-tint)] bg-[var(--area-teal-tint)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-[var(--area-teal-ink)]">Church plant, student organization, under 50 people, or a tight budget this year?</p>
          <p className="mt-1 text-sm text-[var(--area-teal-ink)] opacity-90">
            We offer reduced pricing, and student organizations always get a discount. Tell us about your group and we&apos;ll find a number that works.
          </p>
        </div>
        <a
          href="mailto:support@gatherministry.online?subject=Reduced%20pricing%20for%20our%20church"
          className="shrink-0 rounded-xl bg-[var(--area-teal-ink)] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
        >
          Ask for reduced pricing
        </a>
      </div>

      {/* Trust right where the decision is made. */}
      {/* Risk reversal: the guarantee, said plainly, next to the price. */}
      <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[var(--mk-line)] bg-white px-6 py-5">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[var(--area-teal-mark)]" aria-hidden />
        <div>
          <p className="text-base font-semibold text-[var(--mk-ink)]">14-day money-back guarantee</p>
          <p className="mt-1 text-sm text-[var(--mk-ink-soft)]">
            Try everything free for 14 days. Then, if Gather isn&apos;t right for your church within 14 days of your
            first payment, email us and we&apos;ll refund it in full. No questions, no phone call.
          </p>
        </div>
      </div>

      <ul className="mt-6 flex list-none flex-wrap items-center justify-center gap-x-6 gap-y-2 p-0 text-xs text-[var(--mk-ink-soft)]">
        <li>No card to start</li>
        <li aria-hidden>·</li>
        <li>Cancel any time</li>
        <li aria-hidden>·</li>
        <li>Pay by card, ACH or check</li>
        <li aria-hidden>·</li>
        <li>Your data stays yours, export it any time</li>
      </ul>

      {/* Social proof next to the price. */}
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <figure key={t.name} className="m-0 rounded-2xl border border-[var(--mk-line)] bg-white p-6">
            <blockquote className="m-0 text-sm leading-relaxed text-[var(--mk-ink)]">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: `var(--area-${["blue", "plum", "olive"][i % 3]}-tint)`, color: `var(--area-${["blue", "plum", "olive"][i % 3]}-ink)` }}
              >
                {t.initials}
              </span>
              <span>
                <span className="block text-sm font-medium text-[var(--mk-ink)]">{t.name}</span>
                <span className="block text-xs text-[var(--mk-ink-faint)]">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
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
                      className="border-t border-[var(--mk-line)] pb-3 pt-8 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mk-ink-soft)]"
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
                            <Check className="mx-auto h-4 w-4 text-[var(--area-teal-mark)]" />
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
