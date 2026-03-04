"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { churchOnboardingSchema } from "@gather/lib";
import { supabase } from "../../../lib/supabaseClient";

type ServiceDayChoice = "SATURDAY" | "SUNDAY" | "BOTH" | "CUSTOM" | "";

type Weekday = {
  label: string;
  value: number;
};

const weekdayOptions: Weekday[] = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 }
];

export default function CreateChurchOnboardingPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [timezone, setTimezone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceTime, setServiceTime] = useState("10:00");
  const [serviceDayChoice, setServiceDayChoice] = useState<ServiceDayChoice>("");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!timezone) {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(resolved || "America/New_York");
    }
  }, [timezone]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (serviceDayChoice !== "CUSTOM" && customDays.length) {
      setCustomDays([]);
    }
  }, [serviceDayChoice, customDays.length]);

  useEffect(() => {
    const checkProfile = async () => {
      if (!supabase) return;
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profile?.church_id) {
        router.push("/admin");
      }
    };

    checkProfile();
  }, [router]);

  const selectedDays = useMemo(() => {
    if (serviceDayChoice === "SATURDAY") return [6];
    if (serviceDayChoice === "SUNDAY") return [0];
    if (serviceDayChoice === "BOTH") return [0, 6];
    if (serviceDayChoice === "CUSTOM") return customDays;
    return [];
  }, [serviceDayChoice, customDays]);

  const handleToggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day]
    );
  };

  const handleCopyDetails = async () => {
    if (!errorDetails) return;
    try {
      await navigator.clipboard.writeText(errorDetails);
    } catch {
      setError("Unable to copy error details. Please copy manually.");
    }
  };

  const handleCreate = async () => {
    setError(null);
    setErrorDetails(null);
    setShowDetails(false);

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    if (!serviceDayChoice) {
      setError("Select your primary service day.");
      return;
    }

    const parsed = churchOnboardingSchema.safeParse({
      name,
      slug,
      timezone,
      serviceDayChoice,
      customDays,
      serviceTime
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    const serviceDays = Array.from(new Set(selectedDays)).sort((a, b) => a - b);
    if (serviceDays.length === 0) {
      setError("Select your primary service day.");
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("Your session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const { data: churchId, error: rpcError } = await supabase.rpc("bootstrap_church", {
      p_name: name,
      p_slug: slug,
      p_timezone: timezone
    });

    if (rpcError) {
      setError(getFriendlyErrorMessage(rpcError.message));
      setErrorDetails(rpcError.message);
      setLoading(false);
      return;
    }

    if (churchId) {
      const payload = serviceDays.map((day) => ({
        church_id: churchId,
        name: serviceName.trim() || "Main Service",
        day_of_week: day,
        start_time: serviceTime,
        timezone
      }));

      const { error: serviceError } = await supabase.from("service_times").insert(payload);
      if (serviceError) {
        setError("Couldn't create your church. Please try again.");
        setErrorDetails(serviceError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/admin");
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Set up your church</h1>
      <p className="mb-6 text-sm text-[var(--gather-muted)]">You're almost ready to manage schedules and updates.</p>

      <div className="grid gap-6">
        <section className="space-y-4 rounded-2xl bg-base-200 p-5">
          <h2 className="text-sm font-semibold text-base-content">Church basics</h2>
          <Input
            placeholder="Church name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Church code (e.g. newhope-atl)"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
          <p className="text-xs text-[var(--gather-muted)]">Used for members to join.</p>
          <Input
            placeholder="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
          <p className="text-xs text-[var(--gather-muted)]">Used for reminders and schedules.</p>
        </section>

        <section className="space-y-4 rounded-2xl bg-base-200 p-5">
          <h2 className="text-sm font-semibold text-base-content">Service schedule</h2>
          <div className="grid gap-3">
            <label className="text-xs text-[var(--gather-muted)]">Service day</label>
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                { label: "Saturday", value: "SATURDAY" },
                { label: "Sunday", value: "SUNDAY" },
                { label: "Both", value: "BOTH" },
                { label: "Custom", value: "CUSTOM" }
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={serviceDayChoice === option.value ? "primary" : "outline"}
                  onClick={() => setServiceDayChoice(option.value as ServiceDayChoice)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {serviceDayChoice === "CUSTOM" ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                {weekdayOptions.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={customDays.includes(day.value)}
                      onChange={() => handleToggleCustomDay(day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-[var(--gather-muted)]">Service time</label>
              <Input type="time" value={serviceTime} onChange={(e) => setServiceTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[var(--gather-muted)]">Service name (optional)</label>
              <Input placeholder="Main Service" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl bg-base-200 p-5">
          <h2 className="text-sm font-semibold text-base-content">Plan</h2>
          <div className="flex items-center justify-between rounded-xl bg-base-100 p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--gather-ink)]">Tier 1</p>
              <p className="text-xs text-[var(--gather-muted)]">Includes core scheduling and announcements.</p>
            </div>
            <p className="text-lg font-semibold text-[var(--gather-ink)]">$79/mo</p>
          </div>
          <p className="text-xs text-[var(--gather-muted)]">Billing setup will be completed after launch.</p>
        </section>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {errorDetails ? (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              className="text-[var(--gather-muted)] underline"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
            {showDetails ? (
              <button type="button" className="text-[var(--gather-muted)] underline" onClick={handleCopyDetails}>
                Copy details
              </button>
            ) : null}
          </div>
        ) : null}
        {showDetails && errorDetails ? (
          <textarea
            className="textarea textarea-bordered w-full text-xs"
            readOnly
            value={errorDetails}
            rows={3}
          />
        ) : null}

        <Button onClick={handleCreate} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create church"}
        </Button>
      </div>
    </main>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("churches_slug_key") || normalized.includes("duplicate key")) {
    return "That church code is taken. Try another.";
  }
  if (normalized.includes("auth session missing")) {
    return "Your session expired. Please sign in again.";
  }
  return "Couldn't create your church. Please try again.";
}
