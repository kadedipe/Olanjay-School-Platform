"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function RemoveAssignmentButton({ endpoint, label }: { endpoint:string; label:string }) { const router=useRouter(); const [pending,setPending]=useState(false); const [error,setError]=useState(""); async function remove(){if(!window.confirm(`Remove ${label}?`))return;setPending(true);setError("");try{await requestJson(endpoint,{method:"DELETE"});router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:"Removal failed.");}finally{setPending(false);}}return <span className="inlineAction"><button className="dangerLink" type="button" onClick={remove} disabled={pending}>{pending?"Removing…":"Remove"}</button>{error&&<small className="formError">{error}</small>}</span>; }
