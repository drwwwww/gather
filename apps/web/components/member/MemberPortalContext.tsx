"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { Database } from "@gather/lib";

type ServiceTime = Database["public"]["Tables"]["service_times"]["Row"];

export type MemberPortalValue = {
  userId: string;
  churchId: string;
  role: string;
  serviceTimes: ServiceTime[];
};

const MemberPortalContext = createContext<MemberPortalValue | null>(null);

export function MemberPortalProvider({
  value,
  children
}: {
  value: MemberPortalValue;
  children: ReactNode;
}) {
  return <MemberPortalContext.Provider value={value}>{children}</MemberPortalContext.Provider>;
}

export function useMemberPortal() {
  const v = useContext(MemberPortalContext);
  if (!v) throw new Error("useMemberPortal must be used under MemberPortalProvider");
  return v;
}
