type InvitationEmail = { to: string; firstName: string; acceptUrl: string; expiresAt: Date };
type AnnouncementEmail = { to: string; firstName: string; title: string; body: string; priority: string };

export async function sendInvitationEmail(input: InvitationEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { delivered: false, reason: "email_not_configured" as const };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to],
      subject: "You are invited to Olanjay Technical School",
      html: `<p>Hello ${escapeHtml(input.firstName)},</p><p>An account has been created for you on the Olanjay School Platform.</p><p><a href="${escapeHtml(input.acceptUrl)}">Accept your invitation</a></p><p>This private link expires on ${input.expiresAt.toUTCString()}.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Invitation email failed with status ${response.status}`);
  return { delivered: true };
}

export async function sendAnnouncementEmail(input: AnnouncementEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !process.env.EMAIL_FROM) return { delivered: false, reason: "email_not_configured" as const };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [input.to], subject: `${input.priority === "URGENT" ? "URGENT: " : ""}${input.title}`, html: `<p>Hello ${escapeHtml(input.firstName)},</p><h2>${escapeHtml(input.title)}</h2><p>${escapeHtml(input.body).replace(/\n/g,"<br>")}</p><p>Sign in to the Olanjay School Platform to review this announcement.</p>` }) });
  if (!response.ok) return { delivered: false, reason: "provider_error" as const };
  return { delivered: true as const };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}
