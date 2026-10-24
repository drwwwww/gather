import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Download, Lock, MessageCircleHeart, ShieldCheck } from "lucide-react";

import MarketingNav from "../../components/marketing/MarketingNav";
import MediaBackdrop from "../../components/marketing/MediaBackdrop";
import Reveal from "../../components/marketing/Reveal";
import FaqAccordion from "../../components/marketing/FaqAccordion";
import FloatingMotifs from "../../components/marketing/FloatingMotifs";
import { CountUp, FadeUp, ScrollProgress, SpotlightCard, WordsReveal } from "../../components/marketing/Motion";
import ProductShowcase, { MockWindow } from "../../components/marketing/ProductShowcase";
import LandingBento from "../../components/marketing/LandingBento";
import WorkflowStrip from "../../components/marketing/WorkflowStrip";
import PersonBadge from "../../components/marketing/PersonBadge";
import { ANNUAL_MONTHS_CHARGED, PLANS, PRICING_FAQ } from "../../lib/marketing/plans";
import { TESTIMONIALS } from "../../lib/marketing/testimonials";
import FoundingOffer from "../../components/marketing/FoundingOffer";

// The founding-church spots count refreshes every 10 minutes.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Gather — Give your church its time back",
  description:
    "One calm workspace for volunteer scheduling, service planning, and member communication. Built for churches of 50–500, with a mobile app your congregation will actually use.",
  openGraph: {
    title: "Gather — Give your church its time back",
    description:
      "One calm workspace for volunteer scheduling, service planning, and member communication.",
    type: "website",
    images: ["/images/church-sky-cross.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gather — Give your church its time back",
    description:
      "One calm workspace for volunteer scheduling, service planning, and member communication.",
    images: ["/images/church-sky-cross.jpg"],
  },
  alternates: { canonical: "/" },
};

// Only jobs the product really does today.
const HANDLED = [
  { job: "Asking everyone if they're still coming", how: "Requests and reminders go out; people answer in one tap." },
  { job: "Finding a fill-in when someone's sick", how: "Their backup takes the spot and you get a heads-up." },
  { job: "Remembering who's away", how: "Volunteers mark away dates; Gather won't schedule them." },
  { job: "Noticing who's been asked too often", how: "Team Health flags who's stretched and who's resting." },
  { job: "Getting the news to the right people", how: "Choose who sees each post: everyone, teams or staff." },
  { job: "Keeping the run sheet in sync", how: "One plan with real times that the whole team reads from." },
];

const FEATURED = TESTIMONIALS[1];
const OTHER_QUOTES = [TESTIMONIALS[0], TESTIMONIALS[2]];

const TRUST = [
  { icon: ShieldCheck, title: "Private to your church", body: "Members only ever see your church. We never sell or share data." },
  { icon: Lock, title: "Encrypted, always", body: "In transit and at rest, with role-based access for staff and teams." },
  { icon: Download, title: "Your data is yours", body: "Import a spreadsheet in minutes. Export everything any time." },
  { icon: MessageCircleHeart, title: "A person answers", body: "Email us and the people who build Gather reply." },
];

const CHURCH_NAMES = [
  "Crossroads Community",
  "Grace Fellowship",
  "Rowan Springs Chapel",
  "New Hope Church",
  "Redeemer City",
];

