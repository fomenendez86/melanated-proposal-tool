import { notFound } from "next/navigation";

import { ProposalSectionView } from "@/components/ProposalRenderer";
import ProposalEditorShell from "@/components/editor/ProposalEditorShell";
import { getProposalData } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import { getProposalEditorData } from "@/lib/db/getProposalEditorData";
import { getProposalSummary } from "@/lib/db/getProposalSummary";
import { buildProposalPageMeta } from "@/lib/editor/proposalPageMeta";

interface ProposalEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalEditorPage({ params }: ProposalEditorPageProps) {
  const { id } = await params;
  const proposalId = Number(id);

  if (!Number.isInteger(proposalId) || proposalId < 1) notFound();

  const summary = await getProposalSummary(proposalId);
  if (!summary) notFound();

  const data = await getProposalData(proposalId);
  const designContext = await getProposalDesignContext(
    proposalId,
    data.sections.map((section) => section.type)
  );
  const pageMeta = buildProposalPageMeta(data.sections);
  const editorPages = await getProposalEditorData(proposalId, pageMeta, data.sections);
  const pages = data.sections.map((section, index) => (
    <ProposalSectionView key={`${section.type}-${index}`} section={section} />
  ));

  return (
    <ProposalEditorShell
      proposal={summary}
      pageMeta={pageMeta}
      pages={pages}
      editorPages={editorPages}
      designContext={designContext}
    />
  );
}
