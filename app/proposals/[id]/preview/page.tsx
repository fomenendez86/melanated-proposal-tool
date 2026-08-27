import { notFound } from "next/navigation";
import Link from "next/link";

import AppShell from "@/components/admin/AdminShell";
import { editorButtonStyles } from "@/components/editor/EditorUi";
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
    <AppShell
      active="editor"
      proposalId={proposalId}
      title={summary.title}
      subtitle={`${summary.proposalNumber} · Client preview`}
      backHref={`/proposals/${proposalId}/editor`}
      headerActions={(
        <Link href={`/proposals/${proposalId}/editor`} prefetch={false} className={editorButtonStyles({ variant: "primary" })}>
          Back to editor
        </Link>
      )}
    >
      <div className="flex min-h-full flex-col items-center gap-6 bg-editor-canvas p-4 sm:p-8 print:bg-white print:p-0">
        <ProposalRenderer data={data} design={designContext.active} />
      </div>
    </AppShell>
  );
}
