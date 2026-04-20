import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { theme } from "../../theme/theme";

export type AppIconName =
  | "home"
  | "announcements"
  | "events"
  | "servicePlan"
  | "serve"
  | "notifications"
  | "members"
  | "groups"
  | "calendar"
  | "add"
  | "chevronRight"
  | "clock"
  | "quote"
  | "church"
  | "alertImportant"
  | "checkCircle"
  | "schedule"
  | "trendingUp"
  | "volunteer";

const iconMap: Record<AppIconName, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  church: "church-outline",
  home: "home-outline",
  announcements: "bullhorn-outline",
  events: "calendar-month-outline",
  servicePlan: "clipboard-list-outline",
  serve: "account-group-outline",
  notifications: "bell-outline",
  members: "account-multiple-outline",
  groups: "account-group-outline",
  calendar: "calendar-outline",
  add: "plus",
  chevronRight: "chevron-right",
  clock: "clock-outline",
  quote: "format-quote-close",
  alertImportant: "alert-circle",
  checkCircle: "check-circle",
  schedule: "clock-outline",
  trendingUp: "trending-up",
  volunteer: "hand-heart-outline",
};

export function Icon({
  name,
  size = 24,
  color = theme.colors.textSecondary,
  strokeWidth: _strokeWidth = 2,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const iconName = iconMap[name];
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
}
