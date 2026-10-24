"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";

/**
 * Landing-page product showcase (Planning Center's tabbed tour): one tab per
 * area of Gather, each showing a faithful mock of the real screen. Follows the
 * WAI-ARIA tabs pattern — arrow keys / Home / End move between tabs.
 * Sample names in the mocks are illustrative; nothing here claims a number.
 */
type Area = "teal" | "blue" | "clay" | "plum";
type Tab = { id: string; label: string; area: Area; eyebrow: string; title: string; body: string; points: string[]; panel: ReactNode };

const STATUS = { yes: "#16a34a", wait: "#f59e0b", no: "#dc2626" } as const;

/**
 * Sample people in the mock screens. Most have a stock face (Unsplash, see
 * public/images/people/SOURCES.txt), a few keep initials, the way a real church's
 * directory looks. Fictional — never the names of the real testimonial givers.
 */
const PHOTOS: Record<string, string> = {
  DW: "/images/people/p01.jpg",
  AO: "/images/people/p02.jpg",
  JL: "/images/people/p03.jpg",
  SP: "/images/people/p04.jpg",
  AN: "/images/people/p05.jpg",
  KO: "/images/people/p06.jpg",
  EM: "/images/people/p07.jpg",
  HP: "/images/people/p08.jpg",
  MR: "/images/people/p09.jpg",
  LK: "/images/people/p10.jpg",
  NA: "/images/people/p12.jpg",
  CB: "/images/people/p13.jpg",
};

export function MockAvatar({
  initials,
  area,
  ring,
  size = 30,
}: {
  initials: string;
  area: Area | "olive";
  ring?: keyof typeof STATUS;
  size?: number;
}) {
  const photo = PHOTOS[initials];
  if (photo) {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 rounded-full bg-white"
        style={{ width: size, height: size, padding: ring ? 2 : 0, background: ring ? STATUS[ring] : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" width={size} height={size} className="h-full w-full rounded-full border-[1.5px] border-white object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size > 34 ? 12 : 11,
        background: `var(--area-${area}-tint)`,
        color: `var(--area-${area}-ink)`,
        boxShadow: ring ? `inset 0 0 0 2.5px ${STATUS[ring]}` : undefined,
      }}
    >
      {initials}
    </span>
  );
}

export function MockWindow({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--mk-line)] bg-white shadow-[0_24px_60px_-24px_rgba(31,20,8,0.22)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[#f1ebe2] bg-[#fcfaf6] px-4 py-3" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#e7dfd3]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e7dfd3]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e7dfd3]" />
        <span className="ml-3 text-xs text-[var(--mk-ink-soft)]">{label}</span>
      </div>
      {children}
    </div>
  );
}

