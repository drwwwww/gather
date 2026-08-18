/** @deprecated Use getNextWorshipDate instead — service times are no longer a first-class concept. */
export type ServiceTimeLike = { day_of_week: number; start_time: string };

/** @deprecated Kept for backward compat with callers that haven't migrated yet. */
export function getNextServiceDateTime(serviceTimes: ServiceTimeLike[]): Date | null {
  if (!serviceTimes.length) return null;
  const now = new Date();
  const candidates = serviceTimes.map((service) => {
    const target = new Date(now);
    const currentDay = target.getDay();
    const dayOffset = (service.day_of_week + 7 - currentDay) % 7;
    target.setDate(target.getDate() + dayOffset);
    const [hours, minutes] = service.start_time.split(":").map(Number);
    target.setHours(hours || 0, minutes || 0, 0, 0);
    if (target < now) target.setDate(target.getDate() + 7);
    return target;
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? null;
}

/**
 * Given an array of worship days (0=Sun … 6=Sat), returns a Date for the
 * next upcoming occurrence. Time is set to midnight — combine with a plan's
 * start_time for a full datetime if needed.
 */
export function getNextWorshipDate(worshipDays: number[]): Date | null {
  if (!worshipDays.length) return null;
  const now = new Date();
  const today = now.getDay();
  const candidates = worshipDays.map((day) => {
    const target = new Date(now);
    let offset = (day + 7 - today) % 7;
    if (offset === 0) offset = 7; // always return a future date
    target.setDate(target.getDate() + offset);
    target.setHours(0, 0, 0, 0);
    return target;
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? null;
}
