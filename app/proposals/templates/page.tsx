import TemplateGallery from "@/components/dashboard/TemplateGallery";
import { getProposalListSummaries } from "@/lib/db/getProposalList";
import { getTemplateList } from "@/lib/db/getTemplateList";

export default async function TemplatesPage() {
  const [templates, proposalRows] = await Promise.all([getTemplateList(), getProposalListSummaries()]);
  const sourceProposals = proposalRows.map((row) => ({ id: row.id, title: row.title }));

  return <TemplateGallery templates={templates} sourceProposals={sourceProposals} />;
}
