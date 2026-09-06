"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function ArchiveButton({ endpoint, label }: { endpoint: string; label: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function archive() {
    if (!window.confirm(`Archive ${label}? Historical records will be retained.`)) return;
    setPending(true); setError("");
    try { await requestJson(endpoint, { method: "DELETE" }); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Archive failed"); }
    finally { setPending(false); }
  }
  return <span className="inlineAction"><button className="dangerLink" type="button" disabled={pending} onClick={archive}>{pending ? "Archiving…" : "Archive"}</button>{error && <small className="formError">{error}</small>}</span>;
}
