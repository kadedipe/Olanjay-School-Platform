"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setPending(false); return setMessage("Passwords do not match."); }
    const response = await fetch("/api/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: data.get("password") }) });
    const body = await response.json(); setPending(false);
    if (!response.ok) return setMessage(body.error ?? "Unable to accept invitation.");
    router.push("/login?accepted=1");
  }
  return <form className="authForm" onSubmit={submit}>
    <label>Create password<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
    <small>At least 12 characters with uppercase, lowercase, number, and symbol.</small>
    <label>Confirm password<input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" required /></label>
    {message && <p className="formError" role="alert">{message}</p>}
    <button className="primary" disabled={pending}>{pending ? "Creating account…" : "Accept invitation"}</button>
  </form>;
}
