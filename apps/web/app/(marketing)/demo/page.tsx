import type { Metadata } from "next";
import { Clock, MonitorPlay, MessageSquareHeart } from "lucide-react";

import MarketingNav from "../../../components/marketing/MarketingNav";
import FloatingMotifs from "../../../components/marketing/FloatingMotifs";
import { ScrollProgress } from "../../../components/marketing/Motion";
import DemoForm from "../../../components/marketing/DemoForm";
import Reveal from "../../../components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Schedule a demo — Gather",
  description:
    "Thirty minutes with your own services on the screen. See how Gather handles volunteer scheduling, service planning, and member communication for your church.",
  openGraph: {
    title: "Schedule a demo — Gather",
    description: "Thirty minutes, your own services on the screen, no slide deck.",
    type: "website",
  },
  alternates: { canonical: "/demo" },
};

const POINTS = [
  {
    icon: Clock,
    area: "teal",
    title: "Thirty minutes",
    body: "Long enough to see everything that matters, short enough to fit a Tuesday.",
  },
  {
    icon: MonitorPlay,
    area: "blue",
    title: "Your services, not a sandbox",
    body: "We set up your actual service times and roles first, so you're looking at your own service.",
  },
  {
    icon: MessageSquareHeart,
    area: "clay",
    title: "No slide deck, no pressure",
    body: "A working session with a real person. If Gather isn't right for you, we'll say so.",
  },
];

export default function DemoPage() {
  return (
    <>
      <ScrollProgress />
      <MarketingNav />

      <section className="relative overflow-hidden px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="mk-aurora">
          <span />
          <span />
          <span />
        </div>
        <FloatingMotifs tone="dark" />
        <div className="relative z-10 mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <p className="mk-eyebrow">Schedule a demo</p>
            <h1 className="mk-display mt-5 text-[var(--mk-ink)]">
              See it with your
              <br />
              own service.
            </h1>
            <p className="mk-lead mt-7 max-w-md">
              Tell us a little about your church and we&apos;ll find a time. We&apos;ll
              come with your service times already set up.
            </p>

            <ul className="mt-12 list-none space-y-8 p-0">
              {POINTS.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `var(--area-${p.area}-tint)` }}>
                      <Icon className="h-4 w-4" style={{ color: `var(--area-${p.area}-ink)` }} />
                    </div>
                    <div>
                      <h2 className="text-base font-medium text-[var(--mk-ink)]">{p.title}</h2>
                      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--mk-ink-soft)]">
                        {p.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <DemoForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
