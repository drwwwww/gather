import type { Database } from "@gather/lib";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ServiceTimeRow = Database["public"]["Tables"]["service_times"]["Row"];

/** A service_plan_role_slot row augmented with the parent plan's date/time, used for member history. */
export type PlanSlotRow = {
  id: string;
  plan_id: string;
  role_id: string;
  assigned_user_id: string | null;
  status: string;
  service_date: string;
  service_time_id: string;
};
