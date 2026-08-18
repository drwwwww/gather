"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy, Check, Users } from "lucide-react";
import type { Role } from "@gather/lib";
import { buildInviteMessage } from "../../lib/format";

type InviteMembersFormProps = {
  churchName: string;
  joinLink: string;
  joinCode: string;
  onCreateInvites: (emails: string[], role: Role, message: string) => void;
};

const ROLE_OPTIONS: { value: Role; label: string; desc: string }[] = [
  { value: "MEMBER",  label: "Member",       desc: "Sees announcements and events, can RSVP" },
  { value: "SERVICE", label: "Service Team", desc: "Volunteers; can view and confirm service plans" },
  { value: "ADMIN",   label: "Admin",        desc: "Full access to manage the church" },
];

function parseEmails(value: string) {
  return value.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean);
}
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function RoleDropdown({ value, onChange }: { value: Role; onChange: (v: Role) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ROLE_OPTIONS.find((o) => o.value === value)!;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <span>{selected.label}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
          {ROLE_OPTIONS.map((opt) => (
            <li key={opt.value} className="list-none">
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)] ${opt.value === value ? "bg-amber-50" : ""}`}
              >
                <span className={`text-sm font-semibold ${opt.value === value ? "text-amber-700" : "text-[var(--text-primary)]"}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{opt.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InviteMembersForm({ churchName, joinLink, joinCode, onCreateInvites }: InviteMembersFormProps) {
  const [emailsRaw, setEmailsRaw] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const emailList = useMemo(() => parseEmails(emailsRaw), [emailsRaw]);
  const validEmails = useMemo(() => emailList.filter(isValidEmail), [emailList]);
  const invalidEmails = useMemo(() => emailList.filter((e) => !isValidEmail(e)), [emailList]);

  const handleGenerate = async () => {
    if (!validEmails.length) return;
    const msg = buildInviteMessage(churchName, joinCode, joinLink);
    setMessage(msg);
    onCreateInvites(validEmails, role, msg);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard may be restricted
    }
  };

  const handleCopyMessage = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="stitch-section-card space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Invite by email</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          Generate a personal invite message you can paste or forward. Each address is tracked here as a pending invite.
        </p>
      </div>

      {/* Email addresses */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Email addresses
          </label>
          {emailList.length > 0 && (
            <span className={`text-[11px] font-medium tabular-nums ${invalidEmails.length > 0 ? "text-amber-600" : "text-[var(--text-muted)]"}`}>
              {validEmails.length} valid{invalidEmails.length > 0 ? ` · ${invalidEmails.length} invalid` : ""}
            </span>
          )}
        </div>
        <textarea
          rows={4}
          placeholder="name@example.com, another@example.com"
          value={emailsRaw}
          onChange={(e) => setEmailsRaw(e.target.value)}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
        <p className="text-[11px] text-[var(--text-muted)]">Separate multiple addresses with commas or new lines.</p>
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Role</label>
        <RoleDropdown value={role} onChange={setRole} />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!validEmails.length}
        className="flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Generate &amp; copy invite message
      </button>

      {/* Generated message */}
      {message && (
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Invite message</p>
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                copied
                  ? "bg-green-50 text-green-700"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">{message}</p>
          {validEmails.length > 0 && (
            <p className="border-t border-[var(--border)] pt-2 text-[11px] text-[var(--text-muted)]">
              Saved as pending for: {validEmails.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
