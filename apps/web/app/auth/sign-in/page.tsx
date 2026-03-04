"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        setError("We could not load your account. Please try again.");
        setErrorDetails(profileError.message);
        setLoading(false);
        return;
      }

      if (!profile?.church_id) {
        router.push("/onboarding/create-church");
      } else {
        router.push(nextUrl);
      }
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{ background: '#F6F2E6' }}>
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-[18px] p-8" style={{ background: '#EFE1C9', boxShadow: '0 2px 12px #e6d3b5' }}>
          <div className="mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="Gather" className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2B241C' }}>Sign in to Gather</h1>
          <p className="text-sm mb-4" style={{ color: '#7B735D' }}>Use your admin email and password.</p>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error ? <p className="text-sm text-error">{error}</p> : null}
            {error && errorDetails ? (
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="text-xs underline"
                style={{ color: '#7B735D' }}
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
            ) : null}
            {showDetails && errorDetails ? (
              <p className="text-xs" style={{ color: '#7B735D' }}>{errorDetails}</p>
            ) : null}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full rounded-[14px] py-3 px-4 font-semibold"
              style={{ background: '#F0CA8F', color: '#2B241C' }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <p className="mt-4 text-sm" style={{ color: '#7B735D' }}>
            Need an account? <Link href="/signup" className="underline">Create an admin account</Link>
          </p>
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
