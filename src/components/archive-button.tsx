"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveButton({ endpoint, label }: { endpoint: string; label: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function archive() {
    if (!window.confirm(`Archive ${label}? Historical records will be retained.`)) return;
    setPending(true); setError("");
    const response = await fetch(endpoint, { method: "DELETE" });
    setPending(false);
    if (!response.ok) { const body = await response.json().catch(() => ({})); return setError(body.error ?? "Archive failed"); }
    router.refresh();
  }
  return <span className="inlineAction"><button className="dangerLink" type="button" disabled={pending} onClick={archive}>{pending ? "Archiving…" : "Archive"}</button>{error && <small className="formError">{error}</small>}</span>;
}
