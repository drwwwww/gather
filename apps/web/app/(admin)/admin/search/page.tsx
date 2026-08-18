"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Database } from "@gather/lib";
import { supabase } from "../../../../lib/supabaseClient";
import SearchResults from "../../../../components/search/SearchResults";
import { PageGrid, PageGridFull } from "../../../../components/layout/PageGrid";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = (searchParams.get("q") || "").trim();
  const [searchTerm, setSearchTerm] = useState(query);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);

  useEffect(() => { setSearchTerm(query); }, [query]);

  useEffect(() => {
    const runSearch = async () => {
      setError(null);
      if (!supabase) { setError("Supabase is not configured."); return; }
      if (!query) { setProfiles([]); setEvents([]); setAnnouncements([]); return; }

      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) { router.push(`/login?next=${encodeURIComponent(`/admin/search?q=${query}`)}`); return; }

      const { data: profile } = await supabase
        .from("profiles").select("church_id").eq("id", userId).maybeSingle();

      if (!profile?.church_id) { router.push("/onboarding/create-church"); return; }

      const like = `%${query}%`;
      const [profilesResult, eventsResult, announcementsResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, role")
          .eq("church_id", profile.church_id)
          .or(`full_name.ilike.${like},email.ilike.${like}`)
          .limit(5),
        supabase.from("events").select("id, title, start_at, location")
          .eq("church_id", profile.church_id).ilike("title", like)
          .order("start_at", { ascending: true }).limit(5),
        supabase.from("announcements").select("id, title, publish_at")
          .eq("church_id", profile.church_id).ilike("title", like)
          .order("publish_at", { ascending: false }).limit(5),
      ]);

      if (profilesResult.error || eventsResult.error || announcementsResult.error) {
        setError("Couldn't load search results. Please try again.");
        setLoading(false);
        return;
      }

      setProfiles((profilesResult.data ?? []) as ProfileRow[]);
      setEvents((eventsResult.data ?? []) as EventRow[]);
      setAnnouncements((announcementsResult.data ?? []) as AnnouncementRow[]);
      setLoading(false);
    };
    runSearch();
  }, [query, router]);

  const totalCount = profiles.length + events.length + announcements.length;

  const summary = useMemo(() => {
    if (!query || loading) return null;
    const parts = [];
    if (profiles.length)     parts.push(`${profiles.length} member${profiles.length === 1 ? "" : "s"}`);
    if (events.length)       parts.push(`${events.length} event${events.length === 1 ? "" : "s"}`);
    if (announcements.length) parts.push(`${announcements.length} announcement${announcements.length === 1 ? "" : "s"}`);
    return parts.length ? parts.join(" · ") : "No results";
  }, [query, loading, profiles.length, events.length, announcements.length]);

  return (
    <PageGrid>
      <PageGridFull>
        <div className="space-y-6 py-8">
          {/* Page header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {query ? `Results for "${query}"` : "Search"}
              </h1>
              {summary && (
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">{summary}</p>
              )}
            </div>

            {/* Refine search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = searchTerm.trim();
                if (trimmed) router.push(`/admin/search?q=${encodeURIComponent(trimmed)}`);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex h-9 items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Refine search…"
                  className="h-full w-56 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex h-9 items-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                Search
              </button>
            </form>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid animate-pulse gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : (
            <SearchResults
              query={query}
              profiles={profiles}
              events={events}
              announcements={announcements}
            />
          )}
        </div>
      </PageGridFull>
    </PageGrid>
  );
}
