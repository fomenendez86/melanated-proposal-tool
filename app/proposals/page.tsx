import ProposalDashboard from "@/components/dashboard/ProposalDashboard";
import { listClientOptions } from "@/lib/db/getClientOptions";
import { getProposalListSummaries } from "@/lib/db/getProposalList";
import { getTemplateList } from "@/lib/db/getTemplateList";
import { listSelectableDocumentDesigns } from "@/lib/designs/registry";
import { ensureExpiringShareNotifications } from "@/lib/notifications/service";
import { db } from "@/lib/db/client";
import { isNull, count } from "drizzle-orm";
import { proposalNotifications } from "@/lib/db/schema";

export default async function ProposalsPage() {
  await ensureExpiringShareNotifications();
  const [rows, clients, templates] = await Promise.all([
    getProposalListSummaries(),
    listClientOptions(),
    getTemplateList(),
  ]);
  const designs = listSelectableDocumentDesigns();
  const [unread] = await db.select({ value: count() }).from(proposalNotifications).where(isNull(proposalNotifications.readAt));

  return <ProposalDashboard rows={rows} clients={clients} designs={designs} templates={templates} unreadNotifications={unread.value} />;
}
