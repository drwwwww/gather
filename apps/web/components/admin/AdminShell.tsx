"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Users, CalendarCheck, ClipboardList,
  Layers, Megaphone, Calendar, Bell, Settings, LogOut, Radio, HeartPulse,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Avatar from "../ui/avatar";
import CommandPalette, { type PaletteDestination } from "./CommandPalette";

function avatarFromUserMetadata(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  const url = m.avatar_url ?? m.picture;
  return typeof url === "string" && url.length > 0 ? url : null;
}

/** Grouped by the job an admin is doing — nine flat links were hard to scan. */
const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/admin",                 label: "Dashboard",       icon: LayoutDashboard },
      { href: "/live",                  label: "Live Service",    icon: Radio           },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/volunteers",            label: "Volunteers",      icon: CalendarCheck   },
      // Templates (service presets) live inside Service Plans, not in the nav.
      { href: "/admin/service-plans",   label: "Service Plans",   icon: ClipboardList   },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/people",                label: "People",          icon: Users           },
      { href: "/insights",              label: "Team Health",     icon: HeartPulse      },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/announcements",         label: "Announcements",   icon: Megaphone       },
      { href: "/events",                label: "Events",          icon: Calendar        },
    ],
  },
];

/** Everything ⌘K can jump to, including pages that aren't in the nav. */
const PALETTE_DESTINATIONS: PaletteDestination[] = [
  ...NAV_GROUPS.flatMap((g) => g.items.map(({ href, label, icon }) => ({ href, label, icon }))),
  { href: "/admin/service-presets", label: "Service templates", icon: Layers },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/account", label: "Settings", icon: Settings },
];

function NavItem({
  href, label, icon: Icon, isActive, badge,
}: {
  href: string; label: string; icon: React.ElementType; isActive: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`sidebar-item group relative flex items-center gap-3 rounded-xl px-3 text-sm font-medium no-underline transition-colors duration-150 ${
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationScope, setNotificationScope] = useState<{ userId: string; churchId: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setShortcutLabel("⌘K");
  }, []);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return;

      setAvatarUrl(avatarFromUserMetadata(authData.user?.user_metadata));

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, role, church_id, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) return;
      // The photo members upload (mobile or Account) wins over an OAuth picture.
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
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
    // Account page fires this after a photo upload/removal so the header updates in place.
    const onAvatar = (e: Event) => setAvatarUrl((e as CustomEvent<string | null>).detail ?? null);
    window.addEventListener("gather-avatar-updated", onAvatar);
    return () => window.removeEventListener("gather-avatar-updated", onAvatar);
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


  // ⌘K / Ctrl+K or "/" opens search from anywhere (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === href;
    // Templates are part of Service Plans.
    if (href === "/admin/service-plans" && pathname?.startsWith("/admin/service-presets")) return true;
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="min-h-screen bg-[var(--app-canvas)]">
      <div className="flex">
        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside
          className="fixed left-0 top-0 z-[55] flex flex-col border-r border-[var(--border)] bg-[var(--bg)]"
          style={{ width: "var(--sidebar-w)", height: "100vh" }}
        >
          {/* Church identity */}
          <div className="flex shrink-0 items-center gap-2.5 px-4 pb-2 pt-4">
            <img
              src="/logo.png"
              alt=""
              className="h-8 w-8 shrink-0 rounded-xl object-cover select-none"
            />
            <div className="min-w-0">
              <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-[var(--text-primary)]" title={churchName}>{churchName}</p>
              <p className="truncate text-[10px] leading-tight text-[var(--text-muted)]">Gather</p>
            </div>
          </div>

          {/* Search — opens the ⌘K panel */}
          <div className="shrink-0 px-2 pb-1 pt-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-keyshortcuts="Control+K Meta+K /"
              className="sidebar-item group flex w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-left">Search</span>
              <kbd className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-['Rubik',sans-serif] text-[10px] font-medium text-[var(--text-muted)]">{shortcutLabel}</kbd>
            </button>
          </div>

          {/* Main nav */}
          <nav aria-label="Main navigation" className="sidebar-nav min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-1">
            {/* Groups spread to fill the column (up to a cap), so there's no dead space under the last link. */}
            <div className="sidebar-groups flex min-h-full flex-col justify-between">
              {NAV_GROUPS.map((group, gi) => (
                <div key={group.label ?? gi}>
                  {group.label && (
                    <p className="sidebar-label mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{group.label}</p>
                  )}
                  <ul className="space-y-0.5 list-none p-0 m-0">
                    {group.items.map(({ href, label, icon }) => (
                      <li key={href} className="list-none">
                        <NavItem href={href} label={label} icon={icon} isActive={isActive(href)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
              <Avatar
                name={displayName}
                email={userEmail}
                imageUrl={avatarUrl}
                size={32}
                className="bg-amber-100 text-[10px] font-bold text-amber-700"
              />
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

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>

          <footer className="mt-auto flex flex-col gap-3 border-t border-[var(--border)] px-6 py-5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© {new Date().getFullYear()} {churchName}. Powered by Gather.</p>
            <div className="flex gap-5">
              <a href="mailto:support@gatherministry.online" className="transition-colors hover:text-amber-600">Support</a>
              <Link href="/privacy" className="transition-colors hover:text-amber-600">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-amber-600">Terms</Link>
              <Link href="/account" className="transition-colors hover:text-amber-600">Settings</Link>
            </div>
          </footer>
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        churchId={notificationScope?.churchId ?? null}
        destinations={PALETTE_DESTINATIONS}
      />
    </div>
  );
}