export default function LandingPage() {
  return (
    <>
      <ScrollProgress />
      <MarketingNav overHero />

      {/* ── HERO — open sky, light treatment ───────────────────── */}
      <section className="mk-media relative flex min-h-[94vh] items-center">
        <MediaBackdrop
          poster="/images/church-sky-cross.jpg"
          videoSrc="/video/worship-hero.mp4"
          scrim="dawn"
          // The roofline sits low in the source frame and a wide hero leaves
          // almost no crop overflow to play with, so a little extra zoom buys
          // the room and the negative shift lifts the church up the frame.
          objectPosition="center 80%"
          zoom={1.22}
          shiftY={-7}
        />
        <div className="mk-aurora">
          <span />
          <span />
          <span />
        </div>
        <FloatingMotifs tone="dark" />

        <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-16 pt-32 sm:px-8">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--mk-line)] bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[var(--mk-ink-soft)] backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--area-teal-mark)] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--area-teal-mark)]" />
              </span>
              Church management software
            </span>
          </FadeUp>

          <h1 className="mk-display mt-7 max-w-4xl text-[var(--mk-ink)]">
            <WordsReveal text="Give your church" delay={0.1} />
            <br />
            <WordsReveal text="its time back." delay={0.32} />
          </h1>

          <FadeUp delay={0.55}>
            <p className="mk-lead mt-7 max-w-xl">
              Volunteer scheduling, service planning, and member communication in one
              calm workspace — so your team spends less of the week coordinating and
              more of it with people.
            </p>
          </FadeUp>

          <FadeUp delay={0.65}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth?tab=signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--mk-amber)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(180,83,9,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--mk-amber-deep)]"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--mk-line)] bg-white/70 px-6 py-3.5 text-sm font-semibold text-[var(--mk-ink)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                Book a demo
              </Link>
            </div>
          </FadeUp>

          <FadeUp delay={0.75}>
            <p className="mt-8 text-xs text-[var(--mk-ink-faint)]">
              14 days of everything, Gather AI included · No card to start · 14-day money-back guarantee
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {TESTIMONIALS.map((t, i) => (
                  <span
                    key={t.name}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white"
                    style={{ background: `var(--area-${["blue", "plum", "olive"][i % 3]}-tint)`, color: `var(--area-${["blue", "plum", "olive"][i % 3]}-ink)` }}
                    aria-hidden
                  >
                    {t.initials}
                  </span>
                ))}
              </div>
              <p className="max-w-xs text-xs leading-snug text-[var(--mk-ink-soft)]">
                &ldquo;It&apos;s twenty minutes now, and nobody is surprised the morning of.&rdquo; — {TESTIMONIALS[0].name}, {TESTIMONIALS[0].role.split(" · ")[0]}
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CHURCHES ───────────────────────────────────────────── */}
      <section className="border-y border-[var(--mk-line)] bg-[var(--mk-ground)] px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <span className="text-[13px] text-[var(--mk-ink-soft)]">Built with and for churches like</span>
          {CHURCH_NAMES.map((name) => (
            <span key={name} className="whitespace-nowrap text-[17px] font-semibold text-[var(--mk-ink-faint)]">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ── STATEMENT ──────────────────────────────────────────── */}
      <section className="bg-[var(--mk-ground)] px-5 pb-12 pt-24 sm:px-8 sm:pt-28">
        <FadeUp className="mx-auto max-w-[1180px]">
          <p className="max-w-[980px] text-[30px] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--mk-ink)] sm:text-[44px] sm:leading-[1.18]">
            Sunday, without the Saturday-night texts.{" "}
            <span className="text-[var(--mk-ink-faint)]">
              Your plan, your team and your news live in one place, so everyone shows up knowing their part and
              nobody chases anybody.
            </span>
          </p>
        </FadeUp>
      </section>

      {/* ── PRODUCT TOUR ───────────────────────────────────────── */}
      <section id="features" className="scroll-mt-24 bg-[var(--mk-ground)] px-5 pb-24 pt-6 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-[1180px]">
          <ProductShowcase />
        </div>
      </section>

      {/* ── HOW IT WORKS (Calendly-style strip) ─────────────────── */}
      <section id="how" className="scroll-mt-24 bg-[var(--mk-ground)] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-[1180px]">
          <FadeUp>
            <p className="mk-eyebrow">How it works</p>
            <h2 className="mk-h2 mt-4 max-w-[720px] text-[var(--mk-ink)]">From an empty Monday to a calm Sunday.</h2>
          </FadeUp>
          <WorkflowStrip />
        </div>
      </section>

      {/* ── WHY CHURCHES SWITCH ────────────────────────────────── */}
      <section id="why" className="scroll-mt-24 bg-[var(--mk-ground)] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-[1180px]">
          <FadeUp>
            <p className="mk-eyebrow">Why churches switch</p>
            <h2 className="mk-h2 mt-4 max-w-[720px] text-[var(--mk-ink)]">The small things that make Sunday morning calm.</h2>
          </FadeUp>
          <LandingBento />
        </div>
      </section>

      {/* ── HANDLED BY GATHER (Beside) ─────────────────────────── */}
      <section className="bg-[var(--mk-ground)] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <FadeUp>
            <p className="mk-eyebrow">The jobs nobody signed up for</p>
            <h2 className="mk-h2 mt-4 text-[var(--mk-ink)]">Gather does the chasing, so you don&apos;t have to.</h2>
            <p className="mk-lead mt-5 max-w-md">
              Every church has a list of small jobs that eat the week. These are the ones Gather takes off it.
            </p>
            <Link
              href="/auth?tab=signup"
              className="group mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--mk-ink)] underline-offset-4 hover:underline"
            >
              Hand them over, free for 14 days
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </FadeUp>
          <ul className="flex list-none flex-col gap-3 p-0">
            {HANDLED.map((h, i) => (
              <FadeUp key={h.job} delay={i * 0.04}>
                <li className="flex items-center gap-4 rounded-2xl border border-[var(--mk-line)] bg-white px-5 py-4 transition-colors hover:border-[#d9cfc1]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--area-teal-tint)]" aria-hidden>
                    <Check className="h-4 w-4 text-[var(--area-teal-ink)]" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[var(--mk-ink)]">{h.job}</span>
                    <span className="mt-0.5 block text-sm text-[var(--mk-ink-soft)]">{h.how}</span>
                  </span>
                  <span className="hidden shrink-0 rounded-full bg-[var(--area-teal-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--area-teal-ink)] sm:inline">
                    Handled by Gather
                  </span>
                </li>
              </FadeUp>
            ))}
          </ul>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="bg-[var(--mk-ground)] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-[1180px]">
          <FadeUp>
            <figure className="m-0 grid items-end gap-10 rounded-3xl border border-[var(--mk-line)] bg-white p-8 sm:p-14 lg:grid-cols-[2fr_1fr]">
              <div>
                <p className="mk-eyebrow mk-eyebrow-plum">{FEATURED.result}</p>
                <blockquote className="m-0 mt-4 text-[22px] font-medium leading-[1.4] tracking-[-0.01em] text-[var(--mk-ink)] sm:text-[30px] sm:leading-[1.35]">
                  &ldquo;{FEATURED.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="flex items-center gap-3.5">
                <PersonBadge t={FEATURED} size={64} area="plum" />
                <span>
                  <span className="block text-base font-semibold text-[var(--mk-ink)]">{FEATURED.name}</span>
                  <span className="block text-sm text-[var(--mk-ink-soft)]">{FEATURED.role.replace(" · ", ", ")}</span>
                </span>
              </figcaption>
            </figure>
          </FadeUp>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {OTHER_QUOTES.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.08}>
                <figure className="m-0 flex h-full flex-col rounded-[20px] border border-[var(--mk-line)] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(31,20,8,0.25)]">
                  <p className="text-xl font-semibold leading-snug tracking-[-0.01em] text-[var(--mk-ink)]">{t.result}</p>
                  <blockquote className="m-0 mt-3 text-base leading-relaxed text-[var(--mk-ink-soft)]">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 pt-6 text-sm text-[var(--mk-ink-soft)]">
                    <PersonBadge t={t} size={40} area={i === 0 ? "blue" : "olive"} />
                    <span>
                      <b className="block font-semibold text-[var(--mk-ink)]">{t.name}</b>
                      {t.role.replace(" · ", ", ")}
                    </span>
                  </figcaption>
                </figure>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ──────────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-24 bg-[var(--mk-ground)] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto grid max-w-[1180px] gap-7 border-y border-[var(--mk-line)] py-9 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title}>
                <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--mk-ink)]">
                  <Icon className="h-4 w-4 text-[var(--area-teal-mark)]" aria-hidden />
                  {t.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--mk-ink-soft)]">{t.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PRICING PREVIEW ────────────────────────────────────── */}
      <section id="pricing" className="mk-rule relative scroll-mt-20 overflow-hidden bg-[var(--mk-ground)]">
        <div className="mk-grid-lines" />
        <div className="relative mx-auto max-w-[1180px] px-5 py-24 sm:px-8 sm:py-32">
          <FadeUp>
            <p className="mk-eyebrow">Pricing</p>
            <h2 className="mk-h2 mt-5 max-w-2xl text-[var(--mk-ink)]">
              Priced for churches, not enterprises.
            </h2>
            <p className="mk-lead mt-6 max-w-xl">
              One number, billed monthly or yearly. No per-seat maths, no setup fee, and
              no sales call unless you want one.
            </p>
          </FadeUp>

          <FoundingOffer className="mt-10" />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <FadeUp key={p.key} delay={i * 0.08}>
                <SpotlightCard
                  className={`h-full rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 ${
                    p.featured
                      ? "border-[var(--mk-amber)] bg-white shadow-[0_16px_40px_-12px_rgba(180,83,9,0.18)]"
                      : "border-[var(--mk-line)] bg-white"
                  }`}
                >
                  <div className="flex h-full flex-col p-7">
                    {p.featured && (
                      <span className="mb-4 w-fit rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--mk-amber-deep)]">
                        Recommended
                      </span>
                    )}
                    <h3 className="text-lg font-medium text-[var(--mk-ink)]">{p.name}</h3>
                    <p className="mt-1.5 text-sm text-[var(--mk-ink-faint)]">{p.memberCap}</p>
                    <p className="mt-6 flex items-baseline gap-2">
                      <span className="text-lg font-light text-[var(--mk-ink-faint)] line-through" aria-label={`was $${p.monthly}`}>
                        ${p.monthly}
                      </span>
                      <span className="text-4xl font-light tracking-tight text-[var(--mk-ink)]">
                        <CountUp to={p.annual} prefix="$" />
                      </span>
                      <span className="text-sm text-[var(--mk-ink-faint)]">/month</span>
                    </p>
                    <p className="mt-1.5 text-xs text-[var(--mk-ink-faint)]">
                      Billed yearly ·{" "}
                      <span className="font-semibold text-[var(--area-teal-ink)]">save ${p.monthly * (12 - ANNUAL_MONTHS_CHARGED)} a year</span>
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--mk-ink-soft)]">
                      {p.tagline}
                    </p>
                    <Link
                      href="/pricing"
                      className={`mt-7 rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
                        p.featured
                          ? "bg-[var(--mk-amber)] text-white hover:bg-[var(--mk-amber-deep)]"
                          : "border border-[var(--mk-line)] text-[var(--mk-ink)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      Choose {p.name}
                    </Link>
                  </div>
                </SpotlightCard>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <p className="mt-8 text-center text-sm text-[var(--mk-ink-soft)]">
              Start with 14 days of everything, no card needed, and a 14-day money-back guarantee after that. Student organizations get a discount.{" "}
              <Link href="/pricing" className="font-semibold text-[var(--mk-ink)] underline-offset-4 hover:underline">
                Compare plans in full →
              </Link>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="mk-rule scroll-mt-20 bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <FadeUp>
              <p className="mk-eyebrow">Questions</p>
              <h2 className="mk-h2 mt-5 text-[var(--mk-ink)]">Before you ask.</h2>
              <p className="mk-lead mt-6">
                Still wondering something?{" "}
                <a
                  href="mailto:support@gatherministry.online"
                  className="font-semibold text-[var(--mk-ink)] underline underline-offset-4"
                >
                  Email us
                </a>{" "}
                — a person answers.
              </p>
            </FadeUp>
            <Reveal delay={0.1}>
              <FaqAccordion items={PRICING_FAQ} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section className="bg-[var(--mk-ground)] px-5 pb-24 sm:px-8 sm:pb-32">
        <FadeUp className="mx-auto grid max-w-[1180px] items-center gap-12 rounded-[28px] bg-[#FFF4DC] px-7 py-14 sm:px-14 sm:py-[72px] lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--mk-ink)] sm:text-[44px]">Plan this Sunday in Gather.</h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-[var(--mk-ink-soft)]">
              Most churches set up in an afternoon. Import your people from a spreadsheet, add your service times, and
              send your first schedule today.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth?tab=signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--mk-amber)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(180,83,9,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--mk-amber-deep)]"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--mk-line)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--mk-ink)] transition-all duration-200 hover:-translate-y-0.5"
              >
                Book a demo
              </Link>
            </div>
            <p className="mt-3.5 text-[13px] text-[var(--mk-ink-soft)]">14 days free · No card to start · 14-day money-back guarantee</p>
          </div>
          <div className="rotate-[1.5deg]" aria-hidden>
            <MockWindow label="Service plans">
              <div className="flex flex-col gap-3 px-5 py-4">
                <p className="flex justify-between text-sm">
                  <span className="font-semibold text-[var(--mk-ink)]">Sunday Morning</span>
                  <span className="font-semibold text-[#15803d]">All set</span>
                </p>
                <span className="h-2 rounded-full bg-[#16a34a]" />
                <p className="text-[13px] text-[var(--mk-ink-soft)]">12 of 12 confirmed · reminders sent</p>
              </div>
            </MockWindow>
          </div>
        </FadeUp>
      </section>
    </>
  );
}
