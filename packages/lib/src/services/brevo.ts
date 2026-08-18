const apiKey = process.env.BREVO_API_KEY;
const fromEmail = process.env.BREVO_FROM_EMAIL || "Gather <no-reply@gather.app>";

function parseFrom(from: string): { email: string; name?: string } {
  const match = from.match(/^(.*)<(.+)>$/);
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { email: from.trim() };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey) {
    console.log("[Brevo stub]", { to, subject });
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        sender: parseFrom(fromEmail),
        to: [{ email: to }],
        subject,
        htmlContent: html
      })
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.error("[Brevo error]", res.status, errorBody);
      return { ok: false, error: errorBody || `Brevo request failed (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Brevo exception]", err);
    return { ok: false, error: message };
  }
}
