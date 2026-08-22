"use client";

import { Check, LockKeyhole } from "lucide-react";
import { useState } from "react";

export function SharePasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function unlock() {
    setLoading(true); setError("");
    const response = await fetch(`/api/share/${token}/unlock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    setLoading(false);
    if (!response.ok) { setError(body?.error ?? "The proposal could not be unlocked."); return; }
    window.location.reload();
  }
  return <main className="grid min-h-dvh place-items-center bg-stone-100 p-5"><form className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl" onSubmit={(event) => { event.preventDefault(); void unlock(); }}><div className="grid size-12 place-items-center rounded-2xl bg-emerald-950 text-amber-300"><LockKeyhole className="size-5" /></div><h1 className="mt-5 text-2xl font-semibold text-stone-900">Private proposal</h1><p className="mt-2 text-sm leading-6 text-stone-600">Enter the password supplied by your travel advisor.</p><label className="mt-5 block text-sm font-semibold text-stone-800">Password<input type="password" autoFocus value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 outline-none focus:ring-2 focus:ring-amber-500" /></label>{error ? <p className="mt-2 text-sm text-red-700" role="alert">{error}</p> : null}<button type="submit" disabled={loading} className="mt-5 h-12 w-full rounded-xl bg-emerald-950 font-semibold text-white disabled:opacity-60">{loading ? "Unlocking…" : "View proposal"}</button></form></main>;
}

export function ShareApproval({ token }: { token: string }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [state, setState] = useState<"idle"|"loading"|"success"|"error">("idle"); const [error, setError] = useState("");
  async function approve() { setState("loading"); setError(""); const response = await fetch(`/api/share/${token}/approve`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,email}) }); const body=await response.json().catch(()=>null) as {error?:string}|null; if(!response.ok){setError(body?.error??"Approval could not be recorded.");setState("error");return;} setState("success"); }
  return <section className="mx-auto my-8 w-[min(92%,720px)] rounded-3xl bg-white p-6 shadow-lg sm:p-8">{state === "success" ? <div className="text-center"><Check className="mx-auto size-10 text-emerald-700"/><h2 className="mt-3 text-2xl font-semibold">Proposal approved</h2><p className="mt-2 text-stone-600">Your approval was recorded against this exact proposal revision.</p></div> : <><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Next step</p><h2 className="mt-2 text-2xl font-semibold text-stone-900">Approve this proposal</h2><p className="mt-2 text-sm text-stone-600">Confirm that this revision reflects the trip you would like your advisor to prepare.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><input aria-label="Your name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" className="h-12 rounded-xl border border-stone-300 px-3 outline-none focus:ring-2 focus:ring-amber-500"/><input aria-label="Email address" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email address" className="h-12 rounded-xl border border-stone-300 px-3 outline-none focus:ring-2 focus:ring-amber-500"/></div>{error?<p className="mt-2 text-sm text-red-700" role="alert">{error}</p>:null}<button type="button" disabled={state==="loading"} onClick={()=>void approve()} className="mt-4 h-12 w-full rounded-xl bg-emerald-950 font-semibold text-white disabled:opacity-60">{state==="loading"?"Recording approval…":"Approve proposal"}</button></>}</section>;
}
