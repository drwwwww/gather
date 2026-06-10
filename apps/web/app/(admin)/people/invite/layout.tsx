import { Suspense, type ReactNode } from "react";

export default function PeopleInviteLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-8 text-sm text-base-content/60">Loading…</div>}>{children}</Suspense>;
}
