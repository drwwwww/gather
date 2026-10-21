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

/** A step in the order of service that needs a person (e.g. "Welcome", "Worship set"). */
export type AutofillStep = { id: string; title: string; owner_role_id: string | null; assigned_user_id: string | null; backup_user_id: string | null };

export type AutofillProposal = {
  /** "role" fills a team spot, "step" fills an order-of-service step. */
  kind: "role" | "step";
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

/** Serving-history stats, built once per plan and shared by AI fill and the people picker. */
export type ServingStats = {
  roleCount: Map<string, number>;
  lastServed: Map<string, string>;
  nearLoad: Map<string, number>;
  declines: Map<string, number>;
};

export function buildServingStats(planDate: string, history: AutofillHistoryRow[]): ServingStats {
  const roleCount = new Map<string, number>();
  const lastServed = new Map<string, string>();
  const nearLoad = new Map<string, number>();
  const declines = new Map<string, number>();
  for (const h of history) {
    const delta = daysBetween(h.service_date, planDate);
    const key = `${h.user_id}:${h.role_id}`;
    if (h.status === "DECLINED") {
      if (delta >= 0 && delta <= 90) declines.set(key, (declines.get(key) ?? 0) + 1);
      continue;
    }
    if (delta > 0) {
      roleCount.set(key, (roleCount.get(key) ?? 0) + 1);
      const prev = lastServed.get(h.user_id);
      if (!prev || h.service_date > prev) lastServed.set(h.user_id, h.service_date);
    }
    if (Math.abs(delta) <= 14 && delta !== 0) nearLoad.set(h.user_id, (nearLoad.get(h.user_id) ?? 0) + 1);
  }
  return { roleCount, lastServed, nearLoad, declines };
}

export type RankedPerson = {
  person: AutofillPerson;
  score: number;
  /** Why they're a good pick, e.g. "Served as Greeter 4× · last served 5 weeks ago". */
  reason: string;
  /** A short fact for any list row, e.g. "Last served Oct 4" or "Hasn't served yet". */
  fact: string;
  /** A MEMBER with no history or interest for this role — not a suggestion, still pickable. */
  outsider: boolean;
};

/** Scores everyone for one role on one date. Away/busy filtering is the caller's job. */
export function rankForRole(input: {
  planDate: string;
  roleId: string | null;
  roleName: string;
  people: AutofillPerson[];
  stats: ServingStats;
}): RankedPerson[] {
  const { planDate, roleId, roleName, people, stats } = input;
  return people
    .map((p) => {
      const count = roleId ? stats.roleCount.get(`${p.id}:${roleId}`) ?? 0 : 0;
      const interested = interestMatches(p.interests, roleName);
      const last = stats.lastServed.get(p.id);
      const restDays = last ? daysBetween(last, planDate) : 120;
      const load = stats.nearLoad.get(p.id) ?? 0;
      const declined = roleId ? stats.declines.get(`${p.id}:${roleId}`) ?? 0 : 0;
      const score =
        Math.min(count, 5) * 3 +
        (interested ? 3 : 0) +
        Math.min(restDays / 7, 8) -
        (restDays <= 7 ? 6 : 0) -
        load * 3 -
        declined * 4 +
        (p.role === "MEMBER" ? -1 : 0);
      const parts: string[] = [];
      parts.push(count > 0 ? `Served as ${roleName} ${count}×` : interested ? `Interested in ${roleName}` : `New to ${roleName}`);
      parts.push(last ? (restDays >= 14 ? `last served ${Math.round(restDays / 7)} weeks ago` : `served ${restDays} days ago`) : "hasn't served yet");
      if (load === 0) parts.push("not on the schedule the weeks around it");
      const fact = count > 0
        ? `${roleName} ${count}×${last ? ` · rested ${Math.max(0, Math.round(restDays / 7))} wk` : ""}`
        : last
          ? `Last served ${new Date(`${last}T12:00:00`).toLocaleDateString([], { month: "short", day: "numeric" })}`
          : "Hasn't served yet";
      return { person: p, score, reason: parts.join(" · "), fact, outsider: p.role === "MEMBER" && !interested && count === 0 };
    })
    .sort((a, b) => b.score - a.score);
}

export function proposeSchedule(input: {
  planDate: string;
  slots: AutofillSlot[];
  steps?: AutofillStep[];
  roleNameById: Record<string, string>;
  people: AutofillPerson[];
  history: AutofillHistoryRow[];
  awayIds: Set<string>;
}): { proposals: AutofillProposal[]; unfilled: number; total: number } {
  const { planDate, slots, steps = [], roleNameById, people, history, awayIds } = input;
  const stats = buildServingStats(planDate, history);

  const busy = new Set<string>();
  for (const s of slots) {
    if (s.assigned_user_id) busy.add(s.assigned_user_id);
    if (s.backup_user_id) busy.add(s.backup_user_id);
  }

  const open = slots.filter((s) => !s.assigned_user_id);
  // Fill the roles with the fewest experienced people first, so scarce skills aren't spent elsewhere.
  const experienced = (roleId: string) => people.filter((p) => (stats.roleCount.get(`${p.id}:${roleId}`) ?? 0) > 0).length;
  open.sort((a, b) => experienced(a.role_id) - experienced(b.role_id));

  const proposals: AutofillProposal[] = [];
  for (const slot of open) {
    const roleName = roleNameById[slot.role_id] ?? "this role";
    const best = rankForRole({ planDate, roleId: slot.role_id, roleName, people, stats })
      .find((r) => !busy.has(r.person.id) && !awayIds.has(r.person.id) && !r.outsider);
    if (best) {
      busy.add(best.person.id);
      proposals.push({ kind: "role", slotId: slot.id, roleId: slot.role_id, roleName, userId: best.person.id, name: best.person.name, reason: best.reason });
    }
  }

  // Steps: whoever holds the step's role in this service leads it (the worship
  // leader takes "Worship"); otherwise the best-rested person who isn't away.
  const roleHolder = new Map<string, string>();
  for (const s of slots) {
    const holder = s.assigned_user_id ?? proposals.find((p) => p.slotId === s.id)?.userId;
    if (holder && !roleHolder.has(s.role_id)) roleHolder.set(s.role_id, holder);
  }
  const nameById = new Map(people.map((p) => [p.id, p.name]));
  const onStep = new Set(steps.map((s) => s.assigned_user_id).filter(Boolean) as string[]);
  const openSteps = steps.filter((s) => !s.assigned_user_id);
  let stepsFilled = 0;
  for (const step of openSteps) {
    const label = step.title.trim() || "this step";
    const holder = step.owner_role_id ? roleHolder.get(step.owner_role_id) : undefined;
    if (holder && !awayIds.has(holder) && nameById.has(holder)) {
      const roleName = roleNameById[step.owner_role_id!] ?? "that role";
      proposals.push({ kind: "step", slotId: step.id, roleId: step.owner_role_id!, roleName: label, userId: holder, name: nameById.get(holder)!, reason: `Already serving as ${roleName} in this service` });
      stepsFilled++;
      continue;
    }
    const roleName = step.owner_role_id ? roleNameById[step.owner_role_id] ?? label : label;
    const best = rankForRole({ planDate, roleId: step.owner_role_id, roleName, people, stats })
      .find((r) => !onStep.has(r.person.id) && !awayIds.has(r.person.id) && !r.outsider);
    if (best) {
      onStep.add(best.person.id);
      proposals.push({ kind: "step", slotId: step.id, roleId: step.owner_role_id ?? "", roleName: label, userId: best.person.id, name: best.person.name, reason: best.reason });
      stepsFilled++;
    }
  }

  const openRolesFilled = proposals.filter((p) => p.kind === "role").length;
  return {
    proposals,
    unfilled: open.length - openRolesFilled + (openSteps.length - stepsFilled),
    total: slots.length + steps.length,
  };
}
