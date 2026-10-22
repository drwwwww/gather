import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  Smartphone,
  ShieldCheck,
  Lock,
  Server,
  Download,
  KeyRound,
  Eye,
} from "lucide-react";

import MarketingNav from "../../components/marketing/MarketingNav";
import MediaBackdrop from "../../components/marketing/MediaBackdrop";
import Reveal from "../../components/marketing/Reveal";
import FaqAccordion from "../../components/marketing/FaqAccordion";
import FloatingMotifs from "../../components/marketing/FloatingMotifs";
import {
  CountUp,
  FadeUp,
  Parallax,
  ScrollProgress,
  SpotlightCard,
  WordsReveal,
} from "../../components/marketing/Motion";
import { PLANS, PRICING_FAQ } from "../../lib/marketing/plans";

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

const STATS = [
  { to: 6, suffix: " hrs", label: "saved on a typical service prep week" },
  { to: 3, suffix: " min", label: "to build a full service plan from a preset" },
  { to: 1, suffix: " place", label: "instead of spreadsheets, texts, and email" },
];

const FEATURES = [
  {
    id: "volunteers",
    icon: CalendarCheck,
    eyebrow: "Volunteer scheduling",
    title: "Scheduling that finishes itself.",
    body:
      "Set the roles a service needs, assign the people you have, and let Gather handle the asking. Volunteers confirm from their phone, backups step in automatically when someone declines, and you stop chasing replies on a Saturday night.",
    chips: ["Confirm from the app", "Automatic backups", "No more group texts", "Gaps visible at a glance"],
    image: "/images/congregation-hands.jpg",
  },
  {
    id: "services",
    icon: ClipboardList,
    eyebrow: "Service planning",
    title: "A run of show everyone can see.",
    body:
      "Build the order of service once, save it as a template, and reuse it every week. Timing, roles, and notes live in one document your worship leader, tech team, and pastor are all reading from.",
    chips: ["Reusable presets", "Live run times", "Printable run sheets", "One source of truth"],
    image: "/images/modern-sanctuary.jpg",
  },
  {
    id: "communication",
    icon: Megaphone,
    eyebrow: "Announcements & events",
    title: "Reach the right people, not everyone.",
    body:
      "Write once and choose who hears it — the whole church, just your serving teams, or a single ministry. Events carry RSVPs, so you know who is coming before you order the food.",
    chips: ["Audience targeting", "Scheduled publishing", "Event RSVPs", "Email and in-app"],
    image: "/images/church-window-sunset.jpg",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Bring your people in",
    body:
      "Invite your staff and volunteers by email, or share a join code your congregation can use from the app. Roles and permissions are set as they arrive.",
  },
  {
    n: "02",
    title: "Set your services",
    body:
      "Tell Gather when you gather and what each service needs. Build a template once and every following week starts from it instead of a blank page.",
  },
  {
    n: "03",
    title: "Let the week run",
    body:
      "Assignments go out, confirmations come back, and announcements reach the people they're meant for. You watch the gaps close instead of making the calls.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Our worship director used to spend two hours every week on scheduling. It's twenty minutes now, and nobody is surprised the morning of.",
    name: "Michael Kim",
    role: "Lead Pastor · Crossroads Community Church",
    initials: "MK",
  },
  {
    quote:
      "The volunteers actually confirm. That sounds small until you've spent five years texting eleven people every Saturday to ask if they're still coming.",
    name: "Rachel Adeyemi",
    role: "Children's Director · Grace Fellowship",
    initials: "RA",
  },
  {
    quote:
      "I'm not technical and I didn't need to be. I opened it, understood it, and had our first service plan built before lunch.",
    name: "Tom Barrett",
    role: "Church Administrator · Rowan Springs Chapel",
    initials: "TB",
  },
];

const TRUST = [
  { icon: Lock, text: "Encrypted in transit and at rest" },
  { icon: KeyRound, text: "Role-based access for staff, teams, and members" },
  { icon: Eye, text: "We never sell or share your congregation's data" },
  { icon: Server, text: "Continuous backups with point-in-time recovery" },
  { icon: ShieldCheck, text: "Row-level security so churches stay fully separate" },
  { icon: Download, text: "Export your data any time you want it" },
];

