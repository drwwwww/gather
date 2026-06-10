"use client";

import type { ReactNode, ReactNode as ReactNodeType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faPeopleGroup, faClipboardUser, faClipboardList, faHammer, faBullhorn, faCalendar, faBell, faGear } from "@fortawesome/free-solid-svg-icons";
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
    if (parts.length >= 2) {
      const a = parts[0][0];
      const b = parts[parts.length - 1][0];
      if (a && b) return `${a}${b}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email.split("@")[0] ?? "?").trim();
  return local.slice(0, 2).toUpperCase() || "?";
}

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
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

      setAvatarUrl(avatarFromUserMetadata(authData.user?.user_metadata));

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, role, church_id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) return;
      if (profile.role !== "ADMIN") {
        if (pathname === "/account" || pathname?.startsWith("/account/")) {
          router.replace("/member/account");
        } else {
          router.replace("/member");
        }
        return;
      }
      const name = profile.full_name?.trim() || profile.email?.trim() || "Admin";
      setDisplayName(name);
      setUserEmail(profile.email?.trim() ?? "");
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

  const initials = adminInitials(displayName, userEmail);

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-[#1b1c1a]">
      <div className="flex">
        {/* Sidebar — pre-Stitch: bg surface, rounded rows, primary left rail */}
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
          <div className="flex shrink-0 flex-col">
            <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Gather</span>
            <span className="text-xs text-[var(--text-muted)]">Admin</span>
          </div>

          <div className="h-px shrink-0 bg-[var(--divider)]" />

          <nav aria-label="Main navigation" className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <ul
              className="m-0 flex list-none flex-col p-0"
              style={{
                gap: "var(--sidebar-gap)",
                listStyle: "none",
              }}
            >
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive =
                  href === "/admin" ? pathname === href : pathname?.startsWith(href);
                return (
                  <li key={href} className="list-none" style={{ margin: 0, padding: 0 }}>
                    <Link
                      href={href}
                      className={`relative grid w-full grid-cols-[18px_1fr] items-center rounded-[14px] no-underline transition-colors duration-200 ease-out hover:no-underline hover:bg-[var(--surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-0 ${isActive ? "rounded-l-none bg-[var(--primary-soft)]" : "bg-transparent"}`}
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
                          className="pointer-events-none absolute bottom-px left-0 top-px w-1 rounded-full"
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
                      <span className="min-w-0 truncate text-sm font-medium leading-none">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 flex-col" style={{ paddingBottom: 0 }}>
            <div className="h-px shrink-0 bg-[var(--divider)]" />
            <nav aria-label="Account navigation" className="min-w-0 shrink-0">
              <ul
                className="m-0 flex list-none flex-col p-0"
                style={{
                  gap: "var(--sidebar-gap)",
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
                        <span className="inline-flex h-5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-500 px-2 text-[10px] font-semibold text-white">
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
                      className={`relative grid w-full grid-cols-[18px_1fr] items-center rounded-[14px] no-underline transition-colors duration-200 ease-out hover:no-underline hover:bg-[var(--surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-0 ${isActive ? "rounded-l-none bg-[var(--primary-soft)]" : "bg-transparent"}`}
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
                          className="pointer-events-none absolute bottom-px left-0 top-px w-1 rounded-full"
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
                        <span className="min-w-0 truncate text-sm font-medium leading-none">{label}</span>
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
        <main
          className="flex min-h-screen min-w-0 flex-1 flex-col bg-[var(--app-canvas)] font-['Rubik',sans-serif]"
          style={{ marginLeft: "var(--sidebar-w)" }}
        >
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-6 border-b border-stone-200 bg-[#fdfcf8] px-6 sm:px-10 lg:px-12">
            <form
              className="min-w-0 flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = searchTerm.trim();
                if (!trimmed) return;
                router.push(`/admin/search?q=${encodeURIComponent(trimmed)}`);
              }}
              role="search"
              aria-label="Admin search"
            >
              <div className="w-full max-w-md">
                <label className="sr-only" htmlFor="admin-search">
                  Search
                </label>
                <div className="relative flex h-11 max-w-sm items-center rounded-full bg-[var(--surface-container-low)] px-4 py-2 lg:max-w-md">
                  <Search className="pointer-events-none mr-2 h-5 w-5 shrink-0 text-stone-400" aria-hidden="true" />
                  <input
                    id="admin-search"
                    type="search"
                    className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[#1b1c1a] outline-none ring-0 placeholder:text-stone-400 focus:ring-0"
                    placeholder="Search members, events, or plans..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="Search members, events, or plans"
                  />
                </div>
              </div>
            </form>
            <div className="flex shrink-0 items-center gap-4 sm:gap-6">
              <Link
                href="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition-colors duration-150 hover:text-[#d97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/30 active:opacity-80"
                aria-label="Notifications"
              >
                <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
              <div className="flex min-w-0 items-center gap-3 border-l border-stone-200 pl-4 sm:pl-6">
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="max-w-[200px] truncate text-sm font-bold text-[#1b1c1a]">{displayName}</p>
                  <p className="truncate text-xs text-stone-500">{displayRole}</p>
                </div>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[var(--border)]"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-container-low)] text-xs font-bold text-[var(--nav-active-foreground)] ring-2 ring-[var(--border)]"
                    aria-hidden
                  >
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  className="hidden shrink-0 text-sm font-semibold text-stone-500 underline-offset-4 hover:text-[#d97706] hover:underline sm:inline"
                  onClick={() => router.push("/logout")}
                >
                  Log out
                </button>
              </div>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <footer className="mt-auto flex flex-col gap-4 border-t border-stone-100 px-6 py-10 text-sm text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
            <p className="m-0">
              © {new Date().getFullYear()} {churchName}. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link href="/join" className="transition-colors hover:text-[#f59e0b]">
                Support
              </Link>
              <Link href="/account" className="transition-colors hover:text-[#f59e0b]">
                Privacy
              </Link>
              <span className="text-stone-300">Documentation</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
