export function sendEmailStub(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Resend stub]", { to, subject, html });
    return Promise.resolve({ ok: true });
  }
  // Real integration can be added later.
  return Promise.resolve({ ok: true });
}
