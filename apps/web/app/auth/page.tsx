"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { destinationAfterSignIn } from "../../lib/postLoginDestination";
import { Input } from "../../components/ui/input";

type Tab = "signin" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";
  const vantaRef = useRef<HTMLDivElement>(null);

  // Set initial tab from ?tab=signup
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "signup") setTab("signup");
  }, [searchParams]);

  useEffect(() => {
    let vantaEffect: any = null;

    const loadVanta = async () => {
      if (typeof window === "undefined") return;

      if (!(window as any).THREE) {
        const threeScript = document.createElement("script");
        threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js";
        document.head.appendChild(threeScript);
        await new Promise((resolve) => { threeScript.onload = resolve; });
      }

      if (!(window as any).VANTA?.CLOUDS) {
        const vantaScript = document.createElement("script");
        vantaScript.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js";
        document.head.appendChild(vantaScript);
        await new Promise((resolve) => { vantaScript.onload = resolve; });
      }

      if (vantaRef.current && (window as any).VANTA) {
        vantaEffect = (window as any).VANTA.CLOUDS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00
        });
      }
    };

    loadVanta();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setShowDetails(false);

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
    setError(null);
    setErrorDetails(null);

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
      router.push("/onboarding/create-church");
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

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Vanta Clouds background */}
      <div ref={vantaRef} className="absolute inset-0 w-full h-full" />

      {/* Centered card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 shadow-xl" style={{ background: "var(--surface)" }}>
          <div className="mb-6 flex justify-center">
            <img src="/logo.png" alt="Gather" className="h-12 w-12" />
          </div>

          {/* Tabs */}
          <div role="tablist" className="mb-6 flex w-full gap-2 rounded-[var(--radius-field)] p-2" style={{ background: "var(--surface-2)" }}>
            <button
              type="button"
              role="tab"
              className="flex-1 rounded-[calc(var(--radius-field)-4px)] px-4 py-3 text-sm font-medium transition-colors"
              style={
                tab === "signin"
                  ? { background: "var(--primary)", color: "white" }
                  : { background: "transparent", color: "var(--text-muted)" }
              }
              onClick={() => { setTab("signin"); setError(null); }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              className="flex-1 rounded-[calc(var(--radius-field)-4px)] px-4 py-3 text-sm font-medium transition-colors"
              style={
                tab === "signup"
                  ? { background: "var(--primary)", color: "white" }
                  : { background: "transparent", color: "var(--text-muted)" }
              }
              onClick={() => { setTab("signup"); setError(null); }}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" ? (
              <div>
                <label className="text-xs text-[var(--text-muted)]">Full name</label>
                <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
              </div>
            ) : null}

            <div>
              <label className="text-xs text-[var(--text-muted)]">Email</label>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>

            <div>
              <label className="text-xs text-[var(--text-muted)]">Password</label>
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>

            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            {error && errorDetails ? (
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="text-xs underline"
                style={{ color: "var(--text-muted)" }}
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
            ) : null}
            {showDetails && errorDetails ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{errorDetails}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (tab === "signin" ? "Signing in..." : "Creating...") : tab === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>
        </div>
      </div>
    </main>
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
