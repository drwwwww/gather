import type { Database } from "@gather/lib";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AssignmentRow = Database["public"]["Tables"]["volunteer_assignments"]["Row"];
export type ServiceTimeRow = Database["public"]["Tables"]["service_times"]["Row"];
