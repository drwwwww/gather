"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search, LayoutDashboard, Users, CalendarCheck, ClipboardList,
  Layers, Megaphone, Calendar, Bell, Settings, LogOut,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

function avatarFromUserMetadata(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  const url = m.avatar_url ?? m.picture;
  return typeof url === "string" && url.length > 0 ? url : null;
}

function adminInitials(fullName: string, email: string) {
  const n = fullName.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  return (email.split("@")[0] ?? "?").slice(0, 2).toUpperCase() || "?";
}

const NAV_MAIN = [
  { href: "/admin",                  label: "Dashboard",       icon: LayoutDashboard },
  { href: "/people",                 label: "People",          icon: Users           },
  { href: "/volunteers",             label: "Volunteers",      icon: CalendarCheck   },
  { href: "/admin/service-plans",    label: "Service Plans",   icon: ClipboardList   },
  { href: "/admin/service-presets",  label: "Service Presets", icon: Layers          },
  { href: "/announcements",          label: "Announcements",   icon: Megaphone       },
  { href: "/events",                 label: "Events",          icon: Calendar        },
];

function NavItem({
  href, label, icon: Icon, isActive, badge,
}: {
  href: string; label: string; icon: React.ElementType; isActive: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-medium no-underline transition-colors duration-150 ${
        isActive
          ? "bg-amber-50 text-amber-800"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      }`}
    >
      {isActive && (
        <span className="pointer-events-none absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-amber-500" aria-hidden />
      )}
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-600" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"}`} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState("Admin");
  const [churchName, setChurchName] = useState("Gather");
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationScope, setNotificationScope] = useState<{ userId: string; churchId: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const query = searchParams.get("q")?.trim();
    if (query && query !== searchTerm) setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return;

      setAvatarUrl(avatarFromUserMetadata(authData.user?.user_metadata));

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, role, church_id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) return;
      if (profile.role !== "ADMIN") {
        router.replace(pathname === "/account" ? "/member/account" : "/member");
        return;
      }
      setDisplayName(profile.full_name?.trim() || profile.email?.trim() || "Admin");
      setUserEmail(profile.email?.trim() ?? "");

      if (profile.church_id) {
        const { data: church } = await supabase.from("churches").select("name").eq("id", profile.church_id).maybeSingle();
        if (church?.name) setChurchName(church.name);
        setNotificationScope({ userId, churchId: profile.church_id });
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      if (!supabase || !notificationScope) return;
      const { count } = await supabase
        .from("notification_log")
        .select("id", { count: "exact", head: true })
        .eq("church_id", notificationScope.churchId)
        .is("read_at", null)
        .or(`user_id.eq.${notificationScope.userId},user_id.is.null`);
      setNotificationCount(count ?? 0);
    };
    refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("gather-notifications-updated", refresh);
      return () => window.removeEventListener("gather-notifications-updated", refresh);
    }
  }, [notificationScope]);

  const initials = adminInitials(displayName, userEmail);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname?.startsWith(href) ?? false;

  return (
    <div className="min-h-screen bg-[var(--app-canvas)]">
      <div className="flex">
        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside
          className="fixed left-0 top-0 z-[55] flex flex-col border-r border-[var(--border)] bg-[var(--bg)]"
          style={{ width: "var(--sidebar-w)", height: "100vh" }}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]">
            <img
              src="/logo.png"
              alt="Gather"
              className="h-8 w-8 shrink-0 rounded-xl object-cover select-none"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">Gather</p>
              {churchName && (
                <p className="truncate text-[10px] text-[var(--text-muted)]">{churchName}</p>
              )}
            </div>
          </div>

          {/* Main nav */}
          <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-3">
            <ul className="space-y-0.5 list-none p-0 m-0">
              {NAV_MAIN.map(({ href, label, icon }) => (
                <li key={href} className="list-none">
                  <NavItem href={href} label={label} icon={icon} isActive={isActive(href)} />
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom nav: notifications + settings */}
          <div className="border-t border-[var(--border)] px-2 py-2">
            <ul className="space-y-0.5 list-none p-0 m-0">
              <li className="list-none">
                <NavItem href="/notifications" label="Notifications" icon={Bell} isActive={isActive("/notifications")} badge={notificationCount} />
              </li>
              <li className="list-none">
                <NavItem href="/account" label="Settings" icon={Settings} isActive={isActive("/account")} />
              </li>
            </ul>
          </div>

          {/* User profile */}
          <div className="border-t border-[var(--border)] px-3 py-3">
            <div className="flex items-center gap-2.5">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-[var(--border)]" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                  {initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{displayName}</p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">Administrator</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/logout")}
                title="Sign out"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-red-500"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main
          className="flex min-h-screen min-w-0 flex-1 flex-col bg-[var(--app-canvas)] font-['Rubik',sans-serif]"
          style={{ marginLeft: "var(--sidebar-w)" }}
        >
          {/* Header */}
          <header className="sticky top-0 z-[60] flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg)] px-6 sm:px-8">
            {/* Search */}
            <form
              className="min-w-0 flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = searchTerm.trim();
                if (trimmed) router.push(`/admin/search?q=${encodeURIComponent(trimmed)}`);
              }}
              role="search"
            >
              <div className="relative flex h-9 max-w-sm items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                <input
                  type="search"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:ring-0"
                  placeholder="Search members, events, or plans…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search"
                />
              </div>
            </form>

            {/* Right: notification bell + avatar */}
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                aria-label={`Notifications${notificationCount > 0 ? ` — ${notificationCount} unread` : ""}`}
              >
                <Bell className="h-4.5 w-4.5" />
                {notificationCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px] items-center justify-center rounded-full bg-red-500" />
                )}
              </Link>
              <Link href="/account" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden transition-colors hover:ring-2 hover:ring-amber-300">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-9 w-9 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-[11px] font-bold text-amber-700">
                    {initials}
                  </span>
                )}
              </Link>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>

          <footer className="mt-auto flex flex-col gap-4 border-t border-[var(--border)] px-6 py-8 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© {new Date().getFullYear()} {churchName}. Powered by Gather.</p>
            <div className="flex gap-5">
              <a href="mailto:support@gatherministry.online" className="transition-colors hover:text-amber-600">Support</a>
              <Link href="/privacy" className="transition-colors hover:text-amber-600">Privacy</Link>
              <Link href="/account" className="transition-colors hover:text-amber-600">Settings</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
