"use client";
import { FormEvent, useState } from "react";
import { requestJson } from "@/lib/client-api";

export function PasswordResetRequestForm() {
  const [pending,setPending]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setError("");setNotice("");try{const form=event.currentTarget,result=await requestJson<{message:string;previewUrl?:string}>("/api/password-reset/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});setNotice(result.previewUrl?`${result.message} Development link: ${result.previewUrl}`:result.message);form.reset();}catch(cause){setError(cause instanceof Error?cause.message:"The request could not be completed.");}finally{setPending(false);}}
  return <form className="authForm" onSubmit={submit}><label>Email address<input name="email" type="email" autoComplete="email" required/></label>{error&&<p className="formError" role="alert">{error}</p>}{notice&&<p className="successNotice" role="status">{notice}</p>}<button className="primary" disabled={pending}>{pending?"Sending…":"Send reset link"}</button></form>;
}
