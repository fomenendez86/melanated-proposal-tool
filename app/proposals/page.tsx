import ProposalDashboard from "@/components/dashboard/ProposalDashboard";
import { listClientOptions } from "@/lib/db/getClientOptions";
import { getProposalListSummaries } from "@/lib/db/getProposalList";
import { getTemplateList } from "@/lib/db/getTemplateList";
import { listDocumentDesigns } from "@/lib/designs/registry";

export default async function ProposalsPage() {
  const [rows, clients, templates] = await Promise.all([
    getProposalListSummaries(),
    listClientOptions(),
    getTemplateList(),
  ]);
  const designs = listDocumentDesigns();

  return <ProposalDashboard rows={rows} clients={clients} designs={designs} templates={templates} />;
}
