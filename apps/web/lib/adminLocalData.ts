export type StoredVolunteerRole = {
  id: string;
  name: string;
  ministry?: string;
  description?: string;
};

export type StoredScheduleSlot = {
  id: string;
  roleId: string;
  count: number;
};

export type StoredAssignment = {
  id: string;
  scheduledDate: string;
  serviceTimeName?: string;
  roleId: string;
  roleName: string;
  assignedTo: string;
  status: "OPEN" | "ASSIGNED" | "CONFIRMED" | "DECLINED";
  notes?: string;
};

export type StoredAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  status: string;
  publishAt: string;
};

export type StoredEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  audience: string;
  rsvps: number;
  location?: string;
  description?: string;
  rsvpList?: Array<{ name: string; status: "GOING" | "MAYBE" | "NO" }>;
};

export type AdminLocalData = {
  volunteers: {
    serviceDate: string;
    roles: StoredVolunteerRole[];
    slots: StoredScheduleSlot[];
    assignments: StoredAssignment[];
  };
  announcements: {
    items: StoredAnnouncement[];
  };
  events: {
    items: StoredEvent[];
  };
};

const STORAGE_KEY = "gather_admin_local_v1";

const defaultData: AdminLocalData = {
  volunteers: {
    serviceDate: "",
    roles: [],
    slots: [],
    assignments: []
  },
  announcements: {
    items: []
  },
  events: {
    items: []
  }
};

export function loadAdminLocalData(): AdminLocalData {
  if (typeof window === "undefined") {
    return defaultData;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as AdminLocalData;
    return {
      volunteers: {
        serviceDate: parsed.volunteers?.serviceDate ?? "",
        roles: (parsed.volunteers?.roles ?? []).map((role: StoredVolunteerRole) => ({
          id: role.id,
          name: role.name,
          ministry: role.ministry,
          description: role.description
        })),
        slots: parsed.volunteers?.slots ?? [],
        assignments: (parsed.volunteers?.assignments ?? []).map((assignment: StoredAssignment) => ({
          id: assignment.id,
          scheduledDate: assignment.scheduledDate,
          serviceTimeName: assignment.serviceTimeName,
          roleId: assignment.roleId,
          roleName: assignment.roleName,
          assignedTo: assignment.assignedTo ?? "",
          status: assignment.status ?? "OPEN",
          notes: assignment.notes ?? ""
        }))
      },
      announcements: {
        items: (parsed.announcements?.items ?? []).map((item: StoredAnnouncement & { when?: string; body?: string }) => ({
          id: item.id,
          title: item.title,
          body: item.body || "",
          audience: item.audience,
          status: item.status || "DRAFT",
          publishAt: item.publishAt || item.when || ""
        }))
      },
      events: {
        items: (parsed.events?.items ?? []).map((event: StoredEvent & { when?: string }) => ({
          id: event.id,
          title: event.title,
          startAt: event.startAt || event.when || "",
          endAt: event.endAt || "",
          audience: event.audience,
          rsvps: event.rsvps ?? 0,
          location: event.location,
          description: event.description,
          rsvpList: event.rsvpList ?? []
        }))
      }
    };
  } catch {
    return defaultData;
  }
}

export function saveAdminLocalData(next: AdminLocalData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("gather-admin-data"));
}
