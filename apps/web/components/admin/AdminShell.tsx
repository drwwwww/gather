"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Calendar, ClipboardList, LayoutDashboard, ListChecks, ListOrdered, LogOut, Megaphone, Search, Settings, Users } from "lucide-react";
import clsx from "clsx";
import { supabase } from "../../lib/supabaseClient";
import { Separator } from "../ui/separator";
import { Tooltip } from "../ui/tooltip";

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
    <div className="min-h-screen" style={{ background: 'var(--gather-bg)' }}>
      <div className="flex">
        <aside className="sticky top-0 z-50 hidden h-screen w-[72px] flex-col items-center border-r border-[var(--border)] px-3 py-4 lg:flex" style={{ background: 'var(--gather-surface)' }}>
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="Gather" className="h-8 w-8" />
          </div>
          <nav className="mt-6 flex flex-col gap-4">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = href === "/admin"
                ? pathname === href
                : pathname?.startsWith(href);
              return (
                <Tooltip key={href} content={label}>
                  <Link
                    href={href}
                    prefetch
                    className={clsx(
                      "relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      isActive && "text-primary bg-primary/10"
                    )}
                    aria-label={label}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: 'var(--gather-muted)' }} />
                  </Link>
                </Tooltip>
              );
            })}
          </nav>
          <div className="flex-1" />
          <Separator className="my-3 w-10" />
          <div className="flex flex-col items-center gap-4">
            <Tooltip content="Notifications">
              <Link
                href="/notifications"
                className={clsx(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  pathname === "/notifications" && "text-primary bg-primary/10"
                )}
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" style={{ color: 'var(--gather-muted)' }} />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-[#FFF8ED]">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                ) : null}
              </Link>
            </Tooltip>
            <Tooltip content="Settings">
              <Link
                href="/account"
                className={clsx(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  pathname === "/account" && "text-primary bg-primary/10"
                )}
                aria-label="Settings"
              >
                <Settings className="h-[18px] w-[18px]" style={{ color: 'var(--gather-muted)' }} />
              </Link>
            </Tooltip>
            <Tooltip content="Sign out">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Sign out"
                onClick={async () => {
                  await supabase?.auth.signOut();
                  router.push("/login");
                }}
              >
                <LogOut className="h-[18px] w-[18px]" style={{ color: 'var(--gather-muted)' }} />
              </button>
            </Tooltip>
          </div>
        </aside>

        <main className="flex-1 min-w-0" style={{ background: 'var(--gather-bg)' }}>
          <header className="sticky top-0 z-40 border-b border-[var(--border)]" style={{ background: 'var(--gather-bg)', backdropFilter: 'blur(8px)' }}>
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Church</p>
                <p className="text-sm font-semibold text-ink">{churchName}</p>
              </div>

              <form
                className="relative flex-1 max-w-xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  const trimmed = searchTerm.trim();
                  if (!trimmed) return;
                  router.push(`/admin/search?q=${encodeURIComponent(trimmed)}`);
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--gather-muted)' }} />
                <input
                  type="search"
                  placeholder="Search members, events, or records..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-lg bg-surface/60 py-2 pl-9 pr-3 text-sm text-ink outline-none ring-1 ring-transparent focus:ring-primary/40"
                />
              </form>

              <div className="ml-auto flex items-center gap-3">
                <Link
                  href="/account"
                  className="flex items-center gap-3 rounded-full bg-surface/60 px-3 py-1 transition hover:bg-primary/10"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-ink">{displayName}</p>
                    <p className="text-xs text-muted">{displayRole}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-10" style={{ background: 'var(--gather-bg)' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
