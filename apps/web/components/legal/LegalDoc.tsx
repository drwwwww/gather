import Link from "next/link";
import type { ReactNode } from "react";
import MarketingNav from "../marketing/MarketingNav";
import { LEGAL_DOCS, LEGAL_EFFECTIVE, SUBPROCESSORS, type LegalDocKey } from "../../lib/legal";

export type LegalSection = {
  id: string;
  title: string;
  /** One sentence a busy church admin can read instead of the whole section. */
  plain: string;
  body: ReactNode;
};

/**
 * Shared shell for the legal center. Every section leads with an
 * "In plain words" line set larger than the formal text below it — the
 * point of these pages is that a pastor can understand them in one read.
 */
export default function LegalDoc({
  doc,
  title,
  intro,
  sections,
  updated = LEGAL_EFFECTIVE,
}: {
  doc: LegalDocKey;
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
  updated?: string;
}) {
  return (
    <>
      <MarketingNav />

      <div className="px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-[1080px]">
          <nav aria-label="Legal documents" className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LEGAL_DOCS.map((d) => {
              const active = d.key === doc;
              return (
                <Link
                  key={d.key}
                  href={d.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mk-amber-deep)] ${
                    active
                      ? "bg-[var(--primary-soft)] font-medium text-[var(--mk-amber-deep)]"
                      : "text-[var(--mk-ink-soft)] hover:bg-[#f6efe4] hover:text-[var(--mk-ink)]"
                  }`}
                >
                  {d.label}
                </Link>
              );
            })}
          </nav>

          <header className="mt-10 max-w-[44rem]">
            <h1 className="mk-h2 text-[var(--mk-ink)]">{title}</h1>
            <p className="mt-4 text-sm text-[var(--mk-ink-faint)]">Effective {updated}</p>
            <div className="mk-lead mt-6 space-y-4">{intro}</div>
          </header>

          <div className="mt-14 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <details className="group rounded-xl border border-[var(--mk-line)] p-4 lg:border-0 lg:p-0" open>
                <summary className="cursor-pointer list-none text-sm font-medium text-[var(--mk-ink)] lg:pointer-events-none">
                  On this page
                </summary>
                <ol className="mt-3 list-none space-y-0.5 p-0">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block rounded-lg px-2 py-1.5 text-sm leading-snug text-[var(--mk-ink-soft)] transition-colors hover:bg-[#f6efe4] hover:text-[var(--mk-ink)] lg:-ml-2"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            </aside>

            <article className="max-w-[42rem]">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-h`}
                  className={`scroll-mt-28 ${i > 0 ? "mk-rule mt-12 pt-12" : ""}`}
                >
                  <h2 id={`${s.id}-h`} className="text-xl font-medium tracking-tight text-[var(--mk-ink)]">
                    {s.title}
                  </h2>
                  <p className="mt-4 border-l-2 border-[var(--mk-amber)] pl-4 text-[1.0625rem] leading-relaxed text-[var(--mk-ink)]">
                    <span className="sr-only">In plain words: </span>
                    {s.plain}
                  </p>
                  <div className="legal-prose mt-6">{s.body}</div>
                </section>
              ))}
            </article>
          </div>
        </div>
      </div>
    </>
  );
}

/** The shared third-party table, used by Privacy and Data processing. */
export function SubprocessorTable() {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--mk-line)] text-[var(--mk-ink-faint)]">
            <th scope="col" className="py-2.5 pr-4 font-medium">Provider</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">What they do for us</th>
            <th scope="col" className="py-2.5 pr-4 font-medium">Data involved</th>
            <th scope="col" className="py-2.5 font-medium">Where</th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSORS.map((p) => (
            <tr key={p.name} className="border-b border-[var(--mk-line)] align-top">
              <th scope="row" className="py-3 pr-4 font-medium text-[var(--mk-ink)]">{p.name}</th>
              <td className="py-3 pr-4 text-[var(--mk-ink-soft)]">{p.purpose}</td>
              <td className="py-3 pr-4 text-[var(--mk-ink-soft)]">{p.data}</td>
              <td className="py-3 text-[var(--mk-ink-soft)]">{p.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
