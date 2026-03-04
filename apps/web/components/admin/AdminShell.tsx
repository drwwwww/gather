"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Calendar, ClipboardList, LayoutDashboard, ListChecks, ListOrdered, LogOut, Megaphone, Search, Settings, Users } from "lucide-react";
import clsx from "clsx";
import { supabase } from "../../lib/supabaseClient";
// Removed ProfileDropdown (dropdown) import
import Avatar from "../ui/avatar";
// ...existing code...

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/people", label: "People", icon: Users },
  { href: "/volunteers", label: "Volunteers", icon: ClipboardList },
  { href: "/admin/service-plans", label: "Service Plans", icon: ListChecks },
  { href: "/admin/service-presets", label: "Service Presets", icon: ListOrdered },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/events", label: "Events", icon: Calendar }
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState("Admin");
  const [displayRole, setDisplayRole] = useState("Administrator");
  const [churchName, setChurchName] = useState("Gather");
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationScope, setNotificationScope] = useState<{ userId: string; churchId: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const query = searchParams.get("q")?.trim();
    if (query && query !== searchTerm) {
      setSearchTerm(query);
    }
  }, [searchParams, searchTerm]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, role, church_id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) return;
      const name = profile.full_name?.trim() || profile.email?.trim() || "Admin";
      setDisplayName(name);
      setDisplayRole(profile.role === "ADMIN" ? "Administrator" : profile.role.toLowerCase());

      if (profile.church_id) {
        const { data: church } = await supabase
          .from("churches")
          .select("name")
          .eq("id", profile.church_id)
          .maybeSingle();
        if (church?.name) {
          setChurchName(church.name);
        }
        setNotificationScope({ userId, churchId: profile.church_id });
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const refreshNotificationCount = async () => {
      if (!supabase || !notificationScope) return;
      const { count } = await supabase
        .from("notification_log")
        .select("id", { count: "exact", head: true })
        .eq("church_id", notificationScope.churchId)
        .is("read_at", null)
        .or(`user_id.eq.${notificationScope.userId},user_id.is.null`);
      setNotificationCount(count ?? 0);
    };

    refreshNotificationCount();

    if (typeof window !== "undefined") {
      const handler = () => refreshNotificationCount();
      window.addEventListener("gather-notifications-updated", handler);
      return () => window.removeEventListener("gather-notifications-updated", handler);
    }
  }, [notificationScope]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 z-40 h-screen w-56 md:w-52 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] flex transition-all duration-200">
          <div className="flex flex-col items-start gap-2 px-3 py-4">
            <img src="/logo.png" alt="Gather" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-[var(--ink)]">Gather</span>
          </div>
          <nav className="flex flex-col gap-2 px-2">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = href === "/admin"
                ? pathname === href
                : pathname?.startsWith(href);
              return (
                <li
                  key={href}
                  className={clsx(
                    "rounded-xl relative group",
                    isActive && "before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-[var(--primary)]"
                  )}
                >
                  <Link
                    href={href}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 active:scale-[0.99]",
                      isActive
                        ? "bg-[var(--primary-soft)] text-[var(--primary)] font-medium hover:bg-[var(--primary-hover)] hover:text-[var(--ink)] hover:font-semibold"
                        : "text-[var(--ink)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)] hover:font-semibold",
                    )}
                  >
                    <Icon className={clsx("h-5 w-5", isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100")} />
                    <span className="text-sm">{label}</span>
                  </Link>
                </li>
              );
            })}
          </nav>
          <div className="flex-1" />
          <div className="border-t border-[var(--border)] my-4 mx-2" />
          <div className="flex flex-col gap-2 px-2 pb-4">
            <Link
              href="/notifications"
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-[var(--ink)] transition-colors duration-150 active:scale-[0.99]",
                pathname === "/notifications" && "bg-[var(--primary-soft)] text-[var(--primary)] font-medium",
                pathname !== "/notifications" && "hover:bg-[var(--surface-2)]"
              )}
            >
              <Bell className="h-5 w-5" />
              <span className="text-sm">Notifications</span>
              {notificationCount > 0 && (
                <span className="ml-auto rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-semibold text-[var(--surface)]">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-[var(--ink)] transition-colors duration-150 active:scale-[0.99]",
                pathname === "/account" && "bg-[var(--primary-soft)] text-[var(--primary)] font-medium",
                pathname !== "/account" && "hover:bg-[var(--surface-2)]"
              )}
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm">Account</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <header
            className="sticky top-0 z-30 flex items-center h-[64px] bg-white border-b border-[var(--border)] px-8"
            style={{ boxShadow: "none" }}
          >
            {/* Left: Org name + context */}
            <div className="flex flex-col justify-center min-w-0" style={{ flex: '0 0 auto', height: 64 }}>
              <span
                className="uppercase tracking-wide text-[11px] font-semibold text-[var(--muted)] mb-1 pl-0.5"
                style={{ letterSpacing: '0.06em', lineHeight: '1.2' }}
              >
                Church
              </span>
              <span
                className="text-[28px] leading-[32px] font-semibold text-neutral-900 tracking-tight truncate max-w-[240px]"
                style={{ letterSpacing: '-0.01em', lineHeight: '1.1' }}
              >
                {churchName}
              </span>
              {/* Context badge (optional, placeholder for now) */}
              {/* <span className="ml-2 px-2 py-0.5 rounded bg-[var(--muted)] text-xs font-medium text-[var(--ink)]">Org</span> */}
            </div>
            {/* Center: Full-width search */}
            <form
              className="flex-1 flex justify-center px-8"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = searchTerm.trim();
                if (!trimmed) return;
                router.push(`/admin/search?q=${encodeURIComponent(trimmed)}`);
              }}
              role="search"
              aria-label="Admin search"
            >
              <div className="w-full max-w-[420px]">
                <label className="sr-only" htmlFor="admin-search">Search</label>
                <div className="relative">
                  <input
                    id="admin-search"
                    type="search"
                    className="h-10 w-full rounded-[10px] border border-[var(--border)] px-10 text-[14px] bg-white placeholder:text-[var(--muted)] transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none hover:border-[color-mix(in_srgb,var(--border),#000_8%)]"
                    placeholder="Search members, events, or records..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="Search members, events, or records"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            </form>
            {/* Right: Profile dropdown + notifications */}
            <div className="flex items-center gap-4 min-w-0" style={{ flex: '0 0 auto', height: 64 }}>
              {/* Notifications icon */}
              <Link
                href="/notifications"
                className="relative flex items-center justify-center w-10 h-10 rounded-[10px] hover:bg-[var(--muted)] transition-colors duration-150"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-[var(--muted)]" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
              {/* Minimal avatar and menu button */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                  {displayName.charAt(0)}
                </div>
                <button
                  className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs border"
                  onClick={() => router.push("/logout")}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-7xl px-8 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
