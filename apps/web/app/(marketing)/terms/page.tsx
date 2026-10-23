import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { type LegalSection } from "../../../components/legal/LegalDoc";
import { GOVERNING_STATE, OPERATOR, SUPPORT_EMAIL } from "../../../lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — Gather",
  description: "The agreement between Gather, churches, and the people who use Gather.",
  alternates: { canonical: "/terms" },
};

const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "The agreement",
    plain: "By using Gather you agree to these terms. If you sign up a church, you agree on the church's behalf.",
    body: (
      <>
        <p>
          These terms are an agreement between you and {OPERATOR} (&ldquo;Gather&rdquo;) covering the Gather website,
          web app, and mobile apps (together, the &ldquo;Service&rdquo;). Our <Link href="/privacy">Privacy Policy</Link>{" "}
          explains how we handle personal information, and our <Link href="/dpa">data processing terms</Link> apply to
          churches.
        </p>
        <p>
          If you create a church workspace or subscribe on a church&apos;s behalf, you confirm you&apos;re at least 18
          and authorized to agree to these terms for that church, and &ldquo;you&rdquo; includes the church.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use Gather",
    plain: "You need to be 13 or older. Under 18, have a parent's or guardian's permission.",
    body: (
      <p>
        You must be at least 13 years old to create an account. If you&apos;re under 18, you need permission from a
        parent or guardian, who agrees to these terms for you. You can&apos;t use Gather if you&apos;ve been barred
        from it before or if the law prohibits it.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    plain: "Use your real name, keep your password private, and one person per account.",
    body: (
      <p>
        Give accurate information and keep it up to date. Keep your password secret; you&apos;re responsible for what
        happens under your account. Tell us right away at {mail} if you think someone else has accessed it. You can
        delete your account any time — see <Link href="/delete-account">how</Link>.
      </p>
    ),
  },
  {
    id: "churches",
    title: "Churches and admins",
    plain: "Each church controls its own workspace and is responsible for what its admins add and send.",
    body: (
      <>
        <p>A church that uses Gather, through its admins, is responsible for:</p>
        <ul>
          <li>who it invites, what roles it gives them, and when it removes them;</li>
          <li>the content it posts — announcements, events, service plans, images;</li>
          <li>having the right to add people&apos;s information to Gather and to contact them through it;</li>
          <li>following the laws that apply to its own ministry, including any about minors in its care.</li>
        </ul>
        <p>
          Church admins can see and manage information about members of their church, as described in the Privacy
          Policy. Gather is a tool for coordinating ministry; it isn&apos;t a substitute for a church&apos;s own
          safeguarding, background-check, or child-protection policies.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    plain: "Treat people the way you'd want to be treated at church. No harassment, spam, or misuse.",
    body: (
      <>
        <p>Don&apos;t use Gather to:</p>
        <ul>
          <li>harass, threaten, bully, or demean anyone, or post sexual, violent, or hateful content;</li>
          <li>impersonate someone, or misrepresent who you are or your role at a church;</li>
          <li>send spam or messages to people who haven&apos;t chosen to be part of your church on Gather;</li>
          <li>post someone else&apos;s private information without their permission;</li>
          <li>break the law, or infringe anyone&apos;s copyright, trademark, or privacy;</li>
          <li>probe, scrape, overload, or get around the security of the Service, or access another church&apos;s data;</li>
          <li>upload malware, or reverse-engineer the apps except where the law allows it.</li>
        </ul>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content",
    plain: "What you and your church put in Gather stays yours. We only use it to run the Service.",
    body: (
      <p>
        You and your church own what you add to Gather. You give us a limited, worldwide, non-exclusive license to
        host, store, copy, and display it only as needed to run, secure, and improve the Service for you — for example,
        to show an announcement to your congregation. This license ends when the content is deleted, apart from
        routine backups that expire on their own. If you send us feedback or ideas, we may use them without owing
        you anything.
      </p>
    ),
  },
  {
    id: "safety",
    title: "Reports, blocking, and removal",
    plain: "You can report or block anyone. We and your church's admins can remove content or accounts that break these terms.",
    body: (
      <p>
        Anyone can report a member&apos;s profile or block them from the member directory. Reports go to the
        church&apos;s admins and to us, and we aim to act on them within 24 hours. Church admins can disable or remove
        accounts in their church. We may remove content or suspend accounts that break these terms or put people at
        risk, and where it&apos;s safe to, we&apos;ll tell you why.
      </p>
    ),
  },
  {
    id: "billing",
    title: "Paid plans",
    plain: "Church plans renew automatically until you cancel. Cancel any time; you keep access through the period you paid for. Your first payment has a 14-day money-back guarantee.",
    body: (
      <>
        <p>
          Member accounts are free. Church plans are billed in advance, monthly or yearly, through Stripe, and renew
          automatically at the then-current price until cancelled. You can cancel at any time; cancellation takes
          effect at the end of the current billing period, and you keep access until then.
        </p>
        <p>
          <strong>Money-back guarantee:</strong> if you ask within 14 days of your church&apos;s first payment
          for a plan, we&apos;ll refund that payment in full. Otherwise, fees aren&apos;t refundable for partial
          periods, except where the law requires a refund or we decide to give one. We&apos;ll give at least 30 days&apos; notice before a price change affects your plan. <strong>Founding churches</strong> (the first 10 churches to start a paid plan) keep the price they signed up at for as long as their subscription stays active, without a break. Prices
          don&apos;t include taxes, which you&apos;re responsible for unless your church is exempt and gives us proof.
          If a payment fails, we&apos;ll let you know and may pause paid features after a reasonable grace period.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-service",
    title: "Changes to the Service",
    plain: "We'll keep improving Gather. If we remove something important, we'll tell you first.",
    body: (
      <p>
        We may add, change, or remove features. If a change meaningfully reduces what a paid plan includes, we&apos;ll
        tell you in advance and you can cancel and get a pro-rated refund for time you&apos;ve prepaid. Features
        marked as preview or beta may change or go away without notice.
      </p>
    ),
  },
  {
    id: "app-stores",
    title: "Apple and Google",
    plain: "If you downloaded the app from the App Store or Google Play, these terms are between you and Gather, not Apple or Google.",
    body: (
      <>
        <p>If you use our app from the Apple App Store:</p>
        <ul>
          <li>these terms are between you and Gather only, not Apple, and Gather — not Apple — is responsible for the app and its content;</li>
          <li>your license to use the app is non-transferable and limited to Apple devices you own or control, as allowed by the App Store&apos;s Usage Rules;</li>
          <li>Apple has no obligation to provide maintenance or support for the app;</li>
          <li>if the app fails to conform to any applicable warranty, you may notify Apple and Apple will refund the purchase price (if any); Apple has no other warranty obligation;</li>
          <li>Apple isn&apos;t responsible for any claims relating to the app, including product-liability claims, claims that it fails to meet legal requirements, or consumer-protection or privacy claims;</li>
          <li>Apple isn&apos;t responsible for investigating or defending any claim that the app infringes someone&apos;s intellectual property;</li>
          <li>you confirm you&apos;re not in a country subject to a U.S. embargo or on a U.S. government restricted-party list;</li>
          <li>Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them against you.</li>
        </ul>
        <p>Google Play&apos;s terms also apply to apps downloaded from Google Play.</p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Ending the agreement",
    plain: "You can leave any time. We can suspend accounts that break these terms.",
    body: (
      <p>
        You can stop using Gather and delete your account at any time. We may suspend or end your access if you
        seriously or repeatedly break these terms, if the law requires it, or if we stop offering the Service (in which
        case we&apos;ll give churches at least 30 days&apos; notice and a chance to export their data). Sections that
        by their nature should survive — content ownership, disclaimers, limits of liability, and disputes — survive.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    plain: "We work hard to keep Gather reliable, but we can't promise it will never go down or be error-free.",
    body: (
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo; TO THE FULLEST EXTENT THE LAW
        ALLOWS, GATHER DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We don&apos;t warrant that the Service will be uninterrupted, secure,
        or error-free, or that reminders and notifications will always be delivered. Please don&apos;t rely on Gather
        as the only way to communicate something urgent or safety-critical.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limits on liability",
    plain: "If something goes wrong, our responsibility is limited to what you paid us in the last year (or $100).",
    body: (
      <p>
        TO THE FULLEST EXTENT THE LAW ALLOWS, GATHER WON&apos;T BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR GOODWILL. GATHER&apos;S TOTAL LIABILITY FOR ANY
        CLAIM RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF THE AMOUNT YOU PAID GATHER IN THE 12 MONTHS BEFORE
        THE CLAIM, OR $100. Some places don&apos;t allow these limits, so they may not fully apply to you.
      </p>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    plain: "If your church's content or misuse of Gather gets us sued, the church covers that.",
    body: (
      <p>
        If you use Gather on behalf of a church, the church agrees to defend and indemnify Gather against third-party
        claims arising from its content, its use of the Service in breach of these terms, or its violation of law,
        including reasonable legal fees.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Disputes",
    plain: "Let's talk first. If we can't resolve it, Georgia law applies.",
    body: (
      <p>
        If you have a problem, email {mail} and we&apos;ll try to resolve it informally within 30 days. These terms are
        governed by the laws of the State of {GOVERNING_STATE}, USA, without regard to conflict-of-law rules. Any
        dispute will be resolved in the state or federal courts located in {GOVERNING_STATE}, and both sides consent to
        their jurisdiction — except that either side may bring a claim in small-claims court, and nothing here limits
        consumer rights you have under your local law.
      </p>
    ),
  },
  {
    id: "general",
    title: "Everything else",
    plain: "The usual fine print about how these terms work.",
    body: (
      <p>
        We may update these terms; for material changes we&apos;ll give at least 14 days&apos; notice in the app or by
        email, and continuing to use Gather after that means you accept them. If part of these terms is unenforceable,
        the rest still applies. Not enforcing a term isn&apos;t a waiver. You can&apos;t transfer these terms without
        our consent; we may transfer them as part of a merger, acquisition, or reorganization (for example, to a
        company formed to operate Gather). These terms, the Privacy Policy, and the data processing terms are the
        whole agreement between us.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    plain: "Questions about these terms? Email us.",
    body: <p>Email {mail}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      doc="terms"
      title="Terms of Service"
      intro={
        <p>
          The agreement for using Gather, written so you can actually read it. Each section starts with a plain-words
          summary; the text under it is what legally applies.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
