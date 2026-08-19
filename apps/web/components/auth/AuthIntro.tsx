"use client";

const WORD = "Gather";
const TAGLINE = "Time back for what matters";

/**
 * The "Dawn" overlay — purely presentational. All timing lives in
 * AuthTransition, which owns the phases and survives route changes.
 */
export default function AuthIntro({ leaving }: { leaving: boolean }) {
  return (
    <div
      className={`auth-intro${leaving ? " auth-intro--leaving" : ""}`}
      aria-hidden
      role="presentation"
    >
      <div className="auth-intro__bloom" />
      <div className="auth-intro__grain" />

      <div className="auth-intro__stage">
        <img src="/logo.png" alt="" className="auth-intro__mark" />

        <div className="auth-intro__word">
          {WORD.split("").map((ch, i) => (
            <span
              key={i}
              className="auth-intro__letter"
              style={{
                // Entrance staggers left-to-right; the exit runs in reverse so
                // the word leaves from the opposite end it built from.
                animationDelay: leaving
                  ? `${(WORD.length - 1 - i) * 0.035}s`
                  : `${0.3 + i * 0.045}s`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        <div className="auth-intro__rule" />

        <div className="auth-intro__tagline">
          <span>{TAGLINE}</span>
        </div>
      </div>
    </div>
  );
}
