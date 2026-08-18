"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChevronDown, ChevronLeft, ArrowRight, Clock, MapPinPlus,
  Church, CalendarClock, PartyPopper, Users, LayoutDashboard
} from "lucide-react";
import { churchOnboardingSchema } from "@gather/lib";
import { supabase } from "../../../lib/supabaseClient";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const TIMEZONES: { label: string; value: string }[] = [
  { label: "Eastern Time (ET)", value: "America/New_York" },
  { label: "Central Time (CT)", value: "America/Chicago" },
  { label: "Mountain Time (MT)", value: "America/Denver" },
  { label: "Mountain Time – Arizona", value: "America/Phoenix" },
  { label: "Pacific Time (PT)", value: "America/Los_Angeles" },
  { label: "Alaska Time", value: "America/Anchorage" },
  { label: "Hawaii Time", value: "Pacific/Honolulu" },
  { label: "Atlantic Time (AT)", value: "America/Halifax" },
  { label: "Puerto Rico (AST)", value: "America/Puerto_Rico" },
  { label: "Toronto (ET)", value: "America/Toronto" },
  { label: "Vancouver (PT)", value: "America/Vancouver" },
  { label: "Winnipeg (CT)", value: "America/Winnipeg" },
  { label: "Mexico City", value: "America/Mexico_City" },
  { label: "Bogotá", value: "America/Bogota" },
  { label: "Lima", value: "America/Lima" },
  { label: "São Paulo", value: "America/Sao_Paulo" },
  { label: "Buenos Aires", value: "America/Argentina/Buenos_Aires" },
  { label: "Santiago", value: "America/Santiago" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris", value: "Europe/Paris" },
  { label: "Berlin", value: "Europe/Berlin" },
  { label: "Rome", value: "Europe/Rome" },
  { label: "Madrid", value: "Europe/Madrid" },
  { label: "Amsterdam", value: "Europe/Amsterdam" },
  { label: "Zurich", value: "Europe/Zurich" },
  { label: "Stockholm", value: "Europe/Stockholm" },
  { label: "Helsinki", value: "Europe/Helsinki" },
  { label: "Athens", value: "Europe/Athens" },
  { label: "Istanbul", value: "Europe/Istanbul" },
  { label: "Moscow", value: "Europe/Moscow" },
  { label: "Cairo", value: "Africa/Cairo" },
  { label: "Nairobi", value: "Africa/Nairobi" },
  { label: "Johannesburg", value: "Africa/Johannesburg" },
  { label: "Lagos", value: "Africa/Lagos" },
  { label: "Accra (GMT)", value: "Africa/Accra" },
  { label: "Jerusalem", value: "Asia/Jerusalem" },
  { label: "Dubai", value: "Asia/Dubai" },
  { label: "Karachi", value: "Asia/Karachi" },
  { label: "Kolkata (IST)", value: "Asia/Kolkata" },
  { label: "Dhaka", value: "Asia/Dhaka" },
  { label: "Bangkok", value: "Asia/Bangkok" },
  { label: "Singapore", value: "Asia/Singapore" },
  { label: "Shanghai", value: "Asia/Shanghai" },
  { label: "Tokyo", value: "Asia/Tokyo" },
  { label: "Seoul", value: "Asia/Seoul" },
  { label: "Manila", value: "Asia/Manila" },
  { label: "Sydney", value: "Australia/Sydney" },
  { label: "Melbourne", value: "Australia/Melbourne" },
  { label: "Brisbane", value: "Australia/Brisbane" },
  { label: "Perth", value: "Australia/Perth" },
  { label: "Auckland", value: "Pacific/Auckland" },
  { label: "Fiji", value: "Pacific/Fiji" },
];

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const label = TIMEZONES.find((tz) => tz.value === value)?.label ?? value;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? TIMEZONES.filter((tz) => tz.label.toLowerCase().includes(q) || tz.value.toLowerCase().includes(q)) : TIMEZONES;
  }, [search]);

  const openDropdown = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setAnchor({ left: r.left + window.scrollX, top: r.bottom + window.scrollY + 4, width: r.width });
    setOpen(true);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openDropdown}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
      >
        <span className="truncate">{label || "Select timezone"}</span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && anchor && createPortal(
        <div
          ref={listRef}
          className="fixed z-[999] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
          style={{ left: anchor.left, top: anchor.top, width: Math.max(anchor.width, 280) }}
        >
          <div className="border-b border-[var(--border)] px-3 py-2">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search timezones…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-[var(--text-muted)]">No matches</li>
            )}
            {filtered.map((tz) => (
              <li key={tz.value}>
                <button
                  type="button"
                  onClick={() => { onChange(tz.value); setOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-amber-50 hover:text-amber-800 ${value === tz.value ? "font-semibold text-amber-600" : "text-[var(--text-primary)]"}`}
                >
                  {tz.label}
                  <span className="ml-2 text-xs text-[var(--text-muted)]">{tz.value}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}

// ── time picker (15-min intervals, matches the picker used across the rest of the app) ──
function formatTimeLabel(value: string): string {
  if (!value) return "";
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts: { label: string; value: string }[] = [];
  for (let h = 5; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const h12 = h % 12 || 12;
      opts.push({
        label: `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
        value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      });
    }
  }
  return opts;
})();

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open || !value || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>("[data-active='true']");
    if (active) active.scrollIntoView({ block: "center" });
  }, [open, value]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ left: r.left, top: r.bottom + 6 });
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
      >
        <Clock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <span className={value ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
          {value ? formatTimeLabel(value) : "Set time"}
        </span>
        <ChevronDown className={`ml-auto h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && anchor && typeof document !== "undefined" && createPortal(
        <ul
          ref={listRef}
          style={{ position: "fixed", left: anchor.left, top: anchor.top, width: 160 }}
          className="z-[1001] max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
        >
          {TIME_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} className="list-none" data-active={String(active)}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${active ? "bg-amber-500 font-semibold text-white" : "text-[var(--text-primary)] hover:bg-[var(--surface-2)]"}`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}

type ServiceDayChoice = "SATURDAY" | "SUNDAY" | "BOTH" | "CUSTOM" | "";

type Weekday = { label: string; value: number };

const weekdayOptions: Weekday[] = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 }
];

