"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@gather/lib";
import { supabase } from "../../../../lib/supabaseClient";
import AdminHeader from "../../../../components/admin/AdminHeader";
// DaisyUI migration: use className markup for all UI
import SearchResults from "../../../../components/search/SearchResults";
import { Input } from "../../../../components/ui/input";
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

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    const runSearch = async () => {
      setError(null);
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }
      if (!query) {
        setProfiles([]);
        setEvents([]);
        setAnnouncements([]);
        return;
      }

      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        router.push(`/login?next=${encodeURIComponent(`/admin/search?q=${query}`)}`);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.church_id) {
        router.push("/onboarding/create-church");
        return;
      }

      const searchValue = `%${query}%`;

      const [profilesResult, eventsResult, announcementsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("church_id", profile.church_id)
          .or(`full_name.ilike.${searchValue},email.ilike.${searchValue}`)
          .limit(5),
        supabase
          .from("events")
          .select("id, title, start_at, location")
          .eq("church_id", profile.church_id)
          .ilike("title", searchValue)
          .order("start_at", { ascending: true })
          .limit(5),
        supabase
          .from("announcements")
          .select("id, title, publish_at")
          .eq("church_id", profile.church_id)
          .ilike("title", searchValue)
          .order("publish_at", { ascending: false })
          .limit(5)
      ]);

      if (profilesResult.error || eventsResult.error || announcementsResult.error) {
        setError("We couldn't load search results. Please try again.");
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

  const summary = useMemo(() => {
    if (!query) return "";
    const memberCount = profiles.length;
    const eventCount = events.length;
    const announcementCount = announcements.length;
    return `${memberCount} member${memberCount === 1 ? "" : "s"} | ${eventCount} event${eventCount === 1 ? "" : "s"} | ${announcementCount} announcement${announcementCount === 1 ? "" : "s"}`;
  }, [query, profiles.length, events.length, announcements.length]);

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <AdminHeader
          title="Search Results"
          subtitle={query ? `Showing matches for "${query}"` : "Enter a search term to get started."}
          className="mb-8"
        />
      </PageGridFull>

      <PageGridFull className="animate-fade-in-up [animation-delay:50ms] opacity-0">
        <div className="card p-6 border border-primary/10">
          <form
            className="flex flex-wrap items-center gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = searchTerm.trim();
              if (!trimmed) return;
              router.push(`/admin/search?q=${encodeURIComponent(trimmed)}`);
            }}
          >
            <div className="flex-1 min-w-[220px]">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search members, events, or announcements"
              />
            </div>
            <button type="submit" className="btn btn-primary-gradient">Search</button>
            {summary ? <p className="text-xs text-base-content/60">{summary}</p> : null}
          </form>
        </div>
      </PageGridFull>

      {error ? (
        <PageGridFull>
          <p className="text-sm text-error">{error}</p>
        </PageGridFull>
      ) : null}
      
      {loading ? (
        <PageGridFull className="animate-pulse-subtle">
          <div className="card h-[400px] bg-[var(--surface)]" />
        </PageGridFull>
      ) : (
        <PageGridFull className="animate-fade-in-up [animation-delay:100ms] opacity-0">
          <SearchResults
            query={query}
            profiles={profiles}
            events={events}
            announcements={announcements}
          />
        </PageGridFull>
      )}
    </PageGrid>
  );
}
