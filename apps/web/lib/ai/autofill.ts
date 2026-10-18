/**
 * Gather AI — schedule fill.
 *
 * v1 is a transparent ranking, not a model call: for every open slot it picks
 * the person who knows the role, has rested longest, isn't away and isn't
 * already serving in this service. Every pick carries the reason it was made,
 * so admins can trust (or skip) it. Model-backed suggestions plug in later
 * behind the same `AutofillProposal` shape.
 */

export type AutofillPerson = {
  id: string;
  name: string;
  role: "ADMIN" | "SERVICE" | "MEMBER";
  interests: string[];
};

export type AutofillHistoryRow = {
  user_id: string;
  role_id: string;
  service_date: string;
  status: string;
};

export type AutofillSlot = { id: string; role_id: string; assigned_user_id: string | null; backup_user_id: string | null };

export type AutofillProposal = {
  slotId: string;
  roleId: string;
  roleName: string;
  userId: string;
  name: string;
  reason: string;
};

const DAY = 86_400_000;
const toDay = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
const daysBetween = (a: string, b: string) => Math.round((toDay(b) - toDay(a)) / DAY);

const interestMatches = (interests: string[], roleName: string) => {
  const r = roleName.toLowerCase();
  return interests.some((i) => {
    const t = i.toLowerCase().trim();
    return t.length > 2 && (r.includes(t) || t.includes(r));
  });
};

export function proposeSchedule(input: {
  planDate: string;
  slots: AutofillSlot[];
  roleNameById: Record<string, string>;
  people: AutofillPerson[];
  history: AutofillHistoryRow[];
  awayIds: Set<string>;
}): { proposals: AutofillProposal[]; unfilled: number } {
  const { planDate, slots, roleNameById, people, history, awayIds } = input;

  const busy = new Set<string>();
  for (const s of slots) {
    if (s.assigned_user_id) busy.add(s.assigned_user_id);
    if (s.backup_user_id) busy.add(s.backup_user_id);
  }

  // Per person: past serves by role, last served date, load around this date, recent declines.
  const roleCount = new Map<string, number>();
  const lastServed = new Map<string, string>();
  const nearLoad = new Map<string, number>();
  const declines = new Map<string, number>();
  for (const h of history) {
    const delta = daysBetween(h.service_date, planDate);
    if (h.status === "DECLINED") {
      if (delta >= 0 && delta <= 90) declines.set(`${h.user_id}:${h.role_id}`, (declines.get(`${h.user_id}:${h.role_id}`) ?? 0) + 1);
      continue;
    }
    if (delta > 0) {
      roleCount.set(`${h.user_id}:${h.role_id}`, (roleCount.get(`${h.user_id}:${h.role_id}`) ?? 0) + 1);
      const prev = lastServed.get(h.user_id);
      if (!prev || h.service_date > prev) lastServed.set(h.user_id, h.service_date);
    }
    if (Math.abs(delta) <= 14 && delta !== 0) nearLoad.set(h.user_id, (nearLoad.get(h.user_id) ?? 0) + 1);
  }

  const open = slots.filter((s) => !s.assigned_user_id);
  // Fill the roles with the fewest experienced people first, so scarce skills aren't spent elsewhere.
  const experienced = (roleId: string) => people.filter((p) => (roleCount.get(`${p.id}:${roleId}`) ?? 0) > 0).length;
  open.sort((a, b) => experienced(a.role_id) - experienced(b.role_id));

  const proposals: AutofillProposal[] = [];
  for (const slot of open) {
    const roleName = roleNameById[slot.role_id] ?? "this role";
    let best: { p: AutofillPerson; score: number; reason: string } | null = null;

    for (const p of people) {
      if (busy.has(p.id) || awayIds.has(p.id)) continue;
      const count = roleCount.get(`${p.id}:${slot.role_id}`) ?? 0;
      const interested = interestMatches(p.interests, roleName);
      if (p.role === "MEMBER" && !interested && count === 0) continue;

      const last = lastServed.get(p.id);
      const restDays = last ? daysBetween(last, planDate) : 120;
      const load = nearLoad.get(p.id) ?? 0;
      const declined = declines.get(`${p.id}:${slot.role_id}`) ?? 0;

      const score =
        Math.min(count, 5) * 3 +
        (interested ? 3 : 0) +
        Math.min(restDays / 7, 8) -
        (restDays <= 7 ? 6 : 0) -
        load * 3 -
        declined * 4 +
        (p.role === "MEMBER" ? -1 : 0);

      if (!best || score > best.score) {
        const parts: string[] = [];
        parts.push(count > 0 ? `Served as ${roleName} ${count}×` : interested ? `Interested in ${roleName}` : `New to ${roleName}`);
        parts.push(last ? (restDays >= 14 ? `last served ${Math.round(restDays / 7)} weeks ago` : `served ${restDays} days ago`) : "hasn't served yet");
        if (load === 0) parts.push("free the weeks nearby");
        best = { p, score, reason: parts.join(" · ") };
      }
    }

    if (best) {
      busy.add(best.p.id);
      proposals.push({ slotId: slot.id, roleId: slot.role_id, roleName, userId: best.p.id, name: best.p.name, reason: best.reason });
    }
  }

  return { proposals, unfilled: open.length - proposals.length };
}
