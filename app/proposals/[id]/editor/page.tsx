import { notFound } from "next/navigation";

import { ProposalSectionView } from "@/components/ProposalRenderer";
import ProposalEditorShell from "@/components/editor/ProposalEditorShell";
import { getProposalDataSnapshot } from "@/lib/db/getProposalData";
import { getProposalCatalogData } from "@/lib/db/getProposalCatalogData";
import { getContentLibrary } from "@/lib/db/getContentLibrary";
import { getProposalActivity } from "@/lib/db/getProposalActivity";
import { getProposalCompositionData } from "@/lib/db/getProposalCompositionData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import { getProposalEditorData } from "@/lib/db/getProposalEditorData";
import { getProposalSummary } from "@/lib/db/getProposalSummary";
import { buildProposalPageMeta } from "@/lib/editor/proposalPageMeta";
import { findVariableIssues } from "@/lib/variables/catalog";

interface ProposalEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalEditorPage({ params }: ProposalEditorPageProps) {
  const { id } = await params;
  const proposalId = Number(id);

  if (!Number.isInteger(proposalId) || proposalId < 1) notFound();

  const summary = await getProposalSummary(proposalId);
  if (!summary) notFound();

  const snapshot = await getProposalDataSnapshot(proposalId);
  const data = snapshot.resolved;
  const designContext = await getProposalDesignContext(
    proposalId,
    data.sections.map((section) => section.type)
  );
  const pageMeta = buildProposalPageMeta(data.sections);
  const editorPages = await getProposalEditorData(proposalId, pageMeta, snapshot.raw.sections);
  const catalog = await getProposalCatalogData(proposalId);
  const library = await getContentLibrary();
  const composition = await getProposalCompositionData(proposalId);
  const activity = await getProposalActivity(proposalId);
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
      catalog={catalog}
      library={library}
      composition={composition}
      activity={activity}
      variableIssues={findVariableIssues(snapshot.raw, snapshot.variables, designContext.active.requiredVariablePaths)}
    />
  );
}
