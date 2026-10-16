import type { Metadata } from "next";
import LegalDoc, { type LegalSection } from "../../../components/legal/LegalDoc";
import DeleteAccountCard from "../../../components/account/DeleteAccountCard";
import { OPERATOR, SUPPORT_EMAIL } from "../../../lib/legal";

export const metadata: Metadata = {
  title: "Delete your account — Gather",
  description: "How to permanently delete your Gather account and what happens to your data.",
  alternates: { canonical: "/delete-account" },
};

const mail = <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20Gather%20account`}>{SUPPORT_EMAIL}</a>;

// This page is the "account deletion URL" for the Google Play Data safety form
// and is linked from the App Store listing — keep the app/developer name and
// the three methods on it.
const SECTIONS: LegalSection[] = [
  {
    id: "how",
    title: "How to delete it",
    plain: "Do it yourself in the app or on the web in under a minute. Or email us and we'll do it for you.",
    body: (
      <>
        <h3>In the Gather mobile app</h3>
        <p>Tap your photo on the Home screen to open Profile, then tap <strong>Delete account</strong> at the bottom, type DELETE, and confirm.</p>
        <h3>On the web</h3>
        <p>Sign in, open your account page, and use <strong>Delete your account</strong> at the bottom. If you&apos;re signed in now, you can do it here:</p>
        <DeleteAccountCard variant="public" />
        <h3>By email</h3>
        <p>
          Email {mail} from the address on your account (or tell us the phone number you sign in with). We&apos;ll
          confirm it&apos;s you and delete the account within 7 days.
        </p>
      </>
    ),
  },
  {
    id: "deleted",
    title: "What gets deleted",
    plain: "Everything that's about you personally, right away.",
    body: (
      <ul>
        <li>Your sign-in (email or phone and password)</li>
        <li>Your profile: name, photo, favorite verse, ministry interests</li>
        <li>Your phone number and push-notification token</li>
        <li>Your event RSVPs, requests to serve, notification history, and blocks</li>
        <li>Reports other members made about you</li>
      </ul>
    ),
  },
  {
    id: "kept",
    title: "What stays with your church",
    plain: "Your church's own records stay, without your name on them.",
    body: (
      <ul>
        <li>Service plans you were scheduled on stay — your backup is moved up, or the slot is marked open.</li>
        <li>Announcements and events your church posted.</li>
        <li>If you&apos;re your church&apos;s only admin and others are still in it, make someone else an admin first so the church isn&apos;t left without one. If you&apos;re the only person in the church, the church&apos;s workspace is deleted along with your account.</li>
      </ul>
    ),
  },
  {
    id: "timing",
    title: "How long it takes",
    plain: "Immediately in the app. Fully gone from backups within 30 days.",
    body: (
      <p>
        Deletion takes effect immediately and can&apos;t be undone. Copies in our rolling backups expire within 30 days.
        Billing records for paid church plans may be kept longer where tax law requires.
      </p>
    ),
  },
];

export default function DeleteAccountPage() {
  return (
    <LegalDoc
      doc="delete-account"
      title="Delete your Gather account"
      intro={
        <p>
          You can delete your account in the Gather app (by {OPERATOR}) whenever you like. Leaving a church
          doesn&apos;t require deleting your account — your church admin can remove you instead, and you keep your
          login for another church.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
