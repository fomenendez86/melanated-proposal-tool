"use client";

import { useState } from "react";

import type { ShareCommentThread } from "@/lib/db/getShareComments";

interface ShareCommentSectionOption { sectionKey: string; title: string }

export default function ShareComments({
  token,
  sections,
  initialThreads,
}: {
  token: string;
  sections: ShareCommentSectionOption[];
  initialThreads: ShareCommentThread[];
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [sectionKey, setSectionKey] = useState(sections[0]?.sectionKey ?? "");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "checking">("idle");
  const [message, setMessage] = useState("");

  function sectionTitle(key: string) {
    return sections.find((section) => section.sectionKey === key)?.title ?? key;
  }

  async function submit() {
    setState("loading");
    setMessage("");
    const response = await fetch(`/api/share/${token}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionKey, clientName: name, body }),
    });
    const result = (await response.json().catch(() => null)) as { error?: string; threads?: ShareCommentThread[] } | null;
    setState("idle");
    if (!response.ok || !result?.threads) {
      setMessage(result?.error ?? "Comment could not be sent.");
      return;
    }
    setThreads(result.threads);
    setBody("");
    setMessage("Comment sent.");
  }

  async function checkReplies() {
    setState("checking");
    setMessage("");
    const response = await fetch(`/api/share/${token}/comments`);
    const result = (await response.json().catch(() => null)) as { error?: string; threads?: ShareCommentThread[] } | null;
    setState("idle");
    if (!response.ok || !result?.threads) {
      setMessage(result?.error ?? "Replies could not be loaded.");
      return;
    }
    setThreads(result.threads);
  }

  if (sections.length === 0) return null;

  return (
    <section className="mx-auto my-8 w-[min(92%,720px)] rounded-3xl bg-white p-6 shadow-lg sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Questions</p>
      <h2 className="mt-2 text-2xl font-semibold text-stone-900">Comments</h2>
      <p className="mt-2 text-sm text-stone-600">Leave a comment on any section of this proposal and your travel advisor will reply here.</p>

      <div className="mt-5 space-y-3">
        <select aria-label="Section" value={sectionKey} onChange={(event) => setSectionKey(event.target.value)} className="h-12 w-full rounded-xl border border-stone-300 px-3 text-sm">
          {sections.map((section) => <option key={section.sectionKey} value={section.sectionKey}>{section.title}</option>)}
        </select>
        <input aria-label="Your name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="h-12 w-full rounded-xl border border-stone-300 px-3" />
        <textarea aria-label="Comment" value={body} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="Write a comment" className="w-full rounded-xl border border-stone-300 px-3 py-2.5" />
        {message ? <p className={`text-sm ${message === "Comment sent." ? "text-emerald-700" : "text-red-700"}`} role="status">{message}</p> : null}
        <button type="button" disabled={state === "loading" || !name.trim() || !body.trim()} onClick={() => void submit()} className="h-12 w-full rounded-xl bg-emerald-950 font-semibold text-white disabled:opacity-60">
          {state === "loading" ? "Sending…" : "Send comment"}
        </button>
      </div>

      {threads.length > 0 ? (
        <div className="mt-6 space-y-4 border-t border-stone-200 pt-5">
          {threads.map((thread) => (
            <div key={thread.id} className="rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{sectionTitle(thread.sectionKey)}</p>
              <div className="mt-2 space-y-2">
                {thread.comments.map((comment) => (
                  <div key={comment.id} className={`rounded-xl px-3 py-2 text-sm ${comment.authorType === "seller" ? "bg-emerald-50" : "bg-stone-100"}`}>
                    <p className="font-semibold text-stone-800">{comment.authorName}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-stone-700">{comment.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button type="button" disabled={state === "checking"} onClick={() => void checkReplies()} className="mt-4 text-sm font-semibold text-emerald-800">
        {state === "checking" ? "Checking…" : "Check for replies"}
      </button>
    </section>
  );
}
