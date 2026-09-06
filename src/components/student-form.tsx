"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

type Account = { id: string; firstName: string; lastName: string; email: string };
type StudentRecord = { id: string; admissionNumber: string; dateOfBirth: string; address: string; status: "ACTIVE" | "SUSPENDED" | "ARCHIVED" };

export function StudentForm({ accounts = [], student }: { accounts?: Account[]; student?: StudentRecord }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await requestJson(student ? `/api/students/${student.id}` : "/api/students", { method: student ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      router.push("/dashboard/students"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Student record could not be saved.");
    } finally { setPending(false); }
  }
  return <form className="crudForm panel" onSubmit={submit}>
    {!student && <label>Student account<select name="userId" required defaultValue=""><option value="" disabled>Select an invited student</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.firstName} {account.lastName} — {account.email}</option>)}</select></label>}
    <div className="formGrid"><label>Admission number<input name="admissionNumber" required maxLength={40} defaultValue={student?.admissionNumber}/></label><label>Date of birth<input name="dateOfBirth" type="date" max={new Date().toISOString().slice(0,10)} defaultValue={student?.dateOfBirth}/></label></div>
    <label>Address<textarea name="address" rows={4} maxLength={300} defaultValue={student?.address}/></label>
    {student && <label>Account status<select name="status" defaultValue={student.status}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option></select></label>}
    {error && <p className="formError" role="alert">{error}</p>}
    <div className="formActions"><button type="button" className="secondary" onClick={() => router.back()}>Cancel</button><button className="primary" disabled={pending}>{pending ? "Saving…" : student ? "Save changes" : "Create student record"}</button></div>
  </form>;
}
