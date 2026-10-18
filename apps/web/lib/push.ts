export type PushMessage = { to: string; title: string; body: string; data?: Record<string, unknown> };

/** Sends Expo push notifications, 100 per request (Expo's limit). Returns how many were accepted. */
export async function sendExpoPushNotifications(messages: PushMessage[]): Promise<number> {
  if (messages.length === 0) return 0;
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
    } catch (err) {
      console.error("[push] send failed", err);
    }
  }
  return sent;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
