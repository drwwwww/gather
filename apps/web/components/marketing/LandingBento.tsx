import { FadeUp } from "./Motion";
import { AnswerCard, MockAvatar } from "./ProductShowcase";

/**
 * "Why churches switch" — six moments that sell Gather, each with a small piece
 * of the real UI instead of a stock photo. Sample names are illustrative.
 */
const card =
  "h-full rounded-[20px] border border-[var(--mk-line)] bg-white p-7 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-22px_rgba(31,20,8,0.25)]";

export default function LandingBento() {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <FadeUp className="md:col-span-2">
        <div className={`${card} grid items-center gap-7 border-[#cfe7e3] bg-[var(--area-teal-tint)] sm:grid-cols-2`}>
          <div>
            <h3 className="text-[22px] font-semibold text-[var(--area-teal-ink)]">Answers in one tap</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[#24504b]">
              Volunteers get the request on their phone and answer with one tap. You see green, amber or red at a
              glance, never a thread of &ldquo;who&apos;s coming?&rdquo;
            </p>
          </div>
          <div className="shadow-[0_12px_30px_-18px_rgba(11,94,87,0.5)]" aria-hidden>
            <AnswerCard />
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.06}>
        <div className={`${card} flex flex-col gap-5`}>
          <div className="flex items-start gap-2.5 rounded-[14px] bg-[#faf6f0] p-3" aria-hidden>
            <MockAvatar initials="EM" area="clay" />
            <p className="text-[13px] leading-snug text-[var(--mk-ink)]">
              <b>Emma can&apos;t make it Sunday.</b> Kofi, her backup, is now on Slides.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--mk-ink)]">Backups step in by themselves</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--mk-ink-soft)]">
              When someone can&apos;t make it, their backup takes the spot and you get a heads-up. No scramble at 8:45.
            </p>
          </div>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={`${card} flex flex-col gap-5`}>
          <div className="flex flex-col gap-2" aria-hidden>
            {[
              ["Jordan", "Drums", "rested 5 weeks"],
              ["Hannah", "Vocals", "asked to serve"],
            ].map(([who, role, why]) => (
              <p key={who} className="flex justify-between rounded-[10px] bg-[#faf6f0] px-3 py-2 text-[13px] text-[var(--mk-ink)]">
                <span>
                  <b>{who}</b> for {role}
                </span>
                <span className="text-[var(--mk-ink-soft)]">{why}</span>
              </p>
            ))}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--mk-ink)]">Fill a schedule with AI</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--mk-ink-soft)]">
              One tap suggests who should serve, with the reason for every pick. You stay in charge. Congregation and
              Network plans.
            </p>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.06}>
        <div className={`${card} flex flex-col gap-5`}>
          <div className="rounded-[14px] bg-[var(--mk-ink)] p-3.5 text-white" aria-hidden>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#f6c76b]">LIVE · 9:31 AM</p>
            <p className="mt-1.5 text-[15px] font-semibold">Now: Message</p>
            <div className="mt-2.5 flex gap-1">
              {[1, 1, 1, 0, 0].map((done, i) => (
                <span key={i} className={`h-[5px] flex-1 rounded-full ${done ? "bg-[var(--mk-amber)]" : "bg-white/25"}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-white/75">11 of 12 checked in</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--mk-ink)]">Run the service live</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--mk-ink-soft)]">
              See who&apos;s here, mark steps done, and the next person up gets a nudge.
            </p>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.12} className="md:col-span-2 lg:col-span-1">
        <div className={`${card} flex flex-col gap-5 border-[#d3dff1] bg-[var(--area-blue-tint)]`}>
          <div className="flex flex-col rounded-2xl bg-white px-1.5 py-2" aria-hidden>
            {(
              [
                ["AO", "plum", "Ada O.", "Stretched", "#b45309"],
                ["BT", "olive", "Ben T.", "Steady", "#15803d"],
                ["JL", "teal", "Jordan L.", "Resting", "#1E447F"],
              ] as const
            ).map(([ini, area, name, state, color]) => (
              <p key={ini} className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px]">
                <MockAvatar initials={ini} area={area} />
                <span className="flex-1 text-[var(--mk-ink)]">{name}</span>
                <span className="font-semibold" style={{ color }}>
                  {state}
                </span>
              </p>
            ))}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--area-blue-ink)]">Notice who&apos;s stretched</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#2c4a75]">
              Team Health shows who has served three Sundays straight, who hasn&apos;t been asked in months, and
              who&apos;s new.
            </p>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
