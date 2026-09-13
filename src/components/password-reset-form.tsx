"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function PasswordResetForm({token}:{token:string}) {
  const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setError("");const data=Object.fromEntries(new FormData(event.currentTarget));if(data.password!==data.confirmPassword){setError("Passwords do not match.");setPending(false);return;}try{await requestJson("/api/password-reset/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password:data.password})});router.push("/login?reset=1");}catch(cause){setError(cause instanceof Error?cause.message:"The password could not be reset.");setPending(false);}}
  return <form className="authForm" onSubmit={submit}><label>New password<input name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" required/></label><label>Confirm password<input name="confirmPassword" type="password" minLength={12} maxLength={200} autoComplete="new-password" required/></label><p className="passwordHint">Use at least 12 characters with uppercase, lowercase, a number, and a symbol.</p>{error&&<p className="formError" role="alert">{error}</p>}<button className="primary" disabled={pending||!token}>{pending?"Resetting…":"Reset password"}</button></form>;
}
