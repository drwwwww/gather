"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const router = useRouter();

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
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (signUpError) {
      setError(getFriendlySignUpError(signUpError.message));
      setErrorDetails(signUpError.message);
    } else {
      const newUser = data.user;
      if (!newUser) {
        setError("Check your email to confirm your account, then sign in.");
        setLoading(false);
        return;
      }
      router.push("/onboarding/create-church");
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
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2B241C' }}>Create your admin account</h1>
          <p className="text-sm mb-4" style={{ color: '#7B735D' }}>You'll set up your church next.</p>

          <div className="space-y-4">
            <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error ? <p className="text-sm text-error">{error}</p> : null}
            {error && errorDetails ? <p className="text-xs" style={{ color: '#7B735D' }}>{errorDetails}</p> : null}
            <Button onClick={handleSignUp} disabled={loading} className="w-full rounded-[14px] py-3 px-4 font-semibold" style={{ background: '#F0CA8F', color: '#2B241C' }}>
              {loading ? "Creating..." : "Sign up"}
            </Button>
          </div>

          <p className="mt-4 text-sm" style={{ color: '#7B735D' }}>
            Already have an account? <Link href="/login" className="underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
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
