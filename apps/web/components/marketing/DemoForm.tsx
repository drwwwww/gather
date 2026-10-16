"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import SelectMenu from "../ui/SelectMenu";

const SIZES = [
  { value: "under-50", label: "Under 50" },
  { value: "50-150", label: "50 – 150" },
  { value: "150-350", label: "150 – 350" },
  { value: "350-500", label: "350 – 500" },
  { value: "500-plus", label: "500+" },
];

const TIMES = [
  { value: "weekday-morning", label: "Weekday morning" },
  { value: "weekday-afternoon", label: "Weekday afternoon" },
  { value: "weekday-evening", label: "Weekday evening" },
  { value: "flexible", label: "I'm flexible" },
];

const field =
  "w-full rounded-xl border border-[var(--mk-line)] bg-white px-4 py-3 text-sm text-[var(--mk-ink)] outline-none transition-colors placeholder:text-[var(--mk-ink-faint)] focus:border-amber-400 focus:ring-2 focus:ring-[var(--primary-soft)]";
const label = "mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mk-ink-faint)]";

export default function DemoForm() {
  const [name, setName] = useState("");
  const [church, setChurch] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("50-150");
  const [when, setWhen] = useState("flexible");
  const [message, setMessage] = useState("");
  // Honeypot: hidden from people, filled in by form-spamming bots.
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(null);

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, church, email, phone, size, when, message, website }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "We couldn't send that. Please try again.");
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-[var(--mk-line)] bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="mk-h3 mt-6 text-[var(--mk-ink)]">Thank you — we&apos;ll be in touch.</h2>
        <p className="mk-lead mx-auto mt-4 max-w-md">
          We&apos;ve sent a confirmation to <strong className="font-medium text-[var(--mk-ink)]">{email}</strong>.
          Someone will reply within one business day to find a time that suits you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[var(--mk-line)] bg-white p-7 sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="demo-name">Your name</label>
          <input
            id="demo-name"
            className={field}
            placeholder="Pastor David Whitfield"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="demo-church">Church name</label>
          <input
            id="demo-church"
            className={field}
            placeholder="Grace Community Church"
            value={church}
            onChange={(e) => setChurch(e.target.value)}
            autoComplete="organization"
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="demo-email">Email</label>
          <input
            id="demo-email"
            type="email"
            className={field}
            placeholder="you@yourchurch.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="demo-phone">Phone (optional)</label>
          <input
            id="demo-phone"
            type="tel"
            className={field}
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div>
          <span className={label}>Congregation size</span>
          <SelectMenu
            value={size}
            onChange={setSize}
            options={SIZES}
            ariaLabel="Congregation size"
            buttonClassName="!h-[46px] !rounded-xl !px-4"
          />
        </div>
        <div>
          <span className={label}>Best time to talk</span>
          <SelectMenu
            value={when}
            onChange={setWhen}
            options={TIMES}
            ariaLabel="Best time to talk"
            buttonClassName="!h-[46px] !rounded-xl !px-4"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className={label} htmlFor="demo-message">
          Anything you&apos;d like us to focus on? (optional)
        </label>
        <textarea
          id="demo-message"
          rows={4}
          className={`${field} resize-y`}
          placeholder="We're mostly trying to fix volunteer scheduling for our worship and kids teams…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="demo-website">Website</label>
        <input
          id="demo-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--mk-amber)] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--mk-amber-deep)] disabled:opacity-60 sm:w-auto"
      >
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "sending" ? "Sending…" : "Request a demo"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-[var(--mk-ink-faint)]">
        We&apos;ll only use these details to arrange your demo. No newsletter, no
        reselling, no follow-up sequence.
      </p>
    </form>
  );
}
