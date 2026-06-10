"use client";

import { useMemo, useState } from "react";
import type { Role } from "@gather/lib";
import { buildInviteMessage } from "../../lib/format";

type InviteMembersFormProps = {
  churchName: string;
  joinLink: string;
  joinCode: string;
  onCreateInvites: (emails: string[], role: Role, message: string) => void;
};

const parseEmails = (value: string) => {
  return value
    .split(/[\n,]/g)
    .map((email) => email.trim())
    .filter(Boolean);
};

export default function InviteMembersForm({
  churchName,
  joinLink,
  joinCode,
  onCreateInvites
}: InviteMembersFormProps) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const emailList = useMemo(() => parseEmails(emails), [emails]);

  const handleGenerate = () => {
    if (!emailList.length) return;
    const nextMessage = buildInviteMessage(churchName, joinCode, joinLink);
    setMessage(nextMessage);
    onCreateInvites(emailList, role, nextMessage);
  };

  const handleCopy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("Invite message copied.");
    } catch {
      setCopyStatus("Unable to copy invite message.");
    }
  };

  return (
    <div className="card card-elevated p-5">
      <div className="card-title">Invite by email</div>
      <p className="mt-1 text-sm text-base-content/60">
        Generate a message you can paste into email. Addresses are tracked here so you can see pending invites on the
        People page.
      </p>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-muted)]">Emails</label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={4}
            placeholder="Enter one or more emails, separated by commas or new lines"
            value={emails}
            onChange={(event) => setEmails(event.target.value)}
          />
          <p className="text-xs text-[var(--text-muted)]">Separate multiple addresses with commas or new lines.</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-base-content/60">Role</label>
          <select
            className="select select-bordered w-full"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            <option value="MEMBER">Member</option>
            <option value="SERVICE">Service team</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary-gradient" onClick={handleGenerate} disabled={!emailList.length}>
            Generate invite message
          </button>
          <button type="button" className="btn btn-outline-amber" onClick={handleCopy} disabled={!message}>
            Copy invite message
          </button>
        </div>
        {message ? (
          <div className="card bg-[var(--surface-2)] p-4 text-sm">
            <p className="font-medium text-base-content">Invite message</p>
            <p className="mt-2 whitespace-pre-wrap text-base-content/80">{message}</p>
          </div>
        ) : null}
        {copyStatus ? <p className="text-xs text-base-content/60">{copyStatus}</p> : null}
      </div>
    </div>
  );
}
