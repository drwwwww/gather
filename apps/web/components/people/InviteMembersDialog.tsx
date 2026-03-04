"use client";

import { useMemo, useState } from "react";
// DaisyUI migration: use className markup for all UI
import { buildInviteMessage } from "../../lib/format";

export type InviteRole = "MEMBER" | "SERVICE" | "ADMIN";

type InviteMembersDialogProps = {
  open: boolean;
  churchName: string;
  joinLink: string;
  joinCode: string;
  onClose: () => void;
  onCreateInvites: (emails: string[], role: InviteRole, message: string) => void;
};

const parseEmails = (value: string) => {
  return value
    .split(/[\n,]/g)
    .map((email) => email.trim())
    .filter(Boolean);
};

export default function InviteMembersDialog({
  open,
  churchName,
  joinLink,
  joinCode,
  onClose,
  onCreateInvites
}: InviteMembersDialogProps) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<InviteRole>("MEMBER");
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-base-100 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Invite members</p>
            <p className="text-lg font-semibold text-base-content">Send a quick invite</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-base-content/60">Emails</label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              placeholder="Enter one or more emails, separated by commas or new lines"
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-base-content/60">Role</label>
            <select
              className="select select-bordered w-full"
              value={role}
              onChange={(event) => setRole(event.target.value as InviteRole)}
            >
              <option value="MEMBER">Member</option>
              <option value="SERVICE">Service team</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={handleGenerate} disabled={!emailList.length}>Generate invite message</button>
            <button className="btn btn-outline" onClick={handleCopy} disabled={!message}>Copy invite message</button>
          </div>
          {message ? (
            <div className="rounded-xl border border-base-200 bg-base-100 p-4 text-sm">
              <p className="font-medium text-base-content">Invite message</p>
              <p className="mt-2 text-base-content/60">{message}</p>
            </div>
          ) : null}
          {copyStatus ? <p className="text-xs text-base-content/60">{copyStatus}</p> : null}
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
