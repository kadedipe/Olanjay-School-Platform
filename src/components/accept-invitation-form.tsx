"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function AcceptInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setPending(false); return setMessage("Passwords do not match."); }
    try {
      await requestJson("/api/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: data.get("password") }) });
      router.push("/login?accepted=1");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to accept invitation."); }
    finally { setPending(false); }
  }
  return <form className="authForm" onSubmit={submit}>
    <label>Create password<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
    <small>At least 12 characters with uppercase, lowercase, number, and symbol.</small>
    <label>Confirm password<input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" required /></label>
    {message && <p className="formError" role="alert">{message}</p>}
    <button className="primary" disabled={pending}>{pending ? "Creating account…" : "Accept invitation"}</button>
  </form>;
}
