"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await getCurrentContext();
      if (!context) {
        router.replace("/login?next=/people/invite");
        return;
      }
      if (context.profile.role !== "ADMIN") {
        router.replace("/member");
        return;
      }

      const slug = context.church.slug;
      if (codeParam && codeParam.toLowerCase() !== slug.toLowerCase()) {
        setError(`This page is for church code “${slug}”. The code in the URL does not match your church.`);
        setChurchName(context.church.name);
        setChurchSlug(slug);
        setChurchId(context.church.id);
        if (typeof window !== "undefined") {
          const link = buildJoinLink(window.location.origin, slug);
          setJoinLink(link);
          setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(link)}`);
        }
        setLoading(false);
        return;
      }

      setChurchName(context.church.name);
      setChurchSlug(slug);
      setChurchId(context.church.id);
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

  useEffect(() => {
    void load();
  }, [load]);

  const smsBody = useMemo(() => {
    if (!churchName || !churchSlug || !joinLink) return "";
    return buildInviteMessage(churchName, churchSlug, joinLink);
  }, [churchName, churchSlug, joinLink]);

  const smsHref = useMemo(() => {
    if (!smsBody) return "";
    return `sms:?&body=${encodeURIComponent(smsBody)}`;
  }, [smsBody]);

  const mailtoHref = useMemo(() => {
    if (!smsBody) return "";
    const subject = encodeURIComponent(`Join ${churchName} on Gather`);
    return `mailto:?subject=${subject}&body=${encodeURIComponent(smsBody)}`;
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
    } catch {
      setError("Unable to copy join link.");
    }
  };

  if (loading) {
    return (
      <PageGrid className="animate-pulse-subtle">
        <PageGridFull>
          <main className="mx-auto w-full max-w-2xl">
            <div className="h-[480px] rounded-2xl bg-[var(--surface)]" />
          </main>
        </PageGridFull>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <PageGridFull className="animate-fade-in-up">
        <main className="mx-auto w-full max-w-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/people" className="btn btn-ghost btn-sm">
              Back to People
            </Link>
            <button type="button" className="btn btn-outline btn-sm print:hidden" onClick={() => window.print()}>
              Print
            </button>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-[var(--surface-container-lowest)] p-8 shadow-sm print:border-none print:shadow-none">
            <h1 className="text-2xl font-semibold text-base-content">Invite people to {churchName || "your church"}</h1>
            <p className="mt-2 text-sm text-base-content/60">
              Share the join link or code. The QR code opens the public join page so people can sign in and join this
              church. You can also send the message by email or text.
            </p>

            {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

            <div className="mt-6 rounded-xl bg-[var(--surface-2)]/60 p-4 text-center text-2xl font-semibold tracking-wide">
              {churchSlug}
            </div>

            {qrUrl ? (
              <div className="mt-6 flex justify-center">
                <img src={qrUrl} alt="Join link QR" className="h-56 w-56" />
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap print:hidden">
              <button type="button" className="btn btn-outline btn-sm" onClick={handleCopyLink}>
                Copy join link
              </button>
              {mailtoHref ? (
                <a className="btn btn-outline btn-sm" href={mailtoHref}>
                  Open email (mailto)
                </a>
              ) : null}
              {smsHref ? (
                <a className="btn btn-outline btn-sm" href={smsHref}>
                  Open Messages (SMS)
                </a>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-base-content/50 print:hidden">
              Email and SMS use your device&apos;s default apps. Message text includes your church code and join link.
            </p>
          </div>

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
