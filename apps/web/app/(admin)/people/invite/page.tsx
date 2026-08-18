"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Mail, MessageSquare, Printer, Check } from "lucide-react";
import type { Role } from "@gather/lib";
import { PageGrid, PageGridFull } from "../../../../components/layout/PageGrid";
import InviteMembersForm from "../../../../components/people/InviteMembersForm";
import type { InviteEntry } from "../../../../components/people/memberUtils";
import { buildJoinLink, buildInviteMessage } from "../../../../lib/format";
import { appendPendingInvites } from "../../../../lib/pendingInvitesStorage";
import { getCurrentContext } from "../../../../lib/supabaseData";

export default function PeopleInviteHubPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codeParam = (searchParams.get("code") ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [churchName, setChurchName] = useState("");
  const [churchSlug, setChurchSlug] = useState("");
  const [churchId, setChurchId] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await getCurrentContext();
      if (!context) { router.replace("/login?next=/people/invite"); return; }
      if (context.profile.role !== "ADMIN") { router.replace("/member"); return; }

      const slug = context.church.slug;
      setChurchName(context.church.name);
      setChurchSlug(slug);
      setChurchId(context.church.id);

      if (codeParam && codeParam.toLowerCase() !== slug.toLowerCase()) {
        setError(`This page is for church code "${slug}". The code in the URL doesn't match your church.`);
      }

      if (typeof window !== "undefined") {
        const link = buildJoinLink(window.location.origin, slug);
        setJoinLink(link);
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(link)}`);
      }
    } catch {
      setError("Unable to load your church. Try again from the People page.");
    } finally {
      setLoading(false);
    }
  }, [codeParam, router]);

  useEffect(() => { void load(); }, [load]);

  const smsBody = useMemo(() => {
    if (!churchName || !churchSlug || !joinLink) return "";
    return buildInviteMessage(churchName, churchSlug, joinLink);
  }, [churchName, churchSlug, joinLink]);

  const smsHref = useMemo(() => smsBody ? `sms:?&body=${encodeURIComponent(smsBody)}` : "", [smsBody]);
  const mailtoHref = useMemo(() => {
    if (!smsBody) return "";
    return `mailto:?subject=${encodeURIComponent(`Join ${churchName} on Gather`)}&body=${encodeURIComponent(smsBody)}`;
  }, [churchName, smsBody]);

  const handleInviteCreate = (emails: string[], role: Role, message: string) => {
    const now = new Date().toISOString();
    const newInvites: InviteEntry[] = emails.map((email) => ({
      id: `invite-${email.toLowerCase()}-${now}`,
      email,
      role,
      message,
      createdAt: now,
    }));
    appendPendingInvites(churchId, newInvites);
  };

  const handleCopyLink = async () => {
    if (!joinLink) return;
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Unable to copy join link.");
    }
  };

  if (loading) {
    return (
      <PageGrid>
        <PageGridFull>
          <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8 animate-pulse">
            <div className="h-5 w-24 rounded-lg bg-[var(--surface-2)]" />
            <div className="h-8 w-64 rounded-xl bg-[var(--surface-2)]" />
            <div className="h-64 rounded-2xl bg-[var(--surface-2)]" />
            <div className="h-56 rounded-2xl bg-[var(--surface-2)]" />
          </div>
        </PageGridFull>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <PageGridFull>
        <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
          {/* Back nav */}
          <Link
            href="/people"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            People
          </Link>

          {/* Page heading */}
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Invite people to {churchName || "your church"}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Share the join code or link — anyone with it can sign up and join. You can also generate a personal invite message below.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Join link card */}
          <div className="stitch-section-card">
            <div className="flex items-start gap-6">
              {/* Left: code + link + actions */}
              <div className="flex-1 space-y-5">
                {/* Church code */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Join code</p>
                  <p className="mt-1.5 text-3xl font-bold tracking-[0.2em] text-[var(--text-primary)]">
                    {churchSlug.toUpperCase()}
                  </p>
                </div>

                {/* Join link */}
                {joinLink && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Join link</p>
                    <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{joinLink}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-150 ${
                      copied
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 text-[var(--text-muted)]" />}
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                  {mailtoHref && (
                    <a
                      href={mailtoHref}
                      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-[var(--surface)]"
                    >
                      <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                      Email
                    </a>
                  )}
                  {smsHref && (
                    <a
                      href={smsHref}
                      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-[var(--surface)]"
                    >
                      <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" />
                      SMS
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)]"
                  >
                    <Printer className="h-4 w-4 text-[var(--text-muted)]" />
                    Print
                  </button>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] print:hidden">
                  Email and SMS open your device's default apps with the message pre-filled.
                </p>
              </div>

              {/* Right: QR code */}
              {qrUrl && (
                <div className="shrink-0 print:block">
                  <img src={qrUrl} alt="QR code for join link" className="h-36 w-36 rounded-xl" />
                  <p className="mt-1.5 text-center text-[10px] text-[var(--text-muted)]">Scan to join</p>
                </div>
              )}
            </div>
          </div>

          {/* Email invite form */}
          <InviteMembersForm
            churchName={churchName || "Your church"}
            joinLink={joinLink}
            joinCode={churchSlug}
            onCreateInvites={handleInviteCreate}
          />
        </main>
      </PageGridFull>
    </PageGrid>
  );
}
