import { Sparkles } from "lucide-react";
import { FadeUp } from "./Motion";
import { MockAvatar } from "./ProductShowcase";

/**
 * "How it works" as four short columns (Calendly's Book · Prep · Capture ·
 * Follow up): the week of a service in Gather, each step with a sliver of the
 * real UI. Sample people are fictional.
 */
const tile = "rounded-[14px] border border-[var(--mk-line)] bg-white p-3";

const STEPS = [
  {
    n: "1",
    area: "teal",
    title: "Plan",
    body: "Start from your template. Clock times add up as you go.",
    ui: (
      <div className={`${tile} flex flex-col gap-1.5 text-[13px]`}>
        {[
          ["9:00", "Welcome"],
          ["9:05", "Worship set"],
          ["9:30", "Message"],
        ].map(([t, s]) => (
          <p key={t} className="flex gap-3">
            <span className="w-9 tabular-nums text-[var(--mk-ink-soft)]">{t}</span>
            <span className="text-[var(--mk-ink)]">{s}</span>
          </p>
        ))}
      </div>
    ),
  },
  {
    n: "2",
    area: "blue",
    title: "Fill",
    body: "Pick people, or let AI suggest them with a reason for each.",
    ui: (
      <div className={`${tile} flex items-center gap-2.5`}>
        <MockAvatar initials="JL" area="teal" size={32} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--mk-ink)]">Jordan for Drums</p>
          <p className="flex items-center gap-1 text-xs text-[var(--mk-ink-soft)]">
            <Sparkles className="h-3 w-3 text-[var(--mk-amber-deep)]" aria-hidden />
            rested 5 weeks
          </p>
        </div>
      </div>
    ),
  },
  {
    n: "3",
    area: "clay",
    title: "Confirm",
    body: "Requests land on their phones. Backups step in if someone can't.",
    ui: (
      <div className={`${tile} flex flex-col gap-2`}>
        <p className="flex items-center gap-2 text-[13px] text-[var(--mk-ink)]">
          <MockAvatar initials="HP" area="teal" ring="yes" size={26} />
          Hannah confirmed Vocals
        </p>
        <p className="flex items-center gap-2 text-[13px] text-[var(--mk-ink)]">
          <MockAvatar initials="KO" area="olive" ring="yes" size={26} />
          Kofi stepped in on Slides
        </p>
      </div>
    ),
  },
  {
    n: "4",
    area: "plum",
    title: "Run",
    body: "See who's here, mark steps done, thank the team after.",
    ui: (
      <div className="rounded-[14px] bg-[var(--mk-ink)] p-3 text-white">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#f6c76b]">LIVE · NOW: MESSAGE</p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {[1, 1, 1, 0].map((d, i) => (
            <span key={i} className={`h-[5px] flex-1 rounded-full ${d ? "bg-[var(--mk-amber)]" : "bg-white/25"}`} />
          ))}
        </div>
        <p className="mt-2 text-xs text-white/75">11 of 12 checked in</p>
      </div>
    ),
  },
] as const;

export default function WorkflowStrip() {
  return (
    <ol className="mt-10 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s, i) => (
        <FadeUp key={s.n} delay={i * 0.06} className="h-full">
          <li className="flex h-full flex-col gap-4 rounded-[20px] p-5" style={{ background: `var(--area-${s.area}-tint)` }}>
            <div>
              <p className="text-xs font-semibold tabular-nums" style={{ color: `var(--area-${s.area}-ink)` }}>
                Step {s.n}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-[var(--mk-ink)]">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--mk-ink-soft)]">{s.body}</p>
            </div>
            <div className="mt-auto" aria-hidden>
              {s.ui}
            </div>
          </li>
        </FadeUp>
      ))}
    </ol>
  );
}
