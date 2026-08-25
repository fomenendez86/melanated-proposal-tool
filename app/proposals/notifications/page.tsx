import { desc } from "drizzle-orm";
import Link from "next/link";

import { markAllNotificationsRead } from "./actions";
import { db } from "@/lib/db/client";
import { proposalNotifications } from "@/lib/db/schema";

export default async function NotificationsPage() {
  const rows = await db.select().from(proposalNotifications).orderBy(desc(proposalNotifications.createdAt)).limit(200);
  return <main className="mx-auto min-h-dvh max-w-3xl bg-editor-shell p-6 text-editor-text"><div className="flex items-center justify-between"><div><Link href="/proposals" className="text-sm font-semibold text-editor-brand">← Proposals</Link><h1 className="mt-3 text-2xl font-semibold">Notifications</h1></div><form action={markAllNotificationsRead}><button className="rounded-xl border border-editor-border bg-editor-raised px-4 py-2 text-sm font-semibold">Mark all read</button></form></div><div className="mt-6 space-y-3">{rows.map((row) => <article key={row.id} className={`rounded-xl border p-4 ${row.readAt ? "border-editor-border-subtle bg-editor-panel" : "border-editor-brand bg-editor-raised"}`}><p className="text-xs font-bold uppercase tracking-widest text-editor-text-muted">{row.type.replace("_", " ")}</p><h2 className="mt-1 font-semibold">{row.title}</h2><p className="mt-1 text-sm text-editor-text-muted">{row.body}</p><p className="mt-2 text-xs text-editor-text-subtle">{row.createdAt.toLocaleString()}</p></article>)}</div></main>;
}
