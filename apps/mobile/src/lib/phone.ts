/** Very small US-centric E.164 normalizer — good enough for the church's own
    membership, which per the seed data is entirely US-based. A church
    serving international members would need real country-code selection;
    flagged rather than guessed. */
export function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits.length >= 8 ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function isLikelyPhone(raw: string): boolean {
  return toE164(raw) !== null;
}

/** Formats an E.164 US number back to a readable (555) 123-4567 for display. */
export function formatPhoneDisplay(e164: string | null | undefined): string | null {
  if (!e164) return null;
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `(${m[1]}) ${m[2]}-${m[3]}`;
  return e164;
}
