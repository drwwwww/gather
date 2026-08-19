"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { destinationAfterSignIn, isJoinNextPath, sanitizeNextPath } from "../../lib/postLoginDestination";
import { coverForAuthTransition } from "../../lib/authTransition";

type Tab = "signin" | "signup";

// Swap this for any photo — ideally people in community / worship team
const PANEL_IMAGE_SRC =
  "https://images.unsplash.com/photo-1415226181422-279a51ca056e?w=1400&q=85";

const inputCls =
  "w-full rounded-xl border border-transparent bg-[#f7f0e7] px-4 py-2.5 text-sm text-[#1c1209] outline-none transition-all duration-150 placeholder:text-[#b8a898] focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9c8778]";

const FEATURES = ["Volunteer scheduling", "Service plans", "Announcements", "Events"];

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const nextUrl = rawNext ?? "/admin";

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "signup") setTab("signup");
  }, [searchParams]);

  // Raise the Dawn overlay, then navigate behind it once it covers the screen.
  const enterApp = useCallback(
    async (dest: string) => {
      await coverForAuthTransition();
      router.push(dest);
    },
    [router]
  );

  const clearMessages = () => {
    setError(null);
    setErrorDetails(null);
    setShowDetails(false);
    setResetSent(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    clearMessages();

    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(getFriendlySignInError(signInError.message));
      setErrorDetails(signInError.message);
    } else {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setError("We could not verify your session. Please try again.");
        setErrorDetails(authError.message);
        setLoading(false);
        return;
      }
      const userId = authData.user?.id;
      if (!userId) {
        setError("We could not verify your session. Please sign in again.");
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id, role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        await enterApp("/onboarding/create-church");
      } else if (!profile.church_id) {
        await enterApp("/onboarding/rejoin-church");
      } else {
        const dest = destinationAfterSignIn({ role: profile.role, nextPath: nextUrl });
        await enterApp(dest);
      }
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    clearMessages();

    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(getFriendlySignUpError(signUpError.message));
      setErrorDetails(signUpError.message);
    } else if (data.user) {
      if (isJoinNextPath(rawNext)) {
        const dest = sanitizeNextPath(rawNext) ?? "/join";
        await enterApp(dest);
      } else {
        await enterApp("/onboarding/create-church");
      }
    } else {
      setError("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "signin") void handleSignIn();
    else void handleSignUp();
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    clearMessages();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address first and we'll send a reset link.");
      return;
    }
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setForgotLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmed,
      redirectTo ? { redirectTo } : undefined
    );
    setForgotLoading(false);
    if (resetError) {
      setError("We couldn't send a reset email. Try again in a moment.");
      setErrorDetails(resetError.message);
      return;
    }
    setResetSent(true);
  };

  const switchTo = (next: Tab) => { setTab(next); clearMessages(); };


  return (
    <div className="flex h-dvh overflow-hidden font-['Rubik',sans-serif]">

      {/* ── LEFT BRAND PANEL ────────────────────────────── */}
      <aside
        className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] shrink-0 flex-col overflow-hidden"
        style={{ background: "#1d0d00" }}
      >
        {/* Background photo */}
        <img
          src={PANEL_IMAGE_SRC}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
        />
        {/* Warm dark overlay — espresso + amber tint so text stays legible */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(20,8,0,0.78) 0%, rgba(29,13,0,0.82) 50%, rgba(15,5,0,0.90) 100%)",
          }}
          aria-hidden
        />

        {/* Logo */}
        <header className="relative z-10 flex shrink-0 items-center gap-3 px-10 pt-10">
          <img src="/logo.png" alt="Gather" className="h-9 w-9 shrink-0 rounded-xl object-cover select-none" />
          <span className="text-xl font-black tracking-tight" style={{ color: "#fff8f0" }}>Gather</span>
        </header>

        {/* Headline block */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-10 pb-4 pt-10">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#f59e0b" }}>
            Church management software
          </p>

          <h1
            className="mb-6 text-[2.75rem] font-black leading-[1.04] tracking-tight xl:text-5xl"
            style={{ color: "#fff8f0", textWrap: "balance" } as React.CSSProperties}
          >
            Give your church<br />its time back.
          </h1>

          <p className="mb-10 max-w-xs text-base leading-relaxed" style={{ color: "#a08060" }}>
            The calm workspace for ministry teams. Coordinate volunteers, plan services, and reach your congregation — all in one place.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <span
                key={f}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: "rgba(245,158,11,0.13)", color: "#f59e0b" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 shrink-0 px-10 pb-10">
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="mb-4 text-sm leading-relaxed" style={{ color: "#c0a080" }}>
              "Gather cut our Sunday prep time in half. Our worship director spends 20 minutes on scheduling now — not two hours."
            </p>
            <div className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                style={{ background: "rgba(245,158,11,0.18)", color: "#f59e0b" }}
              >
                MK
              </span>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#d4b896" }}>Michael Kim</p>
                <p className="text-[10px]" style={{ color: "#7a6050" }}>Lead Pastor · Crossroads Community Church</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── RIGHT FORM PANEL ────────────────────────────── */}
      <main
        className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10"
        style={{ background: "#fffcf8" }}
      >
        {/* Mobile logo — only shows when brand panel is hidden */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <img src="/logo.png" alt="Gather" className="h-8 w-8 rounded-xl object-cover select-none" />
          <span className="text-lg font-black tracking-tight" style={{ color: "#1c1209" }}>Gather</span>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-7">
            <h2
              className="mb-1.5 text-2xl font-black tracking-tight"
              style={{ color: "#1c1209" }}
            >
              {tab === "signin" ? "Welcome back." : "Create your account."}
            </h2>
            <p className="text-sm leading-snug" style={{ color: "#9c8778" }}>
              {tab === "signin"
                ? "Sign in to manage your church's workspace."
                : "Start your profile, then invite your team."}
            </p>
          </div>

          {/* Segmented tab switcher */}
          <div
            className="mb-6 flex rounded-xl p-1"
            style={{ background: "#ede5da" }}
            role="tablist"
          >
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => switchTo(t)}
                className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150"
                style={
                  tab === t
                    ? { background: "#fff", color: "#1c1209", boxShadow: "0 1px 4px rgba(0,0,0,0.09)" }
                    : { color: "#9c8778" }
                }
              >
                {t === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className={labelCls} htmlFor="auth-full-name">Full name</label>
                <input
                  id="auth-full-name"
                  name="fullName"
                  autoComplete="name"
                  className={inputCls}
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className={labelCls} htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                className={inputCls}
                placeholder="hello@gatherchurch.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-end justify-between">
                <label className={labelCls} htmlFor="auth-password">Password</label>
                {tab === "signin" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    className="text-[11px] font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ color: "#f59e0b" }}
                  >
                    {forgotLoading ? "Sending…" : "Forgot password?"}
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                className={inputCls}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Feedback messages */}
            {resetSent && (
              <p className="text-xs leading-snug" style={{ color: "#9c8778" }}>
                Check your email for a password reset link.
              </p>
            )}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
                {errorDetails && (
                  <button
                    type="button"
                    onClick={() => setShowDetails((p) => !p)}
                    className="mt-1 text-[10px] text-red-400 underline"
                  >
                    {showDetails ? "Hide details" : "Show details"}
                  </button>
                )}
                {showDetails && errorDetails && (
                  <p className="mt-1 text-[10px] text-red-400">{errorDetails}</p>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.99] disabled:opacity-60"
              style={{ background: "#f59e0b" }}
            >
              {loading
                ? (tab === "signin" ? "Signing in…" : "Creating account…")
                : (tab === "signin" ? "Sign in" : "Create account")}
            </button>
          </form>

          {/* Switch mode */}
          <p className="mt-6 text-center text-sm" style={{ color: "#9c8778" }}>
            {tab === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => switchTo("signup")}
                  className="font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "#f59e0b" }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTo("signin")}
                  className="font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "#f59e0b" }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {tab === "signup" && (
            <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: "#b8a898" }}>
              By creating an account, you agree to our{" "}
              <Link href="/privacy" className="underline hover:opacity-70" style={{ color: "#9c8778" }}>
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function getFriendlySignInError(message: string) {
  const n = message.toLowerCase();
  if (n.includes("invalid login") || n.includes("invalid credentials")) {
    return "That email or password didn't match. Try again.";
  }
  if (n.includes("email not confirmed")) {
    return "Check your email to confirm your account, then sign in.";
  }
  return "We couldn't sign you in. Please try again.";
}

function getFriendlySignUpError(message: string) {
  const n = message.toLowerCase();
  if (n.includes("password") && n.includes("weak")) {
    return "Use at least 8 characters, including a number.";
  }
  if (n.includes("already registered") || (n.includes("email") && n.includes("exists"))) {
    return "An account already exists for this email. Sign in instead.";
  }
  return "We couldn't create your account. Please try again.";
}
