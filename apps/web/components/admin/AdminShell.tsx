"use client";

import type { ReactNode, ReactNode as ReactNodeType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faPeopleGroup, faClipboardUser, faClipboardList, faHammer, faBullhorn, faCalendar, faBell, faGear } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: () => <FontAwesomeIcon icon={faHouse} className="w-5 h-5" /> },
  { href: "/people", label: "People", icon: () => <FontAwesomeIcon icon={faPeopleGroup} className="w-5 h-5" /> },
  { href: "/volunteers", label: "Volunteers", icon: () => <FontAwesomeIcon icon={faClipboardUser} className="w-5 h-5" /> },
  { href: "/admin/service-plans", label: "Service Plans", icon: () => <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5" /> },
  { href: "/admin/service-presets", label: "Service Presets", icon: () => <FontAwesomeIcon icon={faHammer} className="w-5 h-5" /> },
  { href: "/announcements", label: "Announcements", icon: () => <FontAwesomeIcon icon={faBullhorn} className="w-5 h-5" /> },
  { href: "/events", label: "Events", icon: () => <FontAwesomeIcon icon={faCalendar} className="w-5 h-5" /> }
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
        {/* Sidebar - fixed so it stays visible when scrolling */}
        <aside
          className="fixed left-0 top-0 z-40 flex min-w-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--bg)]"
          style={{
            width: "var(--sidebar-w)",
            height: "100vh",
            boxSizing: "border-box",
            paddingTop: "var(--sidebar-pad-y)",
            paddingRight: "var(--sidebar-row-pad-x)",
            paddingBottom: "var(--sidebar-pad-y)",
            paddingLeft: "var(--sidebar-row-pad-x)",
            gap: "12px",
          }}
        >
          {/* Brand - no margin */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Gather
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Admin
            </span>
          </div>

          <div className="h-px shrink-0 bg-[var(--divider)]" />

          {/* Primary nav - scrollable so bottom links stay on screen */}
          <nav aria-label="Main navigation" className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <ul
              className="flex list-none flex-col"
              style={{
                gap: "var(--sidebar-gap)",
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive =
                  href === "/admin" ? pathname === href : pathname?.startsWith(href);
                return (
                  <li
                    key={href}
                    className="list-none"
                    style={{ margin: 0, padding: 0 }}
                  >
                    <Link
                      href={href}
                      className={`relative w-full grid grid-cols-[18px_1fr] items-center rounded-[14px] no-underline transition-colors duration-200 ease-out hover:no-underline hover:bg-[var(--surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-0 ${isActive ? "bg-[var(--primary-soft)]" : "bg-transparent"}`}
                      style={{
                        height: "var(--sidebar-row-h)",
                        padding: "0 10px",
                        margin: 0,
                        columnGap: "0.75rem",
                        color: isActive ? "var(--primary-hover)" : "var(--text-secondary)",
                        textDecoration: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-1 rounded-full pointer-events-none"
                          style={{ background: "var(--primary)" }}
                          aria-hidden
                        />
                      )}
                      <span
                        className="flex shrink-0 items-center justify-center overflow-hidden [&_svg]:size-full"
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          minHeight: "18px",
                          color: "inherit",
                        }}
                        aria-hidden
                      >
                        <Icon />
                      </span>
                      <span className="truncate text-sm font-medium leading-none min-w-0">
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom block: divider + nav + space so links sit above viewport bottom */}
          <div className="flex shrink-0 flex-col" style={{ paddingBottom: "0px" }}>
            <div className="h-px shrink-0 bg-[var(--divider)]" />
            <nav aria-label="Account navigation" className="min-w-0 shrink-0">
              <ul
                className="flex list-none flex-col"
                style={{
                  gap: "var(--sidebar-gap)",
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                }}
              >
                {[
                  {
                    href: "/notifications",
                    label: "Notifications",
                    icon: () => <FontAwesomeIcon icon={faBell} className="w-5 h-5" />,
                    isActive: pathname === "/notifications",
                    endAdornment:
                      notificationCount > 0 ? (
                        <span className="inline-flex h-5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-2 text-[10px] font-semibold text-white">
                          {notificationCount > 99 ? "99+" : notificationCount}
                        </span>
                      ) : null,
                  },
                  {
                    href: "/account",
                    label: "Account",
                    icon: () => <FontAwesomeIcon icon={faGear} className="w-5 h-5" />,
                    isActive: pathname === "/account",
                    endAdornment: null as ReactNodeType | null,
                  },
                ].map(({ href, label, icon: Icon, isActive, endAdornment }) => (
                  <li key={href} className="list-none" style={{ margin: 0, padding: 0 }}>
                    <Link
                      href={href}
                      className={`relative w-full grid grid-cols-[18px_1fr] items-center rounded-[14px] no-underline transition-colors duration-200 ease-out hover:no-underline hover:bg-[var(--surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-0 ${isActive ? "bg-[var(--primary-soft)]" : "bg-transparent"}`}
                      style={{
                        height: "var(--sidebar-row-h)",
                        padding: "0 10px",
                        margin: 0,
                        columnGap: "0.75rem",
                        color: isActive ? "var(--primary-hover)" : "var(--text-secondary)",
                        textDecoration: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-1 rounded-full pointer-events-none"
                          style={{ background: "var(--primary)" }}
                          aria-hidden
                        />
                      )}
                      <span
                        className="flex shrink-0 items-center justify-center overflow-hidden [&_svg]:size-full"
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          minHeight: "18px",
                          color: "inherit",
                        }}
                        aria-hidden
                      >
                        <Icon />
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium leading-none min-w-0">
                          {label}
                        </span>
                        {endAdornment}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 min-w-0" style={{ marginLeft: "var(--sidebar-w)" }}>
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
                <FontAwesomeIcon icon={faBell} className="w-5 h-5 text-[var(--text-muted)]" />
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
