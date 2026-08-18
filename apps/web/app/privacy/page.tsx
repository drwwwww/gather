import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Gather",
};

// Fill in before this goes live: a real inbox that gets checked.
const PRIVACY_CONTACT_EMAIL = "support@gatherministry.online";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 flex items-center gap-2.5">
        <img src="/logo.png" alt="Gather" className="h-8 w-8 rounded-xl object-cover select-none" />
        <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">Gather</span>
      </div>

      <h1 className="mb-2 text-3xl font-black tracking-tight text-[var(--text-primary)]">Privacy Policy</h1>
      <p className="mb-10 text-sm text-[var(--text-muted)]">Last updated: August 2026</p>

      <div className="space-y-10">
        <Section title="The short version">
          <p>
            Gather is software your church uses to coordinate volunteers, plan services, and communicate with your
            congregation. To do that, we collect the account and profile information you or your church admin enters,
            and the activity that naturally comes from using the app — who&apos;s signed up to serve, who&apos;s coming
            to an event, and so on. We don&apos;t sell your information, and we don&apos;t show it to anyone outside
            your own church.
          </p>
        </Section>

        <Section title="What we collect">
          <p><strong className="text-[var(--text-primary)]">Account information:</strong> your name, email address, and password (handled securely by our authentication provider — we never see or store your password in plain text).</p>
          <p><strong className="text-[var(--text-primary)]">Profile information:</strong> anything you choose to add to your profile, such as a photo, a favorite verse, or ministry interests. All of this is optional.</p>
          <p><strong className="text-[var(--text-primary)]">Church &amp; role information:</strong> which church you&apos;re part of, and your role (member, service team, or admin) within it.</p>
          <p><strong className="text-[var(--text-primary)]">Activity information:</strong> the day-to-day use of the app — volunteer assignments and your responses to them, event RSVPs, and which notifications you&apos;ve read. This is what lets the app actually coordinate your church&apos;s schedule.</p>
          <p>We do not knowingly collect information from children. Gather accounts are self-registered by adults, and we don&apos;t currently offer any feature (like children&apos;s check-in) that collects a minor&apos;s information directly.</p>
        </Section>

        <Section title="How we use it">
          <p>
            Strictly to run the product: showing you your church&apos;s announcements and events, letting your admin
            build a service schedule and see who&apos;s confirmed, sending you a reminder when you&apos;re assigned to
            serve, and letting fellow members find and recognize each other in your church&apos;s directory.
          </p>
          <p>We don&apos;t use your information for advertising, and we don&apos;t build profiles about you for any purpose beyond making the app work for your church.</p>
        </Section>

        <Section title="Who can see it">
          <p>
            Your information is scoped to your own church — someone at a different church using Gather cannot see
            your data, and this is enforced at the database level, not just hidden in the app&apos;s interface.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Other members of your church can see your name, role, and profile information in the member directory.</li>
            <li>Your church&apos;s admins can additionally see your volunteer assignments, RSVPs, and contact information, since that&apos;s necessary for them to coordinate schedules and reach you.</li>
            <li>Gather&apos;s own team has limited technical access to the underlying database, used only to operate, maintain, and troubleshoot the service — not to browse individual accounts.</li>
          </ul>
        </Section>

        <Section title="Third-party services we use">
          <p>We rely on a small number of infrastructure providers to run Gather, each only for the specific job below:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong className="text-[var(--text-primary)]">Supabase</strong> — hosts our database, handles authentication, and stores uploaded photos.</li>
            <li><strong className="text-[var(--text-primary)]">Brevo</strong> — delivers transactional emails, such as volunteer reminders.</li>
            <li>We may use an error-monitoring tool to help us detect and fix bugs. It receives technical details about what went wrong (like a stack trace), not the content of your messages or profile.</li>
          </ul>
          <p>None of these providers are permitted to use your data for their own purposes — they process it only to provide the service we&apos;ve engaged them for.</p>
        </Section>

        <Section title="How long we keep it, and how to delete it">
          <p>
            We keep your information for as long as your account is active. If you leave a church, an admin can
            remove you from it — this clears your church association while preserving your login, in case you join
            another church later.
          </p>
          <p>
            If you&apos;d like your account and data deleted entirely, contact your church admin or email us at{" "}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="text-amber-600 hover:underline">{PRIVACY_CONTACT_EMAIL}</a>{" "}
            and we&apos;ll take care of it.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Access to your church&apos;s data is restricted by row-level security policies enforced by our database
            itself, not just by application code — so a bug in one part of the app can&apos;t accidentally expose
            another church&apos;s data. Sensitive actions (like changing someone&apos;s role or removing a member) go
            through server-side checks rather than being trusted directly from the app.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make a meaningful change to how we collect or use your information, we&apos;ll update this page and
            change the date at the top.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            Reach out any time at{" "}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="text-amber-600 hover:underline">{PRIVACY_CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </div>

      <div className="mt-14 border-t border-[var(--border)] pt-6">
        <Link href="/" className="text-sm font-semibold text-amber-600 hover:underline">← Back to Gather</Link>
      </div>
    </main>
  );
}
