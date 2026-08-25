"use client";

import { Check, Eye, MessageSquare, RotateCcw, Send, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addInternalNote,
  replyToComment,
  setCommentThreadStatus,
  updateNotificationSettings,
} from "@/app/proposals/[id]/editor/activityActions";
import type { ProposalActivityData } from "@/lib/activity/types";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";

import { EditorButton, EditorEmptyState, EditorNotice, EditorPanelHeader, EditorSegmentedControl, editorFocusRing } from "./EditorUi";

type ActivityMode = "timeline" | "threads" | "notes" | "settings";

const controlClass = `h-11 w-full rounded-lg border border-editor-border bg-editor-raised px-3 text-sm text-editor-text outline-none transition placeholder:text-editor-text-subtle focus:border-editor-border-strong focus:ring-2 focus:ring-editor-border-strong/20 ${editorFocusRing}`;
const areaClass = `${controlClass} h-auto py-2.5`;

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ActivityPanel({
  proposalId,
  pageMeta,
  activity,
  onClose,
}: {
  proposalId: number;
  pageMeta: ProposalPageMeta[];
  activity: ProposalActivityData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ActivityMode>("timeline");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<number, { authorName: string; body: string }>>({});
  const [noteDraft, setNoteDraft] = useState({ sectionKey: pageMeta[0]?.id ?? "", body: "" });
  const [settingsDraft, setSettingsDraft] = useState(activity.notificationSettings);

  async function run(key: string, action: () => Promise<{ ok: boolean; formError?: string }>, success: string) {
    setPending(key);
    setError("");
    setNotice("");
    const result = await action();
    setPending("");
    if (!result.ok) {
      setError(result.formError ?? "This could not be saved.");
      return false;
    }
    setNotice(success);
    router.refresh();
    return true;
  }

  const openThreads = activity.threads.filter((thread) => thread.status === "open");
  const resolvedThreads = activity.threads.filter((thread) => thread.status === "resolved");

  return (
    <div className="flex h-full min-h-0 flex-col bg-editor-panel">
      <EditorPanelHeader icon={<MessageSquare className="size-4" />} label="Activity" onClose={onClose} closeLabel="Close activity" />
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-editor-border-subtle bg-editor-inset p-3 text-sm">
          <div><p className="text-xs text-editor-text-muted">Openings</p><p className="font-semibold text-editor-text-strong">{activity.summary.openings}</p></div>
          <div><p className="text-xs text-editor-text-muted">Total time viewed</p><p className="font-semibold text-editor-text-strong">{formatDuration(activity.summary.totalDurationMs)}</p></div>
          <div><p className="text-xs text-editor-text-muted">Most viewed</p><p className="truncate font-semibold text-editor-text-strong">{activity.summary.mostViewed ?? "—"}</p></div>
          <div><p className="text-xs text-editor-text-muted">Least viewed</p><p className="truncate font-semibold text-editor-text-strong">{activity.summary.leastViewed ?? "—"}</p></div>
        </div>

        <EditorSegmentedControl
          label="Activity view"
          value={mode}
          options={[
            { value: "timeline", label: "Timeline" },
            { value: "threads", label: `Threads${openThreads.length ? ` (${openThreads.length})` : ""}` },
            { value: "notes", label: "Notes" },
            { value: "settings", label: "Settings" },
          ]}
          onChange={(value) => { setMode(value); setError(""); setNotice(""); }}
          className="grid w-full grid-cols-2 [&>button]:w-full"
        />

        {error ? <EditorNotice tone="danger" className="px-3 py-2 text-xs">{error}</EditorNotice> : null}
        {notice ? <EditorNotice tone="success" className="px-3 py-2 text-xs">{notice}</EditorNotice> : null}

        {mode === "timeline" ? (
          activity.timeline.length === 0 ? (
            <EditorEmptyState compact icon={<Eye className="size-5" />} title="No activity yet" description="Events appear here once this proposal is shared and opened." />
          ) : (
            <ul className="space-y-2">
              {activity.timeline.map((event) => (
                <li key={event.id} className="rounded-xl border border-editor-border-subtle bg-editor-raised p-3 text-sm">
                  <p className="font-semibold capitalize text-editor-text">{event.type.replaceAll("_", " ")}</p>
                  <p className="mt-0.5 text-xs text-editor-text-muted">{event.detail}</p>
                  <p className="mt-1 text-[11px] text-editor-text-subtle">{formatDate(event.createdAt)}</p>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {mode === "threads" ? (
          activity.threads.length === 0 ? (
            <EditorEmptyState compact icon={<MessageSquare className="size-5" />} title="No comment threads" description="Client comments left on the share appear here." />
          ) : (
            <div className="space-y-4">
              {[...openThreads, ...resolvedThreads].map((thread) => {
                const draft = replyDrafts[thread.id] ?? { authorName: "", body: "" };
                return (
                  <article key={thread.id} className="rounded-xl border border-editor-border-subtle bg-editor-raised p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-editor-text">{thread.clientName}</p>
                        <p className="font-mono text-[10px] text-editor-text-muted">{thread.sectionKey}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {thread.orphaned ? <EditorNotice tone="warning" className="px-2 py-1 text-[10px]">Section removed</EditorNotice> : null}
                      </div>
                    </div>
                    <div className="mt-2 space-y-2">
                      {thread.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg bg-editor-inset px-3 py-2 text-xs">
                          <p className="font-semibold text-editor-text">{comment.authorName} <span className="font-normal text-editor-text-muted">· {comment.authorType}</span></p>
                          <p className="mt-1 whitespace-pre-wrap text-editor-text-muted">{comment.body}</p>
                          <p className="mt-1 text-[10px] text-editor-text-subtle">{formatDate(comment.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                    {thread.status === "open" ? (
                      <div className="mt-3 space-y-2">
                        <input aria-label="Your name" value={draft.authorName} onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: { ...draft, authorName: event.target.value } }))} className={controlClass} placeholder="Your name" />
                        <textarea aria-label="Reply" value={draft.body} onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: { ...draft, body: event.target.value } }))} className={areaClass} rows={2} placeholder="Write a reply" />
                        <div className="flex gap-2">
                          <EditorButton type="button" variant="primary" size="sm" className="flex-1" disabled={pending === `reply-${thread.id}`} onClick={async () => {
                            if (await run(`reply-${thread.id}`, () => replyToComment(proposalId, thread.id, draft.authorName, draft.body), "Reply sent.")) setReplyDrafts((current) => ({ ...current, [thread.id]: { authorName: "", body: "" } }));
                          }}><Send className="size-4" /> Reply</EditorButton>
                          <EditorButton type="button" variant="secondary" size="sm" disabled={pending === `resolve-${thread.id}`} onClick={() => void run(`resolve-${thread.id}`, () => setCommentThreadStatus(proposalId, thread.id, "resolved"), "Thread resolved.")}><Check className="size-4" /> Resolve</EditorButton>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <EditorButton type="button" variant="ghost" size="sm" disabled={pending === `reopen-${thread.id}`} onClick={() => void run(`reopen-${thread.id}`, () => setCommentThreadStatus(proposalId, thread.id, "open"), "Thread reopened.")}><RotateCcw className="size-4" /> Reopen</EditorButton>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )
        ) : null}

        {mode === "notes" ? (
          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-editor-border-subtle bg-editor-inset p-3">
              <h3 className="text-sm font-semibold text-editor-text">New internal note</h3>
              <select aria-label="Section" value={noteDraft.sectionKey} onChange={(event) => setNoteDraft((current) => ({ ...current, sectionKey: event.target.value }))} className={controlClass}>
                {pageMeta.map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}
              </select>
              <textarea aria-label="Note" value={noteDraft.body} onChange={(event) => setNoteDraft((current) => ({ ...current, body: event.target.value }))} className={areaClass} rows={3} placeholder="Never visible to the client" />
              <EditorButton type="button" variant="primary" className="w-full" disabled={pending === "note-create"} onClick={async () => {
                if (await run("note-create", () => addInternalNote(proposalId, noteDraft.sectionKey, noteDraft.body), "Note saved.")) setNoteDraft((current) => ({ ...current, body: "" }));
              }}><StickyNote className="size-4" /> Save note</EditorButton>
            </div>
            {activity.notes.length === 0 ? (
              <EditorEmptyState compact icon={<StickyNote className="size-5" />} title="No internal notes" description="Notes are only visible in this editor — never in the PDF or share." />
            ) : (
              <ul className="space-y-2">
                {activity.notes.map((note) => (
                  <li key={note.id} className="rounded-xl border border-editor-border-subtle bg-editor-raised p-3 text-sm">
                    <p className="font-mono text-[10px] text-editor-text-muted">{note.sectionKey}</p>
                    <p className="mt-1 whitespace-pre-wrap text-editor-text">{note.body}</p>
                    <p className="mt-1 text-[11px] text-editor-text-subtle">{formatDate(note.updatedAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {mode === "settings" ? (
          <div className="space-y-2 rounded-xl border border-editor-border-subtle bg-editor-inset p-3">
            <h3 className="text-sm font-semibold text-editor-text">Notification settings</h3>
            <input aria-label="Notification email" type="email" value={settingsDraft.recipientEmail} onChange={(event) => setSettingsDraft((current) => ({ ...current, recipientEmail: event.target.value }))} className={controlClass} placeholder="you@example.com" />
            <label className="flex items-center gap-2 text-sm text-editor-text"><input type="checkbox" checked={settingsDraft.firstOpenEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, firstOpenEnabled: event.target.checked }))} className="size-4 accent-editor-brand" /> First open</label>
            <label className="flex items-center gap-2 text-sm text-editor-text"><input type="checkbox" checked={settingsDraft.signatureEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, signatureEnabled: event.target.checked }))} className="size-4 accent-editor-brand" /> Signature</label>
            <label className="flex items-center gap-2 text-sm text-editor-text"><input type="checkbox" checked={settingsDraft.expiryEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, expiryEnabled: event.target.checked }))} className="size-4 accent-editor-brand" /> Expiring soon</label>
            <EditorButton type="button" variant="primary" className="w-full" disabled={pending === "settings-save"} onClick={() => void run("settings-save", () => updateNotificationSettings(proposalId, settingsDraft), "Notification settings saved.")}><Check className="size-4" /> Save settings</EditorButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
