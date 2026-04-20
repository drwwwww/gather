/** Minimal shape for computing the next occurrence of recurring weekly services. */
export type ServiceTimeLike = { day_of_week: number; start_time: string };

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
