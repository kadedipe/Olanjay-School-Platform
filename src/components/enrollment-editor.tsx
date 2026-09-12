"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function EnrollmentEditor({ id, yearLevel, status }: { id: string; yearLevel: number; status: string }) {
  const router = useRouter(); const [pending,setPending]=useState(false); const [error,setError]=useState("");
  async function update(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(""); try { await requestJson(`/api/enrollments/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); router.refresh(); } catch(cause){ setError(cause instanceof Error ? cause.message : "Update failed."); } finally{ setPending(false); } }
  async function withdraw(){ if(!window.confirm("Withdraw this enrollment? Historical records will be retained.")) return; setPending(true); setError(""); try{ await requestJson(`/api/enrollments/${id}`,{method:"DELETE"}); router.refresh(); }catch(cause){setError(cause instanceof Error ? cause.message : "Withdrawal failed.");}finally{setPending(false);} }
  return <form className="inlineEditor" onSubmit={update}><input aria-label="Year level" name="yearLevel" type="number" min={1} max={10} defaultValue={yearLevel}/><select aria-label="Enrollment status" name="status" defaultValue={status}><option value="APPLIED">Applied</option><option value="ENROLLED">Enrolled</option><option value="DEFERRED">Deferred</option><option value="WITHDRAWN">Withdrawn</option><option value="GRADUATED">Graduated</option></select><button className="linkButton" disabled={pending}>{pending ? "Saving…" : "Save"}</button>{status !== "WITHDRAWN" && <button className="dangerLink" type="button" disabled={pending} onClick={withdraw}>Withdraw</button>}{error && <small className="formError">{error}</small>}</form>;
}