type WizardStep = 1 | 2 | 3;

const WIZARD_STEPS: { n: WizardStep; label: string; icon: typeof Church }[] = [
  { n: 1, label: "Church basics", icon: Church },
  { n: 2, label: "Service schedule", icon: CalendarClock },
  { n: 3, label: "You're set", icon: PartyPopper },
];

export default function CreateChurchOnboardingPage() {
  const [step, setStep] = useState<WizardStep>(1);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [showAddress, setShowAddress] = useState(false);
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
  const [checkingSlug, setCheckingSlug] = useState(false);
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
      } else if (profile && !profile.church_id) {
        router.push("/onboarding/rejoin-church");
      }
    };

    checkProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const clearMessages = () => {
    setError(null);
    setErrorDetails(null);
    setShowDetails(false);
  };

  // Step 1 → 2: validate the basics and pre-flight the slug so nobody fills out
  // the whole schedule step only to hit "church code taken" at the very end.
  const handleContinueFromBasics = async () => {
    clearMessages();

    if (!name.trim()) { setError("Enter your church name to continue."); return; }
    if (!slug.trim()) { setError("Enter a church code to continue."); return; }
    if (!timezone) { setError("Select a timezone to continue."); return; }
    if (!supabase) { setError("Supabase is not configured."); return; }

    setCheckingSlug(true);
    const { data: existing, error: slugError } = await supabase
      .from("churches")
      .select("id")
      .eq("slug", slug.trim())
      .maybeSingle();
    setCheckingSlug(false);

    if (slugError) {
      setError("Couldn't verify your church code. Please try again.");
      setErrorDetails(slugError.message);
      return;
    }
    if (existing) {
      setError("That church code is taken. Try another.");
      return;
    }

    setStep(2);
  };

  const handleCreate = async () => {
    clearMessages();

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

      if (address.trim()) {
        await supabase.from("churches").update({ address: address.trim() }).eq("id", churchId);
      }
    }

    setLoading(false);
    setStep(3);
  };

  const progressPct = ((step - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <img src="/logo.png" alt="Gather" className="h-8 w-8 rounded-xl object-cover select-none" />
          <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">Gather</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
          {step === 3 ? "You're all set" : "Set up your church"}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          {step === 3 ? "Your workspace is ready to go." : "Two quick steps and you're ready to manage schedules and updates."}
        </p>
      </div>

      {/* Stepper */}
      <div className="mx-auto mb-9 w-full max-w-sm">
        <div className="relative mb-3 h-1 rounded-full bg-[var(--surface-2)]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map(({ n, label, icon: Icon }) => {
            const state = n < step ? "done" : n === step ? "active" : "upcoming";
            return (
              <div key={n} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    state === "done" ? "bg-amber-500 text-white" : "",
                    state === "active" ? "bg-amber-500 text-white ring-4 ring-amber-100" : "",
                    state === "upcoming" ? "bg-[var(--surface-2)] text-[var(--text-muted)]" : "",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className={`text-center text-[10px] font-semibold leading-tight ${state === "upcoming" ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 1: Church basics ─────────────────────────────────────── */}
      {step === 1 && (
        <div key="step-1" className="animate-fade-in-up space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Church name</label>
            <Input
              className="h-11"
              placeholder="e.g. New Hope Church"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Church code</label>
            <Input
              className="h-11"
              placeholder="newhope-atl"
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
            />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {slug ? (
                <>Members will join at{" "}
                  <span className="font-mono text-amber-600">
                    {typeof window !== "undefined" ? window.location.origin : "https://gather.app"}/join/{slug}
                  </span>
                </>
              ) : "Fill in your church name above to auto-generate a join code."}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Timezone</label>
            <TimezoneSelect value={timezone} onChange={setTimezone} />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">Used for reminders and service times. We've guessed this from your device.</p>
          </div>

          {/* Address — de-emphasized, optional, collapsed by default */}
          {showAddress ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Address <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
              <Input
                className="h-11"
                placeholder="123 Main St, Atlanta, GA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddress(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-amber-600"
            >
              <MapPinPlus className="h-3.5 w-3.5" />
              Add a church address
              <span className="font-normal text-[var(--text-muted)]">— optional, you can skip this</span>
            </button>
          )}

          <ErrorBlock
            error={error} errorDetails={errorDetails} showDetails={showDetails}
            onToggleDetails={() => setShowDetails((p) => !p)} onCopy={handleCopyDetails}
          />

          <Button onClick={handleContinueFromBasics} loading={checkingSlug} className="w-full" rightIcon={!checkingSlug ? <ArrowRight /> : undefined}>
            {checkingSlug ? "Checking availability…" : "Continue"}
          </Button>
        </div>
      )}

      {/* ── Step 2: Service schedule ──────────────────────────────────── */}
      {step === 2 && (
        <div key="step-2" className="animate-fade-in-up space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Which day do you meet?</label>
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
                  variant={serviceDayChoice === option.value ? "primary" : "secondary"}
                  onClick={() => setServiceDayChoice(option.value as ServiceDayChoice)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {serviceDayChoice === "CUSTOM" ? (
              <div className="mt-1 grid gap-2 sm:grid-cols-4">
                {weekdayOptions.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Service time</label>
              <TimePicker value={serviceTime} onChange={setServiceTime} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Service name <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
              <Input className="h-11" placeholder="Main Service" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
            </div>
          </div>

          <ErrorBlock
            error={error} errorDetails={errorDetails} showDetails={showDetails}
            onToggleDetails={() => setShowDetails((p) => !p)} onCopy={handleCopyDetails}
          />

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => { clearMessages(); setStep(1); }} leftIcon={<ChevronLeft />}>
              Back
            </Button>
            <Button onClick={handleCreate} loading={loading} className="flex-1">
              {loading ? "Creating your church…" : "Create church"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: You're set ────────────────────────────────────────── */}
      {step === 3 && (
        <div key="step-3" className="animate-fade-in-up flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-onboarding-ring-expand rounded-full bg-amber-400" aria-hidden />
            <span className="animate-onboarding-pop-in relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <PartyPopper className="h-7 w-7" strokeWidth={2.25} />
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">
            {name || "Your church"} is ready
          </h2>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
            Your workspace is live. The fastest way to feel the benefit is to get your team in — it only takes a minute.
          </p>

          <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
            <Button className="w-full" leftIcon={<Users />} onClick={() => router.push("/people/invite")}>
              Invite your team
            </Button>
            <Button variant="secondary" className="w-full" leftIcon={<LayoutDashboard />} onClick={() => router.push("/admin")}>
              Go to dashboard
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function ErrorBlock({
  error, errorDetails, showDetails, onToggleDetails, onCopy
}: {
  error: string | null; errorDetails: string | null; showDetails: boolean;
  onToggleDetails: () => void; onCopy: () => void;
}) {
  if (!error) return null;
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
      <p className="text-sm text-red-600">{error}</p>
      {errorDetails && (
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px]">
          <button type="button" className="text-red-400 underline" onClick={onToggleDetails}>
            {showDetails ? "Hide details" : "Show details"}
          </button>
          {showDetails && (
            <button type="button" className="text-red-400 underline" onClick={onCopy}>
              Copy details
            </button>
          )}
        </div>
      )}
      {showDetails && errorDetails && (
        <textarea
          className="textarea textarea-bordered mt-2 w-full text-xs"
          readOnly
          value={errorDetails}
          rows={2}
        />
      )}
    </div>
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
