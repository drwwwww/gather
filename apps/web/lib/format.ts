import { parse, format } from "date-fns";
// @ts-ignore: date-fns types may not be installed, but runtime import is correct

export function formatFriendlyLocalDate(dateString: string) {
  if (!dateString) return "";
  const date = parse(dateString, "yyyy-MM-dd", new Date());
  return format(date, "EEEE, MMM d, yyyy");
}
export function formatWeekdayDateTime(value?: Date | string | null) {
  if (!value) return "Not scheduled";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
  return `${datePart} - ${timePart}`;
}

export function formatShortDateTime(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
  return `${datePart} ${timePart}`;
}

export function formatShortDate(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatShortWeekdayDateTime(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
  return `${datePart} - ${timePart}`;
}

export function formatFriendlyDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function buildJoinLink(origin: string, code: string) {
  const trimmed = code.trim();
  return `${origin}/join?code=${encodeURIComponent(trimmed)}`;
}

export function buildInviteMessage(churchName: string, code: string, joinLink: string) {
  return `You've been invited to join ${churchName} on Gather. Download the app and join with code ${code}, or tap: ${joinLink}`;
}

export function formatRelativeTime(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (absSeconds < 60) return rtf.format(diffSeconds, "second");
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 4) return rtf.format(diffWeeks, "week");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, "year");
}

export type TimezoneOption = { value: string; label: string };

const fallbackTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney"
];

export function formatTimezoneLabel(value: string) {
  return value
    .split("/")
    .map((segment) => segment.replace(/_/g, " "))
    .join(" / ");
}

export function getTimezoneOptions(): TimezoneOption[] {
  // Only fallback timezones supported
  return fallbackTimezones.map((value) => ({
    value,
    label: formatTimezoneLabel(value)
  }));
}

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export function formatTimeString(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatServiceTimeLabel(service: { day_of_week: number; start_time: string; name?: string | null }) {
  const weekday = weekdayNames[service.day_of_week] ?? service.name ?? "Service";
  const time = formatTimeString(service.start_time);
  return `${weekday} Service - ${time}`;
}

export function formatDurationMinutes(totalMinutes?: number | null) {
  if (!totalMinutes || totalMinutes <= 0) return "";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  if (!parts.length) parts.push("0 min");
  return `~${parts.join(" ")}`;
}
