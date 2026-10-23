"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/#features", label: "Product" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * Transparent over the hero, solid (with a blurred backdrop) once scrolled.
 * The hero itself uses a light "dawn" wash rather than a dark photo, so nav
 * text stays dark ink at all times — only the bar's background and border
 * toggle with scroll. `overHero` just controls whether the bar starts
 * transparent (landing page) or solid from the top (inner pages).
 */
export default function MarketingNav({ overHero = false }: { overHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || !overHero
          ? "border-b border-[var(--mk-line)] bg-[rgba(255,253,250,0.86)] backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      {/*
        Side tracks are equal `1fr` columns, so whatever their content widths
        happen to be, leftover space is split evenly between them — the
        middle track's centre always lands on the bar's true centre. A plain
        `justify-between` only centres within whatever space is left over
        after the (unequal-width) logo and CTA group, which reads off-centre.
      */}
      <nav className="mx-auto grid h-16 max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 justify-self-start" aria-label="Gather home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark-amber.png" alt="" className="h-7 w-[35px] shrink-0 select-none" />
          <span className="text-lg font-semibold tracking-tight text-[var(--mk-ink)]">
            Gather
          </span>
        </Link>

        <div className="hidden items-center gap-1 justify-self-center rounded-full border border-[var(--mk-line)] bg-white/70 px-2 py-1.5 backdrop-blur-md md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-[var(--mk-ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--mk-ink)]"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-self-end gap-3">
          <div className="hidden items-center gap-1 rounded-full border border-[var(--mk-line)] bg-white/70 py-1.5 pl-1.5 pr-1.5 backdrop-blur-md md:flex">
            <Link
              href="/login"
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[var(--mk-ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--mk-ink)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth?tab=signup"
              className="rounded-full bg-[var(--mk-amber)] px-4 py-1.5 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-[var(--mk-amber-deep)]"
            >
              Start free trial
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="text-[var(--mk-ink)] md:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-[var(--mk-line)] bg-[var(--mk-ground)] px-5 pb-6 pt-2 md:hidden">
          <ul className="list-none space-y-1 p-0">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-base text-[var(--mk-ink)] hover:bg-[var(--surface-2)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[var(--mk-line)] px-4 py-3 text-center text-sm font-semibold text-[var(--mk-ink)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth?tab=signup"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-[var(--mk-amber)] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