const CHURCH_NAMES = [
  "Crossroads Community",
  "Grace Fellowship",
  "Rowan Springs Chapel",
  "New Hope Church",
  "Cornerstone Bible",
  "Redeemer City",
  "Living Water",
  "The Table",
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
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
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
                href="/demo"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--mk-amber)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(180,83,9,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--mk-amber-deep)]"
              >
                Schedule a demo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--mk-line)] bg-white/70 px-6 py-3.5 text-sm font-semibold text-[var(--mk-ink)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                See pricing
              </Link>
            </div>
          </FadeUp>

          <FadeUp delay={0.75}>
            <p className="mt-8 text-xs text-[var(--mk-ink-faint)]">
              30-day trial · No card to start · Cancel in one click
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── TRUST STRIP ────────────────────────────────────────── */}
      <section className="mk-rule border-t-0 bg-[var(--mk-ground)] py-10">
        <p className="mb-7 text-center text-xs uppercase tracking-[0.16em] text-[var(--mk-ink-faint)]">
          Built with and for churches like these
        </p>
        <div className="mk-marquee relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
            style={{ background: "linear-gradient(90deg, var(--mk-ground), transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
            style={{ background: "linear-gradient(270deg, var(--mk-ground), transparent)" }}
          />
          <div className="mk-marquee-track gap-14 px-7">
            {[...CHURCH_NAMES, ...CHURCH_NAMES].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="whitespace-nowrap text-lg font-light tracking-tight text-[var(--mk-ink-faint)]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ─────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mk-grid-lines" />
        <div className="relative mx-auto max-w-[1180px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-14 md:grid-cols-2 md:gap-20">
            <FadeUp>
              <p className="mk-eyebrow">The problem</p>
              <h2 className="mk-h3 mt-5 text-[var(--mk-ink)]">
                Every service gets coordinated across spreadsheets, group texts, and
                email threads. Nothing agrees, and the follow-up lands on one person.
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mk-eyebrow">The solution</p>
              <h2 className="mk-h3 mt-5 text-[var(--mk-ink)]">
                Gather holds the whole week in one place — who is serving, what the
                service looks like, and what your church has been told.
              </h2>
            </FadeUp>
          </div>

          <div className="mk-rule mt-20 grid gap-10 pt-14 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.08}>
                <p className="text-4xl font-light tracking-tight text-[var(--mk-ink)] sm:text-5xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-[var(--mk-ink-soft)]">
                  {s.label}
                </p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY GATHER ─────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <FadeUp>
            <p className="mk-eyebrow">Why Gather</p>
            <h2 className="mk-h2 mt-5 max-w-3xl text-[var(--mk-ink)]">
              One workspace, working together.
            </h2>
            <p className="mk-lead mt-6 max-w-xl">
              Each part of Gather knows about the others. Schedule someone and they see
              it on their phone. Change the service and the team sees it too.
            </p>
          </FadeUp>
        </div>

        {FEATURES.map((f, idx) => {
          const Icon = f.icon;
          const flip = idx % 2 === 1;
          return (
            <div key={f.id} className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
              <div
                className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${
                  flip ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <FadeUp>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
                    <Icon className="h-5 w-5 text-[var(--mk-amber-deep)]" />
                  </div>
                  <p className="mk-eyebrow mt-6">{f.eyebrow}</p>
                  <h3 className="mk-h3 mt-4 text-[var(--mk-ink)]">{f.title}</h3>
                  <p className="mk-lead mt-5">{f.body}</p>

                  <ul className="mt-9 grid list-none grid-cols-2 gap-x-8 gap-y-4 p-0">
                    {f.chips.map((c) => (
                      <li key={c} className="mk-chip">
                        {c}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/#how"
                    className="group mt-9 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--mk-amber-deep)]"
                  >
                    See how it works
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </FadeUp>

                <FadeUp delay={0.1}>
                  <Parallax distance={26}>
                    <div className="mk-media relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(60,45,30,0.35)]">
                      <MediaBackdrop poster={f.image} scrim="soft" />
                    </div>
                  </Parallax>
                </FadeUp>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── HOW IT WORKS — dark band ───────────────────────────── */}
      <section id="how" className="mk-media relative scroll-mt-20 overflow-hidden py-28 sm:py-36">
        <MediaBackdrop poster="/images/steeple-clouds.jpg" videoSrc="/video/worship-wide.mp4" scrim="deep" />
        <div className="mk-rays">
          <span />
          <span />
          <span />
        </div>
        <FloatingMotifs tone="light" />

        <div className="relative z-10 mx-auto max-w-[1180px] px-5 sm:px-8">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/90">
              How it works
            </p>
            <h2 className="mk-h2 mt-5 max-w-2xl text-white">
              Set up in an afternoon. Running by your next service.
            </h2>
          </FadeUp>

          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <FadeUp key={s.n} delay={i * 0.12}>
                <div className="group border-t border-white/20 pt-6 transition-colors duration-300 hover:border-amber-300/60">
                  <span className="text-xs font-semibold tracking-[0.2em] text-amber-300/80">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-xl font-light tracking-tight text-white">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{s.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE ─────────────────────────────────────────────── */}
      <section id="mobile" className="scroll-mt-20 bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <FadeUp>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
                <Smartphone className="h-5 w-5 text-[var(--mk-amber-deep)]" />
              </div>
              <p className="mk-eyebrow mt-6">For your congregation</p>
              <h2 className="mk-h2 mt-4 text-[var(--mk-ink)]">
                The part your church actually holds.
              </h2>
              <p className="mk-lead mt-6">
                Members get a warm, simple app — this week&apos;s announcements, upcoming
                events they can RSVP to, and a single tap to confirm they&apos;re serving.
                No training, no manual, no login they&apos;ll forget.
              </p>
              <ul className="mt-9 grid list-none grid-cols-2 gap-x-8 gap-y-4 p-0">
                {["Confirm assignments", "RSVP to events", "Read announcements", "See the service plan"].map((c) => (
                  <li key={c} className="mk-chip">
                    {c}
                  </li>
                ))}
              </ul>
            </FadeUp>

            <FadeUp delay={0.1}>
              <Parallax distance={30}>
                <div className="mk-media relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(60,45,30,0.35)]">
                  <MediaBackdrop poster="/images/praying-woman.jpg" scrim="soft" />
                </div>
              </Parallax>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="mk-rule bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 sm:py-32">
          <FadeUp>
            <h2 className="mk-h2 max-w-2xl text-[var(--mk-ink)]">
              Our product speaks for itself.
            </h2>
          </FadeUp>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.1}>
                <SpotlightCard className="h-full rounded-2xl border border-[var(--mk-line)] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_-18px_rgba(60,45,30,0.22)]">
                  <figure className="flex h-full flex-col justify-between p-7">
                    <blockquote className="text-base font-light leading-relaxed text-[var(--mk-ink)]">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-8 flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--mk-amber-deep)]">
                        {t.initials}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-[var(--mk-ink)]">{t.name}</span>
                        <span className="block text-xs text-[var(--mk-ink-faint)]">{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                </SpotlightCard>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST / STANDARDS ──────────────────────────────────── */}
      <section id="about" className="mk-rule scroll-mt-20 bg-[var(--mk-ground)]">
        <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <FadeUp>
              <p className="mk-eyebrow">Care and standards</p>
              <h2 className="mk-h2 mt-5 text-[var(--mk-ink)]">
                Your congregation&apos;s data, treated like it matters.
              </h2>
              <p className="mk-lead mt-6">
                A church directory holds real names, real families, and real trust. We
                build like that&apos;s true, because it is.
              </p>
              <div className="mk-media relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl">
                <MediaBackdrop poster="/images/sanctuary-doorway-light.jpg" scrim="soft" />
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <ul className="grid list-none gap-x-10 gap-y-5 p-0 sm:grid-cols-2">
                {TRUST.map((t) => {
                  const Icon = t.icon;
                  return (
                    <li key={t.text} className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mk-amber-deep)]" />
                      <span className="text-sm leading-relaxed text-[var(--mk-ink-soft)]">
                        {t.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </FadeUp>
          </div>
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
                        Most churches
                      </span>
                    )}
                    <h3 className="text-lg font-medium text-[var(--mk-ink)]">{p.name}</h3>
                    <p className="mt-1.5 text-sm text-[var(--mk-ink-faint)]">{p.memberCap}</p>
                    <p className="mt-6 flex items-baseline gap-1.5">
                      <span className="text-4xl font-light tracking-tight text-[var(--mk-ink)]">
                        <CountUp to={p.monthly} prefix="$" />
                      </span>
                      <span className="text-sm text-[var(--mk-ink-faint)]">/month</span>
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
              Every plan includes a 30-day trial.{" "}
              <Link href="/pricing" className="font-semibold text-[var(--mk-amber-deep)] hover:underline">
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
                  className="font-semibold text-[var(--mk-amber-deep)] hover:underline"
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

      {/* ── FINAL CTA — dark band ──────────────────────────────── */}
      <section className="mk-media relative overflow-hidden py-32 sm:py-40">
        <MediaBackdrop poster="/images/worship-hands-raised.jpg" videoSrc="/video/worship-close.mp4" scrim="deep" />
        <FloatingMotifs tone="light" />
        <div className="relative z-10 mx-auto max-w-[1180px] px-5 text-center sm:px-8">
          <FadeUp>
            <h2 className="mk-h2 mx-auto max-w-3xl text-white">
              Less time on the admin. More time with your people.
            </h2>
            <p className="mk-lead mx-auto mt-7 max-w-lg text-white/70">
              See Gather with your own services and your own team on the call. Thirty
              minutes, no pressure, no slide deck.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--mk-amber)] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--mk-amber-deep)]"
              >
                Schedule a demo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
              >
                Start free trial
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
