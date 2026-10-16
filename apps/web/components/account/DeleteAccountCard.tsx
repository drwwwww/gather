"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/**
 * Self-serve permanent account deletion. Used on the admin and member account
 * pages, and on the public /delete-account page (where it only appears once
 * the visitor is signed in). Two-step: reveal, then type DELETE.
 */
export default function DeleteAccountCard({ variant = "app" }: { variant?: "app" | "public" }) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const armed = confirmText.trim().toUpperCase() === "DELETE";

  useEffect(() => {
    if (!supabase) { setSignedIn(false); return; }
    supabase.auth.getUser().then(({ data }: { data: { user: unknown } }) => setSignedIn(!!data.user));
  }, []);

  const handleDelete = async () => {
    if (!armed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(data.error ?? "We couldn't delete your account. Please try again."); setBusy(false); return; }
      await supabase?.auth.signOut().catch(() => {});
      router.replace("/?account=deleted");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  if (signedIn === null) return null;

  if (!signedIn) {
    return variant === "public" ? (
      <p>
        <Link href="/login?next=/delete-account">Sign in</Link> and this page will let you delete your account
        right here.
      </p>
    ) : null;
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
          <Trash2 className="h-4 w-4 text-red-700" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-red-900">Delete your account</h3>
          <p className="mt-1 text-sm leading-relaxed text-red-900/75">
            Permanently removes your sign-in, profile, photo, RSVPs, and notification history. Service plans you were
            on stay with your church — your backup steps in, or the slot reopens. This can&apos;t be undone.
          </p>

          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 inline-flex h-10 items-center rounded-xl border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Delete my account…
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <label htmlFor="delete-confirm" className="block text-sm text-red-900/80">
                Type <strong className="font-semibold text-red-900">DELETE</strong> to confirm
              </label>
              <input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-full max-w-xs rounded-xl border border-red-300 bg-white px-3 text-sm tracking-widest text-red-900 outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-200"
              />
              {error && (
                <p role="alert" className="text-sm text-red-800">{error}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!armed || busy}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {busy ? "Deleting…" : "Permanently delete account"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setConfirmText(""); setError(null); }}
                  className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-red-900/70 transition-colors hover:bg-red-100"
                >
                  Keep my account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
