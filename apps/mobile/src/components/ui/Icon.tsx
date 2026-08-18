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
  | "chevronLeft"
  | "clock"
  | "quote"
  | "church"
  | "alertImportant"
  | "checkCircle"
  | "schedule"
  | "trendingUp"
  | "volunteer"
  | "search"
  | "logout"
  | "mapPin"
  | "mail"
  | "link"
  | "info"
  | "check"
  | "close"
  | "arrowRight"
  | "sparkle"
  | "handshake"
  | "bookOpen"
  | "camera"
  | "image"
  | "pencil"
  | "laptop"
  | "wave";

const iconMap: Record<AppIconName, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  church: "church-outline",
  home: "home-variant-outline",
  announcements: "bullhorn-outline",
  events: "calendar-blank-outline",
  servicePlan: "clipboard-text-outline",
  serve: "hand-heart-outline",
  notifications: "bell-outline",
  members: "account-multiple-outline",
  groups: "account-group-outline",
  calendar: "calendar-outline",
  add: "plus",
  chevronRight: "chevron-right",
  chevronLeft: "chevron-left",
  clock: "clock-outline",
  quote: "format-quote-close",
  alertImportant: "alert-circle-outline",
  checkCircle: "check-circle",
  schedule: "clock-outline",
  trendingUp: "trending-up",
  volunteer: "hand-heart-outline",
  search: "magnify",
  logout: "logout-variant",
  mapPin: "map-marker-outline",
  mail: "email-outline",
  link: "link-variant",
  info: "information-outline",
  check: "check",
  close: "close",
  arrowRight: "arrow-right",
  sparkle: "star-four-points-outline",
  handshake: "handshake-outline",
  bookOpen: "book-open-variant",
  camera: "camera-outline",
  image: "image-outline",
  pencil: "pencil-outline",
  laptop: "laptop",
  wave: "hand-wave-outline",
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
