import ProposalDashboard from "@/components/dashboard/ProposalDashboard";
import { listClientOptions } from "@/lib/db/getClientOptions";
import { getProposalListSummaries } from "@/lib/db/getProposalList";
import { listDocumentDesigns } from "@/lib/designs/registry";

export default async function ProposalsPage() {
  const [rows, clients] = await Promise.all([getProposalListSummaries(), listClientOptions()]);
  const designs = listDocumentDesigns();

  return <ProposalDashboard rows={rows} clients={clients} designs={designs} />;
}
