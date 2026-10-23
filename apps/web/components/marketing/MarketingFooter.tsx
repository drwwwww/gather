import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Volunteer scheduling" },
      { href: "/#features", label: "Service planning" },
      { href: "/#features", label: "Announcements & events" },
      { href: "/#mobile", label: "Mobile app" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#about", label: "About" },
      { href: "/pricing", label: "Pricing" },
      { href: "/demo", label: "Schedule a demo" },
      { href: "mailto:support@gatherministry.online", label: "Contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/signup", label: "Create an account" },
      { href: "/login", label: "Sign in" },
      { href: "/join", label: "Join your church" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/dpa", label: "Data processing" },
      { href: "/delete-account", label: "Delete your account" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="mk-rule bg-[var(--mk-ground)] px-5 pb-10 pt-16 sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mark-amber.png" alt="" className="h-7 w-[35px] shrink-0 select-none" />
              <span className="text-lg font-semibold tracking-tight text-[var(--mk-ink)]">Gather</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--mk-ink-soft)]">
              One calm workspace for the local church — so your team can spend less time
              coordinating and more time with people.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mk-ink-faint)]">
                {col.title}
              </h3>
              <ul className="mt-4 list-none space-y-2.5 p-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-[var(--mk-ink-soft)] transition-colors hover:text-[var(--mk-ink)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mk-rule mt-12 flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--mk-ink-faint)]">
            © {new Date().getFullYear()} Gather. Made for the local church.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-[var(--mk-ink-faint)] transition-colors hover:text-[var(--mk-ink-soft)]">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-[var(--mk-ink-faint)] transition-colors hover:text-[var(--mk-ink-soft)]">
              Terms
            </Link>
            <a
              href="mailto:support@gatherministry.online"
              className="text-xs text-[var(--mk-ink-faint)] hover:text-[var(--mk-ink-soft)]"
            >
              support@gatherministry.online
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
