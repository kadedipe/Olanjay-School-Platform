"use client";

import { FormEvent, useState } from "react";
import { requestJson } from "@/lib/client-api";

export function InvitationForm() {
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setInviteUrl("");
    const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    try {
      const body = await requestJson<{ delivery?: { delivered?: boolean }; acceptUrl?: string }>("/api/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      form.reset(); setMessage(body.delivery?.delivered ? "Invitation email sent." : "Invitation created. Email is not configured; securely share the link below.");
      if (body.acceptUrl) setInviteUrl(body.acceptUrl);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Invitation could not be created."); }
    finally { setPending(false); }
  }
  return <form className="inviteForm" onSubmit={submit}>
    <div><label>First name<input name="firstName" required maxLength={80}/></label><label>Last name<input name="lastName" required maxLength={80}/></label></div>
    <label>Email<input name="email" type="email" required /></label>
    <label>Role<select name="role" defaultValue="STUDENT"><option>ADMIN</option><option>TEACHER</option><option>STUDENT</option><option>GUARDIAN</option></select></label>
    <button className="primary" disabled={pending}>{pending ? "Creating…" : "Send invitation"}</button>
    {message && <p className="formNotice" role="status">{message}</p>}
    {inviteUrl && <div className="inviteLink"><strong>One-time invitation link</strong><code>{inviteUrl}</code></div>}
  </form>;
}
