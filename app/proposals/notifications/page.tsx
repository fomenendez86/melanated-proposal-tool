import { desc } from "drizzle-orm";

import AppShell from "@/components/admin/AdminShell";
import { EditorButton, EditorEmptyState } from "@/components/editor/EditorUi";
import { db } from "@/lib/db/client";
import { proposalNotifications } from "@/lib/db/schema";

import { markAllNotificationsRead } from "./actions";

export default async function NotificationsPage() {
  const rows = await db.select().from(proposalNotifications).orderBy(desc(proposalNotifications.createdAt)).limit(200);

  return (
    <AppShell
      active="notifications"
      title="Notifications"
      subtitle={`${rows.filter((row) => !row.readAt).length} unread`}
      backHref="/proposals"
      headerActions={(
        <form action={markAllNotificationsRead}>
          <EditorButton type="submit" variant="secondary">Mark all read</EditorButton>
        </form>
      )}
    >
      <div className="app-page max-w-4xl">
        {rows.length === 0 ? (
          <EditorEmptyState title="You’re all caught up" description="Proposal updates and client activity will appear here." />
        ) : (
          <div className="overflow-hidden rounded-editor-lg border border-editor-border-subtle bg-editor-raised shadow-editor-card">
            {rows.map((row) => (
              <article
                key={row.id}
                className={`relative border-b border-editor-border-subtle p-4 last:border-b-0 sm:p-5 ${row.readAt ? "" : "bg-editor-brand/10"}`}
              >
                {!row.readAt ? <span className="absolute left-2 top-6 size-1.5 rounded-full bg-editor-brand" aria-label="Unread" /> : null}
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-editor-text-muted">{row.type.replace("_", " ")}</p>
                <h2 className="mt-1 text-sm font-semibold text-editor-text-strong">{row.title}</h2>
                <p className="mt-1 text-sm leading-5 text-editor-text-muted">{row.body}</p>
                <p className="mt-2 text-xs text-editor-text-subtle">{row.createdAt.toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
