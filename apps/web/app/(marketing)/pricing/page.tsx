import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import MarketingNav from "../../../components/marketing/MarketingNav";
import FloatingMotifs from "../../../components/marketing/FloatingMotifs";
import { ScrollProgress } from "../../../components/marketing/Motion";
import PricingTables from "../../../components/marketing/PricingTables";
import FaqAccordion from "../../../components/marketing/FaqAccordion";
import Reveal from "../../../components/marketing/Reveal";
import { PRICING_FAQ } from "../../../lib/marketing/plans";

export const metadata: Metadata = {
  title: "Pricing — Gather",
  description:
    "Simple pricing for churches of every size. One monthly number, a 30-day trial, and no setup fees or per-seat maths.",
  openGraph: {
    title: "Pricing — Gather",
    description: "Simple pricing for churches of every size. 30-day trial, no card to start.",
    type: "website",
  },
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <ScrollProgress />
      <MarketingNav />

      <section className="relative overflow-hidden px-5 pb-8 pt-32 sm:px-8 sm:pt-40">
        <div className="mk-aurora">
          <span />
          <span />
          <span />
        </div>
        <FloatingMotifs tone="dark" />
        <div className="relative z-10 mx-auto max-w-[1180px] text-center">
          <Reveal>
            <p className="mk-eyebrow">Pricing</p>
            <h1 className="mk-display mx-auto mt-5 max-w-3xl text-[var(--mk-ink)]">
              Priced for churches, not enterprises.
            </h1>
            <p className="mk-lead mx-auto mt-7 max-w-xl">
              One number for your whole team. Every plan includes a 30-day trial, and
              you can pay today without ever talking to us.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-5 pb-28 sm:px-8">
        <div className="mx-auto max-w-[1180px]">
          <PricingTables />
        </div>
      </section>

      {/* Nonprofit note */}
      <section className="mk-rule bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
          <Reveal>
            <div className="rounded-2xl border border-[var(--mk-line)] bg-white p-8 sm:p-10">
              <h2 className="mk-h3 max-w-2xl text-[var(--mk-ink)]">
                Church plants and small congregations.
              </h2>
              <p className="mk-lead mt-5 max-w-2xl">
                If you&apos;re under two years old, under fifty people, or simply
                can&apos;t make the numbers work this year — write to us. We would rather
                you had the tool than the invoice.
              </p>
              <a
                href="mailto:support@gatherministry.online?subject=Church%20plant%20pricing"
                className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--mk-amber-deep)]"
              >
                Ask about reduced pricing
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-rule bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal>
              <p className="mk-eyebrow">Questions</p>
              <h2 className="mk-h2 mt-5 text-[var(--mk-ink)]">Before you pay.</h2>
              <p className="mk-lead mt-6">
                Anything we haven&apos;t covered?{" "}
                <a
                  href="mailto:support@gatherministry.online"
                  className="font-semibold text-[var(--mk-amber-deep)] hover:underline"
                >
                  Email us
                </a>{" "}
                — a person answers.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <FaqAccordion items={PRICING_FAQ} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mk-rule bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 text-center sm:px-8">
          <Reveal>
            <h2 className="mk-h2 mx-auto max-w-2xl text-[var(--mk-ink)]">
              Want to see it first?
            </h2>
            <p className="mk-lead mx-auto mt-6 max-w-lg">
              Thirty minutes with your own services on the screen. No slide deck.
            </p>
            <Link
              href="/demo"
              className="group mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--mk-amber)] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--mk-amber-deep)]"
            >
              Schedule a demo
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
