export type LocalRole = "ADMIN" | "SERVICE" | "MEMBER";

export type LocalUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: LocalRole;
  churchId: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
};

export type LocalServiceTime = {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
};

export type LocalNotificationSettings = {
  remindersEnabled: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
};

export type LocalChurch = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  serviceTimes: LocalServiceTime[];
  notificationSettings: LocalNotificationSettings;
  createdAt: string;
};

export type LocalInvite = {
  id: string;
  churchId: string;
  email: string;
  role: LocalRole;
  status: "PENDING" | "REVOKED" | "ACCEPTED";
  createdAt: string;
};

type LocalAuthState = {
  users: LocalUser[];
  churches: LocalChurch[];
  invites: LocalInvite[];
  session: {
    userId: string | null;
  };
};

const STORAGE_KEY = "gather_admin_auth_v1";

const defaultState: LocalAuthState = {
  users: [],
  churches: [],
  invites: [],
  session: {
    userId: null
  }
};

function loadState(): LocalAuthState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as LocalAuthState;
    return {
      users: (parsed.users ?? []).map((user) => ({
        id: user.id,
        fullName: user.fullName ?? "",
        email: user.email,
        password: user.password,
        role: user.role ?? "MEMBER",
        churchId: user.churchId ?? null,
        status: user.status ?? "ACTIVE",
        createdAt: user.createdAt ?? new Date().toISOString()
      })),
      churches: parsed.churches ?? [],
      invites: parsed.invites ?? [],
      session: parsed.session ?? { userId: null }
    };
  } catch {
    return defaultState;
  }
}

function saveState(next: LocalAuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getCurrentUser(): LocalUser | null {
  const state = loadState();
  if (!state.session.userId) return null;
  return state.users.find((user) => user.id === state.session.userId) ?? null;
}

export function getCurrentChurch(): LocalChurch | null {
  const state = loadState();
  const user = getCurrentUser();
  if (!user?.churchId) return null;
  return state.churches.find((church) => church.id === user.churchId) ?? null;
}

export function signUpLocal(params: {
  fullName?: string;
  email: string;
  password: string;
  churchSlug?: string;
  role?: LocalRole;
}): { error?: string; needsChurch: boolean } {
  const state = loadState();
  const existing = state.users.find((user) => user.email.toLowerCase() === params.email.toLowerCase());
  if (existing) {
    return { error: "Account already exists.", needsChurch: false };
  }

  const church = params.churchSlug
    ? state.churches.find((item) => item.slug.toLowerCase() === params.churchSlug?.toLowerCase())
    : null;

  if (params.churchSlug && !church) {
    return { error: "Church not found for that slug.", needsChurch: false };
  }

  const user: LocalUser = {
    id: `user-${Date.now()}`,
    fullName: params.fullName?.trim() || "",
    email: params.email.trim(),
    password: params.password,
    role: church ? params.role ?? "MEMBER" : "MEMBER",
    churchId: church?.id ?? null,
    status: "ACTIVE",
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  state.session.userId = user.id;
  saveState(state);

  return { needsChurch: !church };
}

export function signInLocal(params: {
  email: string;
  password: string;
}): { error?: string; needsChurch: boolean } {
  const state = loadState();
  const user = state.users.find((item) => item.email.toLowerCase() === params.email.toLowerCase());
  if (!user || user.password !== params.password) {
    return { error: "Invalid email or password.", needsChurch: false };
  }
  if (user.status === "DISABLED") {
    return { error: "This account is disabled.", needsChurch: false };
  }

  state.session.userId = user.id;
  saveState(state);

  return { needsChurch: !user.churchId };
}

export function signOutLocal() {
  const state = loadState();
  state.session.userId = null;
  saveState(state);
}

export function updateUserRole(userId: string, role: LocalRole) {
  const state = loadState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;
  user.role = role;
  saveState(state);
}

export function updateUserStatus(userId: string, status: "ACTIVE" | "DISABLED") {
  const state = loadState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;
  user.status = status;
  saveState(state);
}

export function createChurchLocal(params: {
  name: string;
  slug: string;
  timezone: string;
  serviceTimes: LocalServiceTime[];
  notificationSettings: LocalNotificationSettings;
}): { error?: string } {
  const state = loadState();
  const existing = state.churches.find((item) => item.slug.toLowerCase() === params.slug.toLowerCase());
  if (existing) {
    return { error: "Church slug already in use." };
  }

  const church: LocalChurch = {
    id: `church-${Date.now()}`,
    name: params.name.trim(),
    slug: params.slug.trim(),
    timezone: params.timezone.trim() || "America/New_York",
    serviceTimes: params.serviceTimes,
    notificationSettings: params.notificationSettings,
    createdAt: new Date().toISOString()
  };

  state.churches.push(church);

  if (state.session.userId) {
    const user = state.users.find((item) => item.id === state.session.userId);
    if (user) {
      user.churchId = church.id;
      user.role = "ADMIN";
    }
  }

  saveState(state);
  return {};
}

export function updateChurchLocal(churchId: string, updates: Partial<LocalChurch>) {
  const state = loadState();
  const church = state.churches.find((item) => item.id === churchId);
  if (!church) return;
  Object.assign(church, updates);
  saveState(state);
}

export function listMembers(churchId: string) {
  const state = loadState();
  return state.users.filter((user) => user.churchId === churchId);
}

export function createInvite(params: { email: string; role: LocalRole; churchId: string }) {
  const state = loadState();
  const invite: LocalInvite = {
    id: `invite-${Date.now()}`,
    churchId: params.churchId,
    email: params.email.trim(),
    role: params.role,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };
  state.invites.unshift(invite);
  saveState(state);
  return invite;
}

export function listInvites(churchId: string) {
  const state = loadState();
  return state.invites.filter((invite) => invite.churchId === churchId);
}

export function revokeInvite(inviteId: string) {
  const state = loadState();
  const invite = state.invites.find((item) => item.id === inviteId);
  if (!invite) return;
  invite.status = "REVOKED";
  saveState(state);
}
