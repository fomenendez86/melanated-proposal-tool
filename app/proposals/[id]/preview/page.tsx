import { notFound } from "next/navigation";

import ProposalRenderer from "@/components/ProposalRenderer";
import { getProposalData } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import { getProposalSummary } from "@/lib/db/getProposalSummary";

interface ProposalPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalPreviewPage({ params }: ProposalPreviewPageProps) {
  const { id } = await params;
  const proposalId = Number(id);

  if (!Number.isInteger(proposalId) || proposalId < 1) notFound();

  const summary = await getProposalSummary(proposalId);
  if (!summary) notFound();

  const data = await getProposalData(proposalId);
  const designContext = await getProposalDesignContext(proposalId, data.sections.map((section) => section.type));

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-200 print:bg-white">
      <ProposalRenderer data={data} design={designContext.active} />
    </main>
  );
}
