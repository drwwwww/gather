"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Where "set your password" links land: imported people (token_hash + type=invite
 * from /api/people/import), web password resets (PKCE ?code=) and mobile resets
 * (#access_token in the hash). An expired or used link offers a fresh one.
 */
type Stage = "checking" | "ready" | "expired" | "done";

function SetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const code = params.get("code");
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      let ok = false;
      try {
        if (tokenHash && (type === "invite" || type === "recovery" || type === "magiclink")) {
          const { error: e } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          ok = !e;
        } else if (code) {
          const { error: e } = await supabase.auth.exchangeCodeForSession(code);
          ok = !e;
        } else if (hash.get("access_token") && hash.get("refresh_token")) {
          const { error: e } = await supabase.auth.setSession({
            access_token: hash.get("access_token")!,
            refresh_token: hash.get("refresh_token")!,
          });
          ok = !e;
        }
        // Only an already-signed-in visitor with no link at all may use the
        // current session; a bad link must never set the password of whoever
        // happens to be signed in on this browser.
        const hadLink = !!(tokenHash || code || hash.get("access_token"));
        if (!ok && !hadLink) {
          const { data } = await supabase.auth.getSession();
          ok = !!data.session;
        }
      } catch {
        ok = false;
      }
      if (!cancelled) {
        if (ok) window.history.replaceState(null, "", "/auth/set-password");
        setStage(ok ? "ready" : "expired");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const { error: e2 } = await supabase.auth.updateUser({ password });
    if (e2) {
      setBusy(false);
      return setError(e2.message.includes("different") ? "Choose a password you haven't used before." : "We couldn't save that password. Try again.");
    }
    const { data: u } = await supabase.auth.getUser();
    const { data: profile } = u.user
      ? await supabase.from("profiles").select("role, church_id").eq("id", u.user.id).maybeSingle()
      : { data: null };
    if (profile?.role === "ADMIN") return router.replace("/admin");
    if (!profile?.church_id) return router.replace("/onboarding/create-church");
    setBusy(false);
    setStage("done");
  };

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/set-password` });
    setBusy(false);
    setResent(true);
  };

  const ios = process.env.NEXT_PUBLIC_GATHER_IOS_APP_URL?.trim();
  const android = process.env.NEXT_PUBLIC_GATHER_ANDROID_APP_URL?.trim();
  const input =
    "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
        <img src="/brand/mark-amber.png" alt="Gather" className="h-8 w-10 select-none" />

        {stage === "checking" && (
          <div className="mt-8 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your link…
          </div>
        )}

        {stage === "ready" && (
          <form onSubmit={save} className="mt-6 space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">Set your password</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">You&apos;ll use it to sign in to Gather on the web and in the app.</p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">New password</span>
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoFocus />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Type it again</span>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary inline-flex w-full items-center justify-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Saving…" : "Save password"}
            </button>
          </form>
        )}

        {stage === "done" && (
          <div className="mt-6 space-y-4">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">You&apos;re all set</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Get the Gather app to see your church&apos;s news, events and when you&apos;re serving. Sign in with your email and the password you just chose.
            </p>
            <div className="flex flex-wrap gap-2">
              {ios && <a href={ios} className="btn btn-primary">Get it for iPhone</a>}
              {android && <a href={android} className="btn btn-secondary">Get it for Android</a>}
              <a href="/member" className="btn btn-ghost">Continue on the web</a>
            </div>
          </div>
        )}

        {stage === "expired" && (
          <form onSubmit={resend} className="mt-6 space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">This link has expired</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Links work once and only for a while. Enter your email and we&apos;ll send a fresh one.
              </p>
            </div>
            {resent ? (
              <p className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)]">
                If that email has a Gather account, a new link is on its way. Open it on this device.
              </p>
            ) : (
              <>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Email</span>
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
                </label>
                <button type="submit" disabled={busy} className="btn btn-primary inline-flex w-full items-center justify-center gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send a new link
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordInner />
    </Suspense>
  );
}
