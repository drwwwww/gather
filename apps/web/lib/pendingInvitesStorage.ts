import type { InviteEntry } from "../components/people/memberUtils";

const STORAGE_KEY = "gather_pending_invites_v1";

type Stored = {
  churchId: string;
  items: InviteEntry[];
};

function readRaw(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Stored;
    if (!data?.churchId || !Array.isArray(data.items)) return null;
    return data;
  } catch {
    return null;
  }
}

export function readPendingInvites(churchId: string): InviteEntry[] {
  const data = readRaw();
  if (!data || data.churchId !== churchId) return [];
  return data.items;
}

export function appendPendingInvites(churchId: string, newInvites: InviteEntry[]) {
  if (typeof window === "undefined" || !newInvites.length) return;
  const data = readRaw();
  const existing =
    data?.churchId === churchId ? [...data.items] : [];
  const seen = new Set(existing.map((i) => i.email.toLowerCase()));
  for (const inv of newInvites) {
    if (seen.has(inv.email.toLowerCase())) continue;
    seen.add(inv.email.toLowerCase());
    existing.unshift(inv);
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ churchId, items: existing }));
}