function PlansPanel() {
  const steps = [
    ["9:00", "Welcome & announcements", "DW", "blue", "yes"],
    ["9:05", "Worship set", "AO", "plum", "yes"],
    ["9:25", "Scripture reading", "BT", "olive", "wait"],
    ["9:30", "Message", "MR", "blue", "yes"],
    ["10:05", "Closing song", "AO", "plum", "yes"],
  ] as const;
  return (
    <MockWindow label="Service plans">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1ebe2] px-5 py-4">
        <div>
          <p className="text-[17px] font-semibold text-[var(--mk-ink)]">Sunday Morning</p>
          <p className="mt-0.5 text-[13px] text-[var(--mk-ink-soft)]">Sun, Nov 2 · 9:00 AM · Morning Service</p>
        </div>
        <div className="flex items-center gap-3.5">
          <p className="text-[13px] text-[var(--mk-ink-soft)]">
            <b className="text-[var(--mk-ink)]">9 of 12</b> confirmed
          </p>
          <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-[#f1ebe2] sm:flex" aria-hidden>
            <span className="w-[75%] bg-[#16a34a]" />
            <span className="w-[8%] bg-[#f59e0b]" />
            <span className="w-[8%] bg-[#dc2626]" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--mk-ink)] px-3 py-1.5 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5 text-[var(--mk-amber)]" aria-hidden />
            Fill with AI
          </span>
        </div>
      </div>
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="border-b border-[#f1ebe2] p-2.5 md:border-b-0 md:border-r">
          <p className="px-3.5 pb-2 pt-1 text-xs font-semibold text-[var(--mk-ink-soft)]">Order of service</p>
          {steps.map(([time, title, who, area, ring]) => (
            <div key={time} className="flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 transition-colors hover:bg-[#faf6f0]">
              <span className="w-12 text-[13px] tabular-nums text-[var(--mk-ink-soft)]">{time}</span>
              <span className="flex-1 text-sm text-[var(--mk-ink)]">{title}</span>
              <MockAvatar initials={who} area={area} ring={ring} />
            </div>
          ))}
          <p className="px-3.5 pb-1 pt-2.5 text-xs text-[var(--mk-ink-soft)]">Ends 10:12 AM</p>
        </div>
        <div className="p-4">
          <p className="pb-2 text-xs font-semibold text-[var(--mk-ink-soft)]">Team</p>
          <p className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-[var(--mk-ink)]">
            <span className="h-2 w-2 rounded-full bg-[var(--area-olive-mark)]" />
            Worship <span className="font-normal text-[var(--mk-ink-soft)]">4 / 5</span>
          </p>
          <div className="mb-4 mt-2.5 flex flex-wrap gap-2">
            <MockAvatar initials="AO" area="plum" ring="yes" size={38} />
            <MockAvatar initials="JL" area="teal" ring="yes" size={38} />
            <MockAvatar initials="SP" area="clay" ring="wait" size={38} />
            <MockAvatar initials="AN" area="blue" ring="yes" size={38} />
            <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-dashed border-[#cfc4b4] text-base text-[var(--mk-ink-soft)]" aria-hidden>
              +
            </span>
          </div>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--mk-ink)]">
            <span className="h-2 w-2 rounded-full bg-[var(--area-blue-mark)]" />
            Production <span className="font-normal text-[var(--mk-ink-soft)]">3 / 3</span>
          </p>
          <div className="mb-4 mt-2.5 flex flex-wrap gap-2">
            <MockAvatar initials="KO" area="olive" ring="yes" size={38} />
            <MockAvatar initials="EM" area="clay" ring="no" size={38} />
            <MockAvatar initials="HP" area="teal" ring="yes" size={38} />
          </div>
          <div className="flex flex-wrap gap-3.5 border-t border-[#f1ebe2] pt-3 text-xs text-[var(--mk-ink-soft)]">
            {(
              [
                ["yes", "Confirmed"],
                ["wait", "Waiting"],
                ["no", "Can't make it"],
              ] as const
            ).map(([k, label]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ boxShadow: `inset 0 0 0 2px ${STATUS[k]}` }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

function VolunteersPanel() {
  const weeks = [
    ["Sun, Nov 2", "Morning Service", 75, "9 of 12", "1 can't make it", "#b91c1c"],
    ["Sun, Nov 9", "Morning Service", 100, "12 of 12", "All set", "#15803d"],
    ["Sun, Nov 16", "Morning Service", 58, "7 of 12", "3 open spots", "#b45309"],
    ["Wed, Nov 19", "Midweek Prayer", 100, "4 of 4", "All set", "#15803d"],
    ["Sun, Nov 23", "Morning Service", 33, "4 of 12", "8 waiting", "#b45309"],
  ] as const;
  return (
    <MockWindow label="Volunteers · next 8 weeks">
      <div className="overflow-x-auto p-3">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[1.1fr_1.3fr_1.3fr_1.1fr_0.9fr] gap-3 px-3.5 py-2.5 text-xs font-semibold text-[var(--mk-ink-soft)]">
            <span>Date</span>
            <span>Service</span>
            <span>Confirmed</span>
            <span>Needs</span>
            <span>Team</span>
          </div>
          {weeks.map(([date, service, pct, count, needs, color], i) => (
            <div key={date} className="grid grid-cols-[1.1fr_1.3fr_1.3fr_1.1fr_0.9fr] items-center gap-3 border-t border-[#f6f1ea] px-3.5 py-3 text-sm transition-colors hover:bg-[#faf6f0]">
              <span className="font-medium text-[var(--mk-ink)]">{date}</span>
              <span className="text-[var(--mk-ink-soft)]">{service}</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-[70px] overflow-hidden rounded-full bg-[#f1ebe2]" aria-hidden>
                  <span className="block h-1.5 bg-[#16a34a]" style={{ width: `${pct}%` }} />
                </span>
                <span className="text-[13px] tabular-nums text-[var(--mk-ink-soft)]">{count}</span>
              </span>
              <span className="text-[13px] font-medium" style={{ color }}>
                {needs}
              </span>
              <span className="flex -space-x-2">
                <MockAvatar initials={i % 2 ? "LK" : "DW"} area="blue" size={26} />
                <MockAvatar initials={i % 2 ? "CB" : "NA"} area="plum" size={26} />
                <MockAvatar initials="+7" area="olive" size={26} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

function NewsPanel() {
  return (
    <MockWindow label="New announcement">
      <div className="grid md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4 border-b border-[#f1ebe2] p-5 md:border-b-0 md:border-r">
          <p className="text-xs font-semibold text-[var(--mk-ink-soft)]">What kind of post?</p>
          <div className="flex flex-wrap gap-2">
            {["Update", "Event", "Sign-up", "Prayer"].map((k) => (
              <span
                key={k}
                className={`rounded-full px-3 py-1.5 text-[13px] ${
                  k === "Sign-up"
                    ? "bg-[var(--area-clay-tint)] font-semibold text-[var(--area-clay-ink)]"
                    : "border border-[var(--mk-line)] text-[var(--mk-ink)]"
                }`}
              >
                {k}
              </span>
            ))}
          </div>
          <p className="rounded-xl border border-[var(--mk-line)] px-3.5 py-3 text-[15px] font-medium text-[var(--mk-ink)]">Thanksgiving meal: bring a dish</p>
          <div className="flex flex-col gap-2">
            {[
              ["Main dish", "6 spots"],
              ["Dessert", "8 spots"],
              ["Set-up crew", "4 spots"],
            ].map(([slot, spots]) => (
              <div key={slot} className="flex justify-between rounded-[10px] border border-[var(--mk-line)] px-3 py-2.5 text-sm">
                <span className="text-[var(--mk-ink)]">{slot}</span>
                <span className="text-[var(--mk-ink-soft)]">{spots}</span>
              </div>
            ))}
          </div>
          <p className="flex items-center gap-2.5 text-[13px] text-[var(--mk-ink-soft)]">
            Who sees it?
            <span className="rounded-lg bg-[#f6f1ea] px-2.5 py-1.5 font-medium text-[var(--mk-ink)]">Whole church</span>
          </p>
        </div>
        <div className="flex justify-center bg-[#faf6f0] p-5">
          <div className="w-[250px] overflow-hidden rounded-3xl border border-[var(--mk-line)] bg-white">
            <div className="flex h-[120px] items-end bg-[var(--area-clay-tint)] p-3">
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[var(--area-clay-ink)]">Sign-up · Closes Nov 20</span>
            </div>
            <div className="p-3.5">
              <p className="text-base font-semibold leading-tight text-[var(--mk-ink)]">Thanksgiving meal: bring a dish</p>
              <p className="mt-1 text-xs text-[var(--mk-ink-soft)]">Grace Fellowship</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1ebe2]" aria-hidden>
                <span className="block h-1.5 w-[55%] bg-[var(--area-clay-mark)]" />
              </div>
              <p className="mt-1.5 text-xs text-[var(--mk-ink-soft)]">10 of 18 spots taken</p>
              <p className="mt-3 rounded-xl bg-[var(--mk-ink)] py-2.5 text-center text-[13px] font-semibold text-white">Pick a slot</p>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

export function PhoneFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex w-[270px] flex-col gap-3 rounded-[34px] border-[8px] border-[var(--mk-ink)] bg-white px-3.5 py-4 shadow-[0_24px_50px_-24px_rgba(31,20,8,0.4)]">
      <p className="text-xl font-semibold text-[var(--mk-ink)]">{title}</p>
      {children}
    </div>
  );
}

export function AnswerCard() {
  return (
    <div className="rounded-2xl border border-[var(--mk-line)] bg-white p-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-12 w-11 flex-col items-center justify-center rounded-[10px] bg-[var(--area-teal-tint)] text-[var(--area-teal-ink)]">
          <span className="text-[10px] font-semibold">NOV</span>
          <span className="text-lg font-semibold leading-none">2</span>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[var(--mk-ink)]">Keys</p>
          <p className="text-xs text-[var(--mk-ink-soft)]">Morning Service · be ready 8:15</p>
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <span className="rounded-xl border border-[var(--mk-line)] py-2.5 text-center text-[13px] font-semibold text-[var(--mk-ink)]">Can&apos;t make it</span>
        <span className="rounded-xl bg-[var(--mk-amber)] py-2.5 text-center text-[13px] font-semibold text-[var(--mk-ink)]">I&apos;ll be there</span>
      </div>
    </div>
  );
}

function AppPanel() {
  return (
    <div className="flex flex-wrap justify-center gap-7 rounded-2xl bg-[var(--area-plum-tint)] p-7">
      <PhoneFrame title="Serve">
        <p className="text-xs font-semibold text-[var(--mk-ink-soft)]">Awaiting your reply</p>
        <AnswerCard />
        <p className="mt-1 text-xs font-semibold text-[var(--mk-ink-soft)]">Coming up</p>
        <p className="flex justify-between text-[13px] text-[var(--mk-ink)]">
          <span>Nov 9 · Vocals</span>
          <span className="font-semibold text-[#15803d]">Going</span>
        </p>
        <p className="flex justify-between text-[13px] text-[var(--mk-ink)]">
          <span>Nov 16 · Keys</span>
          <span className="text-[var(--mk-ink-soft)]">Backup</span>
        </p>
      </PhoneFrame>
      <PhoneFrame title="News">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[var(--mk-ink)] px-2.5 py-1.5 text-xs text-white">All</span>
          <span className="rounded-full border border-[var(--mk-line)] px-2.5 py-1.5 text-xs">Needs you</span>
          <span className="rounded-full border border-[var(--mk-line)] px-2.5 py-1.5 text-xs">Events</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[var(--mk-line)]">
          <div className="h-[90px] bg-[var(--area-plum-tint)]" />
          <div className="p-3">
            <p className="text-sm font-semibold text-[var(--mk-ink)]">Fall Family Night</p>
            <p className="mt-0.5 text-xs text-[var(--mk-ink-soft)]">Fri, Nov 7 · 6:30 PM · Fellowship Hall</p>
            <p className="mt-2.5 text-xs font-semibold text-[var(--area-plum-ink)]">I&apos;m going · 42 going</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--mk-line)] p-3">
          <p className="text-xs font-semibold text-[var(--area-teal-ink)]">Prayer</p>
          <p className="mt-1 text-sm text-[var(--mk-ink)]">Pray for the Morales family this week</p>
          <p className="mt-2 text-xs text-[var(--mk-ink-soft)]">I&apos;m praying · 18</p>
        </div>
      </PhoneFrame>
    </div>
  );
}

const TABS: Tab[] = [
  {
    id: "plans",
    label: "Service plans",
    area: "teal",
    eyebrow: "Service planning",
    title: "The whole service, with real times, on one screen.",
    body: "Build the order of service and the team side by side. Every step shows its clock time and who leads it, and every person shows whether they've said yes.",
    points: ["Start from a template or copy last week", "Green, amber and red show every answer at a glance", "Send reminders or fill open spots with AI"],
    panel: <PlansPanel />,
  },
  {
    id: "volunteers",
    label: "Volunteers",
    area: "blue",
    eyebrow: "Volunteer scheduling",
    title: "Eight weeks of Sundays, and what each one still needs.",
    body: "See every upcoming service, how many have confirmed and the one thing each still needs, so you fix gaps on Tuesday instead of Sunday morning.",
    points: ["Away dates are respected automatically", "Backups step in when someone can't make it", "Team Health shows who's stretched"],
    panel: <VolunteersPanel />,
  },
  {
    id: "news",
    label: "Announcements",
    area: "clay",
    eyebrow: "Announcements and events",
    title: "News people act on, not scroll past.",
    body: "Post an update, an event with RSVPs, a sign-up with slots or a prayer request, and choose exactly who sees it. You see the post the way members will.",
    points: ["Sign-ups with slots and limits", "Events with RSVPs", "Pin it or mark it important"],
    panel: <NewsPanel />,
  },
  {
    id: "app",
    label: "Member app",
    area: "plum",
    eyebrow: "For your congregation",
    title: "A warm app your people actually open.",
    body: "Members see the week's news and events. Volunteers see where they're serving and answer in one tap. No training, no manual.",
    points: ["iPhone and Android", "Notifications people want", "Free for every member"],
    panel: <AppPanel />,
  },
];

export default function ProductShowcase() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[active];

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = TABS.length - 1;
    const next =
      e.key === "ArrowRight" ? (active === last ? 0 : active + 1)
      : e.key === "ArrowLeft" ? (active === 0 ? last : active - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Tour of Gather" onKeyDown={onKey} className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tour-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`tour-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors ${
                on ? "font-semibold" : "border-[var(--mk-line)] bg-white text-[var(--mk-ink-soft)] hover:border-[#cfc4b4] hover:text-[var(--mk-ink)]"
              }`}
              style={on ? { background: `var(--area-${t.area}-tint)`, borderColor: `var(--area-${t.area}-tint)`, color: `var(--area-${t.area}-ink)` } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: `var(--area-${t.area}-mark)` }} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tour-panel-${tab.id}`}
        aria-labelledby={`tour-tab-${tab.id}`}
        key={tab.id}
        className="mk-tab-panel mt-7 grid items-start gap-10 lg:grid-cols-[1fr_2.2fr]"
      >
        <div className="pt-2">
          <p className={`mk-eyebrow mk-eyebrow-${tab.area}`}>{tab.eyebrow}</p>
          <h3 className="mt-3.5 text-[28px] font-semibold leading-tight tracking-[-0.015em] text-[var(--mk-ink)] sm:text-[32px]">{tab.title}</h3>
          <p className="mt-4 text-base leading-relaxed text-[var(--mk-ink-soft)]">{tab.body}</p>
          <ul className="mt-6 flex list-none flex-col gap-3 p-0">
            {tab.points.map((p) => (
              <li key={p} className="flex gap-2.5 text-[15px] text-[var(--mk-ink)]">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: `var(--area-${tab.area}-mark)` }} strokeWidth={2.5} aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">{tab.panel}</div>
      </div>
    </div>
  );
}
