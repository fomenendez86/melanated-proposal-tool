import { desc } from "drizzle-orm";

import AppShell from "@/components/admin/AdminShell";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminEmptyState } from "@/components/admin/ui/AdminUi";
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
          <AdminButton type="submit" variant="secondary">Mark all read</AdminButton>
        </form>
      )}
    >
      <div className="app-page max-w-4xl">
        {rows.length === 0 ? (
          <AdminEmptyState title="You’re all caught up" description="Proposal updates and client activity will appear here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm">
            {rows.map((row) => (
              <article
                key={row.id}
                className={`relative border-b border-gray-200 p-4 last:border-b-0 sm:p-5 ${row.readAt ? "" : "bg-brand-500/10"}`}
              >
                {!row.readAt ? <span className="absolute left-2 top-6 size-1.5 rounded-full bg-brand-500" aria-label="Unread" /> : null}
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{row.type.replace("_", " ")}</p>
                <h2 className="mt-1 text-sm font-semibold text-gray-800">{row.title}</h2>
                <p className="mt-1 text-sm leading-5 text-gray-500">{row.body}</p>
                <p className="mt-2 text-xs text-gray-400">{row.createdAt.toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
