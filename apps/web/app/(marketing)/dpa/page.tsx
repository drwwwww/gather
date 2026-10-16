import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { SubprocessorTable, type LegalSection } from "../../../components/legal/LegalDoc";
import { OPERATOR, SUPPORT_EMAIL } from "../../../lib/legal";

export const metadata: Metadata = {
  title: "Data Processing Terms — Gather",
  description: "How Gather handles your congregation's data on your church's behalf, and every provider involved.",
  alternates: { canonical: "/dpa" },
};

const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: "roles",
    title: "Roles",
    plain: "Your church owns its congregation's data. Gather only handles it to provide the Service you asked for.",
    body: (
      <>
        <p>
          These terms form part of the <Link href="/terms">Terms of Service</Link> between {OPERATOR} (&ldquo;Gather&rdquo;)
          and each church using Gather (the &ldquo;Church&rdquo;). For personal information the Church adds to or
          collects through Gather about its members, volunteers, and visitors (&ldquo;Church Data&rdquo;), the Church is
          the controller (the &ldquo;business&rdquo; under U.S. state privacy laws) and Gather is the processor
          (&ldquo;service provider&rdquo;).
        </p>
      </>
    ),
  },
  {
    id: "instructions",
    title: "What we do with Church Data",
    plain: "Only what's needed to run Gather for you. We never sell it or use it for anything else.",
    body: (
      <ul>
        <li>We process Church Data only to provide, secure, and support the Service, and on the Church&apos;s documented instructions — which include its admins&apos; actions in Gather.</li>
        <li>We don&apos;t sell or share Church Data, use it for advertising, combine it with data from other sources, or keep it for any purpose outside our relationship with the Church.</li>
        <li>If we believe an instruction breaks the law, we&apos;ll tell the Church.</li>
      </ul>
    ),
  },
  {
    id: "people",
    title: "Confidentiality",
    plain: "Anyone at Gather who can access your data is bound to keep it confidential.",
    body: (
      <p>
        Everyone authorized to process Church Data is bound by confidentiality, and access is limited to what each
        person needs for their role.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security measures",
    plain: "Encryption, per-church isolation in the database, and least-privilege access.",
    body: (
      <ul>
        <li>Encryption in transit (TLS 1.2+) and at rest.</li>
        <li>Row-level security in the database so one church can never read another&apos;s data, with privileged actions checked on the server.</li>
        <li>Passwords stored only as one-way hashes by our authentication provider.</li>
        <li>Least-privilege production access, with service credentials kept out of client apps.</li>
        <li>Error reporting configured not to collect user identities or request bodies, and to mask screen replays.</li>
        <li>Rolling backups retained for up to 30 days.</li>
      </ul>
    ),
  },
  {
    id: "subprocessors",
    title: "Subprocessors",
    plain: "These are the only companies that touch your data. We'll give you notice before adding a new one.",
    body: (
      <>
        <p>
          The Church authorizes Gather to use the subprocessors below. Each is bound by written terms that protect
          Church Data at least as well as these. We&apos;ll update this page and email church admins at least 30 days
          before adding or replacing a subprocessor; a Church that reasonably objects may cancel and receive a pro-rated
          refund of prepaid fees.
        </p>
        <SubprocessorTable />
      </>
    ),
  },
  {
    id: "requests",
    title: "Helping with requests",
    plain: "If one of your members asks to see or delete their data, we'll help you handle it.",
    body: (
      <p>
        Gather gives admins tools to view, edit, and remove members, and members can delete their own accounts. If we
        receive a request directly from one of the Church&apos;s members about Church Data, we&apos;ll point them to
        the Church or, where the request is clear, handle it and let the Church know. We&apos;ll reasonably help with
        data-protection assessments and regulator inquiries that relate to Gather.
      </p>
    ),
  },
  {
    id: "breach",
    title: "If something goes wrong",
    plain: "If there's a breach affecting your church's data, we tell you within 72 hours of confirming it.",
    body: (
      <p>
        We&apos;ll notify the Church&apos;s admins without undue delay, and no later than 72 hours after confirming a
        security incident that affects Church Data. We&apos;ll explain what happened, what data was involved, and what
        we&apos;re doing about it, and we&apos;ll help the Church meet its own notification duties.
      </p>
    ),
  },
  {
    id: "end",
    title: "When a church leaves",
    plain: "Ask for a copy, then we delete everything within 30 days.",
    body: (
      <p>
        When a Church closes its account, it can ask for an export of its Church Data in a standard format by emailing{" "}
        {mail}. We then delete Church Data within 30 days, including from backups as they expire, unless the law
        requires us to keep something.
      </p>
    ),
  },
  {
    id: "audits",
    title: "Information and audits",
    plain: "Ask us anything about how we protect your data, and we'll answer in writing.",
    body: (
      <p>
        On request, we&apos;ll provide the information reasonably needed to show we comply with these terms, including
        written answers to security questionnaires, once a year or after an incident.
      </p>
    ),
  },
];

export default function DpaPage() {
  return (
    <LegalDoc
      doc="dpa"
      title="Data Processing Terms"
      intro={
        <p>
          For church leaders, denominations, and anyone asking &ldquo;what happens to our congregation&apos;s
          data?&rdquo; These terms apply automatically to every church on Gather — there&apos;s nothing to sign.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
