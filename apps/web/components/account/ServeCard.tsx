"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartHandshake, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

type VolunteerRole = { id: string; name: string };

export default function ServeCard({
  churchId,
  onRequested
}: {
  churchId: string;
  onRequested: () => void;
}) {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      setLoadingRoles(true);
      const { data } = await supabase
        .from("volunteer_roles")
        .select("id, name")
        .eq("church_id", churchId)
        .order("name");
      if (!cancelled) {
        setRoles((data as VolunteerRole[]) ?? []);
        setLoadingRoles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [churchId]);

  const toggleRole = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const roleIds = useMemo(() => Array.from(selected), [selected]);

  const handleSubmit = async () => {
    if (!supabase) return;
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("request_to_serve", {
      p_role_ids: roleIds,
      p_note: note.trim() || null
    });
    setSubmitting(false);
    if (rpcError) {
      setError("Couldn't send your request. Please try again.");
      return;
    }
    setDone(true);
    onRequested();
  };

  if (done) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">You're on the service team</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Your church admin has been notified. They'll be in touch about upcoming ways to serve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
          <HeartHandshake className="h-4.5 w-4.5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Interested in serving?</h2>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Let your church know you'd like to volunteer. Both fields below are optional.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Where you'd like to serve
        </label>
        {loadingRoles ? (
          <div className="h-9 w-full animate-pulse-subtle rounded-full bg-[var(--surface-2)]" />
        ) : roles.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            No specific roles are listed yet — that's okay, submit a general request below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => {
              const active = selected.has(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  {role.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]" htmlFor="serve-note">
          Anything else to share? (optional)
        </label>
        <textarea
          id="serve-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. I've led worship before, or I'm available most Sundays"
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end border-t border-[var(--border)] pt-4">
        <button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-primary-gradient btn-sm">
          {submitting ? "Sending…" : "Request to serve"}
        </button>
      </div>
    </div>
  );
}
