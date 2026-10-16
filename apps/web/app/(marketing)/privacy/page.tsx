import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { SubprocessorTable, type LegalSection } from "../../../components/legal/LegalDoc";
import { OPERATOR, PRIVACY_EMAIL } from "../../../lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Gather",
  description: "What Gather collects, who can see it, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    plain: "Gather is software your church uses. Your church decides what goes in it; we run it and keep it safe.",
    body: (
      <>
        <p>
          Gather is operated by {OPERATOR} (&ldquo;Gather,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). This policy
          covers the Gather website, the web app, and the Gather mobile apps for iOS and Android.
        </p>
        <p>
          Most information in Gather is added by your church — for example, when an admin builds a service schedule
          or posts an announcement. For that information, your church decides how it&apos;s used and we process it on
          the church&apos;s behalf, under our <Link href="/dpa">data processing terms</Link>. For your own account,
          and for anything you send us directly (like a demo request), we are responsible for it.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    plain: "Your name and how to reach you, what you add to your profile, and what you do in your church's schedule.",
    body: (
      <>
        <ul>
          <li><strong>Account details:</strong> your name and the email address or phone number you sign in with. Your password is stored by our authentication provider as a one-way hash — nobody, including us, can read it.</li>
          <li><strong>Profile:</strong> anything you choose to add, such as a photo, a favorite verse, or ministry interests. All optional.</li>
          <li><strong>Church and role:</strong> which church you belong to and whether you&apos;re a member, on the service team, or an admin.</li>
          <li><strong>Activity:</strong> serving assignments and whether you confirmed or declined, event RSVPs, requests to serve, and which notifications you&apos;ve read.</li>
          <li><strong>Safety:</strong> reports you send about another member&apos;s profile, and the people you&apos;ve blocked.</li>
          <li><strong>Church details</strong> (entered by admins): name, street address, service times, and the map coordinates we look up from that address.</li>
          <li><strong>Device details:</strong> a push notification token so we can send reminders to your phone, and — only when the app crashes or hits an error — technical details like device model, OS version, app version, and a masked replay of the screen (all text and images blurred).</li>
          <li><strong>Things you send us:</strong> demo requests and support emails, including whatever you write in them.</li>
          <li><strong>Billing</strong> (church admins on paid plans): handled by Stripe. We receive the billing contact and plan, never full card numbers.</li>
        </ul>
        <h3>What we don&apos;t collect</h3>
        <ul>
          <li><strong>Your location.</strong> If you allow it, the app uses your approximate location on your phone to sort nearby churches by distance. Your location is never sent to us or stored.</li>
          <li>Your contacts, browsing history, or advertising identifiers.</li>
          <li>Information about you from data brokers or other apps. We don&apos;t track you across other companies&apos; apps or websites.</li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    plain: "Only to run Gather for your church. No ads, no selling, no profiling.",
    body: (
      <>
        <p>We use information to:</p>
        <ul>
          <li>show you your church&apos;s announcements, events, and service plans;</li>
          <li>let admins schedule volunteers and see who has confirmed;</li>
          <li>send reminders by email and push notification when you&apos;re scheduled to serve;</li>
          <li>let members find and recognize each other in their church&apos;s directory;</li>
          <li>keep Gather secure, investigate reports, and fix bugs;</li>
          <li>reply to you, and bill churches on paid plans.</li>
        </ul>
        <p>
          We don&apos;t sell personal information, share it for advertising, or use it to train AI models. We send
          service emails (like serving reminders) only — never marketing to members.
        </p>
      </>
    ),
  },
  {
    id: "visible",
    title: "Who can see your information",
    plain: "People in your church see your directory card. Admins see a bit more. Other churches see nothing about you.",
    body: (
      <>
        <ul>
          <li><strong>Members of your church</strong> can see your name, email address, role, profile photo, and favorite verse in the member directory.</li>
          <li><strong>Your church&apos;s admins</strong> can also see your phone number, your serving assignments and responses, RSVPs, and requests to serve — what they need to coordinate the schedule and reach you.</li>
          <li><strong>Other Gather users</strong> can see a church&apos;s name, address, and its public (&ldquo;Everyone&rdquo;) events if the church is listed as discoverable. They can&apos;t see members, profiles, or anything else about you.</li>
          <li><strong>Gather&apos;s team</strong> has limited technical access, used only to operate the service, respond to support requests you or your church make, investigate reports, or comply with law.</li>
        </ul>
        <p>
          Separation between churches is enforced by the database itself (row-level security), not just hidden by the
          app. We may disclose information if required by law, to protect someone&apos;s safety, or as part of a
          business transfer — in which case this policy continues to apply to it.
        </p>
      </>
    ),
  },
  {
    id: "providers",
    title: "Service providers",
    plain: "A short list of companies help us run Gather. They can only use your data to do that job.",
    body: (
      <>
        <p>
          Each provider below is contractually limited to processing data on our instructions, only for the purpose
          listed.
        </p>
        <SubprocessorTable />
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    plain: "Only the ones needed to keep you signed in. No advertising or analytics cookies, so there's no cookie banner.",
    body: (
      <>
        <p>
          The website uses a sign-in cookie so you stay logged in, and your browser&apos;s local storage for small
          preferences. If a page errors, our error-reporting tool may temporarily use session storage to record a
          masked replay of that session. We don&apos;t use advertising, analytics, or third-party tracking cookies.
          Stripe may set its own fraud-prevention cookies on its checkout page.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    plain: "As long as your account exists. Delete your account and it's gone within 30 days, backups included.",
    body: (
      <>
        <ul>
          <li><strong>Your account and profile:</strong> until you delete your account, or your church removes it.</li>
          <li><strong>Church records</strong> (service plans, announcements, events): as long as the church uses Gather, then deleted within 30 days of the church closing its account.</li>
          <li><strong>Crash and error reports:</strong> about 90 days.</li>
          <li><strong>Demo requests and support emails:</strong> up to 24 months.</li>
          <li><strong>Backups:</strong> rolling backups are kept for up to 30 days, so deleted data fully disappears within that window.</li>
        </ul>
        <p>Billing records may be kept longer where tax law requires it.</p>
      </>
    ),
  },
  {
    id: "choices",
    title: "Your choices and rights",
    plain: "You can see, fix, export, or delete your information at any time.",
    body: (
      <>
        <ul>
          <li><strong>Edit</strong> your profile in the app at any time.</li>
          <li><strong>Delete your account</strong> yourself — in the app under Profile → Delete account, or on the web from your account page. See <Link href="/delete-account">how deletion works</Link>.</li>
          <li><strong>Get a copy</strong> of your information, or ask a question about it, by emailing {mail}.</li>
          <li><strong>Turn off push notifications</strong> or location access any time in your phone&apos;s settings.</li>
          <li><strong>Block or report</strong> another member from the member directory.</li>
        </ul>
        <p>
          Depending on where you live (for example California, Virginia, Colorado, the EU, or the UK), you may have
          legal rights to access, correct, delete, or port your data, and to object to or restrict certain processing.
          We honor these requests for everyone, wherever you live, and reply within 30 days. We won&apos;t treat you
          differently for using them. If your request is about information your church added, we may refer it to
          your church&apos;s admins, since they control it.
        </p>
        <p>
          For people in the EU and UK: we process account data to provide the service you asked for (contract),
          church data on the church&apos;s instructions, and security and diagnostics data for our legitimate interest
          in keeping Gather working. You can complain to your local data-protection authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children and teens",
    plain: "You must be at least 13 to have a Gather account.",
    body: (
      <>
        <p>
          Gather isn&apos;t directed to children under 13, and we don&apos;t knowingly collect their personal
          information. If we learn a child under 13 has an account, we delete it. Teens 13 to 17 should use Gather with
          a parent&apos;s or guardian&apos;s permission. Gather doesn&apos;t currently offer children&apos;s check-in
          or any feature that collects a minor&apos;s information on their behalf. If you believe a child under 13 has
          given us information, email {mail}.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    plain: "Encrypted in transit and at rest, locked down per church, and we'll tell you if something goes wrong.",
    body: (
      <>
        <p>
          Data is encrypted in transit (TLS) and at rest by our hosting provider. Each church&apos;s data is walled off
          by database-level access rules, sensitive actions are checked on the server, and our team uses the least
          access needed. No system is perfectly secure; if a breach affects your information, we&apos;ll notify your
          church and you without unreasonable delay and as the law requires.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "Where data is stored",
    plain: "Mainly in the United States.",
    body: (
      <p>
        Gather is based in the United States and stores data there. A few providers (listed above) process limited
        data in the EU or UK. Where data moves between countries, we rely on the providers&apos; standard contractual
        protections.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    plain: "If we change something important, we'll tell you before it takes effect.",
    body: (
      <p>
        We&apos;ll update the date at the top for any change. For meaningful changes — like a new kind of data or a new
        way of using it — we&apos;ll give notice in the app or by email at least 14 days before they take effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    plain: "Questions? Email us. A real person answers.",
    body: <p>Email {mail}. We reply within two business days.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      doc="privacy"
      title="Privacy Policy"
      intro={
        <p>
          Gather holds information about real people in real congregations. We take that seriously. This page explains
          exactly what we collect, who can see it, and how to remove it — in plain words first, details after.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
