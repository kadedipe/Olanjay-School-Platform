"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function AcademicYearForm() {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); const form = event.currentTarget; const data = new FormData(form);
    try {
      await requestJson("/api/academic-years", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(data), isCurrent: data.get("isCurrent") === "on" }) });
      form.reset(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Academic year could not be created."); }
    finally { setPending(false); }
  }
  return <form className="crudForm compactForm" onSubmit={submit}><div className="formGrid threeColumns"><label>Academic year<input name="name" required placeholder="2026/2027" maxLength={40}/></label><label>Starts<input name="startsAt" type="date" required/></label><label>Ends<input name="endsAt" type="date" required/></label></div><label className="checkboxLabel"><input name="isCurrent" type="checkbox"/> Set as current academic year</label>{error && <p className="formError" role="alert">{error}</p>}<div className="formActions"><button className="primary" disabled={pending}>{pending ? "Creating…" : "Create academic year"}</button></div></form>;
}
