"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false });
    setPending(false);
    if (result?.error) return setError("Email or password is incorrect, or the account is temporarily locked.");
    router.push("/dashboard"); router.refresh();
  }

  return <form className="authForm" onSubmit={submit}>
    <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
    {error && <p className="formError" role="alert">{error}</p>}
    <button className="primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
  </form>;
}
