import type { Role } from "@gather/lib";
import type { AssignmentRow, ProfileRow, ServiceTimeRow } from "./types";
import { formatShortWeekdayDateTime } from "../../lib/format";

export type InviteEntry = {
  id: string;
  email: string;
  role: Role;
  message: string;
  createdAt: string;
};

export type MemberStatus = "ACTIVE" | "INACTIVE" | "INVITED";

export type MemberEntry = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  disabled: boolean;
  source: "member" | "invite";
  profile?: ProfileRow;
};

export type MemberEntryWithFlags = MemberEntry & { isCurrentUser: boolean };

export const roleOptions: Role[] = ["ADMIN", "SERVICE", "MEMBER"];

export function buildMemberEntries(
  profiles: ProfileRow[],
  invites: InviteEntry[],
  currentUserId: string | null
): MemberEntryWithFlags[] {
  const members = profiles.map((profile) => ({
    id: profile.id,
    name: profile.full_name || "",
    email: profile.email || "",
    role: profile.role,
    status: (profile.disabled ? "INACTIVE" : "ACTIVE") as MemberStatus,
    disabled: profile.disabled,
    source: "member" as const,
    profile
  }));

  const memberEmails = new Set(members.map((member) => member.email.toLowerCase()));
  const pendingInvites = invites
    .filter((invite) => !memberEmails.has(invite.email.toLowerCase()))
    .map((invite) => ({
      id: invite.id,
      name: "",
      email: invite.email,
      role: invite.role,
      status: "INVITED" as const,
      disabled: false,
      source: "invite" as const
    }));

  return [...members, ...pendingInvites].map((entry) => ({
    ...entry,
    isCurrentUser: entry.id === currentUserId
  }));
}

export function getUpcomingAssignments(
  assignments: AssignmentRow[],
  serviceTimes: ServiceTimeRow[],
  profileId: string
) {
  const nowDate = new Date().toISOString().slice(0, 10);
  const serviceTimeMap = serviceTimes.reduce<Record<string, ServiceTimeRow>>((acc, service) => {
    acc[service.id] = service;
    return acc;
  }, {});

  return assignments
    .filter((assignment) => assignment.assigned_user_id === profileId)
    .filter((assignment) => assignment.scheduled_date >= nowDate)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    .slice(0, 3)
    .map((assignment) => {
      const service = serviceTimeMap[assignment.service_time_id];
      const label = service
        ? formatShortWeekdayDateTime(buildServiceDateTime(assignment.scheduled_date, service.start_time))
        : assignment.scheduled_date;
      return {
        id: assignment.id,
        roleId: assignment.role_id,
        serviceLabel: label
      };
    });
}

function buildServiceDateTime(serviceDate: string, startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date(serviceDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}
