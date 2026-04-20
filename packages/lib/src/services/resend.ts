import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "Gather <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log("[Resend stub]", { to, subject });
    return { ok: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html
    });
    if (error) {
      console.error("[Resend error]", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Resend exception]", err);
    return { ok: false, error: message };
  }
}

/** Alias for tests and callers that expect a stub-named export. */
export const sendEmailStub = sendEmail;
