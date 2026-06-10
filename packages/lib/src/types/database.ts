export type Role = "ADMIN" | "SERVICE" | "MEMBER";
export type Audience = "ALL" | "MEMBER" | "SERVICE" | "ADMIN" | "MINISTRY";
export type AssignmentStatus = "OPEN" | "ASSIGNED" | "CONFIRMED" | "DECLINED";
export type RsvpStatus = "GOING" | "MAYBE" | "NO";
export type ServicePlanStatus = "PLANNED" | "DONE" | "SKIPPED";

export type Database = {
  public: {
    Tables: {
      churches: {
        Row: { id: string; name: string; slug: string; timezone: string; address: string | null; created_at: string };
        Insert: { id?: string; name: string; slug: string; timezone: string; address?: string | null; created_at?: string };
        Update: { name?: string; slug?: string; timezone?: string; address?: string | null };
      };
      profiles: {
        Row: {
          id: string;
          church_id: string | null;
          full_name: string | null;
          email: string | null;
          role: Role;
          disabled: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          church_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          role?: Role;
          disabled?: boolean;
          created_at?: string;
        };
        Update: {
          church_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          role?: Role;
          disabled?: boolean;
        };
      };
      ministries: {
        Row: { id: string; church_id: string; name: string };
        Insert: { id?: string; church_id: string; name: string };
        Update: { name?: string };
      };
      service_times: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          day_of_week: number;
          start_time: string;
          timezone: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          day_of_week: number;
          start_time: string;
          timezone: string;
        };
        Update: {
          name?: string;
          day_of_week?: number;
          start_time?: string;
          timezone?: string;
        };
      };
      volunteer_roles: {
        Row: { id: string; church_id: string; ministry_id: string | null; name: string; description: string | null };
        Insert: { id?: string; church_id: string; ministry_id?: string | null; name: string; description?: string | null };
        Update: { name?: string; description?: string | null; ministry_id?: string | null };
      };
      announcements: {
        Row: {
          id: string;
          church_id: string;
          title: string;
          body: string;
          audience: Audience;
          ministry_id: string | null;
          publish_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          title: string;
          body: string;
          audience: Audience;
          ministry_id?: string | null;
          publish_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          audience?: Audience;
          ministry_id?: string | null;
          publish_at?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          church_id: string;
          title: string;
          description: string | null;
          location: string | null;
          start_at: string;
          end_at: string | null;
          audience: Audience;
          ministry_id: string | null;
          is_cancelled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_at: string;
          end_at?: string | null;
          audience: Audience;
          ministry_id?: string | null;
          is_cancelled?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          location?: string | null;
          start_at?: string;
          end_at?: string | null;
          audience?: Audience;
          ministry_id?: string | null;
          is_cancelled?: boolean;
        };
      };
      event_rsvps: {
        Row: { id: string; event_id: string; user_id: string; status: RsvpStatus; created_at: string };
        Insert: { id?: string; event_id: string; user_id: string; status?: RsvpStatus; created_at?: string };
        Update: { status?: RsvpStatus };
      };
      notification_log: {
        Row: { id: string; church_id: string; user_id: string | null; type: string; payload: Record<string, unknown>; sent_at: string | null; read_at: string | null };
        Insert: { id?: string; church_id: string; user_id?: string | null; type: string; payload: Record<string, unknown>; sent_at?: string | null; read_at?: string | null };
        Update: { sent_at?: string | null; read_at?: string | null };
      };
      service_presets: {
        Row: {
          id: string;
          church_id: string;
          service_time_id: string;
          name: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          service_time_id: string;
          name: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          service_time_id?: string;
          name?: string;
          is_default?: boolean;
        };
      };
      service_preset_items: {
        Row: {
          id: string;
          preset_id: string;
          position: number;
          title: string;
          duration_minutes: number | null;
          notes: string;
          owner_role_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          preset_id: string;
          position: number;
          title: string;
          duration_minutes?: number | null;
          notes?: string;
          owner_role_id?: string | null;
          created_at?: string;
        };
        Update: {
          position?: number;
          title?: string;
          duration_minutes?: number | null;
          notes?: string;
          owner_role_id?: string | null;
        };
      };
      service_plans: {
        Row: {
          id: string;
          church_id: string;
          service_time_id: string;
          service_date: string;
          preset_id: string | null;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          service_time_id: string;
          service_date: string;
          preset_id?: string | null;
          title?: string;
          created_at?: string;
        };
        Update: {
          service_time_id?: string;
          service_date?: string;
          preset_id?: string | null;
          title?: string;
        };
      };
      service_plan_items: {
        Row: {
          id: string;
          plan_id: string;
          position: number;
          title: string;
          duration_minutes: number | null;
          notes: string;
          owner_role_id: string | null;
          assigned_user_id: string | null;
          backup_user_id: string | null;
          status: ServicePlanStatus;
          assignment_status: AssignmentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          position: number;
          title: string;
          duration_minutes?: number | null;
          notes?: string;
          owner_role_id?: string | null;
          assigned_user_id?: string | null;
          backup_user_id?: string | null;
          status?: ServicePlanStatus;
          assignment_status?: AssignmentStatus;
          created_at?: string;
        };
        Update: {
          position?: number;
          title?: string;
          duration_minutes?: number | null;
          notes?: string;
          owner_role_id?: string | null;
          assigned_user_id?: string | null;
          backup_user_id?: string | null;
          status?: ServicePlanStatus;
          assignment_status?: AssignmentStatus;
        };
      };
      service_plan_role_slots: {
        Row: {
          id: string;
          plan_id: string;
          role_id: string;
          sort_order: number;
          assigned_user_id: string | null;
          backup_user_id: string | null;
          status: AssignmentStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          role_id: string;
          sort_order?: number;
          assigned_user_id?: string | null;
          backup_user_id?: string | null;
          status?: AssignmentStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          role_id?: string;
          sort_order?: number;
          assigned_user_id?: string | null;
          backup_user_id?: string | null;
          status?: AssignmentStatus;
          notes?: string | null;
        };
      };
    };
    Views: {};
    Functions: {
      admin_remove_member_from_church: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      bootstrap_church: {
        Args: { p_name: string; p_slug: string; p_timezone: string };
        Returns: string;
      };
      create_service_plan_from_preset: {
        Args: { p_service_time_id: string; p_service_date: string; p_preset_id: string };
        Returns: string;
      };
    };
    Enums: {
      role_enum: Role;
      audience_enum: Audience;
      assignment_status_enum: AssignmentStatus;
      rsvp_status_enum: RsvpStatus;
    };
    CompositeTypes: {};
  };
};
