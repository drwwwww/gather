"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Church } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { destinationAfterSignIn, isJoinNextPath, sanitizeNextPath } from "../../lib/postLoginDestination";

type Tab = "signin" | "signup";

const fieldClassName =
  "w-full rounded-md border-none bg-[var(--surface-container-low)] px-3.5 py-2 text-sm leading-normal text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-[background-color,box-shadow] duration-150 focus:bg-[var(--surface-container-lowest)] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#f59e0b]/35 sm:px-4 sm:py-2.5";

const HERO_IMAGE_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPjkR_zM1Zxlr0RHD5UPk8_iogbwgLl6LmI1UY-rXjoML7zUvnmfmCbRXjIQIp68Yv15MVoHCe2SUEkdwwxYzOFLpqghaGxG6nc8fg1fTSbsj1v9xkKdd98dSMh1C9kTFr8jg00jVOqx_Iu6jp5BQlN1GspqnbS3giaXNGIR9vrykn5qFHPp7K7J7K1PLNRYZSPRfZyojv8ZOtmwkhG0SW9IEWw_ZwYDpBE4HX17tPv4moiUbAOOwkZHt35AF4fYM_aucSpvbz7sxJ";

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
        router.push("/onboarding/create-church");
      } else if (!profile.church_id) {
        router.push("/onboarding/rejoin-church");
      } else {
        const dest = destinationAfterSignIn({ role: profile.role, nextPath: nextUrl });
        router.push(dest);
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
      options: { data: { full_name: fullName } }
    });

    if (signUpError) {
      setError(getFriendlySignUpError(signUpError.message));
      setErrorDetails(signUpError.message);
    } else if (data.user) {
      if (isJoinNextPath(rawNext)) {
        const dest = sanitizeNextPath(rawNext) ?? "/join";
        router.push(dest);
      } else {
        router.push("/onboarding/create-church");
      }
    } else {
      setError("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "signin") handleSignIn();
    else handleSignUp();
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    clearMessages();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address and we will send a reset link.");
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
      setError("We could not send a reset email. Try again in a moment.");
      setErrorDetails(resetError.message);
      return;
    }
    setResetSent(true);
  };

  const headline = tab === "signin" ? "Welcome back." : "Create your account.";
  const subline =
    tab === "signin"
      ? "Step back into your community sanctuary. We've missed you."
      : "Start your church profile, then invite your team.";

  const labelClass = "ml-0.5 block text-[0.65rem] font-bold uppercase tracking-wider text-[#5e5f5c] sm:text-xs";

  return (
    <div
      className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden overscroll-none selection:bg-[#f59e0b]/25 md:flex-row"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <main
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-6 py-6 md:w-1/2 md:shrink-0 md:px-8 md:py-8 lg:px-10"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <header className="mb-5 flex shrink-0 items-center gap-2 md:mb-7">
          <Church className="h-5 w-5 shrink-0 text-[#f59e0b] sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
          <span className="text-lg font-black tracking-tighter text-[#1b1c1a] md:text-xl">Gather</span>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-[20.5rem] flex-1 flex-col sm:max-w-xs md:max-w-sm">
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-0.5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-4 md:mb-5">
            <h1 className="mb-1.5 text-xl font-black leading-tight tracking-tight text-[#1b1c1a] md:mb-2 md:text-2xl lg:text-[1.55rem]">
              {headline}
            </h1>
            <p className="text-sm leading-snug text-[#5e5f5c] md:text-[0.9375rem] md:leading-relaxed">{subline}</p>
          </div>

          <div className="mb-4 flex gap-4 border-b border-[#d8c3ad]/20 md:mb-5 md:gap-5" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "signin"}
              className={`rounded-t-md pb-2 text-sm transition-colors duration-150 md:pb-2.5 md:text-[0.95rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/35 ${
                tab === "signin"
                  ? "-mb-px border-b-2 border-[#f59e0b] font-bold text-[#f59e0b]"
                  : "-mb-px border-b-2 border-transparent font-medium text-[#5e5f5c] hover:text-[#1b1c1a]"
              }`}
              onClick={() => {
                setTab("signin");
                clearMessages();
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "signup"}
              className={`rounded-t-md pb-2 text-sm transition-colors duration-150 md:pb-2.5 md:text-[0.95rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/35 ${
                tab === "signup"
                  ? "-mb-px border-b-2 border-[#f59e0b] font-bold text-[#f59e0b]"
                  : "-mb-px border-b-2 border-transparent font-medium text-[#5e5f5c] hover:text-[#1b1c1a]"
              }`}
              onClick={() => {
                setTab("signup");
                clearMessages();
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "signup" ? (
              <div className="space-y-1">
                <label className={labelClass} htmlFor="auth-full-name">
                  Full name
                </label>
                <input
                  id="auth-full-name"
                  name="fullName"
                  autoComplete="name"
                  className={fieldClassName}
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            ) : null}

            <div className="space-y-1">
              <label className={labelClass} htmlFor="auth-email">
                Email Address
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                className={fieldClassName}
                placeholder="hello@gatherchurch.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-end justify-between">
                <label className={labelClass} htmlFor="auth-password">
                  Password
                </label>
                {tab === "signin" ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    className="rounded-sm text-[0.65rem] font-bold text-[#f59e0b] decoration-2 underline-offset-2 transition-opacity duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/35 active:opacity-80 disabled:opacity-60 sm:text-xs sm:underline-offset-4"
                  >
                    {forgotLoading ? "Sending…" : "Forgot Password?"}
                  </button>
                ) : null}
              </div>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                className={fieldClassName}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {resetSent ? (
              <p className="text-xs leading-snug text-[#5e5f5c] sm:text-sm">Check your email for a link to reset your password.</p>
            ) : null}
            {error ? <p className="text-xs leading-snug text-[var(--danger)] sm:text-sm">{error}</p> : null}
            {error && errorDetails ? (
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="rounded-sm text-xs text-[#9ca3af] underline transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/25 active:opacity-70"
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
            ) : null}
            {showDetails && errorDetails ? <p className="text-[0.625rem] text-[#9ca3af] sm:text-xs">{errorDetails}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] py-2 text-sm font-bold text-white shadow-[var(--shadow-organic)] transition-[opacity,filter] duration-150 hover:opacity-90 active:brightness-[0.96] active:saturate-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-60 md:py-2.5 md:text-base"
            >
              {loading ? (tab === "signin" ? "Signing in…" : "Creating…") : tab === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <footer className="mx-auto mt-12 max-w-none pb-6 pt-2 text-center text-balance md:mx-0 md:mt-14 md:text-left">
            {tab === "signin" ? (
              <p className="text-base leading-relaxed text-[#5e5f5c]">
                New to our community?{" "}
                <button
                  type="button"
                  className="rounded-sm font-bold text-[#f59e0b] decoration-2 underline-offset-4 transition-opacity duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/40 active:opacity-75"
                  onClick={() => {
                    setTab("signup");
                    clearMessages();
                  }}
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-base leading-relaxed text-[#5e5f5c]">
                Already part of the community?{" "}
                <button
                  type="button"
                  className="rounded-sm font-bold text-[#f59e0b] decoration-2 underline-offset-4 transition-opacity duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f59e0b]/40 active:opacity-75"
                  onClick={() => {
                    setTab("signin");
                    clearMessages();
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
          </footer>
          </div>
        </div>
      </main>

      <aside className="relative hidden min-h-0 min-w-0 overflow-hidden md:flex md:h-full md:w-1/2 md:shrink-0">
        <img
          src={HERO_IMAGE_SRC}
          alt="Sun-drenched sanctuary interior"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#855300]/40 via-transparent to-transparent" />
      </aside>

      <div
        className="pointer-events-none fixed bottom-0 left-0 z-10 h-px w-full bg-gradient-to-r from-transparent via-[#f59e0b]/12 to-transparent md:h-1 md:via-[#f59e0b]/18"
        aria-hidden
      />
    </div>
  );
}

function getFriendlySignInError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
    return "That email or password didn't match. Try again.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Check your email to confirm your account, then sign in.";
  }
  return "We couldn't sign you in. Please try again.";
}

function getFriendlySignUpError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("password") && normalized.includes("weak")) {
    return "Use at least 8 characters, including a number.";
  }
  if (normalized.includes("already registered") || (normalized.includes("email") && normalized.includes("exists"))) {
    return "An account already exists for this email. Sign in instead.";
  }
  return "We couldn't create your account. Please try again.";
}
