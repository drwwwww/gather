import Link from "next/link";

import { PageGridRowThirds } from "../layout/PageGrid";

const ACCENTS = [
  {
    src: "/volunteer.jpg",
    title: "Volunteer schedule",
    description: "Assignments, confirmations, and readiness.",
    href: "/volunteers"
  },
  {
    src: "/events.jpg",
    title: "Events calendar",
    description: "Services and church-wide events.",
    href: "/events"
  },
  {
    src: "/people.jpg",
    title: "People",
    description: "Members, roles, and contact info.",
    href: "/people"
  }
] as const;

/**
 * Venus handoff SVG widgets, recolored to Gather palette in public/accents/venus.
 */
export default function VenusAccentStrip() {
  return (
    <PageGridRowThirds>
      {ACCENTS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group card relative flex h-full min-h-0 flex-col !overflow-hidden border-[var(--border)] shadow-none origin-center transition-[border-color,transform] duration-200 hover:border-[var(--border)] hover:scale-[1.02] hover:z-10"
        >
          <div className="relative h-[170px] overflow-hidden bg-[var(--surface-2)] rounded-t-[var(--radius-box)]">
            <img
              src={item.src}
              alt=""
              className="h-full w-full object-cover object-center transition group-hover:scale-[1.02]"
              loading="lazy"
              width={350}
              height={345}
            />
          </div>
          <div className="flex-1 rounded-b-[var(--radius-box)] border-t border-[var(--border)] bg-[var(--bg)] p-4">
            <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {item.description}
            </p>
          </div>
        </Link>
      ))}
    </PageGridRowThirds>
  );
}
