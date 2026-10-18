"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Gather AI branding: ink surface + amber star. Ink (not amber) keeps AI
 * distinct from primary CTAs while the star ties it to the brand.
 */
export function AiBadge({ label = "AI", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-[#1f1b14] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${className}`}
    >
      <Sparkles className="h-3 w-3 text-amber-400" aria-hidden />
      {label}
    </span>
  );
}

const AI_BUTTON_CLASS =
  "group inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#1f1b14] px-3 text-xs font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[#2c261c] disabled:pointer-events-none disabled:opacity-50";

export function AiLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={AI_BUTTON_CLASS}>
      <Sparkles className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:rotate-12" aria-hidden />
      {children}
    </Link>
  );
}

export function AiButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className={`${AI_BUTTON_CLASS} ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:rotate-12" aria-hidden />
      {children}
    </button>
  );
}
