"use client";

import { Bell, CalendarDays, ClipboardCheck, Download, Megaphone, Smartphone, Sparkles } from "lucide-react";

const IOS_URL = process.env.NEXT_PUBLIC_GATHER_IOS_APP_URL?.trim() || "";
const ANDROID_URL = process.env.NEXT_PUBLIC_GATHER_ANDROID_APP_URL?.trim() || "";

const highlights: { icon: typeof Smartphone; title: string; body: string }[] = [
  {
    icon: CalendarDays,
    title: "Your serving schedule",
    body: "See when you’re on, confirm or decline spots, and view backup roles in one place."
  },
  {
    icon: ClipboardCheck,
    title: "Run-of-show & bulletin",
    body: "Follow the plan for the next service—the same details your team sees at the console."
  },
  {
    icon: Bell,
    title: "Timely nudges",
    body: "Get reminders when you’re assigned or when something changes before Sunday."
  },
  {
    icon: Megaphone,
    title: "Church feed on the go",
    body: "Catch announcements and updates without digging through email threads."
  }
];

export default function MemberHomePage() {
  const hasIOS = Boolean(IOS_URL);
  const hasAndroid = Boolean(ANDROID_URL);

  return (
    <div className="mx-auto max-w-2xl">
      <section
        className="overflow-hidden rounded-3xl border-2 border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary)_14%,var(--surface))] shadow-lg"
        aria-labelledby="member-app-heading"
      >
        <div className="relative px-6 pb-10 pt-10 sm:px-10 sm:pb-12 sm:pt-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
            style={{ background: "var(--primary)" }}
            aria-hidden
          />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--primary)_35%,transparent)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" aria-hidden />
              Built for your phone
            </p>
            <h1
              id="member-app-heading"
              className="mt-5 text-balance text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
            >
              Use Gather on your phone
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              The web view you’re in is intentionally minimal.{" "}
              <strong className="font-semibold text-[var(--text-primary)]">Install the Gather app</strong> for the
              experience your church is set up for—scheduling, bulletin, and notifications all work best there.
            </p>

            <ul className="mt-8 space-y-4">
              {highlights.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--primary)] shadow-sm ring-1 ring-[var(--border)]"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-muted)]">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-[color-mix(in_oklch,var(--primary)_25%,var(--border))] bg-[var(--surface)] p-5 sm:p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Smartphone className="h-4 w-4 text-[var(--primary)]" aria-hidden />
                Install in two taps
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Use the <strong className="text-[var(--text-primary)]">same email and password</strong> you use here.
                Your church and profile will sync automatically after you sign in.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {hasIOS ? (
                  <a
                    href={IOS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg h-auto min-h-[3.25rem] w-full justify-center gap-2 px-6 py-4 text-base font-semibold shadow-md"
                  >
                    <Download className="h-5 w-5 shrink-0" aria-hidden />
                    Download on the App Store
                  </a>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-center text-sm text-[var(--text-muted)]">
                    <strong className="block text-[var(--text-primary)]">iPhone &amp; iPad</strong>
                    Your church hasn’t added an App Store link yet. Ask an admin for the link or QR code.
                  </div>
                )}
                {hasAndroid ? (
                  <a
                    href={ANDROID_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-lg h-auto min-h-[3.25rem] w-full justify-center gap-2 border-2 border-[var(--primary)] px-6 py-4 text-base font-semibold text-[var(--text-primary)] hover:bg-[color-mix(in_oklch,var(--primary)_10%,var(--surface))]"
                  >
                    <Download className="h-5 w-5 shrink-0" aria-hidden />
                    Get it on Google Play
                  </a>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-center text-sm text-[var(--text-muted)]">
                    <strong className="block text-[var(--text-primary)]">Android</strong>
                    Your church hasn’t added a Play Store link yet. Ask an admin for the link or QR code.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
